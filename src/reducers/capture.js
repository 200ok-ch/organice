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
      isAvailableInAllOrgFiles: true,
      orgFilesWhereAvailable: [''],
    }))
  ));
};

const updateTemplateFieldPathValue = (state, action) => {
  const templateIndex = indexOfTemplateWithId(state.get('captureTemplates'), action.templateId);

  return state.setIn(['captureTemplates', templateIndex].concat(action.fieldPath), action.newValue);
};

const addNewTemplateOrgFileAvailability = (state, action) => {
  const templateIndex = indexOfTemplateWithId(state.get('captureTemplates'), action.templateId);

  return state.updateIn(['captureTemplates', templateIndex, 'orgFilesWhereAvailable'], orgFiles => (
    orgFiles.push('')
  ));
};

const removeTemplateOrgFileAvailability = (state, action) => {
  const templateIndex = indexOfTemplateWithId(state.get('captureTemplates'), action.templateId);

  return state.updateIn(['captureTemplates', templateIndex, 'orgFilesWhereAvailable'], orgFiles => (
    orgFiles.delete(action.orgFileAvailabilityIndex)
  ));
};

export default (state = new Map(), action) => {
  switch (action.type) {
  case 'ADD_NEW_EMPTY_CAPTURE_TEMPLATE':
    return addNewEmptyCaptureTemplate(state, action);
  case 'UPDATE_TEMPLATE_FIELD_PATH_VALUE':
    return updateTemplateFieldPathValue(state, action);
  case 'ADD_NEW_TEMPLATE_ORG_FILE_AVAILABILITY':
    return addNewTemplateOrgFileAvailability(state, action);
  case 'REMOVE_TEMPLATE_ORG_FILE_AVAILABILITY':
    return removeTemplateOrgFileAvailability(state, action);
  default:
    return state;
  }
};
