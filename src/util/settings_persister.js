import { Map, List, fromJS } from 'immutable';
import _ from 'lodash';

import { getOpenHeaderPaths } from '../lib/org_utils';

import { restoreBaseSettings } from '../actions/base';
import { restoreCaptureSettings } from '../actions/capture';

import generateId from '../lib/id_generator';

export const isLocalStorageAvailable = () => {
  try {
    localStorage.setItem('test', 'test');
    return localStorage.getItem('test') === 'test';
  } catch (e) {
    return false;
  }
};

const debouncedPushConfigToSyncBackend = _.debounce(
  (syncBackendClient, contents) => {
    switch (syncBackendClient.type) {
      case 'Dropbox':
      case 'WebDAV':
        syncBackendClient
          .createFile('/.organice-config.json', contents)
          .catch(error =>
            alert(`There was an error trying to push settings to your sync backend: ${error}`)
          );
        break;
      case 'Google Drive':
        syncBackendClient
          .createFile('.organice-config.json', 'root', contents)
          .catch(error =>
            alert(`There was an error trying to push settings to your sync backend: ${error}`)
          );
        break;
      default:
    }
  },
  1000,
  { maxWait: 3000 }
);

export const persistableFields = [
  {
    category: 'base',
    name: 'fontSize',
    type: 'nullable',
    shouldStoreInConfig: true,
  },
  {
    category: 'base',
    name: 'bulletStyle',
    type: 'nullable',
    shouldStoreInConfig: true,
  },
  {
    category: 'base',
    name: 'shouldTapTodoToAdvance',
    type: 'boolean',
    shouldStoreInConfig: true,
  },
  {
    category: 'base',
    name: 'shouldDoubleTapToEdit',
    type: 'boolean',
    shouldStoreInConfig: true,
  },
  {
    category: 'base',
    name: 'agendaDefaultDeadlineDelayUnit',
    type: 'nullable',
    shouldStoreInConfig: true,
  },
  {
    category: 'base',
    name: 'agendaDefaultDeadlineDelayValue',
    type: 'nullable',
    shouldStoreInConfig: true,
  },

  {
    category: 'base',
    name: 'shouldStoreSettingsInSyncBackend',
    type: 'boolean',
    shouldStoreInConfig: true,
  },
  {
    category: 'base',
    name: 'lastSeenChangelogHash',
    type: 'nullable',
    shouldStoreInConfig: true,
  },
  {
    category: 'base',
    name: 'customKeybindings',
    type: 'json',
    shouldStoreInConfig: true,
  },
  {
    category: 'base',
    name: 'shouldLiveSync',
    type: 'boolean',
    shouldStoreInConfig: true,
  },
  {
    category: 'base',
    name: 'shouldSyncOnBecomingVisibile',
    type: 'boolean',
    shouldStoreInConfig: true,
  },
  {
    category: 'base',
    name: 'shouldShowTitleInOrgFile',
    type: 'boolean',
    shouldStoreInConfig: true,
  },
  {
    category: 'capture',
    name: 'captureTemplates',
    type: 'json',
    shouldStoreInConfig: true,
    default: List(),
  },
];

export const readOpennessState = () => {
  const opennessStateJSONString = localStorage.getItem('headerOpenness');
  return !!opennessStateJSONString ? JSON.parse(opennessStateJSONString) : null;
};

const getFieldsToPersist = (state, fields) =>
  fields
    .filter(field => !field.depreacted)
    .filter(field => field.category === 'org')
    .map(field => field.name)
    .map(field => [field, state.org.present.get(field)])
    .concat(
      persistableFields
        .filter(field => field.category !== 'org')
        .map(field =>
          field.type === 'json'
            ? [
                field.name,
                JSON.stringify(state[field.category].get(field.name) || field.default || {}),
              ]
            : [field.name, state[field.category].get(field.name)]
        )
    );

const getConfigFileContents = fieldsToPersist =>
  JSON.stringify(_.fromPairs(fieldsToPersist), null, 2);

export const applyCategorySettingsFromConfig = (state, config, category) => {
  persistableFields
    .filter(field => field.category === category)
    .filter(field => field.shouldStoreInConfig)
    .forEach(field => {
      field.type === 'json'
        ? (state = state.set(field.name, fromJS(JSON.parse(config[field.name]))))
        : (state = state.set(field.name, config[field.name]));
    });

  return state;
};

