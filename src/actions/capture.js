export const addNewEmptyCaptureTemplate = () => ({
  type: 'ADD_NEW_EMPTY_CAPTURE_TEMPLATE',
});

export const updateTemplateFieldValue = (templateId, fieldName, newValue) => ({
  type: 'UPDATE_TEMPLATE_FIELD_VALUE', templateId, fieldName, newValue,
});
