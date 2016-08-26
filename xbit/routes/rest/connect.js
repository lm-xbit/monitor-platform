var bunyan = require('bunyan');
var express = require('express');
var router = express.Router();
var logger = bunyan.createLogger({name: "data"});
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
 *    info: "mobile info"
 * }
 */
router.post("/:key", function(req, res) {
    var deviceKey = req.params.key;
    logger.debug("Handling data reporting from device %s", deviceKey);

    // TODO Device Verification
    if(deviceKey !== "test" && deviceKey !== "mobile-tracking") {
        return res.json({
            status: 403,
            message: "Unknown device"
        });
    }

    logger.debug("Try APP connect information:\n%s", JSON.stringify(req.body));

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
                logger.info("Update APP's connect info to %s. Previous connected? %s", req.body.info, app.connected);
                app.connectInfo = req.body.info;
                app.connectedOn = Date.now();
                updated = true;
            }
        });

        if(updated) {
            user.save(function () {
                return res({
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
