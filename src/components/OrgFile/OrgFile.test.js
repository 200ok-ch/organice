import React from 'react';
import thunk from 'redux-thunk';

import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import OrgFile from './';

import { parseOrg, _parsePlanningItems } from '../../lib/parse_org';
import exportOrg from '../../lib/export_org';
import rootReducer from '../../reducers/';

import { displayFile } from '../../actions/org';

import { Map, fromJS } from 'immutable';

import readFixture from '../../../test_helpers/index';
import { render, fireEvent, cleanup } from '@testing-library/react';
/**
 * This is a convenience wrapper around paring an org file using
 * `parseOrg` and then export it using `exportOrg`.
 * @param {String} testOrgFile - contents of an org file
 */
function parseAndExportOrgFile(testOrgFile) {
  const parsedFile = parseOrg(testOrgFile);
  const headers = parsedFile.get('headers');
  const todoKeywordSets = parsedFile.get('todoKeywordSets');
  const exportedFile = exportOrg(headers, todoKeywordSets);
  return exportedFile;
}

afterEach(cleanup);

describe('Unit Tests for org file', () => {
  describe('Parsing', () => {
    test("Parsing and exporting shouldn't alter the original file", () => {
      const testOrgFile = readFixture('indented_list');
      const exportedFile = parseAndExportOrgFile(testOrgFile);

      // Should have the same amount of lines. Safeguard for the next
      // expectation.
      const exportedFileLines = exportedFile.split('\n');
      const testOrgFileLines = testOrgFile.split('\n');
      expect(exportedFileLines.length).toEqual(testOrgFileLines.length);

      exportedFileLines.forEach((line, index) => {
        expect(line).toEqual(testOrgFileLines[index]);
      });
    });

    // TODO: Write such a file
    test.skip('Parses and exports a file which contains all features of organice', () => {});

    describe('Boldness', () => {
      test('Parsing lines with bold text', () => {
        const testOrgFile = readFixture('bold_text');
        const exportedFile = parseAndExportOrgFile(testOrgFile);
        expect(exportedFile).toEqual(testOrgFile);
      });
    });

    describe('Newlines', () => {
      test('Newlines in between headers and items are preserved', () => {
        const testOrgFile = readFixture('newlines');
        const exportedFile = parseAndExportOrgFile(testOrgFile);
        expect(exportedFile).toEqual(testOrgFile);
      });
    });

    describe('Planning items', () => {
      describe('Formatting is the same as in Emacs', () => {
        describe('List formatting', () => {
          test('Parsing a basic list should not mangle the list', () => {
            const testDescription = '  - indented list\n     - Foo';
            const parsedFile = _parsePlanningItems(testDescription);
            expect(parsedFile.strippedDescription).toEqual(testDescription);
          });

          test('Parsing a list with planning items should not mangle the list', () => {
            const testDescription = '  - indented list\n     - Foo';
            const parsedFile = _parsePlanningItems(
              `SCHEDULED: <2019-07-30 Tue>\n${testDescription}`
            );
            expect(parsedFile.strippedDescription).toEqual(testDescription);
          });
        });

        describe('Planning items are formatted as is default Emacs', () => {
          test('For basic files', () => {
            const testOrgFile = readFixture('schedule');
            const exportedFile = parseAndExportOrgFile(testOrgFile);
            // The call to `trimRight` is a work-around, because organice
            // doesn't export files with a trailing newline at this
            // moment. This is best-practice for any text-file and Emacs
            // does it for org-files, too. However, this is to be fixed
            // at another time. And when it is, this expectation will
            // fail and the call to `trimRight` can be safely removed.
            expect(exportedFile).toEqual(testOrgFile.trimRight());
          });

          test('For files with multiple planning items', () => {
            const testOrgFile = readFixture('schedule_and_deadline');
            const exportedFile = parseAndExportOrgFile(testOrgFile);
            expect(exportedFile).toEqual(testOrgFile.trimRight());
          });
        });

        test('Properties are formatted as is default in Emacs', () => {
          const testOrgFile = readFixture('properties');
          const exportedFile = parseAndExportOrgFile(testOrgFile);
          expect(exportedFile).toEqual(testOrgFile);
        });

        test('Tags are formatted as is default in Emacs', () => {
          const testOrgFile = readFixture('tags');
          const exportedFile = parseAndExportOrgFile(testOrgFile);
          expect(exportedFile).toEqual(testOrgFile);
        });
      });
    });
  });
});

describe('Rendering an org file', () => {
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

  test('<OrgFile /> renders an org file', () => {
    const { container, getAllByText } = render(
      <MemoryRouter keyLength={0}>
        <Provider store={store}>
          <OrgFile path="fixtureTestFile.org" />
        </Provider>
      </MemoryRouter>
    );

    expect(getAllByText(/\*/)).toHaveLength(4);
    expect(container).toMatchSnapshot();
  });

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
