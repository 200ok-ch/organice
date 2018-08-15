import { Map, List, fromJS } from 'immutable';

import { getNextId } from '../lib/parse_org';

const indexOfTemplateWithId = (templates, templateId) => (
  templates.findIndex(template => template.get('id') === templateId)
);

const addNewEmptyCaptureTemplate = state => {
  if (!state.get('captureTemplates')) {
    state = state.set('captureTemplates', new List());
  }

  return state.update('captureTemplates', templates => (
    templates.push(fromJS({
      id: getNextId(),
      description: '',
      letter: '',
      iconName: '',
    }))
  ));
};

const updateTemplateFieldValue = (state, action) => {
  const templateIndex = indexOfTemplateWithId(state.get('captureTemplates'), action.templateId);

  return state.setIn(['captureTemplates', templateIndex, action.fieldName], action.newValue);
};

export default (state = new Map(), action) => {
  switch (action.type) {
  case 'ADD_NEW_EMPTY_CAPTURE_TEMPLATE':
    return addNewEmptyCaptureTemplate(state, action);
  case 'UPDATE_TEMPLATE_FIELD_VALUE':
    return updateTemplateFieldValue(state, action);
  default:
    return state;
  }
};
