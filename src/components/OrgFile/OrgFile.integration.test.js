import React from 'react';
import thunk from 'redux-thunk';

import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import OrgFile from './';

import rootReducer from '../../reducers/';

import { displayFile } from '../../actions/org';

import { Map, fromJS } from 'immutable';

import { render, fireEvent, cleanup } from '@testing-library/react';
afterEach(cleanup);

describe('Render all views', () => {
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
** TODO A scheduled todo item
   SCHEDULED: <2019-09-19 Thu>
* Another top level header
Some description content
* A header with tags                                              :tag1:tag2:
* A header with [[https://organice.200ok.ch][a link]]
`;

  let store;

  beforeEach(() => {
    let capture = new Map();
    capture = capture.set('captureTemplates', []);
    store = createStore(
      rootReducer,
      {
        org: {
          past: [],
          present: new Map(),
          future: [],
        },
        syncBackend: Map(),
        capture,
        base: new fromJS({
          customKeybindings: {},
          shouldTapTodoToAdvance: true,
        }),
      },
      applyMiddleware(thunk)
    );
    store.dispatch(displayFile('fixtureTestFile.org', testOrgFile));
  });

  describe('Actions within an Org file', () => {
    test('Can select a header in an org file', () => {
      const { getByText, queryByText } = render(
        <MemoryRouter keyLength={0}>
          <Provider store={store}>
            <OrgFile path="fixtureTestFile.org" />
          </Provider>
        </MemoryRouter>
      );

      expect(queryByText('Scheduled')).toBeFalsy();
      expect(queryByText('Deadline')).toBeFalsy();

      fireEvent.click(getByText('Top level header'));

      expect(queryByText('Scheduled')).toBeTruthy();
      expect(queryByText('Deadline')).toBeTruthy();
    });

    // Org Mode has keywords as workflow states and can cycle through
    // them: https://orgmode.org/manual/Workflow-states.html
    // In organice, we can cycle through them by swiping or by clicking
    // (if enabled). This test checks for the latter.
    test('Can advance todo state for selected header in an org file', () => {
      const { queryByText } = render(
        <MemoryRouter keyLength={0}>
          <Provider store={store}>
            <OrgFile path="fixtureTestFile.org" />
          </Provider>
        </MemoryRouter>
      );

      // In the very beginning, the TODO is hidden, because the file
      // starts folded down to the top level
      expect(queryByText('TODO')).toBeFalsy();

      // Cycle the top header (which will make the next headers
      // [including the TODO] visible
      fireEvent.click(queryByText('Top level header'));

      // In the beginning, the TODO is not DONE
      expect(queryByText('TODO')).toBeTruthy();
      expect(queryByText('DONE')).toBeFalsy();

      // Toggle the TODO
      fireEvent.click(queryByText('TODO'));

      // Then the TODO is DONE
      expect(queryByText('TODO')).toBeFalsy();
      expect(queryByText('DONE')).toBeTruthy();
    });
  });

  describe('Renders everything starting from an Org file', () => {
    let container, getAllByText, getByTitle, getByAltText, queryByText;
    beforeEach(() => {
      let res = render(
        <MemoryRouter keyLength={0}>
          <Provider store={store}>
            <OrgFile path="fixtureTestFile.org" />
          </Provider>
        </MemoryRouter>
      );

      container = res.container;
      getAllByText = res.getAllByText;
      getByAltText = res.getByAltText;
      getByTitle = res.getByTitle;
      queryByText = res.queryByText;
    });

    test('renders an Org file', () => {
      expect(getAllByText(/\*/)).toHaveLength(4);
      expect(container).toMatchSnapshot();
    });

    describe('Agenda', () => {
      test('renders Agenda for an Org file', () => {
        // Agenda is not visible by default
        expect(queryByText('Agenda')).toBeFalsy();
        expect(queryByText('Day')).toBeFalsy();
        expect(queryByText('Month')).toBeFalsy();
        expect(queryByText('A scheduled todo item')).toBeFalsy();

        fireEvent.click(getByTitle('Show agenda'));

        expect(queryByText('Agenda')).toBeTruthy();
        expect(queryByText('Day')).toBeTruthy();
        expect(queryByText('Month')).toBeTruthy();
        expect(queryByText('A scheduled todo item')).toBeTruthy();
      });

      test('Clicking a TODO within the agenda highlights it in the main view', () => {
        fireEvent.click(getByTitle('Show agenda'));
        fireEvent.click(queryByText('A scheduled todo item'));
        expect(queryByText('Agenda')).toBeFalsy();
        expect(queryByText('A scheduled todo item')).toBeTruthy();
        expect(queryByText('Scheduled')).toBeTruthy();
      });
    });
  });
});
