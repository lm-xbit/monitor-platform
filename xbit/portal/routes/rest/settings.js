var bunyan = require('bunyan');
var inspect = require("util").inspect;
var express = require('express');
var passport = require('passport');
var User = require('models/user');
var shortID = require("shortid");

var xBitLogger = require('xBitLogger');
var logger = xBitLogger.createLogger({module: 'setting'});

class Resp {
    constructor(status, errmsg, data = undefined) {
        this.status = status;
        this.errmsg = errmsg;
        this.data = data;
    }
};

var StatusCodes = {
    OK: 200,
    OK_STR: 'OK',

    INTERNAL_ERROR: 1001,

    USER_EXISTS: 1002,

    LOGIN_FAILED: 1003,

    BAD_REQUEST: 1004,

    NOT_FOUND: 1005
};

var router = express.Router();

router.post('/register', function(req, res, next) {
  User.register(new User({ email: req.body.email, username : req.body.username }), req.body.password, function(err, user) {
    if (err) {
      return res.status(401).send("Fail to login - " + err);
    }

    passport.authenticate('local')(req, res, function () {
      req.session.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    });
  });
});

router.post('/login', passport.authenticate('local'), function(req, res, next) {
  req.session.save(function (err) {
    if (err) {
      return next(err);
    }

    var inspect = require("util").inspect;
    logger.info("User logged in: %s", inspect(req.session.user));

    res.redirect('/');
  });
});

