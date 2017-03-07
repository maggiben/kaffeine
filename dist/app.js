'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.server = undefined;

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

var _consumer = require('./consumer');

var _consumer2 = _interopRequireDefault(_consumer);

var _ConsumerGroup = require('./ConsumerGroup');

var _ConsumerGroup2 = _interopRequireDefault(_ConsumerGroup);

var _pubsub = require('./pubsub');

var _pubsub2 = _interopRequireDefault(_pubsub);

var _configureStore = require('./stores/configureStore');

var _configureStore2 = _interopRequireDefault(_configureStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require('debug')('kaffeine:main');

const allowCrossDomain = function (request, response, next) {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Authorization, Accept, token');
  response.header('Access-Control-Allow-Methods', 'OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT');

  if ('OPTIONS' === request.method) {
    response.status(200).end();
  } else {
    return next();
  }
};

const store = (0, _configureStore2.default)();
const reduxMiddleware = function (request, response, next) {
  response.store = store;
  return next();
};

const removeActionListener = store.addActionListener('ADD_SCREEN', () => {});

const app = (0, _express2.default)();

app.use(_bodyParser2.default.json());
app.use(_bodyParser2.default.urlencoded({ extended: true }));
app.use((0, _cookieParser2.default)());
app.use(allowCrossDomain);
app.use(reduxMiddleware);

app.use('/api', _routes.api);

const server = exports.server = app.listen(_config2.default.service.port, function () {
  const host = server.address().address;
  const port = server.address().port;
  debug(`Runner app listening at ${host}:${port}'`);
});

const socket = new _socket.ScreenSocket(server, store, '/screen');

const kafkaConsumerGroup = new _ConsumerGroup2.default(store);
const redisPubSub = new _pubsub2.default(store);

exports.default = app;