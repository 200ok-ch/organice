import { displayFile, stopDisplayingFile } from './org';
import { sampleFileContents, whatsNewFileContents } from '../lib/static_file_contents';

import { Dropbox } from 'dropbox';

export const setLoadingMessage = loadingMessage => ({
  type: 'SET_LOADING_MESSAGE',
  loadingMessage,
});

export const hideLoadingMessage = () => ({
  type: 'HIDE_LOADING_MESSAGE',
});

export const setLastViewedFile = (lastViewedPath, lastViewedContents) => ({
  type: 'SET_LAST_VIEWED_FILE', lastViewedPath, lastViewedContents,
});

export const loadStaticFile = staticFile => {
  return (dispatch, getState) => {
    dispatch(setLastViewedFile(getState().org.present.get('path'),
                               getState().org.present.get('contents')));

    const fileContents = {
      'whats_new': whatsNewFileContents,
      'sample': sampleFileContents,
    }[staticFile];

    dispatch(displayFile(null, fileContents));
  };
};

export const unloadStaticFile = () => {
  return (dispatch, getState) => {
    dispatch(stopDisplayingFile());

    if (!!getState().base.get('lastViewedPath')) {
      dispatch(displayFile(getState().base.get('lastViewedPath'),
                           getState().base.get('lastViewedContents')));
    }
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

export const setShouldStoreSettingsInDropbox = newShouldStoreSettingsInDropbox => {
  return (dispatch, getState) => {
    dispatch({ type: 'SET_SHOULD_STORE_SETTINGS_IN_DROPBOX', newShouldStoreSettingsInDropbox });

    if (!newShouldStoreSettingsInDropbox) {
      const dropbox = new Dropbox({ accessToken: getState().dropbox.get('accessToken') });
      dropbox.filesDelete({
        path: '/.org-web-config.json',
      }).catch(error => {
        if (!error.error.error['.tag'] === 'path_lookup') {
          alert(`There was an error trying to delete the .org-web-config.json file: ${error}`);
        }
      });

      window.previousSettingsFileContents = null;
    }
  };
};

export const setHasUnseenWhatsNew = newHasUnseenWhatsNew => ({
  type: 'SET_HAS_UNSEEN_WHATS_NEW', newHasUnseenWhatsNew,
});

export const setLastSeenWhatsNewHeader = newLastSeenWhatsNewHeader => ({
  type: 'SET_LAST_SEEN_WHATS_NEW_HEADER', newLastSeenWhatsNewHeader,
});

export const setCustomKeybinding = (keybindingName, keybinding) => ({
  type: 'SET_CUSTOM_KEYBINDING', keybindingName, keybinding,
});

export const restoreSettings = newSettings => ({
  type: 'RESTORE_SETTINGS', newSettings,
});

export const setActiveModalPage = activeModalPage => ({
  type: 'SET_ACTIVE_MODAL_PAGE', activeModalPage,
});
