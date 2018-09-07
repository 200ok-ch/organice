import createDropboxSyncBackendClient from '../sync_backend_clients/dropbox_sync_backend_client';

import { Map } from 'immutable';

const authenticate = (state, action) => (
  state
    .set('dropboxAccessToken', action.dropboxAccessToken)
    .set('client', createDropboxSyncBackendClient(action.dropboxAccessToken))
);

const signOut = (state, action) => (
  state.set('dropboxAccessToken', null)
);

const setCurrentFileBrowserDirectoryListing = (state, action) => (
  state.set('currentFileBrowserDirectoryListing', action.directoryListing)
);

export default (state = new Map(), action) => {
  switch (action.type) {
  case 'AUTHENTICATE':
    return authenticate(state, action);
  case 'SIGN_OUT':
    return signOut(state, action);
  case 'SET_CURRENT_FILE_BROWSER_DIRECTORY_LISTING':
    return setCurrentFileBrowserDirectoryListing(state, action);
  default:
    return state;
  }
};
