import React from 'react';
import thunk from 'redux-thunk';
import readFixture from '../../../../../test_helpers/index';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';

import rootReducer from '../../../../reducers/';

import {
  setPath,
  parseFile,
  selectHeader,
  selectHeaderIndex,
  setSelectedDescriptionItemIndex,
  setSelectedTableId,
  enterEditMode,
} from '../../../../actions/org';
import { getCurrentTimestampAsText } from '../../../../lib/timestamps';
import { STATIC_FILE_PREFIX, getSelectedTable } from '../../../../lib/org_utils';

import { Map, Set, fromJS, List } from 'immutable';
import { shuffle, first, trim, pipe, range, take, curry } from 'lodash/fp';
import { render, fireEvent, cleanup } from '@testing-library/react';
import Table from './index';

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

describe('Table tests', () => {
  afterEach(cleanup);

  const testOrgFile = readFixture('multiple_tables');
  const testFilePath = STATIC_FILE_PREFIX + 'fixtureTestFile.org';
  const testHeaderIndex = 2;
  const testDescriptionItemIndex = 1;

  const editCellContainerId = 'edit-cell-container';

  const randomArrayValue = pipe([shuffle, first]);
  const randomArrayIndex = pipe([range(0), randomArrayValue]);
  const threeRandomArrayIndices = pipe([range(0), shuffle, take(3)]);

  const getTableTotalColumnsCount = (table) => table.getIn(['contents', 0, 'contents']).size;
  const getTableTotalRowsCount = (table) => table.getIn(['contents']).size;

  let testStore,
    testTable,
    testTableRenderer,
    testTextOfFirstCell,
    testTextOfSecondCell,
    testTextOfThirdCell,
    testProps;

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

    const testTableContents = testTable.get('contents');
    const testTableTotalRows = getTableTotalRowsCount(testTable);
    const testTableTotalColumns = getTableTotalColumnsCount(testTable);

    const testRandomRowIndex = randomArrayIndex(testTableTotalRows);

    const [
      testFirstRandomColumnIndex,
      testSecondRandomColumnIndex,
      testThirdRandomColumnIndex,
    ] = threeRandomArrayIndices(testTableTotalColumns);

    const testFirstCell = testTableContents.getIn([
      testRandomRowIndex,
      'contents',
      testFirstRandomColumnIndex,
    ]);
    const testSecondCell = testTableContents.getIn([
      testRandomRowIndex,
      'contents',
      testSecondRandomColumnIndex,
    ]);
    const testThirdCell = testTableContents.getIn([
      testRandomRowIndex,
      'contents',
      testThirdRandomColumnIndex,
    ]);

    testTextOfFirstCell = trim(testFirstCell.get('rawContents'));
    testTextOfSecondCell = trim(testSecondCell.get('rawContents'));
    testTextOfThirdCell = trim(testThirdCell.get('rawContents'));

    const tableRenderer = curry((testStore, testProps) => {
      return render(
        <MemoryRouter keyLength={0} initialEntries={['/file/dir1/dir2/fixtureTestFile.org']}>
          <Provider store={testStore}>
            <Table props={testProps} />
          </Provider>
        </MemoryRouter>
      );
    });

    testTableRenderer = tableRenderer(testStore);
    testProps = {
      filePath: testFilePath,
      table: testTable,
      headerIndex: testHeaderIndex,
      descriptionItemIndex: testDescriptionItemIndex,
    };
  });

  test('Render table', () => {
    const { getByText } = testTableRenderer(testProps);
    testTable.get('contents').forEach((row) => {
      row.get('contents').forEach((cell) => {
        const expectedText = trim(cell.get('rawContents'));
        expect(getByText(expectedText)).toBeTruthy();
      });
    });
  });

  test('Render table cells, change text, then click on another cell', () => {
    const { getByText, getByTestId } = testTableRenderer(testProps);
    fireEvent.click(getByText(testTextOfFirstCell));

    fireEvent.click(getByText(testTextOfSecondCell));
    testStore.dispatch(enterEditMode('table'));

    const newValue = 'new';
    fireEvent.change(getByTestId(editCellContainerId), { target: { value: newValue } });

    expect(getByText(newValue)).toBeTruthy();
    expect(() => getByText(testTextOfSecondCell)).toThrowError();

    fireEvent.click(getByText(testTextOfThirdCell));
    expect(getByText(testTextOfFirstCell)).toBeTruthy();
  });

  test('Render table cells, add timestamp, then click on another cell', () => {
    const { getByText } = testTableRenderer(testProps);
    fireEvent.click(getByText(testTextOfFirstCell));
    fireEvent.click(getByText(testTextOfSecondCell));
    testStore.dispatch(enterEditMode('table'));

    fireEvent.click(document.querySelector('.table-cell__insert-timestamp-button'));
    const expectedTimestamp = getCurrentTimestampAsText();

    fireEvent.click(getByText(testTextOfThirdCell));

    // timestamp will be placed in a seperate AttributedString Element
    expect(getByText(expectedTimestamp)).toBeTruthy();
    expect(getByText(testTextOfSecondCell)).toBeTruthy();

    expect(getByText(testTextOfFirstCell)).toBeTruthy();
  });
});
