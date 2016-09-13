var mongoose = require('mongoose');

mongoose.connect("mongodb://localhost/xbit_user");
mongoose.Promise = global.Promise;

exports = module.exports = mongoose;
