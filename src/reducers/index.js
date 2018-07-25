import { combineReducers } from 'redux';

import baseReducer from './base';
import dropboxReducer from './dropbox';
import orgReducer from './org';

export default combineReducers({
  base: baseReducer,
  dropbox: dropboxReducer,
  org: orgReducer,
});
