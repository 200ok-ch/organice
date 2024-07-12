/* global process */

import { Map, List, fromJS } from 'immutable';
import _ from 'lodash';

import headline_filter_parser from '../lib/headline_filter_parser';
import { isMatch, computeCompletionsForDatalist, timeFilter } from '../lib/headline_filter';
import {
  updateHeadersTotalTimeLoggedRecursive,
  totalFilteredTimeLogged,
  updateHeadersTotalFilteredTimeLoggedRecursive,
  hasActiveClock,
} from '../lib/clocking';

import {
  extractAllOrgTags,
  extractAllOrgProperties,
  getTodoKeywordSetsAsFlattenedArray,
  STATIC_FILE_PREFIX,
} from '../lib/org_utils';

import {
  parseOrg,
  parseTitleLine,
  parseRawText,
  parseMarkupAndCookies,
  newHeaderWithTitle,
  newHeaderFromText,
  updatePlanningItems,
  updatePlanningItemsFromHeader,
  _updateHeaderFromDescription,
} from '../lib/parse_org';
import { attributedStringToRawText } from '../lib/export_org';
import {
  indexOfHeaderWithId,
  indexAndHeaderWithId,
  parentIdOfHeaderWithId,
  subheadersOfHeaderWithId,
  subheaderIndicesOfHeaderWithId,
  numSubheadersOfHeaderWithId,
  indexOfPreviousSibling,
  openDirectParent,
  openHeaderWithPath,
  nextVisibleHeaderAfterIndex,
  previousVisibleHeaderAfterIndex,
  updateTableContainingCellId,
  newEmptyTableRowLikeRows,
  newEmptyTableCell,
  headerThatContainsTableCellId,
  headerWithPath,
  pathAndPartOfListItemWithIdInHeaders,
  pathAndPartOfTimestampItemWithIdInHeaders,
  todoKeywordSetForKeyword,
  inheritedValueOfProperty,
  newListItem,
  parentListItemWithIdInHeaders,
  updateListContainingListItemId,
  headerThatContainsListItemId,
  updateContentsWithListItemAddition,
} from '../lib/org_utils';
import { timestampForDate, getTimestampAsText, applyRepeater } from '../lib/timestamps';
import generateId from '../lib/id_generator';
import { formatTextWrap } from '../util/misc';
import { applyFileSettingsFromConfig } from '../util/settings_persister';

export const parseFile = (state, action) => {
  const { path, contents } = action;

  const parsedFile = parseOrg(contents);

  return state
    .setIn(['files', path, 'headers'], parsedFile.get('headers'))
    .setIn(['files', path, 'todoKeywordSets'], parsedFile.get('todoKeywordSets'))
    .setIn(['files', path, 'fileConfigLines'], parsedFile.get('fileConfigLines'))
    .setIn(['files', path, 'linesBeforeHeadings'], parsedFile.get('linesBeforeHeadings'))
    .setIn(['files', path, 'activeClocks'], parsedFile.get('activeClocks'));
};

const clearSearch = (state) => state.setIn(['search', 'filteredHeaders'], null);

const openHeader = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  return state.setIn(['headers', headerIndex, 'opened'], true);
};

const toggleHeaderOpened = (state, action) => {
  const headers = state.get('headers');

  const { header, headerIndex } = indexAndHeaderWithId(headers, action.headerId);
  const isOpened = header.get('opened');

  if (isOpened && state.get('narrowedHeaderId') === action.headerId) {
    return state;
  }

  if (isOpened && action.closeSubheadersRecursively) {
    const subheaderIndices = subheaderIndicesOfHeaderWithId(headers, action.headerId);
    subheaderIndices.forEach((index) => {
      state = state.setIn(['headers', index, 'opened'], false);
    });
  }

  return state.setIn(['headers', headerIndex, 'opened'], !isOpened);
};

const selectHeader = (state, action) => {
  return state.set('selectedHeaderId', action.headerId);
};

const openParentsOfHeader = (state, action) => {
  let headers = state.get('headers');
  const { headerId } = action;

  let parentHeaderId = parentIdOfHeaderWithId(headers, headerId);
  while (!!parentHeaderId) {
    const parentHeaderIndex = indexOfHeaderWithId(headers, parentHeaderId);
    headers = headers.setIn([parentHeaderIndex, 'opened'], true);
    parentHeaderId = parentIdOfHeaderWithId(headers, parentHeaderId);
  }

  return state.set('headers', headers);
};

const updateCookiesInAttributedStringWithChildCompletionStates = (parts, completionStates) => {
  const doneCount = completionStates.filter((isDone) => isDone).length;
  const totalCount = completionStates.length;

  return parts.map((part) => {
    switch (part.get('type')) {
      case 'fraction-cookie':
        return part.set('fraction', List([doneCount, totalCount]));
      case 'percentage-cookie':
        return part.set('percentage', Math.floor((doneCount / totalCount) * 100));
      default:
        return part;
    }
  });
};

const updateCookiesOfHeaderWithId = (file, headerId) => {
  const headers = file.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, headerId);
  const subheaders = subheadersOfHeaderWithId(headers, headerId);

  const directChildren = [];
  for (let i = 0; i < subheaders.size; ++i) {
    const subheader = subheaders.get(i);
    directChildren.push(subheader);

    const subheaderSubheaders = subheadersOfHeaderWithId(headers, subheader.get('id'));
    i += subheaderSubheaders.size;
  }

  let completionStates = directChildren
    .map((header) => header.getIn(['titleLine', 'todoKeyword']))
    .filter((todoKeyword) => !!todoKeyword)
    .map((todoKeyword) =>
      todoKeywordSetForKeyword(file.get('todoKeywordSets'), todoKeyword)
        .get('completedKeywords')
        .contains(todoKeyword)
    );

  // If there are no headers with possible completion states, check for plain lists instead.
  if (completionStates.length === 0) {
    completionStates = headers
      .get(headerIndex)
      .get('description')
      .filter((part) => part.get('type') === 'list')
      .flatMap((listPart) => listPart.get('items'))
      .filter((item) => item.get('isCheckbox'))
      .map((item) => item.get('checkboxState') === 'checked')
      .toJS();
  }

  return file
    .updateIn(['headers', headerIndex, 'titleLine', 'title'], (title) =>
      updateCookiesInAttributedStringWithChildCompletionStates(title, completionStates)
    )
    .updateIn(['headers', headerIndex, 'titleLine'], (titleLine) =>
      titleLine.set('rawTitle', attributedStringToRawText(titleLine.get('title')))
    );
};

const updateCookiesOfParentOfHeaderWithId = (file, headerId) => {
  const parentHeaderId = parentIdOfHeaderWithId(file.get('headers'), headerId);
  if (!parentHeaderId) {
    return file;
  }

  return updateCookiesOfHeaderWithId(file, parentHeaderId);
};

const addLogNote = (state, action) => {
  const { headerIndex, logText } = action;
  return state.updateIn(['headers', headerIndex], (header) => {
    const updatedHeader = header.update('logNotes', (logNotes) =>
      parseRawText(logText + (logNotes.isEmpty() ? '\n' : '')).concat(logNotes)
    );
    return updatedHeader.set('planningItems', updatePlanningItemsFromHeader(updatedHeader));
  });
};

const addLogBookEntry = (state, action) => {
  const { headerIndex, logBookEntry } = action;
  // Prepend this single item to the :LOGBOOK: drawer, same as org-log-into-drawer setting
  // https://www.gnu.org/software/emacs/manual/html_node/org/Tracking-TODO-state-changes.html
  const newEntry = fromJS({
    id: generateId(),
    raw: logBookEntry,
  });

  return state.updateIn(['headers', headerIndex, 'logBookEntries'], (entries) =>
    entries.unshift(newEntry)
  );
};

/**
 * Add CLOSED: [timestamp] to the heading body or LOGBOOK drawer.
 * @param {*} state
 * @param {*} headerIndex Index of header where the state change log item should be added.
 * @param {boolean} logIntoDrawer By default false, so add log messages as bullets into the body. If true, add into LOGBOOK drawer.
 @param {boolean} logDone By default false, so this will not run if logDone is not set in buffer or settings. If true, will be added to either the headline or logbook of a note, depending on logIntoDrawer settings.
 @param {string} timeestamp time for the entry.
 */
const addLogDone = (state, action) => {
  const { headerIndex, logIntoDrawer, logDone, timestamp } = action;
  if (!logDone && !logDoneEnabledP({ state, headerIndex })) {
    return state;
  }

  const logTimestamp = getTimestampAsText(timestamp, { isActive: false, withStartTime: true });
  const logBookEntry = `CLOSED: ${logTimestamp}`;
  if (!logIntoDrawer) {
    const logText = logBookEntry;
    return addLogNote(state, { headerIndex, logText });
  }

  return addLogBookEntry(state, { headerIndex, logBookEntry });
};

const advanceTodoState = (state, action) => {
  const { headerId, logIntoDrawer, logDone, timestamp } = action;
  const existingHeaderId = headerId || state.get('selectedHeaderId');
  if (!existingHeaderId) {
    return state;
  }

  const headers = state.get('headers');
  const { header, headerIndex } = indexAndHeaderWithId(headers, existingHeaderId);

  const currentTodoState = header.getIn(['titleLine', 'todoKeyword']);
  const currentTodoSet = todoKeywordSetForKeyword(state.get('todoKeywordSets'), currentTodoState);

  const currentStateIndex = currentTodoSet.get('keywords').indexOf(currentTodoState);
  const newStateIndex = currentStateIndex + 1;
  const newTodoState = currentTodoSet.get('keywords').get(newStateIndex) || '';

  const indexedPlanningItemsWithRepeaters = header
    .get('planningItems')
    .map((planningItem, index) => [planningItem, index])
    .filter(([planningItem]) => !!planningItem.getIn(['timestamp', 'repeaterType']));

  state = updateHeadlines({
    currentTodoSet,
    newTodoState,
    indexedPlanningItemsWithRepeaters,
    state,
    headerIndex,
    currentTodoState,
    logIntoDrawer,
    logDone,
    timestamp,
  });

  state = updateCookiesOfParentOfHeaderWithId(state, existingHeaderId);

  const lastStateIndex = currentTodoSet.get('keywords').count() - 1;
  if (newStateIndex === lastStateIndex) {
    return addLogDone(state, { headerIndex, logIntoDrawer, logDone, timestamp });
  }

  return state;
};

