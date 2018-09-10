/* global gapi */

import { fromJS, Map } from 'immutable';

export default () => {
  const transformDirectoryListing = listing => (
    fromJS(listing.map(entry => ({
      id: entry.id,
      name: entry.name,
      isDirectory: entry.mimeType === 'application/vnd.google-apps.folder',
      path: `/${entry.id}`,
    })))
  );

  const getFiles = (directoryId, nextPageToken = null) => {
    const fileListPromise = new Promise((resolve, reject) => {
      gapi.client.drive.files.list({
        pageSize: 30,
        fields: 'nextPageToken, files(id, name, mimeType, parents)',
        q: `'${directoryId === '' ? 'root' : directoryId}' in parents`,
        pageToken: nextPageToken,
      }).then(response => {
        resolve({
          listing: transformDirectoryListing(response.result.files),
          hasMore: !!response.result.nextPageToken,
          additionalSyncBackendState: Map({
            currentDirectoryId: directoryId,
            nextPageToken: response.result.nextPageToken,
          }),
        });
      });
    });

    const fileParentPromise = new Promise((resolve, reject) => {
      if (directoryId === '') {
        resolve(null);
      } else {
        gapi.client.drive.files.get({
          fileId: directoryId,
          fields: 'parents',
        }).then(response => {
          if (!response.result.parents) {
            resolve(null);
          } else {
            resolve(response.result.parents[0]);
          }
        });
      }
    });

    const rootFolderIdPromise = new Promise(resolve => {
      if (!!window.rootFolderId) {
        resolve(window.rootFolderId);
      } else {
        gapi.client.drive.files.get({
          fileId: 'root',
          fields: 'id',
        }).then(response => {
          window.rootFolderId = response.result.id;
          resolve(response.result.id);
        });
      }
    });

    return new Promise((resolve, reject) => {
      Promise.all([fileListPromise, fileParentPromise, rootFolderIdPromise]).then(([listing, parentId, rootFolderId]) => {
        const directoryParentId = parentId === rootFolderId ? '' : parentId;
        listing.additionalSyncBackendState = listing.additionalSyncBackendState.set('parentId', directoryParentId);
        resolve(listing);
      });
    });
  };

  const getDirectoryListing = directoryId => {
    directoryId = directoryId.startsWith('/') ? directoryId.substr(1) : directoryId;
    return getFiles(directoryId);
  };

  const getMoreDirectoryListing = additionalSyncBackendState => {
    const directoryId = additionalSyncBackendState.get('currentDirectoryId');
    const nextPageToken = additionalSyncBackendState.get('nextPageToken');
    return getFiles(directoryId, nextPageToken);
  };

  const uploadFile = (path, contents) => (
    new Promise((resolve, reject) => (
      resolve()
    ))
  );

  const getFileContentsAndMetadata = path => (
    new Promise((resolve, reject) => (
      resolve({
        contents: '* test file contents',
        lastModifiedAt: 'some date',
      })
    ))
  );

  const getFileContents = path => (
    new Promise((resolve, reject) => (
      getFileContentsAndMetadata(path).then(({ contents }) => resolve(contents)).catch(reject)
    ))
  );

  const deleteFile = path => (
    new Promise((resolve, reject) => (
      resolve()
    ))
  );

  return {
    type: 'Google Drive',
    getDirectoryListing,
    getMoreDirectoryListing,
    uploadFile,
    getFileContentsAndMetadata,
    getFileContents,
    deleteFile,
  };
};
