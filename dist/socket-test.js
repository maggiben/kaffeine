'use strict';

var _app = require('../app/app');

var _app2 = _interopRequireDefault(_app);

var _chai = require('chai');

var _supertest = require('supertest');

var _supertest2 = _interopRequireDefault(_supertest);

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _chance = require('chance');

var _chance2 = _interopRequireDefault(_chance);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const chance = new _chance2.default();
const request = (0, _supertest2.default)(_app2.default);

describe('Socket Connection', function () {
  it('it should GET', done => {
    request.get('/api').expect('Content-Type', /json/).expect(200).end(function (error, response) {
      if (error) throw error;
      (0, _chai.expect)(response.body).to.be.a('object');
      (0, _chai.expect)(response.body).to.include.keys('date');
      return done();
    });
  });

  it('connect and echo a message', function (done) {
    const options = {
      transports: ['websocket'],
      'force new connection': true,
      'query': {
        'token': chance.hash()
      }
    };
    const client = _socket2.default.connect(`http://${_config2.default.service.host}:${_config2.default.service.port}/screen`, options);
    client.once('connect', function () {
      client.once('echo', function (message) {
        (0, _chai.expect)(message).to.be.a('string');
        (0, _chai.expect)(message).to.equal('Hello World');
        client.disconnect();
      });

      client.once('disconnect', function (reason) {
        (0, _chai.expect)(reason).to.be.a('string');
        (0, _chai.expect)(reason).to.equal('io client disconnect');
        return done();
      });

      client.emit('echo', 'Hello World');
    });
  });

  it('connect multiple clients', function (done) {
    const getOptions = function () {
      return {
        transports: ['websocket'],
        'force new connection': true,
        'query': {
          'token': chance.hash()
        }
      };
    };

    let clientIds = [1, 2, 3, 4];
    function quit(id) {
      let index = clientIds.indexOf(id);
      clientIds.splice(index, 1);
      if (!clientIds.length) {
        return done();
      }
    }

    const clients = clientIds.map(id => {
      const client = _socket2.default.connect(`http://${_config2.default.service.host}:${_config2.default.service.port}/screen`, getOptions());
      client.once('echo', function (message) {
        (0, _chai.expect)(message).to.be.a('string');
        client.disconnect();
      });

      client.once('disconnect', function (reason) {
        (0, _chai.expect)(reason).to.be.a('string');
        (0, _chai.expect)(reason).to.equal('io client disconnect');
        quit(id);
      });
      return client;
    });

    clients.forEach(client => {
      client.emit('echo', chance.sentence());
    });
  });

  it('join a wall', function (done) {
    const options = {
      transports: ['websocket'],
      'force new connection': true,
      'query': {
        'token': chance.hash()
      }
    };
    const client = _socket2.default.connect(`http://${_config2.default.service.host}:${_config2.default.service.port}/screen`, options);
    client.once('connect', function () {
      client.once('banner', function (data) {
        console.log('banner: ', data);
        (0, _chai.expect)(data).to.be.a('object');
        (0, _chai.expect)(data).to.include.keys('message');
        return done();
      });
      client.emit('join', {
        name: 'notification'
      });
      client.emit('banner', 'hola mundo');
    });
  });
});