const setTodoState = (state, action) => {
  const { headerId, logIntoDrawer, newTodoState, timestamp } = action;
  const existingHeaderId = headerId || state.get('selectedHeaderId');
  if (!existingHeaderId) {
    return state;
  }

  const headers = state.get('headers');
  const { header, headerIndex } = indexAndHeaderWithId(headers, existingHeaderId);

  const currentTodoState = header.getIn(['titleLine', 'todoKeyword']);
  const currentTodoSet = todoKeywordSetForKeyword(state.get('todoKeywordSets'), currentTodoState);
  const newTodoSet = todoKeywordSetForKeyword(state.get('todoKeywordSets'), newTodoState);
  const isInSameTodoSet = currentTodoSet === newTodoSet;

  if (isInSameTodoSet) {
    const indexedPlanningItemsWithRepeaters = header
      .get('planningItems')
      .map((planningItem, index) => [planningItem, index])
      .filter(([planningItem]) => !!planningItem.getIn(['timestamp', 'repeaterType']));

    state = updateHeadlines({
      currentTodoSet,
      newTodoState,
      indexedPlanningItemsWithRepeaters,
      state,
      headerIndex,
      currentTodoState,
      logIntoDrawer,
      timestamp,
    });
  } else {
    state = state.setIn(['headers', headerIndex, 'titleLine', 'todoKeyword'], newTodoState);
  }

  state = updateCookiesOfParentOfHeaderWithId(state, existingHeaderId);

  return state;
};

const enterEditMode = (state, action) => state.set('editMode', action.editModeType);

const exitEditMode = (state) => state.set('editMode', null);

const updateHeaderTitle = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);
  const todoKeywordSets = state.get('todoKeywordSets');

  const newTitleLine = parseTitleLine(action.newRawTitle.trim(), todoKeywordSets);

  state = state.setIn(['headers', headerIndex, 'titleLine'], newTitleLine);

  state = state.updateIn(['headers', headerIndex, 'planningItems'], (planningItems) =>
    updatePlanningItems(planningItems, 'TIMESTAMP_TITLE', newTitleLine.get('title'))
  );

  return updateCookiesOfParentOfHeaderWithId(state, action.headerId);
};

const updateHeaderDescription = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  return state.updateIn(['headers', headerIndex], (header) =>
    _updateHeaderFromDescription(header, action.newRawDescription)
  );
};

const addHeader = (state, action) => {
  const headers = state.get('headers');
  const { header, headerIndex } = indexAndHeaderWithId(headers, action.headerId);

  const subheaders = subheadersOfHeaderWithId(headers, action.headerId);

  const todoKeyword = header.getIn(['titleLine', 'todoKeyword']);

  const newHeader = newHeaderWithTitle(
    todoKeyword ? todoKeyword + ' ' : '',
    header.get('nestingLevel'),
    state.get('todoKeywordSets')
  );

  if (action.headerId === state.get('narrowedHeaderId')) {
    state = state.set('narrowedHeaderId', null);
  }

  return state.update('headers', (headers) =>
    headers.insert(headerIndex + subheaders.size + 1, newHeader)
  );
};

const createFirstHeader = (state) => {
  let newHeader = newHeaderWithTitle('First header', 1, state.get('todoKeywordSets'));

  let description = 'Extend the file from here';
  if (state.get('linesBeforeHeadings').size > 0) {
    description = state.get('linesBeforeHeadings').toJS().join('\n');

    state = state.set('linesBeforeHeadings', List());
  }

  newHeader = _updateHeaderFromDescription(newHeader, description);

  return state.update('headers', (headers) => headers.insert(0, newHeader));
};

const selectNextSiblingHeader = (state, action) => {
  const headers = state.get('headers');
  const { header, headerIndex } = indexAndHeaderWithId(headers, action.headerId);
  const subheaders = subheadersOfHeaderWithId(headers, action.headerId);

  const nextSibling = headers.get(headerIndex + subheaders.size + 1);

  if (!nextSibling || nextSibling.get('nestingLevel') !== header.get('nestingLevel')) {
    return state;
  }

  return state.set('selectedHeaderId', nextSibling.get('id'));
};

const selectNextVisibleHeader = (state) => {
  const headers = state.get('headers');

  if (state.get('selectedHeaderId') === undefined) {
    return state.set('selectedHeaderId', headers.getIn([0, 'id']));
  }

  const headerIndex = indexOfHeaderWithId(headers, state.get('selectedHeaderId'));

  const nextVisibleHeader = nextVisibleHeaderAfterIndex(headers, headerIndex);

  if (!nextVisibleHeader) {
    return state;
  }

  return state.set('selectedHeaderId', nextVisibleHeader.get('id'));
};

const selectPreviousVisibleHeader = (state) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, state.get('selectedHeaderId'));

  const previousVisibleHeader = previousVisibleHeaderAfterIndex(headers, headerIndex);

  if (!previousVisibleHeader) {
    return state;
  }

  return state.set('selectedHeaderId', previousVisibleHeader.get('id'));
};

const removeHeader = (state, action) => {
  let headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  const subheaders = subheadersOfHeaderWithId(headers, action.headerId);
  const numHeadersToRemove = 1 + subheaders.size;

  const parentHeaderId = parentIdOfHeaderWithId(headers, action.headerId);

  _.times(numHeadersToRemove).forEach(() => {
    headers = headers.delete(headerIndex);
  });

  if (action.headerId === state.get('narrowedHeaderId')) {
    state = state.set('narrowedHeaderId', null);
  }

  state = state.set('headers', headers);

  if (parentHeaderId) {
    state = updateCookiesOfHeaderWithId(state, parentHeaderId);
  }

  return state;
};

const moveHeaderUp = (state, action) => {
  let headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  const previousSiblingIndex = indexOfPreviousSibling(headers, headerIndex);
  if (previousSiblingIndex === null) {
    return state;
  }

  const subheaders = subheadersOfHeaderWithId(headers, action.headerId);
  _.times(1 + subheaders.size).forEach(() => {
    headers = headers.insert(previousSiblingIndex, headers.get(headerIndex + subheaders.size));
    headers = headers.delete(headerIndex + subheaders.size + 1);
  });

  return state.set('headers', headers);
};

const moveHeaderDown = (state, action) => {
  let headers = state.get('headers');
  const { header, headerIndex } = indexAndHeaderWithId(headers, action.headerId);

  const subheaders = subheadersOfHeaderWithId(headers, action.headerId);
  const nextSiblingIndex = headerIndex + subheaders.size + 1;
  const nextSibling = headers.get(nextSiblingIndex);
  if (!nextSibling || nextSibling.get('nestingLevel') < header.get('nestingLevel')) {
    return state;
  }

  const nextSiblingSubheaders = subheadersOfHeaderWithId(headers, nextSibling.get('id'));
  _.times(1 + nextSiblingSubheaders.size).forEach(() => {
    headers = headers.insert(
      headerIndex,
      headers.get(nextSiblingIndex + nextSiblingSubheaders.size)
    );
    headers = headers.delete(nextSiblingIndex + nextSiblingSubheaders.size + 1);
  });

  return state.set('headers', headers);
};

const moveHeaderLeft = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  const previousParentHeaderId = parentIdOfHeaderWithId(headers, action.headerId);

  state = shiftTreeNestingLevel({ state, headerIndex }, '-');
  state = updateCookies(state, previousParentHeaderId, action);

  return state;
};

const moveHeaderRight = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  const previousParentHeaderId = parentIdOfHeaderWithId(headers, action.headerId);

  state = shiftTreeNestingLevel({ state, headerIndex }, '+');
  state = openDirectParent(state, action.headerId);
  state = updateCookies(state, previousParentHeaderId, action);

  return state;
};

const moveSubtreeLeft = (state, action) => {
  const headers = state.get('headers');
  const { header, headerIndex } = indexAndHeaderWithId(headers, action.headerId);

  const previousParentHeaderId = parentIdOfHeaderWithId(headers, action.headerId);

  if (header.get('nestingLevel') === 1) {
    return state;
  }

  const subheaders = subheadersOfHeaderWithId(headers, action.headerId);

  state = shiftTreeNestingLevel({ state, headerIndex, subheaders }, '-');
  state = updateCookies(state, previousParentHeaderId, action);

  return state;
};

const moveSubtreeRight = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  const previousParentHeaderId = parentIdOfHeaderWithId(headers, action.headerId);

  const subheaders = subheadersOfHeaderWithId(headers, action.headerId);

  state = shiftTreeNestingLevel({ state, headerIndex, subheaders }, '+');
  state = updateCookies(state, previousParentHeaderId, action);

  return openDirectParent(state, action.headerId);
};

/**
 * Move an item in immutablejs Lists.
 * @param {list} List
 * @param {integer} fromIndex
 * @param {integer} toIndex
 * @param {any} integer
 */
const moveItemInFile = ({ fromList, fromIndex, toIndex, item }) => {
  const targetItem = fromList.get(toIndex);
  fromList = fromList.delete(fromIndex);
  const targetIndex = fromList.indexOf(targetItem);
  fromList = fromList.insert(targetIndex + 1, item);
  return [fromList, fromList];
};

