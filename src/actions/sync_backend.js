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

export const setCurrentFileBrowserDirectoryListing = (directoryListing, hasMore, additionalSyncBackendState) => {
  return {
    type: 'SET_CURRENT_FILE_BROWSER_DIRECTORY_LISTING',
    directoryListing, hasMore, additionalSyncBackendState,
  };
};

export const setIsLoadingMoreDirectoryListing = isLoadingMore => ({
  type: 'SET_IS_LOADING_MORE_DIRECTORY_LISTING', isLoadingMore,
});

export const getDirectoryListing = path => (
  (dispatch, getState) => {
    dispatch(setLoadingMessage('Getting listing...'));

    const client = getState().syncBackend.get('client');
    client.getDirectoryListing(path).then(({ listing, hasMore, additionalSyncBackendState }) => {
      dispatch(setCurrentFileBrowserDirectoryListing(listing, hasMore, additionalSyncBackendState));
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
    client.getMoreDirectoryListing(currentFileBrowserDirectoryListing.get('additionalSyncBackendState')).then(({ listing, hasMore, additionalSyncBackendState }) => {
      const extendedListing = currentFileBrowserDirectoryListing.get('listing').concat(listing);
      dispatch(setCurrentFileBrowserDirectoryListing(extendedListing, hasMore, additionalSyncBackendState));
      dispatch(setIsLoadingMoreDirectoryListing(false));
    });
  }
);

export const pushBackup = (pathOrFileId, contents) => {
  return (dispatch, getState) => {
    const client = getState().syncBackend.get('client');
    switch (client.type) {
    case 'Dropbox':
      client.createFile(`${pathOrFileId}.org-web-bak`, contents);
      break;
    case 'Google Drive':
      pathOrFileId = pathOrFileId.startsWith('/') ? pathOrFileId.substr(1) : pathOrFileId;
      client.duplicateFile(pathOrFileId, fileName => `${fileName}.org-web-bak`);
      break;
    default:
    }
  };
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
