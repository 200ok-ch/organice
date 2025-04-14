import React from 'react';
import thunk from 'redux-thunk';

import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import OrgFile from './';
import HeaderBar from '../HeaderBar';
import readFixture from '../../../test_helpers/index';

import rootReducer from '../../reducers/';

import { setPath, parseFile } from '../../actions/org';
import { setShouldLogIntoDrawer, setShouldLogDone } from '../../actions/base';
import { timestampForDate } from '../../lib/timestamps.js';

import { Map, Set, fromJS, List } from 'immutable';
import { formatDistanceToNow } from 'date-fns';

import { render, fireEvent, cleanup } from '@testing-library/react';
// Debugging help:
// console.log(prettyDOM(container, 999999999999999999999999));
import '@testing-library/jest-dom/extend-expect';
import { STATIC_FILE_PREFIX } from '../../lib/org_utils';

afterEach(cleanup);

describe('Render all views', () => {
  const testOrgFile = readFixture('main_test_file');

  let store;

  beforeEach(() => {
    // Set global variable which can also be read from application code
    window.testRunner = true;

    let capture = Map();
    capture = capture.set('captureTemplates', []);
    store = createStore(
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
            bookmarks: Map({
              search: List(),
              'task-list': List(),
              refile: List(),
            }),
          }),
          future: [],
        },
        syncBackend: Map({
          isAuthenticated: true,
        }),
        capture,
        base: new fromJS({
          customKeybindings: {},
          shouldTapTodoToAdvance: true,
          isLoading: Set(),
          finderTab: 'Search',
          agendaTimeframe: 'Week',
          preferEditRawValues: false,
        }),
      },
      applyMiddleware(thunk)
    );
    store.dispatch(parseFile(STATIC_FILE_PREFIX + 'fixtureTestFile.org', testOrgFile));
    store.dispatch(setPath(STATIC_FILE_PREFIX + 'fixtureTestFile.org'));
  });

  describe('Org Functionality', () => {
    let container,
      getByText,
      getAllByText,
      getByTitle,
      getByTestId,
      queryByText,
      queryAllByText,
      getByPlaceholderText;
    beforeEach(() => {
      let res = render(
        <MemoryRouter keyLength={0} initialEntries={['/file/dir1/dir2/fixtureTestFile.org']}>
          <Provider store={store}>
            <HeaderBar />
            <OrgFile path={STATIC_FILE_PREFIX + 'fixtureTestFile.org'} />
          </Provider>
        </MemoryRouter>
      );

      container = res.container;
      getByText = res.getByText;
      getAllByText = res.getAllByText;
      getByTitle = res.getByTitle;
      getByTestId = res.getByTestId;
      queryByText = res.queryByText;
      queryAllByText = res.queryAllByText;
      getByPlaceholderText = res.getByPlaceholderText;
    });

    describe('Works with Org files without headlines', () => {
      test('Works with a completely empty files', () => {
        store.dispatch(
          parseFile(STATIC_FILE_PREFIX + 'fixtureTestFile.org', readFixture('empty_file'))
        );
        expect(queryByText('This file has no headlines')).toBeTruthy();
        expect(queryAllByText('Yes, your file has content.').length).toEqual(0);
        // Sanity check, ensure that not the regular test file is loaded.
        expect(queryByText('Top level header')).toBeFalsy();
      });
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
        // "edit title" view has buttons to choose TODO or DONE
        let drawerElem = getByTestId('drawer');
        expect(drawerElem).toHaveTextContent('DONE');
        // switch to "edit full title", which has no such buttons
        fireEvent.click(getByTitle('Edit title'));
        drawerElem = getByTestId('drawer');
        expect(drawerElem).not.toHaveTextContent('DONE');
        expect(getByTestId('titleLineInput').value).toEqual('');

        // switch back to "edit title"
        // TODO: Find out why resetting "editRawValues" is broken here
        // maybe the popup is not closed properly? how to simulate that?
        // clicking the top of the screen with
        // fireEvent.click(container.querySelector('.header-bar__title'));
        // crashes the tests
        fireEvent.click(getByTitle('Edit title'));

        // Click 'plus' on the second header which _is_ a todoKeyword header
        fireEvent.click(queryByText('A todo item with schedule and deadline'));
        fireEvent.click(container.querySelectorAll("[data-testid='header-action-plus']")[1]);
        expect(getByTestId('titleLineInput').value).toEqual('');
        // switch to "edit full title"
        fireEvent.click(getByTitle('Edit title'));
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

    describe('List item manipulation', () => {
      test('Can create a new list item of same type in the middle of an existing list', () => {
        const header = queryByText('A header with plain list items');
        fireEvent.click(header);
        fireEvent.click(queryByText('Plain list item 1'));
        fireEvent.click(container.querySelectorAll("[data-testid='list-item-action-plus']")[0]);

        const input = getByTestId('list-item-edit');
        fireEvent.change(input, { target: { value: 'Plain list item 2a' } });

        // Close the modal by clicking on the outside
        fireEvent.click(getByText('Top level header'));

        // New list item has the same UX
        fireEvent.click(queryByText('Plain list item 2a'));
        expect(container.querySelectorAll("[data-testid='list-item-action-plus']")[0]).toBeTruthy();

        // The new item is inserted in the middle of 'item 1' and 'item 2'
        expect(
          store
            .getState()
            .org.present.getIn(['files', STATIC_FILE_PREFIX + 'fixtureTestFile.org', 'headers'])
            .get(12)
            .get('rawDescription')
        ).toContain('- Plain list item 1\n- Plain list item 2a\n- Plain list item 2');
      });
    });

    describe('Tracking TODO state changes', () => {
      const date = new Date();
      describe('Default settings', () => {
        test('Does not track TODO state change for repeating todos', () => {
          expect(queryByText(':LOGBOOK:...')).toBeFalsy();
          expect(store.getState().base.toJS().shouldLogIntoDrawer).toBeFalsy();

          fireEvent.click(getByText('Another top level header'));
          fireEvent.click(getByText('A repeating todo'));

          fireEvent.click(queryByText('TODO'));
          fireEvent.click(getByText('A repeating todo'));

          expect(queryByText(':LOGBOOK:...')).toBeFalsy();
        });
      });
      test('Does not create log when TODO marked DONE', () => {
        expect(queryByText(':LOGBOOK:...')).toBeFalsy();
        expect(store.getState().base.toJS().shouldLogIntoDrawer).toBeFalsy();
        expect(store.getState().base.toJS().shouldLogDone).toBeFalsy();

        fireEvent.click(queryByText('Top level header'));
        expect(queryByText('TODO')).toBeTruthy();
        expect(queryByText('DONE')).toBeFalsy();
        fireEvent.click(queryByText('TODO'));

        expect(queryByText(':LOGBOOK:...')).toBeFalsy();
      });

      describe('Feature enabled', () => {
        test('Does track TODO state change for repeating todos', () => {
          expect(store.getState().base.toJS().shouldLogIntoDrawer).toBeFalsy();
          store.dispatch(setShouldLogIntoDrawer(true));
          expect(store.getState().base.toJS().shouldLogIntoDrawer).toBeTruthy();

          fireEvent.click(getByText('Another top level header'));
          fireEvent.click(getByText('A repeating todo'));
          expect(queryByText(':LOGBOOK:...')).toBeFalsy();

          expect(queryByText('<2020-04-05 Sun +1d>')).toBeTruthy();
          fireEvent.click(queryByText('TODO'));
          fireEvent.click(getByText('A repeating todo'));

          // After the TODO is toggled, it's still just TODO, because
          // the state got tracked
          expect(queryByText('DONE')).toBeFalsy();
          // TODO has been scheduled one day into the future
          expect(queryByText('<2020-04-05 Sun +1d>')).toBeFalsy();
          expect(queryByText('<2020-04-06 Mon +1d>')).toBeTruthy();

          expect(queryByText(':LOGBOOK:...')).toBeTruthy();
        });
      });

      test('Adds an entry to the logbook when a TODO marked is DONE and logIntoDrawer is selected', () => {
        expect(queryByText(':LOGBOOK:...')).toBeFalsy();
        expect(store.getState().base.toJS().shouldLogIntoDrawer).toBeFalsy();
        expect(store.getState().base.toJS().shouldLogDone).toBeFalsy();

        store.dispatch(setShouldLogIntoDrawer(true));
        store.dispatch(setShouldLogDone(true));

        expect(store.getState().base.toJS().shouldLogIntoDrawer).toBeTruthy();
        expect(store.getState().base.toJS().shouldLogDone).toBeTruthy();

        fireEvent.click(queryByText('Top level header'));
        expect(queryByText('TODO')).toBeTruthy();
        expect(queryByText('DONE')).toBeFalsy();
        fireEvent.click(queryByText('TODO'));
        expect(queryByText('DONE')).toBeTruthy();
        expect(queryByText(':LOGBOOK:...')).toBeTruthy();
      });

      test('Adds a note to the header when a TODO is marked DONE and logIntoDrawer not selected', () => {
        expect(queryByText(':LOGBOOK:...')).toBeFalsy();
        expect(store.getState().base.toJS().shouldLogIntoDrawer).toBeFalsy();
        expect(store.getState().base.toJS().shouldLogDone).toBeFalsy();

        store.dispatch(setShouldLogDone(true));
        expect(store.getState().base.toJS().shouldLogDone).toBeTruthy();

        fireEvent.click(queryByText('Top level header'));
        expect(queryByText('TODO')).toBeTruthy();
        expect(queryByText('DONE')).toBeFalsy();

        fireEvent.click(queryByText('TODO'));
        expect(queryByText('DONE')).toBeTruthy();
        expect(queryByText(':LOGBOOK:...')).toBeFalsy();

        expect(
          store
            .getState()
            .org.present.getIn(['files', STATIC_FILE_PREFIX + 'fixtureTestFile.org', 'headers'])
            .getIn([2, 'logNotes', 0, 'contents'])
        ).toEqual('CLOSED: ');

        const { day, month, startHour, startMinute, year } = store
          .getState()
          .org.present.getIn(['files', STATIC_FILE_PREFIX + 'fixtureTestFile.org', 'headers'])
          .getIn([2, 'logNotes', 1, 'firstTimestamp'])
          .toJS();
        const actualDate = timestampForDate(new Date(year, month - 1, day, startHour, startMinute));

        const expectedDate = timestampForDate(date);
        expect(actualDate).toEqual(expectedDate);
      });
    });

    describe('Renders everything starting from an Org file', () => {
      test('renders an Org file', () => {
        // INFO: This snapshot is semantically correct, but it does
        // not have color theme information. We're implementing the
        // color themes with an API that mutates the DOM in place (see
        // `color.js::loadTheme`. We cannot use this API in jest
        // tests, because calling the API does not yield the same
        // side-effect as in a browser. Hence, some colors in this
        // snapshot are off, but that's ok. We do colorScheme testing
        // by eye and not with automated tests.
        expect(getAllByText(/\*/)).toHaveLength(8);
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

      /* global global */
      describe('Sharing', () => {
        let windowSpy;
        beforeEach(() => {
          windowSpy = jest.spyOn(global, 'open');
          windowSpy.mockImplementation((x) => x);
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

          fireEvent.click(getByTitle('Show Search / Task List'));
          const drawerElem = getByTestId('drawer');
          expect(drawerElem).toHaveTextContent('A todo item with schedule and deadline');
        });

        test('searches in all headers', () => {
          fireEvent.click(getByTitle('Show Search / Task List'));
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

        test('searches in sub-headers when narrowed', () => {
          // Click 'narrow' on the first header
          fireEvent.click(queryByText('Top level header'));
          fireEvent.click(container.querySelectorAll("[data-testid='header-action-narrow']")[0]);

          fireEvent.click(getByTitle('Show Search / Task List'));
          const drawerElem = getByTestId('drawer');

          // Only sub-headers are visible
          expect(drawerElem).not.toHaveTextContent('A header with tags');
          expect(drawerElem).not.toHaveTextContent('Another top level header');
          expect(drawerElem).toHaveTextContent('A nested header');
          expect(drawerElem).toHaveTextContent('A todo item with schedule and deadline');
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

          fireEvent.click(getByTitle('Show Search / Task List'));
          fireEvent.click(getByText('Task List'));
          const drawerElem = getByTestId('drawer');
          expect(drawerElem).not.toHaveTextContent('Top level header');
          expect(drawerElem).toHaveTextContent('A todo item with schedule and deadline');
        });

        // Order by state first and then by date. Ergo TODO is before
        // DONE and yesterday is before today.
        test('orders tasks for an Org file', () => {
          fireEvent.click(getByTitle('Show Search / Task List'));
          const drawerElem = getByTestId('drawer');
          expect(drawerElem).toMatchSnapshot();
        });

        test('search in TaskList filters headers (by default only with todoKeywords)', () => {
          fireEvent.click(getByTitle('Show Search / Task List'));
          const drawerElem = getByTestId('drawer');
          const input = getByPlaceholderText(
            'e.g. -DONE doc|man :simple|easy :assignee:nobody|none'
          );
          fireEvent.change(input, { target: { value: 'a search with no results' } });

          expect(drawerElem).not.toHaveTextContent('A todo item with schedule and deadline');
          fireEvent.change(input, { target: { value: 'todo item' } });

          expect(drawerElem).toHaveTextContent('A todo item with schedule and deadline');
        });

        // More rigorous testing of the search parser is here:
        // headline_filter_parser.unit.test.js
        test('search in TaskList filters headers (on demand without todoKeywords)', () => {
          fireEvent.click(getByTitle('Show Search / Task List'));
          fireEvent.click(getByText('Task List'));
          const drawerElem = getByTestId('drawer');
          getByPlaceholderText('e.g. -DONE doc|man :simple|easy :assignee:nobody|none');

          // Is a regular header without TODO keyword
          expect(drawerElem).not.toHaveTextContent('Another top level header');
          // Is a header with TODO keyword
          expect(drawerElem).toHaveTextContent('A repeating todo');
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

        test('Agenda starts on Monday by default', () => {
          fireEvent.click(getByTitle('Show agenda'));
          expect(container.querySelectorAll('.agenda-day__title__day-name')[0]).toHaveTextContent(
            'Monday'
          );
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

        test('Agenda shows only actionable TODOs, not with a DONE state', () => {
          fireEvent.click(getByTitle('Show agenda'));

          const drawerElem = getByTestId('drawer');
          expect(drawerElem).not.toHaveTextContent("A headline that's done since a loong time");
          expect(drawerElem).not.toHaveTextContent("A headline that's done a day earlier even");

          expect(drawerElem).toHaveTextContent('A todo item with schedule and deadline');
          expect(drawerElem).toHaveTextContent('A repeating todo');
        });
      });

      describe('Link recognition', () => {
        test('recognizes canonical format +xxxxxxxxx phone numbers', () => {
          fireEvent.click(
            queryByText('A header with a URL, mail address and phone number as content')
          );
          const elem = getAllByText('+49123456789');
          // There's exactly one phone number
          expect(elem.length).toEqual(1);
          // And it renders as such
          expect(elem[0]).toHaveAttribute('href', 'tel:+49123456789');
          expect(elem[0]).toHaveTextContent('+49123456789');
        });

        test('recognizes phone numbers', () => {
          fireEvent.click(
            queryByText('A header with a URL, mail address and phone number as content')
          );

          const phone_numbers = [
            // US
            '123-456-7890',
            '(123) 456-7890',
            '123 456 7890',
            '123.456.7890',
            '+91 (123) 456-7890',
            // Swiss
            '0783268674',
            '078 326 86 74',
            '041783268675',
            '0041783268674',
            '+41783268676',
            '+41783268677',
          ];

          for (let i in phone_numbers) {
            const phone_number = phone_numbers[i];
            const elem = getAllByText(phone_number);
            expect(elem.length).toEqual(1);
            expect(elem[0]).toHaveAttribute('href', `tel:${phone_number}`);
            expect(elem[0]).toHaveTextContent(phone_number);
          }
        });

        test('does not recognize random numbers as phone numbers', () => {
          fireEvent.click(
            queryByText('A header with a URL, mail address and phone number as content')
          );

          const numbers = ['05 05 05'];

          for (let i in numbers) {
            const number = numbers[i];
            const elem = getAllByText(number);
            expect(elem.length).toEqual(1);
            expect(elem[0]).not.toHaveAttribute('href', `tel:${number}`);
            expect(elem[0]).toHaveTextContent(number);
          }
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

        describe('recognizes file: links', () => {
          beforeEach(() => {
            fireEvent.click(queryByText('A header with various links as content'));
          });

          test('relative link to .org file', () => {
            const elem = getAllByText('an existing .org file in the same directory');
            // There's exactly one such URL
            expect(elem.length).toEqual(1);
            // And it renders as such
            expect(elem[0]).toHaveAttribute(
              'data-target',
              '/dir1/dir2/schedule_and_timestamps.org'
            );
            expect(elem[0]).toHaveTextContent('an existing .org file in the same directory');
          });

          test('relative link to subdir', () => {
            const elem = getAllByText('subdir');
            expect(elem.length).toEqual(1);
            expect(elem[0]).toHaveAttribute('href', '/files/dir1/dir2/subdir');
            expect(elem[0]).toHaveTextContent('subdir');
          });

          test('relative link to subdir/', () => {
            const elem = getAllByText('subdir/');
            expect(elem.length).toEqual(1);
            expect(elem[0]).toHaveAttribute('href', '/files/dir1/dir2/subdir/');
            expect(elem[0]).toHaveTextContent('subdir/');
          });

          test('relative link to fictitious .org file in subdir', () => {
            const elem = getAllByText('a fictitious .org file in a sub-directory');
            expect(elem.length).toEqual(1);
            expect(elem[0]).toHaveAttribute('data-target', '/dir1/dir2/subdir/foo.org');
            expect(elem[0]).toHaveTextContent('a fictitious .org file in a sub-directory');
          });

          test('relative link to fictitious .org file in a parent directory', () => {
            const elem = getAllByText('a fictitious .org file in a parent directory');
            expect(elem.length).toEqual(1);
            expect(elem[0]).toHaveAttribute('data-target', '/dir1/foo.org_archive');
            expect(elem[0]).toHaveTextContent('a fictitious .org file in a parent directory');
          });

          test('relative link to ../subdir', () => {
            const elem = getAllByText('../subdir');
            expect(elem.length).toEqual(1);
            expect(elem[0]).toHaveAttribute('href', '/files/dir1/subdir');
            expect(elem[0]).toHaveTextContent('../subdir');
          });

          test('relative link to ../subdir/', () => {
            const elem = getAllByText('../subdir/');
            expect(elem.length).toEqual(1);
            expect(elem[0]).toHaveAttribute('href', '/files/dir1/subdir/');
            expect(elem[0]).toHaveTextContent('../subdir/');
          });

          test('relative link to fictitious .org file in a grand-parent directory', () => {
            const elem = getAllByText('a fictitious .org file in a grand-parent directory');
            expect(elem.length).toEqual(1);
            expect(elem[0]).toHaveAttribute('data-target', '/foo.org');
            expect(elem[0]).toHaveTextContent('a fictitious .org file in a grand-parent directory');
          });

          test('relative link to fictitious .org file in a too-high ancestor directory', () => {
            const elem = getAllByText('a fictitious .org file in a too-high ancestor directory');
            expect(elem.length).toEqual(1);
            expect(elem[0]).toHaveAttribute(
              'data-target',
              '../../../../too-high-to-access-file.org'
            );
            expect(elem[0]).toHaveTextContent(
              'a fictitious .org file in a too-high ancestor directory'
            );
          });

          test('relative link to too-high ancestor directory', () => {
            const elem = getAllByText('a too-high ancestor directory');
            expect(elem.length).toEqual(1);
            // INFO: This file cannot be opened, because it is not
            // visible from within the share given to organice.
            expect(elem[0]).toHaveAttribute(
              'data-target',
              '../../../../too-high-to-access-directory'
            );
            expect(elem[0]).toHaveTextContent('a too-high ancestor directory');
          });

          test('absolute link to fictitious .org file in home directory', () => {
            const elem = getAllByText('a fictitious .org file in home directory');
            expect(elem.length).toEqual(1);
            expect(elem[0]).toHaveAttribute('data-target', '~/foo/bar/baz.org');
            // INFO: This file cannot really be opened, because
            // organice doesn't know the directory structure of the
            // user. I.e. the file link might be
            // `file:~/Dropbox/org/things.org`. Then, organice would
            // have to remove the `Dropbox` folder and try and see if
            // it can find the file underneath.
            expect(elem[0]).toHaveTextContent('a fictitious .org file in home directory');
          });

          test('absolute link to fictitious .org file', () => {
            const elem = getAllByText('a fictitious .org file');
            expect(elem.length).toEqual(1);
            expect(elem[0]).toHaveAttribute('data-target', '/foo/bar/baz.org');
            expect(elem[0]).toHaveTextContent('a fictitious .org file');
          });
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