router.get('/logout', function(req, res, next) {
  req.logout();
  req.session.save(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

router.get('/user/:id', passport.authenticate('local'), (req, res) => {
  var uid = req.params.id;

  if (!uid) {
    return res.json(new Resp(StatusCodes.BAD_REQUEST, "missing user id"));
  }

  User.where( {_id: uid} ).findOne( (err, user) => {
    if (err || !user) {
      return res.json(new Resp(StatusCodes.NOT_FOUND, "user not found"));
    }

    if (user) {
      return res.json(new Resp(StatusCodes.OK, StatusCodes.OK_STR, user.toJSON()));
    }
  });
});

router.put('/user/:id', passport.authenticate('local'), (req, res) => {
  var uid = req.params.id;
  var user = req.body;

  if (!uid || !user) {
    return res.json(new Resp(StatusCodes.BAD_REQUEST, "missing uid or user data"));
  }

  user.id = uid;
  if (user.userKeys && user.userKeys instanceof Array && user.userKeys.length > 0) {
    // user.userKeys = [{key: xxx, updateOn: xxx, createOn: xxx}]
    user.userKeys.forEach( (value, index, array) => {
      if (!value || !(value instanceof Object)) {
        array.splice(index, 1);
        return;
      }

      if (!value.key) {
        array.splice(index, 1); // remove this element from array
      }
    });
  }
  var update = {};
  update.userKeys = user.userKeys;
  if (user.password) {
    update.password = user.password;
  }

  User.findByIdAndUpdate(uid, {$set: update}, {new: true, upsert: true}, (err, user) => {
    if (err || !user) {
      return res.json(new Resp(StatusCodes.INTERNAL_ERROR, "update user info failed"));
    }
    return res.json(new Resp(StatusCodes.OK, StatusCodes.OK_STR, user.toJSON()));
  });
});

router.post("/username/:email", function(req, res, next) {
  var email = req.params.email;
  User.where({email: email}).findOne( (err, user) => {
    if(err) {
        logger.error("Failed to find user by email %s: %s\n%s", email, err.message, err.stack);
        return next(err);
    }

    if(user === null) {
        logger.error("Cannot find user with given email address %s", email);
        return next(new Error("No user found with email - " + email));
    }

    user.username = body.username;
      user.save(function (err) {
          if (err) {
              return next(err);
          }

          return res.json({
              status: 200,
              settings: {
                  username: user.username,
                  email: user.email,
                  phone: user.phone
              }
          });
      });
  });
});

router.post("/password/:email", function (req, res, next) {
    var email = req.params.email;
    User.where({email: email}).findOne((err, user) => {
        if (err) {
            logger.error("Failed to find user by email %s: %s\n%s", email, err.message, err.stack);
            return next(err);
        }

        if (user === null) {
            logger.error("Cannot find user with given email address %s", email);
            return next(new Error("No user found with email - " + email));
        }

        user.authenticate(req.body.oldpass, function(err, ok) {
            if(err) {
                logger.error("Cannot authenticate user " + email);
                return next(err);
            }

            if(!ok) {
                logger.error("Password incorrect. Cannot change password for " + email);
                return res.json({
                    status: 401,
                    message: "Invalid password"
                });
            }

            user.setPassword(req.body.newpass, function(err, self) {
                if(err) {
                    logger.error("Cannot change password to new password!", err);
                    return next(err);
                }

                self.save(function (err) {
                    if (err) {
                        return next(err);
                    }

                    return res.json({
                        status: 200,
                        settings: {
                            username: self.username,
                            email: self.email,
                            phone: self.phone
                        }
                    });
                })
            });
        });
    });
});

// Get user basic information
router.get("/basic", function(req, res, next) {
    var email = req.session.passport.user;
    logger.info("Try getting basic information for user " + email);

    User.findOne({email: email}, function(err, user) {
        if(err) {
            logger.error("Cannot get basic information for user %s due to %s", email, err.message);
            return next(err);
        }

        if(!user) {
            logger.error("User %s not found", email);
            return next(new Error("User email not found"));
        }

        return res.json({
            status: 200,
            settings: {
                username: user.username,
                email: user.email,
                phone: user.phone
            }
        })
    });
});

router.get("/apps", function(req, res, next) {
    var email = req.session.passport.user;
    logger.info("Try getting basic information for user " + email);

    User.findOne({email: email}, function(err, user) {
        if (err) {
            logger.error("Cannot get basic information for user %s due to %s", email, err.message);
            return next(err);
        }

        if (!user) {
            logger.error("User %s not found", email);
            return next(new Error("User email not found"));
        }

        res.json({
            status: 200,
            apps: user.userKeys
        });
    });
});


/**
 * Star an APP
 */
router.post("/star/:key", function(req, res, next) {
    var email = req.session.passport.user;
    logger.info("Try star APP with key %s for user %s", req.params.key, email);

    User.findOne({email: email}, function(err, user) {
        if (err) {
            logger.error("Cannot create application for user %s due to %s", email, err.message);
            return next(err);
        }

        if (!user) {
            logger.error("User %s not found", email);
            return next(new Error("User email not found"));
        }

        if(!user.userKeys) {
            user.userKeys = [];
        }

        var starred = false;
        // make all other not the primary!!!
        user.userKeys.forEach(function(app) {
            if(app.key !== req.params.key) {
                app.primary = false;
            }
            else {
                logger.info("Try star application with key " + app.key);
                app.primary = true;
                starred = true;
            }
        });

        if(!starred) {
            logger.error("Cannot find application with key " + req.params.key);
            return res.json({
                status: 404,
                message: "Application key not found"
            });
        }


        user.save(function(err) {
            if(err) {
                logger.error("Failed to star application due to " + err.message);
                return next(err);
            }

            return res.json({
                status: 200,
                apps: user.userKeys
            });
        });
    });
});

/**
 * DELETE an APP
 */
router.delete("/apps/:key", function(req, res, next) {
    var email = req.session.passport.user;
    logger.info("Try delete APP with key %s for user %s", req.params.key, email);

    User.findOne({email: email}, function(err, user) {
        if (err) {
            logger.error("Cannot create application for user %s due to %s", email, err.message);
            return next(err);
        }

        if (!user) {
            logger.error("User %s not found", email);
            return next(new Error("User email not found"));
        }

        if(!user.userKeys) {
            user.userKeys = [];
        }

        var removed = false;
        for(var idx = 0; idx < user.userKeys.length; idx ++) {
            var app = user.userKeys[idx];
            if(app.key === req.params.key) {
                removed = true;

                logger.debug("Try removing application with key " + app.key);
                user.userKeys.splice(idx, 1);

                break;
            }
        }

        if(!removed) {
            logger.error("Cannot find application with key " + req.params.key);
            return res.json({
                status: 404,
                message: "Application key not found"
            });
        }

        user.save(function(err) {
            if(err) {
                logger.error("Failed to remove application due to " + err.message);
                return next(err);
            }

            return res.json({
                status: 200,
                apps: user.userKeys
            });
        });
    });
});

/**
 * Updating an APP
 */
router.post("/apps", function(req, res, next) {
    var email = req.session.passport.user;
    logger.info("Try updating APP for user %s:\n%s", email, inspect(req.body));

    User.findOne({email: email}, function(err, user) {
        if (err) {
            logger.error("Cannot create application for user %s due to %s", email, err.message);
            return next(err);
        }

        if (!user) {
            logger.error("User %s not found", email);
            return next(new Error("User email not found"));
        }

        if(!user.userKeys) {
            user.userKeys = [];
        }

        var updated = false;
        for(var idx = 0; idx < user.userKeys.length; idx ++) {
            var app = user.userKeys[idx];
            if(app.key === req.body.key) {
                updated = true;

                logger.debug("Try updating application with key " + app.key);
                app.name = req.body.name;
                app.description = req.body.description;

                break;
            }
        }

        if(!updated) {
            logger.error("Cannot find application with key " + req.body.key);
            return res.json({
                status: 404,
                message: "Application key not found"
            });
        }

        user.save(function(err) {
            if(err) {
                logger.error("Failed to create new application due to " + err.message);
                return next(err);
            }

            return res.json({
                status: 200,
                apps: user.userKeys
            });
        });
    });
});

/**
 * Creating an APP
 */
router.put("/apps", function(req, res, next) {
    var email = req.session.passport.user;
    logger.info("Try creating new APP for user %s:\n%s", email, inspect(req.body));

    User.findOne({email: email}, function(err, user) {
        if (err) {
            logger.error("Cannot create application for user %s due to %s", email, err.message);
            return next(err);
        }

        if (!user) {
            logger.error("User %s not found", email);
            return next(new Error("User email not found"));
        }

        if(!user.userKeys) {
            user.userKeys = [];
        }

        req.body.key = shortID.generate();

        logger.info("Try create new application with key %s for user %s", req.body.key, email);
        user.userKeys.push(req.body);

        user.save(function(err) {
            if(err) {
                logger.error("Failed to create new application due to " + err.message);
                return next(err);
            }

            return res.json({
                status: 200,
                apps: user.userKeys
            });
        });
    });
});

/**
 * Get a new connect code for the given app
 */
router.get('/connect/:key', function(req, res, next) {
    var email = req.session.passport.user;
    logger.info("Try connect APP %s for user %s", req.params.key, email);

    User.findOne({email: email}, function(err, user) {
        if (err) {
            logger.error("Cannot create application for user %s due to %s", email, err.message);
            return next(err);
        }

        if (!user) {
            logger.error("User %s not found", email);
            return next(new Error("User email not found"));
        }

        if(!user.userKeys) {
            user.userKeys = [];
        }

        var updated = false;
        var app = null;
        for(var idx = 0; idx < user.userKeys.length; idx ++) {
            app = user.userKeys[idx];
            if(app.key === req.params.key) {
                updated = true;

                var code = shortID.generate();
                logger.debug("Try creating new connect code %s for application %s with key %s", code, app.name, app.key);
                app.connectCode = code;

                break;
            }
        }

        if(!updated) {
            logger.error("Cannot find application with key " + req.body.key);
            return res.json({
                status: 404,
                message: "Application key not found"
            });
        }

        user.save(function(err) {
            if(err) {
                logger.error("Failed to create new connection for application due to " + err.message);
                return next(err);
            }

            var config = require("xbitConfig");

            return res.json({
                status: 200,
                data: {
                    /**
                     * Information used to confirm the connection
                     */
                    code: app.connectCode,
                    ssl: config.ssl || false,
                    host: config.dns || config.address,
                    port: config.port,

                    /**
                     * Gate to report data back
                     */
                    gate: {
                        ssl: config.agent.ssl || false,
                        host: config.agent.dns || config.agent.address,
                        port: config.agent.port || 8000,
                        uri: config.agent.uri || "data"
                    },

                    /**
                     * Application settings. TODO
                     */
                    app: {
                        key: app.key,
                        type: app.type,
                        interval: 30
                    }
                }
            });
        });
    });
});

/**
 * Get connect status for an APP
 */
router.get("/status/:key", function(req, res, next) {
    var deviceKey = req.params.key;

    if(!deviceKey || deviceKey === '') {
        logger.error("Missing device key or device key invalid - " + deviceKey);
        return res.status(404).send("Invalid APP");
    }

    logger.debug("Checking connect status for APP with key %s", deviceKey);

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

        var connected = false;
        var connectedOn = null;
        user.userKeys.forEach(function(app) {
            if(app.key === deviceKey) {
                // the APP is connected only when connectCode is empty and connected is set to true
                if(app.connectCode === '' && app.connected) {
                    connected = true;
                    connectedOn = app.connectedOn;
                }
                else {
                    logger.info("APP still not connected. Connect code: %s, connected?%s", app.connectCode, app.connected)
                }
            }
        });

        res.json({
            status: connected ? 200 : 100,
            data: {
                connectedOn: connectedOn
            }
        })
    });
});

/**
 * Adding a schema
 */
router.post("/schemas/:key", function(req, res, next) {
  var email = req.session.passport.user;
  var deviceKey = req.params.key;
  logger.info("Try adding schema for APP with key %s of user %s", req.params.key, email);

  User.findOne({email: email}, function(err, user) {
    if (err) {
      logger.error("Cannot find user %s due to %s", email, err.message);
      return res.status(500).send("Internal error");
    }

    if (!user) {
      logger.erorr("User %s not found", email);
      return res.status(404).send("User not found");
    }

    if (!user.userKeys) {
      logger.error("APP key %s for user %s not found", deviceKey, email);
      return res.status(404).send("User's app not found");
    }
    var find = false;
    user.userKeys.forEach(function(app) {
      if (app.key == req.params.key) {
        app.eschema = req.body.eschema;
        logger.debug("Add eschema for APP %s done", app.key);
        find = true;
      }
    });

    if (find) {
      user.save(function(err) {
        if (err) {
          logger.error("Failed to add eschema due to %s", err.message);
          return res.status(500).send('Save eschema failed');
        }

        user.userKeys.forEach(function(app){
          if (app.key == deviceKey) {
            res.json({
              status: 200,
              eschema: app.eschema
            });
          }
        });
      });
    }
    else {
      return res.status(404).send("APP not found");
    }
  });
});

router.get("/schemas/:key",function(req, res, next){
  var email = req.session.passport.user;
  var deviceKey = req.params.key;
  logger.info("Try getting schema of APP %s for user %s", req.params.key, email);

  User.findOne({email: email}, function(err, user){
    if (err) {
      logger.error("Cannot find user %s due to %s", email, err.message);
      return res.status(500).send("Internal error");
    }

    if (!user) {
      logger.error("User %s not found", email);
      return res.status(404).send("User not found");
    }

    if (!user.userKeys) {
      logger.error("APP key %s for user %s not found", deviceKey, email);
      return res.status(404).send("User's app " + deviceKey + " not found");
    }

    var find = false;
    user.userKeys.forEach(function(app) {
      if (app.key == deviceKey) {
        res.json({
          status: 200,
          eschema: app.eschema
        });
        find = true;
      }
    });

    if (!find) {
      res.status(404).send("User's APP key not found");
    }
  });
});

router.delete("/schemas/:key", function(req, res, next) {
  var email = req.session.passport.user;
  var deviceKey = req.params.key;
  logger.info("Try getting schema of APP %s for user %s", req.params.key, email);

  User.findOne({email: email}, function(err, user){
    if (err) {
      logger.error("Cannot find user %s due to %s", email, err.message);
      return res.status(500).send("Internal error");
    }

    if (!user) {
      logger.error("User %s not found", email);
      return res.status(404).send("User not found");
    }

    if (!user.userKeys) {
      logger.error("APP key %s for user %s not found", deviceKey, email);
      return res.status(404).send("User's app " + deviceKey + " not found");
    }

    user.userKeys.forEach(function(app) {
      if (app.key == deviceKey) {
        app.eschema = {};
      }
    });

    user.save(function(err) {
      if (err) {
        logger.error("Failed to delete eschema due to %s", err.message);
        return res.status(500).send("Delete eschema failed");
      }

      return res.json({
        status: 200
      });
    });
  });
});

module.exports = router;