const moveItemAcrossFiles = ({ fromList, fromIndex, toList, toIndex, item }) => {
  const targetItem = toList.get(toIndex);
  fromList = fromList.delete(fromIndex);
  const targetIndex = toList.indexOf(targetItem);
  toList = toList.insert(targetIndex + 1, item);
  return [fromList, toList];
};

const refileSubtree = (state, action) => {
  const { sourcePath, sourceHeaderId, targetPath, targetHeaderId } = action;
  const moveItem = sourcePath === targetPath ? moveItemInFile : moveItemAcrossFiles;
  let sourceHeaders = state.getIn(['files', sourcePath, 'headers']);
  let targetHeaders = state.getIn(['files', targetPath, 'headers']);
  let { header: sourceHeader, headerIndex: sourceHeaderIndex } = indexAndHeaderWithId(
    sourceHeaders,
    sourceHeaderId
  );
  let targetHeaderIndex = indexOfHeaderWithId(targetHeaders, targetHeaderId);

  let subheadersOfSourceHeader = subheadersOfHeaderWithId(sourceHeaders, sourceHeaderId);

  const nestingLevelSource = sourceHeaders.getIn([sourceHeaderIndex, 'nestingLevel']);
  const nestingLevelTarget = targetHeaders.getIn([targetHeaderIndex, 'nestingLevel']);

  // Indent the newly placed sourceheader so that it fits underneath the targetHeader
  sourceHeader = sourceHeader.set('nestingLevel', nestingLevelTarget + 1);

  // Put the sourceHeader into the right slot after the targetHeader
  [sourceHeaders, targetHeaders] = moveItem({
    fromList: sourceHeaders,
    fromIndex: sourceHeaderIndex,
    toList: targetHeaders,
    toIndex: targetHeaderIndex,
    item: sourceHeader,
  });

  // Put the subheaders of the sourceHeader right after
  subheadersOfSourceHeader.forEach((subheader, index) => {
    subheader = subheader.set(
      'nestingLevel',
      // target
      // 1
      //   source
      //   2 (1)
      //     subheader
      //      3 (2)
      //       subheader
      //       4 (3)
      subheader.get('nestingLevel') - nestingLevelSource + nestingLevelTarget + 1
    );
    const fromIndex = indexOfHeaderWithId(sourceHeaders, subheader.get('id'));

    targetHeaderIndex = indexOfHeaderWithId(targetHeaders, targetHeaderId);
    const toIndex = targetHeaderIndex + index + 1;

    [sourceHeaders, targetHeaders] = moveItem({
      fromList: sourceHeaders,
      fromIndex,
      toList: targetHeaders,
      toIndex,
      item: subheader,
    });
  });

  state = state.setIn(['files', sourcePath, 'headers'], sourceHeaders);
  state = state.setIn(['files', targetPath, 'headers'], targetHeaders);

  state = state.updateIn(['files', sourcePath], (file) =>
    updateCookies(file, sourceHeaderId, action)
  );
  state = state.updateIn(['files', targetPath], (file) =>
    updateCookies(file, targetHeaderId, action)
  );

  return state;
};

// Add a log note to the selected header. This can be any type of log
// note as defined in the Emacs Org mode variable
// `org-log-note-headings`.
const addNoteGeneric = (state, action) => {
  const { noteText } = action;
  const headerId = state.get('selectedHeaderId');
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, headerId);

  return state.updateIn(['headers', headerIndex], (header) => {
    const updatedHeader = header.update('logNotes', (logNotes) =>
      parseRawText(noteText + (logNotes.isEmpty() ? '\n' : '')).concat(logNotes)
    );
    return updatedHeader.set('planningItems', updatePlanningItemsFromHeader(updatedHeader));
  });
};

// See Emacs Org mode `org-add-note` (C-c C-z) and variable
// `org-log-note-headings`.
const addNote = (state, action) => {
  const { inputText, currentDate } = action;
  // Wrap line at 70 characters, see Emacs `fill-column` in "Insert
  // note" window (C-c C-z)
  const wrappedInput = formatTextWrap(inputText, 70).replace(/\n(.)/g, '\n  $1');
  // Generate note based on a template string (as defined in Emacs Org
  // mode `org-log-note-headings`):
  const timestamp = getTimestampAsText(currentDate, { isActive: false, withStartTime: true });
  const noteText = `- Note taken on ${timestamp} \\\\\n  ${wrappedInput}`;
  return addNoteGeneric(state, { noteText });
};

const narrowHeader = (state, action) => {
  return state.set('narrowedHeaderId', action.headerId);
};

const widenHeader = (state) => state.set('narrowedHeaderId', null);

const applyOpennessState = (state, action) => {
  const { path } = action;
  const opennessState = state.get('opennessState');
  if (!opennessState) {
    return state;
  }

  const fileOpennessState = opennessState.get(path);
  if (!fileOpennessState || fileOpennessState.size === 0) {
    return state;
  }

  let headers = state.getIn(['files', path, 'headers']);
  fileOpennessState.forEach((openHeaderPath) => {
    headers = openHeaderWithPath(headers, openHeaderPath);
  });

  return state.setIn(['files', path, 'headers'], headers);
};

const setOpennessState = (state, action) => {
  const { path, opennessState } = action;
  return state.setIn(['opennessState', path], fromJS(opennessState));
};

const setDirty = (state, action) => state.set('isDirty', action.isDirty);

const setSelectedTableId = (state, action) => state.set('selectedTableId', action.tableId);

const setSelectedTableCellId = (state, action) => state.set('selectedTableCellId', action.cellId);

const updateDescriptionOfHeaderContainingTableCell = (state, cellId, header = null) => {
  const headers = state.get('headers');
  if (!header) {
    header = headerThatContainsTableCellId(headers, cellId);
  }
  const headerIndex = indexOfHeaderWithId(headers, header.get('id'));

  return state.updateIn(['headers', headerIndex], (header) =>
    header.set('rawDescription', attributedStringToRawText(header.get('description')))
  );
};

const addNewTableRow = (state) => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  state = state.update('headers', (headers) =>
    updateTableContainingCellId(headers, selectedTableCellId, (rowIndex) => (rows) =>
      rows.insert(rowIndex + 1, newEmptyTableRowLikeRows(rows))
    )
  );

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId);
};

const removeTableRow = (state) => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  const containingHeader = headerThatContainsTableCellId(state.get('headers'), selectedTableCellId);

  state = state.update('headers', (headers) =>
    updateTableContainingCellId(headers, selectedTableCellId, (rowIndex) => (rows) =>
      rows.delete(rowIndex)
    )
  );

  state = state.set('selectedTableCellId', null);

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId, containingHeader);
};

const addNewTableColumn = (state) => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  state = state.update('headers', (headers) =>
    updateTableContainingCellId(headers, selectedTableCellId, (_rowIndex, colIndex) => (rows) =>
      rows.map((row) =>
        row.update('contents', (contents) => contents.insert(colIndex + 1, newEmptyTableCell()))
      )
    )
  );

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId);
};

const removeTableColumn = (state) => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  const containingHeader = headerThatContainsTableCellId(state.get('headers'), selectedTableCellId);

  state = state.update('headers', (headers) =>
    updateTableContainingCellId(headers, selectedTableCellId, (_rowIndex, colIndex) => (rows) =>
      rows.map((row) => row.update('contents', (contents) => contents.delete(colIndex)))
    )
  );

  state = state.set('selectedTableCellId', null);

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId, containingHeader);
};

const moveTableRowDown = (state) => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  state = state.update('headers', (headers) =>
    updateTableContainingCellId(headers, selectedTableCellId, (rowIndex) => (rows) =>
      rowIndex + 1 === rows.size
        ? rows
        : rows.insert(rowIndex, rows.get(rowIndex + 1)).delete(rowIndex + 2)
    )
  );

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId);
};

const moveTableRowUp = (state) => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  state = state.update('headers', (headers) =>
    updateTableContainingCellId(headers, selectedTableCellId, (rowIndex) => (rows) =>
      rowIndex === 0 ? rows : rows.insert(rowIndex - 1, rows.get(rowIndex)).delete(rowIndex + 1)
    )
  );

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId);
};

const moveTableColumnLeft = (state) => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  state = state.update('headers', (headers) =>
    updateTableContainingCellId(headers, selectedTableCellId, (_rowIndex, columnIndex) => (rows) =>
      columnIndex === 0
        ? rows
        : rows.map((row) =>
            row.update('contents', (contents) =>
              contents.size === 0
                ? contents
                : contents
                    .insert(columnIndex - 1, contents.get(columnIndex))
                    .delete(columnIndex + 1)
            )
          )
    )
  );

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId);
};

const moveTableColumnRight = (state) => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  state = state.update('headers', (headers) =>
    updateTableContainingCellId(headers, selectedTableCellId, (_rowIndex, columnIndex) => (rows) =>
      columnIndex + 1 >= rows.getIn([0, 'contents']).size
        ? rows
        : rows.map((row) =>
            row.update('contents', (contents) =>
              contents.size === 0
                ? contents
                : contents
                    .insert(columnIndex, contents.get(columnIndex + 1))
                    .delete(columnIndex + 2)
            )
          )
    )
  );

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId);
};

const updateTableCellValue = (state, action) => {
  state = state.update('headers', (headers) =>
    updateTableContainingCellId(headers, action.cellId, (rowIndex, colIndex) => (rows) =>
      rows.updateIn([rowIndex, 'contents', colIndex], (cell) =>
        cell
          .set('rawContents', action.newValue)
          .set('contents', fromJS(parseMarkupAndCookies(action.newValue, { excludeCookies: true })))
      )
    )
  );

  return updateDescriptionOfHeaderContainingTableCell(state, action.cellId);
};

