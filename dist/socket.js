'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RemoteSocket = exports.ScreenSocket = exports.Socket = undefined;

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _redis = require('redis');

var _socket3 = require('socket.io-redis');

var _socket4 = _interopRequireDefault(_socket3);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _events = require('events');

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

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
  constructor(io, socket) {
    this.disconnect = () => {
      debug('disconnect:', this.socket.id);
    };

    this.echo = message => {
      debug('echo: ', message);
      this.socket.emit('echo', message);
    };

    this.join = options => {
      let exists = rooms.some(room => room.name === options.name);

      if (!exists) {
        this.socket.emit('fail', 'not found');
      }
      this.io.adapter.remoteJoin(this.socket.id, 'notification', function (error) {
        if (error) {
          debug('unknown id');
        }
      });
      this.io.to('notification').emit('echo', { message: 'welcome' });
    };

    this.banner = message => {
      let room = rooms[0];

      this.io.to('notification').emit('banner', { room, message });
    };

    this.getId = token => {
      return this.socket.emit('screen', {
        id: (0, _v2.default)()
      });
    };

    this.io = io;
    this.socket = socket;
    this.db = pub;

    this.socket.on('disconnect', this.disconnect);
    this.socket.on('echo', this.echo);
    this.socket.on('join', this.join);
    this.socket.on('banner', this.banner);
    this.db.set('chatio:connections:' + socket.user.token, socket.id);
  }

};
let Socket = exports.Socket = class Socket {

  constructor(server, store, namespace = '/') {
    this.addClient = socket => {
      let client = new SocketClient(this.io, socket);
      return client;
    };

    this.handshake = (socket, next) => {
      const token = socket.handshake.query.token;
      if (token) {
        socket.user = {
          token: token
        };
        this.store.dispatch(this.add(token));
        return next();
      } else {
        debug('unauthorized');
        socket.disconnect('unauthorized');
        return next(new Error('not authorized'));
      }
    };

    this.add = token => {
      return function (dispatch, getState) {
        return dispatch(function () {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              return resolve();
            }, 50);
          });
        }).then(() => {
          dispatch({
            type: 'ADD_SCREEN',
            payload: {
              id: token,
              title: 'nppx'
            }
          });
        });
      };
    };

    this.redux = (socket, next) => {
      if (this.store) {
        socket.store = this.store;
        return next();
      } else {
        debug('no store associated with socket');
        return next(new Error('no store associated with socket'));
      }
    };

    const io = _socket2.default.listen(server);
    io.adapter((0, _socket4.default)({
      pubClient: pub,
      subClient: sub
    }));

    this.store = store;
    this.io = io.of(namespace);
    this.events = new SocketEvents();

    this.io.on('connection', this.addClient);
    this.io.on('disconnecting', reason => {
      debug('disconnecting: ', reason);
    });
    this.io.use(this.handshake);
    this.io.use(this.redux);
  }

  getClients() {
    this.adapter.clients(function (error, clients) {
      console.log('clientsx:', clients);
    });
  }

};
let GenericSocket = class GenericSocket {

  constructor(server, store, namespace = '/') {
    this.handshake = (socket, next) => {
      const token = socket.handshake.query.token;
      if (token) {
        socket.user = {
          token: token
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

    this.disconnecting = reason => {
      debug('disconnecting: ', reason);
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

    this.io.on('disconnecting', this.disconnecting);
  }

  getClients() {
    this.adapter.clients(function (error, clients) {
      return clients;
    });
  }

};
let ScreenSocket = exports.ScreenSocket = class ScreenSocket extends GenericSocket {
  constructor(...args) {
    var _temp;

    (_temp = super(...args), this.addClient = socket => {
      let client = new SocketClient(this.io, socket);
      return client;
    }, _temp)[(this.server, this.store, this.namespace)] = args;
    this.io.on('connection', this.addClient);
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