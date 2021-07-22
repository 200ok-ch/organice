import { OneDrive } from './onedrive';
import { isEmpty } from 'lodash';
import { orgFileExtensions } from '../lib/org_utils';

import { fromJS } from 'immutable';

export const filterAndSortDirectoryListing = (listing) => {
    const filteredListing = listing.filter((file) => {
        if (!!file.folder) return true;
        return file.name.match(orgFileExtensions);
    });
    return filteredListing;
}

export default (clientId, tenantId) => {

    const onedriveClient = new OneDrive({clientId: clientId, tenantId: tenantId});

    const isSignedIn = () => onedriveClient.isSignedIn();


    const transformDirectoryListing = (path, listing) => {
        const sortedListing = filterAndSortDirectoryListing(listing);
        var a = fromJS(
            sortedListing.map((entry) => ({
                id: entry.id,
                name: entry.name,
                isDirectory: !!entry.folder,
                path: path+'/'+entry.name
            })));
        return a;
    }

    const getDirectoryListing = (path) => {
        //console.log(path);
        return new Promise( (resolve, reject) => {
            onedriveClient.filesListFolder(path)
                .then( (json ) => {
                    resolve({
                        listing: transformDirectoryListing(path, json),
                    });
                })
                .catch((e) => {
                    console.log(path);
                    console.log(e);
                    reject(e)
                });
        });

    }

    const getFileContentsAndMetadata = (path) => {
        console.log("getFileContentsAndMetadata(" + path + ")");
        if (isEmpty(path)) return Promise.reject('No path given');
        return new Promise((resolve, reject) => {
            Promise.all([
                onedriveClient.fileMetadata(path),
                onedriveClient.fileDownload(path)
            ])
                .then(([metadata, contents]) => {
                    const results = {
                        contents: contents,
                        lastModifiedAt: metadata.lastModifiedDateTime
                    }
                    resolve(results);
                })
                .catch((error) => {
                    console.log(error);
                    reject(error);
                });
        });
    }

    const getFileContents = (path) => {
        console.log("getFileContents(" + path + ")");
        if (isEmpty(path)) return Promise.reject('No path given');
        return new Promise((resolve, reject) => {
            onedriveClient.fileDownload(path)
                .then((contents) => {
                    resolve(contents);
                })
                .catch((error) => {
                    console.log(error);
                    reject(error);
                });
        })
    }

    const uploadFile = (path, contents) => {
        return new Promise((resolve, reject) =>
            onedriveClient
                .fileUpload(path, contents)
                .then(() => {
                    resolve();
                })
        );
    }

    const updateFile = uploadFile;
    const createFile = uploadFile;

    return {
      type: 'OneDrive',
      isSignedIn,
      getDirectoryListing,
      getFileContentsAndMetadata,
      getFileContents,
      uploadFile,
      updateFile,
      createFile
    };
}
