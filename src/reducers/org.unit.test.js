/* global process */
/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "check_is_undoable", "check_just_dirtying", "check_is_undoable_on_table"] }] */

import { Map, fromJS } from 'immutable';

import generateId from '../lib/id_generator';
import reducer from './org';
import rootReducer from './index';
import * as types from '../actions/org';
import { parseOrg } from '../lib/parse_org';
import { headerWithId, headerWithPath, indexOfHeaderWithId } from '../lib/org_utils';
import { dateForTimestamp, timestampForDate } from '../lib/timestamps';
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

  function selectHeader(state, id) {
    return reducer(state, { type: 'SELECT_HEADER', headerId: id });
  }

  function check_is_undoable(state, action) {
    const store = createStore(undoable(reducer), state.org.present);
    const path = state.org.present.get('path');

    // Perform an undoable action to warm up the redux-undo history.
    // Without this action, and without the
    // syncFilter: true flag in the undoable config,
    // the _lastUnfiltered field will be empty, and so will
    // be the 'past' after the `action`.
    // The ADD_HEADER action is undoable so it gets saved
    // in _lastUnfiltered and then gets into the 'past' only to
    // be successfuly restored when we perform the UNDO.
    const firstHeader = state.org.present.getIn(['files', path, 'headers']).get(0).get('id');
    store.dispatch({ type: 'ADD_HEADER', headerId: firstHeader });

    const oldState = store.getState().present;
    store.dispatch(action);
    expect(store.getState().present).not.toEqual(oldState);
    store.dispatch({ type: ActionTypes.UNDO });
    expect(store.getState().present).toEqual(oldState);
  }

  function check_is_undoable_on_table(store, path, cellId, action) {
    const firstHeader = store.getState().present.getIn(['files', path, 'headers']).get(0).get('id');
    store.dispatch({ type: 'ADD_HEADER', headerId: firstHeader });

    store.dispatch({ type: 'SET_SELECTED_TABLE_CELL_ID', cellId });
    const oldState = store.getState().present;
    store.dispatch(action);
    expect(store.getState().present).not.toEqual(oldState);
    store.dispatch({ type: ActionTypes.UNDO });
    expect(store.getState().present).toEqual(oldState);
  }

  function check_just_dirtying(oldState, action) {
    const justDirty = reducer(oldState, types.dirtyAction(true));
    const newState = reducer(oldState, action);
    expect(newState).toEqual(justDirty);
  }

  function check_kept_factory(oldState, newState) {
    return (query) => {
      expect(query(oldState)).toEqual(query(newState));
    };
  }

  function setUpStateForFile(path, contents) {
    const state = readInitialState();
    state.org.present = state.org.present
      .setIn(['files', path], parseOrg(contents))
      .set('path', path);
    return state;
  }

  describe('REFILE_SUBTREE', () => {
    let state;
    const path = 'testfile';
    const testOrgFile = readFixture('main_test_file');
    let sourceHeaderId, targetHeaderId;

    beforeEach(() => {
      // The target is to refile "PROJECT Foo" into "A nested header".
      // They have both subheadlines, so it's not the trivial case.

      state = setUpStateForFile(path, testOrgFile);

      // "PROJECT Foo" is the 10th item, "A nested header" the 2nd,
      // but we count from 0 not 1.
      sourceHeaderId = state.org.present.getIn(['files', path, 'headers']).get(9).get('id');
      targetHeaderId = state.org.present.getIn(['files', path, 'headers']).get(1).get('id');
    });

    it('should handle REFILE_SUBTREE', () => {
      // Mapping the headers to their nesting level. This is how the
      // initially parsed file should look like.
      expect(extractTitlesAndNestings(state.org.present.getIn(['files', path, 'headers']))).toEqual(
        [
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
          ['A header with plain list items', 1],
          ['A header with a custom todo sequence in DONE state', 1],
        ]
      );

      const action = types.refileSubtree(path, sourceHeaderId, path, targetHeaderId);
      const newState = reducer(state.org.present, action);

      // PROJECT Foo is now beneath "A nested header" and is
      // appropriately indented.
      expect(extractTitlesAndNestings(newState.getIn(['files', path, 'headers']))).toEqual([
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
        ['A header with plain list items', 1],
        ['A header with a custom todo sequence in DONE state', 1],
      ]);
    });

    it('is undoable', () => {
      check_is_undoable(state, {
        type: 'REFILE_SUBTREE',
        sourcePath: path,
        sourceHeaderId,
        targetPath: path,
        targetHeaderId,
        dirtying: true,
      });
    });
  });

  describe('INSERT_CAPTURE', () => {
    let store, templateTopLevel, templateNested;
    let state;
    const testOrgFile = readFixture('nested_header');
    const path = 'testfile';

    beforeEach(() => {
      templateTopLevel = {
        description: '',
        headerPaths: [],
        iconName: 'todo',
        id: generateId(),
        isAvailableInAllOrgFiles: false,
        letter: '',
        file: '',
        orgFilesWhereAvailable: [],
        shouldPrepend: false,
        shouldCaptureAsNewHeader: true,
        template: '* TODO %?',
        isSample: true,
      };
      templateNested = {
        description: '',
        headerPaths: ['Top level header', 'A nested header'],
        iconName: 'todo',
        id: generateId(),
        isAvailableInAllOrgFiles: false,
        letter: '',
        file: '',
        orgFilesWhereAvailable: [],
        shouldPrepend: false,
        template: '* TODO %?',
        isSample: true,
      };
      state = setUpStateForFile(path, testOrgFile);
      state.capture = state.capture.update('captureTemplates', (templates) =>
        templates.push(fromJS(templateTopLevel)).push(fromJS(templateNested))
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
      expect(extractTitleAndNesting(headers.last())).toEqual(['A second nested header', 2]);
    }

    function insertCapture(path, template, shouldPrepend, shouldCaptureAsNewHeader) {
      // Check initially parsed file looks as expected
      let headers = store.getState().org.present.getIn(['files', path, 'headers']);
      expect(headers.size).toEqual(4);
      expectOrigFirstHeader(headers);
      expectOrigLastHeader(headers);
      const action = types.insertCapture(
        template.id,
        content,
        shouldPrepend,
        shouldCaptureAsNewHeader
      );
      store.dispatch(action);
      const newHeaders = store.getState().org.present.getIn(['files', path, 'headers']);
      expect(newHeaders.size).toEqual(5);
      return newHeaders;
    }

    it('should insert at the top of file', () => {
      const newHeaders = insertCapture(path, templateTopLevel, true);
      expectOrigLastHeader(newHeaders);
      const first = newHeaders.first();
      expect(first.getIn(['titleLine', 'rawTitle'])).toEqual('My task');
      expect(first.getIn(['titleLine', 'todoKeyword'])).toEqual('TODO');
      expect(first.get('rawDescription')).toEqual('Some description\n');
    });

    it('should insert at the bottom of file', () => {
      const newHeaders = insertCapture(path, templateTopLevel, false);
      expectOrigFirstHeader(newHeaders);
      const last = newHeaders.last();
      expect(last.getIn(['titleLine', 'rawTitle'])).toEqual('My task');
      expect(last.getIn(['titleLine', 'todoKeyword'])).toEqual('TODO');
      expect(last.get('rawDescription')).toEqual('Some description\n');
    });

    it('should insert as the first child', () => {
      const newHeaders = insertCapture(path, templateNested, true);
      expectOrigFirstHeader(newHeaders);
      expectOrigLastHeader(newHeaders);
      expect(extractTitlesAndNestings(newHeaders)).toEqual([
        ['Top level header', 1],
        ['A nested header', 2],
        ['My task', 3],
        ['A deep nested header', 3],
        ['A second nested header', 2],
      ]);
    });

    it('should insert as the last child', () => {
      const newHeaders = insertCapture(path, templateNested, false);
      expectOrigFirstHeader(newHeaders);
      expectOrigLastHeader(newHeaders);
      expect(extractTitlesAndNestings(newHeaders)).toEqual([
        ['Top level header', 1],
        ['A nested header', 2],
        ['A deep nested header', 3],
        ['My task', 3],
        ['A second nested header', 2],
      ]);
    });

    it('is undoable', () => {
      check_is_undoable(state, {
        type: 'INSERT_CAPTURE',
        template: fromJS(templateTopLevel),
        content,
        shouldPrepend: true,
        dirtying: true,
      });
    });
  });

  describe('header tree', () => {
    let topLevelHeaderId;
    let nestedHeaderId;
    let nestedHeader2Id;
    let deepNestedHeaderId;
    let state;
    const testOrgFile = readFixture('nested_header');
    const path = 'testfile';

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
      // The target is to move "A nested header" to the top level.

      // "Top level header" is the 1st item but we count from 0 not 1.
      topLevelHeaderId = state.org.present.getIn(['files', path, 'headers']).get(0).get('id');
      // "A nested header" is the 2nd item but we count from 0 not 1.
      nestedHeaderId = state.org.present.getIn(['files', path, 'headers']).get(1).get('id');
      // "A deep nested header" is the 3rd item but we count from 0 not 1.
      deepNestedHeaderId = state.org.present.getIn(['files', path, 'headers']).get(2).get('id');
      // "A second nested header"is  the 4th item but we count from 0 not 1.
      nestedHeader2Id = state.org.present.getIn(['files', path, 'headers']).get(3).get('id');
    });

    describe('MOVE_HEADER_LEFT', () => {
      it('should handle MOVE_HEADER_LEFT', () => {
        // Mapping the headers to their nesting level. This is how the
        // initially parsed file should look like.
        expect(
          extractTitlesAndNestings(state.org.present.getIn(['files', path, 'headers']))
        ).toEqual([
          ['Top level header', 1],
          ['A nested header', 2],
          ['A deep nested header', 3],
          ['A second nested header', 2],
        ]);

        const action = types.moveHeaderLeft(nestedHeaderId);
        const newState = reducer(state.org.present, action);

        // "A nested header" is not at the top level.
        expect(extractTitlesAndNestings(newState.getIn(['files', path, 'headers']))).toEqual([
          ['Top level header', 1],
          ['A nested header', 1],
          ['A deep nested header', 3],
          ['A second nested header', 2],
        ]);
      });

      it('is undoable', () => {
        check_is_undoable(state, types.moveHeaderLeft(nestedHeaderId));
      });
    });

    describe('MOVE_HEADER_RIGHT', () => {
      it('should handle MOVE_HEADER_RIGHT', () => {
        // Mapping the headers to their nesting level. This is how the
        // initially parsed file should look like.
        expect(
          extractTitlesAndNestings(state.org.present.getIn(['files', path, 'headers']))
        ).toEqual([
          ['Top level header', 1],
          ['A nested header', 2],
          ['A deep nested header', 3],
          ['A second nested header', 2],
        ]);

        const action = types.moveHeaderRight(nestedHeaderId);
        const newState = reducer(state.org.present, action);

        // "A nested header" is not at the top level.
        expect(extractTitlesAndNestings(newState.getIn(['files', path, 'headers']))).toEqual([
          ['Top level header', 1],
          ['A nested header', 3],
          ['A deep nested header', 3],
          ['A second nested header', 2],
        ]);
      });

      it('is undoable', () => {
        check_is_undoable(state, types.moveHeaderRight(nestedHeaderId));
      });
    });

    describe('MOVE_HEADER_DOWN', () => {
      it('should handle MOVE_HEADER_DOWN', () => {
        // Mapping the headers to their nesting level. This is how the
        // initially parsed file should look like.
        expect(
          extractTitlesAndNestings(state.org.present.getIn(['files', path, 'headers']))
        ).toEqual([
          ['Top level header', 1],
          ['A nested header', 2],
          ['A deep nested header', 3],
          ['A second nested header', 2],
        ]);

        const action = types.moveHeaderDown(nestedHeaderId);
        const newState = reducer(state.org.present, action);

        // "A nested header" is not at the top level.
        expect(extractTitlesAndNestings(newState.getIn(['files', path, 'headers']))).toEqual([
          ['Top level header', 1],
          ['A second nested header', 2],
          ['A nested header', 2],
          ['A deep nested header', 3],
        ]);
      });

      it('should just dirty if already on the bottom', () => {
        check_just_dirtying(state.org.present, types.moveHeaderDown(nestedHeader2Id));
      });

      it('is undoable', () => {
        check_is_undoable(state, types.moveHeaderDown(nestedHeaderId));
      });
    });

    describe('MOVE_HEADER_UP', () => {
      it('should handle MOVE_HEADER_UP', () => {
        // Mapping the headers to their nesting level. This is how the
        // initially parsed file should look like.
        expect(
          extractTitlesAndNestings(state.org.present.getIn(['files', path, 'headers']))
        ).toEqual([
          ['Top level header', 1],
          ['A nested header', 2],
          ['A deep nested header', 3],
          ['A second nested header', 2],
        ]);

        const action = types.moveHeaderUp(nestedHeader2Id);
        const newState = reducer(state.org.present, action);

        // "A nested header" is not at the top level.
        expect(extractTitlesAndNestings(newState.getIn(['files', path, 'headers']))).toEqual([
          ['Top level header', 1],
          ['A second nested header', 2],
          ['A nested header', 2],
          ['A deep nested header', 3],
        ]);
      });

      it('should just dirty if already at the top', () => {
        check_just_dirtying(state.org.present, types.moveHeaderUp(nestedHeaderId));
      });

      it('is undoable', () => {
        check_is_undoable(state, types.moveHeaderUp(nestedHeader2Id));
      });
    });

    describe('MOVE_SUBTREE_LEFT', () => {
      it('should handle MOVE_SUBTREE_LEFT', () => {
        // Mapping the headers to their nesting level. This is how the
        // initially parsed file should look like.
        expect(
          extractTitlesAndNestings(state.org.present.getIn(['files', path, 'headers']))
        ).toEqual([
          ['Top level header', 1],
          ['A nested header', 2],
          ['A deep nested header', 3],
          ['A second nested header', 2],
        ]);

        const action = types.moveSubtreeLeft(nestedHeaderId);
        const newState = reducer(state.org.present, action);

        // "A nested header" is not at the top level.
        expect(extractTitlesAndNestings(newState.getIn(['files', path, 'headers']))).toEqual([
          ['Top level header', 1],
          ['A nested header', 1],
          ['A deep nested header', 2],
          ['A second nested header', 2],
        ]);
      });

      it('should just dirty when trying to move left a toplevel subtree', () => {
        check_just_dirtying(state.org.present, types.moveSubtreeLeft(topLevelHeaderId));
      });

      it('is undoable', () => {
        check_is_undoable(state, types.moveSubtreeLeft(nestedHeaderId));
      });
    });

    describe('MOVE_SUBTREE_RIGHT', () => {
      it('should handle MOVE_SUBTREE_RIGHT', () => {
        // Mapping the headers to their nesting level. This is how the
        // initially parsed file should look like.
        expect(
          extractTitlesAndNestings(state.org.present.getIn(['files', path, 'headers']))
        ).toEqual([
          ['Top level header', 1],
          ['A nested header', 2],
          ['A deep nested header', 3],
          ['A second nested header', 2],
        ]);

        const action = types.moveSubtreeRight(nestedHeaderId);
        const newState = reducer(state.org.present, action);

        // "A nested header" is not at the top level.
        expect(extractTitlesAndNestings(newState.getIn(['files', path, 'headers']))).toEqual([
          ['Top level header', 1],
          ['A nested header', 3],
          ['A deep nested header', 4],
          ['A second nested header', 2],
        ]);
      });

      it('is undoable', () => {
        check_is_undoable(state, types.moveSubtreeRight(nestedHeaderId));
      });
    });

    describe('REMOVE_HEADER', () => {
      it('should handle REMOVE_HEADER', () => {
        // Mapping the headers to their nesting level. This is how the
        // initially parsed file should look like.
        expect(
          extractTitlesAndNestings(state.org.present.getIn(['files', path, 'headers']))
        ).toEqual([
          ['Top level header', 1],
          ['A nested header', 2],
          ['A deep nested header', 3],
          ['A second nested header', 2],
        ]);

        const action = types.removeHeader(nestedHeaderId);
        const newState = reducer(state.org.present, action);

        // "A nested header" is not at the top level.
        expect(extractTitlesAndNestings(newState.getIn(['files', path, 'headers']))).toEqual([
          ['Top level header', 1],
          ['A second nested header', 2],
        ]);
      });

      it('should reset header narrowing', () => {
        const narrowedState = reducer(state.org.present, types.narrowHeader(nestedHeaderId));
        expect(narrowedState.getIn(['files', path, 'narrowedHeaderId'])).toEqual(nestedHeaderId);
        const newState = reducer(narrowedState, types.removeHeader(nestedHeaderId));
        expect(newState.getIn(['files', path, 'narrowedHeaderId'])).toEqual(null);
      });

      it('is undoable', () => {
        check_is_undoable(state, types.removeHeader(nestedHeaderId));
      });
    });

    describe('ADD_HEADER', () => {
      it('should handle ADD_HEADER and widen', () => {
        const oldState = state.org.present;
        expect(extractTitlesAndNestings(oldState.getIn(['files', path, 'headers']))).toEqual([
          ['Top level header', 1],
          ['A nested header', 2],
          ['A deep nested header', 3],
          ['A second nested header', 2],
        ]);

        const stateSelected = reducer(oldState, types.narrowHeader(nestedHeaderId));
        expect(stateSelected.getIn(['files', path, 'narrowedHeaderId'])).toEqual(nestedHeaderId);
        const newState = reducer(stateSelected, types.addHeader(nestedHeaderId));
        expect(newState.getIn(['files', path, 'narrowedHeaderId'])).toBeNull();

        // "A nested header" is not at the top level.
        expect(extractTitlesAndNestings(newState.getIn(['files', path, 'headers']))).toEqual([
          ['Top level header', 1],
          ['A nested header', 2],
          ['A deep nested header', 3],
          ['', 2],
          ['A second nested header', 2],
        ]);
      });

      it('should reset header narrowing', () => {
        const narrowedState = reducer(state.org.present, types.narrowHeader(nestedHeaderId));
        expect(narrowedState.getIn(['files', path, 'narrowedHeaderId'])).toEqual(nestedHeaderId);
        const newState = reducer(narrowedState, types.removeHeader(nestedHeaderId));
        expect(newState.getIn(['files', path, 'narrowedHeaderId'])).toEqual(null);
      });

      it('is undoable', () => {
        check_is_undoable(state, types.removeHeader(nestedHeaderId));
      });
    });

    describe('selecting ', () => {
      let openOnlyTop = fromJS({
        [path]: [['Top level header']],
      });
      let openAll = fromJS({
        [path]: [['Top level header', 'A nested header']],
      });

      function openHeaders(state, opennessState) {
        return reducer(state.set('opennessState', opennessState), types.applyOpennessState(path));
      }

      describe('SELECT_PREVIOUS_VISIBLE_HEADER', () => {
        it('should skip invisible header', () => {
          const stateSelected = selectHeader(
            openHeaders(state.org.present, openOnlyTop),
            nestedHeader2Id
          );
          expect(stateSelected.getIn(['files', path, 'selectedHeaderId'])).toEqual(nestedHeader2Id);
          const newState = reducer(stateSelected, types.selectPreviousVisibleHeader());
          expect(newState.getIn(['files', path, 'selectedHeaderId'])).toEqual(nestedHeaderId);
        });

        it("should select junior header when it's above", () => {
          const stateSelected = selectHeader(
            openHeaders(state.org.present, openAll),
            nestedHeader2Id
          );
          expect(stateSelected.getIn(['files', path, 'selectedHeaderId'])).toEqual(nestedHeader2Id);
          const newState = reducer(stateSelected, types.selectPreviousVisibleHeader());
          expect(newState.getIn(['files', path, 'selectedHeaderId'])).toEqual(deepNestedHeaderId);
        });

        it('should select parent header', () => {
          const stateSelected = selectHeader(
            openHeaders(state.org.present, openAll),
            deepNestedHeaderId
          );
          expect(stateSelected.getIn(['files', path, 'selectedHeaderId'])).toEqual(
            deepNestedHeaderId
          );
          const newState = reducer(stateSelected, types.selectPreviousVisibleHeader());
          expect(newState.getIn(['files', path, 'selectedHeaderId'])).toEqual(nestedHeaderId);
        });

        it('do nothing on the first header', () => {
          const stateSelected = selectHeader(
            openHeaders(state.org.present, openAll),
            topLevelHeaderId
          );
          expect(stateSelected.getIn(['files', path, 'selectedHeaderId'])).toEqual(
            topLevelHeaderId
          );
          const newState = reducer(stateSelected, types.selectPreviousVisibleHeader());
          expect(newState.getIn(['files', path, 'selectedHeaderId'])).toEqual(topLevelHeaderId);
        });
      });

      describe('SELECT_NEXT_VISIBLE_HEADER', () => {
        it('start from the first', () => {
          expect(state.org.present.getIn(['files', path, 'selectedHeaderId'])).toBeUndefined();
          const newState = reducer(state.org.present, types.selectNextVisibleHeader());
          expect(newState.getIn(['files', path, 'selectedHeaderId'])).toEqual(topLevelHeaderId);
        });

        it('should skip invisible header', () => {
          const stateSelected = selectHeader(
            openHeaders(state.org.present, openOnlyTop),
            nestedHeaderId
          );
          expect(stateSelected.getIn(['files', path, 'selectedHeaderId'])).toEqual(nestedHeaderId);
          const newState = reducer(stateSelected, types.selectNextVisibleHeader());
          expect(newState.getIn(['files', path, 'selectedHeaderId'])).toEqual(nestedHeader2Id);
        });

        it('should select child when its visible', () => {
          const stateSelected = selectHeader(
            openHeaders(state.org.present, openAll),
            nestedHeaderId
          );
          expect(stateSelected.getIn(['files', path, 'selectedHeaderId'])).toEqual(nestedHeaderId);
          const newState = reducer(stateSelected, types.selectNextVisibleHeader());
          expect(newState.getIn(['files', path, 'selectedHeaderId'])).toEqual(deepNestedHeaderId);
        });

        it("should select elder header when it's below", () => {
          const stateSelected = selectHeader(
            openHeaders(state.org.present, openAll),
            deepNestedHeaderId
          );
          expect(stateSelected.getIn(['files', path, 'selectedHeaderId'])).toEqual(
            deepNestedHeaderId
          );
          const newState = reducer(stateSelected, types.selectNextVisibleHeader());
          expect(newState.getIn(['files', path, 'selectedHeaderId'])).toEqual(nestedHeader2Id);
        });

        it('do nothing on the last header', () => {
          const stateSelected = selectHeader(
            openHeaders(state.org.present, openAll),
            nestedHeader2Id
          );
          expect(stateSelected.getIn(['files', path, 'selectedHeaderId'])).toEqual(nestedHeader2Id);
          const newState = reducer(stateSelected, types.selectNextVisibleHeader());
          expect(newState.getIn(['files', path, 'selectedHeaderId'])).toEqual(nestedHeader2Id);
        });

        it('do nothing on the last visible header', () => {
          const stateSelected = selectHeader(state.org.present, topLevelHeaderId);
          expect(stateSelected.getIn(['files', path, 'selectedHeaderId'])).toEqual(
            topLevelHeaderId
          );
          const newState = reducer(stateSelected, types.selectNextVisibleHeader());
          expect(newState.getIn(['files', path, 'selectedHeaderId'])).toEqual(topLevelHeaderId);
        });
      });

      describe('SELECT_NEXT_SIBLING_HEADER', () => {
        it('ignore when on the last sibling', () => {
          const oldState = selectHeader(state.org.present, topLevelHeaderId);
          const newState = reducer(oldState, types.selectNextSiblingHeader(nestedHeader2Id));
          expect(newState.getIn(['files', path, 'selectedHeaderId'])).toEqual(topLevelHeaderId);

          const oldState2 = selectHeader(state.org.present, nestedHeader2Id);
          const newState2 = reducer(oldState2, types.selectNextSiblingHeader(nestedHeader2Id));
          expect(newState2.getIn(['files', path, 'selectedHeaderId'])).toEqual(nestedHeader2Id);
        });
      });
    });

    describe('UPDATE_HEADER_DESCRIPTION', () => {
      const newDescription =
        'One man once said TODO,\n - [ ] and <2020-01-18 Sat> \n - others :followed: ';

      it('should handle UPDATE_HEADER_DESCRIPTION', () => {
        const action = types.updateHeaderDescription(nestedHeaderId, newDescription);
        const newState = reducer(state.org.present, action);
        const check_kept = check_kept_factory(state.org.present, newState);
        check_kept((st) =>
          headerWithId(st.getIn(['files', path, 'headers']), nestedHeaderId).getIn([
            'titleLine',
            'rawTitle',
          ])
        );
        expect(
          headerWithId(newState.getIn(['files', path, 'headers']), nestedHeaderId).get(
            'rawDescription'
          )
        ).toEqual(newDescription);
        expect(
          headerWithId(newState.getIn(['files', path, 'headers']), nestedHeaderId).get(
            'description'
          )
        ).not.toEqual(
          headerWithId(state.org.present.getIn(['files', path, 'headers']), nestedHeaderId).get(
            'description'
          )
        );
      });

      it('is undoable', () => {
        check_is_undoable(state, types.updateHeaderDescription(nestedHeaderId, newDescription));
      });
    });

    describe('TOGGLE_HEADER_OPENED', () => {
      it('should open only the header on the first toggle', () => {
        const newState = reducer(
          state.org.present,
          types.toggleHeaderOpened(topLevelHeaderId, true)
        );
        expect(
          headerWithId(newState.getIn(['files', path, 'headers']), topLevelHeaderId).get('opened')
        ).toEqual(true);
        expect(
          headerWithId(newState.getIn(['files', path, 'headers']), nestedHeaderId).get('opened')
        ).toEqual(false);
      });

      it('should close the header and subheaders on the second toggle', () => {
        const topLevelOpen = reducer(
          state.org.present,
          types.toggleHeaderOpened(topLevelHeaderId, true)
        );
        const nestedOpen = reducer(topLevelOpen, types.toggleHeaderOpened(nestedHeaderId, true));
        const deepNestedOpen = reducer(
          nestedOpen,
          types.toggleHeaderOpened(deepNestedHeaderId, true)
        );
        const allClosed = reducer(deepNestedOpen, types.toggleHeaderOpened(topLevelHeaderId, true));
        const reopened = reducer(allClosed, types.toggleHeaderOpened(topLevelHeaderId, true));
        expect(
          headerWithId(reopened.getIn(['files', path, 'headers']), topLevelHeaderId).get('opened')
        ).toEqual(true);
        expect(
          headerWithId(reopened.getIn(['files', path, 'headers']), nestedHeaderId).get('opened')
        ).toEqual(false);
        expect(
          headerWithId(reopened.getIn(['files', path, 'headers']), deepNestedHeaderId).get('opened')
        ).toEqual(false);
      });

      it('should close only the header when said so', () => {
        const topLevelOpen = reducer(
          state.org.present,
          types.toggleHeaderOpened(topLevelHeaderId, true)
        );
        const nestedOpen = reducer(topLevelOpen, types.toggleHeaderOpened(nestedHeaderId, true));
        const deepNestedOpen = reducer(
          nestedOpen,
          types.toggleHeaderOpened(deepNestedHeaderId, true)
        );
        const allClosed = reducer(
          deepNestedOpen,
          types.toggleHeaderOpened(topLevelHeaderId, false)
        );
        const reopened = reducer(allClosed, types.toggleHeaderOpened(topLevelHeaderId, false));
        expect(
          headerWithId(reopened.getIn(['files', path, 'headers']), topLevelHeaderId).get('opened')
        ).toEqual(true);
        expect(
          headerWithId(reopened.getIn(['files', path, 'headers']), nestedHeaderId).get('opened')
        ).toEqual(true);
        expect(
          headerWithId(reopened.getIn(['files', path, 'headers']), deepNestedHeaderId).get('opened')
        ).toEqual(true);
      });

      it('should ignore if narrowed and open', () => {
        expect(
          state.org.present.getIn(['files', path, 'headers']).every((hdr) => !hdr.get('opened'))
        ).toEqual(true);
        const openState = reducer(
          state.org.present,
          types.toggleHeaderOpened(topLevelHeaderId, true)
        );
        const narrowedState = reducer(openState, types.narrowHeader(topLevelHeaderId));
        const newState = reducer(narrowedState, types.toggleHeaderOpened(topLevelHeaderId, true));
        expect(newState).toEqual(narrowedState);
      });
    });
  });

  describe('ADVANCE_TODO_STATE', () => {
    let regularHeaderId;
    let todoHeaderId;
    let doneHeaderId;
    let repeatingHeaderId;
    let activeTimestampWithRepeaterHeaderId;
    let state;
    const testOrgFile = readFixture('various_todos');
    const path = 'testfile';

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
      // "This is done" is the 1st header
      // "Header with repeater" is the 2nd header
      // "This is not a todo" is 3rd header
      // "Active timestamp task with repeater" is 4th header
      // "Repeating task" is 5th header
      doneHeaderId = state.org.present.getIn(['files', path, 'headers']).get(0).get('id');
      todoHeaderId = state.org.present.getIn(['files', path, 'headers']).get(1).get('id');
      regularHeaderId = state.org.present.getIn(['files', path, 'headers']).get(2).get('id');
      activeTimestampWithRepeaterHeaderId = state.org.present
        .getIn(['files', path, 'headers'])
        .get(3)
        .get('id');
      repeatingHeaderId = state.org.present.getIn(['files', path, 'headers']).get(4).get('id');
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
      const oldHeaders = state.org.present.getIn(['files', path, 'headers']);
      const newHeaders = reducer(state.org.present, types.advanceTodoState(todoHeaderId)).getIn([
        'files',
        path,
        'headers',
      ]);
      check_header_kept(oldHeaders, newHeaders, regularHeaderId);
      check_todo_keyword_changed(oldHeaders, newHeaders, todoHeaderId);
      check_header_kept(oldHeaders, newHeaders, doneHeaderId);

      // The nesting levels remain intact.
      expect(extractTitlesAndNestings(oldHeaders)).toEqual(extractTitlesAndNestings(newHeaders));
    });

    it('should advance DONE state', () => {
      const oldHeaders = state.org.present.getIn(['files', path, 'headers']);
      const newHeaders = reducer(state.org.present, types.advanceTodoState(doneHeaderId)).getIn([
        'files',
        path,
        'headers',
      ]);
      check_header_kept(oldHeaders, newHeaders, regularHeaderId);
      check_header_kept(oldHeaders, newHeaders, todoHeaderId);
      check_todo_keyword_changed(oldHeaders, newHeaders, doneHeaderId);

      // The nesting levels remain intact.
      expect(extractTitlesAndNestings(oldHeaders)).toEqual(extractTitlesAndNestings(newHeaders));
    });

    it('should advance non-TODO state', () => {
      const oldHeaders = state.org.present.getIn(['files', path, 'headers']);
      const newHeaders = reducer(state.org.present, types.advanceTodoState(regularHeaderId)).getIn([
        'files',
        path,
        'headers',
      ]);
      check_todo_keyword_changed(oldHeaders, newHeaders, regularHeaderId);
      check_header_kept(oldHeaders, newHeaders, todoHeaderId);
      check_header_kept(oldHeaders, newHeaders, doneHeaderId);

      // The nesting levels remain intact.
      expect(extractTitlesAndNestings(oldHeaders)).toEqual(extractTitlesAndNestings(newHeaders));
    });

    it('should advance repeating task', () => {
      const oldHeaders = state.org.present.getIn(['files', path, 'headers']);
      const newHeaders = reducer(
        state.org.present,
        types.advanceTodoState(repeatingHeaderId)
      ).getIn(['files', path, 'headers']);
      check_todo_keyword_kept(oldHeaders, newHeaders, repeatingHeaderId);
      expect(headerWithId(newHeaders, repeatingHeaderId).get('description').size).toEqual(
        headerWithId(oldHeaders, repeatingHeaderId).get('description').size
      );
      expect(headerWithId(newHeaders, repeatingHeaderId).get('logNotes').size).toBeGreaterThan(
        headerWithId(oldHeaders, repeatingHeaderId).get('logNotes').size
      );

      expect(headerWithId(newHeaders, repeatingHeaderId).get('planningItems')).not.toEqual(
        headerWithId(oldHeaders, repeatingHeaderId).get('planningItems')
      );

      // The nesting levels remain intact.
      expect(extractTitlesAndNestings(oldHeaders)).toEqual(extractTitlesAndNestings(newHeaders));
    });

    it('should advance repeating task again', () => {
      const intermState = reducer(state.org.present, types.advanceTodoState(repeatingHeaderId));
      const intermHeaders = intermState.getIn(['files', path, 'headers']);
      const newHeaders = reducer(intermState, types.advanceTodoState(repeatingHeaderId)).getIn([
        'files',
        path,
        'headers',
      ]);
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

    it('should advance active timestamp with repeater in header', () => {
      const oldHeaders = state.org.present.getIn(['files', path, 'headers']);
      const newHeaders = reducer(
        state.org.present,
        types.advanceTodoState(activeTimestampWithRepeaterHeaderId)
      ).getIn(['files', path, 'headers']);
      check_todo_keyword_kept(oldHeaders, newHeaders, activeTimestampWithRepeaterHeaderId);

      expect(
        headerWithId(newHeaders, activeTimestampWithRepeaterHeaderId).get('planningItems')
      ).not.toEqual(
        headerWithId(oldHeaders, activeTimestampWithRepeaterHeaderId).get('planningItems')
      );

      // The active timestamp with repeater get's replaced in place
      expect(
        headerWithId(oldHeaders, activeTimestampWithRepeaterHeaderId).getIn([
          'titleLine',
          'rawTitle',
        ])
      ).toMatch(/<2020-11-15 Sun \+1d>/);
      expect(
        headerWithId(oldHeaders, activeTimestampWithRepeaterHeaderId).getIn([
          'titleLine',
          'rawTitle',
        ])
      ).not.toMatch(/<2020-11-16 Mon \+1d>/);
      expect(
        headerWithId(newHeaders, activeTimestampWithRepeaterHeaderId).getIn([
          'titleLine',
          'rawTitle',
        ])
      ).not.toMatch(/<2020-11-15 Sun \+1d>/);
      expect(
        headerWithId(newHeaders, activeTimestampWithRepeaterHeaderId).getIn([
          'titleLine',
          'rawTitle',
        ])
      ).toMatch(/<2020-11-16 Mon \+1d>/);
    });

    it('should just dirty when applied to no header', () => {
      check_just_dirtying(state.org.present, types.advanceTodoState(undefined));
    });

    it('is undoable', () => {
      check_is_undoable(state, types.advanceTodoState(todoHeaderId, true));
      check_is_undoable(state, types.advanceTodoState(doneHeaderId, false));
    });
  });

  describe('UPDATE_LOG_ENTRY_TIME', () => {
    let headerId;
    let irrelevantHeaderId;
    let state;
    const testOrgFile = readFixture('logbook');
    const path = 'testfile';
    const date = new Date(98, 1);
    const ts = timestampForDate(date, { isActive: true, withStartTime: true });

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
      headerId = state.org.present.getIn(['files', path, 'headers']).get(0).get('id');
      irrelevantHeaderId = state.org.present.getIn(['files', path, 'headers']).get(1).get('id');
    });

    it('should handle UPDATE_LOG_ENTRY_TIME', () => {
      const newState = reducer(
        state.org.present,
        types.updateLogEntryTime(headerId, 0, 'start', ts)
      );
      expect(
        dateForTimestamp(
          headerWithId(newState.getIn(['files', path, 'headers']), headerId).getIn([
            'logBookEntries',
            0,
            'start',
          ])
        )
      ).toEqual(date);

      const check_kept = check_kept_factory(state.org.present, newState);
      check_kept((st) => st.getIn(['files', path, 'headers']).size);
      check_kept((st) => headerWithId(st.getIn(['files', path, 'headers']), irrelevantHeaderId));
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).getIn([
          'titleLine',
          'rawTitle',
        ])
      );
      check_kept(
        (st) =>
          headerWithId(st.getIn(['files', path, 'headers']), headerId).get('logBookEntries').size
      );
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).getIn([
          'logBookEntries',
          1,
          'start',
        ])
      );
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).getIn([
          'logBookEntries',
          1,
          'end',
        ])
      );
    });
  });

  describe('SET_ORG_FILE_ERROR_MESSAGE', () => {
    let state;
    const testOrgFile = readFixture('nested_header');
    const path = 'testfile';
    const message = 'It’s Does Not Compute';

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
    });

    it('should handle SET_ORG_FILE_ERROR_MESSAGE', () => {
      const newState = reducer(state.org.present, types.setOrgFileErrorMessage(message));
      expect(newState.get('orgFileErrorMessage')).toEqual(message);
      expect(newState.getIn(['files', path, 'headers'])).toEqual(
        state.org.present.getIn(['files', path, 'headers'])
      );
    });
  });

  describe('UPDATE_PROPERTY_LIST_ITEMS', () => {
    let headerId;
    let irrelevantHeaderId;
    let state;
    const testOrgFile = readFixture('properties_extended');
    const path = 'testfile';
    const properties = fromJS([
      { property: 'fst', value: 'car', id: generateId() },
      { property: 'snd', value: null, id: generateId() },
    ]);

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
      headerId = state.org.present.getIn(['files', path, 'headers']).get(1).get('id');
      irrelevantHeaderId = state.org.present.getIn(['files', path, 'headers']).get(0).get('id');
    });

    it('should handle UPDATE_PROPERTY_LIST_ITEMS', () => {
      const newState = reducer(
        state.org.present,
        types.updatePropertyListItems(headerId, properties)
      );

      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), headerId).get('propertyListItems')
      ).toEqual(properties);

      const check_kept = check_kept_factory(state.org.present, newState);
      check_kept((st) => st.getIn(['files', path, 'headers']).size);
      check_kept((st) => headerWithId(st.getIn(['files', path, 'headers']), irrelevantHeaderId));
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).getIn([
          'titleLine',
          'rawTitle',
        ])
      );
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).get('logBookEntries')
      );
    });
  });

  describe('ADD_NEW_PLANNING_ITEM', () => {
    let headerId;
    let state;
    const testOrgFile = readFixture('schedule');
    const path = 'testfile';

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
      headerId = state.org.present.getIn(['files', path, 'headers']).get(0).get('id');
    });

    it('should handle ADD_NEW_PLANNING_ITEM', () => {
      const newState = reducer(state.org.present, types.addNewPlanningItem(headerId, 'DEADLINE'));
      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), headerId).get('planningItems').size
      ).toEqual(2);
      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), headerId)
          .get('planningItems')
          .get(0)
          .get('type')
      ).toEqual('SCHEDULED');
      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), headerId)
          .get('planningItems')
          .get(1)
          .get('type')
      ).toEqual('DEADLINE');

      const check_kept = check_kept_factory(state.org.present, newState);
      check_kept((st) => st.getIn(['files', path, 'headers']).size);
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).getIn([
          'titleLine',
          'rawTitle',
        ])
      );
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).getIn([
          'titleLine',
          'todoKeyword',
        ])
      );
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).get('logBookEntries')
      );
    });
  });

  describe('UPDATE_PLANING_ITEM_TIMESTAMP', () => {
    let headerId;
    let state;
    const testOrgFile = readFixture('schedule');
    const path = 'testfile';
    const date = new Date(98, 1);
    const ts = timestampForDate(date, { isActive: true, withStartTime: true });

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
      headerId = state.org.present.getIn(['files', path, 'headers']).get(0).get('id');
    });

    it('should handle UPDATE_PLANING_ITEM_TIMESTAMP', () => {
      const newState = reducer(
        state.org.present,
        types.updatePlanningItemTimestamp(headerId, 0, ts)
      );
      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), headerId)
          .get('planningItems')
          .get(0)
          .get('type')
      ).toEqual('SCHEDULED');

      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), headerId)
          .get('planningItems')
          .get(0)
          .get('timestamp')
      ).toEqual(ts);

      const check_kept = check_kept_factory(state.org.present, newState);
      check_kept((st) => st.getIn(['files', path, 'headers']).size);
      check_kept(
        (st) =>
          headerWithId(st.getIn(['files', path, 'headers']), headerId).get('planningItems').size
      );
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).getIn([
          'titleLine',
          'rawTitle',
        ])
      );
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).getIn([
          'titleLine',
          'todoKeyword',
        ])
      );
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).get('logBookEntries')
      );
    });
  });

  describe('UPDATE_TIMESTAMP_WITH_ID', () => {
    let state;
    let headerId;
    const testOrgFile = readFixture('schedule_and_timestamps');
    const path = 'testfile';
    const date = new Date(98, 1);
    const ts = timestampForDate(date, { isActive: true, withStartTime: true });
    let headerTsId;
    let bodyTsId;
    const invalidId = generateId();

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
      headerId = state.org.present.getIn(['files', path, 'headers']).get(0).get('id');
      headerTsId = state.org.present.getIn([
        'files',
        path,
        'headers',
        0,
        'titleLine',
        'title',
        0,
        'id',
      ]);
      bodyTsId = state.org.present.getIn(['files', path, 'headers', 0, 'description', 2, 'id']);
    });

    it('should update timestamp in a header', () => {
      const oldState = state.org.present;
      const newState = reducer(
        oldState,
        types.updateTimestampWithId(
          headerTsId,
          fromJS({ id: headerTsId, type: 'timestamp', firstTimestamp: ts, secondTimestamp: null })
        )
      );
      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), headerId)
          .getIn(['titleLine', 'title', 0, 'firstTimestamp'])
          .toJS()
      ).toEqual(ts);

      const check_kept = check_kept_factory(oldState, newState);
      check_kept((st) => st.getIn(['files', path, 'headers']).size);
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).get('description')
      );
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).get('rawDescription')
      );
    });

    it('should update timestamp in a description', () => {
      const oldState = state.org.present;
      const newState = reducer(
        oldState,
        types.updateTimestampWithId(
          bodyTsId,
          fromJS({ id: bodyTsId, type: 'timestamp', firstTimestamp: ts, secondTimestamp: null })
        )
      );
      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), headerId)
          .getIn(['description', 2, 'firstTimestamp'])
          .toJS()
      ).toEqual(ts);
      const check_kept = check_kept_factory(oldState, newState);
      check_kept((st) => st.getIn(['files', path, 'headers']).size);
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).get('titleLine')
      );
    });

    it('should just dirty when trying to update invalid id', () => {
      check_just_dirtying(state.org.present, types.updateTimestampWithId(invalidId, 'dummy'));
    });
  });

  describe('REORDER_PROPERTY_LIST', () => {
    let headerId;
    let irrelevantHeaderId;
    let state;
    const testOrgFile = readFixture('properties_extended');
    const path = 'testfile';
    const fromIndex = 1;
    const toIndex = 3;
    const invalidId = generateId();

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
      headerId = state.org.present.getIn(['files', path, 'headers']).get(0).get('id');
      irrelevantHeaderId = state.org.present.getIn(['files', path, 'headers']).get(1).get('id');
    });

    it('should handle REORDER_PROPERTY_LIST', () => {
      const newState = reducer(state.org.present, {
        type: 'REORDER_PROPERTY_LIST',
        fromIndex,
        toIndex,
        headerId,
        dirtying: true,
      });

      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), headerId)
          .get('propertyListItems')
          .toJS()
          .map((x) => x.property)
      ).toEqual(['foo', 'baz', 'bay', 'bar']);

      const check_kept = check_kept_factory(state.org.present, newState);
      check_kept((st) => st.getIn(['files', path, 'headers']).size);
      check_kept((st) => headerWithId(st.getIn(['files', path, 'headers']), irrelevantHeaderId));
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).getIn([
          'titleLine',
          'rawTitle',
        ])
      );
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).get('logBookEntries')
      );
    });

    it('should just dirty when working with invalid header id', () => {
      check_just_dirtying(state.org.present, {
        type: 'REORDER_PROPERTY_LIST',
        fromIndex,
        toIndex,
        invalidId,
        dirtying: true,
      });
    });
  });

  describe('REORDER_TAGS', () => {
    let headerId;
    let state;
    const testOrgFile = readFixture('more_tags');
    const path = 'testfile';
    const fromIndex = 0;
    const toIndex = 2;
    const invalidId = generateId();

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
      headerId = state.org.present.getIn(['files', path, 'headers']).get(0).get('id');
    });

    it('should handle REORDER_TAGS', () => {
      const stateSelected = reducer(state.org.present, { type: 'SELECT_HEADER', headerId });
      const newState = reducer(stateSelected, types.reorderTags(fromIndex, toIndex));

      expect(stateSelected.getIn(['files', path, 'selectedHeaderId'])).toEqual(headerId);
      expect(newState.getIn(['files', path, 'selectedHeaderId'])).toEqual(headerId);
      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), headerId)
          .getIn(['titleLine', 'tags'])
          .toJS()
      ).toEqual(['t2', 't3', 't1', 'spec_tag']);

      const check_kept = check_kept_factory(state.org.present, newState);
      check_kept((st) => st.getIn(['files', path, 'headers']).size);
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).getIn(['titleLine', 'title'])
      );
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).getIn([
          'titleLine',
          'rawTitle',
        ])
      );
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), headerId).get('description')
      );
    });

    it('should just dirty when working with invalid header id', () => {
      const selectedState = reducer(state.org.present, { type: 'SELECT_HEADER', invalidId });
      check_just_dirtying(selectedState, types.reorderTags(fromIndex, toIndex));
    });
  });

  describe('SET_HEADER_TAGS', () => {
    let irrelevantHeaderId;
    let state;
    const testOrgFile = readFixture('more_tags');
    const path = 'testfile';
    const tags = fromJS(['ta', 't1', 'spec_tag']);
    const invalidId = generateId();

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
      irrelevantHeaderId = state.org.present.getIn(['files', path, 'headers']).get(0).get('id');
    });

    it('should handle SET_HEADER_TAGS', () => {
      const stateInserted = reducer(state.org.present, types.addHeader(0));
      const headerId = stateInserted.getIn(['files', path, 'headers']).get(0).get('id');
      const newState = reducer(stateInserted, types.setHeaderTags(headerId, tags));

      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), headerId).getIn([
          'titleLine',
          'tags',
        ])
      ).toEqual(tags);

      const check_kept = check_kept_factory(state.org.present, newState);
      check_kept((st) => headerWithId(st.getIn(['files', path, 'headers']), irrelevantHeaderId));
    });

    it('should just dirty when working with invalid header id', () => {
      check_just_dirtying(state.org.present, types.setHeaderTags(invalidId, tags));
    });
  });

  describe('ADVANCE_CHECKBOX_STATE', () => {
    let topHeaderId;
    let bottomHeaderId;
    let checkedBoxC;
    let uncheckedBoxB;
    let compoundBoxE;
    let deepNestedBoxH;
    let bottomNestedBoxK;
    let bottomDeepNestedBoxN;
    let state;
    const testOrgFile = readFixture('checkboxes');
    const path = 'testfile';

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
      let headers = state.org.present.getIn(['files', path, 'headers']);
      topHeaderId = headers.get(0).get('id');
      bottomHeaderId = headers.get(1).get('id');
      checkedBoxC = headerWithId(headers, topHeaderId).getIn(['description', 0, 'items', 2, 'id']);
      uncheckedBoxB = headerWithId(headers, topHeaderId).getIn([
        'description',
        0,
        'items',
        1,
        'id',
      ]);
      compoundBoxE = headerWithId(headers, bottomHeaderId).getIn([
        'description',
        0,
        'items',
        1,
        'id',
      ]);
      deepNestedBoxH = headerWithId(headers, bottomHeaderId).getIn([
        'description',
        0,
        'items',
        1,
        'contents',
        0,
        'items',
        0,
        'contents',
        0,
        'items',
        0,
        'id',
      ]);
      bottomNestedBoxK = headerWithId(headers, bottomHeaderId).getIn([
        'description',
        0,
        'items',
        2,
        'contents',
        0,
        'items',
        0,
        'id',
      ]);
      bottomDeepNestedBoxN = headerWithId(headers, bottomHeaderId).getIn([
        'description',
        0,
        'items',
        2,
        'contents',
        0,
        'items',
        1,
        'contents',
        0,
        'items',
        1,
        'id',
      ]);
    });

    it('should check the box', () => {
      const oldState = state.org.present;
      const newState = reducer(oldState, types.advanceCheckboxState(uncheckedBoxB));

      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), topHeaderId)
          .getIn(['description', 0, 'items'])
          .toJS()
          .map((x) => x.checkboxState)
      ).toEqual(['unchecked', 'checked', 'checked']);

      const check_kept = check_kept_factory(oldState, newState);
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), topHeaderId).getIn([
          'description',
          0,
          'items',
          0,
        ])
      );
      check_kept((st) => headerWithId(st.getIn(['files', path, 'headers']), bottomHeaderId));
    });

    it('should uncheck the box', () => {
      const oldState = state.org.present;
      const newState = reducer(oldState, types.advanceCheckboxState(checkedBoxC));

      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), topHeaderId)
          .getIn(['description', 0, 'items'])
          .toJS()
          .map((x) => x.checkboxState)
      ).toEqual(['unchecked', 'unchecked', 'unchecked']);

      const check_kept = check_kept_factory(oldState, newState);
      check_kept((st) =>
        headerWithId(st.getIn(['files', path, 'headers']), topHeaderId).getIn([
          'description',
          0,
          'items',
          0,
        ])
      );
      check_kept((st) => headerWithId(st.getIn(['files', path, 'headers']), bottomHeaderId));
    });

    it('should just dirty when checkbox is a nest header', () => {
      check_just_dirtying(state.org.present, types.advanceCheckboxState(compoundBoxE));
    });

    it('should check the parent boxes and update cookies when complete', () => {
      const oldState = state.org.present;
      const newState = reducer(oldState, types.advanceCheckboxState(deepNestedBoxH));

      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), bottomHeaderId)
          .getIn(['description', 0, 'items'])
          .toJS()
          .map((x) => x.checkboxState)
      ).toEqual(['checked', 'checked', 'partial', null]);

      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), bottomHeaderId)
          .getIn(['titleLine', 'title', 1, 'fraction'])
          .toJS()
      ).toEqual([2, 3]);

      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), bottomHeaderId).getIn([
          'description',
          0,
          'items', // compoundBoxE
          1,
          'titleLine',
          1,
          'percentage',
        ])
      ).toEqual(100);
    });

    it('should keep the partial state when some children are not checked', () => {
      const oldState = state.org.present;
      const newState = reducer(oldState, types.advanceCheckboxState(bottomNestedBoxK));
      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), bottomHeaderId)
          .getIn(['description', 0, 'items'])
          .toJS()
          .map((x) => x.checkboxState)
      ).toEqual(['checked', 'partial', 'partial', null]);
    });

    it('should clear the compound when children are undone', () => {
      const oldState = state.org.present;
      const newState = reducer(oldState, types.advanceCheckboxState(bottomDeepNestedBoxN));
      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), bottomHeaderId)
          .getIn(['description', 0, 'items'])
          .toJS()
          .map((x) => x.checkboxState)
      ).toEqual(['checked', 'partial', 'unchecked', null]);
    });

    function insertBugIntoCheckboxM(oldState, bug) {
      return oldState.updateIn(
        [
          'files',
          path,
          'headers',
          indexOfHeaderWithId(oldState.getIn(['files', path, 'headers']), bottomHeaderId),
          'description',
          0,
          'items',
          2,
          'contents',
          0,
          'items',
          1,
          'contents',
          0,
          'items',
          0, // Box M
          'checkboxState',
        ],
        () => bug
      );
    }

    it('should panic on an unknown checkbox state in test mode', () => {
      const oldState = state.org.present;
      const buggyState = insertBugIntoCheckboxM(oldState, 'Karamba!');
      expect(() => reducer(buggyState, types.advanceCheckboxState(bottomDeepNestedBoxN))).toThrow(
        /Karamba!/
      );
    });

    function callInProd(fun) {
      const OLD_ENV = process.env;
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      const result = fun();
      process.env = { ...OLD_ENV };
      return result;
    }

    it('should ignore an unknown checkbox state in production mode', () => {
      const oldState = state.org.present;
      const buggyState = insertBugIntoCheckboxM(oldState, 'Karamba!');
      const newState = callInProd(() =>
        reducer(buggyState, types.advanceCheckboxState(bottomDeepNestedBoxN))
      );
      expect(
        headerWithId(newState.getIn(['files', path, 'headers']), bottomHeaderId).getIn([
          'description',
          0,
          'items',
          2,
          'contents',
          0,
          'items',
          1,
          'contents',
          0,
          'items',
          1, // Box N
          'checkboxState',
        ])
      ).toEqual('unchecked');
    });
  });

  describe('CLEAR_PENDING_CAPTURE', () => {
    let state;

    beforeEach(() => {
      state = readInitialState();
    });

    it('should handle CLEAR_PENDING_CAPTURE', () => {
      const newState = reducer(state.org.present, types.clearPendingCapture());
      expect(newState.get('pendingCapture')).toBeNull();
    });
  });

  describe('table', () => {
    let state;
    let store;
    let cellId;
    const newValue = 'Murakami';
    const testOrgFile = readFixture('table');
    const path = 'testfile';

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
      cellId = firstTable(state.org.present, path).getIn(['contents', 1, 'contents', 1, 'id']);
      store = createStore(undoable(reducer), state.org.present);
    });

    function firstTable(state, path) {
      let hdrContents = state.getIn(['files', path, 'headers', 0, 'description']);
      return hdrContents.find((item) => item.get('type') === 'table');
    }

    describe('UPDATE_TABLE_CELL_VALUE', () => {
      it('should handle UPDATE_TABLE_CELL_VALUE', () => {
        const newState = reducer(state.org.present, types.updateTableCellValue(cellId, newValue));
        expect(
          firstTable(newState, path).getIn([
            'contents',
            1,
            'contents',
            1,
            'contents',
            0,
            'contents',
          ])
        ).toEqual(newValue);
        expect(
          firstTable(newState, path).getIn(['contents', 1, 'contents', 1, 'rawContents'])
        ).toEqual(newValue);
        const check_kept = check_kept_factory(state.org.present, newState);
        check_kept((st) => st.getIn(['files', path, 'headers', 0, 'titleLine']));
        check_kept((st) => firstTable(st, path).getIn(['contents', 0, 'contents']));
        check_kept((st) => firstTable(st, path).getIn(['contents', 2, 'contents']));
        check_kept((st) => firstTable(st, path).getIn(['contents', 1, 'contents', 0]));
        check_kept((st) => firstTable(st, path).getIn(['contents', 1, 'contents', 2]));
      });
    });

    describe('MOVE_TABLE_COLUMN_RIGHT', () => {
      it('should handle MOVE_TABLE_COLUMN_RIGHT', () => {
        const oldState = store.getState().present;
        store.dispatch({ type: 'SET_SELECTED_TABLE_CELL_ID', cellId });
        const stateCellSelected = store.getState().present;
        const newState = reducer(stateCellSelected, types.moveTableColumnRight());
        const check_kept = check_kept_factory(state.org.present, newState);

        [0, 1, 2].forEach((i) => {
          expect(firstTable(newState, path).getIn(['contents', i, 'contents', 1])).toEqual(
            firstTable(oldState, path).getIn(['contents', i, 'contents', 2])
          );
          expect(firstTable(newState, path).getIn(['contents', i, 'contents', 2])).toEqual(
            firstTable(oldState, path).getIn(['contents', i, 'contents', 1])
          );
          check_kept((st) => firstTable(st, path).getIn(['contents', i, 'contents', 0]));
          check_kept((st) => firstTable(st, path).getIn(['contents', i, 'contents']).size);
        });
        check_kept((st) => firstTable(st, path).get('contents').size);
      });

      it('should just dirty on move with no cell selected', () => {
        check_just_dirtying(store.getState().present, types.moveTableColumnRight());
      });

      it('is undoable', () => {
        check_is_undoable_on_table(store, path, cellId, types.moveTableColumnRight());
      });
    });

    describe('MOVE_TABLE_COLUMN_LEFT', () => {
      it('should handle MOVE_TABLE_COLUMN_LEFT', () => {
        const oldState = store.getState().present;
        store.dispatch({ type: 'SET_SELECTED_TABLE_CELL_ID', cellId });
        const stateCellSelected = store.getState().present;
        const newState = reducer(stateCellSelected, types.moveTableColumnLeft());
        const check_kept = check_kept_factory(state.org.present, newState);

        [0, 1, 2].forEach((i) => {
          expect(firstTable(newState, path).getIn(['contents', i, 'contents', 1])).toEqual(
            firstTable(oldState, path).getIn(['contents', i, 'contents', 0])
          );
          expect(firstTable(newState, path).getIn(['contents', i, 'contents', 0])).toEqual(
            firstTable(oldState, path).getIn(['contents', i, 'contents', 1])
          );
          check_kept((st) => firstTable(st, path).getIn(['contents', i, 'contents', 2]));
          check_kept((st) => firstTable(st, path).getIn(['contents', i, 'contents']).size);
        });
        check_kept((st) => firstTable(st, path).get('contents').size);
      });

      it('should just dirty on move with no cell selected', () => {
        check_just_dirtying(store.getState().present, types.moveTableColumnLeft());
      });

      it('is undoable', () => {
        check_is_undoable_on_table(store, path, cellId, types.moveTableColumnLeft());
      });
    });

    describe('MOVE_TABLE_ROW_UP', () => {
      it('should handle MOVE_TABLE_ROW_UP', () => {
        const oldState = store.getState().present;
        store.dispatch({ type: 'SET_SELECTED_TABLE_CELL_ID', cellId });
        const stateCellSelected = store.getState().present;
        const newState = reducer(stateCellSelected, types.moveTableRowUp());
        const check_kept = check_kept_factory(state.org.present, newState);

        expect(firstTable(newState, path).getIn(['contents', 0])).toEqual(
          firstTable(oldState, path).getIn(['contents', 1])
        );
        expect(firstTable(newState, path).getIn(['contents', 1])).toEqual(
          firstTable(oldState, path).getIn(['contents', 0])
        );
        check_kept((st) => firstTable(st, path).getIn(['contents', 2]));
        check_kept((st) => firstTable(st, path).get('contents').size);
      });

      it('should just dirty on move with no cell selected', () => {
        check_just_dirtying(store.getState().present, types.moveTableRowUp());
      });

      it('is undoable', () => {
        check_is_undoable_on_table(store, path, cellId, types.moveTableRowUp());
      });
    });

    describe('MOVE_TABLE_ROW_DOWN', () => {
      it('should handle MOVE_TABLE_ROW_DOWN', () => {
        const oldState = store.getState().present;
        store.dispatch({ type: 'SET_SELECTED_TABLE_CELL_ID', cellId });
        const stateCellSelected = store.getState().present;
        const newState = reducer(stateCellSelected, types.moveTableRowDown());
        const check_kept = check_kept_factory(state.org.present, newState);

        expect(firstTable(newState, path).getIn(['contents', 2])).toEqual(
          firstTable(oldState, path).getIn(['contents', 1])
        );
        expect(firstTable(newState, path).getIn(['contents', 1])).toEqual(
          firstTable(oldState, path).getIn(['contents', 2])
        );
        check_kept((st) => firstTable(st, path).getIn(['contents', 0]));
        check_kept((st) => firstTable(st, path).get('contents').size);
      });

      it('should just dirty on move with no cell selected', () => {
        check_just_dirtying(store.getState().present, types.moveTableRowDown());
      });

      it('is undoable', () => {
        check_is_undoable_on_table(store, path, cellId, types.moveTableRowDown());
      });
    });

    describe('REMOVE_TABLE_COLUMN', () => {
      it('should handle REMOVE_TABLE_COLUMN', () => {
        const oldState = store.getState().present;
        store.dispatch({ type: 'SET_SELECTED_TABLE_CELL_ID', cellId });
        const stateCellSelected = store.getState().present;
        const newState = reducer(stateCellSelected, types.removeTableColumn());
        const check_kept = check_kept_factory(state.org.present, newState);

        [0, 1, 2].forEach((i) => {
          expect(firstTable(newState, path).getIn(['contents', i, 'contents']).size).toEqual(
            firstTable(oldState, path).getIn(['contents', i, 'contents']).size - 1
          );
          expect(firstTable(newState, path).getIn(['contents', i, 'contents', 1])).toEqual(
            firstTable(oldState, path).getIn(['contents', i, 'contents', 2])
          );
          check_kept((st) => firstTable(st, path).getIn(['contents', i, 'contents', 0]));
        });
        check_kept((st) => firstTable(st, path).get('contents').size);
      });

      it('should just dirty on remove with no cell selected', () => {
        check_just_dirtying(store.getState().present, types.removeTableColumn());
      });

      it('is undoable', () => {
        check_is_undoable_on_table(store, path, cellId, types.removeTableColumn());
      });
    });

    describe('REMOVE_TABLE_ROW', () => {
      it('should handle REMOVE_TABLE_ROW', () => {
        const oldState = store.getState().present;
        store.dispatch({ type: 'SET_SELECTED_TABLE_CELL_ID', cellId });
        const stateCellSelected = store.getState().present;
        const newState = reducer(stateCellSelected, types.removeTableRow());
        const check_kept = check_kept_factory(state.org.present, newState);

        expect(firstTable(newState, path).getIn(['contents']).size).toEqual(
          firstTable(oldState, path).getIn(['contents']).size - 1
        );

        expect(firstTable(newState, path).getIn(['contents', 1])).toEqual(
          firstTable(oldState, path).getIn(['contents', 2])
        );

        check_kept((st) => firstTable(st, path).getIn(['contents', 0]));
      });

      it('should just dirty on remove with no cell selected', () => {
        check_just_dirtying(store.getState().present, types.removeTableRow());
      });

      it('is undoable', () => {
        check_is_undoable_on_table(store, path, cellId, types.removeTableRow());
      });
    });

    describe('ADD_NEW_TABLE_COLUMN', () => {
      it('should handle ADD_NEW_TABLE_COLUMN', () => {
        const oldState = store.getState().present;
        store.dispatch({ type: 'SET_SELECTED_TABLE_CELL_ID', cellId });
        const stateCellSelected = store.getState().present;
        const newState = reducer(stateCellSelected, types.addNewTableColumn());
        const check_kept = check_kept_factory(state.org.present, newState);

        [0, 1, 2].forEach((i) => {
          expect(firstTable(newState, path).getIn(['contents', i, 'contents']).size).toEqual(
            firstTable(oldState, path).getIn(['contents', i, 'contents']).size + 1
          );
          expect(firstTable(newState, path).getIn(['contents', i, 'contents', 3])).toEqual(
            firstTable(oldState, path).getIn(['contents', i, 'contents', 2])
          );
          check_kept((st) => firstTable(st, path).getIn(['contents', i, 'contents', 0]));
          check_kept((st) => firstTable(st, path).getIn(['contents', i, 'contents', 1]));
        });
        check_kept((st) => firstTable(st, path).get('contents').size);
      });

      it('should just dirty on add with no cell selected', () => {
        check_just_dirtying(store.getState().present, types.addNewTableColumn());
      });

      it('is undoable', () => {
        check_is_undoable_on_table(store, path, cellId, types.addNewTableColumn());
      });
    });

    describe('ADD_NEW_TABLE_ROW', () => {
      it('should handle ADD_NEW_TABLE_ROW', () => {
        const oldState = store.getState().present;
        store.dispatch({ type: 'SET_SELECTED_TABLE_CELL_ID', cellId });
        const stateCellSelected = store.getState().present;
        const newState = reducer(stateCellSelected, types.addNewTableRow());
        const check_kept = check_kept_factory(state.org.present, newState);

        check_kept((st) => firstTable(st, path).getIn(['contents', 0]));
        check_kept((st) => firstTable(st, path).getIn(['contents', 1]));
        expect(firstTable(newState, path).getIn(['contents', 3])).toEqual(
          firstTable(oldState, path).getIn(['contents', 2])
        );
        expect(firstTable(newState, path).getIn(['contents']).size).toEqual(
          firstTable(oldState, path).getIn(['contents']).size + 1
        );
      });

      it('should just dirty on add with no cell selected', () => {
        check_just_dirtying(store.getState().present, types.addNewTableRow());
      });

      it('is undoable', () => {
        check_is_undoable_on_table(store, path, cellId, types.addNewTableRow());
      });
    });
  });

  describe('NARROW_HEADER', () => {
    let state;
    const headerId = generateId();
    const path = 'testfile';

    beforeEach(() => {
      state = readInitialState();
      state.org.present = state.org.present
        .update('files', (files) => files.set(path, Map()))
        .set('path', path);
    });

    it('should handle NARROW_HEADER', () => {
      const newState = reducer(state.org.present, types.narrowHeader(headerId));
      expect(newState.getIn(['files', path, 'narrowedHeaderId'])).toEqual(headerId);
    });
  });

  describe('SET_DIRTY', () => {
    const path = 'testfile';
    let state;

    beforeEach(() => {
      state = readInitialState();
      state.org.present = state.org.present.setIn(['files', path], Map()).set('path', path);
    });

    it('should handle SET_DIRTY', () => {
      const dirtyState = reducer(state.org.present, types.dirtyAction(true, path));
      expect(dirtyState.getIn(['files', path, 'isDirty'])).toEqual(true);
      const cleanState = reducer(dirtyState, types.dirtyAction(false, path));
      expect(cleanState.getIn(['files', path, 'isDirty'])).toEqual(false);
    });
  });

  describe('APPLY_OPENNESS_STATE', () => {
    let state;
    const testOrgFile = readFixture('main_test_file');
    const path = 'testfile';
    let opennessState = fromJS({
      [path]: [['Top level header', 'A nested header'], ['A header with various links as content']],
    });

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
    });

    it('should handle APPLY_OPENNESS_STATE', () => {
      const stateWithOpenness = state.org.present.set('opennessState', opennessState);
      const newState = reducer(stateWithOpenness, types.applyOpennessState(path));

      expect(
        headerWithPath(
          newState.getIn(['files', path, 'headers']),
          fromJS(['Top level header'])
        ).get('opened')
      ).toEqual(true);
      expect(
        headerWithPath(
          newState.getIn(['files', path, 'headers']),
          fromJS(['Top level header', 'A todo item with schedule and deadline'])
        ).get('opened')
      ).toEqual(false);
      expect(
        headerWithPath(
          newState.getIn(['files', path, 'headers']),
          fromJS(['Another top level header'])
        ).get('opened')
      ).toEqual(false);
      expect(
        headerWithPath(
          newState.getIn(['files', path, 'headers']),
          fromJS(['A header with tags'])
        ).get('opened')
      ).toEqual(false);
      expect(
        headerWithPath(
          newState.getIn(['files', path, 'headers']),
          fromJS(['A header with various links as content'])
        ).get('opened')
      ).toEqual(true);
    });

    it('should do nothing when no openness state is set', () => {
      const oldState = state.org.present;
      const newState = reducer(oldState, types.applyOpennessState(path));
      expect(newState).toEqual(oldState);
    });

    it('should do nothing when no openness state is set for the file', () => {
      const stateWithOpenness = state.org.present.setIn(['opennessState', path], fromJS({}));
      const newState = reducer(stateWithOpenness, types.applyOpennessState(path));
      expect(newState).toEqual(stateWithOpenness);
    });
  });

  describe('EXIT_EDIT_MODE', () => {
    let state;
    const path = 'testfile';

    beforeEach(() => {
      state = readInitialState();
      state.org.present = state.org.present
        .update('files', (files) => files.set(path, Map()))
        .set('path', path);
    });

    it('should handle EXIT_EDIT_MODE', () => {
      const editState = reducer(state.org.present, types.enterEditMode('description'));
      expect(editState.getIn(['files', path, 'editMode'])).toEqual('description');
      const nonEditState = reducer(editState, types.exitEditMode());
      expect(nonEditState.getIn(['files', path, 'editMode'])).toBeNull();
    });
  });

  describe('SET_SEARCH_FILTER_INFORMATION', () => {
    let headerId;
    let state;
    const testOrgFile = readFixture('nested_header');
    const path = 'testfile';
    const validFilter = 'header';
    const invalidFilter = ':';

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
      headerId = state.org.present.getIn(['files', path, 'headers']).get(1).get('id');
    });

    it('should handle valid search filter', () => {
      const oldState = selectHeader(state.org.present, headerId);
      const action = types.setSearchFilterInformation(validFilter, 0, 'refile');
      const newState = reducer(oldState, action);

      expect(newState.getIn(['search', 'searchFilter'])).toEqual(validFilter);
      expect(newState.getIn(['search', 'searchFilterValid'])).toEqual(true);
      expect(
        newState
          .getIn(['search', 'filteredHeaders', path])
          .map((hdr) => hdr.getIn(['titleLine', 'rawTitle']))
          .toJS()
      ).toEqual(['Top level header', 'A second nested header']);

      const check_kept = check_kept_factory(oldState, newState);
      check_kept((st) => st.getIn(['files', path, 'headers']));
    });

    it('should ignore invalid search filter', () => {
      const oldState = selectHeader(state.org.present, headerId);
      const action = types.setSearchFilterInformation(invalidFilter, 0, 'refile');
      const newState = reducer(oldState, action);

      expect(newState.getIn(['search', 'searchFilter'])).toEqual(invalidFilter);
      expect(newState.getIn(['search', 'searchFilterValid'])).toEqual(false);
      const check_kept = check_kept_factory(oldState, newState);
      check_kept((st) => st.getIn(['files', path, 'headers']));
    });
  });

  describe('show clock display', () => {
    let state;
    const testOrgFile = readFixture('clock_entries');
    const path = 'testfile';

    beforeEach(() => {
      state = setUpStateForFile(path, testOrgFile);
    });

    it('sets no `totalTimeLogged` for headers without clock entries', () => {
      const header = state.org.present.getIn(['files', path, 'headers']).get(0);
      expect(header.get('totalTimeLogged')).toEqual(0);
    });

    it('sets a `totalTimeLogged` for headers with clock entries within LOGBOOK', () => {
      const header = state.org.present.getIn(['files', path, 'headers']).get(1);
      expect(header.get('totalTimeLogged')).toEqual(25200000);
    });
  });

  describe('handle empty files', () => {
    it('creates a new first header in an empty file', () => {
      let path = 'testfile';
      const emptyOrgFile = readFixture('empty_file');
      const state = setUpStateForFile(path, emptyOrgFile);

      // Empty file has no headers
      expect(state.org.present.getIn(['files', path, 'headers']).toJS()).toEqual([]);

      const newState = reducer(state.org.present, types.createFirstHeader());
      expect(
        newState.getIn(['files', path, 'headers']).get(0).getIn(['titleLine', 'rawTitle'])
      ).toEqual('First header');
    });

    it('embedds linesBeforeHeadings into the first headline', () => {
      let path = 'testfile';
      const emptyOrgFile = readFixture('content_but_no_headline');
      const state = setUpStateForFile(path, emptyOrgFile);

      expect(state.org.present.getIn(['files', path, 'linesBeforeHeadings']).toJS()).toEqual([
        'This is a legit Org mode file, yet it has not a single headline.',
      ]);

      const newState = reducer(state.org.present, types.createFirstHeader());
      // Create new header
      expect(
        newState.getIn(['files', path, 'headers']).get(0).getIn(['titleLine', 'rawTitle'])
      ).toEqual('First header');

      // Move all linesBeforeHeadings under said header
      expect(newState.getIn(['files', path, 'headers']).get(0).getIn(['rawDescription'])).toEqual(
        'This is a legit Org mode file, yet it has not a single headline.'
      );

      // Old linesBeforeHeadings are gone
      expect(newState.getIn(['files', path, 'linesBeforeHeadings']).toJS()).toEqual([]);
    });
  });
});
