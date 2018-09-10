/* global gapi */

import { setLoadingMessage, hideLoadingMessage, popModalPage } from './base';
import { displayFile, applyOpennessState, setDirty, setLastSyncAt } from './org';
import { persistField } from '../util/settings_persister';

import moment from 'moment';

export const authenticate = (syncBackendType, dropboxAccessToken = null) => ({
  type: 'AUTHENTICATE',
  syncBackendType,
  dropboxAccessToken,
});

export const signOut = () => (
  (dispatch, getState) => {
    switch (getState().syncBackend.get('client').type) {
    case 'Dropbox':
      persistField('dropboxAccessToken', null);
      break;
    case 'Google Drive':
      gapi.auth2.getAuthInstance().signOut();
      break;
    default:
    }

    dispatch({ type: 'SIGN_OUT' });
    dispatch(popModalPage());
  }
);

export const setCurrentFileBrowserDirectoryListing = (directoryListing, hasMore, cursor) => {
  return {
    type: 'SET_CURRENT_FILE_BROWSER_DIRECTORY_LISTING',
    directoryListing, hasMore, cursor,
  };
};

export const setIsLoadingMoreDirectoryListing = isLoadingMore => ({
  type: 'SET_IS_LOADING_MORE_DIRECTORY_LISTING', isLoadingMore,
});

export const getDirectoryListing = path => (
  (dispatch, getState) => {
    dispatch(setLoadingMessage('Getting listing...'));

    const client = getState().syncBackend.get('client');
    client.getDirectoryListing(path).then(({ listing, hasMore, cursor }) => {
      dispatch(setCurrentFileBrowserDirectoryListing(listing, hasMore, cursor));
      dispatch(hideLoadingMessage());
    }).catch(error => {
      alert('There was an error retrieving files!');
      console.error(error);
      dispatch(hideLoadingMessage());
    });
  }
);

export const loadMoreDirectoryListing = () => (
  (dispatch, getState) => {
    dispatch(setIsLoadingMoreDirectoryListing(true));

    const client = getState().syncBackend.get('client');
    const currentFileBrowserDirectoryListing = getState().syncBackend.get('currentFileBrowserDirectoryListing');
    client.getMoreDirectoryListing(currentFileBrowserDirectoryListing.get('cursor')).then(({ listing, hasMore, cursor }) => {
      const extendedListing = currentFileBrowserDirectoryListing.get('listing').concat(listing);
      dispatch(setCurrentFileBrowserDirectoryListing(extendedListing, hasMore, cursor));
      dispatch(setIsLoadingMoreDirectoryListing(false));
    });
  }
);

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
