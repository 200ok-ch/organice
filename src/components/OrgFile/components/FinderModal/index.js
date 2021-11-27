import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import TabButtons from '../../../UI/TabButtons';
import TaskListModal from './components/TaskListModal';
import SearchModal from './components/SearchModal';
import QueryModal from './components/QueryModal';

import * as baseActions from '../../../../actions/base';
import * as orgActions from '../../../../actions/org';

function FinderModal(props) {
  const { finderTab, onClose, headers } = props;

  const [selectedQuery, setSelectedQuery] = useState(null);

  function handleTabChange(finderTab) {
    if (finderTab === 'Queries') {
      setSelectedQuery(null);
    }
    props.base.setFinderTab(finderTab);
  }

  function renderTab(finderTab) {
    switch (finderTab) {
      case 'Search':
        return <SearchModal context="search" onClose={onClose} />;
      case 'Task List':
        return <TaskListModal headers={headers} onClose={onClose} />;
      case 'Queries':
        return (
          <QueryModal
            onClose={onClose}
            selectedQuery={selectedQuery}
            setSelectedQuery={setSelectedQuery}
          />
        );
      default:
        return <h2>Error</h2>;
    }
  }

  return (
    <>
      <div className="agenda__tab-container">
        <TabButtons
          buttons={['Search', 'Task List', 'Queries']}
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
  return {
    finderTab: state.base.get('finderTab'),
  };
};

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
  base: bindActionCreators(baseActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(FinderModal);
