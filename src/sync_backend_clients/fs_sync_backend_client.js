import { fromJS, Map } from 'immutable';

const debug = console.debug;

export const filterAndSortDirectoryListing = (listing) => {
  debug(listing);
  return ['a', 'b'];
}

export default function fsClient() {
  function isSignedIn() {
    debug('isSignedIn');
    return Promise.resolve(true);
  }

  function getDirectoryListing(path) {
    debug('getDirectoryListing', path);
    return Promise.resolve({
      listing: fromJS([{
        id: 'a',
        name: 'a',
        isDirectory: false,
        path: '/a.txt',
      }])
    });
  }

  function getMoreDirectoryListing() {
    debug('getMoreDirectoryListing');
    return Promise.resolve(['c', 'd']);
  }

  function updateFile() {
    debug('updateFile');
    return Promise.resolve();
  }

  function createFile() {
    debug('createFile');
    return Promise.resolve();
  }

  function getFileContentsAndMetadata() {
    debug('getFileContentsAndMetadata');
    return Promise.resolve({
      contents: '',
      metadata: {
        lastModified: new Date(),
        size: 0,
      },
    });
  }

  function getFileContents(path) {
    debug('getFileContents', path);
    if (path === '/.organice-config.json') {
      return Promise.resolve('{}');
    }
    return Promise.resolve('This is the contents');
  }

  function deleteFile() {
    debug('deleteFile');
    return Promise.resolve();
  }

  return {
    type: 'File System',
    isSignedIn,
    getDirectoryListing,
    getMoreDirectoryListing,
    updateFile,
    createFile,
    getFileContentsAndMetadata,
    getFileContents,
    deleteFile,
  }
}
