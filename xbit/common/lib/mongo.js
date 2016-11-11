var mongoose = require('mongoose');

var eshost = process.env.MONGOHOST || "127.0.0.1";
mongoose.connect("mongodb://" + eshost + "/xbit_user");
mongoose.Promise = global.Promise;

exports = module.exports = mongoose;
