'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Screens;

var _immutable = require('immutable');

const Screen = (0, _immutable.Record)({
  id: null,
  title: null
});

const initialState = (0, _immutable.List)([]);

function Screens(state = initialState, action) {
  let getIndex = id => {
    return state.findIndex(item => item.get('id') === id);
  };

  switch (action.type) {
    case 'ADD_SCREEN':
      {
        let screen = new Screen();
        return state.push(screen.merge(action.payload));
      }

    case 'EDIT_SCREEN':
      {
        let index = getIndex(action.id);
        if (index > -1) {
          return state.update(index, item => item.merge((0, _immutable.Map)(action.payload)));
        } else {
          return state;
        }
      }

    case 'SET_POSTER_SCREEN':
      {
        let index = getIndex(action.id);
        if (index > -1) {
          return state.update(index, item => item.set('poster', action.payload));
        } else {
          return state;
        }
      }

    default:
      return state;
  }
}