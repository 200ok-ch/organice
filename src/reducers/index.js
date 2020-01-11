import { combineReducers } from 'redux';
import undoable, { includeAction } from 'redux-undo';

import baseReducer from './base';
import syncBackendReducer from './sync_backend';
import orgReducer from './org';
import captureReducer from './capture';

const UNDOABLE_ACTIONS = [
  'ADD_HEADER',
  'REMOVE_HEADER',
  'MOVE_HEADER_UP',
  'MOVE_HEADER_DOWN',
  'MOVE_HEADER_LEFT',
  'MOVE_HEADER_RIGHT',
  'MOVE_SUBTREE_LEFT',
  'MOVE_SUBTREE_RIGHT',
  'ADVANCE_TODO_STATE',
  'UPDATE_HEADER_TITLE',
  'UPDATE_HEADER_DESCRIPTION',
  'ADD_NEW_TABLE_ROW',
  'ADD_NEW_TABLE_COLUMN',
  'MOVE_TABLE_ROW_DOWN',
  'MOVE_TABLE_ROW_UP',
  'MOVE_TABLE_COLUMN_LEFT',
  'MOVE_TABLE_COLUMN_RIGHT',
  'INSERT_CAPTURE',
  'REFILE_SUBTREE',
  'SET_HEADER_TAGS',
];

export default combineReducers({
  base: baseReducer,
  syncBackend: syncBackendReducer,
  org: undoable(orgReducer, {
    filter: includeAction(UNDOABLE_ACTIONS),
  }),
  capture: captureReducer,
});