const insertCapture = (state, action) => {
  const headers = state.get('headers');
  const { template, content, shouldPrepend } = action;

  const { newIndex, nestingLevel, parentHeader } = insertCapturePosition(
    template,
    headers,
    shouldPrepend
  );
  if (newIndex === undefined) {
    // Should never happen; see comment in insertCapturePosition below.
    return state;
  }

  const newHeader = newHeaderFromText(content, state.get('todoKeywordSets')).set(
    'nestingLevel',
    nestingLevel
  );

  state = state.update('headers', (headers) => headers.insert(newIndex, newHeader));
  if (parentHeader !== undefined) {
    // We inserted the new header under a parent rather than at the top or
    // bottom of the file.
    state = updateCookiesOfHeaderWithId(state, parentHeader.get('id'));
  }

  return state;
};

const insertCapturePosition = (template, headers, shouldPrepend) => {
  const headerPaths = template.get('headerPaths');
  if (headerPaths.size === 0) {
    if (shouldPrepend) {
      // Insert at beginning of file
      return { newIndex: 0, nestingLevel: 1 };
    } else {
      // Insert at end of file
      return { newIndex: headers.size + 1, nestingLevel: 1 };
    }
  }

  const parentHeader = headerWithPath(headers, headerPaths);
  if (parentHeader == null) {
    // No parent header found.  In theory this shouldn't happen since
    // CaptureModal already checks whether a valid targetHeader can be
    // found if headerPaths is non-empty.
    return {};
  }
  const parentHeaderIndex = indexOfHeaderWithId(headers, parentHeader.get('id'));
  const numSubheaders = numSubheadersOfHeaderWithId(headers, parentHeader.get('id'));
  const newIndex = parentHeaderIndex + 1 + (shouldPrepend ? 0 : numSubheaders);
  const nestingLevel = parentHeader.get('nestingLevel') + 1;
  return { newIndex, nestingLevel, parentHeader };
};

const clearPendingCapture = (state) => state.set('pendingCapture', null);

const updateParentListCheckboxes = (state, itemPath) => {
  const parentListItemPath = itemPath.slice(0, itemPath.length - 4);
  const parentListItem = state.getIn(parentListItemPath);
  if (!parentListItem.get('isCheckbox')) {
    return state;
  }

  const childrenCheckedStates = parentListItem
    .get('contents')
    .filter((part) => part.get('type') === 'list')
    .flatMap((listPart) =>
      listPart
        .get('items')
        .filter((item) => item.get('isCheckbox'))
        .map((checkboxItem) => checkboxItem.get('checkboxState'))
    );

  if (childrenCheckedStates.every((state) => state === 'checked')) {
    state = state.setIn(parentListItemPath.concat(['checkboxState']), 'checked');
  } else if (childrenCheckedStates.every((state) => state === 'unchecked')) {
    state = state.setIn(parentListItemPath.concat(['checkboxState']), 'unchecked');
  } else {
    state = state.setIn(parentListItemPath.concat(['checkboxState']), 'partial');
  }

  const childCompletionStates = childrenCheckedStates
    .map((state) => {
      switch (state) {
        case 'checked':
          return true;
        case 'unchecked':
          return false;
        case 'partial':
          return false;
        default:
          if (process.env.NODE_ENV !== 'production') {
            throw Error("Unexpected checkboxState: '" + state + "'");
          } else {
            return false;
          }
      }
    })
    .toJS();

  state = state.updateIn(parentListItemPath.concat('titleLine'), (titleLine) =>
    updateCookiesInAttributedStringWithChildCompletionStates(titleLine, childCompletionStates)
  );

  return updateParentListCheckboxes(state, parentListItemPath);
};

const advanceCheckboxState = (state, action) => {
  const pathAndPart = pathAndPartOfListItemWithIdInHeaders(state.get('headers'), action.listItemId);
  const { path, listItemPart } = pathAndPart;

  const hasDirectCheckboxChildren = listItemPart
    .get('contents')
    .filter((part) => part.get('type') === 'list')
    .some((listPart) => listPart.get('items').some((item) => item.get('isCheckbox')));
  if (hasDirectCheckboxChildren) {
    return state;
  }

  const newCheckboxState = {
    checked: 'unchecked',
    unchecked: 'checked',
    partial: 'unchecked',
  }[listItemPart.get('checkboxState')];

  state = state.setIn(['headers'].concat(path).concat(['checkboxState']), newCheckboxState);
  state = updateParentListCheckboxes(state, ['headers'].concat(path));

  const headerIndex = path[0];
  state = updateCookiesOfHeaderWithId(state, state.getIn(['headers', headerIndex, 'id']));
  state = state.updateIn(['headers', headerIndex], (header) =>
    header.set('rawDescription', attributedStringToRawText(header.get('description')))
  );

  return state;
};

const setSelectedListItemId = (state, action) => state.set('selectedListItemId', action.listItemId);

const updateDescriptionOfHeaderContainingListItem = (state, listItemId, header = null) => {
  let headerIndex = -1;
  const headers = state.get('headers');
  if (!header) {
    const pathAndPart = pathAndPartOfListItemWithIdInHeaders(headers, listItemId);
    headerIndex = pathAndPart.path[0];
  } else {
    headerIndex = indexOfHeaderWithId(headers, header.get('id'));
  }

  if (headerIndex >= 0) {
    return state.updateIn(['headers', headerIndex], (header) =>
      header.set('rawDescription', attributedStringToRawText(header.get('description')))
    );
  } else {
    return state;
  }
};

const updateListTitleValue = (state, action) => {
  const selectedListItemId = action.listItemId;
  if (!selectedListItemId) {
    return state;
  }

  state = state.update('headers', (headers) =>
    updateListContainingListItemId(headers, selectedListItemId, (itemIndex) => (items) =>
      items.updateIn([itemIndex], (item) =>
        item.set('titleLine', fromJS(parseMarkupAndCookies(action.newValue)))
      )
    )
  );

  return updateDescriptionOfHeaderContainingListItem(state, selectedListItemId);
};

const updateListContentsValue = (state, action) => {
  const selectedListItemId = action.listItemId;
  if (!selectedListItemId) {
    return state;
  }

  state = state.update('headers', (headers) =>
    updateListContainingListItemId(headers, selectedListItemId, (itemIndex) => (items) =>
      items.updateIn([itemIndex], (item) =>
        item.set('contents', fromJS(parseRawText(action.newValue)))
      )
    )
  );

  return updateDescriptionOfHeaderContainingListItem(state, selectedListItemId);
};

const addNewListItem = (state) => {
  const selectedListItemId = state.get('selectedListItemId');
  if (!selectedListItemId) {
    return state;
  }

  const pathAndPart = pathAndPartOfListItemWithIdInHeaders(
    state.get('headers'),
    selectedListItemId
  );

  let newItem = newListItem();
  if (pathAndPart.listItemPart.get('isCheckbox')) {
    newItem = newItem.set('isCheckbox', true).set('checkboxState', 'unchecked');
  }

  state = state.update('headers', (headers) =>
    updateListContainingListItemId(headers, selectedListItemId, (itemIndex) => (items) =>
      items.insert(itemIndex + 1, newItem)
    )
  );
  return updateDescriptionOfHeaderContainingListItem(state, selectedListItemId);
};

const selectNextSiblingListItem = (state) => {
  const selectedListItemId = state.get('selectedListItemId');
  if (!selectedListItemId) {
    return state;
  }

  const pathAndPart = pathAndPartOfListItemWithIdInHeaders(
    state.get('headers'),
    selectedListItemId
  );
  let { path } = pathAndPart;
  path[path.length - 1] = path[path.length - 1] + 1;

  state = state.set('selectedListItemId', state.getIn(['headers'].concat(path).concat('id')));

  return state;
};

const removeListItem = (state) => {
  const selectedListItemId = state.get('selectedListItemId');
  if (!selectedListItemId) {
    return state;
  }

  const containingHeader = headerThatContainsListItemId(state.get('headers'), selectedListItemId);

  state = state.update('headers', (headers) =>
    updateListContainingListItemId(headers, selectedListItemId, (itemIndex) => (items) =>
      items.delete(itemIndex)
    )
  );

  state = state.set('selectedListItemId', null);

  return updateDescriptionOfHeaderContainingListItem(state, selectedListItemId, containingHeader);
};

const moveListItemUp = (state) => {
  const selectedListItemId = state.get('selectedListItemId');
  if (!selectedListItemId) {
    return state;
  }

  state = state.update('headers', (headers) =>
    updateListContainingListItemId(headers, selectedListItemId, (itemIndex) => (items) =>
      itemIndex === 0
        ? items
        : items.insert(itemIndex - 1, items.get(itemIndex)).delete(itemIndex + 1)
    )
  );
  return updateDescriptionOfHeaderContainingListItem(state, selectedListItemId);
};

const moveListItemDown = (state) => {
  const selectedListItemId = state.get('selectedListItemId');
  if (!selectedListItemId) {
    return state;
  }

  state = state.update('headers', (headers) =>
    updateListContainingListItemId(headers, selectedListItemId, (itemIndex) => (items) =>
      itemIndex + 1 === items.size
        ? items
        : items.insert(itemIndex, items.get(itemIndex + 1)).delete(itemIndex + 2)
    )
  );

  return updateDescriptionOfHeaderContainingListItem(state, selectedListItemId);
};

const moveListItemLeft = (state) => {
  const selectedListItemId = state.get('selectedListItemId');
  if (!selectedListItemId) {
    return state;
  }

  const pathAndPart = pathAndPartOfListItemWithIdInHeaders(
    state.get('headers'),
    selectedListItemId
  );

  const hasChildrenItem = pathAndPart.listItemPart
    .get('contents')
    .filter((part) => part.get('type') === 'list')
    .some((listPart) => listPart.get('items').size > 0);
  if (hasChildrenItem) {
    return state;
  }
  return moveListSubtreeLeft(state);
};

