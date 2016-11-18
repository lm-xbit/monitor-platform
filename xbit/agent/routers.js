/**
 * Created by robin on 11/12/16.
 */

var express = require('express');
var router = express.Router();
var config = require("xbitConfig");

var xBitLogger = require('xBitLogger');
var logger = xBitLogger.createLogger({module: 'data'});
var kafka = require('kafka-node') ;
var redis = require('lib/redis');
var Producer = kafka.Producer;
var Client = kafka.Client;
var client = new Client(config.zookeeper.host + ":" + config.zookeeper.port);

var producer = new Producer(client, { requireAcks: 1 });

// expose API to mobile client for now
/**
 *
 * POST
 * https://hostname/data/<type>/<key>
 * {
 *    "status": 200,
 *    "message": "OK",
 *    "data":
 *    [
 *       {
 *           "timestamp": xxxx,
 *           "metrics": [{
 *                "name": "metric1", "value": 123
 *            }, ...,  {
 *                "name": "metricN", "value": 789
 *            }]
 *       }
 *    ]
 * }
 *
 * ie:
 * POST http://xbit:8081/data/mobileTracking/<key>
 * {
 *     "status": 200,
 *     "message": "OK",
 *     "data":
 *     [
 *         {
  *             "timestamp": 1470154737000,
  *             "metrics": [
  *                 {
  *                     "name": "lat",
  *                     "value": 1
  *                 },
  *                 {
  *                     "name": "lon",
  *                     "value": 5
  *                 },
  *                 {
  *                     "name": "speed",
  *                     "value": 8
  *                 }
  *             ]
  *         }
  *     ]
  * }
 */
router.post("/data/:app/:key", function(req, res) {

  // TODO: Should check the authentication
  // if (!req.user) {
  //     res.render("login");
  //     return;
  // }
  var app = req.params.app;
  var deviceKey = req.params.key;
  logger.debug("Handling data reporting for app %s from device %s", app, deviceKey);

  if(req.body.status != 200) {
    logger.error("Receive non 200 status code %d: %s", req.body.status, req.body.message);
    return res.json({
      status: 200,
      message: "OK"
    });
  }

  //check if valid request
  redis.sismember(app, deviceKey, function (err, reply) {
    if (err) {
      logger.error("Fail to check if the app %s exist - %s", app, err);
      return res.json(
        {
          status: 500,
          errMsg: err
        }
      );
    }
    else {
      if (reply != 1) {
        logger.info("The key %s is not exist of app %s", key, app);
        return res.json(
          {
            status: 403,
            errMsg: key + " Not exist"
          }
        )
      }
      else {
        // OK, let's take this APP as valid
        logger.debug("Try processing reported data:\n%s", JSON.stringify(req.body.data));

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
          if (data[i].metrics.length == 0) {
            continue;
          }

          indexData(app, data[i].timestamp, deviceKey, data[i].metrics);
        }

        return res.json({
          status: 200,
          message: 'OK'
        });
      }
    }
  });


});


 /**
 * Try save metrics reported at given timestamp to ES
 *
 * @return a promise representing the indexing operation
 */
var indexData = function(app, timestamp, key, metrics) {
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
    topic: "data-" + app,
    messages:JSON.stringify(doc)
  } ;

  console.log("Messages: " + JSON.stringify(message));
  return producer.send([message], function (err, result) {
    console.log(err || result);
  });
};

module.exports = router;