import { Map, List, fromJS } from 'immutable';

import { getNextId } from '../lib/parse_org';
import { applyCaptureSettingsFromConfig } from '../util/settings_persister';

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
      headerPaths: [''],
      shouldPrepend: false,
      template: '',
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

const addNewTemplateHeaderPath = (state, action) => {
  const templateIndex = indexOfTemplateWithId(state.get('captureTemplates'), action.templateId);

  return state.updateIn(['captureTemplates', templateIndex, 'headerPaths'], headerPaths => (
    headerPaths.push('')
  ));
};

const removeTemplateHeaderPath = (state, action) => {
  const templateIndex = indexOfTemplateWithId(state.get('captureTemplates'), action.templateId);

  return state.updateIn(['captureTemplates', templateIndex, 'headerPaths'], headerPaths => (
    headerPaths.delete(action.headerPathIndex)
  ));
};

const deleteTemplate = (state, action) => {
  const templateIndex = indexOfTemplateWithId(state.get('captureTemplates'), action.templateId);

  return state.update('captureTemplates', templates => templates.delete(templateIndex));
};

const restoreCaptureSettings = (state, action) => {
  if (!action.newSettings) {
    return state;
  }

  return applyCaptureSettingsFromConfig(state, action.newSettings);
};

const activateCaptureModalForTemplateId = (state, action) => (
  state.set('activeCaptureTemplateId', action.templateId)
);

const disableCaptureModal = state => (
  state.set('activeCaptureTemplateId', null)
);

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
  case 'ADD_NEW_TEMPLATE_HEADER_PATH':
    return addNewTemplateHeaderPath(state, action);
  case 'REMOVE_TEMPLATE_HEADER_PATH':
    return removeTemplateHeaderPath(state, action);
  case 'DELETE_TEMPLATE':
    return deleteTemplate(state, action);
  case 'RESTORE_CAPTURE_SETTINGS':
    return restoreCaptureSettings(state, action);
  case 'ACTIVATE_CAPTURE_MODAL_FOR_TEMPLATE_ID':
    return activateCaptureModalForTemplateId(state, action);
  case 'DISABLE_CAPTURE_MODAL':
    return disableCaptureModal(state, action);
  default:
    return state;
  }
};
