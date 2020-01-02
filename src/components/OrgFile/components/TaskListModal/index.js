import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import classNames from 'classnames';
import TaskListView from './components/TaskListView';
import Drawer from '../../../UI/Drawer';

import * as orgActions from '../../../../actions/org';

function TaskListModal(props) {
  const [dateDisplayType, setdateDisplayType] = useState('absolute');

  function handleHeaderClick(headerId) {
    props.onClose();
    props.org.selectHeaderAndOpenParents(headerId);
  }

  function handleToggleDateDisplayType() {
    setdateDisplayType(dateDisplayType === 'absolute' ? 'relative' : 'absolute');
  }

  function handleSearchAllCheckboxChange(event) {
    props.org.setSearchAllHeadersFlag(event.target.checked);
  }

  function handleFilterChange(event) {
    props.org.setSearchFilterInformation(event.target.value, event.target.selectionStart);
  }

  const {
    onClose,
    searchFilter,
    searchFilterValid,
    searchFilterSuggestions,
    searchAllHeaders,
  } = props;

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
            'task-list__filter-input-invalid': !searchFilterValid,
          })}
          placeholder="e.g. -DONE doc|man :simple|easy :assignee:nobody|none"
          list="task-list__datalist-filter"
          onChange={handleFilterChange}
        />
        <div className="agenda__tab-container">
          <input
            type="checkbox"
            className="checkbox"
            // TODO: Why does the .checkbox css rule from the Checkbox
            // component apply for this input? If it is by accident,
            // can we duplicate/move the css class rule to base.css?
            checked={searchAllHeaders}
            id="task-list__checkbox-search-all-headers"
            data-testid="task-list__checkbox"
            onChange={handleSearchAllCheckboxChange}
          />
          <label className="label-for-checkbox" htmlFor="task-list__checkbox-search-all-headers">
            Search all headlines
          </label>
        </div>
      </div>

      <div className="task-list__headers-container">
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
  searchAllHeaders: state.org.present.getIn(['search', 'searchAllHeaders']) || false,
});

const mapDispatchToProps = dispatch => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(TaskListModal);
