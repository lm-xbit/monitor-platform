var bunyan = require('bunyan');
var inspect = require("util").inspect;
var express = require('express');
var passport = require('passport');
var User = require('models/user');
var shortID = require("shortid");
var logger = bunyan.createLogger({name: "settings"});

var Resp = require('resp');
var StatusCodes = require('status');

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

module.exports = router;
