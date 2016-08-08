var express = require('express');
var passport = require('passport');
var Account = require('models/account');

var router = express.Router();

router.post("/login", passport.authenticate('basic'), function (req, res) {
  req.session.save(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

router.get("/users", passport.authenticate('basic'), function (req, res) {
    Account.find({}, function (err, doc) {
      if (err) {
        return res.send("Fail to list all users");
      }
      res.json(doc);
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
