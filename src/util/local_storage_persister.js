import { Map, fromJS } from 'immutable';

import { getOpenHeaderPaths } from '../lib/org_utils';

const isLocalStorageAvailable = () => {
  try {
    localStorage.setItem('test', 'test');
    return localStorage.getItem('test') === 'test';
  } catch(e) {
    return false;
  }
};

const fields = [
  // {
  //   category: 'org',
  //   name: 'filePath',
  //   type: 'nullable'
  // },
  // {
  //   category: 'org',
  //   name: 'fontSize',
  //   type: 'nullable'
  // },
  // {
  //   category: 'org',
  //   name: 'bulletStyle',
  //   type: 'nullable'
  // },
  // {
  //   category: 'org',
  //   name: 'headerSpacing',
  //   type: 'nullable'
  // },
  // {
  //   category: 'org',
  //   name: 'tapTodoToAdvance',
  //   type: 'boolean'
  // },
  // {
  //   category: 'org',
  //   name: 'preserveHeaderOpenness',
  //   type: 'boolean'
  // },
  // {
  //   category: 'org',
  //   name: 'latestVersion',
  //   type: 'nullable'
  // },
  // {
  //   category: 'dropbox',
  //   name: 'liveSync',
  //   type: 'boolean'
  // },
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
  };

  fields.forEach(field => {
    let value = localStorage.getItem(field.name);
    if (field.type === 'nullable') {
      if (value === 'null') {
        value = null;
      }
    } else if (field.type === 'boolean') {
      value = value === 'true';
    }

    initialState[field.category] = initialState[field.category].set(field.name, value);
  });

  const opennessState = readOpennessState();
  if (!!opennessState) {
    if (!initialState.org) {
      initialState.org = {
        past: [],
        present: Map(),
        future: [],
      };
    }
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

      fields.filter(field => field.category === 'dropbox').map(field => field.name).forEach(field => {
        localStorage.setItem(field, state.dropbox.get(field));
      });
      fields.filter(field => field.category === 'org').map(field => field.name).forEach(field => {
        localStorage.setItem(field, state.org.present.get(field));
      });

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
