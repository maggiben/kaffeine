'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Screens;

var _immutable = require('immutable');

const Screen = (0, _immutable.Record)({
  id: null,
  token: null,
  title: null,
  options: null,
  filters: null,
  data: null,
  createdAt: new Date(),
  poster: {
    title: null,
    thumbnail: null,
    owner: {
      enterpriseGuid: null,
      organizationName: null
    }
  },
  filters: [],
  channels: []
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

    case 'MESSAGE':
      {
        return state;
      }

    case 'RELOAD':
      {
        return state;
      }

    default:
      return state;
  }
}