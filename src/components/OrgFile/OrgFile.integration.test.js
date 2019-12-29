import React from 'react';
import thunk from 'redux-thunk';
import _ from 'lodash';

import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import OrgFile from './';
import HeaderBar from '../HeaderBar';

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

  const testOrgFile = `
#+TODO: TODO | DONE
#+TODO: START | FINISHED

* Top level header
** A nested header
** TODO A todo item with schedule and deadline
   DEADLINE: <2018-10-05 Fri> SCHEDULED: <2019-09-19 Thu>
* Another top level header
Some description content
* A header with tags                                              :tag1:tag2:
* A header with [[https://organice.200ok.ch][a link]]
* A header with a URL, mail address and phone number as content

  This is a URL https://foo.bar.baz/xyz?a=b&d#foo in a line of text.

  This is an e-mail foo.bar@baz.org in a line of text.

  +Don't+ call me on: +498025123456789.
* FINISHED A header with a custom todo sequence in DONE state
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
      getByAltText,
      getByTestId,
      queryByText,
      queryAllByText;
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
      getByTestId = res.getByTestId;
      queryByText = res.queryByText;
      queryAllByText = res.queryAllByText;
    });

    describe('Actions within an Org file', () => {
      test('Can select a header in an org file', () => {
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

        expect(queryByText('Clock In')).toBeTruthy();
        expect(queryByText('Clock Out')).toBeFalsy();
        expect(queryByText(':LOGBOOK:...')).toBeFalsy();

        fireEvent.click(getByText('Clock In'));

        expect(queryByText('Clock In')).toBeFalsy();
        expect(queryByText('Clock Out')).toBeTruthy();
        expect(queryByText(':LOGBOOK:...')).toBeTruthy();

        fireEvent.click(getByText('Clock Out'));

        expect(queryByText('Clock In')).toBeTruthy();
        expect(queryByText('Clock Out')).toBeFalsy();
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

        // FIXME: Why is this test not working?
        test.skip('Undo becomes available on interaction', () => {
          fireEvent.click(queryByText('Top level header'));
          fireEvent.click(queryByText('TODO'));
          // INFO: In the real app, the class is removed now
          expect(getByTitle('Undo').classList.contains('header-bar__actions__item--disabled')).toBe(
            false
          );
        });

        // FIXME: Why is this test not working?
        test.skip('Undo and redo do their respective task', () => {
          fireEvent.click(queryByText('Top level header'));
          expect(queryByText('TODO')).toBeTruthy();
          fireEvent.click(queryByText('TODO'));
          expect(queryByText('TODO')).toBeFalsy();

          // Likely this is what is not working
          fireEvent.click(getByTitle('Undo'));
          // INFO: This is where the test stops working
          expect(queryByText('TODO')).toBeTruthy();

          // fireEvent.click(getByTitle('Redo'));
          // expect(queryByText('TODO')).toBeFalsy();
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
          fireEvent.click(getByTitle('Show agenda'));
          fireEvent.click(queryAllByText('A todo item with schedule and deadline')[0]);
          expect(queryByText('Agenda')).toBeFalsy();
          expect(queryByText('A todo item with schedule and deadline')).toBeTruthy();
          expect(queryByText('Scheduled')).toBeTruthy();
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
