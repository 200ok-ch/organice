import { ActionCreators } from 'redux-undo';
import { debounce } from 'lodash';
import {
  setLoadingMessage,
  hideLoadingMessage,
  setIsLoading,
  setDisappearingLoadingMessage,
  activatePopup,
  closePopup,
} from './base';
import { exportOrg } from '../lib/export_org';
import substituteTemplateVariables from '../lib/capture_template_substitution';
import { headerWithPath } from '../lib/org_utils';

import sampleCaptureTemplates from '../lib/sample_capture_templates';

import { isAfter, addSeconds } from 'date-fns';
import { parseISO } from 'date-fns';

export const displayFile = (path, contents) => ({
  type: 'DISPLAY_FILE',
  path,
  contents,
});

export const setLastSyncAt = (lastSyncAt) => ({
  type: 'SET_LAST_SYNC_AT',
  lastSyncAt,
});

export const stopDisplayingFile = () => {
  return (dispatch) => {
    dispatch(widenHeader());
    dispatch(closePopup());
    dispatch(setLastSyncAt(null));
    dispatch({ type: 'STOP_DISPLAYING_FILE' });
    dispatch(ActionCreators.clearHistory());
  };
};

const syncDebounced = debounce((dispatch, ...args) => dispatch(doSync(...args)), 3000, {
  leading: true,
  trailing: true,
});

export const sync = (...args) => (dispatch) => {
  // If the user hits the 'sync' button, no matter if there's a sync
  // in progress or if the sync 'should' be debounced, listen to the
  // user and start a sync.
  if (args[0].forceAction === 'manual') {
    console.log('forcing sync');
    dispatch(doSync(...args));
  } else {
    syncDebounced(dispatch, ...args);
  }
};

// doSync is the actual sync action synchronizing/persisting the Org
// file. When 'live sync' is enabled, there's potentially a quick
// succession of calls to 'sync' and therefore to the sync back-end
// happening. These calls need to be debounced. If there's a really
// succession of calls, only the first and last synchronization will
// happen.
// Note: This action is a redux-thunk action (because it returns a
// function). This function is defined every time it is called. Hence,
// wrapping it in `debounce` will not be good enough. Since it would
// be a new function every time, it would be called every time. The
// solution is to define an inner function `sync` outside of the
// wrapping function `syncDebounced`. This will actually debounce
// `doSync`, because the inner function `sync` will be created only
// once.
const doSync = ({
  forceAction = null,
  successMessage = 'Changes pushed',
  shouldSuppressMessages = false,
} = {}) => (dispatch, getState) => {
  const client = getState().syncBackend.get('client');
  const path = getState().org.present.get('path');
  if (!path) {
    return;
  }

  // Calls do `doSync` are already debounced using a timer, but on big
  // Org files or slow connections, it's still possible to have
  // concurrent requests to `doSync` which has no merit. When
  // `isLoading`, don't trigger another sync in parallel. Instead,
  // call `syncDebounced` and return immediately. This will
  // recursively enqueue the request to do a sync until the current
  // sync is finished. Since it's a debounced call, enqueueing it
  // recursively is efficient.
  // That is, unless the user manually hits the 'sync' button
  // (indicated by `forceAction === 'manual'`). Then, do what the user
  // requests.
  if (getState().base.get('isLoading') && forceAction !== 'manual') {
    // Since there is a quick succession of debounced requests to
    // synchronize, the user likely is in a undo/redo workflow with
    // potential new changes to the Org file in between. In such a
    // situation, it is easy for the remote file to have a newer
    // `lastModifiedAt` date than the `lastSyncAt` date. Hence,
    // pushing is the right action - no need for the modal to ask the
    // user for her request to pull/push or cancel.
    dispatch(sync({ forceAction: 'push' }));
    return;
  }

  if (!shouldSuppressMessages) {
    dispatch(setLoadingMessage('Syncing...'));
  }
  dispatch(setIsLoading(true));
  dispatch(setOrgFileErrorMessage(null));

  client
    .getFileContentsAndMetadata(path)
    .then(({ contents, lastModifiedAt }) => {
      const isDirty = getState().org.present.getIn(['files', path, 'isDirty']);
      const lastServerModifiedAt = parseISO(lastModifiedAt);
      const lastSyncAt = getState().org.present.getIn(['files', path, 'lastSyncAt']);

      if (isAfter(lastSyncAt, lastServerModifiedAt) || forceAction === 'push') {
        if (isDirty) {
          client
            .updateFile(
              path,
              exportOrg({
                headers: getState().org.present.getIn(['files', path, 'headers']),
                linesBeforeHeadings: getState().org.present.getIn([
                  'files',
                  path,
                  'linesBeforeHeadings',
                ]),
                dontIndent: getState().base.get('shouldNotIndentOnExport'),
              })
            )
            .then(() => {
              if (!shouldSuppressMessages) {
                dispatch(setDisappearingLoadingMessage(successMessage, 2000));
              }
              dispatch(setIsLoading(false));
              dispatch(setDirty(false));
              dispatch(setLastSyncAt(addSeconds(new Date(), 5)));
            })
            .catch((error) => {
              const err = `There was an error pushing the file: ${error.toString()}`;
              console.error(err);
              dispatch(setDisappearingLoadingMessage(err, 5000));
              dispatch(hideLoadingMessage());
              dispatch(setIsLoading(false));
              // Re-enqueue the file to be synchronized again
              dispatch(sync());
            });
        } else {
          if (!shouldSuppressMessages) {
            dispatch(setDisappearingLoadingMessage('Nothing to sync', 2000));
          }
          dispatch(setIsLoading(false));
        }
      } else {
        if (isDirty && forceAction !== 'pull') {
          dispatch(hideLoadingMessage());
          dispatch(setIsLoading(false));
          dispatch(activatePopup('sync-confirmation', { lastServerModifiedAt }));
        } else {
          dispatch(displayFile(path, contents));
          dispatch(applyOpennessState());
          dispatch(setDirty(false));
          dispatch(setLastSyncAt(addSeconds(new Date(), 5)));
          if (!shouldSuppressMessages) {
            dispatch(setDisappearingLoadingMessage('Latest version pulled', 2000));
          }
          dispatch(setIsLoading(false));
        }
      }
    })
    .catch(() => {
      dispatch(hideLoadingMessage());
      dispatch(setIsLoading(false));
      dispatch(setOrgFileErrorMessage('File not found'));
    });
};

