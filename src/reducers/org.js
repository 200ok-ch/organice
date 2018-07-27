import { Map } from 'immutable';

import { parseOrg, parseTitleLine, parseLinks } from '../lib/parse_org';
import { indexOfHeaderWithId, headerWithId, subheadersOfHeaderWithId } from '../lib/org_utils';

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

const toggleHeaderOpened = (state, action) => {
  const headers = state.get('headers');

  const headerIndex = indexOfHeaderWithId(headers, action.headerId);
  const isOpened = headerWithId(headers, action.headerId).get('opened');

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

export default (state = new Map(), action) => {
  switch (action.type) {
  case 'DISPLAY_FILE':
    return displayFile(state, action);
  case 'STOP_DISPLAYING_FILE':
    return stopDisplayingFile(state, action);
  case 'TOGGLE_HEADER_OPENED':
    return toggleHeaderOpened(state, action);
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
  default:
    return state;
  }
};
