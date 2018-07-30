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
  default:
    return state;
  }
};
