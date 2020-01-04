import { Map, List, fromJS } from 'immutable';
import _ from 'lodash';

import headline_filter_parser from '../lib/headline_filter_parser';
import { isMatch, computeCompletionsForDatalist } from '../lib/headline_filter';

import {
  extractAllOrgTags,
  extractAllOrgProperties,
  getTodoKeywordSetsAsFlattenedArray,
} from '../lib/org_utils';

import {
  parseOrg,
  parseTitleLine,
  parseRawText,
  parseDescriptionPrefixElements,
  parseMarkupAndCookies,
  newHeaderWithTitle,
  newHeaderFromText,
} from '../lib/parse_org';
import { attributedStringToRawText } from '../lib/export_org';
import {
  indexOfHeaderWithId,
  headerWithId,
  parentIdOfHeaderWithId,
  subheadersOfHeaderWithId,
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
} from '../lib/org_utils';
import { getCurrentTimestamp, applyRepeater, renderAsText } from '../lib/timestamps';
import generateId from '../lib/id_generator';

const displayFile = (state, action) => {
  const parsedFile = parseOrg(action.contents);

  return state
    .set('path', action.path)
    .set('contents', action.contents)
    .set('headers', parsedFile.get('headers'))
    .set('todoKeywordSets', parsedFile.get('todoKeywordSets'))
    .set('fileConfigLines', parsedFile.get('fileConfigLines'))
    .set('linesBeforeHeadings', parsedFile.get('linesBeforeHeadings'));
};

const stopDisplayingFile = state =>
  state
    .set('path', null)
    .set('contents', null)
    .set('headers', null)
    .set('filteredHeaders', null)
    .set('todoKeywordSets', null)
    .set('fileConfigLines', null)
    .set('linesBeforeHeadings', null);

const openHeader = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  return state.setIn(['headers', headerIndex, 'opened'], true);
};

