import { Map } from 'immutable';

const authenticate = (state, action) => (
  state.set('accessToken', action.accessToken)
);

const signOut = (state, action) => (
  state.set('accessToken', null)
);

const setCurrentFileBrowserDirectoryListing = (state, action) => {
  return state
    .set('currentFileBrowserDirectoryPath', action.directoryPath)
    .set('currentFileBrowserDirectoryListing', action.directoryListing);
};

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
