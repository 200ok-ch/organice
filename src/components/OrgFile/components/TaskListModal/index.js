import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import AgendaDay from './components/AgendaDay';
import Drawer from '../../../UI/Drawer';

import {
  isMatch,
  computeCompletionsForDatalist,
} from '../../../../lib/headline_filter';

import { extractAllOrgTags, extractAllOrgProperties, extractAllTodoKeywords } from '../../../../lib/org_utils';

import parser from '../../../../lib/headline_filter_parser';

import * as orgActions from '../../../../actions/org';

import _ from 'lodash';
import { addDays, startOfMonth, getDaysInMonth } from 'date-fns';
import format from 'date-fns/format';

class TaskListModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleHeaderClick', 'handleToggleDateDisplayType', 'handleFilterChange']);

    this.state = {
      selectedDate: new Date(),
      dateDisplayType: 'absolute',
      filterString: '',
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

  handleFilterChange(event) {
    const filterString = event.target.value;
    const curserPosition = event.target.selectionStart;
    this.setState({ filterString, curserPosition });
  }

  render() {
    const { onClose, headers } = this.props;
    const { selectedDate, dateDisplayType } = this.state;

    let filterExpr = null;
    try {
      filterExpr = parser.parse(this.state.filterString);
    } catch (e) {
      console.log('filter expression invalid');
      console.log(e);
      // TODO highlight the input (syntax error)
    }

    let filteredHeaders = headers;
    if (filterExpr !== null) {
      filteredHeaders = this.props.headers.filter(header => {
        return isMatch(filterExpr)(header);
      });
    }

    const date = new Date();

    const todoKeywords = extractAllTodoKeywords(headers).toJS();
    const tagNames = extractAllOrgTags(headers).toJS();
    const allProperties = extractAllOrgProperties(headers).toJS();
    const filterSuggestions = computeCompletionsForDatalist(
      todoKeywords,
      tagNames,
      allProperties
    )(this.state.filterString, this.state.curserPosition);

    return (
      <Drawer onClose={onClose}>
        <h2 className="agenda__title">Task list</h2>

        <datalist id="datalist-filter">
          {filterSuggestions.map((string, idx) => (
            <option key={idx} value={string} />
          ))}
        </datalist>

        <div className="agenda__days-container">
          <AgendaDay
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
            placeholder="e.g. TODO|FIXME doc :simple|easy :assignee:nobody|none"
            list="datalist-filter"
            onChange={this.handleFilterChange}
          />
        </div>

        <br />
      </Drawer>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(TaskListModal);
