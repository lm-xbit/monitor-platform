/**
 * Created by robin on 11/6/16.
 */
var kafka = require('kafka-node') ;
var Producer = kafka.Producer;
var Client = kafka.Client;
var client = new Client('127.0.0.1:2181');
var producer = new Producer(client, { requireAcks: 1 });

module.exports = producer;
