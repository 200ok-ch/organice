import { Map } from 'immutable';

import { parseOrg } from '../lib/parse_org';

const displayFile = (state, action) => {
  const parsedFile = parseOrg(action.contents);

  return state
    .set('filePath', action.path)
    .set('fileContents', action.contents)
    .set('headers', parsedFile.get('headers'))
    .set('todoKeywordSets', parsedFile.get('todoKeywordSets'));
};

export default (state = new Map(), action) => {
  switch (action.type) {
  case 'DISPLAY_FILE':
    return displayFile(state, action);
  default:
    return state;
  }
};
