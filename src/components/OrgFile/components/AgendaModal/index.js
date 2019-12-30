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

class AgendaModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleTimeframeTypeChange',
      'handleNextDateClick',
      'handlePreviousDateClick',
      'handleHeaderClick',
      'handleToggleDateDisplayType',
    ]);

    this.state = {
      selectedDate: new Date(),
      timeframeType: 'Week',
      dateDisplayType: 'absolute',
    };
  }

  handleTimeframeTypeChange(timeframeType) {
    this.setState({ timeframeType });
  }

  handleNextDateClick() {
    const { selectedDate, timeframeType } = this.state;

    switch (timeframeType) {
      case 'Day':
        this.setState({ selectedDate: addDays(selectedDate, 1) });
        break;
      case 'Week':
        this.setState({ selectedDate: addWeeks(selectedDate, 1) });
        break;
      case 'Month':
        this.setState({ selectedDate: addMonths(selectedDate, 1) });
        break;
      default:
        return '';
    }
  }

  handleHeaderClick(headerId) {
    this.props.onClose();
    this.props.org.selectHeaderAndOpenParents(headerId);
  }

  handlePreviousDateClick() {
    const { selectedDate, timeframeType } = this.state;

    switch (timeframeType) {
      case 'Day':
        this.setState({ selectedDate: subDays(selectedDate, 1) });
        break;
      case 'Week':
        this.setState({ selectedDate: subWeeks(selectedDate, 1) });
        break;
      case 'Month':
        this.setState({ selectedDate: subMonths(selectedDate, 1) });
        break;
      default:
        return '';
    }
  }

  handleToggleDateDisplayType() {
    const { dateDisplayType } = this.state;

    this.setState({
      dateDisplayType: dateDisplayType === 'absolute' ? 'relative' : 'absolute',
    });
  }

  calculateTimeframeHeader() {
    const { selectedDate, timeframeType } = this.state;

    switch (timeframeType) {
      case 'Day':
        return format(selectedDate, 'MMMM do');
      case 'Week':
        const weekStart = startOfWeek(selectedDate);
        const weekEnd = addWeeks(weekStart, 1);
        return `${format(weekStart, 'MMM do')} - ${format(weekEnd, 'MMM do')} (W${format(
          weekStart,
          'w'
        )})`;
      case 'Month':
        return format(selectedDate, 'MMMM');
      default:
        return '';
    }
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
        <h2 className="agenda__title">Agenda</h2>

        <div className="agenda__tab-container">
          <TabButtons
            buttons={['Day', 'Week', 'Month']}
            selectedButton={timeframeType}
            onSelect={this.handleTimeframeTypeChange}
            useEqualWidthTabs
          />
        </div>

        <div className="agenda__timeframe-header-container">
          <i className="fas fa-chevron-left fa-lg" onClick={this.handlePreviousDateClick} />
          <div className="agenda__timeframe-header">{this.calculateTimeframeHeader()}</div>
          <i className="fas fa-chevron-right fa-lg" onClick={this.handleNextDateClick} />
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AgendaModal);
