'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.server = exports.store = undefined;

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _socket = require('./socket');

var _routes = require('./routes');

var _middleware = require('./middleware');

var _consumer = require('./consumer');

var _consumer2 = _interopRequireDefault(_consumer);

var _ConsumerGroup = require('./ConsumerGroup');

var _ConsumerGroup2 = _interopRequireDefault(_ConsumerGroup);

var _pubsub = require('./pubsub');

var _pubsub2 = _interopRequireDefault(_pubsub);

var _configureStore = require('./stores/configureStore');

var _configureStore2 = _interopRequireDefault(_configureStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = require('debug')('kaffeine:main');

const store = exports.store = (0, _configureStore2.default)();

const reduxMiddleware = function (request, response, next) {
  response.store = store;
  return next();
};

const app = (0, _express2.default)();

app.use(_bodyParser2.default.json());
app.use(_bodyParser2.default.urlencoded({ extended: true }));
app.use((0, _cookieParser2.default)());
app.use(_middleware.cors);
app.use(reduxMiddleware);

app.use('/api', _routes.api);
app.use('/screen', _routes.screen);

const server = exports.server = app.listen(_config2.default.service.port, function () {
  const host = server.address().address;
  const port = server.address().port;
  debug(`Runner app listening at ${host}:${port}'`);
});

const socket = new _socket.ScreenSocket(server, store, '/screen');

const kafkaConsumerGroup = new _ConsumerGroup2.default(store);
const redisPubSub = new _pubsub2.default(store);

Promise.all([function () {
  return new Promise((resolve, reject) => {
    kafkaConsumerGroup.events.once('connect', function () {
      return resolve();
    });
  });
}, function () {
  return new Promise((resolve, reject) => {
    redisPubSub.events.once('connect', function () {
      return resolve();
    });
  });
}]).then(function () {
  setupListeners();
  debug('Services online');
});

const getMessages = (() => {
  var _ref = _asyncToGenerator(function* () {
    console.log('connected');
    let offset = yield kafkaConsumerGroup.getLatestOffsets();
    let data = yield kafkaConsumerGroup.getOffset();
    let index = offset[_config2.default.kafka.topic.topicName][_config2.default.kafka.topic.partition];
  });

  return function getMessages() {
    return _ref.apply(this, arguments);
  };
})();

const setupListeners = function () {
  kafkaConsumerGroup.events.once('connect', getMessages);
};

exports.default = app;