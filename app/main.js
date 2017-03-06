import kafka from 'kafka-node'
import minimist from 'minimist'
import config from 'config'
import { Socket } from './socket'

const Consumer = kafka.Consumer
const Offset = kafka.Offset
const Client = kafka.Client
const argv = minimist(process.argv.slice(2))


const io = Socket()

/*
var client = new Client(config.kafka.client.connectionString);
var topics = [
    {topic: config.kafka.topic.topicName, partitions: 1},
    {topic: config.kafka.topic.topicName, partitions: 0}
];

var consumer = new Consumer(client, topics, config.kafka.consumer);
var offset = new Offset(client);

consumer.on('message', function (message) {
  console.log(message);
});

consumer.on('error', function (err) {
  console.log('error', err);
});

// If consumer get `offsetOutOfRange` event, fetch data from the smallest(oldest) offset
consumer.on('offsetOutOfRange', function (topic) {
  topic.maxNum = 2;
  offset.fetch([topic], function (err, offsets) {
    if (err) {
      return console.error(err);
    }
    var min = Math.min(offsets[topic.topic][topic.partitions]);
    consumer.setOffset(topic.topic, topic.partitions, min);
  });
});
*/




/*
var kafka = require('kafka-node');
var Consumer = kafka.Consumer;
var Offset = kafka.Offset;
var Client = kafka.Client;
var argv = require('minimist')(process.argv.slice(2));
var topic = argv.topic || 'topic1';

var client = new Client('localhost:2181');
var topics = [
    {topic: topic, partitions: 1},
    {topic: topic, partitions: 0}
];
var options = { autoCommit: false, fetchMaxWaitMs: 1000, fetchMaxBytes: 1024 * 1024 };

var consumer = new Consumer(client, topics, options);
var offset = new Offset(client);

consumer.on('message', function (message) {
  console.log(message);
});

consumer.on('error', function (err) {
  console.log('error', err);
});

// If consumer get `offsetOutOfRange` event, fetch data from the smallest(oldest) offset
consumer.on('offsetOutOfRange', function (topic) {
  topic.maxNum = 2;
  offset.fetch([topic], function (err, offsets) {
    if (err) {
      return console.error(err);
    }
    var min = Math.min(offsets[topic.topic][topic.partitions]);
    consumer.setOffset(topic.topic, topic.partitions, min);
  });
});

*/
