var bunyan = require('bunyan');
var express = require('express');
var router = express.Router();
var logger = bunyan.createLogger({name: "data"});
var ESClient = require("lib/esclient");
var passport = require('passport');
var User = require('models/user');

// fix me: debugging mode
// logger.level("debug");

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
    if (!req.user) {
        res.render("login");
        return;
    }
    var deviceKey = req.params.key;
    logger.debug("Get the data of device %s", deviceKey);
    // TODO Device Verification
    // if(deviceKey !== "test" && deviceKey !== "mobile-tracking") {
    //     return res.json({
    //         status: 403,
    //         message: "Unknown device"
    //     });
    // }

    var from = req.param('from');
    var to = req.param('to');
    var aggs = req.param('aggs');

    //Aggregation
    if (from && to && aggs) {
        ESClient.search(
          {
              index: 'xbit',
              type: 'geoData',
              //q: "key:" + deviceKey,
              body: {
                  size: 0,
                  query: {
                      range: {
                          "@timestamp": {
                              gte: from,
                              lte: to
                          }
                      }
                  },
                  aggs: {
                      "result": {
                          "date_histogram": {
                              "field": "@timestamp",
                              "interval": aggs + "m",
                              "min_doc_count": 1
                          },
                          "aggs": {
                              "location": {
                                  "terms": {
                                      "field": "@timestamp",
                                      "size": 1,
                                      "order": {
                                          "_term": "asc"
                                      }
                                  },
                                  "aggs": {
                                      "lat": {
                                          "max": {
                                              "field": "location.latitude"
                                          }
                                      },
                                      "lon": {
                                          "max": {
                                              "field": "location.longitude"
                                          }
                                      },
                                      "alt": {
                                          "max": {
                                              "field": "location.altitude"
                                          }
                                      },
                                      "acc": {
                                          "max": {
                                              "field": "location.accuracy"
                                          }
                                      }
                                  }
                              }
                          }
                      }
                  }
              }
          },
          function (error, response) {
              if (error) {
                  logger.error(error);
                  return res.json(
                    {
                        status: 502,
                        message: "Fail to get the result - " + error
                    }
                  )
              }
              else {
                  /**
                   * {
    "took": 65,
    "timed_out": false,
    "_shards": {
      "total": 5,
      "successful": 5,
      "failed": 0
    },
    "hits": {
      "total": 62854,
      "max_score": 0,
      "hits": []
    },
    "aggregations": {
      "result": {
        "buckets": [
          {
            "key_as_string": "2016-08-02T16:18:00.000Z",
            "key": 1470154680000,
            "doc_count": 2,
            "location": {
              "doc_count_error_upper_bound": 0,
              "sum_other_doc_count": 1,
              "buckets": [
                {
                  "key": 1470154737000,
                  "key_as_string": "2016-08-02T16:18:57.000Z",
                  "doc_count": 1,
                  "lat": {
                    "value": 40
                  }
                }
              ]
            }
          },
          {
            "key_as_string": "2016-08-08T04:54:00.000Z",
            "key": 1470632040000,
            "doc_count": 2,
            "location": {
              "doc_count_error_upper_bound": 0,
              "sum_other_doc_count": 1,
              "buckets": [
                {
                  "key": 1470632154145,
                  "key_as_string": "2016-08-08T04:55:54.145Z",
                  "doc_count": 1,
                  "lat": {
                    "value": 30.676941
                  }
                }
              ]
            }
          },
                   */
                  logger.debug("Get the response - " + JSON.stringify(response));
                  var result = [];
                  if (response.hits.total > 0) {
                      var array = response.aggregations.result.buckets;
                      for (var i = 0; i < array.length; i++) {
                          var location = {};
                          var agg = array[i];
                          location['latitude'] = agg.location.buckets[0].lat.value;
                          location['longitude'] = agg.location.buckets[0].lon.value;
                          location['altitude'] = agg.location.buckets[0].alt.value;
                          location['accuracy'] = agg.location.buckets[0].acc.value;

                          var doc = {
                              timestamp: agg['key'],
                              location: location
                          };
                          result.push(doc);
                      }
                  }
                  return res.json(
                    {
                        status: 200,
                        message: "OK",
                        data: result,
                        total: response.hits.total
                    }
                  );

              }
          }
        );
    }
    else {
        ESClient.search({
            index: 'xbit',
            type: 'geoData',
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
    }

});

router.post("/:key", function(req, res) {

    // TODO: Should check the authentication
    // if (!req.user) {
    //     res.render("login");
    //     return;
    // }
    var deviceKey = req.params.key;
    logger.debug("Handling data reporting from device %s", deviceKey);

    User.findOne({"userKeys.key": deviceKey}, function(err, user) {
        if (err) {
            logger.error("Cannot locate APP for key %s - %s:\n%s", deviceKey, err.message, err.stack);
            return res.status(500).send("Internal error");
        }

        if (!user) {
            logger.error("Cannot find APP with key %s", deviceKey);
            return res.status(404).send("User APP not found");
        }

        var app = undefined;
        for(var idx = 0; idx < user.userKeys.length; idx ++) {
            console.log("Try checking APP", deviceKey, idx, user.userKeys[idx]);
            if(user.userKeys[idx].key === deviceKey) {
                app = user.userKeys[idx];
                break;
            }
        }

        if(!app || app.key !== deviceKey) {
            console.log("App invalid", deviceKey, app);
            return res.status(403).send("APP invalid");
        }

        if(!app.connected) {
            console.log("App not connected", deviceKey, app);
            return res.status(401).send("APP not connected");
        }

        app.lastReportedOn = Date.now();

        // save, without care the result
        user.save();

        // OK, let's take this APP as valid
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
});

module.exports = router;
