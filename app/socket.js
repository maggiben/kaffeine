import socketio from 'socket.io'
//import redis from 'redis'
//const redis = require('redis')
import { createClient } from 'redis'
import adapter from 'socket.io-redis'
import config from 'config'
import { EventEmitter } from 'events'
import uuid from 'uuid/v4'
const debug = require('debug')('kaffeine:socketio')

// Default rooms
const rooms = [{
  name: 'notification',
  isPrivate: false,
  messages: [],
  notifications: 0,
  canInvite: true,
  users: [],
  allowed: []
}];

const pub = createClient(config.redis.port, config.redis.hostname, {
  //auth_pass: config.redis.credentials.password
})
const sub = createClient(config.redis.port, config.redis.hostname, {
  detect_buffers: true,
  //auth_pass: config.redis.credentials.password
})

class SocketEvents extends EventEmitter {
  constructor(...args) {
    super(...args);
  }
}

class SocketClient {
  constructor (io, socket) {
    this.io = io
    this.socket = socket
    this.db = pub


    this.socket.on('disconnect', this.disconnect)
    this.socket.on('echo', this.echo)
    this.socket.on('join', this.join)
    this.socket.on('banner', this.banner)
    this.db.set('chatio:connections:' + socket.user.token, socket.id)
  }

  disconnect = () => {
    debug('disconnect:', this.socket.id)
  }

  echo = message => {
    debug('echo: ', message)
    this.socket.emit('echo', message)
    /*this.db.get('chatio:connections:' + this.socket.user.token, function (error, reply) {
      console.log("REDIS: ", reply)
    })*/
  }

  join = options => {
    // Create if non existant
    let exists = rooms.some(room => (room.name === options.name))
    // create room
    if(!exists) {
      this.socket.emit('fail', 'not found')
    }
    this.io.adapter.remoteJoin(this.socket.id, 'notification', function (error) {
      if (error) {
        debug('unknown id')
        /* unknown id */
      }
    });
    this.io.to('notification').emit('echo', { message: 'welcome' })
  }

  banner = message => {
    let room = rooms[0];
    /*
    this.io.of('/').adapter.clients(['notification'], (error, clients) => {
      clients.forEach(client => {
        console.log('client: ', client)
        this.io.to(client).emit('banner', { room: room, message: 'sdafasdfadsf' })
      })
    })
    */
    //console.log(this.socket.store.getState())
    this.io.to('notification').emit('banner', { room, message })
  }
  getId = token => {
    return this.socket.emit('screen', {
      id: uuid()
    })
  }
}

export class Socket {

  constructor (server, store, namespace = '/') {
    // Setup Adapter
    const io = socketio.listen(server)
    io.adapter(adapter({
      pubClient: pub,
      subClient: sub
    }))

    this.store = store
    this.io = io.of(namespace)
    this.events = new SocketEvents()

    /*io.on('connection', function (socket) {
      io.of('/').adapter.clients(function (error, clients) {
        console.log('clientsx:', clients) // an array containing all connected socket ids
      })
      let client = new SocketClient(io, socket)
    })
    */

    this.io.on('connection', this.addClient)
    this.io.on('disconnecting', reason => {
      debug('disconnecting: ', reason)
    })
    this.io.use(this.handshake)
    this.io.use(this.redux)
  }

  addClient = socket => {
    let client = new SocketClient(this.io, socket)
    return client
  }

  getClients () {
    this.adapter.clients(function (error, clients) {
      console.log('clientsx:', clients) // an array containing all connected socket ids
    })
  }

  handshake = (socket, next) => {
    const token = socket.handshake.query.token
    if(token) {
      socket.user = {
        token: token
      }
      this.store.dispatch(this.add(token))
      return next()
    } else {
      debug('unauthorized')
      socket.disconnect('unauthorized')
      return next(new Error('not authorized'))
    }
  }

  add = (token) => {
    return function (dispatch, getState) {
      return dispatch(function () {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            return resolve()
          }, 50)
        })
      })
      .then(() => {
        dispatch({
          type: 'ADD_SCREEN',
          payload: {
            id: token,
            title: 'nppx'
          }
        })
      })
    }
  }

  redux = (socket, next) => {
    if(this.store) {
      socket.store = this.store
      return next()
    } else {
      debug('no store associated with socket')
      return next(new Error('no store associated with socket'))
    }
  }
}


class GenericSocket {

  constructor (server, store, namespace = '/') {
    // Setup Adapter
    const io = socketio.listen(server)
    io.adapter(adapter({
      pubClient: pub,
      subClient: sub
    }))

    debug('socket namespace: ', namespace)
    this.io = io.of(namespace)
    this.store = store
    // middlewares
    this.io.use(this.handshake)
    this.io.use(this.redux)
    // listeners
    this.io.on('disconnecting', this.disconnecting)
  }

  getClients () {
    this.adapter.clients(function (error, clients) {
      // an array containing all connected socket ids
      return clients;
    })
  }

  handshake = (socket, next) => {
    const token = socket.handshake.query.token
    if(token) {
      socket.user = {
        token: token
      }
      return next()
    } else {
      socket.disconnect('unauthorized')
      return next(new Error('not authorized'))
    }
  }

  redux = (socket, next) => {
    if(this.store) {
      socket.store = this.store
      return next()
    } else {
      return next(new Error('no store associated with socket'))
    }
  }

  disconnecting = reason => {
    debug('disconnecting: ', reason)
  }
}

export class ScreenSocket extends GenericSocket {
  constructor(...args) {
    super(...args)
    [this.server, this.store, this.namespace] = args;
    this.io.on('connection', this.addClient)
    /*
    const removeActionListener = store.addActionListener('ADD_SCREEN', () => {
      console.log('track', 'ADD_SCREEN');
    })
    */
  }
  addClient = socket => {
    let client = new SocketClient(this.io, socket)
    return client
  }
}

export class RemoteSocket extends GenericSocket {
  constructor(...args) {
    super(...args)
    this.io.on('connection', this.addClient)
  }
  addClient = socket => {
    let client = new RemoteSocketClient(this.io, socket)
    return client
  }
}
