'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _redis = require('redis');

var _events = require('events');

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require('debug')('kaffeine:RedisPubSub');

let RedisEvents = class RedisEvents extends _events.EventEmitter {
  constructor(...args) {
    super(...args);
  }
};
let RedisPubSub = class RedisPubSub {
  constructor(store) {
    this.onMessage = message => {
      this.events.emit('message', message);
      debug(message);
    };

    this.onConnect = () => {
      this.events.emit('connect');
      debug('redis client connected');
    };

    let { redis } = _config2.default;
    this.client = (0, _redis.createClient)(redis.port, redis.hostname, {});
    this.publisher = (0, _redis.createClient)(redis.port, redis.hostname, {});
    this.subscriber = (0, _redis.createClient)(redis.port, redis.hostname, { detect_buffers: true });

    this.subscriber.on('message', this.onMessage);
    this.subscriber.on('connect', this.onConnect);

    this.subscriber.subscribe(redis.subscriberName);

    this.events = new RedisEvents();
  }

  publish(message) {
    let { redis } = _config2.default;
    this.publisher.publish(redis.subscriberName, message);
  }
};
exports.default = RedisPubSub;