export const applyCaptureSettingsFromConfig = (state, config) => {
  const captureTemplates = fromJS(JSON.parse(config.captureTemplates)).map(template =>
    template.set('id', generateId())
  );

  return state.set('captureTemplates', captureTemplates);
};

export const readInitialState = () => {
  if (!isLocalStorageAvailable()) {
    return undefined;
  }

  let initialState = {
    syncBackend: Map(),
    org: {
      past: [],
      present: Map({
        search: Map({
          searchFilter: '',
          searchFilterExpr: [],
        }),
      }),
      future: [],
    },
    base: Map(),
    capture: Map(),
  };

  persistableFields.forEach(field => {
    let value = localStorage.getItem(field.name);

    if (field.type === 'nullable') {
      if (value === 'null') {
        value = null;
      }
    } else if (field.type === 'boolean') {
      value = value === 'true';
    } else if (field.type === 'json') {
      if (!value) {
        value = field.default || Map();
      } else {
        value = fromJS(JSON.parse(value));
      }
    }

    if (field.category === 'org') {
      initialState[field.category].present = initialState[field.category].present.set(
        field.name,
        value
      );
    } else {
      initialState[field.category] = initialState[field.category].set(field.name, value);
    }
  });

  // Assign new ids to the capture templates.
  if (initialState.capture.get('captureTemplates')) {
    initialState.capture = initialState.capture.update('captureTemplates', templates =>
      templates.map(template => template.set('id', generateId()))
    );
  }

  const opennessState = readOpennessState();
  if (!!opennessState) {
    initialState.org.present = initialState.org.present.set('opennessState', fromJS(opennessState));
  }

  // Cache the config file contents locally so we don't overwrite on initial page load.
  window.previousSettingsFileContents = getConfigFileContents(
    getFieldsToPersist(initialState, persistableFields)
  );

  return initialState;
};

export const loadSettingsFromConfigFile = (dispatch, getState) => {
  const syncBackendClient = getState().syncBackend.get('client');
  if (!syncBackendClient) {
    return;
  }

  let fileContentsPromise = null;
  switch (syncBackendClient.type) {
    case 'Dropbox':
    case 'WebDAV':
      fileContentsPromise = syncBackendClient.getFileContents('/.organice-config.json');
      break;
    case 'Google Drive':
      fileContentsPromise = syncBackendClient.getFileContentsByNameAndParent(
        '.organice-config.json',
        'root'
      );
      break;
    default:
  }

  fileContentsPromise
    .then(configFileContents => {
      try {
        const config = JSON.parse(configFileContents);
        dispatch(restoreBaseSettings(config));
        dispatch(restoreCaptureSettings(config));
      } catch (_error) {
        // Something went wrong parsing the config file, but we don't care, we'll just
        // overwrite it with a good local copy.
      }
    })
    .catch(() => {});
};

export const subscribeToChanges = store => {
  if (!isLocalStorageAvailable()) {
    return () => {};
  } else {
    return () => {
      const state = store.getState();

      const fieldsToPersist = getFieldsToPersist(state, persistableFields);

      fieldsToPersist.forEach(([name, value]) => localStorage.setItem(name, value));

      if (state.base.get('shouldStoreSettingsInSyncBackend')) {
        const settingsFileContents = getConfigFileContents(fieldsToPersist);

        if (window.previousSettingsFileContents !== settingsFileContents) {
          debouncedPushConfigToSyncBackend(state.syncBackend.get('client'), settingsFileContents);
        }

        window.previousSettingsFileContents = settingsFileContents;
      }

      const currentFilePath = state.org.present.get('path');
      if (!!currentFilePath && state.org.present.get('headers')) {
        const openHeaderPaths = getOpenHeaderPaths(state.org.present.get('headers'));

        let opennessState = {};
        const opennessStateJSONString = localStorage.getItem('headerOpenness');
        if (opennessStateJSONString) {
          opennessState = JSON.parse(opennessStateJSONString);
        }

        opennessState[currentFilePath] = openHeaderPaths;
        localStorage.setItem('headerOpenness', JSON.stringify(opennessState));
      }
    };
  }
};

export const persistField = (field, value) => {
  if (!isLocalStorageAvailable()) {
    return;
  } else {
    localStorage.setItem(field, value);
  }
};

export const getPersistedField = (field, nullable = false) => {
  if (!isLocalStorageAvailable()) {
    return null;
  } else {
    const value = localStorage.getItem(field);
    if (nullable) {
      return value === 'null' ? null : value;
    } else {
      return value;
    }
  }
};
