'use strict';

var _kafkaNode = require('kafka-node');

var _kafkaNode2 = _interopRequireDefault(_kafkaNode);

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _socket = require('./socket');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Consumer = _kafkaNode2.default.Consumer;
const Offset = _kafkaNode2.default.Offset;
const Client = _kafkaNode2.default.Client;
const argv = (0, _minimist2.default)(process.argv.slice(2));

const io = (0, _socket.Socket)();