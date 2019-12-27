import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import TaskListView from './components/TaskListView';
import Drawer from '../../../UI/Drawer';

import { computeCompletionsForDatalist } from '../../../../lib/headline_filter';

import {
  extractAllOrgTags,
  extractAllOrgProperties,
  extractAllTodoKeywords,
} from '../../../../lib/org_utils';

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
    this.props.org.setSearchFilter(event.target.value);

    const curserPosition = event.target.selectionStart;
    this.setState({ curserPosition });
  }

  render() {
    const { onClose, headers, todoKeywordSets, searchFilterExpr, filteredHeaders } = this.props;
    const { selectedDate, dateDisplayType } = this.state;

    const date = new Date();

    // TODO: read from localStorage (the react way?)
    const lastUsedFitlerStrings = ['TODO :simple'];
    // TODO: insertOrUpdate list in localStorage with
    // this.state.filterString when modal becomes hidden/closed

    let filterSuggestions = lastUsedFitlerStrings;
    if (this.props.searchFilter !== '') {
      // TODO: use todoKeywordSets to complete ALL possible keywords;
      // delete redundant function extractAllTodoKeywords
      const todoKeywords = extractAllTodoKeywords(headers).toJS();
      const tagNames = extractAllOrgTags(headers).toJS();
      const allProperties = extractAllOrgProperties(headers).toJS();
      filterSuggestions = computeCompletionsForDatalist(
        todoKeywords,
        tagNames,
        allProperties
      )(this.props.searchFilter, this.state.curserPosition);
    }

    return (
      <Drawer onClose={onClose}>
        <h2 className="agenda__title">Task list</h2>

        <datalist id="datalist-filter">
          {filterSuggestions.map((string, idx) => (
            <option key={idx} value={string} />
          ))}
        </datalist>

        <div className="agenda__days-container">
          <TaskListView
            key={format(date, 'yyyy MM dd')}
            date={date}
            headers={filteredHeaders}
            onHeaderClick={this.handleHeaderClick}
            dateDisplayType={dateDisplayType}
            onToggleDateDisplayType={this.handleToggleDateDisplayType}
          />
        </div>

        <div className="agenda__tab-container">
          <input
            type="text"
            className="agenda__filter-input"
            placeholder="e.g. TODO|FIXME doc :simple|easy :assignee:nobody|none"
            list="datalist-filter"
            onChange={this.handleFilterChange}
          />
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
  todoKeywordSets: state.org.present.get('todoKeywordSets'),
  searchFilter: state.org.present.get('search').get('searchFilter'),
  searchFilterExpr: state.org.present.get('search').get('searchFilterExpr'),
  // When no filtering has happened, yet (initial state), use all headers.
  filteredHeaders:
    state.org.present.get('search').get('filteredHeaders') || state.org.present.get('headers'),
});

const mapDispatchToProps = dispatch => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(TaskListModal);
