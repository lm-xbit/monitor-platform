var Q = require("q");
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
}

router.post("/:key", function(req, res, next) {
    var deviceKey = req.params.key;
    logger.debug("Handling data reporting from device %s", deviceKey);

    // TODO Device Verification
    if(deviceKey !== "test") {
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

    var dataJson = JSON.parse(data);

    for (var i = 0; i < dataJson.length; i++) {
        indexData(dataJson[i].timestamp, deviceKey, dataJson[i].metrics);
    }

    return res.json(
        {
            status: 200,
            message: 'OK'
        }
    );
    /*
    
    var promises = [];
    data.forEach(function(sample) {
        logger.debug("Save sample with timestamp %d and metrics:\n%s", sample.timestamp, JSON.stringify(sample.metrics));
        // TODO: save data to ES?
        var promise;
        // promise = "save data ..."
        promise = Q.reject(new Error("Not implemented"));
        promises.push(promise);
    });

    Q.all(promises).then(function() {
        logger.debug("All samples have been saved successfully");
        return res.json({
            status: 200,
            message: "OK"
        });
    }).fail(function(err) {
        logger.error("Cannot save all or  some of the samples due to %s:\n%s", err.message, err.stack);
        return res.json({
            status: 500,
            message: err.message || "Server failure"
        });
    });
    */
});

module.exports = router;
