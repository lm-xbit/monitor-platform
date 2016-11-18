/**
 * A simple HTTP server for status querying / monitoring, etc.
 */
var express = require('express');
var xBitLogger = require('xBitLogger');
var logger = xBitLogger.createLogger();

var app = express();

// uncomment after placing your favicon in /public
app.use('/', require('routes/index'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    // var err = new Error('Not Found - ' + req.method + ' ' + req.url);
    // err.status = 404;
    // next(err);
    logger.error("Got unexpected request: " + req.method + " " + req.url + " from " + request.connection.remoteAddress);
    res.status(401).send("Forbidden");
});

module.exports = app;
