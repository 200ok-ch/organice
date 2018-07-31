import { displayFile, stopDisplayingFile } from './org';
import { sampleFileContents, whatsNewFileContents } from '../lib/static_file_contents';

export const setLoadingMessage = loadingMessage => ({
  type: 'SET_LOADING_MESSAGE',
  loadingMessage,
});

export const hideLoadingMessage = () => ({
  type: 'HIDE_LOADING_MESSAGE',
});

export const showSettingsPage = () => ({
  type: 'SHOW_SETTINGS_PAGE',
});

export const hideSettingsPage = () => ({
  type: 'HIDE_SETTINGS_PAGE',
});

export const showSamplePage = () => ({
  type: 'SHOW_SAMPLE_PAGE',
});

export const hideSamplePage = () => ({
  type: 'HIDE_SAMPLE_PAGE',
});

export const displaySample = () => {  return (dispatch, getState) => {
    dispatch(showSamplePage());
    dispatch(displayFile(null, sampleFileContents));
  };
};

export const hideSample = () => {
  return (dispatch, getState) => {
    dispatch(hideSamplePage());
    dispatch(stopDisplayingFile());
  };
};

export const showWhatsNewPage = () => ({
  type: 'SHOW_WHATS_NEW_PAGE',
});

export const hideWhatsNewPage = () => ({
  type: 'HIDE_WHATS_NEW_PAGE',
});

export const displayWhatsNew = () => {
  return (dispatch, getState) => {
    dispatch(showWhatsNewPage());
    dispatch(displayFile(null, whatsNewFileContents));
  };
};

export const hideWhatsNew = () => {
  return (dispatch, getState) => {
    dispatch(hideWhatsNewPage());
    dispatch(stopDisplayingFile());
  };
};

export const setFontSize = newFontSize => ({
  type: 'SET_FONT_SIZE', newFontSize,
});

export const setBulletStyle = newBulletStyle => ({
  type: 'SET_BULLET_STYLE', newBulletStyle,
});

export const setShouldTapTodoToAdvance = newShouldTapTodoToAdvance => ({
  type: 'SET_SHOULD_TAP_TODO_TO_ADVANCE', newShouldTapTodoToAdvance,
});

export const setHasUnseenWhatsNew = newHasUnseenWhatsNew => ({
  type: 'SET_HAS_UNSEEN_WHATS_NEW', newHasUnseenWhatsNew,
});

export const setLastSeenWhatsNewHeader = newLastSeenWhatsNewHeader => ({
  type: 'SET_LAST_SEEN_WHATS_NEW_HEADER', newLastSeenWhatsNewHeader,
});
