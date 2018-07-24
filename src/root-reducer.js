import { combineReducers } from 'redux';

import { Map } from 'immutable';

export default combineReducers({
  auth: (state = new Map(), action) => {
    switch (action.type) {
    default:
      return state;
    }
  },
});
