import {List, Record, Map} from 'immutable';

const Screen = Record({
  id: null,
  title: null
})

const initialState = List([]);

export default function Screens(state = initialState, action) {
  let getIndex = id => {
    // Get item by id
    return state.findIndex(item => ( item.get('id') === id) );
  };

  switch (action.type) {
    case 'ADD_SCREEN': {
      let screen = new Screen();
      return state.push(screen.merge(action.payload));
    }

    case 'EDIT_SCREEN': {
      let index = getIndex(action.id);
      if (index > -1) {
        return state.update(index, item => ( item.merge(Map(action.payload)) ));
      } else {
        return state;
      }
    }

    case 'SET_POSTER_SCREEN': {
      let index = getIndex(action.id);
      if (index > -1) {
        return state.update(index, item => ( item.set('poster', action.payload) ));
      } else {
        return state;
      }
    }

    default:
      return state
  }
}
