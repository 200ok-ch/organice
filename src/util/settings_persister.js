import { Dropbox } from 'dropbox';

import { Map, List, fromJS } from 'immutable';
import _ from 'lodash';

import { getOpenHeaderPaths } from '../lib/org_utils';
import { restoreBaseSettings } from '../actions/base';
import { restoreCaptureSettings } from '../actions/capture';

import { getNextId } from '../lib/parse_org';

const isLocalStorageAvailable = () => {
  try {
    localStorage.setItem('test', 'test');
    return localStorage.getItem('test') === 'test';
  } catch(e) {
    return false;
  }
};

const pushFileToDropbox = _.debounce((accessToken, path, contents) => {
  const dropbox = new Dropbox({ accessToken });
  dropbox.filesUpload({
    path, contents,
    mode: {
      '.tag': 'overwrite',
    },
    autorename: true,
  }).catch(error => {
    alert(`There was an error trying to push settings to your Dropbox account: ${error}`);
  });
}, 200, {maxWait: 5000});

const pullFileFromDropbox = (accessToken, path) => {
  const dropbox = new Dropbox({ accessToken });

  return new Promise((resolve, reject) => {
    dropbox.filesDownload({ path }).then(response => {
      const reader = new FileReader();
      reader.addEventListener('loadend', () => {
        resolve(reader.result);
      });
      reader.readAsText(response.fileBlob);
    }).catch(error => {
      reject(error);
    });
  });
};

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
    name: 'shouldStoreSettingsInDropbox',
    type: 'boolean',
    shouldStoreInConfig: true,
  },
  {
    category: 'base',
    name: 'lastSeenWhatsNewHeader',
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
    category: 'dropbox',
    name: 'accessToken',
    type: 'nullable',
    shouldStoreInConfig: false,
  },
  {
    category: 'capture',
    name: 'captureTemplates',
    type: 'json',
    shouldStoreInConfig: true,
    default: new List(),
  },
];

export const readOpennessState = () => {
  const opennessStateJSONString = localStorage.getItem('headerOpenness');
  return !!opennessStateJSONString ? JSON.parse(opennessStateJSONString) : null;
};

const getFieldsToPersist = (state, fields) => (
  fields.filter(field => field.category === 'org').map(field => field.name).map(field => (
    [field, state.org.present.get(field)]
  )).concat(persistableFields.filter(field => field.category !== 'org').map(field => {
    if (field.type === 'json') {
      return [field.name, JSON.stringify(state[field.category].get(field.name) || field.default || {})];
    } else {
      return [field.name, state[field.category].get(field.name)];
    }
  }))
);

const getConfigFileContents = fieldsToPersist => (
  JSON.stringify(_.fromPairs(fieldsToPersist.filter(([name, _value]) => (
    !['accessToken', 'lastSeenWhatsNewHeader'].includes(name)
  ))))
);

export const applyCategorySettingsFromConfig = (state, config, category) => {
  persistableFields.filter(field => (
    field.category === category
  )).filter(field => (
    field.shouldStoreInConfig
  )).filter(field => (
    // I accidentally included this field in some config files, so I need to forever
    // filter it out here. Whoops...
    field.name !== 'lastSeenWhatsNewHeader'
  )).forEach(field => {
    if (field.type === 'json') {
      state = state.set(field.name, fromJS(JSON.parse(config[field.name])));
    } else {
      state = state.set(field.name, config[field.name]);
    }
  });

  return state;
};

export const applyCaptureSettingsFromConfig = (state, config) => {
  const captureTemplates = fromJS(JSON.parse(config.captureTemplates)).map(template => (
    template.set('id', getNextId())
  ));

  return state.set('captureTempaltes', captureTemplates);
};

export const readInitialState = () => {
  if (!isLocalStorageAvailable()) {
    return undefined;
  }

  let initialState = {
    dropbox: Map(),
    org: {
      past: [],
      present: Map(),
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
        value = field.default || new Map();
      } else {
        value = fromJS(JSON.parse(value));
      }
    }

    if (field.category === 'org') {
      initialState[field.category].present = initialState[field.category].present.set(field.name, value);
    } else {
      initialState[field.category] = initialState[field.category].set(field.name, value);
    }
  });

  // Assign new ids to the capture templates.
  if (initialState.capture.get('captureTemplates')) {
    initialState.capture = initialState.capture.update('captureTemplates', templates => (
      templates.map(template => template.set('id', getNextId()))
    ));
  }

  const opennessState = readOpennessState();
  if (!!opennessState) {
    initialState.org.present = initialState.org.present.set('opennessState', fromJS(opennessState));
  }

  // Cache the config file contents locally so we don't overwrite on initial page load.
  window.previousSettingsFileContents = getConfigFileContents(getFieldsToPersist(initialState, persistableFields));

  return initialState;
};

export const loadSettingsFromConfigFile = store => {
  const accessToken = store.getState().dropbox.get('accessToken');
  if (!accessToken) {
    return;
  }

  pullFileFromDropbox(accessToken, '/.org-web-config.json').then(configFileContents => {
    try {
      const config = JSON.parse(configFileContents);
      store.dispatch(restoreBaseSettings(config));
      store.dispatch(restoreCaptureSettings(config));
    } catch(_error) {
      // Something went wrong parsing the config file, but we don't care, we'll just
      // overwrite it with a good local copy.
    }
  }).catch(() => {});
};

export const subscribeToChanges = store => {
  if (!isLocalStorageAvailable()) {
    return () => {};
  } else {
    return () => {
      const state = store.getState();

      const fieldsToPersist = getFieldsToPersist(state, persistableFields);

      fieldsToPersist.forEach(([name, value]) => (
        localStorage.setItem(name, value)
      ));

      if (state.base.get('shouldStoreSettingsInDropbox')) {
        const settingsFileContents = getConfigFileContents(fieldsToPersist);

        if (window.previousSettingsFileContents !== settingsFileContents) {
          pushFileToDropbox(state.dropbox.get('accessToken'),
                            '/.org-web-config.json',
                            settingsFileContents);
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
