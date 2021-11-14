import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import TabButtons from '../../../UI/TabButtons';
import TaskListModal from '../TaskListModal';
import SearchModal from '../SearchModal';

import * as baseActions from '../../../../actions/base';
import * as orgActions from '../../../../actions/org';
import { determineIncludedFiles } from '../../../../reducers/org';

function FinderModal(props) {
  const { finderTab, onClose, headers, activeClocks } = props;

  function handleTabChange(finderTab) {
    props.base.setFinderTab(finderTab);
  }

  function renderTab(finderTab) {
    if (!activeClocks && finderTab === 'Clock List') {
      props.base.setFinderTab('Search');
      return;
    }
    switch (finderTab) {
      case 'Search':
        return <SearchModal context="Search" onClose={onClose} />;
      case 'Task List':
        return <TaskListModal headers={headers} onClose={onClose} />;
      case 'Clock List':
        return <SearchModal activeClocks={activeClocks} context="search" onClose={onClose} />;
      default:
        return <h2>Error</h2>;
    }
  }

  return (
    <>
      <div className="agenda__tab-container">
        <TabButtons
          buttons={activeClocks ? ['Search', 'Task List', 'Clock List'] : ['Search', 'Task List']}
          selectedButton={finderTab}
          onSelect={handleTabChange}
          useEqualWidthTabs
        />
      </div>
      {renderTab(finderTab)}
      <br />
    </>
  );
}

const mapStateToProps = (state) => {
  const path = state.org.present.get('path');
  const files = state.org.present.get('files');
  const fileSettings = state.org.present.get('fileSettings');
  const searchFiles = determineIncludedFiles(files, fileSettings, path, 'includeInSearch', false);
  const activeClocks = Object.values(
    searchFiles.map((f) => (f.get('headers').size ? f.get('activeClocks') : 0)).toJS()
  ).reduce((acc, val) => (typeof val === 'number' ? acc + val : acc), 0);
  return {
    finderTab: state.base.get('finderTab'),
    activeClocks,
  };
};

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
  base: bindActionCreators(baseActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(FinderModal);
