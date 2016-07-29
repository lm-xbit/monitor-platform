var express = require('express');
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

//////
router.use("/api", require("./api"));

router.use("/rest", require("./rest"));

module.exports = router;
