/* global process */

import { displayFile, stopDisplayingFile } from './org';

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

export const displaySample = () => {
  return (dispatch, getState) => {
    dispatch(showSamplePage());
    dispatch(displayFile('*SAMPLE*', JSON.parse(process.env.REACT_APP_SAMPLE_FILE_CONTENTS)));
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
    dispatch(displayFile('*WHATS_NEW*', JSON.parse(process.env.REACT_APP_WHATS_NEW_FILE_CONTENTS)));
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

export const setTapTodoToAdvance = newTapTodoToAdvance => ({
  type: 'SET_TAP_TODO_TO_ADVANCE', newTapTodoToAdvance,
});
