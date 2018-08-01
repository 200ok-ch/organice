import { Map } from 'immutable';

const setLoadingMessage = (state, action) => (
  state.set('loadingMessage', action.loadingMessage)
);

const hideLoadingMessage = (state, action) => (
  state.set('loadingMessage', null)
);

const showSettingsPage = state => (
  state.set('isShowingSettingsPage', true)
);

const hideSettingsPage = state => (
  state.set('isShowingSettingsPage', false)
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

export default (state = new Map(), action) => {
  switch (action.type) {
  case 'SET_LOADING_MESSAGE':
    return setLoadingMessage(state, action);
  case 'HIDE_LOADING_MESSAGE':
    return hideLoadingMessage(state, action);
  case 'SHOW_SETTINGS_PAGE':
    return showSettingsPage(state, action);
  case 'HIDE_SETTINGS_PAGE':
    return hideSettingsPage(state, action);
  case 'SET_FONT_SIZE':
    return setFontSize(state, action);
  case 'SET_BULLET_STYLE':
    return setBulletStyle(state, action);
  case 'SET_SHOULD_TAP_TODO_TO_ADVANCE':
    return setShouldTapTodoToAdvance(state, action);
  case 'SET_HAS_UNSEEN_WHATS_NEW':
    return setHasUnseenWhatsNew(state, action);
  case 'SET_LAST_SEEN_WHATS_NEW_HEADER':
    return setLastSeenWhatsNewHeader(state, action);
  case 'SET_LAST_VIEWED_FILE':
    return setLastViewedFile(state, action);
  default:
    return state;
  }
};
