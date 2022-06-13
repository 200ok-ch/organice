import { fromJS } from 'immutable';
import { createClient } from 'webdav';
import { isEmpty } from 'lodash';

/**
 * Gets a directory listing ready to be rendered by organice.
 *  - Filters files from `listing` down to org files.
 *  - Sorts folders atop of files.
 *  - Sorts both folders and files alphabetically.
 * @param {Array} listing
 */
export const filterAndSortDirectoryListing = (listing) => {
  return listing
    .filter((file) => {
      // Show all folders
      if (file.type === 'directory') return true;
      // And only file with the 'org' extension
      return file.basename.match(/org$|org_archive$/);
    })
    .sort((a, b) => {
      // Folders before files
      if (a.type === 'directory' && b.type !== 'directory') {
        return -1;
      } else {
        return a.basename > b.basename ? 1 : -1;
      }
    });
};

export default (url, login, password) => {
  const webdavClient = createClient(url, { username: login, password: password });
  const isSignedIn = () =>
    new Promise((resolve) => {
      // There's no direct API to know if the login worked. So, let's
      // check if the root folder contents can be accessed.
      getDirectoryListing('/')
        .then(() => {
          resolve(true);
        })
        .catch((error) => {
          console.error("Login didn't work, error: ", JSON.stringify(error));
          resolve(false);
        });
    });

  const transformDirectoryListing = (listing) => {
    const sortedListing = filterAndSortDirectoryListing(listing);
    return fromJS(
      sortedListing.map((entry) => ({
        id: entry.filename,
        name: entry.basename,
        isDirectory: entry.type === 'directory',
        path: entry.filename,
      }))
    );
  };

  const getDirectoryListing = (path) =>
    new Promise((resolve, reject) => {
      webdavClient
        .getDirectoryContents(path)
        .then((response) =>
          resolve({
            listing: transformDirectoryListing(response),
          })
        )
        .catch(reject);
    });

  const getMoreDirectoryListing = (_additionalSyncBackendState) => {
    // TODO
    return new Promise((resolve, reject) => resolve());
  };

  const uploadFile = (path, contents) =>
    new Promise((resolve, reject) =>
      webdavClient
        .putFileContents(path, contents, { overwrite: true })
        .then(resolve())
        .catch(reject)
    );

  const updateFile = uploadFile;
  const createFile = uploadFile;

  const getFileContentsAndMetadata = (path) =>
    new Promise((resolve, reject) =>
      webdavClient
        .stat(path)
        .then((stat) => {
          webdavClient
            .getFileContents(path, { format: 'text' })
            .then((response) => {
              resolve({
                contents: response,
                lastModifiedAt: new Date(Date.parse(stat.lastmod)).toISOString(),
              });
            })
            .catch((error) => {
              console.error(path, ': get file failed', error);
              reject();
            });
        })
        .catch((error) => {
          if (error && error.response && [401, 403].indexOf(error.response.status) !== -1)
            alert(login + '@' + url + ': ' + error.response.statusText);
          console.error(path, ': get stat failed', error);
          reject();
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
      webdavClient
        .deleteFile(path)
        .then(resolve)
        .catch((error) => {
          if (error && error.response && error.response.status === 404) return;
          console.error(path, ': delete failed', error);
          reject();
        })
    );

  return {
    type: 'WebDAV',
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
