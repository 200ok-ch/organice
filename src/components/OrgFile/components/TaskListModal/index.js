import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import classNames from 'classnames';
import TaskListView from './components/TaskListView';
import Drawer from '../../../UI/Drawer';

import { isMobileBrowser } from '../../../../lib/browser_utils';

import * as orgActions from '../../../../actions/org';

// INFO: SearchModal, AgendaModal and TaskListModal are very similar
// in structure and partially in logic. When changing one, consider
// changing all.
function TaskListModal(props) {
  const [dateDisplayType, setdateDisplayType] = useState('absolute');

  function handleHeaderClick(headerId) {
    props.onClose();
    props.org.selectHeaderAndOpenParents(headerId);
  }

  function handleToggleDateDisplayType() {
    setdateDisplayType(dateDisplayType === 'absolute' ? 'relative' : 'absolute');
  }

  function handleFilterChange(event) {
    props.org.setSearchFilterInformation(event.target.value, event.target.selectionStart);
  }

  const { onClose, searchFilter, searchFilterValid, searchFilterSuggestions } = props;

  // On mobile devices, the Drawer already handles the touch event.
  // Hence, scrolling within the Drawers container does not work with
  // the same event. Therefore, we're just opting to scroll the whole
  // drawer. That's not the best UX. And a better CSS juggler than me
  // is welcome to improve on it.
  let taskListViewStyle = {
    overflow: (() => {
      return isMobileBrowser ? 'none' : 'auto';
    })(),
  };

  return (
    <Drawer onClose={onClose} maxSize={true}>
      <h2 className="agenda__title">Task list</h2>

      <datalist id="task-list__datalist-filter">
        {searchFilterSuggestions.map((string, idx) => (
          <option key={idx} value={string} />
        ))}
      </datalist>

      <div className="task-list__input-container">
        <input
          type="text"
          value={searchFilter}
          className={classNames('textfield', 'task-list__filter-input', {
            'task-list__filter-input--invalid': !!searchFilter && !searchFilterValid,
          })}
          placeholder="e.g. -DONE doc|man :simple|easy :assignee:nobody|none"
          list="task-list__datalist-filter"
          onChange={handleFilterChange}
        />
      </div>

      <div className="task-list__headers-container" style={taskListViewStyle}>
        <TaskListView
          onHeaderClick={handleHeaderClick}
          dateDisplayType={dateDisplayType}
          onToggleDateDisplayType={handleToggleDateDisplayType}
        />
      </div>

      <br />
    </Drawer>
  );
}

const mapStateToProps = state => ({
  searchFilter: state.org.present.getIn(['search', 'searchFilter']) || '',
  searchFilterValid: state.org.present.getIn(['search', 'searchFilterValid']),
  searchFilterSuggestions: state.org.present.getIn(['search', 'searchFilterSuggestions']) || [],
});

const mapDispatchToProps = dispatch => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskListModal);
