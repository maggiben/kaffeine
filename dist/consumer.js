'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _kafkaNode = require('kafka-node');

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require('debug')('kaffeine:consumer');

let KafkaConsumer = class KafkaConsumer {
  constructor(store) {
    this.onMessage = message => {
      debug(message);
    };

    this.onError = error => {
      debug('error', error);
    };

    this.onOffsetOutOfRange = topic => {
      topic.maxNum = 2;
      offset.fetch([topic], function (error, offsets) {
        if (error) {
          return debug('error', error);
        }
        var min = Math.min(offsets[topic.topic][topic.partitions]);
        consumer.setOffset(topic.topic, topic.partitions, min);
      });
    };

    let { kafka } = _config2.default;
    this.client = new _kafkaNode.Client(kafka.client.connectionString);
    this.offset = new _kafkaNode.Offset(this.client);
    this.consumer = new _kafkaNode.Consumer(this.client, [{ topic: kafka.topic.topicName }], kafka.consumer);
    this.consumer.on('message', this.onMessage);
    this.consumer.on('error', this.onError);
    this.consumer.on('offsetOutOfRange', this.onOffsetOutOfRange);
  }

};
exports.default = KafkaConsumer;