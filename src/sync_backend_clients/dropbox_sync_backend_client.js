import { isEmpty } from 'lodash';
import { orgFileExtensions } from '../lib/org_utils';

import { persistField, getPersistedField } from '../util/settings_persister';

import { Dropbox } from 'dropbox';

import parseQueryString from '../util/parse_query_string';

import { fromJS, Map } from 'immutable';

/**
 * Gets a directory listing ready to be rendered by organice.
 *  - Filters files from `listing` down to org files.
 *  - Sorts folders atop of files.
 *  - Sorts both folders and files alphabetically.
 * @param {Array} listing
 */
export const filterAndSortDirectoryListing = (listing) => {
  const filteredListing = listing.filter((file) => {
    // Show all folders
    if (file['.tag'] === 'folder') return true;
    // Filter out all non-org files
    return file.name.match(orgFileExtensions);
  });
  return filteredListing.sort((a, b) => {
    // Folders before files
    if (a['.tag'] === 'folder' && b['.tag'] === 'file') {
      return -1;
    } else {
      // Sorth both folders and files alphabetically
      return a.name > b.name ? 1 : -1;
    }
  });
};

function getCodeFromUrl() {
  return parseQueryString(window.location.search).code;
}

export default () => {
  let dbxPromise;

  const isSignedIn = () => new Promise((resolve) => resolve(true));

  const transformDirectoryListing = (listing) => {
    const sortedListing = filterAndSortDirectoryListing(listing);
    return fromJS(
      sortedListing.map((entry) => ({
        id: entry.id,
        name: entry.name,
        isDirectory: entry['.tag'] === 'folder',
        path: entry.path_display,
      }))
    );
  };

  const getDirectoryListing = (path) =>
    new Promise((resolve, reject) => {
      dbxPromise
        .then((dbx) => {
          dbx.filesListFolder({ path }).then((response) => {
            resolve({
              listing: transformDirectoryListing(response.result.entries),
              hasMore: response.result.has_more,
              additionalSyncBackendState: Map({
                cursor: response.result.cursor,
              }),
            });
          });
        })
        .catch(reject);
    });

  const getMoreDirectoryListing = (additionalSyncBackendState) => {
    const cursor = additionalSyncBackendState.get('cursor');
    return new Promise((resolve, reject) =>
      dbxPromise.then((dbx) => {
        dbx.filesListFolderContinue({ cursor }).then((response) =>
          resolve({
            listing: transformDirectoryListing(response.result.entries),
            hasMore: response.result.has_more,
            additionalSyncBackendState: Map({
              cursor: response.result.cursor,
            }),
          })
        );
      })
    );
  };

  const uploadFile = (path, contents) =>
    new Promise((resolve, reject) =>
      dbxPromise.then((dbx) => {
        dbx
          .filesUpload({
            path,
            contents,
            mode: {
              '.tag': 'overwrite',
            },
            autorename: true,
          })
          .then(resolve)
          .catch(reject);
      })
    );

  const updateFile = uploadFile;
  const createFile = uploadFile;

  const getFileContentsAndMetadata = (path) =>
    new Promise((resolve, reject) =>
      dbxPromise.then((dbx) => {
        dbx
          .filesDownload({ path })
          .then((response) => {
            const reader = new FileReader();
            reader.addEventListener('loadend', () =>
              resolve({
                contents: reader.result,
                lastModifiedAt: response.result.server_modified,
              })
            );
            reader.readAsText(response.result.fileBlob);
          })
          .catch((error) => {
            // INFO: It's possible organice is using the Dropbox API
            // wrongly. In any case, for some files and only sometimes,
            // when a file is requested, there's either:
            //   - a 400 with a plain text error or
            //   - a 409 with an embedded JSON error
            //   - a 409 with a plain text error under `.error`
            // coming back. Sometimes, there's even two API calls to
            // `/download` happening at the same time (of types `json`
            // and `octet-stream`) where one might fail and the other
            // might prevail.
            // More debug information in this issue:
            // https://github.com/200ok-ch/organice/issues/108
            const objectContainsTagErrorP = (function () {
              try {
                return JSON.parse(error.error).error.path['.tag'] === 'not_found';
              } catch (e) {
                return false;
              }
            })();
            if (
              (typeof error === 'string' && error.match(/missing required field 'path'/)) ||
              objectContainsTagErrorP
            ) {
              reject();
            }
          });
      })
    );

  const getFileContents = (path) => {
    if (isEmpty(path)) return Promise.reject('No path given');
    return new Promise((resolve, reject) =>
      getFileContentsAndMetadata(path)
        .then(({ contents }) => resolve(contents))
        .catch(reject)
    );
  };

  const deleteFile = (path) =>
    new Promise((resolve, reject) =>
      dbxPromise.then((dbx) => {
        dbx
          .filesDelete({ path })
          .then(resolve)
          .catch((error) => reject(error.error.error['.tag'] === 'path_lookup', error));
      })
    );

  /* Dropbox documentation on OAuth2 and PKCE:

  -  SDK Repo: https://github.com/dropbox/dropbox-sdk-js
  -  OAuth Guide: https://developers.dropbox.com/oauth-guide
  -  PKCE: What and Why?: https://dropbox.tech/developers/pkce--what-and-why-
  -  Single HTML file example: https://github.com/dropbox/dropbox-sdk-js/blob/main/examples/javascript/pkce-browser/index.html
  -  SDK Docs: https://dropbox.github.io/dropbox-sdk-js/index.html
  -  Migrating App Permissions and Access Tokens: https://dropbox.tech/developers/migrating-app-permissions-and-access-tokens */

  const REDIRECT_URI = window.location.origin + '/';

  dbxPromise = new Promise((resolve, reject) => {
    const dbx = new Dropbox({
      clientId: process.env.REACT_APP_DROPBOX_CLIENT_ID,
      fetch: fetch.bind(window),
    });
    const dbxAuth = dbx.auth;

    if (getCodeFromUrl()) {
      dbxAuth.setCodeVerifier(getPersistedField('codeVerifier'));
      dbxAuth
        .getAccessTokenFromCode(REDIRECT_URI, getCodeFromUrl())
        .then((response) => {
          dbxAuth.setRefreshToken(response.result.refresh_token);
          persistField('dropboxRefreshToken', response.result.refresh_token);

          resolve(dbx);
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      dbxAuth.setCodeVerifier(getPersistedField('codeVerifier'));
      dbxAuth.setRefreshToken(getPersistedField('dropboxRefreshToken'));
      resolve(dbx);
    }
  });

  return {
    type: 'Dropbox',
    isSignedIn,
    getDirectoryListing,
    getMoreDirectoryListing,
    updateFile,
    createFile,
    getFileContentsAndMetadata,
    getFileContents,
    deleteFile,
  };
};
