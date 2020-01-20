import React from 'react';
import thunk from 'redux-thunk';
import _ from 'lodash';

import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import OrgFile from './';
import HeaderBar from '../HeaderBar';
import readFixture from '../../../test_helpers/index';

import rootReducer from '../../reducers/';

import { displayFile } from '../../actions/org';

import { Map, fromJS } from 'immutable';
import { formatDistanceToNow } from 'date-fns';

import { render, fireEvent, cleanup, wait } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

afterEach(cleanup);

describe('Render all views', () => {
  jest.mock('react-hotkeys', () => {
    const React = require('react');
    const Fragment = React.Fragment;

    return {
      HotKeys: ({ children }) => <Fragment>{children}</Fragment>,
    };
  });

  const testOrgFile = readFixture('main_test_file');

  let store;

  beforeEach(() => {
    let capture = Map();
    capture = capture.set('captureTemplates', []);
    store = createStore(
      rootReducer,
      {
        org: {
          past: [],
          present: Map(),
          future: [],
        },
        syncBackend: Map({
          isAuthenticated: true,
        }),
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

  describe('Org Functionality', () => {
    let container,
      getByText,
      getAllByText,
      getByTitle,
      getAllByTitle,
      getByAltText,
      getByTestId,
      queryByText,
      queryAllByText,
      getByPlaceholderText;
    beforeEach(() => {
      let res = render(
        <MemoryRouter keyLength={0}>
          <Provider store={store}>
            <HeaderBar />
            <OrgFile path="fixtureTestFile.org" />
          </Provider>
        </MemoryRouter>
      );

      container = res.container;
      getByText = res.getByText;
      getAllByText = res.getAllByText;
      getByAltText = res.getByAltText;
      getByTitle = res.getByTitle;
      getAllByTitle = res.getAllByTitle;
      getByTestId = res.getByTestId;
      queryByText = res.queryByText;
      queryAllByText = res.queryAllByText;
      getByPlaceholderText = res.getByPlaceholderText;
    });

    describe('Actions within an Org file', () => {
      test('Can select a header in an org file', () => {
        expect(container.querySelector("[data-testid='org-clock-in']")).toBeFalsy();

        fireEvent.click(getByText('Top level header'));

        expect(container.querySelector("[data-testid='org-clock-in']")).toBeTruthy();
      });

      // Org Mode has keywords as workflow states and can cycle through
      // them: https://orgmode.org/manual/Workflow-states.html
      // In organice, we can cycle through them by swiping or by clicking
      // (if enabled). This test checks for the latter.
      test('Can advance todo state for selected header in an org file', () => {
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

      // Same behaviour has `S-C-RET` in Emacs Org mode.
      test('Can create a new header with an inherited todoKeyword', () => {
        fireEvent.click(queryByText('Top level header'));
        // Click 'plus' on the first header which is _not_ a todoKeyword header
        fireEvent.click(container.querySelectorAll("[data-testid='header-action-plus']")[0]);
        expect(getByTestId('titleLineInput').value).toEqual('');

        // Click 'plus' on the second header which _is_ a todoKeyword header
        fireEvent.click(queryByText('A todo item with schedule and deadline'));
        fireEvent.click(container.querySelectorAll("[data-testid='header-action-plus']")[1]);
        expect(getByTestId('titleLineInput').value).toEqual('TODO ');
      });

      test('Can clock in & out of an event', () => {
        expect(queryByText('Clock In')).toBeFalsy();
        expect(queryByText('Clock Out')).toBeFalsy();

        fireEvent.click(getByText('Top level header'));

        expect(container.querySelector("[data-testid='org-clock-in']")).toBeTruthy();
        expect(container.querySelector("[data-testid='org-clock-out']")).toBeFalsy();
        expect(queryByText(':LOGBOOK:...')).toBeFalsy();

        fireEvent.click(container.querySelector("[data-testid='org-clock-in']"));

        expect(container.querySelector("[data-testid='org-clock-in']")).toBeFalsy();
        expect(container.querySelector("[data-testid='org-clock-out']")).toBeTruthy();
        expect(queryByText(':LOGBOOK:...')).toBeTruthy();

        fireEvent.click(container.querySelector("[data-testid='org-clock-out']"));

        expect(container.querySelector("[data-testid='org-clock-in']")).toBeTruthy();
        expect(container.querySelector("[data-testid='org-clock-out']")).toBeFalsy();
        expect(queryByText(':LOGBOOK:...')).toBeTruthy();

        fireEvent.click(getByText(':LOGBOOK:...'));

        expect(queryByText('CLOCK:')).toBeTruthy();
        expect(queryByText('=> 0:00')).toBeTruthy();
      });
    });

    describe('Renders everything starting from an Org file', () => {
      test('renders an Org file', () => {
        expect(getAllByText(/\*/)).toHaveLength(6);
        expect(container).toMatchSnapshot();
      });

      describe('Custom todo sequences', () => {
        test('It recognizes custom todo sequences and their DONE state', () => {
          fireEvent.click(getByText('Top level header'));
          expect(queryByText('TODO').classList.contains('todo-keyword--done-state')).toBe(false);
          fireEvent.click(queryByText('TODO'));
          expect(queryByText('DONE').classList.contains('todo-keyword--done-state')).toBe(true);
          expect(queryByText('FINISHED').classList.contains('todo-keyword--done-state')).toBe(true);
        });
      });

      describe('Undo / Redo', () => {
        test('On loading an Org file, both are disabled', () => {
          expect(getByTitle('Undo').classList.contains('header-bar__actions__item--disabled')).toBe(
            true
          );
          expect(getByTitle('Redo').classList.contains('header-bar__actions__item--disabled')).toBe(
            true
          );
        });

        test('Undo becomes available on "edit header"', () => {
          fireEvent.click(queryByText('Top level header'));
          fireEvent.click(queryByText('TODO'));

          // Open the the title edit textarea
          fireEvent.click(container.querySelector("[data-testid='edit-header-title']"));

          // Close the title edit textarea
          fireEvent.click(queryByText('DONE'));

          // Undo should become available
          expect(getByTitle('Undo').classList.contains('header-bar__actions__item--disabled')).toBe(
            false
          );
        });
      });

      describe('Planning items', () => {
        test('deletes planning items', () => {
          fireEvent.click(queryByText('Top level header'));
          fireEvent.click(queryByText('A todo item with schedule and deadline'));
          fireEvent.click(queryByText('<2019-09-19 Thu>'));

          expect(queryByText('SCHEDULED:')).toBeTruthy();
          expect(queryByText('DEADLINE:')).toBeTruthy();

          // First: Delete "Scheduled" time

          // The <input type="date"> field exposes a 'x' button to
          // delete the time. There's no direct API to trigger it.
          // Hence, get the element, remove the time and fire the
          // 'change' event manually.
          let timePicker = getByTestId('timestamp-selector');
          timePicker.value = null;
          fireEvent.change(timePicker);

          expect(queryByText('SCHEDULED:')).toBeFalsy();
          expect(queryByText('DEADLINE:')).toBeTruthy();

          // Second: Delete "Deadline" time

          fireEvent.click(queryByText('<2018-10-05 Fri>'));
          timePicker = getByTestId('timestamp-selector');
          timePicker.value = null;
          fireEvent.change(timePicker);

          expect(queryByText('SCHEDULED:')).toBeFalsy();
          expect(queryByText('DEADLINE:')).toBeFalsy();
        });
      });

      describe('Sharing', () => {
        let windowSpy;
        beforeEach(() => {
          windowSpy = jest.spyOn(global, 'open');
          windowSpy.mockImplementation(x => x);
        });

        afterEach(() => {
          windowSpy.mockRestore();
        });

        test('sends the selected header and its body as an email', () => {
          fireEvent.click(queryByText('Another top level header'));
          fireEvent.click(getByTestId('share'));
          expect(global.open).toBeCalledWith(
            `mailto:?subject=${encodeURIComponent(
              'Another top level header'
            )}&body=${encodeURIComponent('\n\nSome description content\n')}`
          );
        });
      });

      describe('Search', () => {
        test('renders Search for an Org file', () => {
          expect(queryByText('Search')).toBeFalsy();
          expect(queryByText('A todo item with schedule and deadline')).toBeFalsy();

          fireEvent.click(getByTitle('Show search'));
          const drawerElem = getByTestId('drawer');
          expect(drawerElem).toHaveTextContent('Search');
          expect(drawerElem).toHaveTextContent('A todo item with schedule and deadline');
        });

        test('searches in all headers', () => {
          fireEvent.click(getByTitle('Show search'));
          const drawerElem = getByTestId('drawer');
          const input = getByPlaceholderText(
            'e.g. -DONE doc|man :simple|easy :assignee:nobody|none'
          );

          // All kinds of headers are visible
          expect(drawerElem).toHaveTextContent('A todo item with schedule and deadline');
          expect(drawerElem).toHaveTextContent('A header with tags');
          expect(drawerElem).toHaveTextContent('Another top level header');

          // Filter down to headers with tag :tag1:
          fireEvent.change(input, { target: { value: ':tag1' } });

          expect(drawerElem).toHaveTextContent('A header with tags');
          expect(drawerElem).not.toHaveTextContent('Another top level header');
        });
      });

      describe('Refile', () => {
        test('removes selected header and subheader from search', () => {
          fireEvent.click(queryByText('Top level header'));
          fireEvent.click(getByTestId('org-refile'));

          const drawerElem = getByTestId('drawer');
          expect(drawerElem).not.toHaveTextContent('Top level header');
          expect(drawerElem).toHaveTextContent('Another top level header');
        });
      });

      describe('TaskList', () => {
        test('renders TaskList for an Org file', () => {
          expect(queryByText('Task list')).toBeFalsy();
          expect(queryByText('A todo item with schedule and deadline')).toBeFalsy();

          fireEvent.click(getByTitle('Show task list'));
          const drawerElem = getByTestId('drawer');
          expect(drawerElem).toHaveTextContent('Task list');
          expect(drawerElem).toHaveTextContent('A todo item with schedule and deadline');
        });

        // Order by state first and then by date. Ergo TODO is before
        // DONE and yesterday is before today.
        test('orders tasks for an Org file', () => {
          fireEvent.click(getByTitle('Show task list'));
          const drawerElem = getByTestId('drawer');
          expect(drawerElem).toMatchSnapshot();
        });

        test('search in TaskList filters headers (by default only with todoKeywords)', () => {
          fireEvent.click(getByTitle('Show task list'));
          const drawerElem = getByTestId('drawer');
          const input = getByPlaceholderText(
            'e.g. -DONE doc|man :simple|easy :assignee:nobody|none'
          );
          fireEvent.change(input, { target: { value: 'a search with no results' } });

          expect(drawerElem).not.toHaveTextContent('A todo item with schedule and deadline');
          fireEvent.change(input, { target: { value: 'todo item' } });

          expect(drawerElem).toHaveTextContent('A todo item with schedule and deadline');
        });

        // More rigerous testing of the search parser is here:
        // headline_filter_parser.unit.test.js
        test('search in TaskList filters headers (on demand without todoKeywords)', () => {
          fireEvent.click(getByTitle('Show task list'));
          const drawerElem = getByTestId('drawer');
          const input = getByPlaceholderText(
            'e.g. -DONE doc|man :simple|easy :assignee:nobody|none'
          );

          expect(drawerElem).not.toHaveTextContent('Another top level header');
        });
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
          expect(queryAllByText('A todo item with schedule and deadline')).toBeTruthy();
        });

        test('Clicking a TODO within the agenda highlights it in the main view', () => {
          expect(queryByText('A todo item with schedule and deadline')).toBeFalsy();
          fireEvent.click(getByTitle('Show agenda'));
          expect(queryByText('Agenda')).toBeTruthy();
          fireEvent.click(queryAllByText('A todo item with schedule and deadline')[0]);
          expect(queryByText('Agenda')).toBeFalsy();
          expect(queryByText('A todo item with schedule and deadline')).toBeTruthy();
        });

        test('Clicking the Timestamp in a TODO within the agenda toggles from the date to the time', () => {
          fireEvent.click(getByTitle('Show agenda'));
          const timeSinceScheduled = formatDistanceToNow(new Date('2019-09-19'));
          expect(queryByText(timeSinceScheduled)).toBeFalsy();
          expect(queryByText('09/19')).toBeTruthy();
          fireEvent.click(queryByText('09/19'));
          expect(queryByText('09/19')).toBeFalsy();
          expect(queryByText(`${timeSinceScheduled} ago`)).toBeTruthy();
        });
      });

      describe('Link recognition', () => {
        test('recognizes phone numbers', () => {
          fireEvent.click(
            queryByText('A header with a URL, mail address and phone number as content')
          );
          const elem = getAllByText('+498025123456789');
          // There's exactly one phone number
          expect(elem.length).toEqual(1);
          // And it renders as such
          expect(elem[0]).toHaveAttribute('href', 'tel:+498025123456789');
          expect(elem[0]).toHaveTextContent('+498025123456789');
        });
        test('recognizes URLs', () => {
          fireEvent.click(
            queryByText('A header with a URL, mail address and phone number as content')
          );
          const elem = getAllByText('https://foo.bar.baz/xyz?a=b&d#foo');
          // There's exactly one such URL
          expect(elem.length).toEqual(1);
          // And it renders as such
          expect(elem[0]).toHaveAttribute('href', 'https://foo.bar.baz/xyz?a=b&d#foo');
          expect(elem[0]).toHaveTextContent('https://foo.bar.baz/xyz?a=b&d#foo');
        });
        test('recognizes email addresses', () => {
          fireEvent.click(
            queryByText('A header with a URL, mail address and phone number as content')
          );
          const elem = getAllByText('foo.bar@baz.org');
          // There's exactly one such email address
          expect(elem.length).toEqual(1);
          // And it renders as such
          expect(elem[0]).toHaveAttribute('href', 'mailto:foo.bar@baz.org');
          expect(elem[0]).toHaveTextContent('foo.bar@baz.org');
        });
      });
    });
  });
});
