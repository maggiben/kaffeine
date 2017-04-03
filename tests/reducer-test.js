/*
  Test Async Action Creators
*/

import supertest from 'supertest'
import io from 'socket.io-client'
import config from 'config'
import Chance from 'chance'
import proxyquire from 'proxyquire'
import { EventEmitter } from 'events'
import configureStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import chai from 'chai'
import redis from 'redis-mock'

import * as actions from '../app/actions/ScreenActions'
import * as types from '../app/constants/ActionTypes'

chai.use(require('chai-as-promised'))
chai.use(require('chai-json-schema'))
const should = chai.should();
const expect = chai.expect
const assert = chai.assert

// Chance
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
const middlewares = [thunk] // add your middlewares like `redux-thunk`
const mockStore = configureStore(middlewares)

const FSA = {
  title: 'FSA',
  type: 'array',
  minItems: 1,
  uniqueItems: true,
  items: {
    type: 'object',
    required: ['type'],
    properties: {
      type: {
        type: 'string'
      },
      payload: {
        type: 'object'
      },
      error: {
        type: 'object'
      },
      meta: {
        type: 'object'
      }
    }
  }
}

it('should provision a screen', () => {

  const expectedActions = [
    { type: types.PROVISION_SCREEN_REQUEST, payload: {} }
  ]

  const store = mockStore({})

  // Return the promise
  return store.dispatch(actions.provisionScreen({}))
  .then(() => {
    const actions = store.getActions()
    expect(actions).to.be.jsonSchema(FSA);
    expect(actions).to.deep.equal(expectedActions)
  })
})

it('stores a key in redis', () => {
  const client = redis.createClient()
  client.setex('benja', 10, 20)
})

it('reads a key in redis', done => {
  const client = redis.createClient()
  client.get('benja', function(error, result) {
    console.log(result)
    return done()
  })
})
