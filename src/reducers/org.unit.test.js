import { fromJS } from 'immutable';

import generateId from '../lib/id_generator';
import reducer from './org';
import rootReducer from './index';
import * as types from '../actions/org';
import { parseOrg } from '../lib/parse_org';
import { headerWithId } from '../lib/org_utils';
import { readInitialState } from '../util/settings_persister';

import { createStore, applyMiddleware } from 'redux';
import undoable, { ActionTypes } from 'redux-undo';
import thunk from 'redux-thunk';

import readFixture from '../../test_helpers/index';

describe('org reducer', () => {
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

  function check_is_undoable(state, action) {
    const store = createStore(undoable(reducer), state.org.present);

    // Perform an undoable action to warm up the redux-undo history.
    // Without this action, and without the
    // syncFilter: true flag in the undoable config,
    // the _lastUnfiltered field will be empty, and so will
    // be the 'past' after the INSERT_CAPTURE action.
    // The ADD_HEADER action is undoable so it gets saved
    // in _lastUnfiltered and then gets into the 'past' only to
    // be successfuly restored when we perform the UNDO.
    const firstHeader = state.org.present.get('headers').get(0).get('id');
    store.dispatch({ type: 'ADD_HEADER', headerId: firstHeader });

    const oldState = store.getState().present;
    store.dispatch(action);
    expect(store.getState().present).not.toEqual(oldState);
    store.dispatch({ type: ActionTypes.UNDO });
    expect(store.getState().present).toEqual(oldState);
  }

  describe('REFILE_SUBTREE', () => {
    let state;
    const testOrgFile = readFixture('main_test_file');
    let sourceHeaderId, targetHeaderId;

    beforeEach(() => {
      // The target is to refile "PROJECT Foo" into "A nested header".
      // They have both subheadlines, so it's not the trivial case.

      state = readInitialState();
      state.org.present = parseOrg(testOrgFile);

      // "PROJECT Foo" is the 10th item, "A nested header" the 2nd,
      // but we count from 0 not 1.
      sourceHeaderId = state.org.present.get('headers').get(9).get('id');
      targetHeaderId = state.org.present.get('headers').get(1).get('id');
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
      check_is_undoable(state, {
        type: 'REFILE_SUBTREE',
        sourceHeaderId,
        targetHeaderId,
        dirtying: true,
      });
    });
  });

  describe('INSERT_CAPTURE', () => {
    let store, template;
    let state;
    const testOrgFile = readFixture('nested_header');

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
      state = readInitialState();
      state.org.present = parseOrg(testOrgFile);
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
      expect(extractTitleAndNesting(headers.last())).toEqual(['A deep nested header', 3]);
    }

    function insertCapture(shouldPrepend) {
      // Check initially parsed file looks as expected
      let headers = store.getState().org.present.get('headers');
      expect(headers.size).toEqual(3);
      expectOrigFirstHeader(headers);
      expectOrigLastHeader(headers);
      const action = types.insertCapture(template.id, content, shouldPrepend);
      store.dispatch(action);
      const newHeaders = store.getState().org.present.get('headers');
      expect(newHeaders.size).toEqual(4);
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

    it('is undoable', () => {
      check_is_undoable(state, {
        type: 'INSERT_CAPTURE',
        template: fromJS(template),
        content,
        shouldPrepend: true,
        dirtying: true,
      });
    });
  });

  describe('MOVE_HEADER_LEFT', () => {
    let nestedHeaderId;
    let state;
    const testOrgFile = readFixture('nested_header');

    beforeEach(() => {
      state = readInitialState();
      state.org.present = parseOrg(testOrgFile);
      // The target is to move "A nested header" to the top level.

      // "A nested header" the 2nd item but we count from 0 not 1.
      nestedHeaderId = state.org.present.get('headers').get(1).get('id');
    });

    it('should handle MOVE_HEADER_LEFT', () => {
      // Mapping the headers to their nesting level. This is how the
      // initially parsed file should look like.
      expect(extractTitlesAndNestings(state.org.present.get('headers'))).toEqual([
        ['Top level header', 1],
        ['A nested header', 2],
        ['A deep nested header', 3],
      ]);

      const action = types.moveHeaderLeft(nestedHeaderId);
      const newState = reducer(state.org.present, action);

      // "A nested header" is not at the top level.
      expect(extractTitlesAndNestings(newState.get('headers'))).toEqual([
        ['Top level header', 1],
        ['A nested header', 1],
        ['A deep nested header', 3],
      ]);
    });

    it('is undoable', () => {
      check_is_undoable(state, types.moveHeaderLeft(nestedHeaderId));
    });
  });

  describe('MOVE_HEADER_RIGHT', () => {
    let nestedHeaderId;
    let state;
    const testOrgFile = readFixture('nested_header');

    beforeEach(() => {
      state = readInitialState();
      state.org.present = parseOrg(testOrgFile);
      // The target is to move "A nested header" to the next nesting level.

      // "A nested header" the 2nd item but we count from 0 not 1.
      nestedHeaderId = state.org.present.get('headers').get(1).get('id');
    });

    it('should handle MOVE_HEADER_RIGHT', () => {
      // Mapping the headers to their nesting level. This is how the
      // initially parsed file should look like.
      expect(extractTitlesAndNestings(state.org.present.get('headers'))).toEqual([
        ['Top level header', 1],
        ['A nested header', 2],
        ['A deep nested header', 3],
      ]);

      const action = types.moveHeaderRight(nestedHeaderId);
      const newState = reducer(state.org.present, action);

      // "A nested header" is not at the top level.
      expect(extractTitlesAndNestings(newState.get('headers'))).toEqual([
        ['Top level header', 1],
        ['A nested header', 3],
        ['A deep nested header', 3],
      ]);
    });

    it('is undoable', () => {
      check_is_undoable(state, types.moveHeaderRight(nestedHeaderId));
    });
  });

  describe('MOVE_SUBTREE_LEFT', () => {
    let nestedHeaderId;
    let state;
    const testOrgFile = readFixture('nested_header');

    beforeEach(() => {
      state = readInitialState();
      state.org.present = parseOrg(testOrgFile);
      // The target is to move "A nested header" to the top level.

      // "A nested header" the 2nd item but we count from 0 not 1.
      nestedHeaderId = state.org.present.get('headers').get(1).get('id');
    });

    it('should handle MOVE_SUBTREE_LEFT', () => {
      // Mapping the headers to their nesting level. This is how the
      // initially parsed file should look like.
      expect(extractTitlesAndNestings(state.org.present.get('headers'))).toEqual([
        ['Top level header', 1],
        ['A nested header', 2],
        ['A deep nested header', 3],
      ]);

      const action = types.moveSubtreeLeft(nestedHeaderId);
      const newState = reducer(state.org.present, action);

      // "A nested header" is not at the top level.
      expect(extractTitlesAndNestings(newState.get('headers'))).toEqual([
        ['Top level header', 1],
        ['A nested header', 1],
        ['A deep nested header', 2],
      ]);
    });

    it('is undoable', () => {
      check_is_undoable(state, types.moveSubtreeLeft(nestedHeaderId));
    });
  });

  describe('MOVE_SUBTREE_RIGHT', () => {
    let nestedHeaderId;
    let state;
    const testOrgFile = readFixture('nested_header');

    beforeEach(() => {
      state = readInitialState();
      state.org.present = parseOrg(testOrgFile);
      // The target is to move "A nested header" to the deeper nested level.

      // "A nested header" the 2nd item but we count from 0 not 1.
      nestedHeaderId = state.org.present.get('headers').get(1).get('id');
    });

    it('should handle MOVE_SUBTREE_RIGHT', () => {
      // Mapping the headers to their nesting level. This is how the
      // initially parsed file should look like.
      expect(extractTitlesAndNestings(state.org.present.get('headers'))).toEqual([
        ['Top level header', 1],
        ['A nested header', 2],
        ['A deep nested header', 3],
      ]);

      const action = types.moveSubtreeRight(nestedHeaderId);
      const newState = reducer(state.org.present, action);

      // "A nested header" is not at the top level.
      expect(extractTitlesAndNestings(newState.get('headers'))).toEqual([
        ['Top level header', 1],
        ['A nested header', 3],
        ['A deep nested header', 4],
      ]);
    });

    it('is undoable', () => {
      check_is_undoable(state, types.moveSubtreeRight(nestedHeaderId));
    });
  });

  describe('ADVANCE_TODO_STATE', () => {
    let regularHeaderId;
    let todoHeaderId;
    let doneHeaderId;
    let repeatingHeaderId;
    let state;
    const testOrgFile = readFixture('various_todos');

    beforeEach(() => {
      state = readInitialState();
      state.org.present = parseOrg(testOrgFile);
      // "This is done" is the 1st header,
      // "Header with repeater" is the 2nd,
      // "This is not a todo" is 3rd item, and
      // "Repeating task" is 4th item; we cound from 1.
      doneHeaderId = state.org.present.get('headers').get(0).get('id');
      todoHeaderId = state.org.present.get('headers').get(1).get('id');
      regularHeaderId = state.org.present.get('headers').get(2).get('id');
      repeatingHeaderId = state.org.present.get('headers').get(3).get('id');
    });

    function check_todo_keyword_kept(oldHeaders, newHeaders, headerId) {
      expect(headerWithId(oldHeaders, headerId).getIn(['titleLine', 'todoKeyword'])).toEqual(
        headerWithId(newHeaders, headerId).getIn(['titleLine', 'todoKeyword'])
      );
    }
    function check_todo_keyword_changed(oldHeaders, newHeaders, headerId) {
      expect(headerWithId(oldHeaders, headerId).getIn(['titleLine', 'todoKeyword'])).not.toEqual(
        headerWithId(newHeaders, headerId).getIn(['titleLine', 'todoKeyword'])
      );
    }
    function check_header_kept(oldHeaders, newHeaders, headerId) {
      expect(headerWithId(oldHeaders, headerId)).toEqual(headerWithId(newHeaders, headerId));
    }

    it('should advance TODO state', () => {
      const oldHeaders = state.org.present.get('headers');
      const newHeaders = reducer(state.org.present, types.advanceTodoState(todoHeaderId)).get(
        'headers'
      );
      check_header_kept(oldHeaders, newHeaders, regularHeaderId);
      check_todo_keyword_changed(oldHeaders, newHeaders, todoHeaderId);
      check_header_kept(oldHeaders, newHeaders, doneHeaderId);

      // The nesting levels remain intact.
      expect(extractTitlesAndNestings(oldHeaders)).toEqual(extractTitlesAndNestings(newHeaders));
    });

    it('should advance DONE state', () => {
      const oldHeaders = state.org.present.get('headers');
      const newHeaders = reducer(state.org.present, types.advanceTodoState(doneHeaderId)).get(
        'headers'
      );
      check_header_kept(oldHeaders, newHeaders, regularHeaderId);
      check_header_kept(oldHeaders, newHeaders, todoHeaderId);
      check_todo_keyword_changed(oldHeaders, newHeaders, doneHeaderId);

      // The nesting levels remain intact.
      expect(extractTitlesAndNestings(oldHeaders)).toEqual(extractTitlesAndNestings(newHeaders));
    });

    it('should advance non-TODO state', () => {
      const oldHeaders = state.org.present.get('headers');
      const newHeaders = reducer(state.org.present, types.advanceTodoState(regularHeaderId)).get(
        'headers'
      );
      check_todo_keyword_changed(oldHeaders, newHeaders, regularHeaderId);
      check_header_kept(oldHeaders, newHeaders, todoHeaderId);
      check_header_kept(oldHeaders, newHeaders, doneHeaderId);

      // The nesting levels remain intact.
      expect(extractTitlesAndNestings(oldHeaders)).toEqual(extractTitlesAndNestings(newHeaders));
    });

    it('should advance repeating task', () => {
      const oldHeaders = state.org.present.get('headers');
      const newHeaders = reducer(state.org.present, types.advanceTodoState(repeatingHeaderId)).get(
        'headers'
      );
      check_todo_keyword_kept(oldHeaders, newHeaders, repeatingHeaderId);
      expect(headerWithId(newHeaders, repeatingHeaderId).get('description').size).toBeGreaterThan(
        headerWithId(oldHeaders, repeatingHeaderId).get('description').size
      );

      expect(headerWithId(newHeaders, repeatingHeaderId).get('planningItems')).not.toEqual(
        headerWithId(oldHeaders, repeatingHeaderId).get('planningItems')
      );

      // The nesting levels remain intact.
      expect(extractTitlesAndNestings(oldHeaders)).toEqual(extractTitlesAndNestings(newHeaders));
    });

    it('should advance repeating task again', () => {
      const intermState = reducer(state.org.present, types.advanceTodoState(repeatingHeaderId));
      const intermHeaders = intermState.get('headers');
      const newHeaders = reducer(intermState, types.advanceTodoState(repeatingHeaderId)).get(
        'headers'
      );
      check_todo_keyword_kept(intermHeaders, newHeaders, repeatingHeaderId);
      expect(headerWithId(newHeaders, repeatingHeaderId).get('description').size).toEqual(
        headerWithId(intermHeaders, repeatingHeaderId).get('description').size
      );

      expect(headerWithId(newHeaders, repeatingHeaderId).get('planningItems')).not.toEqual(
        headerWithId(intermHeaders, repeatingHeaderId).get('planningItems')
      );

      // The nesting levels remain intact.
      expect(extractTitlesAndNestings(intermHeaders)).toEqual(extractTitlesAndNestings(newHeaders));
    });

    it('is undoable', () => {
      check_is_undoable(state, types.advanceTodoState(todoHeaderId, true));
      check_is_undoable(state, types.advanceTodoState(doneHeaderId, false));
    });
  });
});
