import React, { Fragment } from 'react';
import { mount } from 'enzyme';
import renderer from 'react-test-renderer';
import thunk from 'redux-thunk';

import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import OrgFile from './';

import { parseOrg } from '../../lib/parse_org';
import { readInitialState } from '../../util/settings_persister';
import rootReducer from '../../reducers/';

import { displayFile } from '../../actions/org';

import { Map, fromJS } from 'immutable';

import toJSON from 'enzyme-to-json';

jest.mock('react-hotkeys', () => {
  const React = require('react');
  const Fragment = React.Fragment;

  return {
    HotKeys: ({ children }) => <Fragment>{children}</Fragment>,
  };
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

let store, component;

beforeEach(() => {
  store = createStore(rootReducer, {
    org: {
      past: [],
      present: new Map(),
      future: [],
    },
    dropbox: new Map(),
    base: new fromJS({
      customKeybindings: {}
    }),
  }, applyMiddleware(thunk));
  store.dispatch(displayFile('/some/test/file', testOrgFile));

  component = mount(
    <MemoryRouter keyLength={0}>
      <Provider store={store}>
        <OrgFile path="/some/test/file" />
      </Provider>
    </MemoryRouter>
  );
});

test('<OrgFile /> renders an org file', () => {
  expect(toJSON(component)).toMatchSnapshot();
});

test('Can select a header in an org file', () => {
  component.find('.title-line').first().simulate('click');

  expect(toJSON(component)).toMatchSnapshot();
});

test('Can advance todo state for selected header in an org file', () => {
  component.find('.title-line').first().simulate('click');
  component.find('.fas.fa-check').simulate('click');

  expect(toJSON(component)).toMatchSnapshot();
});
