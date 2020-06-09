import { fromJS } from 'immutable';

import reducer from './org';
import * as types from '../actions/org';
import { parseOrg } from '../lib/parse_org';
import { readInitialState } from '../util/settings_persister';

import { createStore } from 'redux';
import undoable from 'redux-undo';

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
    state = fromJS(readInitialState());
    state = state.setIn(['org', 'present'], parseOrg(testOrgFile));
  });

  describe('undo/redo', () => {});

  describe('REFILE_SUBTREE', () => {
    let sourceHeaderId, targetHeaderId;

    beforeEach(() => {
      // The target is to refile "PROJECT Foo" into "A nested header".
      // They have both subheadlines, so it's not the trivial case.

      // "PROJECT Foo" is the 10th item, "A nested header" the 2nd,
      // but we count from 0 not 1.
      sourceHeaderId = state
        .getIn(['org', 'present', 'headers'])
        .get(9)
        .get('id');
      targetHeaderId = state
        .getIn(['org', 'present', 'headers'])
        .get(1)
        .get('id');
    });

    it('should handle REFILE_SUBTREE', () => {
      // Mapping the headers to their nesting level. This is how the
      // initially parsed file should look like.
      expect(extractTitlesAndNestings(state.getIn(['org', 'present', 'headers']))).toEqual([
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

      const newState = reducer(
        state.getIn(['org', 'present']),
        types.refileSubtree(sourceHeaderId, targetHeaderId)
      );

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
      const store = createStore(undoable(reducer), state.getIn(['org', 'present']));
      const oldState = store.getState().present;
      store.dispatch({ type: 'REFILE_SUBTREE', sourceHeaderId, targetHeaderId, dirtying: true });
      expect(store.getState().present).not.toEqual(oldState);
      store.dispatch({ type: '@@redux-undo/UNDO' });
      expect(store.getState().present).toEqual(oldState);
    });
  });
});
