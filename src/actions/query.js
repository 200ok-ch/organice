export const addNewEmptyQuery = () => ({
  type: 'ADD_NEW_EMPTY_QUERY',
});

export const updateQueryFieldPathValue = (queryId, fieldPath, newValue) => ({
  type: 'UPDATE_QUERY_FIELD_PATH_VALUE',
  queryId,
  fieldPath,
  newValue,
});

export const addNewQueryOrgFileAvailability = (queryId) => ({
  type: 'ADD_NEW_QUERY_ORG_FILE_AVAILABILITY',
  queryId,
});

export const removeQueryOrgFileAvailability = (queryId, orgFileAvailabilityIndex) => ({
  type: 'REMOVE_QUERY_ORG_FILE_AVAILABILITY',
  queryId,
  orgFileAvailabilityIndex,
});

export const addNewQueryConfig = (queryId) => ({
  type: 'ADD_NEW_QUERY_CONFIG',
  queryId,
});

export const removeQueryConfig = (queryId) => ({
  type: 'REMOVE_QUERY_CONFIG',
  queryId,
});

export const deleteQuery = (queryId) => ({
  type: 'DELETE_QUERY',
  queryId,
});

export const restoreQuerySettings = (newSettings) => ({
  type: 'RESTORE_QUERY_SETTINGS',
  newSettings,
});

export const reorderQuery = (fromIndex, toIndex) => ({
  type: 'REORDER_QUERY',
  fromIndex,
  toIndex,
});
