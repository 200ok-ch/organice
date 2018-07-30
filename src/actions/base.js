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
