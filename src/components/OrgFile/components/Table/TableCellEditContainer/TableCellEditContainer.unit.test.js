import React from 'react';
import thunk from 'redux-thunk';

import readFixture from '../../../../../../test_helpers/index';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import rootReducer from '../../../../../reducers/';
import { getCurrentTimestampAsText } from '../../../../../lib/timestamps';

import {
  setPath,
  parseFile,
  setSelectedTableCellId,
  enterEditMode,
  setSelectedTableId,
  selectHeader,
  selectHeaderIndex,
  setSelectedDescriptionItemIndex,
} from '../../../../../actions/org';
import { STATIC_FILE_PREFIX, getSelectedTable } from '../../../../../lib/org_utils';

import { Map, Set, fromJS, List } from 'immutable';
import { pipe, shuffle, range, first, curry, trim } from 'lodash/fp';
import { render, fireEvent, cleanup } from '@testing-library/react';
import TableCellEditContainer from './index';

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

describe('TableCellEditContainer tests', () => {
  const testOrgFile = readFixture('multiple_tables');
  const testFilePath = STATIC_FILE_PREFIX + 'fixtureTestFile.org';
  const testHeaderIndex = 0;
  const testDescriptionItemIndex = 0;

  const editCellContainerId = 'edit-cell-container';
  const expectedTimestamp = getCurrentTimestampAsText();

  const randomArrayValue = pipe([shuffle, first]);
  const randomArrayIndex = pipe([range(0), randomArrayValue]);

  const getTableTotalColumnsCount = (table) => table.getIn(['contents', 0, 'contents']).size;
  const getTableTotalRowsCount = (table) => table.getIn(['contents']).size;

  let testStore,
    testCellEditContainerRenderer,
    testIndexOfEmptyRow,
    testRandomIndexOfRowWithText,
    testRandomColumnIndex,
    testEmptyCell,
    testCellWithText;

  afterEach(cleanup);
  beforeEach(() => {
    // Set global variable which can also be read from application code
    window.testRunner = true;

    testStore = createStore(rootReducer, testBaseState, applyMiddleware(thunk));

    testStore.dispatch(parseFile(testFilePath, testOrgFile));
    testStore.dispatch(setPath(testFilePath));
    testStore.dispatch(enterEditMode('table'));

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

    const testTable = getSelectedTable(testStore.getState());
    const testTableContents = testTable.get('contents');
    const testTableTotalRows = getTableTotalRowsCount(testTable);
    const testTableTotalColumns = getTableTotalColumnsCount(testTable);

    testIndexOfEmptyRow = testTableTotalRows - 1;
    testRandomIndexOfRowWithText = randomArrayIndex(testIndexOfEmptyRow);
    testRandomColumnIndex = randomArrayIndex(testTableTotalColumns);

    testEmptyCell = testTableContents.getIn([
      testIndexOfEmptyRow,
      'contents',
      testRandomColumnIndex,
    ]);
    testCellWithText = testTableContents.getIn([
      testRandomIndexOfRowWithText,
      'contents',
      testRandomColumnIndex,
    ]);

    const cellEditContainerRenderer = curry((testStore, testText, testId) => {
      return render(
        <MemoryRouter keyLength={0} initialEntries={['/file/dir1/dir2/fixtureTestFile.org']}>
          <Provider store={testStore}>
            <TableCellEditContainer filePath={testFilePath} cellValue={testText} cellId={testId} />
          </Provider>
        </MemoryRouter>
      );
    });

    testCellEditContainerRenderer = cellEditContainerRenderer(testStore);
  });

  test('Enter text into empty cell', () => {
    const testCellId = testEmptyCell.get('id');
    const testCellText = testEmptyCell.get('rawContents');

    testStore.dispatch(setSelectedTableCellId(testCellId));

    const { getByTestId, getByText } = testCellEditContainerRenderer(testCellText, testCellId);
    expect(getByTestId(editCellContainerId)).toBeTruthy();
    const newValue = '200';
    fireEvent.change(getByTestId(editCellContainerId), { target: { value: newValue } });
    expect(getByText(newValue)).toBeTruthy();
  });

  test('Enter text into a full cell', () => {
    const testCellId = testCellWithText.get('id');
    const testCellText = testCellWithText.get('rawContents');
    testStore.dispatch(setSelectedTableCellId(testCellId));

    const { getByTestId, getByText } = testCellEditContainerRenderer(testCellText, testCellId);
    expect(getByText(trim(testCellText))).toBeTruthy();
    const newValue = 'Motz';
    fireEvent.change(getByTestId(editCellContainerId), { target: { value: newValue } });
    expect(getByText(newValue)).toBeTruthy();
  });

  test('Insert timestamp into a empty cell', () => {
    const testCellId = testEmptyCell.get('id');
    const testCellText = testEmptyCell.get('rawContents');
    testStore.dispatch(setSelectedTableCellId(testCellId));

    const { getByTestId, getByText } = testCellEditContainerRenderer(testCellText, testCellId);
    expect(getByTestId(editCellContainerId)).toBeTruthy();
    fireEvent.click(document.querySelector('.table-cell__insert-timestamp-button'));
    expect(getByText(expectedTimestamp)).toBeTruthy();
  });

  test('Insert timestamp into a full cell', () => {
    const testCellId = testCellWithText.get('id');
    const testCellText = testCellWithText.get('rawContents');
    testStore.dispatch(setSelectedTableCellId(testCellId));

    const { getByTestId } = testCellEditContainerRenderer(testCellText, testCellId);
    expect(getByTestId(editCellContainerId)).toBeTruthy();
    fireEvent.click(document.querySelector('.table-cell__insert-timestamp-button'));
    const expectedValue = `${expectedTimestamp}${testCellText}`;
    expect(getByTestId(editCellContainerId).value).toBe(expectedValue);
  });

  test('Confirm cell edit is dispatched on blur', () => {
    const testCellId = testCellWithText.get('id');
    const testCellText = testCellWithText.get('rawContents');
    testStore.dispatch(setSelectedTableCellId(testCellId));

    const { getByTestId } = testCellEditContainerRenderer(testCellText, testCellId);
    const newValue = 'Seymour';
    fireEvent.change(getByTestId(editCellContainerId), { target: { value: newValue } });

    fireEvent.blur(getByTestId(editCellContainerId));

    const actualUpdatedFile = testStore.getState().org.present.getIn(['files', testFilePath]);

    const actualEditModeValue = actualUpdatedFile.get('editMode');

    expect(actualEditModeValue).toBe(null);

    const actualUpdatedCellValue = actualUpdatedFile.getIn([
      'headers',
      testHeaderIndex,
      'description',
      testDescriptionItemIndex,
      'contents',
      testRandomIndexOfRowWithText,
      'contents',
      testRandomColumnIndex,
      'rawContents',
    ]);

    expect(actualUpdatedCellValue).toBe(newValue);
  });
});
