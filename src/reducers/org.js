import { Map } from 'immutable';

import { parseOrg } from '../lib/parse_org';
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
  default:
    return state;
  }
};
