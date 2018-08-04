import { Dropbox } from 'dropbox';

import { Map, fromJS } from 'immutable';
import _ from 'lodash';

import { getOpenHeaderPaths } from '../lib/org_utils';

const isLocalStorageAvailable = () => {
  try {
    localStorage.setItem('test', 'test');
    return localStorage.getItem('test') === 'test';
  } catch(e) {
    return false;
  }
};

const pushFileToDropbox = (accessToken, path, contents) => {
  const dropbox = new Dropbox({ accessToken });
  dropbox.filesUpload({
    path, contents,
    mode: {
      '.tag': 'overwrite',
    },
    autorename: true,
  }).catch(error => {
    console.log(`There was an error trying to push settings to your Dropbox account: ${error}`);
  });
};

const fields = [
  {
    category: 'base',
    name: 'fontSize',
    type: 'nullable'
  },
  {
    category: 'base',
    name: 'bulletStyle',
    type: 'nullable'
  },
  {
    category: 'base',
    name: 'shouldTapTodoToAdvance',
    type: 'boolean'
  },
  {
    category: 'base',
    name: 'shouldStoreSettingsInDropbox',
    type: 'boolean'
  },
  {
    category: 'base',
    name: 'lastSeenWhatsNewHeader',
    type: 'nullable'
  },
  {
    category: 'base',
    name: 'customKeybindings',
    type: 'json',
  },
  {
    category: 'dropbox',
    name: 'accessToken',
    type: 'nullable'
  }
];

export const readOpennessState = () => {
  const opennessStateJSONString = localStorage.getItem('headerOpenness');
  return !!opennessStateJSONString ? JSON.parse(opennessStateJSONString) : null;
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
  };

  fields.forEach(field => {
    let value = localStorage.getItem(field.name);
    if (field.type === 'nullable') {
      if (value === 'null') {
        value = null;
      }
    } else if (field.type === 'boolean') {
      value = value === 'true';
    } else if (field.type === 'json') {
      if (!value) {
        value = new Map();
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

  const opennessState = readOpennessState();
  if (!!opennessState) {
    initialState.org.present = initialState.org.present.set('opennessState', fromJS(opennessState));
  }

  return initialState;
};

export const subscribeToChanges = store => {
  if (!isLocalStorageAvailable()) {
    return () => {};
  } else {
    return () => {
      const state = store.getState();

      const fieldsToPersist = fields.filter(field => field.category === 'org').map(field => field.name).map(field => (
        [field, state.org.present.get(field)]
      )).concat(fields.filter(field => field.category !== 'org').map(field => {
        if (field.type === 'json') {
          return [field.name, JSON.stringify(state[field.category].get(field.name) || {})];
        } else {
          return [field.name, state[field.category].get(field.name)];
        }
      }));

      fieldsToPersist.forEach(([name, value]) => (
        localStorage.setItem(name, value)
      ));

      if (state.base.get('shouldStoreSettingsInDropbox')) {
        const settingsFileContents = JSON.stringify(_.fromPairs(fieldsToPersist.filter(([name, _value]) => (
          name !== 'accessToken'
        ))));

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
