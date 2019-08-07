/* global process */

import { fromJS, Map } from 'immutable';

export default () => {
  const initGoogleDriveAPIClient = () =>
    new Promise((resolve, reject) =>
      window.gapi.load('client:auth2', () => {
        window.location.hash = window.initialHash;
        window.gapi.client
          .init({
            client_id: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: 'https://www.googleapis.com/auth/drive.file',
          })
          .then(resolve);
      })
    );

  const getAPIClient = (() => {
    let isInited = false;
    let isIniting = false;
    const afterInitCallbacks = [];

    return () => {
      return new Promise((resolve, reject) => {
        if (isInited) {
          resolve(window.gapi);
        } else {
          if (window.gapi && !isIniting) {
            isIniting = true;
            initGoogleDriveAPIClient().then(() => {
              isInited = true;
              afterInitCallbacks.forEach(callback => callback(window.gapi));
              resolve(window.gapi);
            });
          } else {
            afterInitCallbacks.push(resolve);
          }
        }
      });
    };
  })();

  // Trigger the API client init when the gapi script loads.
  if (window.gapi) {
    getAPIClient();
  } else {
    // This handler will be called when the <script> tag loads.
    window.handleGoogleDriveClientLoad = getAPIClient;
  }

  const isSignedIn = () =>
    new Promise((resolve, reject) =>
      getAPIClient().then(gapi => resolve(gapi.auth2.getAuthInstance().isSignedIn.get()))
    );

  const transformDirectoryListing = listing =>
    fromJS(
      listing.map(entry => ({
        id: entry.id,
        name: entry.name,
        isDirectory: entry.mimeType === 'application/vnd.google-apps.folder',
        path: `/${entry.id}`,
      }))
    );

  const getFiles = (directoryId, nextPageToken = null) => {
    const fileListPromise = new Promise((resolve, reject) => {
      getAPIClient().then(gapi => {
        gapi.client.drive.files
          .list({
            pageSize: 30,
            fields: 'nextPageToken, files(id, name, mimeType, parents)',
            q: `'${directoryId === '' ? 'root' : directoryId}' in parents and trashed = false`,
            pageToken: nextPageToken,
          })
          .then(response => {
            resolve({
              listing: transformDirectoryListing(response.result.files),
              hasMore: !!response.result.nextPageToken,
              additionalSyncBackendState: Map({
                currentDirectoryId: directoryId,
                nextPageToken: response.result.nextPageToken,
              }),
            });
          })
          .catch(reject);
      });
    });

    const fileParentPromise = new Promise((resolve, reject) => {
      if (directoryId === '') {
        resolve(null);
      } else {
        getAPIClient()
          .then(gapi =>
            gapi.client.drive.files.get({
              fileId: directoryId,
              fields: 'parents',
            })
          )
          .then(response => {
            if (!response.result.parents) {
              resolve(null);
            } else {
              resolve(response.result.parents[0]);
            }
          })
          .catch(reject);
      }
    });

    const rootFolderIdPromise = new Promise((resolve, reject) => {
      if (!!window.rootFolderId) {
        resolve(window.rootFolderId);
      } else {
        getAPIClient()
          .then(gapi =>
            gapi.client.drive.files.get({
              fileId: 'root',
              fields: 'id',
            })
          )
          .then(response => {
            window.rootFolderId = response.result.id;
            resolve(response.result.id);
          })
          .catch(reject);
      }
    });

    return new Promise((resolve, reject) => {
      Promise.all([fileListPromise, fileParentPromise, rootFolderIdPromise]).then(
        ([listing, parentId, rootFolderId]) => {
          const directoryParentId = parentId === rootFolderId ? '' : parentId;
          listing.additionalSyncBackendState = listing.additionalSyncBackendState.set(
            'parentId',
            directoryParentId
          );
          resolve(listing);
        }
      );
    });
  };

  const getDirectoryListing = directoryId =>
    getFiles(directoryId.startsWith('/') ? directoryId.substr(1) : directoryId);

  const getMoreDirectoryListing = additionalSyncBackendState => {
    const directoryId = additionalSyncBackendState.get('currentDirectoryId');
    const nextPageToken = additionalSyncBackendState.get('nextPageToken');
    return getFiles(directoryId, nextPageToken);
  };

  const fileIdByNameAndParent = (name, parentId) =>
    new Promise((resolve, reject) => {
      getAPIClient()
        .then(gapi =>
          gapi.client.drive.files.list({
            pageSize: 1,
            fields: 'files(id)',
            q: `'${parentId}' in parents and trashed = false and name = '${name}'`,
          })
        )
        .then(response =>
          resolve(response.result.files.length > 0 ? response.result.files[0].id : null)
        )
        .catch(reject);
    });

  const updateFile = (fileId, contents) => {
    fileId = fileId.startsWith('/') ? fileId.substr(1) : fileId;

    return getAPIClient().then(gapi => {
      fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${gapi.auth.getToken().access_token}`,
        },
        body: contents,
      });
    });
  };

  const createFile = (name, parentId, contents) => {
    return new Promise((resolve, reject) => {
      fileIdByNameAndParent(name, parentId)
        .then(
          fileId =>
            !!fileId
              ? updateFile(fileId, contents)
                  .then(resolve)
                  .catch(reject)
              : getAPIClient().then(gapi => {
                  gapi.client.drive.files
                    .create({
                      name,
                      parents: parentId,
                    })
                    .then(response => updateFile(response.result.id, contents))
                    .then(resolve)
                    .catch(reject);
                })
        )
        .catch(reject);
    });
  };

  const duplicateFile = (fileId, fileNameCallback) => {
    return new Promise((resolve, reject) => {
      getAPIClient().then(gapi => {
        gapi.client.drive.files
          .get({
            fileId,
            fields: 'name, parents',
          })
          .then(getResponse => {
            if (!getResponse.result.name) {
              reject();
            } else {
              const newFileName = fileNameCallback(getResponse.result.name);
              const parents = getResponse.result.parents[0];
              fileIdByNameAndParent(newFileName, parents).then(backupFileId => {
                const makeCopy = () => {
                  gapi.client.drive.files
                    .copy({
                      fileId,
                      parents,
                      name: newFileName,
                    })
                    .then(copyResponse => {
                      resolve();
                    })
                    .catch(reject);
                };

                if (!!backupFileId) {
                  gapi.client.drive.files
                    .delete({ fileId: backupFileId })
                    .then(makeCopy)
                    .catch(reject);
                } else {
                  makeCopy();
                }
              });
            }
          });
      });
    });
  };

  const getFileContentsAndMetadata = fileId =>
    new Promise((resolve, reject) => {
      getAPIClient().then(gapi => {
        fileId = fileId.startsWith('/') ? fileId.substr(1) : fileId;

        const fileContentsPromise = new Promise(resolve => {
          gapi.client.drive.files
            .get({
              fileId,
              alt: 'media',
            })
            .then(response => resolve(decodeURIComponent(escape(response.body))))
            .catch(error => {
              if (error.body && JSON.parse(error.body).error.errors[0].reason === 'notFound') {
                reject();
              }
            });
        });

        const fileModifiedTimePromise = new Promise(resolve => {
          gapi.client.drive.files
            .get({
              fileId,
              fields: 'modifiedTime',
            })
            .then(response => {
              resolve(response.result.modifiedTime);
            })
            .catch(error => {
              if (error.body && JSON.parse(error.body).error.errors[0].reason === 'notFound') {
                reject();
              }
            });
        });

        Promise.all([fileContentsPromise, fileModifiedTimePromise]).then(
          ([contents, lastModifiedAt]) => {
            resolve({
              contents,
              lastModifiedAt,
            });
          }
        );
      });
    });

  const getFileContents = fileId =>
    new Promise((resolve, reject) =>
      getFileContentsAndMetadata(fileId)
        .then(({ contents }) => resolve(contents))
        .catch(reject)
    );

  const getFileContentsByNameAndParent = (name, parentId) =>
    new Promise((resolve, reject) =>
      fileIdByNameAndParent(name, parentId).then(fileId => getFileContents(fileId).then(resolve))
    );

  const deleteFileByNameAndParent = (name, parentId) =>
    new Promise((resolve, reject) => {
      getAPIClient().then(gapi =>
        gapi.client.drive.files
          .list({
            pageSize: 1,
            fields: 'files(id)',
            q: `'${parentId}' in parents and trashed = false and name = '${name}'`,
          })
          .then(listResponse => {
            if (listResponse.result.files.length > 0) {
              gapi.client.drive.files
                .delete({
                  fileId: listResponse.result.files[0].id,
                })
                .then(resolve)
                .catch(reject);
            } else {
              resolve();
            }
          })
      );
    });

  return {
    type: 'Google Drive',
    isSignedIn,
    getDirectoryListing,
    getMoreDirectoryListing,
    updateFile,
    createFile,
    duplicateFile,
    getFileContentsAndMetadata,
    getFileContents,
    getFileContentsByNameAndParent,
    deleteFileByNameAndParent,
  };
};
