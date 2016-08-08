var ES = require('elasticsearch');

var eshost = process.env.ESHOST || "127.0.0.1";
var esport = process.env.ESPORT || 9200;
var eslog = process.env.ESLOG || "trace";

console.log("Try create ES client with log level " + eslog + " and endpoint " + eshost + ":" + esport + " ...");

var client = new ES.Client({
  host: eshost + ":" + esport,
  log: eslog
});

//Check if the elasticsearch is up
client.ping(
    {
      requestTimeout: 30000,
      hello: "elasticsearch"
    },
    function (error) {
      if (error) {
        console.error("Elasticsearch cluster is down!");
      }
      else {
        console.info("Elasticsearch is well!");
      }
    }
);

exports = module.exports = client;