export const openHeader = (headerId) => ({
  type: 'OPEN_HEADER',
  headerId,
});

export const toggleHeaderOpened = (headerId, closeSubheadersRecursively) => ({
  type: 'TOGGLE_HEADER_OPENED',
  headerId,
  closeSubheadersRecursively,
});

export const selectHeader = (headerId) => (dispatch) => {
  dispatch({ type: 'SELECT_HEADER', headerId });

  if (!!headerId) {
    dispatch(setSelectedTableCellId(null));
  }
};

const changePath = (path) => ({
  type: 'CHANGE_PATH',
  path,
});

export const selectHeaderAndOpenParents = (path, headerId) => (dispatch) => {
  // TODO: change path does not change the browser path
  dispatch(changePath(path));
  dispatch(selectHeader(headerId));
  dispatch({ type: 'OPEN_PARENTS_OF_HEADER', headerId });
};

/**
 * Action to advance the state, e.g. TODO -> DONE, of the header specified in headerId.
 *
 * @param {*} headerId headerId to advance, or null if you want the currently narrowed header.
 * @param {*} logIntoDrawer false to log state change into body, true to log into :LOGBOOK: drawer.
 */
export const advanceTodoState = (headerId, logIntoDrawer) => ({
  type: 'ADVANCE_TODO_STATE',
  headerId,
  logIntoDrawer,
  dirtying: true,
  timestamp: new Date(),
});

export const enterEditMode = (editModeType) => ({
  type: 'ENTER_EDIT_MODE',
  editModeType,
});

export const exitEditMode = () => ({
  type: 'EXIT_EDIT_MODE',
});

export const updateHeaderTitle = (headerId, newRawTitle) => ({
  type: 'UPDATE_HEADER_TITLE',
  headerId,
  newRawTitle,
  dirtying: true,
});

export const updateHeaderDescription = (headerId, newRawDescription) => ({
  type: 'UPDATE_HEADER_DESCRIPTION',
  headerId,
  newRawDescription,
  dirtying: true,
});

export const addHeader = (headerId) => ({
  type: 'ADD_HEADER',
  headerId,
  // Performance optimization: Don't actually sync a whole Org file
  // for an empty header. When the user adds some data and triggers
  // UPDATE_HEADER_TITLE, then it makes sense to save it.
  dirtying: false,
});

export const selectNextSiblingHeader = (headerId) => ({
  type: 'SELECT_NEXT_SIBLING_HEADER',
  headerId,
});

export const addHeaderAndEdit = (headerId) => (dispatch) => {
  dispatch(addHeader(headerId));
  dispatch(selectNextSiblingHeader(headerId));
  dispatch(enterEditMode('title'));
};

export const selectNextVisibleHeader = (headerId) => ({
  type: 'SELECT_NEXT_VISIBLE_HEADER',
  headerId,
});

export const selectPreviousVisibleHeader = (headerId) => ({
  type: 'SELECT_PREVIOUS_VISIBLE_HEADER',
  headerId,
});

export const removeHeader = (headerId) => ({
  type: 'REMOVE_HEADER',
  headerId,
  dirtying: true,
});

