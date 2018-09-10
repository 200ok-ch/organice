import createDropboxSyncBackendClient from '../sync_backend_clients/dropbox_sync_backend_client';
import createGoogleDriveSyncBackendClient from '../sync_backend_clients/google_drive_sync_backend_client';

import { Map } from 'immutable';

const authenticate = (state, action) => {
  let client = null;
  switch (action.syncBackendType) {
  case 'Dropbox':
    client = createDropboxSyncBackendClient(action.dropboxAccessToken);
    break;
  case 'Google Drive':
    client = createGoogleDriveSyncBackendClient();
    break;
  default:
    console.error(`Unrecognized sync backend type in authenticate "${action.syncBackendType}"`);
    return state;
  }

  return state
    .set('isAuthenticated', true)
    .set('client', client);
};

const signOut = (state, action) => (
  state
    .set('isAuthenticated', false)
    .set('client', null)
);

const setCurrentFileBrowserDirectoryListing = (state, action) => (
  state.set('currentFileBrowserDirectoryListing', Map({
    listing: action.directoryListing,
    hasMore: action.hasMore,
    cursor: action.cursor,
  }))
);

const setIsLoadingMoreDirectoryListing = (state, action) => (
  state.update('currentFileBrowserDirectoryListing', currentFileBrowserDirectoryListing => (
    !!currentFileBrowserDirectoryListing ? currentFileBrowserDirectoryListing : Map()
  )).setIn(['currentFileBrowserDirectoryListing', 'isLoadingMore'], action.isLoadingMore)
);

export default (state = new Map(), action) => {
  switch (action.type) {
  case 'AUTHENTICATE':
    return authenticate(state, action);
  case 'SIGN_OUT':
    return signOut(state, action);
  case 'SET_CURRENT_FILE_BROWSER_DIRECTORY_LISTING':
    return setCurrentFileBrowserDirectoryListing(state, action);
  case 'SET_IS_LOADING_MORE_DIRECTORY_LISTING':
    return setIsLoadingMoreDirectoryListing(state, action);
  default:
    return state;
  }
};
