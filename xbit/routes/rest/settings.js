var express = require('express');
var passport = require('passport');
var Account = require('models/account');
var User = require('models/user');

var Resp = require('resp')
var StatusCodes = require('status')

var router = express.Router();

router.post('/register', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;

  User.where({username: username}).findOne( (err, user) => {
    if (err) {
      return res.json(new Resp(StatusCodes.INTERNAL_ERROR, "register failed for interal error"));
    }

    if (user) {
      return res.json(new Resp(StatusCodes.USER_EXISTS, "username has existed, please choose another username"));
    }

    // save new user to db
    user = new User({username: username, password: password});
    user.save( (err, user, numAffected) => {
      if (err || numAffected == 0) {
        return res.json(new Resp(StatusCodes.INTERNAL_ERROR, "save user failed"));
      }

      return res.json(new Resp(StatusCodes.OK, "registry successfully", user.toJSON()));
    });
  });
});

router.post('/login', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;

  User.where( {username: username, password: password} ).findOne( (err, user) => {
    if (err || !user) {
      return res.json(new Resp(StatusCodes.LOGIN_FAILED, "invalid username or password"));
    }
    if (user) {
      // todo: update session

      return res.json(new Resp(StatusCodes.OK, StatusCodes.OK_STR, user.toJSON()));
    }
  });
});

router.get('/user/:id', (req, res) => {
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

router.put('/user/:id', (req, res) => {
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

// Get user basic information
router.get("/basic", function(req, res) {
  return res.json({
    status: 200,
    settings: {
      username: "Test User",
      email: "testuser@somewhere.com",
      password: "test"
    }
  })
});

router.get("/apps", function(req, res) {
  return res.json({
    status: 200,
    apps: [{
      id: "1111111",
      name: "Type 1",
      type: "mobile-tracking",
      key: "app key 1"
    }, {
      id: "22222222",
      name: "Type 2",
      type: "Some Other App",
      key: "app key 2"
    }]
  });
});


module.exports = router;