const toggleHeaderOpened = (state, action) => {
  const headers = state.get('headers');

  const headerIndex = indexOfHeaderWithId(headers, action.headerId);
  const isOpened = headerWithId(headers, action.headerId).get('opened');

  if (isOpened && state.get('focusedHeaderId') === action.headerId) {
    return state;
  }

  if (isOpened) {
    const subheaders = subheadersOfHeaderWithId(headers, action.headerId);
    subheaders.forEach(index => {
      state = state.setIn(['headers', headerIndex + index + 1, 'opened'], false);
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
  const doneCount = completionStates.filter(isDone => isDone).length;
  const totalCount = completionStates.length;

  return parts.map(part => {
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

const updateCookiesOfHeaderWithId = (state, headerId) => {
  const headers = state.get('headers');
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
    .map(header => header.getIn(['titleLine', 'todoKeyword']))
    .filter(todoKeyword => !!todoKeyword)
    .map(todoKeyword =>
      todoKeywordSetForKeyword(state.get('todoKeywordSets'), todoKeyword)
        .get('completedKeywords')
        .contains(todoKeyword)
    );

  // If there are no headers with possible completion states, check for plain lists instead.
  if (completionStates.length === 0) {
    completionStates = headers
      .get(headerIndex)
      .get('description')
      .filter(part => part.get('type') === 'list')
      .flatMap(listPart => listPart.get('items'))
      .filter(item => item.get('isCheckbox'))
      .map(item => item.get('checkboxState') === 'checked')
      .toJS();
  }

  return state
    .updateIn(['headers', headerIndex, 'titleLine', 'title'], title =>
      updateCookiesInAttributedStringWithChildCompletionStates(title, completionStates)
    )
    .updateIn(['headers', headerIndex, 'titleLine'], titleLine =>
      titleLine.set('rawTitle', attributedStringToRawText(titleLine.get('title')))
    );
};

const updateCookiesOfParentOfHeaderWithId = (state, headerId) => {
  const parentHeaderId = parentIdOfHeaderWithId(state.get('headers'), headerId);
  if (!parentHeaderId) {
    return state;
  }

  return updateCookiesOfHeaderWithId(state, parentHeaderId);
};

const advanceTodoState = (state, action) => {
  const headerId = action.headerId || state.get('selectedHeaderId');
  if (!headerId) {
    return state;
  }

  const headers = state.get('headers');
  const header = headerWithId(headers, headerId);
  const headerIndex = indexOfHeaderWithId(headers, headerId);

  const currentTodoState = header.getIn(['titleLine', 'todoKeyword']);
  const currentTodoSet = todoKeywordSetForKeyword(state.get('todoKeywordSets'), currentTodoState);

  const currentStateIndex = currentTodoSet.get('keywords').indexOf(currentTodoState);
  const newStateIndex = currentStateIndex + 1;
  const newTodoState = currentTodoSet.get('keywords').get(newStateIndex) || '';

  const indexedPlanningItemsWithRepeaters = header
    .get('planningItems')
    .map((planningItem, index) => [planningItem, index])
    .filter(([planningItem]) => !!planningItem.getIn(['timestamp', 'repeaterType']));

  state = updateHeadlines(
    currentTodoSet,
    newTodoState,
    indexedPlanningItemsWithRepeaters,
    state,
    headerIndex,
    currentTodoState
  );

  state = updateCookiesOfParentOfHeaderWithId(state, headerId);

  return state;
};

const enterEditMode = (state, action) => state.set('editMode', action.editModeType);

const exitEditMode = state => state.set('editMode', null);

const updateHeaderTitle = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  const newTitleLine = parseTitleLine(action.newRawTitle.trim(), state.get('todoKeywordSets'));

  state = state.setIn(['headers', headerIndex, 'titleLine'], newTitleLine);

  return updateCookiesOfParentOfHeaderWithId(state, action.headerId);
};

const updateHeaderDescription = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  return state.updateIn(['headers', headerIndex], header => {
    const {
      planningItems,
      propertyListItems,
      strippedDescription,
    } = parseDescriptionPrefixElements(action.newRawDescription);

    return header
      .set('rawDescription', strippedDescription)
      .set('description', parseRawText(strippedDescription))
      .set('planningItems', planningItems)
      .set('propertyListItems', propertyListItems);
  });
};

const addHeader = (state, action) => {
  const headers = state.get('headers');
  const header = headerWithId(headers, action.headerId);
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  const subheaders = subheadersOfHeaderWithId(headers, action.headerId);

  const todoKeyword = header.getIn(['titleLine', 'todoKeyword']);

  const newHeader = newHeaderWithTitle(
    todoKeyword ? todoKeyword + ' ' : '',
    header.get('nestingLevel'),
    state.get('todoKeywordSets')
  );

  if (action.headerId === state.get('focusedHeaderId')) {
    state = state.set('focusedHeaderId', null);
  }

  return state.update('headers', headers =>
    headers.insert(headerIndex + subheaders.size + 1, newHeader)
  );
};

const selectNextSiblingHeader = (state, action) => {
  const headers = state.get('headers');
  const header = headerWithId(headers, action.headerId);
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);
  const subheaders = subheadersOfHeaderWithId(headers, action.headerId);

  const nextSibling = headers.get(headerIndex + subheaders.size + 1);

  if (!nextSibling || nextSibling.get('nestingLevel') !== header.get('nestingLevel')) {
    return state;
  }

  return state.set('selectedHeaderId', nextSibling.get('id'));
};

const selectNextVisibleHeader = state => {
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

const selectPreviousVisibleHeader = state => {
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

  if (action.headerId === state.get('focusedHeaderId')) {
    state = state.set('focusedHeaderId', null);
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
  const header = headerWithId(headers, action.headerId);
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  const subheaders = subheadersOfHeaderWithId(headers, action.headerId);
  const nextSiblingIndex = headerIndex + subheaders.size + 1;
  const nextSibling = headers.get(nextSiblingIndex);
  if (nextSibling.get('nestingLevel') < header.get('nestingLevel')) {
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
  const header = headerWithId(headers, action.headerId);
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

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

const focusHeader = (state, action) => {
  return state.set('focusedHeaderId', action.headerId);
};

const unfocusHeader = state => state.set('focusedHeaderId', null);

const applyOpennessState = state => {
  const opennessState = state.get('opennessState');
  if (!opennessState) {
    return state;
  }

  const fileOpennessState = opennessState.get(state.get('path'));
  if (!fileOpennessState || fileOpennessState.size === 0) {
    return state;
  }

  let headers = state.get('headers');
  fileOpennessState.forEach(openHeaderPath => {
    headers = openHeaderWithPath(headers, openHeaderPath);
  });

  return state.set('headers', headers);
};

const setDirty = (state, action) => state.set('isDirty', action.isDirty);

const setSelectedTableCellId = (state, action) => state.set('selectedTableCellId', action.cellId);

const updateDescriptionOfHeaderContainingTableCell = (state, cellId, header = null) => {
  const headers = state.get('headers');
  if (!header) {
    header = headerThatContainsTableCellId(headers, cellId);
  }
  const headerIndex = indexOfHeaderWithId(headers, header.get('id'));

  return state.updateIn(['headers', headerIndex], header =>
    header.set('rawDescription', attributedStringToRawText(header.get('description')))
  );
};

const addNewTableRow = state => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  state = state.update('headers', headers =>
    updateTableContainingCellId(headers, selectedTableCellId, rowIndex => rows =>
      rows.insert(rowIndex + 1, newEmptyTableRowLikeRows(rows))
    )
  );

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId);
};

const removeTableRow = state => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  const containingHeader = headerThatContainsTableCellId(state.get('headers'), selectedTableCellId);

  state = state.update('headers', headers =>
    updateTableContainingCellId(headers, selectedTableCellId, rowIndex => rows =>
      rows.delete(rowIndex)
    )
  );

  state = state.set('selectedTableCellId', null);

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId, containingHeader);
};

const addNewTableColumn = state => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  state = state.update('headers', headers =>
    updateTableContainingCellId(headers, selectedTableCellId, (_rowIndex, colIndex) => rows =>
      rows.map(row =>
        row.update('contents', contents => contents.insert(colIndex + 1, newEmptyTableCell()))
      )
    )
  );

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId);
};

const removeTableColumn = state => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  const containingHeader = headerThatContainsTableCellId(state.get('headers'), selectedTableCellId);

  state = state.update('headers', headers =>
    updateTableContainingCellId(headers, selectedTableCellId, (_rowIndex, colIndex) => rows =>
      rows.map(row => row.update('contents', contents => contents.delete(colIndex)))
    )
  );

  state = state.set('selectedTableCellId', null);

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId, containingHeader);
};

