var express = require('express');
var passport = require('passport');
var Account = require('../models/account');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('signup', {
    title: 'Signup'
  });
});

router.get('/signup', function(req, res) {
  res.render('signup', {
    title: 'Signup'
  });
});

router.get('/login', function (req, res) {
  res.render('login');
});

router.post('/rest/settings/register', function (req, res) {
  Account.register(new Account( { username : req.body.username }), req.body.password, function (err, account) {
    if (err) {
      //return res.render('register', { account : account });
      return res.send("Fail to register the user - " + err);
    }

    res.send("Success to register the user");
  })
});

router.post("/rest/settings/login", passport.authenticate('basic'), function (req, res) {
  res.send("Success to login");
});

router.get("/rest/settings/users", passport.authenticate('basic'), function (req, res) {


    Account.find({}, function (err, doc) {
      if (err) {
        return res.send("Fail to list all users");
      }
      res.json(doc);
    });

  //res.send("Success to get users");
});


module.exports = router;
