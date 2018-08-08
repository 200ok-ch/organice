import React, { Fragment } from 'react';
import { mount, shallow } from 'enzyme';
import renderer from 'react-test-renderer';

import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import OrgFile from './';

import { parseOrg } from '../../lib/parse_org';
import { readInitialState } from '../../util/settings_persister';
import rootReducer from '../../reducers/';

import { displayFile } from '../../actions/org';

import { Map, fromJS } from 'immutable';

jest.mock('react-hotkeys', () => {
  const React = require('react');
  const Fragment = React.Fragment;

  return {
    HotKeys: ({ children }) => <Fragment>{children}</Fragment>,
  };
});

const store = createStore(rootReducer, {
  org: {
    past: [],
    present: new Map(),
    future: [],
  },
  dropbox: new Map(),
  base: new fromJS({
    customKeybindings: {}
  }),
});

const testOrgFile = `
* Top level header
** A nested header
** TODO A todo item
** DONE A finished todo item
* Another top level header
Some description content
* A header with tags                                              :tag1:tag2:
* A header with [[https://google.com][a link]]
`;

test('<OrgFile /> renders an org file', () => {
  store.dispatch(displayFile('/some/test/file', testOrgFile));

  const component = renderer.create(
    <MemoryRouter>
      <Provider store={store}>
        <OrgFile path="/some/test/file" />
      </Provider>
    </MemoryRouter>
  );

  expect(component.toJSON()).toMatchSnapshot();
});
