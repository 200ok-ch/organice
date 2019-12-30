import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import classNames from 'classnames';
import TaskListView from './components/TaskListView';
import Drawer from '../../../UI/Drawer';

import * as orgActions from '../../../../actions/org';

import _ from 'lodash';

class TaskListModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleHeaderClick',
      'handleToggleDateDisplayType',
      'handleFilterChange',
      'handleSearchAllCheckboxChange',
    ]);

    this.state = {
      dateDisplayType: 'absolute',
    };
  }

  handleHeaderClick(headerId) {
    this.props.onClose();
    this.props.org.selectHeaderAndOpenParents(headerId);
  }

  handleToggleDateDisplayType() {
    const { dateDisplayType } = this.state;

    this.setState({
      dateDisplayType: dateDisplayType === 'absolute' ? 'relative' : 'absolute',
    });
  }

  handleSearchAllCheckboxChange(event) {
    this.props.org.setSearchAllHeadersFlag(event.target.checked);
  }

  handleFilterChange(event) {
    this.props.org.setSearchFilterInformation(event.target.value, event.target.selectionStart);
  }

  render() {
    const {
      onClose,
      searchFilter,
      searchFilterValid,
      searchFilterSuggestions,
      searchAllHeaders,
    } = this.props;
    const { dateDisplayType } = this.state;

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
            onChange={this.handleFilterChange}
          />
          <div className="agenda__tab-container">
            <input
              type="checkbox"
              className="checkbox"
              // TODO: Why does the .checkbox css rule from the Checkbox component apply for this input? If it is by accident, can we duplicate/move the css class rule to base.css?
              checked={searchAllHeaders}
              id="task-list__checkbox-search-all-headers"
              onChange={this.handleSearchAllCheckboxChange}
            />
            <label className="label-for-checkbox" htmlFor="task-list__checkbox-search-all-headers">
              Search all headlines
            </label>
          </div>
        </div>

        <div className="task-list__headers-container">
          <TaskListView
            onHeaderClick={this.handleHeaderClick}
            dateDisplayType={dateDisplayType}
            onToggleDateDisplayType={this.handleToggleDateDisplayType}
          />
        </div>

        <br />
      </Drawer>
    );
  }
}

const mapStateToProps = state => ({
  searchFilter: state.org.present.getIn(['search', 'searchFilter']),
  searchFilterValid: state.org.present.getIn(['search', 'searchFilterValid']),
  searchFilterSuggestions: state.org.present.getIn(['search', 'searchFilterSuggestions']) || [],
  searchAllHeaders: state.org.present.getIn(['search', 'searchAllHeaders']),
});

const mapDispatchToProps = dispatch => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(TaskListModal);
