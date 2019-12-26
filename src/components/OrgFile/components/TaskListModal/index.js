import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import AgendaDay from './components/AgendaDay';
import Drawer from '../../../UI/Drawer';
import TabButtons from '../../../UI/TabButtons';

import * as orgActions from '../../../../actions/org';

import _ from 'lodash';
import {
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  startOfWeek,
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
    ]);

    this.state = {
      selectedDate: new Date(),
      timeframeType: 'Week',
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

  render() {
    const {
      onClose,
      headers,
      todoKeywordSets,
      agendaDefaultDeadlineDelayValue,
      agendaDefaultDeadlineDelayUnit,
    } = this.props;
    const { timeframeType, selectedDate, dateDisplayType } = this.state;

    let dates = [];
    switch (timeframeType) {
      case 'Day':
        dates = [selectedDate];
        break;
      case 'Week':
        const weekStart = startOfWeek(selectedDate);
        dates = _.range(7).map(daysAfter => addDays(weekStart, daysAfter));
        break;
      case 'Month':
        const monthStart = startOfMonth(selectedDate);
        dates = _.range(getDaysInMonth(selectedDate)).map(daysAfter =>
          addDays(monthStart, daysAfter)
        );
        break;
      default:
    }

    return (
      <Drawer onClose={onClose}>
        <h2 className="agenda__title">Task list</h2>

        <div className="agenda__tab-container">
          <input
            type="text"
            placeholder="e.g. TODO|FIXME doc :simple|easy :assignee:nobody|none"

          />
          <button>Bookmark filter</button>
        </div>

        <div className="agenda__days-container">
          {dates.map(date => (
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
          ))}
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
