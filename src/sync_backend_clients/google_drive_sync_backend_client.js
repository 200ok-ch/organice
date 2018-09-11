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
        q: `'${directoryId === '' ? 'root' : directoryId}' in parents and trashed = false`,
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

  const updateFile = (fileId, contents) => {
    fileId = fileId.startsWith('/') ? fileId.substr(1) : fileId;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'json';
      xhr.onreadystatechange = () => {
        // TODO: handle errors here.
        if (xhr.readyState === XMLHttpRequest.DONE) {
          resolve();
        }
      };
      xhr.open('PATCH', `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`);
      xhr.setRequestHeader('Authorization', `Bearer ${gapi.auth.getToken().access_token}`);
      xhr.send(contents);
    });
  };

  const createFile = (name, parentId, contents) => {
    return new Promise((resolve, reject) => {
      gapi.client.drive.files.list({
        pageSize: 1,
        fields: 'files(id)',
        q: `'${parentId}' in parents and trashed = false and name = '${name}'`,
      }).then(response => {
        if (response.result.files.length > 0) {
          updateFile(response.result.files[0].id, contents).then(resolve).catch(reject);
        } else {
          gapi.client.drive.files.create({
            name, parents: parentId,
          }).then(response => {
            updateFile(response.result.id, contents).then(resolve).catch(reject);
          });
        }
      });
    });
  };

  const duplicateFile = (fileId, fileNameCallback) => {
    return new Promise((resolve, reject) => {
      gapi.client.drive.files.get({
        fileId, fields: 'name, parents',
      }).then(getResponse => {
        if (!getResponse.result.name) {
          reject();
        } else {
          const newFileName = fileNameCallback(getResponse.result.name);
          const parents = getResponse.result.parents[0];
          gapi.client.drive.files.list({
            pageSize: 1,
            fields: 'files(id)',
            q: `'${parents}' in parents and trashed = false and name = '${newFileName}'`,
          }).then(listResponse => {
            const makeCopy = () => {
              gapi.client.drive.files.copy({
                fileId, parents, name: newFileName,
              }).then(copyResponse => {
                resolve();
              }).catch(reject);
            };

            if (listResponse.result.files.length > 0) {
              gapi.client.drive.files.delete({
                fileId: listResponse.result.files[0].id
              }).then(makeCopy).catch(reject);
            } else {
              makeCopy();
            }
          }).catch(reject);
        }
      });
    });
  };

  const getFileContentsAndMetadata = fileId => (
    new Promise((resolve, reject) => {
      fileId = fileId.startsWith('/') ? fileId.substr(1) : fileId;

      const fileContentsPromise = new Promise(resolve => {
        gapi.client.drive.files.get({
          fileId,
          alt: 'media',
        }).then(response => {
          resolve(response.body);
        });
      });

      const fileModifiedTimePromise = new Promise(resolve => {
        gapi.client.drive.files.get({
          fileId,
          fields: 'modifiedTime'
        }).then(response => {
          resolve(response.result.modifiedTime);
        });
      });

      Promise.all([fileContentsPromise, fileModifiedTimePromise]).then(([contents, lastModifiedAt]) => {
        resolve({
          contents, lastModifiedAt,
        });
      });
    })
  );

  const getFileContents = fileId => (
    new Promise((resolve, reject) => (
      getFileContentsAndMetadata(fileId).then(({ contents }) => resolve(contents)).catch(reject)
    ))
  );

  // TODO:
  const deleteFile = path => (
    new Promise((resolve, reject) => (
      resolve()
    ))
  );

  return {
    type: 'Google Drive',
    getDirectoryListing,
    getMoreDirectoryListing,
    updateFile,
    createFile,
    duplicateFile,
    getFileContentsAndMetadata,
    getFileContents,
    deleteFile,
  };
};
