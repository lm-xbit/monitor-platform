/**
 * Main entrance point
 *
 * TODO: introducing stream processing framework ...
 *
 * Currently, it move data from Kafka and save data to ES
 */
var kafka = require('kafka-node') ;
var ESClient = require("lib/esclient");
var xBitLogger = require("xBitLogger");

var logger = xBitLogger.createLogger({module: 'main'});

class Server {
    constructor() {
        this.kafkaClient = null;
        this.consumer = null;
        this.offset = null;
        this.topics = [];
    }

    /**
     * Start the server
     */
    start(config) {
        // 1. offset manager to recover offset errors
        logger.info("Create KAFKA client with connection string %s", config.connectString);
        this.kafkaClient = new kafka.Client(config.connectString || '127.0.0.1:2181/');
        this.offset = new kafka.Offset(this.kafkaClient);

        //2. create topics
        this.topics = [{
            topic: "data-mobile-tracking",  // Let's make topic as "data-" + <appName>
            offset: 0                       // TODO recover offset from MongoDB or Redis
        }];

        logger.info("Loadded KAFKA %d topics", this.topics.length);
        this.topics.forEach(function(topic) {
            logger.info("Found topic %s with offset %d", topic.topic, topic.offset);
        });

        // 3. create the consumer
        this.consumer = new kafka.Consumer(this.kafkaClient, this.topics, {
            groupId: config.groupId,
            autoCommit: false,
            fetchMaxWaitMs: 1000,
            fetchMaxBytes: 1024 * 1024
        });

        logger.info("Created KAFKA consumers with groupId %s", config.groupId);

        // 4. roll the consumer by setting up the listeners
        this.consumer.on("message", this._handleMessage.bind(this));
        this.consumer.on("error", this._handleError.bind(this));
        this.consumer.on("offsetOutOfRange", this._handleOffsetOutOfRange.bind(this));
    }

    _handleMessage(message) {
        // message should be a JSON object that need be put to ES
        let data = message.data;
        let deviceKey = message.key;
        let that = this;

        data.forEach(function(sample) {
            if (sample.metrics.length == 0) {
                logger.warn("Ingore sample with timestamp %d", sample.timestamp);
            }
            else {
                logger.debug("Indexing sample with timestamp %d: %s", sample.timestamp, JSON.stringify(sample.metrics));
                that._indexData(sample.timestamp, deviceKey, sample.metrics);
            }
        });
    }

    _handleError(err) {
        logger.error("Error encountered - %s:\n%s", err.message, err.stack);
    }

    _handleOffsetOutOfRange(topic) {
        topic.maxNum = 2;

        let that = this;
        this.offset.fetch([topic], function (err, offsets) {
            if (err) {
                return console.error(err);
            }
            var min = Math.min(offsets[topic.topic][topic.partition]);

            logger.info("Reset offset of topic %s to %d", topic.topic, min);
            that.consumer.setOffset(topic.topic, topic.partition, min);
        })
    }

    _indexData(timestamp, key, metrics) {
        var location = {};
        for (var i = 0; i < metrics.length; i++) {
            location[metrics[i].name] = metrics[i].value;
        }
        var doc = {
            key: key,
            '@timestamp': timestamp,
            'location': location
        };

        // TODO compose the doc according to the ES mapping
        return ESClient.index({
            index: "xbit",
            type: "geoData",
            body: doc
        });
    }
}

exports = module.exports = new Server();