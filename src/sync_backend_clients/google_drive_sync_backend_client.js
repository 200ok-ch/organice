import { fromJS } from 'immutable';

export default () => {
  const transformDirectoryListing = listing => (
    fromJS(listing.map(entry => ({
      id: entry.id,
      name: entry.name,
      isDirectory: entry['.tag'] === 'folder',
      path: entry.path_display,
    })))
  );

  const getDirectoryListing = path => (
    new Promise((resolve, reject) => {
      resolve({
        listing: fromJS([
          {
            id: 1,
            name: 'test file 1',
            isDirectory: false,
            path: '/org/test file 1'
          },
          {
            id: 2,
            name: 'test dir 1',
            isDirectory: true,
            path: '/org/test dir 1'
          },
          {
            id: 3,
            name: 'test file 2',
            isDirectory: false,
            path: '/org/test file 2'
          },
        ]),
        hasMore: true,
        cursor: null,
      });
    })
  );

  const getMoreDirectoryListing = cursor => (
    new Promise((resolve, reject) => (
      resolve({
        listing: fromJS([
          {
            id: 4,
            name: 'test file 3',
            isDirectory: false,
            path: '/org/test file 3'
          },
          {
            id: 5,
            name: 'test dir 2',
            isDirectory: true,
            path: '/org/test dir 2'
          },
        ]),
        hasMore: true,
        cursor: null,
      })
    ))
  );

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
    getDirectoryListing,
    getMoreDirectoryListing,
    uploadFile,
    getFileContentsAndMetadata,
    getFileContents,
    deleteFile,
  };
};
