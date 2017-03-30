import socketio from 'socket.io'
import { version } from '../package.json'
import { createClient } from 'redis'
import adapter from 'socket.io-redis'
import { EventEmitter } from 'events'
import config from 'config'
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


// export class Socket {

//   constructor (server, store, namespace = '/') {
//     // Setup Adapter
//     const io = socketio.listen(server)
//     io.adapter(adapter({
//       pubClient: pub,
//       subClient: sub
//     }))

//     this.store = store
//     this.io = io.of(namespace)
//     this.events = new SocketEvents()

//     /*io.on('connection', function (socket) {
//       io.of('/').adapter.clients(function (error, clients) {
//         console.log('clientsx:', clients) // an array containing all connected socket ids
//       })
//       let client = new SocketClient(io, socket)
//     })
//     */

//     this.io.on('connection', this.addClient)
//     this.io.on('disconnecting', reason => {
//       debug('disconnecting: ', reason)
//     })
//     this.io.use(this.handshake)
//     this.io.use(this.redux)
//   }

//   addClient = socket => {
//     let client = new SocketClient(this.io, socket)
//     return client
//   }

//   getClients () {
//     this.adapter.clients(function (error, clients) {
//       console.log('clientsx:', clients) // an array containing all connected socket ids
//     })
//   }

//   handshake = (socket, next) => {
//     const token = socket.handshake.query.token
//     if(token) {
//       socket.user = {
//         token: token
//       }
//       this.store.dispatch(this.add(token))
//       return next()
//     } else {
//       debug('unauthorized')
//       socket.disconnect('unauthorized')
//       return next(new Error('not authorized'))
//     }
//   }

//   add = (token) => {
//     return function (dispatch, getState) {
//       return dispatch(function () {
//         return new Promise((resolve, reject) => {
//           setTimeout(() => {
//             return resolve()
//           }, 50)
//         })
//       })
//       .then(() => {
//         dispatch({
//           type: 'ADD_SCREEN',
//           payload: {
//             id: token,
//             title: 'nppx'
//           }
//         })
//       })
//     }
//   }

//   provision = async provider => {
//     try {
//       var payload = await provider()
//     } catch (error) {
//       return error
//     }
//   }

//   /*
//     A generic dispatcher takes an action and a query provider then
//     asynchronously produces the query parameters and dispatches an action
//     A query provider migth perform the following actions
//       * Persist the query id and query params on to db
//       * produce a kafka message
//       * emit a socket event
//   */

//   /*
//   genericDispatcher = async (action, queryProvider) => {
//     return function (dispatch, getState) {
//       let state = getState()
//       try {
//         var query = await queryProvider()
//         return dispatch({
//           type: action,
//           payload: query
//         })
//       } catch (error) {
//         // ...
//       }
//     }
//   }
//   */

//   redux = (socket, next) => {
//     if(this.store) {
//       socket.store = this.store
//       return next()
//     } else {
//       debug('no store associated with socket')
//       return next(new Error('no store associated with socket'))
//     }
//   }
// }


class SocketClient {
  constructor (io, socket, store) {
    this.actions = ['MESSAGE', 'DISPLAY', 'SEND', 'REFRESH', 'RELOAD']
    this.events = ['disconnect', 'echo', 'ping', 'join', 'leave']
    this.io = io
    this.socket = socket
    this.store = store

    // Socket listeners
    this.events.map(event => {
      return this.socket.on(event, this[event])
    })

    // Store listeners
    this.removeActionListeners = this.actions.map(action => this.store.addActionListener(action, action => {
      let { query } = action.payload
      if(query && query.id === this.socket.user.id) {
        debug('store action', action.type)
        this.socket.emit(action.type, action.payload)
      }
    }))
  }

  disconnect = reason => {
    debug('disconnect:', this.socket.id)
    this.socket.removeAllListeners()
    this.removeActionListeners.map(removeActionListener => {
      removeActionListener()
    })
  }

  echo = message => {
    debug('echo:', message)
    this.socket.emit('echo', message)
  }

  ping = () => {
    debug('ping')
    this.socket.emit('pong', version)
  }

  join = options => {
    debug('ping')
    let exists = rooms.some(room => (room.name === options.name))
    if(!exists) {
      this.socket.emit('fail', 'not found')
    }

    this.io.adapter.remoteJoin(this.socket.id, options.name, error => {
      if (error) {
        debug('unknown id')
        return
      }
      this.socket.emit('joined', options.name)
    })
  }

  leave = options => {
    debug('leave')
    let exists = rooms.some(room => (room.name === options.name))
    if(!exists) {
      this.socket.emit('fail', 'not found')
    }

    this.io.adapter.remoteLeave(this.socket.id, options.name, error => {
      if (error) {
        debug('unknown id')
        return
      }
      this.socket.emit('leaved', options.name)
    })
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
    // Redux store
    this.store = store
    // middlewares
    this.io.use(this.handshake)
    this.io.use(this.redux)
  }

  getClients () {
    return new Promise((resolve, reject) => {
      this.adapter.clients(function (error, clients) {
        if(error) {
          return reject(error)
        }
        // an array containing all connected socket ids
        return resolve(clients)
      })
    })
  }

  handshake = (socket, next) => {
    const token = socket.handshake.query.token
    const id = socket.handshake.query.id
    if(token) {
      socket.user = {
        token: token,
        id: id
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
}

export class ScreenSocket extends GenericSocket {
  constructor(...args) {
    super(...args)
    [this.server, this.store, this.namespace] = args;

    this.io.on('connection', this.addClient)


    this.removeActionListeners = ['MESSAGE'].map(action => this.store.addActionListener(action, action => {
      //this.io.to('notification').emit(action.type, action.payload)
    }))

    /*
    const removeActionListener = this.store.addActionListener('MESSAGE', action => {
      this.io.to('notification').emit('banner', action)
    })
    */
  }

  addNotification = action => {
    return this.store.addActionListener(action.type, action => {
      this.io.to('notification').emit(action.type, action.payload)
    })
  }

  addClient = socket => {
    let client = new SocketClient(this.io, socket, this.store)
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
