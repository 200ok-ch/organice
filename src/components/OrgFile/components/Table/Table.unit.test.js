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
} from '../../../../actions/org'
import { STATIC_FILE_PREFIX, getSelectedTable } from '../../../../lib/org_utils';


import { Map, Set, fromJS, List, is } from 'immutable';
import { shuffle, first, trim, pipe, range, take, curry } from "lodash/fp"
import { formatDistanceToNow } from 'date-fns';
import { render, fireEvent, cleanup } from '@testing-library/react';
import Table from "./index"

import '@testing-library/jest-dom/extend-expect';



const capture = Map({'captureTemplates': []});
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
      }

describe('TableCell tests', () => {

  afterEach(cleanup);
  
  const testOrgFile = readFixture("multiple_tables")
  const testFilePath = STATIC_FILE_PREFIX + 'fixtureTestFile.org'
  const testHeaderIndex = 2
  const testDescriptionItemIndex = 1
  
  const editCellContainerId = 'edit-cell-container';

   
  let testStore,
  testTable,
  testTableRenderer;

    beforeEach(() => {

    window.testRunner = true;

    
    testStore = createStore(
      rootReducer,
      testBaseState,
      applyMiddleware(thunk)
    );

      testStore.dispatch(parseFile(testFilePath, testOrgFile));
      testStore.dispatch(setPath(testFilePath));

      const testState = testStore.getState();      
      const testHeaderId = testState.org.present.getIn(["files", testFilePath, "headers", testHeaderIndex, "id"])
      const testTableId = testState.org.present.getIn(["files", testFilePath, "headers", testHeaderIndex, "description", testDescriptionItemIndex, "id"])

      testStore.dispatch(setSelectedTableId(testTableId));
      testStore.dispatch(selectHeader(testHeaderId));
      testStore.dispatch(selectHeaderIndex(testHeaderIndex));
      testStore.dispatch(setSelectedDescriptionItemIndex(testDescriptionItemIndex))

      testTable = getSelectedTable(testStore.getState())
      
                
      const tableRenderer = curry((testStore, testProps) => {
	return render(
	  <MemoryRouter keyLength={0} initialEntries={['/file/dir1/dir2/fixtureTestFile.org']}>
          <Provider store={testStore}>
	    <Table props={testProps}/>
          </Provider>
          </MemoryRouter>
	);
      })
      
      testTableRenderer = tableRenderer(testStore)
                
    });



  test('Render table', () => {


    const testProps = {
      filePath: testFilePath,
      table: testTable,
      headerIndex: testHeaderIndex,
      descriptionItemIndex: testDescriptionItemIndex}
    const {getByText} = testTableRenderer(testProps)
    testTable.get("contents").forEach((row) => {
      row.get("contents").forEach((cell) => {
	const expectedText = trim(cell.get("rawContents"))
	expect(getByText(expectedText)).toBeTruthy();
      })
    })
  });


})
  
