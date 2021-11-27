import { Map, List, fromJS } from 'immutable';

import generateId from '../lib/id_generator';
import { applyQuerySettingsFromConfig } from '../util/settings_persister';

const indexOfQueryWithId = (queries, queryId) =>
  queries.findIndex((query) => query.get('id') === queryId);

const addNewEmptyQuery = (state) => {
  if (!state.get('querySettings')) {
    state = state.set('querySettings', List());
  }

  return state.update('querySettings', (queries) =>
    queries.push(
      fromJS({
        id: generateId(),
        description: '',
        isAvailableInAllOrgFiles: true,
        orgFilesWhereAvailable: [''],
        queries: [{ query: '', type: 'search' }],
      })
    )
  );
};

const updateQueryFieldPathValue = (state, action) => {
  const queryIndex = indexOfQueryWithId(state.get('querySettings'), action.templateId);

  return state.setIn(['querySettings', queryIndex].concat(action.fieldPath), action.newValue);
};

const addNewQueryOrgFileAvailability = (state, action) => {
  const queryIndex = indexOfQueryWithId(state.get('querySettings'), action.queryId);

  return state.updateIn(['querySettings', queryIndex, 'orgFilesWhereAvailable'], (orgFiles) =>
    orgFiles.push('')
  );
};

const removeQueryOrgFileAvailability = (state, action) => {
  const queryIndex = indexOfQueryWithId(state.get('querySettings'), action.queryId);

  return state.updateIn(['querySettings', queryIndex, 'orgFilesWhereAvailable'], (orgFiles) =>
    orgFiles.delete(action.orgFileAvailabilityIndex)
  );
};

const addNewQueryConfig = (state, action) => {
  const queryIndex = indexOfQueryWithId(state.get('querySettings'), action.queryId);

  return state.updateIn(['querySettings', queryIndex, 'queries'], (queries) =>
    queries.push(Map().set('query', '').set('type', 'search'))
  );
};

const removeQueryConfig = (state, action) => {
  const queryIndex = indexOfQueryWithId(state.get('querySettings'), action.queryId);

  return state.updateIn(['querySettings', queryIndex, 'queries'], (queries) =>
    queries.delete(queryIndex)
  );
};

const deleteQuery = (state, action) => {
  const queryIndex = indexOfQueryWithId(state.get('querySettings'), action.queryId);

  return state.update('querySettings', (queries) => queries.delete(queryIndex));
};

const restoreQuerySettings = (state, action) => {
  if (!action.newSettings) {
    return state;
  }

  return applyQuerySettingsFromConfig(state, action.newSettings);
};

const reorderQueries = (state, action) =>
  state.update('querySettings', (queries) =>
    queries.splice(action.fromIndex, 1).splice(action.toIndex, 0, queries.get(action.fromIndex))
  );

export default (state = Map(), action) => {
  switch (action.type) {
    case 'ADD_NEW_EMPTY_QUERY':
      return addNewEmptyQuery(state, action);
    case 'UPDATE_QUERY_FIELD_PATH_VALUE':
      return updateQueryFieldPathValue(state, action);
    case 'ADD_NEW_QUERY_ORG_FILE_AVAILABILITY':
      return addNewQueryOrgFileAvailability(state, action);
    case 'REMOVE_QUERY_ORG_FILE_AVAILABILITY':
      return removeQueryOrgFileAvailability(state, action);
    case 'ADD_NEW_QUERY_CONFIG':
      return addNewQueryConfig(state, action);
    case 'REMOVE_QUERY_CONFIG':
      return removeQueryConfig(state, action);
    case 'DELETE_QUERY':
      return deleteQuery(state, action);
    case 'RESTORE_QUERY_SETTINGS':
      return restoreQuerySettings(state, action);
    case 'REORDER_QUERY':
      return reorderQueries(state, action);
    default:
      return state;
  }
};
