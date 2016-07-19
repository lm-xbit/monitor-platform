var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('login', {
    title: 'xBit Login'
  });
  // res.send('respond with a resource');
});

module.exports = router;
