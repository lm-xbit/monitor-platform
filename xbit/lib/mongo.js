var mongoose = require('mongoose');

mongoose.connect("mongodb://www.xbit.ga/xbit_user");
mongoose.Promise = global.Promise;

exports = module.exports = mongoose;
