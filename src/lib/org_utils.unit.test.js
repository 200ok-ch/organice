import readFixture from '../../test_helpers/index';
import { parseOrg } from './parse_org.js';

import {
  setPath,
  parseFile,
  selectHeader,
  selectHeaderIndex,
  setSelectedDescriptionItemIndex,
  setSelectedTableId,
  setSelectedTableCellId,
} from '../actions/org';

import { fromJS, Map, List, Set } from 'immutable';
import { pipe, shuffle, first, range } from 'lodash/fp';
import format from 'date-fns/format';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from '../reducers/';
import {
  STATIC_FILE_PREFIX,
  extractAllOrgProperties,
  computeAllPropertyNames,
  computeAllPropertyValuesFor,
  headerWithPath,
  getTable,
  getSelectedTable,
  getTableCell,
} from './org_utils';

describe('Extracting and computing property names and values', () => {
  const testOrgFile = readFixture('properties_extended');
  const parsedFile = parseOrg(testOrgFile);
  const headers = parsedFile.get('headers');
  const allProperties = extractAllOrgProperties(headers);
  test('Did we got all properties?', () => {
    expect(allProperties.size).toEqual(8);
  });
  describe('Compute property names', () => {
    test('Computes distinct property names (alphabetical order)', () => {
      const result = computeAllPropertyNames(allProperties);
      expect(result.toJS()).toEqual(['bar', 'bay', 'baz', 'emptyprop', 'foo', 'foo2']);
    });
  });
  describe('Compute property values for a certain property', () => {
    test('Computes distinct property values for a property (alphabetical order)', () => {
      const result = computeAllPropertyValuesFor(allProperties, 'bar');
      expect(result.toJS()).toEqual(['xyz', 'zyx']);
    });
    test('Handles the case of empty values', () => {
      const result = computeAllPropertyValuesFor(allProperties, 'emptyprop');
      expect(result.toJS()).toEqual(['']);
    });
    test('Handles the case of no values for a non-existing property', () => {
      const result = computeAllPropertyValuesFor(allProperties, 'nonexisting');
      expect(result.isEmpty()).toBe(true);
    });
  });
});

describe('Find the headline at the end of the headline-path', () => {
  it('where the headline-path contains template variables as headlines', () => {
    // path to be traced: [today] > <today> > test
    const today = new Date();
    const inactiveTimestampAsHeadline = {
      planningItems: [],
      logBookEntries: [],
      opened: true,
      titleLine: {
        title: [
          {
            id: 7,
            type: 'timestamp',
            firstTimestamp: {
              month: format(today, 'MM'),
              dayName: format(today, 'eee'),
              isActive: false,
              day: format(today, 'dd'),
              year: format(today, 'yyyy'),
            },
            secondTimestamp: null,
          },
        ],
        rawTitle: `[${format(today, 'yyyy-MM-dd eee')}]`,
        tags: [],
      },
      propertyListItems: [],
      rawDescription: '',
      nestingLevel: 1,
      id: 8,
      description: [],
    };
    const activeTimestampAsHeadline = {
      planningItems: [
        {
          type: 'TIMESTAMP_TITLE',
          timestamp: {
            month: format(today, 'MM'),
            dayName: format(today, 'eee'),
            isActive: true,
            day: format(today, 'dd'),
            year: format(today, 'yyyy'),
          },
          id: 147,
        },
      ],
      logBookEntries: [],
      opened: true,
      titleLine: {
        title: [
          {
            id: 9,
            type: 'timestamp',
            firstTimestamp: {
              month: format(today, 'MM'),
              dayName: format(today, 'eee'),
              isActive: true,
              day: format(today, 'dd'),
              year: format(today, 'yyyy'),
            },
            secondTimestamp: null,
          },
        ],
        rawTitle: `<${format(today, 'yyyy-MM-dd eee')}>`,
        tags: [],
      },
      propertyListItems: [],
      rawDescription: '',
      nestingLevel: 2,
      id: 10,
      description: [],
    };
    const expectedHeadline = {
      planningItems: [],
      logBookEntries: [],
      opened: false,
      titleLine: {
        title: [
          {
            type: 'text',
            contents: 'test',
          },
        ],
        rawTitle: 'test',
        tags: [],
      },
      propertyListItems: [],
      rawDescription: '',
      nestingLevel: 3,
      id: 11,
      description: [],
    };
    const extraSiblingHeadline = {
      planningItems: [],
      logBookEntries: [],
      opened: false,
      titleLine: {
        title: [
          {
            type: 'text',
            contents: 'testnot',
          },
        ],
        rawTitle: 'testnot',
        tags: [],
      },
      propertyListItems: [],
      rawDescription: '',
      nestingLevel: 3,
      id: 200,
      description: [],
    };

    const headers = fromJS([
      inactiveTimestampAsHeadline,
      activeTimestampAsHeadline,
      expectedHeadline,
      extraSiblingHeadline,
    ]);
    const headerPath = fromJS(['%u', '%t', 'test']);

    expect(headerWithPath(headers, headerPath).toJS()).toStrictEqual(expectedHeadline);
  });
});

