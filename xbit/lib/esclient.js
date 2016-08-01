var ES = require('elasticsearch');

var eshost = process.env.ESHOST || "localhost";
var esport = process.env.ESPORT || 9200;
var eslog = process.env.ESLOG || "trace";

console.log("Try create ES client with log level " + eslog + " and endpoint " + eshost + ":" + esport + " ...");

exports = module.exports = new ES.Client({
  host: eshost + ":" + esport,
  log: eslog
});
