import { ActionCreators } from 'redux-undo';

import { setLoadingMessage, hideLoadingMessage, clearModalStack, setIsLoading } from './base';
import { parseFile, setDirty, setLastSyncAt, setOrgFileErrorMessage } from './org';
import { localStorageAvailable, persistField } from '../util/settings_persister';
import { createGitlabOAuth } from '../sync_backend_clients/gitlab_sync_backend_client';

import { addSeconds } from 'date-fns';

import _ from 'lodash';

import pathParse from 'path-parse';

export const signOut = () => (dispatch, getState) => {
  switch (getState().syncBackend.get('client', {}).type) {
    case 'WebDAV':
      ['Endpoint', 'Username', 'Password'].forEach((e) => {
        persistField('webdav' + e, null);
      });
      break;
    case 'Dropbox':
      // `dropboxAccessToken` is a legacy token that was relevant
      // prior to switching to OAuth 2 and PKCE. Still deleting it
      // here for a consistent state in users localStorage.
      persistField('dropboxAccessToken', null);
      persistField('dropboxRefreshToken', null);
      persistField('codeVerifier', null);
      break;
    case 'GitLab':
      persistField('gitLabProject', null);
      persistField('gitLabHost', null);
      createGitlabOAuth().reset();
      break;
    default:
  }

  persistField('authenticatedSyncService', null);

  dispatch({ type: 'SIGN_OUT' });
  dispatch(clearModalStack());
  dispatch(hideLoadingMessage());

  if (localStorageAvailable) {
    localStorage.clear();
  }
};

export const setCurrentFileBrowserDirectoryListing = (
  directoryListing,
  hasMore,
  additionalSyncBackendState,
  path
) => ({
  type: 'SET_CURRENT_FILE_BROWSER_DIRECTORY_LISTING',
  directoryListing,
  hasMore,
  additionalSyncBackendState,
  path,
});

export const setIsLoadingMoreDirectoryListing = (isLoadingMore) => ({
  type: 'SET_IS_LOADING_MORE_DIRECTORY_LISTING',
  isLoadingMore,
});

export const getDirectoryListing = (path) => (dispatch, getState) => {
  dispatch(setLoadingMessage('Getting listing...'));

  const client = getState().syncBackend.get('client');
  client
    .getDirectoryListing(path)
    .then(({ listing, hasMore, additionalSyncBackendState }) => {
      dispatch(
        setCurrentFileBrowserDirectoryListing(listing, hasMore, additionalSyncBackendState, path)
      );
      dispatch(hideLoadingMessage());
    })
    .catch((error) => {
      dispatch(hideLoadingMessage());
      const error_summary = _.get(error, 'error.error_summary') || '';
      if ([400, 401].includes(error.status) || error_summary.includes('expired_access_token')) {
        dispatch(signOut());
      } else {
        alert('There was an error retrieving files!');
        console.error(error);
      }
    });
};

export const loadMoreDirectoryListing = () => (dispatch, getState) => {
  dispatch(setIsLoadingMoreDirectoryListing(true));

  const client = getState().syncBackend.get('client');
  const currentFileBrowserDirectoryListing = getState().syncBackend.get(
    'currentFileBrowserDirectoryListing'
  );
  client
    .getMoreDirectoryListing(currentFileBrowserDirectoryListing.get('additionalSyncBackendState'))
    .then(({ listing, hasMore, additionalSyncBackendState }) => {
      const extendedListing = currentFileBrowserDirectoryListing.get('listing').concat(listing);
      dispatch(
        setCurrentFileBrowserDirectoryListing(extendedListing, hasMore, additionalSyncBackendState)
      );
      dispatch(setIsLoadingMoreDirectoryListing(false));
    });
};

export const pushBackup = (pathOrFileId, contents) => {
  return (dispatch, getState) => {
    const client = getState().syncBackend.get('client');
    switch (client.type) {
      case 'Dropbox':
      case 'WebDAV':
        client.createFile(`${pathOrFileId}.organice-bak`, contents);
        break;
      case 'GitLab':
        // No-op for GitLab, because the beauty of version control makes backup files redundant.
        break;
      default:
    }
  };
};

export const downloadFile = (path) => {
  return (dispatch, getState) => {
    dispatch(setLoadingMessage(`Downloading file ...`));
    getState()
      .syncBackend.get('client')
      .getFileContents(path)
      .then((fileContents) => {
        dispatch(hideLoadingMessage());
        dispatch(pushBackup(path, fileContents));
        dispatch(parseFile(path, fileContents));
        dispatch(setLastSyncAt(addSeconds(new Date(), 5), path));
        dispatch(setDirty(false, path));
        dispatch(ActionCreators.clearHistory());
      })
      .catch(() => {
        dispatch(hideLoadingMessage());
        dispatch(setIsLoading(false, path));
        dispatch(setOrgFileErrorMessage(`File ${path} not found`));
      });
  };
};

/**
 * @param {String} path Returns the directory name of `path`.
 */
function dirName(path) {
  return pathParse(path).dir;
}

export const createFile = (path, content) => {
  return (dispatch, getState) => {
    dispatch(setLoadingMessage(`Creating file: ${path}`));
    getState()
      .syncBackend.get('client')
      .createFile(path, content)
      .then(() => {
        dispatch(setLastSyncAt(addSeconds(new Date(), 5), path));
        dispatch(hideLoadingMessage());
        dispatch(getDirectoryListing(dirName(path)));
      })
      .catch(() => {
        dispatch(hideLoadingMessage());
        dispatch(setIsLoading(false, path));
        dispatch(setOrgFileErrorMessage(`File ${path} not found`));
      });
  };
};
