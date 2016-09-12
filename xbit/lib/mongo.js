var mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1/xbit_user");
mongoose.Promise = global.Promise;

exports = module.exports = mongoose;
