import { parseFile, resetFileDisplay, setPath } from './org';
import { STATIC_FILE_PREFIX } from '../lib/org_utils';

import raw from 'raw.macro';

export const setLoadingMessage = (loadingMessage) => ({
  type: 'SET_LOADING_MESSAGE',
  loadingMessage,
});

export const hideLoadingMessage = () => ({
  type: 'HIDE_LOADING_MESSAGE',
});

export const setIsLoading = (isLoading, path) => ({
  type: 'SET_IS_LOADING',
  isLoading,
  path,
});

export const setIsOnline = (online) => ({
  type: 'SET_IS_ONLINE',
  online,
});

export const setDisappearingLoadingMessage = (loadingMessage, delay) => (dispatch) => {
  dispatch(setLoadingMessage(loadingMessage));
  setTimeout(() => dispatch(hideLoadingMessage()), delay);
};

export const setLastViewedFile = (lastViewedPath) => ({
  type: 'SET_LAST_VIEWED_FILE',
  lastViewedPath,
});

export const restoreStaticFile = (staticFile, lastViewedFilePath) => {
  return (dispatch) => {
    dispatch(setLastViewedFile(lastViewedFilePath));

    const fileContents = {
      changelog: raw('../../changelog.org'),
      sample: raw('../../sample.org'),
    }[staticFile];

    dispatch(parseFile(STATIC_FILE_PREFIX + staticFile, fileContents));
  };
};

export const unloadStaticFile = () => {
  return (dispatch, getState) => {
    dispatch(resetFileDisplay());

    const path = getState().base.get('lastViewedPath');
    if (!!path) {
      dispatch(setPath(path));
    }
  };
};

export const setFontSize = (newFontSize) => ({
  type: 'SET_FONT_SIZE',
  newFontSize,
});

export const setBulletStyle = (newBulletStyle) => ({
  type: 'SET_BULLET_STYLE',
  newBulletStyle,
});

export const setShouldTapTodoToAdvance = (newShouldTapTodoToAdvance) => ({
  type: 'SET_SHOULD_TAP_TODO_TO_ADVANCE',
  newShouldTapTodoToAdvance,
});

export const setAgendaDefaultDeadlineDelayUnit = (newAgendaDefaultDeadlineDelayUnit) => ({
  type: 'SET_AGENDA_DEFAULT_DEADLINE_DELAY_UNIT',
  newAgendaDefaultDeadlineDelayUnit,
});

export const setAgendaDefaultDeadlineDelayValue = (newAgendaDefaultDeadlineDelayValue) => ({
  type: 'SET_AGENDA_DEFAULT_DEADLINE_DELAY_VALUE',
  newAgendaDefaultDeadlineDelayValue,
});

export const setEditorDescriptionHeightValue = (newEditorDescriptionHeightValue) => ({
  type: 'SET_EDITOR_DESCRIPTION_HEIGHT_VALUE',
  newEditorDescriptionHeightValue,
});

export const setAgendaStartOnWeekday = (newAgendaStartOnWeekday) => ({
  type: 'SET_AGENDA_START_ON_WEEKDAY',
  newAgendaStartOnWeekday,
});

export const setShouldLiveSync = (shouldLiveSync) => ({
  type: 'SET_SHOULD_LIVE_SYNC',
  shouldLiveSync,
});

export const setShowDeadlineDisplay = (showDeadlineDisplay) => ({
  type: 'SET_SHOW_DEADLINE_DISPLAY',
  showDeadlineDisplay,
});

export const setShouldSyncOnBecomingVisibile = (shouldSyncOnBecomingVisibile) => ({
  type: 'SET_SHOULD_SYNC_ON_BECOMING_VISIBLE',
  shouldSyncOnBecomingVisibile,
});

export const setShouldShowTitleInOrgFile = (shouldShowTitleInOrgFile) => ({
  type: 'SET_SHOULD_SHOW_TITLE_IN_ORG_FILE',
  shouldShowTitleInOrgFile,
});

export const setShouldLogIntoDrawer = (shouldLogIntoDrawer) => ({
  type: 'SET_SHOULD_LOG_INTO_DRAWER',
  shouldLogIntoDrawer,
});

export const setShouldLogDone = (shouldLogDone) => ({
  type: 'SET_SHOULD_LOG_DONE',
  shouldLogDone,
});

export const setCloseSubheadersRecursively = (closeSubheadersRecursively) => ({
  type: 'SET_CLOSE_SUBHEADERS_RECURSIVELY',
  closeSubheadersRecursively,
});

export const setShouldNotIndentOnExport = (shouldNotIndentOnExport) => ({
  type: 'SET_SHOULD_NOT_INDENT_ON_EXPORT',
  shouldNotIndentOnExport,
});

export const setShouldStoreSettingsInSyncBackend = (newShouldStoreSettingsInSyncBackend) => {
  return (dispatch, getState) => {
    dispatch({
      type: 'SET_SHOULD_STORE_SETTINGS_IN_SYNC_BACKEND',
      newShouldStoreSettingsInSyncBackend,
    });

    if (!newShouldStoreSettingsInSyncBackend) {
      const client = getState().syncBackend.get('client');
      switch (client.type) {
        case 'Dropbox':
        case 'GitLab':
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
        default:
      }

      window.previousSettingsFileContents = null;
    }
  };
};

export const setColorScheme = (colorScheme) => ({
  type: 'SET_COLOR_SCHEME',
  colorScheme,
});

export const setTheme = (theme) => ({
  type: 'SET_THEME',
  theme,
});

export const setHasUnseenChangelog = (newHasUnseenChangelog) => ({
  type: 'SET_HAS_UNSEEN_CHANGELOG',
  newHasUnseenChangelog,
});

export const setLastSeenChangelogHeader = (newLastSeenChangelogHash) => ({
  type: 'SET_LAST_SEEN_CHANGELOG_HEADER',
  newLastSeenChangelogHash,
});

export const setCustomKeybinding = (keybindingName, keybinding) => ({
  type: 'SET_CUSTOM_KEYBINDING',
  keybindingName,
  keybinding,
});

export const restoreBaseSettings = (newSettings) => ({
  type: 'RESTORE_BASE_SETTINGS',
  newSettings,
});

export const pushModalPage = (modalPage) => ({
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

export const setAgendaTimeframe = (agendaTimeframe) => (dispatch) =>
  dispatch({
    type: 'SET_AGENDA_TIMEFRAME',
    agendaTimeframe,
  });

export const setFinderTab = (finderTab) => (dispatch) =>
  dispatch({
    type: 'SET_FINDER_TAB',
    finderTab,
  });

export const setPreferEditRawValues = (preferEditRawValues) => (dispatch) =>
  dispatch({
    type: 'PREFER_EDIT_RAW_VALUES',
    preferEditRawValues,
  });
