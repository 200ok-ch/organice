import { Map } from 'immutable';
import _ from 'lodash';

import {
  parseOrg,
  parseTitleLine,
  parseLinks,
  newHeaderWithTitle,
} from '../lib/parse_org';
import {
  indexOfHeaderWithId,
  headerWithId,
  subheadersOfHeaderWithId,
  indexOfPreviousSibling,
  openDirectParent,
  openHeaderWithPath,
  nextVisibleHeaderAfterIndex,
  previousVisibleHeaderAfterIndex,
} from '../lib/org_utils';

const displayFile = (state, action) => {
  const parsedFile = parseOrg(action.contents);

  return state
    .set('path', action.path)
    .set('contents', action.contents)
    .set('headers', parsedFile.get('headers'))
    .set('todoKeywordSets', parsedFile.get('todoKeywordSets'));
};

const stopDisplayingFile = state => (
  state
    .set('path', null)
    .set('contents', null)
    .set('headers', null)
    .set('todoKeywordSets', null)
);

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
    subheaders.forEach((subheader, index) => {
      state = state.setIn(['headers', headerIndex + index + 1, 'opened'], false);
    });
  }

  return state.setIn(['headers', headerIndex, 'opened'], !isOpened);
};

const selectHeader = (state, action) => {
  return state.set('selectedHeaderId', action.headerId);
};

const advanceTodoState = (state, action) => {
  const headerId = state.get('selectedHeaderId');
  if (!headerId) {
    return state;
  }

  const headers = state.get('headers');
  const header = headerWithId(headers, headerId);
  const headerIndex = indexOfHeaderWithId(headers, headerId);

  const currentTodoState = header.getIn(['titleLine', 'todoKeyword']);
  const currentTodoSet = state.get('todoKeywordSets').find(todoKeywordSet => (
    todoKeywordSet.get('keywords').contains(currentTodoState)
  )) || state.get('todoKeywordSets').first();

  const currentStateIndex = currentTodoSet.get('keywords').indexOf(currentTodoState);
  const newStateIndex = currentStateIndex + 1;
  const newTodoState = currentTodoSet.get('keywords').get(newStateIndex) || '';

  return state.setIn(['headers', headerIndex, 'titleLine', 'todoKeyword'], newTodoState);
};

const updateHeaderTitle = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  const newTitleLine = parseTitleLine(action.newRawTitle, state.get('todoKeywordSets'));

  return state.setIn(['headers', headerIndex, 'titleLine'], newTitleLine);
};

const updateHeaderDescription = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  return state.updateIn(['headers', headerIndex], header => (
    header
      .set('rawDescription', action.newRawDescription)
      .set('description', parseLinks(action.newRawDescription))
  ));
};

const addHeader = (state, action) => {
  const headers = state.get('headers');
  const header = headerWithId(headers, action.headerId);
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  const subheaders = subheadersOfHeaderWithId(headers, action.headerId);

  const newHeader = newHeaderWithTitle('',
                                       header.get('nestingLevel'),
                                       state.get('todoKeywordSets'));

  if (action.headerId === state.get('focusedHeaderId')) {
    state = state.set('focusedHeaderId', null);
  }

  return state.update('headers', headers => (
    headers.insert(headerIndex + subheaders.size + 1, newHeader)
  ));
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

const selectNextVisibleHeader = (state, action) => {
  const headers = state.get('headers');

  if (!state.get('selectedHeaderId')) {
    return state.set('selectedHeaderId', headers.getIn([0, 'id']));
  }

  const headerIndex = indexOfHeaderWithId(headers, state.get('selectedHeaderId'));

  const nextVisibleHeader = nextVisibleHeaderAfterIndex(headers, headerIndex);

  if (!nextVisibleHeader) {
    return state;
  }

  return state.set('selectedHeaderId', nextVisibleHeader.get('id'));
};

const selectPreviousVisibleHeader = (state, action) => {
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

  _.times(numHeadersToRemove).forEach(() => {
    headers = headers.delete(headerIndex);
  });

  if (action.headerId === state.get('focusedHeaderId')) {
    state = state.set('focusedHeaderId', null);
  }

  return state.set('headers', headers);
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
    headers = headers.insert(headerIndex, headers.get(nextSiblingIndex + nextSiblingSubheaders.size));
    headers = headers.delete(nextSiblingIndex + nextSiblingSubheaders.size + 1);
  });

  return state.set('headers', headers);
};

