var express = require('express');
var router = express.Router();

var User = require('models/user');

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

router.use("/api", require("./api"));

router.use("/rest", require("./rest"));

module.exports = router;
