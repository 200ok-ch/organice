import { fromJS } from 'immutable';
import OrganiceSync from '../organice_android_sync';
import { isEmpty } from 'lodash';

export const pickDirectory = async () => {
  // 2. Pick files
  const result = await OrganiceSync.pickDirectory();
  return result
};

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
      if (file.isDirectory) return true;
      // And only file with the 'org' extension
      return file.name.match(/org$|org_archive$/);
    })
    .sort((a, b) => {
      // Folders before files
      if (a.isDirectory && !b.isDirectory) {
        return -1;
      } else {
        return a.name > b.name ? 1 : -1;
      }
    });
};

export default () => {
  const isSignedIn = () =>
    new Promise((resolve) => resolve(true));

  const transformDirectoryListing = (listing) => {
    const sortedListing = filterAndSortDirectoryListing(listing);
    return fromJS(sortedListing);
  };

  const getDirectoryListing = (uri) =>
    new Promise((resolve, reject) => {
      alert("List directory " + uri)
      OrganiceSync
        .listFiles({uri})
        .then((response) => {
          alert("Listing " + JSON.stringify(response));
          return resolve({
            listing: transformDirectoryListing(response),
          })
        })
        .catch(reject);
    });

  const getMoreDirectoryListing = (_additionalSyncBackendState) => {
    // TODO
    return new Promise((resolve, reject) => resolve());
  };

  const uploadFile = (uri, contents) =>
    new Promise((resolve, reject) =>
      OrganiceSync
        .putFileContents({ uri, contents })
        .then(resolve())
        .catch(reject)
    );

  const updateFile = uploadFile;
  const createFile = uploadFile;

  const getFileContentsAndMetadata = (uri) =>
    new Promise((resolve, reject) =>
      OrganiceSync.getFileContentsAndMetadata({uri})
        .then((result) => {
          resolve({
            contents: result.contents,
            lastModifiedAt: new Date(Date.parse(result.lastModified)).toISOString(),
          });
        })
        .catch((error) => {
          console.error(uri, ': get stat failed', error);
          reject();
        })
    );

  const getFileContents = (uri) => {
    if (isEmpty(uri)) return Promise.reject('No path given');
    return new Promise((resolve, reject) =>
      getFileContentsAndMetadata(uri)
        .then(({ contents }) => resolve(contents))
        .catch(reject)
    );
  };

  const deleteFile = (uri) =>
    new Promise((resolve, reject) =>
      OrganiceSync
        .deleteFile({uri})
        .then(resolve)
        .catch((error) => {
          console.error(uri, ': delete failed', error);
          reject();
        })
    );

  return {
    type: 'AndroidStorage',
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
