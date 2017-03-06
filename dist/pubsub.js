'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _redis = require('redis');

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let RedisPubSub = class RedisPubSub {
  constructor(store) {
    this.onMessage = message => {
      debug(message);
    };

    let { redis } = _config2.default;
    this.publisher = (0, _redis.createClient)(redis.port, redis.hostname, {});
    this.subscriber = (0, _redis.createClient)(redis.port, redis.hostname, { detect_buffers: true });
    this.subscriber.on('message', this.onMessage);
    this.subscriber.subscribe(redis.subscriberName);
  }

  publish(message) {
    let { redis } = _config2.default;
    this.publisher.publish(redis.subscriberName, message);
  }
};
exports.default = RedisPubSub;