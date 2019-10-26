import { fromJS } from 'immutable';
import { createClient } from 'webdav';

/**
 * Gets a directory listing ready to be rendered by organice.
 *  - Filters files from `listing` down to org files.
 *  - Sorts folders atop of files.
 *  - Sorts both folders and files alphabetically.
 * @param {Array} listing
 */
export const filterAndSortDirectoryListing = listing => {
  // TODO
  return listing
};

export default (url, login, password) => {
  const webdavClient = createClient(url, {username: login, password: password});
  const isSignedIn = () => new Promise(resolve => resolve(true));

  const transformDirectoryListing = listing => {
    const sortedListing = filterAndSortDirectoryListing(listing);
    return fromJS(
      sortedListing.map(entry => ({
        id: entry.filename,
        name: entry.basename,
        isDirectory: entry.type === 'directory',
        path: entry.filename,
      }))
    );
  };

  const getDirectoryListing = path =>
    new Promise((resolve, reject) => {
      webdavClient
        .getDirectoryContents(path)
        .then(response =>
          resolve({
            listing: transformDirectoryListing(response),
          })
        )
        .catch(reject);
    });

  const getMoreDirectoryListing = additionalSyncBackendState => {
    // TODO
    return new Promise((resolve, reject) => resolve())
  };

  const uploadFile = (path, contents) =>
    new Promise((resolve, reject) =>
      webdavClient
        .putFileContents(
          path,
          contents,
          {overwrite: true}
        )
        .then(resolve)
        .catch(reject)
    );

  const updateFile = uploadFile;
  const createFile = uploadFile;

  const getFileContentsAndMetadata = path =>
    new Promise((resolve, reject) =>
      webdavClient
        .stat(path)
        .then(stat => {
          webdavClient
            .getFileContents(path, {format: "text"})
            .then(response => {
              resolve({
                contents: response,
                lastModifiedAt: (new Date(Date.parse(stat.lastmod))).toISOString()
              })
            })
            .catch(error => {
              console.error(path, ": get file failed", error);
              reject();
            })
        })
        .catch(error => {
          console.error(path, ": get stat failed", error);
          reject();
        }));

  const getFileContents = path =>
    new Promise((resolve, reject) =>
      getFileContentsAndMetadata(path)
        .then(({ contents }) => resolve(contents))
        .catch(reject)
    );

  const deleteFile = path =>
    new Promise((resolve, reject) =>
      webdavClient
        .deleteFile(path)
        .then(resolve)
        .catch(error => {
          console.error(path, ": delete failed", error);
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