export const moveHeaderUp = (headerId) => ({
  type: 'MOVE_HEADER_UP',
  headerId,
  dirtying: true,
});

export const moveHeaderDown = (headerId) => ({
  type: 'MOVE_HEADER_DOWN',
  headerId,
  dirtying: true,
});

export const moveHeaderLeft = (headerId) => ({
  type: 'MOVE_HEADER_LEFT',
  headerId,
  dirtying: true,
});

export const moveHeaderRight = (headerId) => ({
  type: 'MOVE_HEADER_RIGHT',
  headerId,
  dirtying: true,
});

export const moveSubtreeLeft = (headerId) => ({
  type: 'MOVE_SUBTREE_LEFT',
  headerId,
  dirtying: true,
});

export const moveSubtreeRight = (headerId) => ({
  type: 'MOVE_SUBTREE_RIGHT',
  headerId,
  dirtying: true,
});

export const refileSubtree = (sourcePath, sourceHeaderId, targetPath, targetHeaderId) => ({
  type: 'REFILE_SUBTREE',
  sourcePath,
  sourceHeaderId,
  targetPath,
  targetHeaderId,
  dirtying: true,
});

export const addNote = (inputText, currentDate) => ({
  type: 'HEADER_ADD_NOTE',
  inputText,
  currentDate,
  dirtying: true,
});

export const narrowHeader = (headerId) => ({
  type: 'NARROW_HEADER',
  headerId,
});

export const widenHeader = () => ({
  type: 'WIDEN_HEADER',
});

export const applyOpennessState = () => ({
  type: 'APPLY_OPENNESS_STATE',
});

export const setDirty = (isDirty) => ({
  type: 'SET_DIRTY',
  isDirty,
});

export const setSelectedTableCellId = (cellId) => (dispatch) => {
  dispatch({ type: 'SET_SELECTED_TABLE_CELL_ID', cellId });

  if (!!cellId) {
    dispatch(selectHeader(null));
  }
};

export const addNewTableRow = () => ({
  type: 'ADD_NEW_TABLE_ROW',
  dirtying: true,
});

export const removeTableRow = () => ({
  type: 'REMOVE_TABLE_ROW',
  dirtying: true,
});

export const addNewTableColumn = () => ({
  type: 'ADD_NEW_TABLE_COLUMN',
  dirtying: true,
});

export const removeTableColumn = () => ({
  type: 'REMOVE_TABLE_COLUMN',
  dirtying: true,
});

export const moveTableRowDown = () => ({
  type: 'MOVE_TABLE_ROW_DOWN',
  dirtying: true,
});

export const moveTableRowUp = () => ({
  type: 'MOVE_TABLE_ROW_UP',
  dirtying: true,
});

export const moveTableColumnLeft = () => ({
  type: 'MOVE_TABLE_COLUMN_LEFT',
  dirtying: true,
});

export const moveTableColumnRight = () => ({
  type: 'MOVE_TABLE_COLUMN_RIGHT',
  dirtying: true,
});

export const updateTableCellValue = (cellId, newValue) => ({
  type: 'UPDATE_TABLE_CELL_VALUE',
  cellId,
  newValue,
  dirtying: true,
});

export const insertCapture = (templateId, content, shouldPrepend) => (dispatch, getState) => {
  dispatch(closePopup());

  const template = getState()
    .capture.get('captureTemplates')
    .concat(sampleCaptureTemplates)
    .find((template) => template.get('id') === templateId);
  dispatch({ type: 'INSERT_CAPTURE', template, content, shouldPrepend, dirtying: true });
};

export const clearPendingCapture = () => ({
  type: 'CLEAR_PENDING_CAPTURE',
});

export const insertPendingCapture = () => (dispatch, getState) => {
  const path = getState().org.present.get('path');
  const pendingCapture = getState().org.present.get('pendingCapture');
  const templateName = pendingCapture.get('captureTemplateName');
  const captureContent = pendingCapture.get('captureContent');
  const customCaptureVariables = pendingCapture.get('customCaptureVariables');

  dispatch(clearPendingCapture());
  window.history.pushState({}, '', window.location.pathname);

  const template = getState()
    .capture.get('captureTemplates')
    .filter(
      (template) =>
        template.get('isAvailableInAllOrgFiles') ||
        template.get('orgFilesWhereAvailable').includes(getState().org.present.get('path'))
    )
    .find((template) => template.get('description').trim() === templateName.trim());
  if (!template) {
    dispatch(
      setDisappearingLoadingMessage(
        `Capture failed: "${templateName}" template not found or not available in this file`,
        8000
      )
    );
    return;
  }

  const targetHeader = headerWithPath(
    getState().org.present.getIn(['files', path, 'headers']),
    template.get('headerPaths')
  );
  if (!targetHeader) {
    dispatch(
      setDisappearingLoadingMessage(
        `Capture failed: "${template.get('description')}" header path invalid in this file`,
        8000
      )
    );
    return;
  }

  const [substitutedTemplate, initialCursorIndex] = substituteTemplateVariables(
    template.get('template'),
    customCaptureVariables
  );

  const content = !!initialCursorIndex
    ? `${substitutedTemplate.substring(
        0,
        initialCursorIndex
      )}${captureContent}${substitutedTemplate.substring(initialCursorIndex)}`
    : `${substitutedTemplate}${captureContent}`;

  dispatch(insertCapture(template.get('id'), content, template.get('shouldPrepend')));
  dispatch(sync({ successMessage: 'Item captured' }));
};

