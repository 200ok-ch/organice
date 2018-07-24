import { combineReducers } from 'redux';

import { Map } from 'immutable';

export default combineReducers({
  auth: (state = new Map(), action) => {
    switch (action.type) {
    case 'test1':
      return state.set('a', action.value);
    default:
      return state;
    }
  },
});
