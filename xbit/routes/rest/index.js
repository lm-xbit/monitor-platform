var express = require('express');
var router = express.Router();

router.use("/data", require("./data"));

router.use("/settings", require("./settings"));

module.exports = router;
