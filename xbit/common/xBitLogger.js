var config = require('xbitConfig');
var bunyan = require('bunyan');

var streams = [{stream: process.stdout}];
config.logFilePath && streams.push({path: config.logFilePath});

var logger = bunyan.createLogger({
    name: 'xbitApp',
    streams
});

module.exports = {
    createLogger (options = {}) {
        return logger.child({module: options.module || 'default'});
    }
};
