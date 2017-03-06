'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

var _chance = require('chance');

var _chance2 = _interopRequireDefault(_chance);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const chance = new _chance2.default();
const router = _express2.default.Router();

router.get('/', function (request, response) {
  console.log(response.store.getState());
  const { store } = response;
  store.dispatch({
    type: 'ADD_SCREEN',
    payload: {
      id: '12345',
      title: 'hello'
    }
  });
  response.json({
    date: new Date(),
    state: store.getState()
  });
});

router.post('/', function (request, response) {
  const { store } = response;
  const id = (0, _v2.default)();

  store.dispatch({
    type: 'ADD_SCREEN',
    payload: {
      id: id,
      title: chance.word()
    }
  });
  response.json({
    id: id
  });
});
exports.default = router;