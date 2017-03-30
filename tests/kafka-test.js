//import server from '../app/app'
import { expect } from 'chai'
import supertest from 'supertest'
import io from 'socket.io-client'
import config from 'config'
import Chance from 'chance'
import proxyquire from 'proxyquire'
import { EventEmitter } from 'events'

const chance = new Chance()

// create single EventEmitter instance
class KafkaEvents extends EventEmitter {
  constructor(...args) {
    super(...args);
  }
}

// Mock a class to override lokka methods
class MockedConsumerGroup {
  constructor (store) {
    assert.isObject(store)
    this.store = store
    this.events = new KafkaEvents()
    setTimeout(() => {
      this.events.emit('connect', {})
    }, 500)
  }

  getLatestOffsets () {
    return { 'screen-broadcast': { '0': [ 999 ] } }
  }

  getOffset () {
    return { 'screen-broadcast': { '0': [ 999 ] } }
  }
}

// Proxy this dependency
proxyquire.noCallThru();
const app = proxyquire('../app/app', {
  './ConsumerGroup': MockedConsumerGroup
});
const store = app.store
const server = app.server
const request = supertest(server)

describe('Test socket connection', function() {
  it('it should GET', (done) => {
    request
      .get('/api')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, response) {
        if (error) throw error;
        expect(response.body).to.be.a('object')
        return done()
      })
  })

  it('listens for store action', function (done) {
    let removeActionListener = store.addActionListener('MESSAGE', () => {
      console.log('track', 'ADD_SCREEN');
      removeActionListener()
      return done()
    })
    store.dispatch({
      type: 'MESSAGE',
      payload: new Date()
    })
  })

  it('connect and echo a message', function (done) {
    const options = {
      transports: ['websocket'],
      'force new connection': true,
      'query': {
        'id': chance.hash({length: 5, casing: 'upper'}),
        'token': chance.hash()
      }
    }
    const client = io.connect(`http://${config.service.host}:${config.service.port}/screen`, options);
    client.once('connect', function () {
      // Listen echoed messages
      client.once('echo', function (message) {
        expect(message).to.be.a('string')
        expect(message).to.equal('Hello World')
        client.disconnect()
      })
      // Disconnect event
      client.once('disconnect', function (reason) {
        expect(reason).to.be.a('string')
        expect(reason).to.equal('io client disconnect')
        return done()
      })
      // Send echo message
      client.emit('echo', 'Hello World')
    })
  })


  const join = function (id) {

    let queryId = chance.hash({length: 5, casing: 'upper'})
    const options = {
      transports: ['websocket'],
      'force new connection': true,
      'query': {
        'id': queryId,
        'token': chance.hash()
      }
    }

    return new Promise((resolve, reject) => {
      const client = io.connect(`http://${config.service.host}:${config.service.port}/screen`, options)
      const handleConnect = function () {
        const action = {
          type: 'MESSAGE',
          payload: {
            query: {
              id: queryId
            }
          }
        }

        client.once('echo', message => {
          console.log('echo', message)
        })

        client.once(action.type, function (payload) {
          expect(payload).to.be.a('object')
          client.disconnect()
          return resolve()
        })

        // Join the channer where actions are dispatched
        client.emit('join', {
          name: 'notification'
        })

        // Dispatch the action once joined the room
        client.once('joined', function (message) {
          store.dispatch(action)
        })
      }
      // Handle connection
      client.once('connect', handleConnect)
    })
  }

  it('Connect 10 clients and receive an action on a room', function (done) {
    var clients = Array.from({length: 10}, (v, k) => k+1).map(client => {
      return join(client)
    })
    Promise.all(clients)
    .then(() => done())
    .catch(done)

    const action = {
      type: 'MESSAGE',
      payload: 'hello all of you'
    }
    store.dispatch(action)
  })

  it('joins and leaves a room', function (done) {
    const options = {
      transports: ['websocket'],
      'force new connection': true,
      'query': {
        'id': chance.hash({length: 5, casing: 'upper'}),
        'token': chance.hash()
      }
    }

    const client = io.connect(`http://${config.service.host}:${config.service.port}/screen`, options)
    client.once('connect', function () {
      // client joins room
      client.once('joined', function (message) {
        expect(message).to.be.a('string')
        setTimeout(function () {
          client.emit('leave', {
            name: 'notification'
          })
        }, 1000)
      })
      // Client leaves room
      client.once('leaved', function (message) {
        expect(message).to.be.a('string')
        client.disconnect()
        return done()
      })

      // Join the channer where actions are dispatched
      client.emit('join', {
        name: 'notification'
      })
    })
  })

  it('join "notification" room, and waits for an action', function (done) {

    return done()
    const options = {
      'query': {
        'id': chance.hash({length: 5, casing: 'upper'}),
        'token': chance.hash()
      }
    }
    const client = io.connect(`http://${config.service.host}:${config.service.port}/screen`, options)
    client.once('connect', function () {
      let action = {
        type: 'MESSAGE',
        payload: new Date()
      }

      client.once(action.type, function (payload) {
        console.log('message: ', JSON.stringify(payload,0,2))
        expect(payload).to.be.a('string')
        return done()
      })

      // Join the channer where actions are dispatched
      client.emit('join', {
        name: 'notification'
      })

      // Dispatch the action once joined the room
      client.once('joined', function (message) {
        expect(message).to.be.a('string')
        store.dispatch(action)
      })

    })
  })

  it('An action triggers a screen data reload', function (done) {

    const options = {
      'query': {
        'id': 'my-id',
        'token': chance.hash()
      }
    }

    const client = io.connect(`http://${config.service.host}:${config.service.port}/screen`, options)
    client.once('connect', function () {
      let action = {
        type: 'RELOAD',
        payload: {
          query: {
            id: 'my-id'
          }
        }
      }

      client.once(action.type, function (payload) {
        expect(payload).to.be.a('object')
        client.disconnect()
        return done()
      })

      store.dispatch(action)
    })
  })
})
