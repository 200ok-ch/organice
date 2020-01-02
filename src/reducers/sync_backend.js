import { Map } from 'immutable';

const signOut = (state, action) => state.set('isAuthenticated', false).set('client', null);

const setCurrentFileBrowserDirectoryListing = (state, action) =>
  state.set(
    'currentFileBrowserDirectoryListing',
    Map({
      listing: action.directoryListing,
      hasMore: action.hasMore,
      additionalSyncBackendState: action.additionalSyncBackendState,
    })
  );

const setIsLoadingMoreDirectoryListing = (state, action) =>
  state
    .update(
      'currentFileBrowserDirectoryListing',
      currentFileBrowserDirectoryListing =>
        !!currentFileBrowserDirectoryListing ? currentFileBrowserDirectoryListing : Map()
    )
    .setIn(['currentFileBrowserDirectoryListing', 'isLoadingMore'], action.isLoadingMore);

export default (state = Map(), action) => {
  switch (action.type) {
    case 'SIGN_OUT':
      return signOut(state, action);
    case 'SET_CURRENT_FILE_BROWSER_DIRECTORY_LISTING':
      return setCurrentFileBrowserDirectoryListing(state, action);
    case 'SET_IS_LOADING_MORE_DIRECTORY_LISTING':
      return setIsLoadingMoreDirectoryListing(state, action);
    default:
      return state;
  }
};
