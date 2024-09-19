import { Map, List, fromJS } from 'immutable';

import { applyCategorySettingsFromConfig } from '../util/settings_persister';

const setLoadingMessage = (state, action) => state.set('loadingMessage', action.loadingMessage);

const hideLoadingMessage = (state) => state.set('loadingMessage', null);

const setFontSize = (state, action) => state.set('fontSize', action.newFontSize);

const setBulletStyle = (state, action) => state.set('bulletStyle', action.newBulletStyle);

const setShouldTapTodoToAdvance = (state, action) =>
  state.set('shouldTapTodoToAdvance', action.newShouldTapTodoToAdvance);

const setAgendaDefaultDeadlineDelayUnit = (state, action) =>
  state.set('agendaDefaultDeadlineDelayUnit', action.newAgendaDefaultDeadlineDelayUnit);

const setAgendaDefaultDeadlineDelayValue = (state, action) =>
  state.set('agendaDefaultDeadlineDelayValue', action.newAgendaDefaultDeadlineDelayValue);

const setEditorDescriptionHeightValue = (state, action) =>
  state.set('editorDescriptionHeightValue', action.newEditorDescriptionHeightValue);

const setAgendaStartOnWeekday = (state, action) =>
  state.set('agendaStartOnWeekday', action.newAgendaStartOnWeekday);

const setShouldStoreSettingsInSyncBackend = (state, action) =>
  state.set('shouldStoreSettingsInSyncBackend', action.newShouldStoreSettingsInSyncBackend);

const setShouldLiveSync = (state, action) => state.set('shouldLiveSync', action.shouldLiveSync);

const setShowDeadlineDisplay = (state, action) =>
  state.set('showDeadlineDisplay', action.showDeadlineDisplay);

const setShouldSyncOnBecomingVisibile = (state, action) =>
  state.set('shouldSyncOnBecomingVisibile', action.shouldSyncOnBecomingVisibile);

const setShouldShowTitleInOrgFile = (state, action) =>
  state.set('shouldShowTitleInOrgFile', action.shouldShowTitleInOrgFile);

const setShouldLogIntoDrawer = (state, action) =>
  state.set('shouldLogIntoDrawer', action.shouldLogIntoDrawer);

const setShouldLogDone = (state, action) => {
  return state.set('shouldLogDone', action.shouldLogDone);
};

const setCloseSubheadersRecursively = (state, action) =>
  state.set('closeSubheadersRecursively', action.closeSubheadersRecursively);

/**
 * When enabled, keep all heading body text flush-left. When disabled (the
 * default) indent the body text of headings according to the nesting level of
 * the heading.
 */
const setShouldNotIndentOnExport = (state, action) =>
  state.set('shouldNotIndentOnExport', action.shouldNotIndentOnExport);

const setHasUnseenChangelog = (state, action) =>
  state.set('hasUnseenChangelog', action.newHasUnseenChangelog);

const setLastSeenChangelogHeader = (state, action) =>
  state.set('lastSeenChangelogHash', action.newLastSeenChangelogHash);

const setLastViewedFile = (state, action) => state.set('lastViewedPath', action.lastViewedPath);

const setCustomKeybinding = (state, action) => {
  if (!state.get('customKeybindings')) {
    state = state.set('customKeybindings', Map());
  }

  return state.setIn(['customKeybindings', action.keybindingName], action.keybinding);
};

const restoreBaseSettings = (state, action) => {
  if (!action.newSettings) {
    return state;
  }
  return applyCategorySettingsFromConfig(state, action.newSettings, 'base');
};

const pushModalPage = (state, action) =>
  state.update('modalPageStack', (stack) =>
    !!stack ? stack.push(action.modalPage) : List([action.modalPage])
  );

const popModalPage = (state) =>
  state.update('modalPageStack', (stack) => (!!stack ? stack.pop() : stack));

const clearModalStack = (state) => state.set('modalPageStack', List());

const activatePopup = (state, action) => {
  const { data, popupType } = action;

  // Remember active popup in URL state for popups that are uniquely
  // identifiable (aka not related to a single header like tags,
  // properties or timestamps).
  if (['search', 'task-list', 'agenda'].includes(popupType)) {
    window.history.replaceState({}, '', `${window.location.pathname}#${popupType}`);
  }

  return state.set(
    'activePopup',
    fromJS({
      type: popupType,
      data,
    })
  );
};

const closePopup = (state) => {
  window.history.replaceState(
    '',
    document.title,
    window.location.pathname + window.location.search
  );
  return state.set('activePopup', null);
};

