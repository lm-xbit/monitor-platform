var bunyan = require('bunyan');

var streams = [{stream: process.stdout}];

var logger = null;

module.exports = {
    initialize(config) {
        if(logger) {
            console.log("Logger already initialized");
        }
        else {
            config.logFilePath && streams.push({path: config.logFilePath});
        }
    },

    createLogger (options = {}) {
        if(!logger) {
            logger = bunyan.createLogger({
                name: 'xbitApp',
                streams
            });
        }

        return logger.child({module: options.module || 'default'});
    }
};
