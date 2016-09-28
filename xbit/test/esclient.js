var ES = require('elasticsearch');
var moment = require("moment");
var filtres = require("filtres");

var endpoint = "http://localhost:9200/xbit/geoData";

// Table = an ElasticSearch Type (aka Table)
// http://www.elasticsearch.org/guide/reference/glossary/#type
var client = new ES.Client({
    host: "localhost:9200"
});


// var expression = '@timestamp <= 1474971299432 and @timestamp >= 1474971299432';

var expression = 'key == "HJzqm6Da"'
var query = filtres.compile(expression);

/*
var query = {
    "range": {
        "@timestamp": {
            // "format": "epoch_millis",
            "gte": moment.utc(1474971299432).format(),
            "lte": moment.utc(1474971299432).format()
        }
    }
};
*/

console.log("Try query with query DSL", query);
client.search({
    "index": "xbit",
    "type": "geoData",
    "body": {
        "query": {
            "bool": {
                "must": [{
                    "query_string": {
                        "query": "key:HJzqm6Da"
                    }
                }, {
                    "range": {
                        "@timestamp": {"gte": 1474971299432, "lte": 1474971299432}
                        // "@timestamp": {"gte": 1474970663765}
                    }
                }]
            }
        }
    }
    /*
    "query": {
        "@timestamp": 1470632890456
    }
    */
    /*
    "q": "key: HJzqm6Da",
    "body": {
        "query": query
    }
    */
}).then(function(data) {
    console.log(JSON.stringify(data, null, 2));
});