import React from 'react';
import thunk from 'redux-thunk';

import readFixture from '../../../../../../test_helpers/index';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import rootReducer from '../../../../../reducers/';

import {
  setPath,
  parseFile,
  selectHeader,
  selectHeaderIndex,
  setSelectedDescriptionItemIndex,
  setSelectedTableId,
} from '../../../../../actions/org';
import { STATIC_FILE_PREFIX, getSelectedTable } from '../../../../../lib/org_utils';

import { Map, Set, fromJS, List } from 'immutable';
import { shuffle, first, trim, pipe, range, curry, take } from 'lodash/fp';
import { render, fireEvent, cleanup } from '@testing-library/react';
import TableCell from './index';

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
  const testHeaderIndex = 2;
  const testDescriptionItemIndex = 1;

  const randomArrayValue = pipe([shuffle, first]);
  const randomArrayIndex = pipe([range(0), randomArrayValue]);
  const twoRandomArrayIndices = pipe([range(0), shuffle, take(2)]);

  const getTableTotalColumnsCount = (table) => table.getIn(['contents', 0, 'contents']).size;
  const getTableTotalRowsCount = (table) => table.getIn(['contents']).size;

  let testStore,
    testCellRenderer,
    testListOfTableCellArguments,
    testFirstCell,
    testSecondCell,
    testTextOfFirstCell,
    testTextOfSecondCell;

  beforeEach(() => {
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

    const testTable = getSelectedTable(testStore.getState());

    const testTableContents = testTable.get('contents');
    const testTableTotalRows = getTableTotalRowsCount(testTable);
    const testTableTotalColumns = getTableTotalColumnsCount(testTable);

    const testRandomRowIndex = randomArrayIndex(testTableTotalRows);
    const testTableRowContents = testTableContents.get(testRandomRowIndex);
    testListOfTableCellArguments = testTableRowContents.get('contents').map((testCell, index) => {
      return {
        filePath: testFilePath,
        headerIndex: testHeaderIndex,
        descriptionItemIndex: testDescriptionItemIndex,
        cellId: testCell.get('id'),
        row: testRandomRowIndex,
        column: index,
      };
    });

    const [testFirstRandomColumnIndex, testSecondRandomColumnIndex] = twoRandomArrayIndices(
      testTableTotalColumns
    );

    testFirstCell = testTableContents.getIn([
      testRandomRowIndex,
      'contents',
      testFirstRandomColumnIndex,
    ]);
    testSecondCell = testTableContents.getIn([
      testRandomRowIndex,
      'contents',
      testSecondRandomColumnIndex,
    ]);

    testTextOfFirstCell = trim(testFirstCell.get('rawContents'));
    testTextOfSecondCell = trim(testSecondCell.get('rawContents'));

    const cellRenderer = curry((testStore, testListOfTableCellArguments) => {
      return render(
        <MemoryRouter keyLength={0} initialEntries={['/file/dir1/dir2/fixtureTestFile.org']}>
          <Provider store={testStore}>
            <table>
              <tbody>
                <tr>
                  {testListOfTableCellArguments.map((testArgumentsObject, index) => (
                    <TableCell key={index} props={testArgumentsObject} />
                  ))}
                </tr>
              </tbody>
            </table>
          </Provider>
        </MemoryRouter>
      );
    });

    testCellRenderer = cellRenderer(testStore);
  });

  test('Render table cell then select two cells', () => {
    expect(document.querySelector('.table-part__cell.table-part__cell--selected')).toBeFalsy();
    const { getByText } = testCellRenderer(testListOfTableCellArguments);

    fireEvent.click(getByText(testTextOfFirstCell));

    expect(document.querySelector('.table-part__cell.table-part__cell--selected')).toBeTruthy();
    const actualTextOfFirstCell = trim(
      document.querySelector('.table-part__cell.table-part__cell--selected').textContent
    );

    expect(actualTextOfFirstCell).toBe(testTextOfFirstCell);

    const expectedFirstSelectedTableCellId = testFirstCell.get('id');
    const actualFirstSelectedTableCellId = testStore
      .getState()
      .org.present.getIn(['files', testFilePath, 'selectedTableCellId']);

    expect(actualFirstSelectedTableCellId).toBe(expectedFirstSelectedTableCellId);

    fireEvent.click(getByText(testTextOfSecondCell));

    expect(document.querySelector('.table-part__cell.table-part__cell--selected')).toBeTruthy();
    const actualTextOfSecondCell = trim(
      document.querySelector('.table-part__cell.table-part__cell--selected').textContent
    );

    expect(actualTextOfSecondCell).toBe(testTextOfSecondCell);

    const expectedSecondSelectedTableCellId = testSecondCell.get('id');
    const actualSecondSelectedTableCellId = testStore
      .getState()
      .org.present.getIn(['files', testFilePath, 'selectedTableCellId']);

    expect(actualSecondSelectedTableCellId).toBe(expectedSecondSelectedTableCellId);
  });
});