const moveListItemRight = (state) => {
  const selectedListItemId = state.get('selectedListItemId');
  if (!selectedListItemId) {
    return state;
  }

  const pathAndPart = pathAndPartOfListItemWithIdInHeaders(
    state.get('headers'),
    selectedListItemId
  );
  let { path, listItemPart: selectedListItem } = pathAndPart;
  const listPart = state.getIn(['headers'].concat(path.slice(0, path.length - 2)));
  const prevSiblingItemIndex = path[path.length - 1] - 1;

  if (prevSiblingItemIndex < 0) {
    return state;
  }

  state = state.update('headers', (headers) =>
    updateListContainingListItemId(headers, selectedListItemId, (itemIndex) => (items) =>
      items.delete(itemIndex)
    )
  );

  const prevSiblingItemContentsPath = ['headers']
    .concat(path.slice(0, path.length - 1))
    .concat(prevSiblingItemIndex)
    .concat('contents');

  const childrenListParts = selectedListItem
    .get('contents')
    .filter((part) => part.get('type') === 'list');

  selectedListItem = selectedListItem.update('contents', (contents) =>
    contents.filter((part) => part.get('type') !== 'list')
  );

  state = state.updateIn(prevSiblingItemContentsPath, (contents) =>
    updateContentsWithListItemAddition(contents, selectedListItem, listPart)
  );

  childrenListParts.map((listPart) =>
    listPart.get('items').forEach((item) => {
      state = state.updateIn(prevSiblingItemContentsPath, (contents) =>
        updateContentsWithListItemAddition(contents, item, listPart)
      );
    })
  );

  return updateDescriptionOfHeaderContainingListItem(state, selectedListItemId);
};

const moveListSubtreeLeft = (state) => {
  const selectedListItemId = state.get('selectedListItemId');
  if (!selectedListItemId) {
    return state;
  }

  const pathAndPart = pathAndPartOfListItemWithIdInHeaders(
    state.get('headers'),
    selectedListItemId
  );
  let { path, listItemPart: selectedListItem } = pathAndPart;
  const selectedListItemIndex = path[path.length - 1];
  if (path.filter((partOfPath) => partOfPath === 'items').length < 2) {
    return state;
  }

  const parentListItem = parentListItemWithIdInHeaders(
    state.getIn(['headers']),
    selectedListItemId
  );

  parentListItem
    .get('contents')
    .filter((part) => part.get('type') === 'list')
    .map((listPart) =>
      listPart.get('items').forEach((item, itemIndex) => {
        if (itemIndex > selectedListItemIndex) {
          selectedListItem = selectedListItem.update('contents', (contents) =>
            updateContentsWithListItemAddition(contents, item, listPart)
          );
        }
      })
    );

  state = state.update('headers', (headers) =>
    updateListContainingListItemId(headers, selectedListItemId, () => (items) =>
      items.filter((_item, index) => index < selectedListItemIndex)
    )
  );

  state = state.update('headers', (headers) =>
    updateListContainingListItemId(headers, parentListItem.get('id'), (itemIndex) => (items) =>
      items.insert(itemIndex + 1, selectedListItem)
    )
  );

  return updateDescriptionOfHeaderContainingListItem(state, selectedListItemId);
};

const moveListSubtreeRight = (state) => {
  const selectedListItemId = state.get('selectedListItemId');
  if (!selectedListItemId) {
    return state;
  }

  const pathAndPart = pathAndPartOfListItemWithIdInHeaders(
    state.get('headers'),
    selectedListItemId
  );
  const { path, listItemPart: selectedListItem } = pathAndPart;
  const listPart = state.getIn(['headers'].concat(path.slice(0, path.length - 2)));
  const prevSiblingItemIndex = path[path.length - 1] - 1;
  if (prevSiblingItemIndex < 0) {
    return state;
  }

  state = state.update('headers', (headers) =>
    updateListContainingListItemId(headers, selectedListItemId, (itemIndex) => (items) =>
      itemIndex === 0 ? items : items.delete(itemIndex)
    )
  );

  state = state.updateIn(
    ['headers']
      .concat(path.slice(0, path.length - 1))
      .concat(prevSiblingItemIndex)
      .concat('contents'),
    (contents) => updateContentsWithListItemAddition(contents, selectedListItem, listPart)
  );

  return updateDescriptionOfHeaderContainingListItem(state, selectedListItemId);
};

const setLastSyncAt = (state, action) => state.set('lastSyncAt', action.lastSyncAt);

const setHeaderTags = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);
  if (headerIndex === -1) {
    return state;
  }

  return state.setIn(['headers', headerIndex, 'titleLine', 'tags'], action.tags);
};

const reorderTags = (state, action) => {
  const selectedHeaderId = state.get('selectedHeaderId');
  if (!selectedHeaderId) {
    return state;
  }
  const headerIndex = indexOfHeaderWithId(state.get('headers'), selectedHeaderId);

  return state.updateIn(['headers', headerIndex, 'titleLine', 'tags'], (tags) =>
    tags.splice(action.fromIndex, 1).splice(action.toIndex, 0, tags.get(action.fromIndex))
  );
};

const reorderPropertyList = (state, action) => {
  const headerId = action.headerId;
  if (!headerId) {
    return state;
  }
  const headerIndex = indexOfHeaderWithId(state.get('headers'), headerId);

  return state.updateIn(['headers', headerIndex, 'propertyListItems'], (propertyListItems) =>
    propertyListItems
      .splice(action.fromIndex, 1)
      .splice(action.toIndex, 0, propertyListItems.get(action.fromIndex))
  );
};

const updateTimestampWithId = (state, action) => {
  const pathAndPart = pathAndPartOfTimestampItemWithIdInHeaders(
    state.get('headers'),
    action.timestampId
  );
  if (!pathAndPart) {
    return state;
  }

  const { path } = pathAndPart;
  const headerIndex = path[0];

  return state
    .setIn(['headers'].concat(path), action.newTimestamp)
    .updateIn(['headers', headerIndex], (header) => {
      const description = header.get('description');
      const title = header.getIn(['titleLine', 'title']);

      return header
        .setIn(['titleLine', 'rawTitle'], attributedStringToRawText(title))
        .set('rawDescription', attributedStringToRawText(description))
        .set('planningItems', updatePlanningItemsFromHeader(header));
    });
};

// This is for special planning items like SCHEDULED: and DEADLINE:; but not
// for normal active timestamps (which are also added to planning items).
const updatePlanningItemTimestamp = (state, action) => {
  const { headerId, planningItemIndex, newTimestamp } = action;
  const headerIndex = indexOfHeaderWithId(state.get('headers'), headerId);

  return state.setIn(
    ['headers', headerIndex, 'planningItems', planningItemIndex, 'timestamp'],
    newTimestamp
  );
};

const addNewPlanningItem = (state, action) => {
  const headerIndex = indexOfHeaderWithId(state.get('headers'), action.headerId);

  const newPlanningItem = fromJS({
    id: generateId(),
    type: action.planningType,
    timestamp: timestampForDate(action.timestamp),
  });

  return state.updateIn(['headers', headerIndex, 'planningItems'], (planningItems) =>
    !!planningItems ? planningItems.push(newPlanningItem) : List([newPlanningItem])
  );
};

const removePlanningItem = (state, action) => {
  const headerIndex = indexOfHeaderWithId(state.get('headers'), action.headerId);
  const { planningItemIndex } = action;

  return state.removeIn(['headers', headerIndex, 'planningItems', planningItemIndex]);
};

const removeTimestamp = (state, action) => {
  const { path } = pathAndPartOfTimestampItemWithIdInHeaders(
    state.get('headers'),
    action.timestampId
  );

  // remove parsed timestamp
  state = state.removeIn(['headers', ...path]);

  // in case this is an active timestamp, remove it from planning items.
  state = state.updateIn(['headers', path[0], 'planningItems'], (planningItems) =>
    planningItems.filter((item) => item.get('id') !== action.timestampId)
  );

  // rebuild text representation of header
  state = state.setIn(
    ['headers', path[0], 'titleLine', 'rawTitle'],
    attributedStringToRawText(state.getIn(['headers', path[0], 'titleLine', 'title']))
  );
  state = state.setIn(
    ['headers', path[0], 'rawDescription'],
    attributedStringToRawText(state.getIn(['headers', path[0], 'description']))
  );

  return state;
};

export const updatePropertyListItems = (state, action) => {
  const headerIndex = indexOfHeaderWithId(state.get('headers'), action.headerId);

  return state.setIn(['headers', headerIndex, 'propertyListItems'], action.newPropertyListItems);
};

export const setLogEntryStop = (state, action) => {
  const { headerId, entryId, time } = action;
  const headerIdx = indexOfHeaderWithId(state.get('headers'), headerId);
  const entryIndex = state
    .getIn(['headers', headerIdx, 'logBookEntries'])
    .findIndex((entry) => entry.get('id') === entryId);
  state = state.update('activeClocks', (i) => i - 1);
  return state.setIn(['headers', headerIdx, 'logBookEntries', entryIndex, 'end'], fromJS(time));
};

export const createLogEntryStart = (state, action) => {
  const { headerId, time } = action;
  const headerIdx = indexOfHeaderWithId(state.get('headers'), headerId);
  const newEntry = fromJS({
    id: generateId(),
    start: time,
    end: null,
  });
  state = state.update('activeClocks', (i) => i + 1);
  return state.updateIn(['headers', headerIdx, 'logBookEntries'], (entries) =>
    !!entries ? entries.unshift(newEntry) : List([newEntry])
  );
};

export const updateLogEntryTime = (state, action) => {
  const { headerId, entryIndex, entryType, newTime } = action;
  const headerIdx = indexOfHeaderWithId(state.get('headers'), headerId);
  return state.setIn(
    ['headers', headerIdx, 'logBookEntries', entryIndex, entryType],
    fromJS(newTime)
  );
};

