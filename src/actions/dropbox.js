import { Dropbox } from 'dropbox';

import { fromJS } from 'immutable';

import { setLoadingMessage, hideLoadingMessage } from './base';
import { displayFile } from './org';

import exportOrg from '../lib/export_org';

const getDropboxClient = getState => (
  new Dropbox({ accessToken: getState().dropbox.get('accessToken') })
);

export const authenticate = accessToken => ({
  type: 'AUTHENTICATE',
  accessToken,
});

export const signOut = () => ({
  type: 'SIGN_OUT',
});

export const setCurrentFileBrowserDirectoryListing = (directoryPath, directoryListing) => {
  return {
    type: 'SET_CURRENT_FILE_BROWSER_DIRECTORY_LISTING',
    directoryPath,
    directoryListing
  };
};

export const getDirectoryListing = path => {
  return (dispatch, getState) => {
    const dropbox = new Dropbox({ accessToken: getState().dropbox.get('accessToken') });

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
    const dropbox = new Dropbox({ accessToken: getState().dropbox.get('accessToken') });

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
    const dropbox = new Dropbox({ accessToken: getState().dropbox.get('accessToken') });

    dispatch(setLoadingMessage('Downloading file...'));

    dropbox.filesDownload({ path }).then(response => {
      const reader = new FileReader();
      reader.addEventListener('loadend', () => {
        dispatch(displayFile(path, reader.result));
        dispatch(hideLoadingMessage());
        dispatch(pushBackup(path, reader.result));
      });
      reader.readAsText(response.fileBlob);
    });
  };
};

export const pushCurrentFile = () => {
  return (dispatch, getState) => {
    const contents = exportOrg(getState().org.present.get('headers'),
                               getState().org.present.get('todoKeywordSets'));
    const path = getState().org.present.get('path');

    dispatch(setLoadingMessage('Pushing...'));
    const dropbox = getDropboxClient(getState);
    dropbox.filesUpload({
      path, contents,
      mode: {
        '.tag': 'overwrite',
      },
      autorename: true,
    }).then(response => {
      dispatch(hideLoadingMessage());
    }).catch(error => {
      alert(`There was an error pushing the file: ${error}`);
      dispatch(hideLoadingMessage());
    });
  };
};

export const redownloadCurrentFile = () => {
  return (dispatch, getState) => {
    const path = getState().org.present.get('path');
    dispatch(downloadFile(path));
  };
};
