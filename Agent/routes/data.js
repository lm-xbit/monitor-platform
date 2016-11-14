var bunyan = require('bunyan');
var express = require('express');
var producer = require("../lib/kafka");

var router = express.Router();

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
    var message= {
        topic: "data",
        messages:JSON.stringify(doc)
    } ;

    console.log("Messages: " + JSON.stringify(message));
    return producer.send([message], function (err, result) {
        console.log(err || result);
    });
};

router.post("/:key", function(req, res) {

    // TODO: Should check the authentication
    // if (!req.user) {
    //     res.render("login");
    //     return;
    // }
    var deviceKey = req.params.key;
    var data = req.body.data;
    //logger.debug("Handling data reporting from device %s", deviceKey);
    for (var i = 0; i < data.length; i++) {
        if (data[i].metrics.length == 0) {
            continue;
        }
        indexData(data[i].timestamp, deviceKey, data[i].metrics);
    }

    return res.json({
        status: 200,
        message: 'OK'
    });
});

module.exports = router;
