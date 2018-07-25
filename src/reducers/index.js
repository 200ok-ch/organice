import { combineReducers } from 'redux';

import dropboxReducer from './dropbox';

export default combineReducers({
  dropbox: dropboxReducer,
});
