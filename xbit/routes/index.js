var express = require('express');
var router = express.Router();

var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res) {
  console.log("Try rendering landing page ");
  if (!req.user) {
    console.log("Render login page ....");
    res.render('login');
  } else {
    console.log("Render index page for user ....", req.user);
    res.render('index');
  }
});

router.get('/signup', function(req, res) {
  res.render('signup', {
    title: 'Signup'
  });
});

router.get('/index', function(req, res) {
  if (!req.user) {
    res.render("login");
  }
  else {
    res.render('index');
  }

});

router.get('/login', function (req, res) {
  res.render('login');
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

//////
router.use("/api", require("./api"));

router.use("/rest", require("./rest"));

module.exports = router;
