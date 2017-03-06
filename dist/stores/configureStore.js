'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = configureStore;

var _redux = require('redux');

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

var _reducers = require('../reducers');

var reducers = _interopRequireWildcard(_reducers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const reducer = (0, _redux.combineReducers)(_extends({}, reducers));

function actionListenersStoreEnhancer(createStore) {
  return (reducer, initialState, enhancer) => {
    const actionListeners = {};
    const store = createStore(reducer, initialState, enhancer);
    const dispatch = store.dispatch;
    store.dispatch = action => {
      const result = dispatch(action);
      if (typeof action === 'object' && action.type && actionListeners[action.type]) {
        actionListeners[action.type].forEach(listener => listener(action));
      }
      return result;
    };
    store.addActionListener = (actionType, listener) => {
      actionListeners[actionType] = (actionListeners[actionType] || []).concat(listener);
      return () => {
        actionListeners[actionType] = actionListeners[actionType].filter(l => l !== listener);
      };
    };
    return store;
  };
}

const enhancer = (0, _redux.compose)((0, _redux.applyMiddleware)(_reduxThunk2.default), actionListenersStoreEnhancer, (0, _redux.applyMiddleware)(function ({ dispatch, getState }) {
  return next => action => {
    console.log('will dispatch', action);

    let returnValue = next(action);

    console.log('state after dispatch', getState());

    return returnValue;
  };
}));

function configureStore(initialState) {
  return (0, _redux.createStore)(reducer, initialState, enhancer);
}