export const determineIncludedFiles = (files, fileSettings, path, settingValue, includeByDefault) =>
  files.mapEntries(([filePath, file]) => [
    filePath,
    file.update('headers', (headers) => {
      const fileSetting = fileSettings.find((setting) => filePath === setting.get('path'));
      // always include the viewed file
      if (path === filePath) {
        return headers;
      } else if (fileSetting) {
        if (fileSetting.get(settingValue)) {
          return headers;
        } else {
          return List();
        }
      } else if (filePath.startsWith(STATIC_FILE_PREFIX)) {
        // never include static files
        return List();
      } else {
        // if no setting exists
        return includeByDefault ? headers : List();
      }
    }),
  ]);

const searchHeaders = ({ searchFilterExpr = [], headersToSearch, path }) => {
  let filteredHeaders;
  let nrOfHeadersToSearch = 200;
  const searchFilterFunction = isMatch(searchFilterExpr);

  // search the current file first
  const headersFoundInCurrentFile = headersToSearch
    .get(path)
    .filter(searchFilterFunction)
    .take(nrOfHeadersToSearch);
  nrOfHeadersToSearch -= headersFoundInCurrentFile.count();
  filteredHeaders = Map().set(path, headersFoundInCurrentFile);

  // search rest of files until nrOfHeadersToDisplay results are found
  const filePathsToSearch = headersToSearch.keySeq().filter((p) => p !== path);
  filePathsToSearch.forEach((filePath) => {
    if (nrOfHeadersToSearch > 0) {
      const headersFoundInFile = headersToSearch
        .get(filePath)
        .filter(searchFilterFunction)
        .take(nrOfHeadersToSearch);
      nrOfHeadersToSearch -= headersFoundInFile.count();
      filteredHeaders = filteredHeaders.set(filePath, headersFoundInFile);
    }
  });
  return filteredHeaders;
};

const isActiveClockFilter = (clockFilter) =>
  clockFilter.field.timerange.type === 'point' &&
  clockFilter.field.timerange.point.type === 'special' &&
  clockFilter.field.timerange.point.value === 'now';

export const setSearchFilterInformation = (state, action) => {
  const { searchFilter, cursorPosition, context } = action;

  let files = state.get('files');
  state = state.asMutable();

  let searchFilterValid = true;
  let searchFilterExpr;
  try {
    searchFilterExpr = headline_filter_parser.parse(searchFilter);
    state.setIn(['search', 'searchFilterExpr'], searchFilterExpr);
  } catch (e) {
    // No need to print this parser exceptions. They are expected, see
    // *.grammar.pegjs. However, we don't need to update the filtered
    // headers when given an invalid search filter.
    searchFilterValid = false;
  }

  const path = state.get('path');
  const fileSettings = state.get('fileSettings');
  // Decide which files to include
  if (context === 'agenda') {
    files = determineIncludedFiles(files, fileSettings, path, 'includeInAgenda', false);
  } else if (context === 'search') {
    files = determineIncludedFiles(files, fileSettings, path, 'includeInSearch', false);
  } else if (context === 'task-list') {
    files = determineIncludedFiles(files, fileSettings, path, 'includeInTasklist', false);
  } else if (context === 'refile') {
    files = determineIncludedFiles(files, fileSettings, path, 'includeInRefile', false);
  } // there should not be another context, but if so use all files

  state.setIn(['search', 'searchFilterValid'], searchFilterValid);
  // Only run filter if a filter is given and parsing was successful
  if (searchFilterValid) {
    const headers = files.map((file) => file.get('headers'));

    // show clocked times & sum if there is a clock search term
    const clockedTimeAndActiveClockFilters = searchFilterExpr
      .filter((f) => f.type === 'field')
      .filter((f) => f.field.type === 'clock');
    const clockFilters = clockedTimeAndActiveClockFilters.filter((f) => !isActiveClockFilter(f));
    // check for special case "clock:now" which searches active clocks
    const hasActiveClockFilter = clockedTimeAndActiveClockFilters.length !== clockFilters.length;

    const filterFunctions = clockFilters.map(timeFilter);
    const showClockedTimes = clockFilters.length !== 0;
    state.setIn(['search', 'showClockedTimes'], showClockedTimes);

    // Only search subheaders if a header is narrowed
    const narrowedHeaderId = state.getIn(['files', path, 'narrowedHeaderId']);
    let headersToSearch;
    if (!narrowedHeaderId || context === 'refile') {
      headersToSearch = headers;
    } else {
      headersToSearch = Map().set(
        path,
        subheadersOfHeaderWithId(headers.get(path), narrowedHeaderId)
      );
    }

    if (hasActiveClockFilter) {
      headersToSearch = headersToSearch.map((headersOfFile) =>
        headersOfFile.filter(hasActiveClock)
      );
    }

    // calculate relevant clocked times and total
    if (showClockedTimes) {
      headersToSearch = headersToSearch.map((headersOfFile) =>
        headersOfFile.map((header) =>
          header.set('totalFilteredTimeLogged', totalFilteredTimeLogged(filterFunctions, header))
        )
      );
      headersToSearch = headersToSearch.map((headersOfFile) =>
        updateHeadersTotalFilteredTimeLoggedRecursive(filterFunctions, headersOfFile).filter(
          (header) => header.get('totalFilteredTimeLoggedRecursive') !== 0
        )
      );
    }

    // perform the actual search
    let filteredHeaders = searchHeaders({ searchFilterExpr, headersToSearch, path });

    if (showClockedTimes) {
      const clockedTime = filteredHeaders
        .map((headersOfFile) =>
          headersOfFile.reduce((acc, val) => acc + val.get('totalFilteredTimeLogged'), 0)
        )
        .toList()
        .reduce((acc, val) => acc + val, 0);
      state.setIn(['search', 'clockedTime'], clockedTime);
    }

    // Filter selectedHeader and its subheaders from `headers`,
    // because you don't want to refile a header to itself or to one
    // of its subheaders.
    if (context === 'refile') {
      const selectedHeaderId = state.getIn(['files', path, 'selectedHeaderId']);
      const subheaders = subheadersOfHeaderWithId(headers.get(path), selectedHeaderId);
      let filterIds = subheaders.map((s) => s.get('id')).toJS();
      filterIds.push(selectedHeaderId);
      filteredHeaders = filteredHeaders.update(path, (headersOfFile) =>
        headersOfFile.filter((h) => {
          return !filterIds.includes(h.get('id'));
        })
      );
    }

    state.setIn(['search', 'filteredHeaders'], filteredHeaders);
  }

  state.setIn(['search', 'searchFilter'], searchFilter);

  let searchFilterSuggestions = [];
  if (!_.isEmpty(searchFilter)) {
    // TODO: Currently only showing suggestions based on opened file.
    // Decide if they should be based on all files.
    const currentFile = files.get(path);
    const headersOfFile = currentFile.get('headers');
    const todoKeywords = getTodoKeywordSetsAsFlattenedArray(currentFile);
    const tagNames = extractAllOrgTags(headersOfFile).toJS();
    const allProperties = extractAllOrgProperties(headersOfFile).toJS();
    searchFilterSuggestions = computeCompletionsForDatalist(todoKeywords, tagNames, allProperties)(
      searchFilterExpr,
      searchFilter,
      cursorPosition
    );
  }

  state.setIn(['search', 'searchFilterSuggestions'], searchFilterSuggestions);

  // update bookmarks to order them by 'last used'
  let bookmarks = state.getIn(['bookmarks', context]);
  if (bookmarks.contains(searchFilter)) {
    bookmarks = bookmarks
      .filter((x) => x !== searchFilter)
      .unshift(searchFilter)
      .take(10);
  }
  state.setIn(['bookmarks', context], bookmarks);

  return state.asImmutable();
};

const setOrgFileErrorMessage = (state, action) => state.set('orgFileErrorMessage', action.message);

const setPath = (state, action) => state.set('path', action.path);

const setShowClockDisplay = (state, action) => {
  if (action.showClockDisplay) {
    state = state.update('headers', updateHeadersTotalTimeLoggedRecursive);
  }
  return state.set('showClockDisplay', action.showClockDisplay);
};

const indexOfFileSettingWithId = (settings, settingId) =>
  settings.findIndex((setting) => setting.get('id') === settingId);

const updateFileSettingFieldPathValue = (state, action) => {
  const settingIndex = indexOfFileSettingWithId(state.get('fileSettings'), action.settingId);

  return state.setIn(['fileSettings', settingIndex].concat(action.fieldPath), action.newValue);
};

const reorderFileSetting = (state, action) =>
  state.update('fileSettings', (settings) =>
    settings.splice(action.fromIndex, 1).splice(action.toIndex, 0, settings.get(action.fromIndex))
  );

const deleteFileSetting = (state, action) => {
  const settingIndex = indexOfFileSettingWithId(state.get('fileSettings'), action.settingId);

  return state.update('fileSettings', (settings) => settings.delete(settingIndex));
};

const saveBookmark = (state, { context, bookmark }) => {
  return state.updateIn(['bookmarks', context], (bookmarks) =>
    bookmarks
      .filter((x) => x !== bookmark)
      .unshift(bookmark)
      .take(10)
  );
};

const deleteBookmark = (state, { context, bookmark }) => {
  return state.updateIn(['bookmarks', context], (bookmarks) =>
    bookmarks.filter((x) => x !== bookmark).take(10)
  );
};

const addNewFile = (state, { path, content }) => {
  const parsedFile = parseOrg(content);

  return state
    .setIn(['files', path, 'headers'], parsedFile.get('headers'))
    .setIn(['files', path, 'todoKeywordSets'], parsedFile.get('todoKeywordSets'))
    .setIn(['files', path, 'fileConfigLines'], parsedFile.get('fileConfigLines'))
    .setIn(['files', path, 'linesBeforeHeadings'], parsedFile.get('linesBeforeHeadings'))
    .setIn(['files', path, 'activeClocks'], parsedFile.get('activeClocks'))
    .setIn(['files', path, 'isDirty'], false);
};

