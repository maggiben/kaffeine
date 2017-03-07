import server from '../app/app'
import { expect } from 'chai'
import supertest from 'supertest'
import io from 'socket.io-client'
import config from 'config'
import Chance from 'chance'

const chance = new Chance()
const request = supertest(server)

// mancora

describe('Test socket connection', function() {
  it('it should GET', (done) => {
    request
      .get('/api')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, response) {
        if (error) throw error;
        expect(response.body).to.be.a('object')
        expect(response.body).to.include.keys('date')
        return done()
      })
  })

  it('connect and echo a message', function (done) {
    const options = {
      transports: ['websocket'],
      'force new connection': true,
      'query': {
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

  it('connect multiple clients', function (done) {
    const getOptions = function () {
      return {
        transports: ['websocket'],
        'force new connection': true,
        'query': {
          'token': chance.hash()
        }
      }
    }

    let clientIds = [1,2,3,4]
    function quit (id) {
      let index = clientIds.indexOf(id)
      clientIds.splice(index, 1)
      if(!clientIds.length) {
        return done()
      }
    }

    const clients = clientIds.map(id => {
      const client = io.connect(`http://${config.service.host}:${config.service.port}/screen`, getOptions())
      client.once('echo', function (message) {
        expect(message).to.be.a('string')
        client.disconnect()
      })
      // Disconnect event
      client.once('disconnect', function (reason) {
        expect(reason).to.be.a('string')
        expect(reason).to.equal('io client disconnect')
        quit(id);
      })
      return client;
    })

    clients.forEach(client => {
      client.emit('echo', chance.sentence())
    })
  })

  it('join a wall', function (done) {
    const options = {
      transports: ['websocket'],
      'force new connection': true,
      'query': {
        'token': chance.hash()
      }
    }
    const client = io.connect(`http://${config.service.host}:${config.service.port}/screen`, options)
    client.once('connect', function () {
      // Listen echoed messages
      client.once('banner', function (data) {
        //console.log('banner: ', JSON.stringify(data,0,2))
        expect(data).to.be.a('object')
        expect(data).to.include.keys('message')
        return done()
      })
      client.emit('join', {
        name: 'notification'
      })
      client.emit('banner', 'hola mundo')
    })
  })
})
