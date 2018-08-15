import { Map, List, fromJS } from 'immutable';

import { getNextId } from '../lib/parse_org';

const addNewEmptyCaptureTemplate = state => {
  if (!state.get('captureTemplates')) {
    state = state.set('captureTemplates', new List());
  }

  return state.update('captureTemplates', templates => (
    templates.push(fromJS({
      id: getNextId(),
      description: '',
    }))
  ));
};

export default (state = new Map(), action) => {
  switch (action.type) {
  case 'ADD_NEW_EMPTY_CAPTURE_TEMPLATE':
    return addNewEmptyCaptureTemplate(state, action);
  default:
    return state;
  }
};
