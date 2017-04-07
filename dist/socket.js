'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RemoteSocket = exports.ScreenSocket = undefined;

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _package = require('../package.json');

var _redis = require('redis');

var _socket3 = require('socket.io-redis');

var _socket4 = _interopRequireDefault(_socket3);

var _events = require('events');

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require('debug')('kaffeine:socketio');

const rooms = [{
  name: 'notification',
  isPrivate: false,
  messages: [],
  notifications: 0,
  canInvite: true,
  users: [],
  allowed: []
}];

const pub = (0, _redis.createClient)(_config2.default.redis.port, _config2.default.redis.hostname, {});
const sub = (0, _redis.createClient)(_config2.default.redis.port, _config2.default.redis.hostname, {
  detect_buffers: true
});

let SocketEvents = class SocketEvents extends _events.EventEmitter {
  constructor(...args) {
    super(...args);
  }
};
let SocketClient = class SocketClient {
  constructor(io, socket, store) {
    this.disconnect = reason => {
      debug('disconnect:', this.socket.id);
      this.socket.removeAllListeners();
      this.removeActionListeners.map(removeActionListener => {
        removeActionListener();
      });
    };

    this.echo = message => {
      debug('echo:', message);
      this.socket.emit('echo', message);
    };

    this.ping = () => {
      debug('ping');
      this.socket.emit('pong', _package.version);
    };

    this.join = options => {
      let exists = rooms.some(room => room.name === options.name);
      if (!exists) {
        debug('room', options.name, 'not found');
        this.socket.emit('fail', 'not found');
      }
      debug('joining room:', options.name);
      this.io.adapter.remoteJoin(this.socket.id, options.name, error => {
        if (error) {
          debug('unknown id');
          return;
        }
        debug('joined room:', options.name);
        this.socket.emit('joined', options.name);
      });
    };

    this.leave = options => {
      debug('leave');
      let exists = rooms.some(room => room.name === options.name);
      if (!exists) {
        this.socket.emit('fail', 'not found');
      }

      this.io.adapter.remoteLeave(this.socket.id, options.name, error => {
        if (error) {
          debug('unknown id');
          return;
        }
        this.socket.emit('leaved', options.name);
      });
    };

    this.actions = ['MESSAGE', 'DISPLAY', 'SEND', 'REFRESH', 'RELOAD'];
    this.events = ['disconnect', 'echo', 'ping', 'join', 'leave'];
    this.io = io;
    this.socket = socket;
    this.store = store;

    this.events.map(event => {
      return this.socket.on(event, this[event]);
    });

    this.removeActionListeners = this.actions.map(action => this.store.addActionListener(action, action => {
      let { query } = action.payload;
      if (query && query.id === this.socket.user.id) {
        debug('store action', action.type, query.id);
        this.socket.emit(action.type, action.payload);
      }
    }));
  }

};
let GenericSocket = class GenericSocket {

  constructor(server, store, namespace = '/') {
    this.handshake = (socket, next) => {
      const token = socket.handshake.query.token;
      const id = socket.handshake.query.id;
      if (token) {
        socket.user = {
          token: token,
          id: id
        };
        return next();
      } else {
        socket.disconnect('unauthorized');
        return next(new Error('not authorized'));
      }
    };

    this.redux = (socket, next) => {
      if (this.store) {
        socket.store = this.store;
        return next();
      } else {
        return next(new Error('no store associated with socket'));
      }
    };

    const io = _socket2.default.listen(server);
    io.adapter((0, _socket4.default)({
      pubClient: pub,
      subClient: sub
    }));

    debug('socket namespace: ', namespace);
    this.io = io.of(namespace);

    this.store = store;

    this.io.use(this.handshake);
    this.io.use(this.redux);
  }

  getClients() {
    return new Promise((resolve, reject) => {
      this.adapter.clients(function (error, clients) {
        if (error) {
          return reject(error);
        }

        return resolve(clients);
      });
    });
  }

};
let ScreenSocket = exports.ScreenSocket = class ScreenSocket extends GenericSocket {
  constructor(...args) {
    var _temp;

    (_temp = super(...args), this.addNotification = action => {
      return this.store.addActionListener(action.type, action => {
        this.io.to('notification').emit(action.type, action.payload);
      });
    }, this.addClient = socket => {
      let client = new SocketClient(this.io, socket, this.store);
      return client;
    }, _temp)[(this.server, this.store, this.namespace)] = args;

    this.io.on('connection', this.addClient);

    this.removeActionListeners = ['MESSAGE'].map(action => this.store.addActionListener(action, action => {}));
  }

};
let RemoteSocket = exports.RemoteSocket = class RemoteSocket extends GenericSocket {
  constructor(...args) {
    super(...args);

    this.addClient = socket => {
      let client = new RemoteSocketClient(this.io, socket);
      return client;
    };

    this.io.on('connection', this.addClient);
  }
};