import { displayFile, stopDisplayingFile } from './org';

import raw from 'raw.macro';

export const setLoadingMessage = loadingMessage => ({
  type: 'SET_LOADING_MESSAGE',
  loadingMessage,
});

export const hideLoadingMessage = () => ({
  type: 'HIDE_LOADING_MESSAGE',
});

export const setIsLoading = isLoading => ({
  type: 'SET_IS_LOADING',
  isLoading,
});

export const setDisappearingLoadingMessage = (loadingMessage, delay) => dispatch => {
  dispatch(setLoadingMessage(loadingMessage));
  setTimeout(() => dispatch(hideLoadingMessage()), delay);
};

export const setLastViewedFile = (lastViewedPath, lastViewedContents) => ({
  type: 'SET_LAST_VIEWED_FILE',
  lastViewedPath,
  lastViewedContents,
});

export const loadStaticFile = staticFile => {
  return (dispatch, getState) => {
    dispatch(
      setLastViewedFile(getState().org.present.get('path'), getState().org.present.get('contents'))
    );

    const fileContents = {
      changelog: raw('../../changelog.org'),
      sample: raw('../../sample.org'),
    }[staticFile];

    dispatch(displayFile(null, fileContents));
  };
};

export const unloadStaticFile = () => {
  return (dispatch, getState) => {
    dispatch(stopDisplayingFile());

    if (!!getState().base.get('lastViewedPath')) {
      dispatch(
        displayFile(
          getState().base.get('lastViewedPath'),
          getState().base.get('lastViewedContents')
        )
      );
    }
  };
};

export const setFontSize = newFontSize => ({
  type: 'SET_FONT_SIZE',
  newFontSize,
});

export const setBulletStyle = newBulletStyle => ({
  type: 'SET_BULLET_STYLE',
  newBulletStyle,
});

export const setShouldTapTodoToAdvance = newShouldTapTodoToAdvance => ({
  type: 'SET_SHOULD_TAP_TODO_TO_ADVANCE',
  newShouldTapTodoToAdvance,
});

export const setShouldDoubleTapToEdit = newShouldDoubleTapToEdit => ({
  type: 'SET_SHOULD_DOUBLE_TAP_TO_EDIT',
  newShouldDoubleTapToEdit,
});

export const setAgendaDefaultDeadlineDelayUnit = newAgendaDefaultDeadlineDelayUnit => ({
  type: 'SET_AGENDA_DEFAULT_DEADLINE_DELAY_UNIT',
  newAgendaDefaultDeadlineDelayUnit,
});

export const setAgendaDefaultDeadlineDelayValue = newAgendaDefaultDeadlineDelayValue => ({
  type: 'SET_AGENDA_DEFAULT_DEADLINE_DELAY_VALUE',
  newAgendaDefaultDeadlineDelayValue,
});

export const setShouldLiveSync = shouldLiveSync => ({
  type: 'SET_SHOULD_LIVE_SYNC',
  shouldLiveSync,
});

export const setShouldSyncOnBecomingVisibile = shouldSyncOnBecomingVisibile => ({
  type: 'SET_SHOULD_SYNC_ON_BECOMING_VISIBLE',
  shouldSyncOnBecomingVisibile,
});

export const setShouldShowTitleInOrgFile = shouldShowTitleInOrgFile => ({
  type: 'SET_SHOULD_SHOW_TITLE_IN_ORG_FILE',
  shouldShowTitleInOrgFile,
});

export const setShouldStoreSettingsInSyncBackend = newShouldStoreSettingsInSyncBackend => {
  return (dispatch, getState) => {
    dispatch({
      type: 'SET_SHOULD_STORE_SETTINGS_IN_SYNC_BACKEND',
      newShouldStoreSettingsInSyncBackend,
    });

    if (!newShouldStoreSettingsInSyncBackend) {
      const client = getState().syncBackend.get('client');
      switch (client.type) {
        case 'Dropbox':
        case 'WebDAV':
          client
            .deleteFile('/.organice-config.json')
            .catch((doesFileNotExist, error) =>
              doesFileNotExist
                ? null
                : alert(
                    `There was an error trying to delete the .organice-config.json file: ${error}`
                  )
            );
          break;
        case 'Google Drive':
          client.deleteFileByNameAndParent('.organice-config.json', 'root');
          break;
        default:
      }

      window.previousSettingsFileContents = null;
    }
  };
};

export const setHasUnseenChangelog = newHasUnseenChangelog => ({
  type: 'SET_HAS_UNSEEN_CHANGELOG',
  newHasUnseenChangelog,
});

export const setLastSeenChangelogHeader = newLastSeenChangelogHash => ({
  type: 'SET_LAST_SEEN_CHANGELOG_HEADER',
  newLastSeenChangelogHash,
});

export const setCustomKeybinding = (keybindingName, keybinding) => ({
  type: 'SET_CUSTOM_KEYBINDING',
  keybindingName,
  keybinding,
});

export const restoreBaseSettings = newSettings => ({
  type: 'RESTORE_BASE_SETTINGS',
  newSettings,
});

export const pushModalPage = modalPage => ({
  type: 'PUSH_MODAL_PAGE',
  modalPage,
});

export const popModalPage = () => ({
  type: 'POP_MODAL_PAGE',
});

export const clearModalStack = () => ({
  type: 'CLEAR_MODAL_STACK',
});

export const activatePopup = (popupType, data) => ({
  type: 'ACTIVATE_POPUP',
  popupType,
  data,
});

export const closePopup = () => ({
  type: 'CLOSE_POPUP',
});
