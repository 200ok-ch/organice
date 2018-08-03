import { Map } from 'immutable';

const setLoadingMessage = (state, action) => (
  state.set('loadingMessage', action.loadingMessage)
);

const hideLoadingMessage = (state, action) => (
  state.set('loadingMessage', null)
);

const setFontSize = (state, action) => (
  state.set('fontSize', action.newFontSize)
);

const setBulletStyle = (state, action) => (
  state.set('bulletStyle', action.newBulletStyle)
);

const setShouldTapTodoToAdvance = (state, action) => (
  state.set('shouldTapTodoToAdvance', action.newShouldTapTodoToAdvance)
);

const setShouldStoreSettingsInDropbox = (state, action) => (
  state.set('shouldStoreSettingsInDropbox', action.newShouldStoreSettingsInDropbox)
);

const setHasUnseenWhatsNew = (state, action) => (
  state.set('hasUnseenWhatsNew', action.newHasUnseenWhatsNew)
);

const setLastSeenWhatsNewHeader = (state, action) => (
  state.set('lastSeenWhatsNewHeader', action.newLastSeenWhatsNewHeader)
);

const setLastViewedFile = (state, action) => (
  state
    .set('lastViewedPath', action.lastViewedPath)
    .set('lastViewedContents', action.lastViewedContents)
);

const setCustomKeybinding = (state, action) => {
  if (!state.get('customKeybindings')) {
    state = state.set('customKeybindings', new Map());
  }

  return state.setIn(['customKeybindings', action.keybindingName], action.keybinding);
};

export default (state = new Map(), action) => {
  switch (action.type) {
  case 'SET_LOADING_MESSAGE':
    return setLoadingMessage(state, action);
  case 'HIDE_LOADING_MESSAGE':
    return hideLoadingMessage(state, action);
  case 'SET_FONT_SIZE':
    return setFontSize(state, action);
  case 'SET_BULLET_STYLE':
    return setBulletStyle(state, action);
  case 'SET_SHOULD_TAP_TODO_TO_ADVANCE':
    return setShouldTapTodoToAdvance(state, action);
  case 'SET_SHOULD_STORE_SETTINGS_IN_DROPBOX':
    return setShouldStoreSettingsInDropbox(state, action);
  case 'SET_HAS_UNSEEN_WHATS_NEW':
    return setHasUnseenWhatsNew(state, action);
  case 'SET_LAST_SEEN_WHATS_NEW_HEADER':
    return setLastSeenWhatsNewHeader(state, action);
  case 'SET_LAST_VIEWED_FILE':
    return setLastViewedFile(state, action);
  case 'SET_CUSTOM_KEYBINDING':
    return setCustomKeybinding(state, action);
  default:
    return state;
  }
};
