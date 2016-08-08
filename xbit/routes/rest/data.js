var bunyan = require('bunyan');
var express = require('express');
var router = express.Router();
var logger = bunyan.createLogger({name: "data"});
var ESClient = require("lib/esclient");

// fix me: debugging mode
logger.level("debug");

// expose API to mobile client for now
/**
POST
https://hostname/rest/data/<key>
{
   "status": 200,
   "message": "OK",
   "data":
   [
       {
           "timestamp": xxxx,
           "metrics": [{
                "name": "metric1", "value": 123
            }, ...,  {
                "name": "metricN", "value": 789
            }]
       }
   ]
}
*;

/**
 * Try save metrics reported at given timestamp to ES
 *
 * @return a promise representing the indexing operation
 */
var indexData = function(timestamp, key, metrics) {
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
};

router.get("/:key", function (req, res) {
    var deviceKey = req.params.key;
    logger.debug("Get the data of device %s", deviceKey);
    // TODO Device Verification
    if(deviceKey !== "test" && deviceKey !== "mobile-tracking") {
        return res.json({
            status: 403,
            message: "Unknown device"
        });
    }

    ESClient.search({
        index:'xbit',
        type:'geoData',
        q: "key:" + deviceKey,
        sort: "@timestamp:desc"
    }, function (error, response) {
        if (error) {
            logger.error("Fail to get the result - " + error);
            return res.json(
                {
                    status: 502,
                    message: "Internal error"
                }
            )
        }
        else {
            logger.debug("Get the response - " + JSON.stringify(response));
            /**
             * {
    "took": 4,
    "timed_out": false,
    "_shards": {
      "total": 5,
      "successful": 5,
      "failed": 0
    },
    "hits": {
      "total": 2,
      "max_score": 1,
      "hits": [
        {
          "_index": "xbit",
          "_type": "geoData",
          "_id": "1",
          "_score": 1,
          "_source": {
            "key": "testKey",
            "@timestamp": 1470154737000,
            "location": {
              "lat": 1,
              "lon": 1,
              "speed": 1
            }
          }
        },
        {
          "_index": "xbit",
          "_type": "geoData",
          "_id": "AVZME0JoMHm2K7X8EcY2",
          "_score": 0.30685282,
          "_source": {
            "key": "testKey",
            "@timestamp": 1470154737000,
            "location": {
              "lat": 1,
              "lon": 1,
              "speed": 1
            }
          }
        }
      ]
    }
  }
             */
            var result = [];
            if (response.hits.total > 0) {
                var array = response.hits.hits;
                for (var i = 0; i < array.length; i++) {
                    var doc = {
                        id: array[i]._id,
                        timestamp: array[i]._source['@timestamp'],
                        location: array[i]._source['location']
                    };
                    result.push(doc);
                }
            }
            return res.json(
                {
                    status: 200,
                    message: "OK",
                    data: result
                }
            );
        }
    });

});

router.post("/:key", function(req, res) {
    var deviceKey = req.params.key;
    logger.debug("Handling data reporting from device %s", deviceKey);

    // TODO Device Verification
    if(deviceKey !== "test" && deviceKey !== "mobile-tracking") {
        return res.json({
            status: 403,
            message: "Unknown device"
        });
    }

    logger.debug("Try processing reported data:\n%s", JSON.stringify(req.body));
    
    if(req.body.status != 200) {
        logger.error("Receive non 200 status code %d: %s", req.body.status, req.body.message);
        return res.json({
            status: 200,
            message: "OK"
        });
    }

    // OK, we have data to handle
    var data = req.body.data;
    if(data.length === 0) {
        // TODO: heart beat handling?
        logger.debug("No metrics reported. Take as heartbeat");
        return res.json({
            status: 200,
            message: "OK"
        });
    }

    logger.debug("Receive data with %d samples", data.length);

    for (var i = 0; i < data.length; i++) {
        indexData(data[i].timestamp, deviceKey, data[i].metrics);
    }

    return res.json(
        {
            status: 200,
            message: 'OK'
        }
    );
});

module.exports = router;
