import { combineReducers } from 'redux';
import undoable, { includeAction, ActionCreators, ActionTypes } from 'redux-undo';

import baseReducer from './base';
import syncBackendReducer from './sync_backend';
import orgReducer from './org';
import captureReducer from './capture';
import { setDirty, sync } from '../actions/org';

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
  'REMOVE_TABLE_ROW',
  'REMOVE_TABLE_COLUMN',
  'UPDATE_TABLE_CELL_VALUE',
  'MOVE_TABLE_ROW_DOWN',
  'MOVE_TABLE_ROW_UP',
  'MOVE_TABLE_COLUMN_LEFT',
  'MOVE_TABLE_COLUMN_RIGHT',
  'INSERT_CAPTURE',
  'REFILE_SUBTREE',
  'SET_HEADER_TAGS',
  'UPDATE_PROPERTY_LIST_ITEMS',
  'ADD_NEW_PLANNING_ITEM',
  'REMOVE_PLANNING_ITEM',
  'CREATE_LOG_ENTRY_START',
  'SET_LOG_ENTRY_STOP',
];

// INFO: An `undo` in organice is always related to changing the Org
// file structure. Hence, it is necessary to trigger a `sync` action.
// This needs a little extra work, because this `sync` would result in
// a conflict: The state is now in the `past` the Org file has been
// synchronized in the `future`. Hence the `lastModifiedAt` timestamp
// will be in the future and organice won't see a reason to push. Even
// if we wanted to push, organice would show the 'conflict' modal,
// because the remote file is newer. For this reason, when doing an
// 'undo', organice will suppress this modal and 'force' a push. We
// don't want the user to need to understand that an 'undo' means
// moving to the past and the conflict has been created by herself in
// the future (which in real life might have been seconds ago).

// Implementation: Override the redux-undo `undo` and `redo` action creators. Additionally to the redux `undo`, they will force a sync, always.
ActionCreators.undo = function () {
  return (dispatch) => {
    dispatch({ type: ActionTypes.UNDO });
    dispatch(setDirty(true));
    dispatch(sync({ forceAction: 'push' }));
  };
};

ActionCreators.redo = function () {
  return (dispatch) => {
    dispatch({ type: ActionTypes.REDO });
    dispatch(setDirty(true));
    dispatch(sync({ forceAction: 'push' }));
  };
};

export default combineReducers({
  base: baseReducer,
  syncBackend: syncBackendReducer,
  org: undoable(orgReducer, {
    filter: includeAction(UNDOABLE_ACTIONS),
  }),
  capture: captureReducer,
});
