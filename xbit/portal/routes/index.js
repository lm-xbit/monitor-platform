var express = require('express');
var passport = require('passport');
var router = express.Router();
var xBitLogger = require('xBitLogger');
var logger = xBitLogger.createLogger();

/* GET home page. */
router.get('/', function(req, res) {
  logger.info("Try rendering landing page ");
  if (!req.user) {
    logger.info("Render login page ....");
    res.render('login');
  } else {
    logger.info("Render index page for user ....", req.user);
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

router.use('/forgot', require('./controls/forgotPassword'));
router.use('/reset', require('./controls/resetPassword'));

//////
router.use("/api", require("./api"));

router.use("/rest", require("./rest"));

module.exports = router;
