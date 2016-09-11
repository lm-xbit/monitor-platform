var bunyan = require('bunyan');
var express = require('express');
var router = express.Router();
var logger = require('common/xBitLogger');
var ESClient = require("lib/esclient");
var passport = require('passport');
var User = require('models/user');

// fix me: debugging mode
logger.level("debug");


// expose API to mobile client for now
/**
 * POST
 * https://hostname/rest/connect/<key>
 * {
 *    code: "xyz123",
 *    info: <opaque>
 * }
 */
router.post("/:key", function(req, res, next) {
    var deviceKey = req.params.key;
    var code = req.body.code;

    if(!deviceKey || deviceKey === '') {
        logger.error("Missing device key or device key invalid - " + deviceKey);
        return res.status(404).send("Invalid APP");
    }
    else if(!code || code === '') {
        logger.error("Device key %s missing connect code or connect code invalid: %s", deviceKey, code);
        return res.status(404).send("Invalid APP");
    }

    logger.debug("Try connect APP with key %s, code %s and information:\n%s", deviceKey, code, JSON.stringify(req.body));

    //TODO: how to search users with the given key????
    User.findOne({"userKeys.key": deviceKey}, function(err, user) {
        if(err) {
            logger.error("Cannot locate APP for key %s - %s:\n%s", deviceKey, err.message, err.stack);
            return res.status(500).send("Internal error");
        }

        if(!user) {
            logger.error("Cannot find APP with key %s", deviceKey);
            return res.status(404).send("User APP not found");
        }

        var updated = false;
        user.userKeys.forEach(function(app) {
            if(app.key === deviceKey) {
                if(app.connectCode !== code) {
                    logger.error("APP connect code incorrect. Expecting %s, got %s", app.connectCode, code);
                }
                else {
                    logger.info("Update APP's connect info to %s. Previous connected? %s", req.body.info, app.connected);
                    app.connected = true;
                    app.connectCode = ""; // empty to avoid mis-connect
                    app.connectInfo = req.body.info;
                    app.connectedOn = Date.now();
                    updated = true;
                }
            }
        });

        if(updated) {
            user.save(function () {
                return res.json({
                    status: 200,
                    message: "OK"
                });
            });
        }
        else {
            logger.error("Cannot find APP with key %s in user %s", deviceKey, user.email);
            return res.status(404).send("User APP not found");
        }
    });
});

module.exports = router;
