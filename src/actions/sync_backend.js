import { setLoadingMessage, hideLoadingMessage, popModalPage } from './base';
import { displayFile, applyOpennessState, setDirty, setLastSyncAt } from './org';

import moment from 'moment';

export const authenticate = dropboxAccessToken => ({
  type: 'AUTHENTICATE',
  dropboxAccessToken,
});

export const signOut = () => (
  (dispatch, getState) => {
    dispatch({ type: 'SIGN_OUT' });
    dispatch(popModalPage());
  }
);

export const setCurrentFileBrowserDirectoryListing = (directoryPath, directoryListing) => {
  return {
    type: 'SET_CURRENT_FILE_BROWSER_DIRECTORY_LISTING',
    directoryPath,
    directoryListing
  };
};

export const getDirectoryListing = path => {
  return (dispatch, getState) => {
    dispatch(setLoadingMessage('Getting listing...'));

    getState().syncBackend.get('client').getDirectoryListing(path).then(listing => {
      dispatch(setCurrentFileBrowserDirectoryListing(path, listing));
      dispatch(hideLoadingMessage());
    }).catch(error => {
      alert('There was an error retrieving files!');
      console.error(error);
      dispatch(hideLoadingMessage());
    });
  };
};

export const pushBackup = (path, contents) => {
  return (dispatch, getState) => (
    getState().syncBackend.get('client').uploadFile(`${path}.org-web-bak`, contents)
  );
};

export const downloadFile = path => {
  return (dispatch, getState) => {
    dispatch(setLoadingMessage('Downloading file...'));

    getState().syncBackend.get('client').getFileContents(path).then(fileContents => {
      dispatch(displayFile(path, fileContents));
      dispatch(applyOpennessState());
      dispatch(hideLoadingMessage());
      dispatch(pushBackup(path, fileContents));
      dispatch(setDirty(false));
      dispatch(setLastSyncAt(moment()));
    });
  };
};
