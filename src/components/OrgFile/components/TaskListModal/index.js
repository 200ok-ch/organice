import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import classNames from 'classnames';
import TaskListView from './components/TaskListView';

import { isMobileBrowser, isIos } from '../../../../lib/browser_utils';

import * as orgActions from '../../../../actions/org';

// INFO: SearchModal, AgendaModal and TaskListModal are very similar
// in structure and partially in logic. When changing one, consider
// changing all.
function TaskListModal(props) {
  const [dateDisplayType, setdateDisplayType] = useState('absolute');

  function handleHeaderClick(path, headerId) {
    props.onClose();
    props.org.selectHeaderAndOpenParents(path, headerId);
  }

  function handleToggleDateDisplayType() {
    setdateDisplayType(dateDisplayType === 'absolute' ? 'relative' : 'absolute');
  }

  function handleFilterChange(event) {
    props.org.setSearchFilterInformation(
      event.target.value,
      event.target.selectionStart,
      'task-list'
    );
  }

  const { searchFilter, searchFilterValid, searchFilterSuggestions } = props;

  return (
    <>
      <datalist id="task-list__datalist-filter">
        {searchFilterSuggestions.map((string, idx) => (
          <option key={idx} value={string} />
        ))}
      </datalist>

      <div className="task-list__input-container">
        <input
          type="text"
          value={searchFilter}
          // Rationale: See SearchModal: index.js
          autoFocus={!isIos()}
          className={classNames('textfield', 'task-list__filter-input', {
            'task-list__filter-input--invalid': !!searchFilter && !searchFilterValid,
          })}
          placeholder="e.g. -DONE doc|man :simple|easy :assignee:nobody|none"
          list="task-list__datalist-filter"
          onChange={handleFilterChange}
        />
      </div>

      <div
        className="task-list__headers-container"
        // On mobile devices, the Drawer already handles the touch
        // event. Hence, scrolling within the Drawers container does
        // not work with the same event. Therefore, we're just opting
        // to scroll the whole drawer. That's not the best UX. And a
        // better CSS juggler than me is welcome to improve on it.
        style={isMobileBrowser ? undefined : { overflow: 'auto' }}
      >
        <TaskListView
          onHeaderClick={handleHeaderClick}
          dateDisplayType={dateDisplayType}
          onToggleDateDisplayType={handleToggleDateDisplayType}
        />
      </div>
    </>
  );
}

const mapStateToProps = (state) => ({
  searchFilter: state.org.present.getIn(['search', 'searchFilter']) || '',
  searchFilterValid: state.org.present.getIn(['search', 'searchFilterValid']),
  searchFilterSuggestions: state.org.present.getIn(['search', 'searchFilterSuggestions']) || [],
});

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(TaskListModal);
