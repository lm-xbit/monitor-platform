var express = require('express');
var passport = require('passport');
var Account = require('models/account');

var router = express.Router();

router.post("/login", passport.authenticate('basic'), function (req, res) {
  res.send("Success to login");
});

router.get("/users", passport.authenticate('basic'), function (req, res) {


    Account.find({}, function (err, doc) {
      if (err) {
        return res.send("Fail to list all users");
      }
      res.json(doc);
    });

  //res.send("Success to get users");
});

module.exports = router;