const moveTableRowDown = state => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  state = state.update('headers', headers =>
    updateTableContainingCellId(headers, selectedTableCellId, rowIndex => rows =>
      rowIndex + 1 === rows.size
        ? rows
        : rows.insert(rowIndex, rows.get(rowIndex + 1)).delete(rowIndex + 2)
    )
  );

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId);
};

const moveTableRowUp = state => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  state = state.update('headers', headers =>
    updateTableContainingCellId(headers, selectedTableCellId, rowIndex => rows =>
      rowIndex === 0 ? rows : rows.insert(rowIndex - 1, rows.get(rowIndex)).delete(rowIndex + 1)
    )
  );

  return updateDescriptionOfHeaderContainingTableCell(state, selectedTableCellId);
};

const moveTableColumnLeft = state => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  state = state.update('headers', headers =>
    updateTableContainingCellId(headers, selectedTableCellId, (_rowIndex, columnIndex) => rows =>
      columnIndex === 0
        ? rows
        : rows.map(row =>
            row.update('contents', contents =>
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

const moveTableColumnRight = state => {
  const selectedTableCellId = state.get('selectedTableCellId');
  if (!selectedTableCellId) {
    return state;
  }

  state = state.update('headers', headers =>
    updateTableContainingCellId(headers, selectedTableCellId, (_rowIndex, columnIndex) => rows =>
      columnIndex + 1 >= rows.getIn([0, 'contents']).size
        ? rows
        : rows.map(row =>
            row.update('contents', contents =>
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
  state = state.update('headers', headers =>
    updateTableContainingCellId(headers, action.cellId, (rowIndex, colIndex) => rows =>
      rows.updateIn([rowIndex, 'contents', colIndex], cell =>
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

  const parentHeader = headerWithPath(headers, template.get('headerPaths'));
  if (!parentHeader) {
    return state;
  }

  const newHeader = newHeaderFromText(content, state.get('todoKeywordSets')).set(
    'nestingLevel',
    parentHeader.get('nestingLevel') + 1
  );

  const parentHeaderIndex = indexOfHeaderWithId(headers, parentHeader.get('id'));
  const numSubheaders = numSubheadersOfHeaderWithId(headers, parentHeader.get('id'));
  const newIndex = parentHeaderIndex + 1 + (shouldPrepend ? 0 : numSubheaders);

  state = state.update('headers', headers => headers.insert(newIndex, newHeader));

  state = updateCookiesOfHeaderWithId(state, parentHeader.get('id'));

  return state;
};

const clearPendingCapture = state => state.set('pendingCapture', null);

const updateParentListCheckboxes = (state, itemPath) => {
  const parentListItemPath = itemPath.slice(0, itemPath.length - 4);
  const parentListItem = state.getIn(parentListItemPath);
  if (!parentListItem.has('checkboxState')) {
    return state;
  }

  const childrenCheckedStates = parentListItem
    .get('contents')
    .filter(part => part.get('type') === 'list')
    .flatMap(listPart =>
      listPart
        .get('items')
        .filter(item => item.get('isCheckbox'))
        .map(checkboxItem => checkboxItem.get('checkboxState'))
    );

  if (childrenCheckedStates.every(state => state === 'checked')) {
    state = state.setIn(parentListItemPath.concat(['checkboxState']), 'checked');
  } else if (childrenCheckedStates.every(state => state === 'unchecked')) {
    state = state.setIn(parentListItemPath.concat(['checkboxState']), 'unchecked');
  } else {
    state = state.setIn(parentListItemPath.concat(['checkboxState']), 'partial');
  }

  const childCompletionStates = childrenCheckedStates
    .map(state => {
      switch (state) {
        case 'checked':
          return true;
        case 'unchecked':
          return false;
        case 'partial':
          return false;
        default:
          return false;
      }
    })
    .toJS();

  state = state.updateIn(parentListItemPath.concat('titleLine'), titleLine =>
    updateCookiesInAttributedStringWithChildCompletionStates(titleLine, childCompletionStates)
  );

  if (parentListItem.get('isCheckbox')) {
    return updateParentListCheckboxes(state, parentListItemPath);
  } else {
    return state;
  }
};

const advanceCheckboxState = (state, action) => {
  const pathAndPart = pathAndPartOfListItemWithIdInHeaders(state.get('headers'), action.listItemId);
  const { path, listItemPart } = pathAndPart;

  const hasDirectCheckboxChildren = listItemPart
    .get('contents')
    .filter(part => part.get('type') === 'list')
    .some(listPart => listPart.get('items').some(item => item.get('isCheckbox')));
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
  state = state.updateIn(['headers', headerIndex], header =>
    header.set('rawDescription', attributedStringToRawText(header.get('description')))
  );

  return state;
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

  return state.updateIn(['headers', headerIndex, 'titleLine', 'tags'], tags =>
    tags.splice(action.fromIndex, 1).splice(action.toIndex, 0, tags.get(action.fromIndex))
  );
};

const reorderPropertyList = (state, action) => {
  const headerId = action.headerId;
  if (!headerId) {
    return state;
  }
  const headerIndex = indexOfHeaderWithId(state.get('headers'), headerId);

  return state.updateIn(['headers', headerIndex, 'propertyListItems'], propertyListItems =>
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
    .updateIn(['headers', headerIndex], header =>
      header.set('rawDescription', attributedStringToRawText(header.get('description')))
    )
    .updateIn(['headers', headerIndex], header =>
      header.setIn(
        ['titleLine', 'rawTitle'],
        attributedStringToRawText(header.getIn(['titleLine', 'title']))
      )
    );
};

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
    timestamp: getCurrentTimestamp(),
  });

  return state.updateIn(['headers', headerIndex, 'planningItems'], planningItems =>
    !!planningItems ? planningItems.push(newPlanningItem) : List([newPlanningItem])
  );
};

const removePlanningItem = (state, action) => {
  const headerIndex = indexOfHeaderWithId(state.get('headers'), action.headerId);
  const { planningItemIndex } = action;

  return state.removeIn(['headers', headerIndex, 'planningItems', planningItemIndex]);
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
    .findIndex(entry => entry.get('id') === entryId);
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
  return state.updateIn(['headers', headerIdx, 'logBookEntries'], entries =>
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

export const setSearchFilterInformation = (state, action) => {
  const { searchFilter, cursorPosition } = action;
  const headers = state.get('headers');
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

  state.setIn(['search', 'searchFilterValid'], searchFilterValid);
  // Only run filter if a filter is given and parsing was successfull
  if (searchFilterValid) {
    const filteredHeaders = headers.filter(isMatch(searchFilterExpr));
    state.setIn(['search', 'filteredHeaders'], filteredHeaders);
  }

  state.setIn(['search', 'searchFilter'], searchFilter);

  // INFO: This is a POC draft of a future feature
  // This could come from the last session, hence from localStorage.
  // Just some more examples for now:
  const lastUsedFilterStrings = [
    'TODO organice',
    '-organice :medium',
    '-DONE doc|man :assignee:none',
  ];

  let searchFilterSuggestions = [];
  if (_.isEmpty(searchFilter)) {
    // Only for an empty filter string,  provide last used filters as suggestions.
    searchFilterSuggestions = lastUsedFilterStrings;
  } else {
    const todoKeywords = getTodoKeywordSetsAsFlattenedArray(state);
    const tagNames = extractAllOrgTags(headers).toJS();
    const allProperties = extractAllOrgProperties(headers).toJS();
    searchFilterSuggestions = computeCompletionsForDatalist(todoKeywords, tagNames, allProperties)(
      searchFilterExpr,
      searchFilter,
      cursorPosition
    );
  }
  state.setIn(['search', 'searchFilterSuggestions'], searchFilterSuggestions);

  return state.asImmutable();
};

const setOrgFileErrorMessage = (state, action) => state.set('orgFileErrorMessage', action.message);

export default (state = Map(), action) => {
  if (action.dirtying) {
    state = state.set('isDirty', true);
  }

  switch (action.type) {
    case 'DISPLAY_FILE':
      return displayFile(state, action);
    case 'STOP_DISPLAYING_FILE':
      return stopDisplayingFile(state, action);
    case 'TOGGLE_HEADER_OPENED':
      return toggleHeaderOpened(state, action);
    case 'OPEN_HEADER':
      return openHeader(state, action);
    case 'SELECT_HEADER':
      return selectHeader(state, action);
    case 'OPEN_PARENTS_OF_HEADER':
      return openParentsOfHeader(state, action);
    case 'ADVANCE_TODO_STATE':
      return advanceTodoState(state, action);
    case 'ENTER_EDIT_MODE':
      return enterEditMode(state, action);
    case 'EXIT_EDIT_MODE':
      return exitEditMode(state, action);
    case 'UPDATE_HEADER_TITLE':
      return updateHeaderTitle(state, action);
    case 'UPDATE_HEADER_DESCRIPTION':
      return updateHeaderDescription(state, action);
    case 'ADD_HEADER':
      return addHeader(state, action);
    case 'SELECT_NEXT_SIBLING_HEADER':
      return selectNextSiblingHeader(state, action);
    case 'SELECT_NEXT_VISIBLE_HEADER':
      return selectNextVisibleHeader(state, action);
    case 'SELECT_PREVIOUS_VISIBLE_HEADER':
      return selectPreviousVisibleHeader(state, action);
    case 'REMOVE_HEADER':
      return removeHeader(state, action);
    case 'MOVE_HEADER_UP':
      return moveHeaderUp(state, action);
    case 'MOVE_HEADER_DOWN':
      return moveHeaderDown(state, action);
    case 'MOVE_HEADER_LEFT':
      return moveHeaderLeft(state, action);
    case 'MOVE_HEADER_RIGHT':
      return moveHeaderRight(state, action);
    case 'MOVE_SUBTREE_LEFT':
      return moveSubtreeLeft(state, action);
    case 'MOVE_SUBTREE_RIGHT':
      return moveSubtreeRight(state, action);
    case 'APPLY_OPENNESS_STATE':
      return applyOpennessState(state, action);
    case 'SET_DIRTY':
      return setDirty(state, action);
    case 'FOCUS_HEADER':
      return focusHeader(state, action);
    case 'UNFOCUS_HEADER':
      return unfocusHeader(state, action);
    case 'SET_SELECTED_TABLE_CELL_ID':
      return setSelectedTableCellId(state, action);
    case 'ADD_NEW_TABLE_ROW':
      return addNewTableRow(state, action);
    case 'REMOVE_TABLE_ROW':
      return removeTableRow(state, action);
    case 'ADD_NEW_TABLE_COLUMN':
      return addNewTableColumn(state, action);
    case 'REMOVE_TABLE_COLUMN':
      return removeTableColumn(state, action);
    case 'MOVE_TABLE_ROW_DOWN':
      return moveTableRowDown(state, action);
    case 'MOVE_TABLE_ROW_UP':
      return moveTableRowUp(state, action);
    case 'MOVE_TABLE_COLUMN_LEFT':
      return moveTableColumnLeft(state, action);
    case 'MOVE_TABLE_COLUMN_RIGHT':
      return moveTableColumnRight(state, action);
    case 'UPDATE_TABLE_CELL_VALUE':
      return updateTableCellValue(state, action);
    case 'INSERT_CAPTURE':
      return insertCapture(state, action);
    case 'CLEAR_PENDING_CAPTURE':
      return clearPendingCapture(state, action);
    case 'ADVANCE_CHECKBOX_STATE':
      return advanceCheckboxState(state, action);
    case 'SET_LAST_SYNC_AT':
      return setLastSyncAt(state, action);
    case 'SET_HEADER_TAGS':
      return setHeaderTags(state, action);
    case 'REORDER_TAGS':
      return reorderTags(state, action);
    case 'REORDER_PROPERTY_LIST':
      return reorderPropertyList(state, action);
    case 'UPDATE_TIMESTAMP_WITH_ID':
      return updateTimestampWithId(state, action);
    case 'UPDATE_PLANNING_ITEM_TIMESTAMP':
      return updatePlanningItemTimestamp(state, action);
    case 'ADD_NEW_PLANNING_ITEM':
      return addNewPlanningItem(state, action);
    case 'REMOVE_PLANNING_ITEM':
      return removePlanningItem(state, action);
    case 'UPDATE_PROPERTY_LIST_ITEMS':
      return updatePropertyListItems(state, action);
    case 'SET_ORG_FILE_ERROR_MESSAGE':
      return setOrgFileErrorMessage(state, action);
    case 'SET_LOG_ENTRY_STOP':
      return setLogEntryStop(state, action);
    case 'CREATE_LOG_ENTRY_START':
      return createLogEntryStart(state, action);
    case 'UPDATE_LOG_ENTRY_TIME':
      return updateLogEntryTime(state, action);
    case 'SET_SEARCH_FILTER_INFORMATION':
      return setSearchFilterInformation(state, action);

    default:
      return state;
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
function updateHeadlines(
  currentTodoSet,
  newTodoState,
  indexedPlanningItemsWithRepeaters,
  state,
  headerIndex,
  currentTodoState
) {
  if (
    currentTodoSet.get('completedKeywords').includes(newTodoState) &&
    indexedPlanningItemsWithRepeaters.size > 0
  )
    state = updatePlanningItemsWithRepeaters(
      indexedPlanningItemsWithRepeaters,
      state,
      headerIndex,
      currentTodoSet,
      newTodoState,
      currentTodoState
    );
  else {
    // Update simple headline (without repeaters)
    state = state.setIn(['headers', headerIndex, 'titleLine', 'todoKeyword'], newTodoState);
  }
  return state;
}

function updatePlanningItemsWithRepeaters(
  indexedPlanningItemsWithRepeaters,
  state,
  headerIndex,
  currentTodoSet,
  newTodoState,
  currentTodoState
) {
  indexedPlanningItemsWithRepeaters.forEach(([planningItem, planningItemIndex]) => {
    state = state.setIn(
      ['headers', headerIndex, 'planningItems', planningItemIndex, 'timestamp'],
      applyRepeater(planningItem.get('timestamp'), new Date())
    );
  });
  state = state.setIn(
    ['headers', headerIndex, 'titleLine', 'todoKeyword'],
    currentTodoSet.get('keywords').first()
  );
  if (!noLogRepeatEnabledP({ state, headerIndex })) {
    const lastRepeatTimestamp = getCurrentTimestamp({ isActive: false, withStartTime: true });
    const newLastRepeatValue = [
      {
        type: 'timestamp',
        id: generateId(),
        firstTimestamp: lastRepeatTimestamp,
        secondTimestamp: null,
      },
    ];

    state = state.updateIn(['headers', headerIndex, 'propertyListItems'], propertyListItems =>
      propertyListItems.some(item => item.get('property') === 'LAST_REPEAT')
        ? propertyListItems.map(item =>
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
    state = state.updateIn(['headers', headerIndex], header => {
      let rawDescription = header.get('rawDescription');
      if (rawDescription.startsWith('\n')) {
        rawDescription = rawDescription.slice(1);
      }
      rawDescription =
        `\n- State "${newTodoState}"       from "${currentTodoState}"       ${renderAsText(
          fromJS(lastRepeatTimestamp)
        )}\n` + rawDescription;
      return header
        .set('rawDescription', rawDescription)
        .set('description', parseRawText(rawDescription));
    });
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
    .some(elt => elt.match(/^#\+STARTUP:.*nologrepeat.*/));
  const loggingProp = inheritedValueOfProperty(state.get('headers'), headerIndex, 'LOGGING');
  return !!(
    startupOptNoLogRepeat ||
    (loggingProp &&
      loggingProp.some(
        v => v.get('type') === 'text' && v.get('contents').match(/\s*nologrepeat\s*/)
      ))
  );
}

/**
 * Function wrapper around `updateCookiesOfHeaderWithId` and
 * `updateCookiesOfParentOfHeaderWithId`.
 */
function updateCookies(state, previousParentHeaderId, action) {
  state = updateCookiesOfHeaderWithId(state, previousParentHeaderId);
  state = updateCookiesOfParentOfHeaderWithId(state, action.headerId);
  return state;
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
    return nestingLevel => {
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
