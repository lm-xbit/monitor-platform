#!/usr/bin/env node

let cli = require("cli");
let Q = require("q");
let http = require('http');

cli.setUsage(
    'gps-simulator [options] app key\n' +
    '\n' +
    'Arguments:\n' +
    '   app - required, application name\n' +
    '   key - required, application key'
);

cli.parse({
    "host": ['h', "Host to post to, default to 127.0.0.1", "string"],
    "port": ['p', "Port to post to, default to 8000", "string"],
    "url": ['u', "Url to post to, default to /data", "string"],
    "interval": ['i', "Interval in seconds to post faked GPS data, default to 5 seconds", "number"],
    "latitude": ['a', 'Initial latitude, default to 30.681369', 'number'],
    "longitude": ['o', 'Initial longitude, default to 103.982584', 'number'],
    "altitude": ['l', 'Initial altitude in meters, default to 0', 'number'],
    "accuracy": ['c', 'Initial accuracy in meters, default to 50', 'number'],
    "step": ['s', 'Step to move, default to 0.02', 'number'],
    "count": ['n', "Number location to generate. Set to zero to generate locations indefinitely till killed. Default to 0", "number"]
});

cli.main(function (args, options) {
    if (args.length < 2) {
        return cli.getUsage(-1);
    }

    let app = args[0];
    let key = args[1];

    let host = options["host"] || "127.0.0.1";
    let port = options["port"] || "8000";
    let url = options["url"] || "/data";
    let interval = options["interval"] || 5;
    let lat = options["lat"] || 30.681369;
    let lon = options["lon"] || 103.982584;
    let alt = options["alt"] || 0;
    let acc = options["acc"] || 50;
    let step = options["step"] || 0.02;
    let total = options["count"] || 0;

    let count = 0;

    console.log("Try generating GPS location with interval=" + interval + " seconds and initial location (" + lat + ", " + lon + ")");
    setInterval(function() {
        console.log("Generating one location ...");

        /**
         *
         * POST
         * https://hostname/data/<type>/<key>
         * {
         *    "status": 200,
         *    "message": "OK",
         *    "data":
         *    [
         *       {
         *           "timestamp": xxxx,
         *           "metrics": [{
         *                "name": "metric1", "value": 123
         *            }, ...,  {
         *                "name": "metricN", "value": 789
         *            }]
         *       }
         *    ]
         * }
         */
        console.log("Try simulating GPS location (" + lat + ", " + lon + ") ...");
        let post_data = JSON.stringify({
            "status": 200,
            "message": "OK",
            "data": [{
                "timestamp": Date.now(),
                "metrics": [{
                    "name": "latitude",
                    "value": lat
                }, {
                    "name": "longitude",
                    "value": lon
                }, {
                    "name": "altitude",
                    "value": alt
                }, {
                    "name": "accuracy",
                    "value": acc
                }]
            }]
        });

        let post_options = {
            host: host,
            port: port,
            path: url + "/" + app + "/" + key,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(post_data)
            }
        };

        // Set up the request
        let post_req = http.request(post_options, function(res) {
            if(res.statusCode != 200) {
                console.log('STATUS: ' + res.statusCode);
                console.log('HEADERS: ' + JSON.stringify(res.headers));

                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    // console.log('Response: ' + chunk);
                });
            }
        });

        // post the data
        post_req.write(post_data);
        post_req.end();

        count ++;
        if(count % 2 === 0) {
            lat = lat + step;
        }
        else {
            lon = lon + step;
        }

        if(total > 0 && count === total) {
            console.log("Total " + total + " location generated. Quitting ...");
            process.exit(1);
        }
    }, interval * 1000);
});
