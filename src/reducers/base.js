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

const showSamplePage = state => (
  state.set('isShowingSamplePage', true)
);

const hideSamplePage = state => (
  state.set('isShowingSamplePage', false)
);

const showWhatsNewPage = state => (
  state.set('isShowingWhatsNewPage', true)
);

const hideWhatsNewPage = state => (
  state.set('isShowingWhatsNewPage', false)
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
  case 'SHOW_SAMPLE_PAGE':
    return showSamplePage(state, action);
  case 'HIDE_SAMPLE_PAGE':
    return hideSamplePage(state, action);
  case 'SHOW_WHATS_NEW_PAGE':
    return showWhatsNewPage(state, action);
  case 'HIDE_WHATS_NEW_PAGE':
    return hideWhatsNewPage(state, action);
  case 'SET_FONT_SIZE':
    return setFontSize(state, action);
  case 'SET_BULLET_STYLE':
    return setBulletStyle(state, action);
  case 'SET_SHOULD_TAP_TODO_TO_ADVANCE':
    return setShouldTapTodoToAdvance(state, action);
  default:
    return state;
  }
};
