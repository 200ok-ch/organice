import { combineReducers } from 'redux';

import baseReducer from './base';
import dropboxReducer from './dropbox';

export default combineReducers({
  base: baseReducer,
  dropbox: dropboxReducer,
});
