import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import TaskListView from './components/TaskListView';
import Drawer from '../../../UI/Drawer';

import * as orgActions from '../../../../actions/org';

import _ from 'lodash';
import format from 'date-fns/format';

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
      selectedDate: new Date(),
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
    const { onClose, searchFilterSuggestions } = this.props;
    const { selectedDate, dateDisplayType } = this.state;

    const date = new Date();

    return (
      <Drawer onClose={onClose}>
        <h2 className="agenda__title">Task list</h2>

        <datalist id="agenda__datalist-filter">
          {searchFilterSuggestions.map((string, idx) => (
            <option key={idx} value={string} />
          ))}
        </datalist>

        <div className="agenda__days-container">
          <TaskListView
            key={format(date, 'yyyy MM dd')}
            date={date}
            onHeaderClick={this.handleHeaderClick}
            dateDisplayType={dateDisplayType}
            onToggleDateDisplayType={this.handleToggleDateDisplayType}
          />
        </div>

        <div>
          <input
            type="text"
            className="searchModal__filter-input"
            placeholder="e.g. TODO|FIXME doc :simple|easy :assignee:nobody|none"
            list="agenda__datalist-filter"
            onChange={this.handleFilterChange}
          />
        </div>
        <div className="agenda__tab-container">
          <input
            type="checkbox"
            id="checkbox-search-all-headers"
            onChange={this.handleSearchAllCheckboxChange}
          />
          <label htmlFor="checkbox-search-all-headers">Search all headlines</label>
        </div>

        <br />
      </Drawer>
    );
  }
}

const mapStateToProps = state => ({
  searchFilter: state.org.present.get('search').get('searchFilter'),
  searchFilterSuggestions: state.org.present.get('search').get('searchFilterSuggestions') || [''],
});

const mapDispatchToProps = dispatch => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskListModal);
