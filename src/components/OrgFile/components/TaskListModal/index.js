import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import AgendaDay from './components/AgendaDay';
import Drawer from '../../../UI/Drawer';

import * as orgActions from '../../../../actions/org';

import _ from 'lodash';
import {
  addDays,
  startOfMonth,
  getDaysInMonth,
} from 'date-fns';
import format from 'date-fns/format';

class TaskListModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleHeaderClick',
      'handleToggleDateDisplayType',
      'handleFilterChange',
    ]);

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
    this.setState({ filterString: event.target.value });
    console.log(this.state.filterString);
    // TODO state hinkt immer eins hinterher!
  }

  render() {
    const {
      onClose,
      headers,
      todoKeywordSets,
      agendaDefaultDeadlineDelayValue,
      agendaDefaultDeadlineDelayUnit,
    } = this.props;
    const { selectedDate, dateDisplayType } = this.state;

    let dates = [];
    const monthStart = startOfMonth(selectedDate);
    dates = _.range(getDaysInMonth(selectedDate)).map(daysAfter =>
      addDays(monthStart, daysAfter)
    );

    const date = new Date();

    const filterSuggestions = ['test'];
    const text = filterSuggestions[0];
    const i = 0;

    return (
      <Drawer onClose={onClose}>
        <h2 className="agenda__title">Task list</h2>

        <datalist id="datalist-filter">
          <option value={text} key={i} />
        </datalist>

        <div className="agenda__tab-container">
          <input
            type="text"
            placeholder="e.g. TODO|FIXME doc :simple|easy :assignee:nobody|none"
            list="datalist-filter"
            onChange={this.handleFilterChange}
          />
        </div>

        <div className="agenda__days-container">
          <AgendaDay
            key={format(date, 'yyyy MM dd')}
            date={date}
            headers={headers}
            onHeaderClick={this.handleHeaderClick}
            todoKeywordSets={todoKeywordSets}
            dateDisplayType={dateDisplayType}
            onToggleDateDisplayType={this.handleToggleDateDisplayType}
            agendaDefaultDeadlineDelayValue={agendaDefaultDeadlineDelayValue}
            agendaDefaultDeadlineDelayUnit={agendaDefaultDeadlineDelayUnit}
          />
        </div>

        <br />
      </Drawer>
    );
  }
}

const mapStateToProps = state => ({
  todoKeywordSets: state.org.present.get('todoKeywordSets'),
  agendaDefaultDeadlineDelayValue: state.base.get('agendaDefaultDeadlineDelayValue') || 5,
  agendaDefaultDeadlineDelayUnit: state.base.get('agendaDefaultDeadlineDelayUnit') || 'd',
});

const mapDispatchToProps = dispatch => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(TaskListModal);