const addNewEmptyFileSetting = (state) =>
  state.update('fileSettings', (settings) =>
    settings.push(
      fromJS({
        id: generateId(),
        path: '',
        loadOnStartup: false,
        includeInAgenda: false,
        includeInSearch: false,
        includeInRefile: false,
        includeInTasklist: false,
      })
    )
  );

const restoreFileSettings = (state, action) => {
  if (!action.newSettings) {
    return state;
  }

  return applyFileSettingsFromConfig(state, action.newSettings);
};

const reduceInFile = (state, action, path) => (func, ...args) => {
  return state.updateIn(['files', path], (file) => func(file ? file : Map(), action, ...args));
};

const reducer = (state, action) => {
  const path = state.get('path');
  const inFile = reduceInFile(state, action, path);

  switch (action.type) {
    case 'PARSE_FILE':
      return parseFile(state, action);
    case 'CLEAR_SEARCH':
      return clearSearch(state, action);
    case 'TOGGLE_HEADER_OPENED':
      return inFile(toggleHeaderOpened);
    case 'OPEN_HEADER':
      return inFile(openHeader);
    case 'SELECT_HEADER':
      return inFile(selectHeader);
    case 'OPEN_PARENTS_OF_HEADER':
      return inFile(openParentsOfHeader);
    case 'ADVANCE_TODO_STATE':
      return inFile(advanceTodoState);
    case 'SET_TODO_STATE':
      return inFile(setTodoState);
    case 'ENTER_EDIT_MODE':
      return inFile(enterEditMode);
    case 'EXIT_EDIT_MODE':
      return inFile(exitEditMode);
    case 'UPDATE_HEADER_TITLE':
      return inFile(updateHeaderTitle);
    case 'UPDATE_HEADER_DESCRIPTION':
      return inFile(updateHeaderDescription);
    case 'ADD_HEADER':
      return inFile(addHeader);
    case 'CREATE_FIRST_HEADER':
      return inFile(createFirstHeader);
    case 'SELECT_NEXT_SIBLING_HEADER':
      return inFile(selectNextSiblingHeader);
    case 'SELECT_NEXT_VISIBLE_HEADER':
      return inFile(selectNextVisibleHeader);
    case 'SELECT_PREVIOUS_VISIBLE_HEADER':
      return inFile(selectPreviousVisibleHeader);
    case 'REMOVE_HEADER':
      return inFile(removeHeader);
    case 'MOVE_HEADER_UP':
      return inFile(moveHeaderUp);
    case 'MOVE_HEADER_DOWN':
      return inFile(moveHeaderDown);
    case 'MOVE_HEADER_LEFT':
      return inFile(moveHeaderLeft);
    case 'MOVE_HEADER_RIGHT':
      return inFile(moveHeaderRight);
    case 'MOVE_SUBTREE_LEFT':
      return inFile(moveSubtreeLeft);
    case 'MOVE_SUBTREE_RIGHT':
      return inFile(moveSubtreeRight);
    case 'REFILE_SUBTREE':
      return refileSubtree(state, action);
    case 'HEADER_ADD_NOTE':
      return inFile(addNote);
    case 'APPLY_OPENNESS_STATE':
      return applyOpennessState(state, action);
    case 'SET_OPENNESS_STATE':
      return setOpennessState(state, action);
    case 'SET_DIRTY':
      return action.path ? reduceInFile(state, action, action.path)(setDirty) : inFile(setDirty);
    case 'NARROW_HEADER':
      return inFile(narrowHeader);
    case 'WIDEN_HEADER':
      return inFile(widenHeader);
    case 'SET_SELECTED_TABLE_ID':
      return inFile(setSelectedTableId);
    case 'SET_SELECTED_TABLE_CELL_ID':
      return inFile(setSelectedTableCellId);
    case 'ADD_NEW_TABLE_ROW':
      return inFile(addNewTableRow);
    case 'REMOVE_TABLE_ROW':
      return inFile(removeTableRow);
    case 'ADD_NEW_TABLE_COLUMN':
      return inFile(addNewTableColumn);
    case 'REMOVE_TABLE_COLUMN':
      return inFile(removeTableColumn);
    case 'MOVE_TABLE_ROW_DOWN':
      return inFile(moveTableRowDown);
    case 'MOVE_TABLE_ROW_UP':
      return inFile(moveTableRowUp);
    case 'MOVE_TABLE_COLUMN_LEFT':
      return inFile(moveTableColumnLeft);
    case 'MOVE_TABLE_COLUMN_RIGHT':
      return inFile(moveTableColumnRight);
    case 'UPDATE_TABLE_CELL_VALUE':
      return inFile(updateTableCellValue);
    case 'INSERT_CAPTURE':
      return action.template.get('file')
        ? reduceInFile(state, action, action.template.get('file'))(insertCapture)
        : inFile(insertCapture);
    case 'CLEAR_PENDING_CAPTURE':
      return clearPendingCapture(state, action);
    case 'ADVANCE_CHECKBOX_STATE':
      return inFile(advanceCheckboxState);
    case 'SET_SELECTED_LIST_ITEM_ID':
      return inFile(setSelectedListItemId);
    case 'UPDATE_LIST_TITLE_VALUE':
      return inFile(updateListTitleValue);
    case 'UPDATE_LIST_CONTENTS_VALUE':
      return inFile(updateListContentsValue);
    case 'ADD_NEW_LIST_ITEM':
      return inFile(addNewListItem);
    case 'SELECT_NEXT_SIBLING_LIST_ITEM':
      return inFile(selectNextSiblingListItem);
    case 'REMOVE_LIST_ITEM':
      return inFile(removeListItem);
    case 'MOVE_LIST_ITEM_UP':
      return inFile(moveListItemUp);
    case 'MOVE_LIST_ITEM_DOWN':
      return inFile(moveListItemDown);
    case 'MOVE_LIST_ITEM_LEFT':
      return inFile(moveListItemLeft);
    case 'MOVE_LIST_ITEM_RIGHT':
      return inFile(moveListItemRight);
    case 'MOVE_LIST_SUBTREE_LEFT':
      return inFile(moveListSubtreeLeft);
    case 'MOVE_LIST_SUBTREE_RIGHT':
      return inFile(moveListSubtreeRight);
    case 'SET_LAST_SYNC_AT':
      return action.path
        ? reduceInFile(state, action, action.path)(setLastSyncAt)
        : inFile(setLastSyncAt);
    case 'SET_HEADER_TAGS':
      return inFile(setHeaderTags);
    case 'REORDER_TAGS':
      return inFile(reorderTags);
    case 'REORDER_PROPERTY_LIST':
      return inFile(reorderPropertyList);
    case 'UPDATE_TIMESTAMP_WITH_ID':
      return inFile(updateTimestampWithId);
    case 'UPDATE_PLANNING_ITEM_TIMESTAMP':
      return inFile(updatePlanningItemTimestamp);
    case 'ADD_NEW_PLANNING_ITEM':
      return inFile(addNewPlanningItem);
    case 'REMOVE_PLANNING_ITEM':
      return inFile(removePlanningItem);
    case 'REMOVE_TIMESTAMP':
      return inFile(removeTimestamp);
    case 'UPDATE_PROPERTY_LIST_ITEMS':
      return inFile(updatePropertyListItems);
    case 'SET_ORG_FILE_ERROR_MESSAGE':
      return setOrgFileErrorMessage(state, action);
    case 'SET_LOG_ENTRY_STOP':
      return inFile(setLogEntryStop);
    case 'CREATE_LOG_ENTRY_START':
      return inFile(createLogEntryStart);
    case 'UPDATE_LOG_ENTRY_TIME':
      return inFile(updateLogEntryTime);
    case 'SET_SEARCH_FILTER_INFORMATION':
      return setSearchFilterInformation(state, action);
    case 'SET_PATH':
      return setPath(state, action);
    case 'TOGGLE_CLOCK_DISPLAY':
      return setShowClockDisplay(state, action);
    case 'UPDATE_FILE_SETTING_FIELD_PATH_VALUE':
      return updateFileSettingFieldPathValue(state, action);
    case 'REORDER_FILE_SETTING':
      return reorderFileSetting(state, action);
    case 'DELETE_FILE_SETTING':
      return deleteFileSetting(state, action);
    case 'ADD_NEW_EMPTY_FILE_SETTING':
      return addNewEmptyFileSetting(state, action);
    case 'RESTORE_FILE_SETTINGS':
      return restoreFileSettings(state, action);
    case 'SAVE_BOOKMARK':
      return saveBookmark(state, action);
    case 'DELETE_BOOKMARK':
      return deleteBookmark(state, action);
    case 'ADD_NEW_FILE':
      return addNewFile(state, action);
    default:
      return state;
  }
};

export default (state = Map(), action) => {
  const affectedFiles = determineAffectedFiles(state, action);
  affectedFiles.forEach((path) => {
    state = state.setIn(['files', path, 'isDirty'], true);
  });

  state = reducer(state, action);

  if (action.dirtying && state.get('showClockDisplay')) {
    affectedFiles.forEach((path) => {
      state = state.updateIn(['files', path, 'headers'], updateHeadersTotalTimeLoggedRecursive);
    });
  }
  return state;
};

export const determineAffectedFiles = (state, action) => {
  if (action.dirtying) {
    if (action.type === 'REFILE_SUBTREE') {
      return [action.sourcePath, action.targetPath];
    } else if (action.type === 'INSERT_CAPTURE') {
      const captureTarget = action.template.get('file');
      if (captureTarget) {
        return [captureTarget];
      } else {
        return [state.get('path')];
      }
    } else {
      return [state.get('path')];
    }
  } else {
    return [];
  }
};

