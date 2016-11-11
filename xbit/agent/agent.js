require('app-module-path').addPath(__dirname);
require('app-module-path').addPath(__dirname + "/../common");

var express = require('express');
var bodyParser = require('body-parser');
var xBitLogger = require('../common/xBitLogger');
var logger = xBitLogger.createLogger();

var routes = require("./routers");

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  logger.error("Got unexpected request: " + req.method + " " + req.url, new Error().stack);
  res.status(401).send("Forbidden");
});

app.use(function(err, req, res, next) {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;
