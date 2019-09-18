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
          expect(exportedFile).toEqual(testOrgFile.trimRight());
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
    const { container, getAllByText, getByText } = render(
      <MemoryRouter keyLength={0}>
        <Provider store={store}>
          <OrgFile path="/some/test/file" />
        </Provider>
      </MemoryRouter>
    );

    expect(container).toMatchSnapshot();

    // 1) It is possible to query on container like on real dom node
    const firstItem = container.querySelector('.title-line');
    expect(firstItem).toMatchInlineSnapshot(`
<div
  class="title-line"
  style="width: 0px;"
>
  
  <div>
    <span
      style="word-break: break-word;"
    >
      <span>
        Top level header
      </span>
      ...
    </span>
  </div>
</div>
`);
    // but considered bad practice, because it often tests implementation details.
    // Better to use one of the provided getBy... or queryBy... functions the render
    // function returns, e.g. getAllByText:
    const titles = getAllByText(/top level header/i);
    expect(titles.length).toBe(2);

    expect(titles[0]).toMatchInlineSnapshot(`
<span>
  Top level header
</span>
`);

    expect(titles[0].parentElement.parentElement).toMatchInlineSnapshot(`
<div>
  <span
    style="word-break: break-word;"
  >
    <span>
      Top level header
    </span>
    ...
  </span>
</div>
`);
    expect(titles[0].parentElement.parentElement.parentElement).toEqual(firstItem);

    expect(firstItem.parentElement).toMatchInlineSnapshot(`
<div
  class="header"
  style="padding-left: 20px; margin-left: 0px;"
>
  <div
    class="left-swipe-action-container"
    style="width: 0px; background-color: rgb(211, 211, 211);"
  >
    <i
      class="fas fa-check swipe-action-container__icon swipe-action-container__icon--left"
      style="display: none;"
    />
  </div>
  <div
    class="right-swipe-action-container"
    style="width: 0px; background-color: rgb(211, 211, 211);"
  >
    <i
      class="fas fa-times swipe-action-container__icon swipe-action-container__icon--right"
      style="display: none;"
    />
  </div>
  <div
    class="header__bullet"
    style="margin-left: -16px;"
  >
    *
  </div>
  <div
    class="title-line"
    style="width: 0px;"
  >
    
    <div>
      <span
        style="word-break: break-word;"
      >
        <span>
          Top level header
        </span>
        ...
      </span>
    </div>
  </div>
  <div />
</div>
`);

    // Because it is the real dom we can fire real events
    fireEvent.click(titles[0]);

    // that change the real dom:
    expect(firstItem.parentElement).toMatchInlineSnapshot(`
<div
  class="header header--selected"
  style="padding-left: 20px; margin-left: 0px;"
>
  <div
    class="left-swipe-action-container"
    style="width: 0px; background-color: rgb(211, 211, 211);"
  >
    <i
      class="fas fa-check swipe-action-container__icon swipe-action-container__icon--left"
      style="display: none;"
    />
  </div>
  <div
    class="right-swipe-action-container"
    style="width: 0px; background-color: rgb(211, 211, 211);"
  >
    <i
      class="fas fa-times swipe-action-container__icon swipe-action-container__icon--right"
      style="display: none;"
    />
  </div>
  <div
    class="header__bullet"
    style="margin-left: -16px;"
  >
    *
  </div>
  <div
    class="title-line"
    style="width: 0px;"
  >
    
    <div>
      <span
        style="word-break: break-word;"
      >
        <span>
          Top level header
        </span>
        
      </span>
    </div>
  </div>
  <div
    class="ReactCollapse--collapse"
    style="overflow: hidden; height: 0px; margin-right: 0px;"
  >
    <div
      class="ReactCollapse--content"
    >
      <div
        class="header-action-drawer-container"
      >
        <div
          class="header-action-drawer__row"
        >
          <div
            class="header-action-drawer__ff-click-catcher-container"
          >
            <div
              class="header-action-drawer__ff-click-catcher"
            />
            <i
              class="fas fa-pencil-alt fa-lg"
            />
          </div>
          <span
            class="header-action-drawer__separator"
          />
          <div
            class="header-action-drawer__ff-click-catcher-container"
          >
            <div
              class="header-action-drawer__ff-click-catcher"
            />
            <i
              class="fas fa-edit fa-lg"
            />
          </div>
          <span
            class="header-action-drawer__separator"
          />
          <div
            class="header-action-drawer__ff-click-catcher-container"
          >
            <div
              class="header-action-drawer__ff-click-catcher"
            />
            <i
              class="fas fa-tags fa-lg"
            />
          </div>
          <span
            class="header-action-drawer__separator"
          />
          <div
            class="header-action-drawer__ff-click-catcher-container"
          >
            <div
              class="header-action-drawer__ff-click-catcher"
            />
            <i
              class="fas fa-compress fa-lg"
            />
          </div>
          <span
            class="header-action-drawer__separator"
          />
          <div
            class="header-action-drawer__ff-click-catcher-container"
          >
            <div
              class="header-action-drawer__ff-click-catcher"
            />
            <i
              class="fas fa-plus fa-lg"
            />
          </div>
        </div>
        <div
          class="header-action-drawer__row"
        >
          <div
            class="header-action-drawer__deadline-scheduled-button"
          >
            Deadline
          </div>
          <span
            class="header-action-drawer__separator"
          />
          <div
            class="header-action-drawer__deadline-scheduled-button"
          >
            Scheduled
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    class="header-content-container nice-scroll"
    style="width: 0px;"
  >
    <span />
  </div>
</div>
`);
  });

  test.skip('Can select a header in an org file', () => {
    component
      .find('.title-line')
      .first()
      .simulate('click');

    expect(toJSON(component)).toMatchSnapshot();
  });

  test.skip('Can advance todo state for selected header in an org file', () => {
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
