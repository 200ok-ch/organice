import React from 'react';

import { createStore, Provider, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Map, fromJS, Set } from 'immutable';

import rootReducer from '../../reducers/';

import Landing from './';

afterEach(cleanup);

// FIXME: This broke, we don't know why, yet.
test.skip('<Landing /> renders', () => {
  let capture = Map();
  capture = capture.set('captureTemplates', []);
  const store = createStore(
    rootReducer,
    {
      org: {
        past: [],
        present: Map({
          files: Map(),
          fileSettings: [],
          search: Map({
            searchFilter: '',
            searchFilterExpr: [],
          }),
        }),
        future: [],
      },
      syncBackend: Map({
        isAuthenticated: false,
      }),
      capture,
      base: new fromJS({
        customKeybindings: {},
        shouldTapTodoToAdvance: true,
        isLoading: Set(),
        agendaTimeframe: 'Week',
      }),
    },
    applyMiddleware(thunk)
  );
  const { container } = render(
    <MemoryRouter keyLength={0} initialEntries={['/file/dir1/dir2/fixtureTestFile.org']}>
      <Provider store={store}>
        <Landing />
      </Provider>
    </MemoryRouter>
  );

  expect(container).toMatchSnapshot();
});
