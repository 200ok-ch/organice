import { Dropbox } from 'dropbox';

import { fromJS } from 'immutable';

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
    const dropbox = new Dropbox({ accessToken: getState().syncBackend.get('dropboxAccessToken') });

    dispatch(setLoadingMessage('Getting listing...'));
    dropbox.filesListFolder({ path }).then(response => {
      const directoryListing = fromJS(response.entries.map(entry => ({
        id: entry.id,
        name: entry.name,
        isDirectory: entry['.tag'] === 'folder',
        path: entry.path_display,
      })));

      dispatch(setCurrentFileBrowserDirectoryListing(path, directoryListing));
      dispatch(hideLoadingMessage());
    }).catch(error => {
      console.error('There was an error retrieving files!');
      console.error(error);
    });
  };
};

export const pushBackup = (path, contents) => {
  return (dispatch, getState) => {
    const dropbox = new Dropbox({ accessToken: getState().syncBackend.get('dropboxAccessToken') });

    dropbox.filesUpload({
      path: `${path}.org-web-bak`,
      contents,
      mode: {
        '.tag': 'overwrite',
      },
      autorename: true,
    });
  };
};

export const downloadFile = path => {
  return (dispatch, getState) => {
    const dropbox = new Dropbox({ accessToken: getState().syncBackend.get('dropboxAccessToken') });

    dispatch(setLoadingMessage('Downloading file...'));

    dropbox.filesDownload({ path }).then(response => {
      const reader = new FileReader();
      reader.addEventListener('loadend', () => {
        dispatch(displayFile(path, reader.result));
        dispatch(applyOpennessState());
        dispatch(hideLoadingMessage());
        dispatch(pushBackup(path, reader.result));
        dispatch(setDirty(false));
        dispatch(setLastSyncAt(moment()));
      });
      reader.readAsText(response.fileBlob);
    });
  };
};
