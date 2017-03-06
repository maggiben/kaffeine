import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
/* reducers */
import * as reducers from '../reducers';

const reducer = combineReducers({
  ...reducers
})

function actionListenersStoreEnhancer(createStore) {
  return (reducer, initialState, enhancer) => {
    const actionListeners = {};
    const store = createStore(reducer, initialState, enhancer);
    const dispatch = store.dispatch;
    store.dispatch = (action) => {
      const result = dispatch(action);
      if (typeof action === 'object' && action.type && actionListeners[action.type]) {
        actionListeners[action.type].forEach((listener) => listener(action));
      }
      return result;
    };
    store.addActionListener = (actionType, listener) => {
      actionListeners[actionType] = (actionListeners[actionType] || []).concat(listener);
      return () => {
        actionListeners[actionType] = actionListeners[actionType].filter((l) => l !== listener);
      };
    };
    return store;
  };
}

const enhancer = compose(
  applyMiddleware(thunk),
  actionListenersStoreEnhancer,
  applyMiddleware(function ({ dispatch, getState }) {
    return (next) => (action) => {
      console.log('will dispatch', action)
      // Call the next dispatch method in the middleware chain.
      let returnValue = next(action)

      console.log('state after dispatch', getState())

      // This will likely be the action itself, unless
      // a middleware further in chain changed it.
      return returnValue
    }
  })
)

export default function configureStore(initialState) {
  return createStore(reducer, initialState, enhancer)
}

/*V1etn4mi
Pl4s1cos*/
