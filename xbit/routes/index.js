var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use("/api", require("./api"));

router.use("/rest", require("./rest"));

module.exports = router;