const setIsLoading = (state, action) => {
  if (action.isLoading) {
    return state.update('isLoading', (isLoading) => isLoading.add(action.path));
  } else {
    return state.update('isLoading', (isLoading) => isLoading.delete(action.path));
  }
};

const setIsOnline = (state, action) => {
  return state.set('online', action.online);
};

const setAgendaTimeframe = (state, action) => state.set('agendaTimeframe', action.agendaTimeframe);

const setFinderTab = (state, action) => state.set('finderTab', action.finderTab);

const setPreferEditRawValues = (state, action) =>
  state.set('preferEditRawValues', action.preferEditRawValues);

const setColorScheme = (state, action) => {
  return state.set('colorScheme', action.colorScheme);
};

const setTheme = (state, action) => {
  return state.set('theme', action.theme);
};

/**
 * Reducer that is responsible for the "base" state slice.
 */
export default (state = Map(), action) => {
  switch (action.type) {
    case 'SET_LOADING_MESSAGE':
      return setLoadingMessage(state, action);
    case 'HIDE_LOADING_MESSAGE':
      return hideLoadingMessage(state, action);
    case 'SET_FONT_SIZE':
      return setFontSize(state, action);
    case 'SET_BULLET_STYLE':
      return setBulletStyle(state, action);
    case 'SET_SHOULD_TAP_TODO_TO_ADVANCE':
      return setShouldTapTodoToAdvance(state, action);
    case 'SET_AGENDA_DEFAULT_DEADLINE_DELAY_UNIT':
      return setAgendaDefaultDeadlineDelayUnit(state, action);
    case 'SET_AGENDA_DEFAULT_DEADLINE_DELAY_VALUE':
      return setAgendaDefaultDeadlineDelayValue(state, action);
    case 'SET_EDITOR_DESCRIPTION_HEIGHT_VALUE':
      return setEditorDescriptionHeightValue(state, action);
    case 'SET_AGENDA_START_ON_WEEKDAY':
      return setAgendaStartOnWeekday(state, action);
    case 'SET_SHOULD_STORE_SETTINGS_IN_SYNC_BACKEND':
      return setShouldStoreSettingsInSyncBackend(state, action);
    case 'SET_COLOR_SCHEME':
      return setColorScheme(state, action);
    case 'SET_THEME':
      return setTheme(state, action);
    case 'SET_SHOULD_LIVE_SYNC':
      return setShouldLiveSync(state, action);
    case 'SET_SHOW_DEADLINE_DISPLAY':
      return setShowDeadlineDisplay(state, action);
    case 'SET_SHOULD_SYNC_ON_BECOMING_VISIBLE':
      return setShouldSyncOnBecomingVisibile(state, action);
    case 'SET_SHOULD_SHOW_TITLE_IN_ORG_FILE':
      return setShouldShowTitleInOrgFile(state, action);
    case 'SET_SHOULD_LOG_INTO_DRAWER':
      return setShouldLogIntoDrawer(state, action);
    case 'SET_SHOULD_LOG_DONE':
      return setShouldLogDone(state, action);
    case 'SET_CLOSE_SUBHEADERS_RECURSIVELY':
      return setCloseSubheadersRecursively(state, action);
    case 'SET_SHOULD_NOT_INDENT_ON_EXPORT':
      return setShouldNotIndentOnExport(state, action);
    case 'SET_HAS_UNSEEN_CHANGELOG':
      return setHasUnseenChangelog(state, action);
    case 'SET_LAST_SEEN_CHANGELOG_HEADER':
      return setLastSeenChangelogHeader(state, action);
    case 'SET_LAST_VIEWED_FILE':
      return setLastViewedFile(state, action);
    case 'SET_CUSTOM_KEYBINDING':
      return setCustomKeybinding(state, action);
    case 'RESTORE_BASE_SETTINGS':
      return restoreBaseSettings(state, action);
    case 'PUSH_MODAL_PAGE':
      return pushModalPage(state, action);
    case 'POP_MODAL_PAGE':
      return popModalPage(state, action);
    case 'CLEAR_MODAL_STACK':
      return clearModalStack(state, action);
    case 'ACTIVATE_POPUP':
      return activatePopup(state, action);
    case 'CLOSE_POPUP':
      return closePopup(state, action);
    case 'SET_IS_LOADING':
      return setIsLoading(state, action);
    case 'SET_IS_ONLINE':
      return setIsOnline(state, action);
    case 'SET_AGENDA_TIMEFRAME':
      return setAgendaTimeframe(state, action);
    case 'SET_FINDER_TAB':
      return setFinderTab(state, action);
    case 'PREFER_EDIT_RAW_VALUES':
      return setPreferEditRawValues(state, action);
    default:
      return state;
  }
};
