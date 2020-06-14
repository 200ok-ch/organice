import { fromJS } from 'immutable';

import generateId from '../lib/id_generator';
import reducer from './org';
import rootReducer from './index';
import * as types from '../actions/org';
import { parseOrg } from '../lib/parse_org';
import { readInitialState } from '../util/settings_persister';

import { createStore, applyMiddleware } from 'redux';
import undoable, { ActionTypes } from 'redux-undo';
import thunk from 'redux-thunk';

import readFixture from '../../test_helpers/index';

describe('org reducer', () => {
  let state;

  const testOrgFile = readFixture('main_test_file');

  // Given a `header`, return its `title` and `nestingLevel`.
  function extractTitleAndNesting(header) {
    return [header.getIn(['titleLine', 'rawTitle']), header.get('nestingLevel')];
  }

  // Given some `headers`, return their `title`s and `nestingLevel`s.
  function extractTitlesAndNestings(headers) {
    return headers
      .map((header) => {
        return extractTitleAndNesting(header);
      })
      .toJS();
  }

  beforeEach(() => {
    state = readInitialState();
    state.org.present = parseOrg(testOrgFile);
  });

  describe('REFILE_SUBTREE', () => {
    let sourceHeaderId, targetHeaderId;

    beforeEach(() => {
      // The target is to refile "PROJECT Foo" into "A nested header".
      // They have both subheadlines, so it's not the trivial case.

      // "PROJECT Foo" is the 10th item, "A nested header" the 2nd,
      // but we count from 0 not 1.
      sourceHeaderId = state.org.present
        .get('headers')
        .get(9)
        .get('id');
      targetHeaderId = state.org.present
        .get('headers')
        .get(1)
        .get('id');
    });

    it('should handle REFILE_SUBTREE', () => {
      // Mapping the headers to their nesting level. This is how the
      // initially parsed file should look like.
      expect(extractTitlesAndNestings(state.org.present.get('headers'))).toEqual([
        ['Top level header', 1],
        ['A nested header', 2],
        ['A todo item with schedule and deadline', 2],
        ['Another top level header', 1],
        ['A repeating todo', 2],
        ['A header with tags                                              ', 1],
        ['A header with [[https://organice.200ok.ch][a link]]', 1],
        ['A header with various links as content', 1],
        ['A header with a URL, mail address and phone number as content', 1],
        ['PROJECT Foo', 2],
        ["A headline that's done since a loong time", 3],
        ["A headline that's done a day earlier even", 3],
        ['A header with a custom todo sequence in DONE state', 1],
      ]);

      const action = types.refileSubtree(sourceHeaderId, targetHeaderId);
      const newState = reducer(state.org.present, action);

      // PROJECT Foo is now beneath "A nested header" and is
      // appropriately indented.
      expect(extractTitlesAndNestings(newState.get('headers'))).toEqual([
        ['Top level header', 1],
        ['A nested header', 2],
        ['PROJECT Foo', 3],
        ["A headline that's done since a loong time", 4],
        ["A headline that's done a day earlier even", 4],
        ['A todo item with schedule and deadline', 2],
        ['Another top level header', 1],
        ['A repeating todo', 2],
        ['A header with tags                                              ', 1],
        ['A header with [[https://organice.200ok.ch][a link]]', 1],
        ['A header with various links as content', 1],
        ['A header with a URL, mail address and phone number as content', 1],
        ['A header with a custom todo sequence in DONE state', 1],
      ]);
    });

    it('is undoable', () => {
      const store = createStore(undoable(reducer), state.org.present);
      const oldState = store.getState().present;
      store.dispatch({ type: 'REFILE_SUBTREE', sourceHeaderId, targetHeaderId, dirtying: true });
      expect(store.getState().present).not.toEqual(oldState);
      store.dispatch({ type: ActionTypes.UNDO });
      expect(store.getState().present).toEqual(oldState);
    });
  });

  describe('INSERT_CAPTURE', () => {
    let store, template;

    beforeEach(() => {
      template = {
        description: '',
        headerPaths: [],
        iconName: 'todo',
        id: generateId(),
        isAvailableInAllOrgFiles: false,
        letter: '',
        orgFilesWhereAvailable: [],
        shouldPrepend: false,
        template: '* TODO %?',
        isSample: true,
      };
      state.capture = state.capture.update('captureTemplates', (templates) =>
        templates.push(fromJS(template))
      );

      // We have to create a full store rather than just the org bit,
      // because the insertCapture thunk needs to retrieve capture
      // templates from the capture part of the store.
      store = createStore(rootReducer, state, applyMiddleware(thunk));
    });

    const content = '* TODO My task\nSome description\n';

    function expectOrigFirstHeader(headers) {
      expect(extractTitleAndNesting(headers.first())).toEqual(['Top level header', 1]);
    }

    function expectOrigLastHeader(headers) {
      expect(extractTitleAndNesting(headers.last())).toEqual([
        'A header with a custom todo sequence in DONE state',
        1,
      ]);
    }

    function insertCapture(shouldPrepend) {
      // Check initially parsed file looks as expected
      let headers = store.getState().org.present.get('headers');
      expect(headers.size).toEqual(13);
      expectOrigFirstHeader(headers);
      expectOrigLastHeader(headers);
      const action = types.insertCapture(template.id, content, shouldPrepend);
      store.dispatch(action);
      const newHeaders = store.getState().org.present.get('headers');
      expect(newHeaders.size).toEqual(14);
      return newHeaders;
    }

    it('should insert at top of file', () => {
      const newHeaders = insertCapture(true);
      expectOrigLastHeader(newHeaders);
      const first = newHeaders.first();
      expect(first.getIn(['titleLine', 'rawTitle'])).toEqual('My task');
      expect(first.getIn(['titleLine', 'todoKeyword'])).toEqual('TODO');
      expect(first.get('rawDescription')).toEqual('Some description\n');
    });

    it('should insert at bottom of file', () => {
      const newHeaders = insertCapture(false);
      expectOrigFirstHeader(newHeaders);
      const last = newHeaders.last();
      expect(last.getIn(['titleLine', 'rawTitle'])).toEqual('My task');
      expect(last.getIn(['titleLine', 'todoKeyword'])).toEqual('TODO');
      expect(last.get('rawDescription')).toEqual('Some description\n');
    });

    // FIXME: This test works, but only when run with `.only`. There
    // must be some racing condition or some mutable state involved,
    // because it does not run together with the other tests.
    it.skip('is undoable', () => {
      const oldState = store.getState().org.present;
      store.dispatch({
        type: 'INSERT_CAPTURE',
        template: fromJS(template),
        content,
        shouldPrepend: true,
        dirtying: true,
      });
      expect(store.getState().org.present).not.toEqual(oldState);
      store.dispatch({ type: ActionTypes.UNDO });
      expect(store.getState().org.present).toEqual(oldState);
    });
  });
});
