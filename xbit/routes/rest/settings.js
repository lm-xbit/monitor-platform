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

module.exports = router;