/**
 * Updates Headlines with the next todoKeyword `newTodoState`. Also
 * reschedules planning items with repeaters if applicable.
 * @param {any} currentTodoSet
 * @param {String} newTodoState
 * @param {any} indexedPlanningItemsWithRepeaters
 * @param {Object} state - redux state
 * @param {Number} headerIndex
 * @param {String} currentTodoState
 */
function updateHeadlines({
  currentTodoSet,
  newTodoState,
  indexedPlanningItemsWithRepeaters,
  state,
  headerIndex,
  currentTodoState,
  logIntoDrawer,
  logDone,
  timestamp,
}) {
  if (
    currentTodoSet.get('completedKeywords').includes(newTodoState) &&
    indexedPlanningItemsWithRepeaters.size > 0
  )
    return updatePlanningItemsWithRepeaters({
      indexedPlanningItemsWithRepeaters,
      state,
      headerIndex,
      currentTodoSet,
      newTodoState,
      currentTodoState,
      logIntoDrawer,
      logDone,
      timestamp,
    });
  // Update simple headline (without repeaters)
  return state.setIn(['headers', headerIndex, 'titleLine', 'todoKeyword'], newTodoState);
}

/**
 * Add a TODO state change log item either to the heading body or LOGBOOK drawer.
 *
 * @param {*} state
 * @param {*} headerIndex Index of header where the state change log item should be added.
 * @param {string} newTodoState New TODO state, e.g. DONE.
 * @param {string} currentTodoState Current TODO state, e.g. TODO or DONE.
 * @param {boolean} logIntoDrawer By default false, so add log messages as bullets into the body. If true, add into LOGBOOK drawer.
 */
function addTodoStateChangeLogItem(
  state,
  headerIndex,
  newTodoState,
  currentTodoState,
  logIntoDrawer,
  logDone,
  timestamp
) {
  // This is how the TODO state change will be logged
  const inactiveTimestamp = getTimestampAsText(timestamp, { isActive: false, withStartTime: true });
  const newStateChangeLogText = `- State "${newTodoState}"       from "${currentTodoState}"       ${inactiveTimestamp}`;

  if (logIntoDrawer) {
    // Prepend this single item to the :LOGBOOK: drawer, same as org-log-into-drawer setting
    // https://www.gnu.org/software/emacs/manual/html_node/org/Tracking-TODO-state-changes.html
    const newEntry = fromJS({
      id: generateId(),
      raw: newStateChangeLogText,
    });
    return state.updateIn(['headers', headerIndex, 'logBookEntries'], (entries) =>
      entries.unshift(newEntry)
    );
  } else {
    // When org-log-into-drawer not set, prepend state change log text to log notes
    return addNoteGeneric(state, { noteText: newStateChangeLogText });
  }
}

function updatePlanningItemsWithRepeaters({
  indexedPlanningItemsWithRepeaters,
  state,
  headerIndex,
  currentTodoSet,
  newTodoState,
  currentTodoState,
  logIntoDrawer,
  logDone,
  timestamp,
}) {
  indexedPlanningItemsWithRepeaters.forEach(([planningItem, planningItemIndex]) => {
    const adjustedTimestamp = applyRepeater(planningItem.get('timestamp'), timestamp);
    state = state.setIn(
      ['headers', headerIndex, 'planningItems', planningItemIndex, 'timestamp'],
      adjustedTimestamp
    );

    // INFO: Active timestamps are now manually updated in place.
    // Rationale: The active timestamps in title and description are
    // added to `planningItems` on parse. Since there can be an
    // arbitrary amount of timestamps it makes sense not to have one
    // `planningItem` representing the title or the description. We
    // need to preserve the place of a timestamp in title/description
    // and we want to have it in a list of `planningItems`. So they
    // necessarily exist in more than one place. There might be a
    // cleaner solution where we store the timestamp only in one place
    // and use references to that place but I don't see any extra
    // benefit for what would be no negligible refactoring effort.

    // Scheduled / deadline timestamps on the other hand are part of
    // `rawDescription` but not of the parsed description. These
    // timestamps only exist in one place (`planningItems`) so
    // changing them there is visible and will be persisted.
    switch (planningItem.get('type')) {
      case 'TIMESTAMP_TITLE':
        const titleIndex = state
          .getIn(['headers', headerIndex, 'titleLine', 'title'])
          .findIndex((titlePart) => planningItem.get('id') === titlePart.get('id'));
        state = state.setIn(
          ['headers', headerIndex, 'titleLine', 'title', titleIndex, 'firstTimestamp'],
          adjustedTimestamp
        );
        state = state.setIn(
          ['headers', headerIndex, 'titleLine', 'rawTitle'],
          attributedStringToRawText(state.getIn(['headers', headerIndex, 'titleLine', 'title']))
        );
        break;
      case 'TIMESTAMP_DESCRIPTION':
        const descriptionIndex = state
          .getIn(['headers', headerIndex, 'description'])
          .findIndex((descriptionPart) => planningItem.get('id') === descriptionPart.get('id'));
        state = state.setIn(
          ['headers', headerIndex, 'description', descriptionIndex, 'firstTimestamp'],
          adjustedTimestamp
        );
        state = state.setIn(
          ['headers', headerIndex, 'rawDescription'],
          attributedStringToRawText(state.getIn(['headers', headerIndex, 'description']))
        );
        break;
      default:
        break;
    }
  });
  state = state.setIn(
    ['headers', headerIndex, 'titleLine', 'todoKeyword'],
    currentTodoSet.get('keywords').first()
  );
  if (!noLogRepeatEnabledP({ state, headerIndex })) {
    const lastRepeatTimestamp = timestampForDate(timestamp, {
      isActive: false,
      withStartTime: true,
    });
    const newLastRepeatValue = [
      {
        type: 'timestamp',
        id: generateId(),
        firstTimestamp: lastRepeatTimestamp,
        secondTimestamp: null,
      },
    ];

    state = state.updateIn(['headers', headerIndex, 'propertyListItems'], (propertyListItems) =>
      propertyListItems.some((item) => item.get('property') === 'LAST_REPEAT')
        ? propertyListItems.map((item) =>
            item.get('property') === 'LAST_REPEAT'
              ? item.set('value', fromJS(newLastRepeatValue))
              : item
          )
        : propertyListItems.push(
            fromJS({
              property: 'LAST_REPEAT',
              value: newLastRepeatValue,
              id: generateId(),
            })
          )
    );
    state = addTodoStateChangeLogItem(
      state,
      headerIndex,
      newTodoState,
      currentTodoState,
      logIntoDrawer,
      logDone,
      timestamp
    );
  }
  return state;
}

/**
 * Is the `nologrepeat` feature enabled for this buffer?
 * More info:
 * https://www.gnu.org/software/emacs/manual/html_node/org/Repeated-tasks.html
 */
export function noLogRepeatEnabledP({ state, headerIndex }) {
  const startupOptNoLogRepeat = state
    .get('fileConfigLines')
    .some((elt) => elt.match(/^#\+STARTUP:.*nologrepeat.*/));
  const loggingProp = inheritedValueOfProperty(state.get('headers'), headerIndex, 'LOGGING');
  return !!(
    startupOptNoLogRepeat ||
    (loggingProp &&
      loggingProp.some(
        (v) => v.get('type') === 'text' && v.get('contents').match(/\s*nologrepeat\s*/)
      ))
  );
}

/**
 * Is the `logdone` enabled for this buffer?
 * More info:
 * https://www.gnu.org/software/emacs/manual/html_node/org/Closing-items.html
 */

export function logDoneEnabledP({ state, headerIndex }) {
  const logDoneRegex = new RegExp(/.*\blogdone\b.*/);
  const fileConfigLines = state.get('fileConfigLines');
  const startupOptLogDone = fileConfigLines.some((element) => {
    return element.startsWith('#+STARTUP:') && element.match(logDoneRegex);
  });
  if (startupOptLogDone) {
    return true;
  }
  const loggingProp = inheritedValueOfProperty(state.get('headers'), headerIndex, 'LOGGING');
  if (loggingProp) {
    return loggingProp.some(
      (v) => v.get('type') === 'text' && v.get('contents').match(logDoneRegex)
    );
  }
  return false;
}

/**
 * Function wrapper around `updateCookiesOfHeaderWithId` and
 * `updateCookiesOfParentOfHeaderWithId`.
 */
function updateCookies(file, previousParentHeaderId, action) {
  file = updateCookiesOfHeaderWithId(file, previousParentHeaderId);
  file = updateCookiesOfParentOfHeaderWithId(file, action.headerId);
  return file;
}

/**
 * Helper function to calculate the new state when moving a header
 * (either with or without subheaders) to the left or right.
 * @param {Object} param0 - Current state
 * @param {Object} param0.state - Redux `state` object
 * @param {Object} param0.headerIndex - Position of relevant header object
 * @param {Object} param0.subheaders - List of subheaders of relevant header
 * @param {String} direction: Can be either '-' to move the header left
 * or '+' to move it right
 */
function shiftTreeNestingLevel({ state, headerIndex, subheaders = [] }, direction = '-') {
  state = state.updateIn(['headers', headerIndex, 'nestingLevel'], calculateNestingLevel());
  subheaders.forEach((_, index) => {
    state = state.updateIn(
      ['headers', headerIndex + index + 1, 'nestingLevel'],
      calculateNestingLevel()
    );
  });
  return state;

  function calculateNestingLevel() {
    return (nestingLevel) => {
      if (direction === '-') {
        // Don't move a header further to the left than the first
        // column
        return Math.max(nestingLevel - 1, 1);
      } else {
        return nestingLevel + 1;
      }
    };
  }
}
