import { Map, List, Set, fromJS } from 'immutable';
import _ from 'lodash';

import { getOpenHeaderPaths } from '../lib/org_utils';

import { restoreBaseSettings } from '../actions/base';
import { restoreCaptureSettings } from '../actions/capture';
import { restoreFileSettings } from '../actions/org';

import generateId from '../lib/id_generator';
import { loadFilesFromLocalStorage } from './file_persister';

export const localStorageAvailable = (() => {
  try {
    localStorage.setItem('test', 'test');
    const localStorageRes = localStorage.getItem('test') === 'test';
    localStorage.removeItem('test');
    return localStorageRes && localStorage;
  } catch (e) {
    return false;
  }
})();

/**
 * GitLab doesn't allow updating a file that doesn't exist or creating one that already exists, so
 * need to figure out which to do.
 */
const updateConfigForGitLab = async (client, contents) => {
  const filename = '/.organice-config.json';
  let exists = false;
  try {
    const existingContents = await client.getFileContents(filename);
    exists = true;
    // INFO: Not calling syncBackendClient.createFile is a
    // workaround for
    // https://github.com/200ok-ch/organice/issues/736
    if (existingContents === contents) {
      return;
    }
  } catch {
    // Error is (presumably) because file doesn't exist. Unfortunately this isn't perfect because it
    // could have failed due to e.g. a network issue.
  }
  if (exists) {
    await client.updateFile(filename, contents);
  } else {
    await client.createFile(filename, contents);
  }
};

