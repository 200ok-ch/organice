import { ActionTypes } from 'redux-linear-undo';
import {
  setLoadingMessage,
  hideLoadingMessage,
  setIsLoading,
  setDisappearingLoadingMessage,
  activatePopup,
  closePopup,
} from './base';
import exportOrg from '../lib/export_org';
import substituteTemplateVariables from '../lib/capture_template_substitution';
import { headerWithPath } from '../lib/org_utils';

import sampleCaptureTemplates from '../lib/sample_capture_templates';

import moment from 'moment';

export const displayFile = (path, contents) => ({
  type: 'DISPLAY_FILE',
  path,
  contents,
});

export const setLastSyncAt = lastSyncAt => ({
  type: 'SET_LAST_SYNC_AT',
  lastSyncAt,
});

export const stopDisplayingFile = () => {
  return (dispatch, getState) => {
    dispatch({ type: 'STOP_DISPLAYING_FILE' });
    dispatch({ type: ActionTypes.CLEAR_HISTORY });
    dispatch(unfocusHeader());
    dispatch(closePopup());
    dispatch(setLastSyncAt(null));
  };
};

export const sync = ({
  forceAction = null,
  successMessage = 'Changes pushed',
  shouldSuppressMessages = false,
} = {}) => (dispatch, getState) => {
  const client = getState().syncBackend.get('client');
  const path = getState().org.present.get('path');
  if (path === null) {
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
      const isDirty = getState().org.present.get('isDirty');
      const lastServerModifiedAt = moment(lastModifiedAt);
      const lastSyncAt = getState().org.present.get('lastSyncAt');

      if (lastSyncAt.isAfter(lastServerModifiedAt, 'second') || forceAction === 'push') {
        if (isDirty) {
          client
            .updateFile(
              path,
              exportOrg(
                getState().org.present.get('headers'),
                getState().org.present.get('todoKeywordSets')
              )
            )
            .then(() => {
              if (!shouldSuppressMessages) {
                dispatch(setDisappearingLoadingMessage(successMessage, 2000));
              }
              dispatch(setIsLoading(false));
              dispatch(setDirty(false));
              dispatch(setLastSyncAt(moment().add(5, 'seconds')));
            })
            .catch(error => {
              alert(`There was an error pushing the file: ${error.toString()}`);
              dispatch(hideLoadingMessage());
              dispatch(setIsLoading(false));
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
          dispatch(setLastSyncAt(moment().add(5, 'seconds')));
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

export const openHeader = headerId => ({
  type: 'OPEN_HEADER',
  headerId,
});

export const toggleHeaderOpened = headerId => ({
  type: 'TOGGLE_HEADER_OPENED',
  headerId,
});

export const selectHeader = headerId => dispatch => {
  dispatch({ type: 'SELECT_HEADER', headerId });

  if (!!headerId) {
    dispatch(setSelectedTableCellId(null));
  }
};

export const selectHeaderAndOpenParents = headerId => dispatch => {
  dispatch(selectHeader(headerId));
  dispatch({ type: 'OPEN_PARENTS_OF_HEADER', headerId });
};

export const advanceTodoState = (headerId = null) => ({
  type: 'ADVANCE_TODO_STATE',
  headerId,
  dirtying: true,
});

export const enterEditMode = editModeType => ({
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

export const addHeader = headerId => ({
  type: 'ADD_HEADER',
  headerId,
  dirtying: true,
});

export const selectNextSiblingHeader = headerId => ({
  type: 'SELECT_NEXT_SIBLING_HEADER',
  headerId,
});

export const addHeaderAndEdit = headerId => dispatch => {
  dispatch(addHeader(headerId));
  dispatch(selectNextSiblingHeader(headerId));
  dispatch(enterEditMode('title'));
};

export const selectNextVisibleHeader = headerId => ({
  type: 'SELECT_NEXT_VISIBLE_HEADER',
  headerId,
});

export const selectPreviousVisibleHeader = headerId => ({
  type: 'SELECT_PREVIOUS_VISIBLE_HEADER',
  headerId,
});

export const removeHeader = headerId => ({
  type: 'REMOVE_HEADER',
  headerId,
  dirtying: true,
});

export const moveHeaderUp = headerId => ({
  type: 'MOVE_HEADER_UP',
  headerId,
  dirtying: true,
});

export const moveHeaderDown = headerId => ({
  type: 'MOVE_HEADER_DOWN',
  headerId,
  dirtying: true,
});

export const moveHeaderLeft = headerId => ({
  type: 'MOVE_HEADER_LEFT',
  headerId,
  dirtying: true,
});

export const moveHeaderRight = headerId => ({
  type: 'MOVE_HEADER_RIGHT',
  headerId,
  dirtying: true,
});

export const moveSubtreeLeft = headerId => ({
  type: 'MOVE_SUBTREE_LEFT',
  headerId,
  dirtying: true,
});

export const moveSubtreeRight = headerId => ({
  type: 'MOVE_SUBTREE_RIGHT',
  headerId,
  dirtying: true,
});

export const focusHeader = headerId => ({
  type: 'FOCUS_HEADER',
  headerId,
});

export const unfocusHeader = () => ({
  type: 'UNFOCUS_HEADER',
});

export const noOp = () => ({
  type: 'NO_OP',
});

export const applyOpennessState = () => ({
  type: 'APPLY_OPENNESS_STATE',
});

export const setDirty = isDirty => ({
  type: 'SET_DIRTY',
  isDirty,
});

export const setSelectedTableCellId = cellId => dispatch => {
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
    .find(template => template.get('id') === templateId);
  dispatch({ type: 'INSERT_CAPTURE', template, content, shouldPrepend, dirtying: true });
};

export const clearPendingCapture = () => ({
  type: 'CLEAR_PENDING_CAPTURE',
});

export const insertPendingCapture = () => (dispatch, getState) => {
  const pendingCapture = getState().org.present.get('pendingCapture');
  const templateName = pendingCapture.get('captureTemplateName');
  const captureContent = pendingCapture.get('captureContent');
  const customCaptureVariables = pendingCapture.get('customCaptureVariables');

  dispatch(clearPendingCapture());
  window.history.pushState({}, '', window.location.pathname);

  const template = getState()
    .capture.get('captureTemplates')
    .filter(
      template =>
        template.get('isAvailableInAllOrgFiles') ||
        template.get('orgFilesWhereAvailable').includes(getState().org.present.get('path'))
    )
    .find(template => template.get('description').trim() === templateName.trim());
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
    getState().org.present.get('headers'),
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

export const advanceCheckboxState = listItemId => ({
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
});

export const updatePropertyListItems = (headerId, newPropertyListItems) => ({
  type: 'UPDATE_PROPERTY_LIST_ITEMS',
  headerId,
  newPropertyListItems,
  dirtying: true,
});

export const setOrgFileErrorMessage = message => ({
  type: 'SET_ORG_FILE_ERROR_MESSAGE',
  message,
});