export const advanceCheckboxState = (listItemId) => ({
  type: 'ADVANCE_CHECKBOX_STATE',
  listItemId,
  dirtying: true,
});

export const setHeaderTags = (headerId, tags) => ({
  type: 'SET_HEADER_TAGS',
  headerId,
  tags,
  dirtying: true,
});

export const reorderTags = (fromIndex, toIndex) => ({
  type: 'REORDER_TAGS',
  fromIndex,
  toIndex,
  dirtying: true,
});

export const reorderPropertyList = (fromIndex, toIndex) => (dispatch, getState) =>
  dispatch({
    type: 'REORDER_PROPERTY_LIST',
    fromIndex,
    toIndex,
    headerId: getState().base.getIn(['activePopup', 'data', 'headerId']),
    dirtying: true,
  });

/**
 * Action to change the timestamp using a cross-cutting id.
 *
 * @param {*} timestampId cross-cutting id of the timestamp (might be in the title or description).
 * @param {*} newTimestamp the new value for the timestamp;
 *                         must have the form: {id:, type:, firstTimestamp:, secondTimestamp:}.
 */
export const updateTimestampWithId = (timestampId, newTimestamp) => ({
  type: 'UPDATE_TIMESTAMP_WITH_ID',
  timestampId,
  newTimestamp,
  dirtying: true,
});

export const updatePlanningItemTimestamp = (headerId, planningItemIndex, newTimestamp) => ({
  type: 'UPDATE_PLANNING_ITEM_TIMESTAMP',
  headerId,
  planningItemIndex,
  newTimestamp,
  dirtying: true,
});

export const addNewPlanningItem = (headerId, planningType) => ({
  type: 'ADD_NEW_PLANNING_ITEM',
  headerId,
  planningType,
  dirtying: true,
  timestamp: new Date(),
});

export const removePlanningItem = (headerId, planningItemIndex) => ({
  type: 'REMOVE_PLANNING_ITEM',
  headerId,
  planningItemIndex,
  dirtying: true,
});

export const updatePropertyListItems = (headerId, newPropertyListItems) => ({
  type: 'UPDATE_PROPERTY_LIST_ITEMS',
  headerId,
  newPropertyListItems,
  dirtying: true,
});

export const setOrgFileErrorMessage = (message) => ({
  type: 'SET_ORG_FILE_ERROR_MESSAGE',
  message,
});

export const setLogEntryStop = (headerId, entryId, time) => ({
  type: 'SET_LOG_ENTRY_STOP',
  headerId,
  entryId,
  time,
  dirtying: true,
});

export const createLogEntryStart = (headerId, time) => ({
  type: 'CREATE_LOG_ENTRY_START',
  headerId,
  time,
  dirtying: true,
});

export const updateLogEntryTime = (headerId, entryIndex, entryType, newTime) => ({
  type: 'UPDATE_LOG_ENTRY_TIME',
  headerId,
  entryIndex,
  entryType,
  newTime,
  dirtying: true,
});

export const setSearchFilterInformation = (searchFilter, cursorPosition, context) => ({
  type: 'SET_SEARCH_FILTER_INFORMATION',
  searchFilter,
  cursorPosition,
  context,
});

export const setShowClockDisplay = (showClockDisplay) => ({
  type: 'TOGGLE_CLOCK_DISPLAY',
  showClockDisplay,
});

export const updateFileSettingFieldPathValue = (settingId, fieldPath, newValue) => ({
  type: 'UPDATE_FILE_SETTING_FIELD_PATH_VALUE',
  settingId,
  fieldPath,
  newValue,
});

export const reorderFileSetting = (fromIndex, toIndex) => ({
  type: 'REORDER_FILE_SETTING',
  fromIndex,
  toIndex,
});

export const deleteFileSetting = (settingId) => ({
  type: 'DELETE_FILE_SETTING',
  settingId,
});

export const addNewEmptyFileSetting = () => (dispatch) =>
  dispatch({ type: 'ADD_NEW_EMPTY_FILE_SETTING' });

export const restoreFileSettings = (newSettings) => ({
  type: 'RESTORE_FILE_SETTINGS',
  newSettings,
});