const debouncedPushConfigToSyncBackend = _.debounce(
  (syncBackendClient, contents) => {
    switch (syncBackendClient.type) {
      case 'Dropbox':
      case 'WebDAV':
        syncBackendClient
          .createFile('/.organice-config.json', contents)
          .catch((error) =>
            alert(`There was an error trying to push settings to your sync backend: ${error}`)
          );
        break;
      case 'GitLab':
        updateConfigForGitLab(syncBackendClient, contents).catch((error) =>
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
  },
  {
    category: 'base',
    name: 'bulletStyle',
    type: 'nullable',
    default: 'Fancy',
  },
  {
    category: 'base',
    name: 'shouldTapTodoToAdvance',
    type: 'boolean',
  },

  {
    category: 'base',
    name: 'agendaDefaultDeadlineDelayUnit',
    type: 'nullable',
  },
  {
    category: 'base',
    name: 'agendaDefaultDeadlineDelayValue',
    type: 'nullable',
  },
  {
    category: 'base',
    name: 'editorDescriptionHeightValue',
    type: 'nullable',
    default: '8',
  },
  {
    category: 'base',
    name: 'agendaStartOnWeekday',
    type: 'nullable',
    default: 1,
  },

  {
    category: 'base',
    name: 'shouldStoreSettingsInSyncBackend',
    type: 'boolean',
    default: true,
  },
  {
    category: 'base',
    name: 'lastSeenChangelogHash',
    type: 'nullable',
  },
  {
    category: 'base',
    name: 'customKeybindings',
    type: 'json',
  },
  {
    category: 'base',
    name: 'shouldLiveSync',
    type: 'boolean',
    default: true,
  },
  {
    category: 'base',
    name: 'showDeadlineDisplay',
    type: 'boolean',
    default: false,
  },
  {
    category: 'base',
    name: 'shouldSyncOnBecomingVisibile',
    type: 'boolean',
    default: true,
  },
  {
    category: 'base',
    name: 'shouldShowTitleInOrgFile',
    type: 'boolean',
  },
  {
    category: 'base',
    name: 'shouldLogIntoDrawer',
    type: 'boolean',
  },
  {
    category: 'base',
    name: 'shouldLogDone',
    type: 'boolean',
  },
  {
    category: 'base',
    name: 'closeSubheadersRecursively',
    type: 'boolean',
  },
  {
    category: 'base',
    name: 'shouldNotIndentOnExport',
    type: 'boolean',
  },
  {
    category: 'org',
    name: 'showClockDisplay',
    type: 'boolean',
  },
  {
    category: 'base',
    name: 'colorScheme',
    type: 'string',
    default: 'OS',
  },
  {
    category: 'base',
    name: 'theme',
    type: 'string',
    default: 'Solarized',
  },
  {
    category: 'capture',
    name: 'captureTemplates',
    type: 'json',
    default: List(),
  },
  {
    category: 'org',
    name: 'fileSettings',
    type: 'json',
    default: List(),
  },
  {
    category: 'base',
    name: 'agendaTimeframe',
    type: 'string',
    default: 'Week',
  },
  {
    category: 'base',
    name: 'preferEditRawValues',
    type: 'boolean',
  },
  {
    category: 'org',
    name: 'bookmarks',
    type: 'json',
    default: Map({
      search: List(),
      'task-list': List(),
      refile: List(),
    }),
  },
];

export const readOpennessState = () => {
  const opennessStateJSONString = localStorage.getItem('headerOpenness');
  return !!opennessStateJSONString ? JSON.parse(opennessStateJSONString) : null;
};

const getFieldsToPersist = (state, fields) => {
  return fields
    .filter((field) => !field.depreacted)
    .filter((field) => field.category === 'org')
    .map((field) =>
      field.type === 'json'
        ? [field.name, JSON.stringify(state.org.present.get(field.name) || field.default || {})]
        : [field.name, state.org.present.get(field.name)]
    )
    .concat(
      persistableFields
        .filter((field) => field.category !== 'org')
        .map((field) => {
          return field.type === 'json'
            ? [
                field.name,
                JSON.stringify(state[field.category].get(field.name) || field.default || {}),
              ]
            : [field.name, state[field.category].get(field.name) || field.default];
        })
    );
};

const getConfigFileContents = (fieldsToPersist) => {
  return JSON.stringify(_.fromPairs(fieldsToPersist), null, 2);
};

export const applyCategorySettingsFromConfig = (state, config, category) => {
  persistableFields
    .filter((field) => field.category === category)
    .forEach((field) => {
      field.type === 'json'
        ? (state = state.set(field.name, fromJS(JSON.parse(config[field.name]))))
        : (state = state.set(field.name, config[field.name]));
    });

  return state;
};

export const applyCaptureSettingsFromConfig = (state, config) => {
  const captureTemplates = fromJS(JSON.parse(config.captureTemplates)).map((template) =>
    template.set('id', generateId())
  );

  return state.set('captureTemplates', captureTemplates);
};
export const applyFileSettingsFromConfig = (state, config) => {
  const fileSettings = fromJS(JSON.parse(config.fileSettings)).map((setting) =>
    setting.set('id', generateId())
  );

  return state.set('fileSettings', fileSettings);
};

const getInitialStateWithDefaultValues = () => {
  let initialState = {
    syncBackend: Map(),
    org: {
      past: [],
      present: Map({
        files: Map(),
        fileSettings: [],
        opennessState: Map(),
        search: Map({
          searchFilter: '',
          searchFilterExpr: [],
        }),
        bookmarks: Map({
          search: List(),
          'task-list': List(),
          refile: List(),
        }),
      }),
      future: [],
    },
    base: Map({ isLoading: Set(), finderTab: 'Search' }),
    capture: Map(),
  };

  persistableFields.forEach((field) => {
    const value = field.default;

    if (field.category === 'org') {
      initialState[field.category].present = initialState[field.category].present.set(
        field.name,
        value
      );
    } else {
      initialState[field.category] = initialState[field.category].set(field.name, value);
    }
  });

  return initialState;
};

const loadContentFromLocalStorage = (initialState) => {
  persistableFields.forEach((field) => {
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
    // When nothing has been saved to localStorage before, keep the default.
    value = value || field.default;

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
    initialState.capture = initialState.capture.update('captureTemplates', (templates) =>
      templates.map((template) => template.set('id', generateId()))
    );
  }
  // Assign new ids to the file settings.
  if (initialState.org.present.get('fileSettings')) {
    initialState.org.present = initialState.org.present.update('fileSettings', (settings) =>
      settings.map((setting) => setting.set('id', generateId()))
    );
  }

  const opennessState = readOpennessState();
  if (!!opennessState) {
    initialState.org.present = initialState.org.present.set('opennessState', fromJS(opennessState));
  }

  // Cache the config file contents locally so we don't overwrite on
  // initial page load.
  window.previousSettingsFileContents = getConfigFileContents(
    getFieldsToPersist(initialState, persistableFields)
  );

  return loadFilesFromLocalStorage(initialState);
};

export const readInitialState = () => {
  let initialState = getInitialStateWithDefaultValues();

  return localStorageAvailable ? loadContentFromLocalStorage(initialState) : initialState;
};

export const loadSettingsFromConfigFile = (dispatch, getState) => {
  const syncBackendClient = getState().syncBackend.get('client');
  if (!syncBackendClient) {
    return;
  }

  let fileContentsPromise = null;
  switch (syncBackendClient.type) {
    case 'Dropbox':
    case 'GitLab':
    case 'WebDAV':
      fileContentsPromise = syncBackendClient.getFileContents('/.organice-config.json');
      break;
    default:
  }

  fileContentsPromise
    .then((configFileContents) => {
      try {
        let config;

        /* Rationale for the type check:
          When loading the settings file, `configFileContents` is
          sometimes already an object. Therefore, when JSON.parse is
          run, it throws an error which is silently swallowed by the
          catch below. This appears to be the cause of
          https:github.com/200ok-ch/organice/issues/472. Settings will
          never load from file and default config always loads.
          */
        if (typeof configFileContents === 'string') {
          config = JSON.parse(configFileContents);
        } else {
          config = configFileContents;
        }

        dispatch(restoreBaseSettings(config));
        dispatch(restoreCaptureSettings(config));
        dispatch(restoreFileSettings(config));
      } catch (_error) {
        // Something went wrong parsing the config file, but we don't care, we'll just
        // overwrite it with a good local copy.
      }
    })
    .catch(() => {});
};

export const subscribeToChanges = (store) => {
  if (!localStorageAvailable) {
    return () => {};
  } else {
    return () => {
      const state = store.getState();

      const fieldsToPersist = getFieldsToPersist(state, persistableFields);

      fieldsToPersist.forEach(([name, value]) => {
        if (name && value) localStorage.setItem(name, value);
      });

      if (state.base.get('shouldStoreSettingsInSyncBackend')) {
        const settingsFileContents = getConfigFileContents(fieldsToPersist);

        if (window.previousSettingsFileContents !== settingsFileContents) {
          debouncedPushConfigToSyncBackend(state.syncBackend.get('client'), settingsFileContents);
        }

        window.previousSettingsFileContents = settingsFileContents;
      }

      const currentFilePath = state.org.present.get('path');
      const headers = state.org.present.getIn(['files', currentFilePath, 'headers']);
      if (!!currentFilePath && headers) {
        const openHeaderPaths = getOpenHeaderPaths(headers);

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
  if (!localStorageAvailable) {
    return;
  } else {
    localStorage.setItem(field, value);
  }
};

export const getPersistedField = (field, nullable = false) => {
  if (!localStorageAvailable) {
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