const moveHeaderLeft = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  return state.updateIn(['headers', headerIndex, 'nestingLevel'], nestingLevel => (
    Math.max(nestingLevel - 1, 1)
  ));
};

const moveHeaderRight = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  state = state.updateIn(['headers', headerIndex, 'nestingLevel'], nestingLevel => (
    nestingLevel + 1
  ));

  return openDirectParent(state, action.headerId);
};

const moveSubtreeLeft = (state, action) => {
  const headers = state.get('headers');
  const header = headerWithId(headers, action.headerId);
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  if (header.get('nestingLevel') === 1) {
    return state;
  }

  const subheaders = subheadersOfHeaderWithId(headers, action.headerId);

  state = state.updateIn(['headers', headerIndex, 'nestingLevel'], nestingLevel => (
    nestingLevel - 1
  ));

  subheaders.forEach((_, index) => {
    state = state.updateIn(['headers', headerIndex + index + 1, 'nestingLevel'], nestingLevel => (
      nestingLevel - 1
    ));
  });

  return state;
};

const moveSubtreeRight = (state, action) => {
  const headers = state.get('headers');
  const headerIndex = indexOfHeaderWithId(headers, action.headerId);

  const subheaders = subheadersOfHeaderWithId(headers, action.headerId);

  state = state.updateIn(['headers', headerIndex, 'nestingLevel'], nestingLevel => (
    nestingLevel + 1
  ));
  subheaders.forEach((_, index) => {
    state = state.updateIn(['headers', headerIndex + index + 1, 'nestingLevel'], nestingLevel => (
      nestingLevel + 1
    ));
  });

  return openDirectParent(state, action.headerId);
};

const focusHeader = (state, action) => {
  return state.set('focusedHeaderId', action.headerId);
};

const unfocusHeader = state => (
  state.set('focusedHeaderId', null)
);

const noOp = state => (
  state.update('noOpCounter', counter => (counter || 0) + 1)
);

const applyOpennessState = (state, action) => {
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

const setDirty = (state, action) => (
  state.set('isDirty', action.isDirty)
);

export default (state = new Map(), action) => {
  const dirtyingActions = [
    'ADVANCE_TODO_STATE', 'UPDATE_HEADER_TITLE', 'UPDATE_HEADER_DESCRIPTION',
    'ADD_HEADER', 'REMOVE_HEADER', 'MOVE_HEADER_UP',
    'MOVE_HEADER_DOWN', 'MOVE_HEADER_LEFT', 'MOVE_HEADER_RIGHT',
    'MOVE_SUBTREE_LEFT', 'MOVE_SUBTREE_RIGHT',
  ];

  if (dirtyingActions.includes(action.type)) {
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
  case 'ADVANCE_TODO_STATE':
    return advanceTodoState(state, action);
  case 'ENTER_TITLE_EDIT_MODE':
    return state.set('inTitleEditMode', true);
  case 'EXIT_TITLE_EDIT_MODE':
    return state.set('inTitleEditMode', false);
  case 'UPDATE_HEADER_TITLE':
    return updateHeaderTitle(state, action);
  case 'ENTER_DESCRIPTION_EDIT_MODE':
    return state.set('inDescriptionEditMode', true);
  case 'EXIT_DESCRIPTION_EDIT_MODE':
    return state.set('inDescriptionEditMode', false);
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
  case 'NO_OP':
    return noOp(state, action);
  case 'APPLY_OPENNESS_STATE':
    return applyOpennessState(state, action);
  case 'SET_DIRTY':
    return setDirty(state, action);
  case 'FOCUS_HEADER':
    return focusHeader(state, action);
  case 'UNFOCUS_HEADER':
    return unfocusHeader(state, action);
  default:
    return state;
  }
};
