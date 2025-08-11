import React from 'react';
import thunk from 'redux-thunk';
import readFixture from '../../../../../../../test_helpers/index';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import HeaderBar from '../../../../../HeaderBar';
import rootReducer from '../../../../../../reducers/';

import {
  setPath,
  parseFile,
  selectHeader,
  selectHeaderIndex,
  setSelectedDescriptionItemIndex,
  setSelectedTableId,
  setSelectedTableCellId,
} from '../../../../../../actions/org';
import { STATIC_FILE_PREFIX, getSelectedTable } from '../../../../../../lib/org_utils';

import { Map, Set, fromJS, List } from 'immutable';
import { shuffle, first, pipe, range, curry, add } from 'lodash/fp';
import { render, fireEvent, cleanup } from '@testing-library/react';
import TableActionButtons from './index';

import '@testing-library/jest-dom/extend-expect';

const capture = Map({ captureTemplates: [] });
const testBaseState = {
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
};

describe('TableCell tests', () => {
  afterEach(cleanup);

  const testOrgFile = readFixture('multiple_tables');
  const testFilePath = STATIC_FILE_PREFIX + 'fixtureTestFile.org';
  const testHeaderIndex = 5;
  const testDescriptionItemIndex = 2;

  const addOne = add(1);
  const minusOne = add(-1);
  const randomArrayValue = pipe([shuffle, first]);
  const randomArrayIndex = pipe([range(0), randomArrayValue]);
  const randomArrayIndexFromOne = pipe([range(1), randomArrayValue]);
  const randomArrayIndexMinusLastIndex = pipe([minusOne, range(0), randomArrayValue]);

  const getTableTotalColumnsCount = (table) => table.getIn(['contents', 0, 'contents']).size;
  const getTableTotalRowsCount = (table) => table.getIn(['contents']).size;

  const getContentOfTableColumn = curry((columnIndex, table) => {
    return table.get('contents').map((row) => {
      return row.getIn(['contents', columnIndex]);
    });
  });

  const getContentOfTableRow = curry((rowIndex, table) => {
    return table.getIn(['contents', rowIndex]);
  });

  let testStore,
    testTableActionsRenderer,
    testRandomRowIndex,
    testRandomColumnIndex,
    testTable,
    testTableContents,
    testTableTotalRows,
    testTableTotalColumns,
    testCell;

  beforeEach(() => {
    window.testRunner = true;

    testStore = createStore(rootReducer, testBaseState, applyMiddleware(thunk));

    testStore.dispatch(parseFile(testFilePath, testOrgFile));
    testStore.dispatch(setPath(testFilePath));

    const testState = testStore.getState();
    const testHeaderId = testState.org.present.getIn([
      'files',
      testFilePath,
      'headers',
      testHeaderIndex,
      'id',
    ]);
    const testTableId = testState.org.present.getIn([
      'files',
      testFilePath,
      'headers',
      testHeaderIndex,
      'description',
      testDescriptionItemIndex,
      'id',
    ]);

    testStore.dispatch(setSelectedTableId(testTableId));
    testStore.dispatch(selectHeader(testHeaderId));
    testStore.dispatch(selectHeaderIndex(testHeaderIndex));
    testStore.dispatch(setSelectedDescriptionItemIndex(testDescriptionItemIndex));

    testTable = getSelectedTable(testStore.getState());

    testTableContents = testTable.get('contents');
    testTableTotalRows = getTableTotalRowsCount(testTable);
    testTableTotalColumns = getTableTotalColumnsCount(testTable);

    testRandomRowIndex = randomArrayIndex(testTableTotalRows);

    testRandomColumnIndex = randomArrayIndex(testTableTotalColumns);
    testCell = testTableContents.getIn([testRandomRowIndex, 'contents', testRandomColumnIndex]);

    testStore.dispatch(setSelectedTableCellId(testCell.get('id')));

    const tableActionsRenderer = curry((testStore, testFilePath) => {
      return render(
        <MemoryRouter keyLength={0} initialEntries={['/file/dir1/dir2/fixtureTestFile.org']}>
          <Provider store={testStore}>
            <HeaderBar />
            <TableActionButtons filePath={testFilePath} />
          </Provider>
        </MemoryRouter>
      );
    });

    testTableActionsRenderer = tableActionsRenderer(testStore);
  });

  test('Test edit-cell-button', () => {
    const { getByTestId } = testTableActionsRenderer(testFilePath);
    fireEvent.click(getByTestId('edit-cell-button'));
    const inTableEditMode =
      testStore.getState().org.present.getIn(['files', testFilePath, 'editMode']) === 'table';
    expect(inTableEditMode).toBeTruthy();
  });

  describe('Column Tests', () => {
    test('Test add-column-button', () => {
      const { getByTestId } = testTableActionsRenderer(testFilePath);
      fireEvent.click(getByTestId('add-column-button'));
      const actualTable = getSelectedTable(testStore.getState());
      const actualColumnsCount = getTableTotalColumnsCount(actualTable);
      expect(actualColumnsCount).toEqual(addOne(testTableTotalColumns));
    });

    test('Test delete-column-button', () => {
      const { getByTestId } = testTableActionsRenderer(testFilePath);
      fireEvent.click(getByTestId('delete-column-button'));
      const actualTable = getSelectedTable(testStore.getState());
      const actualColumnsCount = getTableTotalColumnsCount(actualTable);
      expect(actualColumnsCount).toEqual(minusOne(testTableTotalColumns));
    });
  });

  describe('Row Tests', () => {
    test('Test add-row-button', () => {
      const { getByTestId } = testTableActionsRenderer(testFilePath);
      fireEvent.click(getByTestId('add-row-button'));
      const actualTable = getSelectedTable(testStore.getState());
      const actualRowsCount = getTableTotalRowsCount(actualTable);
      expect(actualRowsCount).toEqual(addOne(testTableTotalRows));
    });

    test('Test delete-row-button', () => {
      const { getByTestId } = testTableActionsRenderer(testFilePath);
      fireEvent.click(getByTestId('delete-row-button'));
      const actualTable = getSelectedTable(testStore.getState());
      const actualRowsCount = getTableTotalRowsCount(actualTable);
      expect(actualRowsCount).toEqual(minusOne(testTableTotalRows));
    });
  });

  describe('Movement Tests', () => {
    test('Test up-button', () => {
      const testRowIndex = randomArrayIndexFromOne(testTableTotalRows);
      const testCellToMoveUp = testTableContents.getIn([
        testRowIndex,
        'contents',
        testRandomColumnIndex,
      ]);
      testStore.dispatch(setSelectedTableCellId(testCellToMoveUp.get('id')));

      const actualRowBeforeMove = getContentOfTableRow(testRowIndex, testTable);
      const expectedRowIndexAfterMove = minusOne(testRowIndex);

      const { getByTestId } = testTableActionsRenderer(testFilePath);
      fireEvent.click(getByTestId('up-button'));

      const actualTable = getSelectedTable(testStore.getState());
      const actualRowAfterMove = getContentOfTableRow(expectedRowIndexAfterMove, actualTable);

      expect(actualRowAfterMove.equals(actualRowBeforeMove)).toBeTruthy();
    });

    test('Test left-button', () => {
      const testColumnIndex = randomArrayIndexFromOne(testTableTotalColumns);
      const testCellToMoveLeft = testTableContents.getIn([
        testRandomRowIndex,
        'contents',
        testColumnIndex,
      ]);
      testStore.dispatch(setSelectedTableCellId(testCellToMoveLeft.get('id')));

      const actualColumnBeforeMove = getContentOfTableColumn(testColumnIndex, testTable);
      const expectedColumnIndexAfterMove = minusOne(testColumnIndex);

      const { getByTestId } = testTableActionsRenderer(testFilePath);
      fireEvent.click(getByTestId('left-button'));

      const actualTable = getSelectedTable(testStore.getState());
      const actualColumnAfterMove = getContentOfTableColumn(
        expectedColumnIndexAfterMove,
        actualTable
      );
      expect(actualColumnAfterMove.equals(actualColumnBeforeMove)).toBeTruthy();
    });

    test('Test right-button', () => {
      const testColumnIndex = randomArrayIndexMinusLastIndex(testTableTotalColumns);
      const testCellToMoveLeft = testTableContents.getIn([
        testRandomRowIndex,
        'contents',
        testColumnIndex,
      ]);
      testStore.dispatch(setSelectedTableCellId(testCellToMoveLeft.get('id')));

      const actualColumnBeforeMove = getContentOfTableColumn(testColumnIndex, testTable);
      const expectedColumnIndexAfterMove = addOne(testColumnIndex);

      const { getByTestId } = testTableActionsRenderer(testFilePath);
      fireEvent.click(getByTestId('right-button'));

      const actualTable = getSelectedTable(testStore.getState());
      const actualColumnAfterMove = getContentOfTableColumn(
        expectedColumnIndexAfterMove,
        actualTable
      );
      expect(actualColumnAfterMove.equals(actualColumnBeforeMove)).toBeTruthy();
    });

    test('Test down-button', () => {
      const testRowIndex = randomArrayIndexMinusLastIndex(testTableTotalRows);
      const testCellToMoveUp = testTableContents.getIn([
        testRowIndex,
        'contents',
        testRandomColumnIndex,
      ]);
      testStore.dispatch(setSelectedTableCellId(testCellToMoveUp.get('id')));

      const actualRowBeforeMove = getContentOfTableRow(testRowIndex, testTable);
      const expectedRowIndexAfterMove = addOne(testRowIndex);

      const { getByTestId } = testTableActionsRenderer(testFilePath);
      fireEvent.click(getByTestId('down-button'));

      const actualTable = getSelectedTable(testStore.getState());
      const actualRowAfterMove = getContentOfTableRow(expectedRowIndexAfterMove, actualTable);

      expect(actualRowAfterMove.equals(actualRowBeforeMove)).toBeTruthy();
    });
  });
});
