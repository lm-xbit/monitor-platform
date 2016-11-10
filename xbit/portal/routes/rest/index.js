var express = require('express');
var router = express.Router();

router.use("/connect", require("./connect"));

router.use("/data", require("./data"));

router.use("/settings", require("./settings"));

module.exports = router;
