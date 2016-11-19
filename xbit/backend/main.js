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
var redis = require("lib/redis");

var logger = xBitLogger.createLogger({module: 'main'});

/**
 * TODO: we are hard-coding mobile-tracking app, we shall have application management logic to load the topics correctly
 * @type {string}
 */
topic = "data-mobile-tracking";  // Let's make topic as "data-" + <appName>

class Server {
    constructor() {
        this.kafkaClient = null;
        this.consumer = null;
        this.kafkaOffset = null;
        this.topics = [];
    }

    /**
     * Start the server
     */
    start(config) {
        // 1. offset manager to recover offset errors
        logger.info("Create KAFKA client with connection string %s", config.connectString);
        this.kafkaClient = new kafka.Client(config.connectString || '127.0.0.1:2181/');
        this.kafkaOffset = new kafka.Offset(this.kafkaClient);
        var server = this;
        redis.get(topic, function (err, value) {
           if (err) {
               logger.error("Fail to get the offset from redis - " + err);
           }
           else {
               var offset = 0;
               if (value) {
                   logger.info("Get the offset - " + value);
                   offset = parseInt(value);
               }
               //2. create topics
               server.topics = [{
                   topic : topic,
                   offset: offset                       // TODO recover offset from MongoDB or Redis
               }];

               logger.info("Loaded KAFKA %d topics", server.topics.length);
               server.topics.forEach(function(topic) {
                   logger.info("Found topic %s with offset %d", topic.topic, topic.offset);
               });

               // 3. create the consumer
               server.consumer = new kafka.Consumer(server.kafkaClient, server.topics, {
                   groupId: config.groupId,
                   autoCommit: false,
                   fetchMaxWaitMs: 1000,
                   fetchMaxBytes: 1024 * 1024,
                   fromOffset: true
               });

               logger.info("Created KAFKA consumers with groupId %s", config.groupId);

               // 4. roll the consumer by setting up the listeners
               server.consumer.on("message", server._handleMessage.bind(this));
               server.consumer.on("error", server._handleError.bind(this));
               server.consumer.on("offsetOutOfRange", server._handleOffsetOutOfRange.bind(this));

           }
        });

    }

    _handleMessage(message) {
        // message should be a JSON object that need be put to ES
        /**
         * message format:
         * {
         *   "topic": "data-mobile-tracking",
         *   "offset": 0,
         *   "partition": 0,
         *   "value": {
         *        "key": "deviceKey",
         *        "@timestamp": xxxx,
         *        "location": {
         *           "lat": xxx,
         *           "lon": xxx,
         *           "xxx": xxx",
         *        }
         *   }
         * }
         */
        let data = eval("(" + message.value + ")");
        let timestamp = data['@timestamp'];

        logger.info("Indexing sample with timestamp %d: %s", timestamp, message.value);

        var doc = {
            key: data.key,
            '@timestamp': timestamp,
            'location': data.location
        };
        // TODO compose the doc according to the ES mapping
        ESClient.index({
            index: "xbit",
            type: "geoData",
            body: doc
        });
        redis.incr(topic, function (err, response) {
            if (err) {
                logger.error("Fail to set the topic %s offset to redis", topic);
            }
            else {
                logger.info("Set the offset of topic %s to redis", topic);
            }
        })
    }

    _handleError(err) {
        logger.error("Error encountered - %s:\n%s", err.message, err.stack);
    }

    _handleOffsetOutOfRange(topic) {
        topic.maxNum = 2;

        let that = this;
        this.kafkaOffset.fetch([topic], function (err, offsets) {
            if (err) {
                return console.error(err);
            }
            var min = Math.min(offsets[topic.topic][topic.partition]);

            logger.info("Reset offset of topic %s to %d", topic.topic, min);
            that.consumer.setOffset(topic.topic, topic.partition, min);
        })
    }

    // _indexData(timestamp, key, location) {
    //     var doc = {
    //         key: key,
    //         '@timestamp': timestamp,
    //         'location': location
    //     };
    //
    //     // TODO compose the doc according to the ES mapping
    //     return ESClient.index({
    //         index: "xbit",
    //         type: "geoData",
    //         body: doc
    //     });
    // }
}

exports = module.exports = new Server();