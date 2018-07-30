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
