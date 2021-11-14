import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import TabButtons from '../../../UI/TabButtons';
import TaskListModal from '../TaskListModal';
import SearchModal from '../SearchModal';

import * as baseActions from '../../../../actions/base';
import * as orgActions from '../../../../actions/org';

function FinderModal(props) {
  const { finderTab, onClose, headers } = props;

  function handleTabChange(tabTitle) {
    const finderTab = { Search: 'search', 'Task List': 'task-list' }[tabTitle];
    props.base.setFinderTab(finderTab);
  }

  function renderTab(finderTab) {
    switch (finderTab) {
      case 'search':
        return <SearchModal context="search" onClose={onClose} />;
      case 'task-list':
        return <TaskListModal headers={headers} onClose={onClose} />;
      default:
        return <h2>Error</h2>;
    }
  }

  return (
    <>
      <div className="agenda__tab-container">
        <TabButtons
          buttons={['Search', 'Task List']}
          selectedButton={{ search: 'Search', 'task-list': 'Task List' }[finderTab]}
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