describe('Table Functions', () => {
  const testOrgFile = readFixture('multiple_tables');
  const testFilePath = STATIC_FILE_PREFIX + 'fixtureTestFile.org';
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

  const testStore = createStore(rootReducer, testBaseState, applyMiddleware(thunk));

  testStore.dispatch(parseFile(testFilePath, testOrgFile));
  testStore.dispatch(setPath(testFilePath));

  const testState = testStore.getState();

  const randomArrayValue = pipe([shuffle, first]);
  const randomArrayIndex = pipe([range(0), randomArrayValue]);

  const getTableTotalColumnsCount = (table) => table.getIn(['contents', 0, 'contents']).size;
  const getTableTotalRowsCount = (table) => table.getIn(['contents']).size;

  const testHeaderIndex = 5;
  const testHeaderId = testState.org.present.getIn([
    'files',
    testFilePath,
    'headers',
    testHeaderIndex,
    'id',
  ]);
  const testRandomDescriptionItemIndex = randomArrayValue([0, 2, 6]);
  const testTableId = testState.org.present.getIn([
    'files',
    testFilePath,
    'headers',
    testHeaderIndex,
    'description',
    testRandomDescriptionItemIndex,
    'id',
  ]);

  const testTable = testState.org.present.getIn([
    'files',
    testFilePath,
    'headers',
    testHeaderIndex,
    'description',
    testRandomDescriptionItemIndex,
  ]);

  const testTableContents = testTable.get('contents');
  const testTableTotalRows = testTableContents.size;
  const testTableTotalColumns = testTableContents.get('0').size;

  const testRandomRowIndex = randomArrayIndex(testTableTotalRows);
  const testRandomColumnIndex = randomArrayIndex(testTableTotalColumns);
  const testTableCell = testTableContents.getIn([
    testRandomRowIndex,
    'contents',
    testRandomColumnIndex,
  ]);
  const testTableCellId = testTableCell.get('id');

  testStore.dispatch(selectHeader(testHeaderId));
  testStore.dispatch(selectHeaderIndex(testHeaderIndex));

  testStore.dispatch(setSelectedDescriptionItemIndex(testRandomDescriptionItemIndex));
  testStore.dispatch(setSelectedTableId(testTableId));

  testStore.dispatch(setSelectedTableCellId(testTableCellId));

  test('getTable', () => {
    const actualTable = getTable(
      {
        filePath: testFilePath,
        headerIndex: testHeaderIndex,
        descriptionItemIndex: testRandomDescriptionItemIndex,
      },
      testStore.getState()
    );

    expect(Map.isMap(actualTable)).toBeTruthy();
    expect(getTableTotalRowsCount(actualTable)).toBeGreaterThan(0);
    expect(getTableTotalColumnsCount(actualTable)).toBeGreaterThan(0);
  });

  test('getSelectedTable', () => {
    const actualTable = getSelectedTable(testStore.getState());
    expect(actualTable.equals(testTable)).toBeTruthy();
  });

  test('getTableCell', () => {
    const testCellArguments = {
      filePath: testFilePath,
      headerIndex: testHeaderIndex,
      descriptionItemIndex: testRandomDescriptionItemIndex,
      row: testRandomRowIndex,
      column: testRandomColumnIndex,
    };
    const actualTableCell = getTableCell(testCellArguments, testStore.getState());
    expect(actualTableCell.equals(testTableCell)).toBeTruthy();
  });
});
