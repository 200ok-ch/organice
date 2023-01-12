import { Map, List, fromJS } from 'immutable';

import generateId from '../lib/id_generator';
import { applyCaptureSettingsFromConfig } from '../util/settings_persister';

const indexOfTemplateWithId = (templates, templateId) =>
  templates.findIndex((template) => template.get('id') === templateId);

const addNewEmptyCaptureTemplate = (state) => {
  if (!state.get('captureTemplates')) {
    state = state.set('captureTemplates', List());
  }

  return state.update('captureTemplates', (templates) =>
    templates.push(
      fromJS({
        id: generateId(),
        description: '',
        letter: '',
        iconName: '',
        isAvailableInAllOrgFiles: true,
        file: '',
        orgFilesWhereAvailable: [''],
        headerPaths: [''],
        shouldPrepend: false,
        shouldCaptureAsNewHeader: true,
        template: '',
      })
    )
  );
};

const updateTemplateFieldPathValue = (state, action) => {
  const templateIndex = indexOfTemplateWithId(state.get('captureTemplates'), action.templateId);

  return state.setIn(['captureTemplates', templateIndex].concat(action.fieldPath), action.newValue);
};

const addNewTemplateOrgFileAvailability = (state, action) => {
  const templateIndex = indexOfTemplateWithId(state.get('captureTemplates'), action.templateId);

  return state.updateIn(['captureTemplates', templateIndex, 'orgFilesWhereAvailable'], (orgFiles) =>
    orgFiles.push('')
  );
};

const removeTemplateOrgFileAvailability = (state, action) => {
  const templateIndex = indexOfTemplateWithId(state.get('captureTemplates'), action.templateId);

  return state.updateIn(['captureTemplates', templateIndex, 'orgFilesWhereAvailable'], (orgFiles) =>
    orgFiles.delete(action.orgFileAvailabilityIndex)
  );
};

const addNewTemplateHeaderPath = (state, action) => {
  const templateIndex = indexOfTemplateWithId(state.get('captureTemplates'), action.templateId);

  return state.updateIn(['captureTemplates', templateIndex, 'headerPaths'], (headerPaths) =>
    headerPaths.push('')
  );
};

const removeTemplateHeaderPath = (state, action) => {
  const templateIndex = indexOfTemplateWithId(state.get('captureTemplates'), action.templateId);

  return state.updateIn(['captureTemplates', templateIndex, 'headerPaths'], (headerPaths) =>
    headerPaths.delete(action.headerPathIndex)
  );
};

const deleteTemplate = (state, action) => {
  const templateIndex = indexOfTemplateWithId(state.get('captureTemplates'), action.templateId);

  return state.update('captureTemplates', (templates) => templates.delete(templateIndex));
};

const restoreCaptureSettings = (state, action) => {
  if (!action.newSettings) {
    return state;
  }

  return applyCaptureSettingsFromConfig(state, action.newSettings);
};

const reorderCaptureTemplate = (state, action) =>
  state.update('captureTemplates', (templates) =>
    templates.splice(action.fromIndex, 1).splice(action.toIndex, 0, templates.get(action.fromIndex))
  );

export default (state = Map(), action) => {
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
    case 'REORDER_CAPTURE_TEMPLATE':
      return reorderCaptureTemplate(state, action);
    default:
      return state;
  }
};
