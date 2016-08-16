var express = require('express');
var passport = require('passport');
var User = require('models/user');

var Resp = require('resp');
var StatusCodes = require('status')

var router = express.Router();

router.post('/register', function(req, res, next) {
  User.register(new User({ username : req.body.username }), req.body.password, function(err, user) {
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

router.post('/login',
  passport.authenticate('local'), function(req, res, next) {
  req.session.save(function (err) {
    if (err) {
      return next(err);
    }
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

router.get('/user/:id',passport.authenticate('local'), (req, res) => {
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
        return;
      }
    });
  }
  var update = {}
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


module.exports = router;
