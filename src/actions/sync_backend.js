/* global gapi */

import { setLoadingMessage, hideLoadingMessage, popModalPage } from './base';
import { displayFile, applyOpennessState, setDirty, setLastSyncAt } from './org';
import { persistField, loadSettingsFromConfigFile } from '../util/settings_persister';
import createDropboxSyncBackendClient from '../sync_backend_clients/dropbox_sync_backend_client';
import createGoogleDriveSyncBackendClient from '../sync_backend_clients/google_drive_sync_backend_client';

import moment from 'moment';

export const authenticate = (syncBackendType, dropboxAccessToken = null) => (
  (dispatch, getState) => {
    let client = null;
    switch (syncBackendType) {
    case 'Dropbox':
      client = createDropboxSyncBackendClient(dropboxAccessToken);
      break;
    case 'Google Drive':
      client = createGoogleDriveSyncBackendClient();
      client.isSignedIn().then(isSignedIn => {
        console.log("isSignedIn = ", isSignedIn);
        if (isSignedIn) {
          loadSettingsFromConfigFile(dispatch, getState);
        } else {
          dispatch(signOut());
        }
      });
      break;
    default:
      console.error(`Unrecognized sync backend type in authenticate "${syncBackendType}"`);
    }

    dispatch({ type: 'AUTHENTICATE', client });
  }
);

export const signOut = () => (
  (dispatch, getState) => {
    switch (getState().syncBackend.get('client', {}).type) {
    case 'Dropbox':
      persistField('dropboxAccessToken', null);
      break;
    case 'Google Drive':
      gapi.auth2.getAuthInstance().signOut();
      break;
    default:
    }

    persistField('authenticatedSyncService', null);

    dispatch({ type: 'SIGN_OUT' });
    // TODO: probably want to clear the whole modal stack here.
    dispatch(popModalPage());
  }
);

export const setCurrentFileBrowserDirectoryListing = (directoryListing, hasMore, additionalSyncBackendState) => ({
  type: 'SET_CURRENT_FILE_BROWSER_DIRECTORY_LISTING',
  directoryListing, hasMore, additionalSyncBackendState,
});

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
