/**
 * Created by robin on 11/13/16.
 */

var redis = require("redis");
var config = require("../../config");

var host = config.redis.host || "127.0.0.1";
var port = config.redis.port || 6379;

var client = redis.createClient(port, host);

client.on("error", function (err) {
  console.log("Fail to connect to redis - " + err);
});

exports = module.exports = client;
