import React, { Fragment } from 'react';
import { mount } from 'enzyme';
import renderer from 'react-test-renderer';
import thunk from 'redux-thunk';

import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import OrgFile from './';

import { parseOrg, _parsePlanningItems } from '../../lib/parse_org';
import exportOrg from '../../lib/export_org';
import { readInitialState } from '../../util/settings_persister';
import rootReducer from '../../reducers/';

import { displayFile } from '../../actions/org';

import { Map, fromJS } from 'immutable';

import toJSON from 'enzyme-to-json';

import fs from 'fs';
import path from 'path';

function readFixture(name) {
  return fs.readFileSync(path.join(__dirname, `./fixtures/${name}.org`)).toString();
}

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

    describe("Planning items", () => {
      describe("Formatting is the same as in Emacs", () => {
        describe("List formatting", () => {
          test("Parsing a basic list should not mangle the list", () => {
            const testDescription = "  - indented list\n     - Foo"
            const parsedFile = _parsePlanningItems(testDescription)
            expect(parsedFile.strippedDescription).toEqual(testDescription)
          })

          test("Parsing a list with planning items should not mangle the list", () => {
            const testDescription = "  - indented list\n     - Foo"
            const parsedFile = _parsePlanningItems(`SCHEDULED: <2019-07-30 Tue>\n${testDescription}`)
            expect(parsedFile.strippedDescription).toEqual(testDescription)
          })
        })

        describe("Planning items are formatted as is default Emacs", () => {
          test("For basic files", () => {
            const testOrgFile = readFixture('schedule');
            const exportedFile = parseAndExportOrgFile(testOrgFile);
            // The call to `trimRight` is a work-around, because org-web
            // doesn't export files with a trailing newline at this
            // moment. This is best-practice for any text-file and Emacs
            // does it for org-files, too. However, this is to be fixed
            // at another time. And when it is, this expectation will
            // fail and the call to `trimRight` can be safely removed.
            expect(exportedFile).toEqual(testOrgFile.trimRight())
          })

          test("For files with multiple planning items", () => {
            const testOrgFile = readFixture('schedule_and_deadline')
            const exportedFile = parseAndExportOrgFile(testOrgFile);
            expect(exportedFile).toEqual(testOrgFile.trimRight())
          })
        })

        test("Properties are formatted as is default in Emacs", () => {
          const testOrgFile = readFixture('properties')
          const exportedFile = parseAndExportOrgFile(testOrgFile);
          expect(exportedFile).toEqual(testOrgFile)
        })

        test("Tags are formatted as is default in Emacs", () => {
          const testOrgFile = readFixture('tags')
          const exportedFile = parseAndExportOrgFile(testOrgFile);
          expect(exportedFile).toEqual(testOrgFile)
        })
      })
    })

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
** DONE A finished todo item
* Another top level header
Some description content
* A header with tags                                              :tag1:tag2:
* A header with [[https://google.com][a link]]
`;

  let store, component;

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
        }),
      },
      applyMiddleware(thunk)
    );
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
    component
      .find('.title-line')
      .first()
      .simulate('click');

    expect(toJSON(component)).toMatchSnapshot();
  });

  test('Can advance todo state for selected header in an org file', () => {
    component
      .find('.title-line')
      .first()
      .simulate('click');
    component
      .find('.fas.fa-check')
      .first()
      .simulate('click');

    expect(toJSON(component)).toMatchSnapshot();
  });
});
