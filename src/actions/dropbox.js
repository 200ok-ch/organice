import { Dropbox } from 'dropbox';

import { fromJS } from 'immutable';

export const authenticate = accessToken => ({
  type: 'AUTHENTICATE',
  accessToken,
});

export const signOut = () => ({
  type: 'SIGN_OUT',
});

export const setCurrentFileBrowserDirectoryListing = (directoryPath, directoryListing) => {
  return {
    type: 'SET_CURRENT_FILE_BROWSER_DIRECTORY_LISTING',
    directoryPath,
    directoryListing
  };
};

export const getDirectoryListing = path => {
  return (dispatch, getState) => {
    const dropbox = new Dropbox({ accessToken: getState().dropbox.get('accessToken') });

    // TODO: set a loading message
    dropbox.filesListFolder({ path }).then(response => {
      console.log("response = ", response);

      const directoryListing = fromJS(response.entries.map(entry => ({
        id: entry.id,
        name: entry.name,
        isDirectory: entry['.tag'] === 'folder',
        path: entry.path_display,
      })));

      dispatch(setCurrentFileBrowserDirectoryListing(path, directoryListing));

      // TODO: remove the loading message.
    }).catch(error => {
      console.error('There was an error retrieving files!');
      console.error(error);
    });
  };
};
