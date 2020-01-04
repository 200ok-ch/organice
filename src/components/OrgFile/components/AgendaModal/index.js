import React, { useState } from 'react';
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

// INFO: SearchModal, AgendaModal and TaskListModal are very similar
// in structure and partially in logic. When changing one, consider
// changing all.
function AgendaModal(props) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeframeType, setTimeframeType] = useState('Week');
  const [dateDisplayType, setDateDisplayType] = useState('absolute');

  function handleTimeframeTypeChange(timeframeType) {
    setTimeframeType(timeframeType);
  }

  function handleNextDateClick() {
    switch (timeframeType) {
      case 'Day':
        setSelectedDate(addDays(selectedDate, 1));
        break;
      case 'Week':
        setSelectedDate(addWeeks(selectedDate, 1));
        break;
      case 'Month':
        setSelectedDate(addMonths(selectedDate, 1));
        break;
      default:
        return '';
    }
  }

  function handleHeaderClick(headerId) {
    props.onClose();
    props.org.selectHeaderAndOpenParents(headerId);
  }

  function handlePreviousDateClick() {
    switch (timeframeType) {
      case 'Day':
        setSelectedDate(subDays(selectedDate, 1));
        break;
      case 'Week':
        setSelectedDate(subWeeks(selectedDate, 1));
        break;
      case 'Month':
        setSelectedDate(subMonths(selectedDate, 1));
        break;
      default:
        return '';
    }
  }

  function handleToggleDateDisplayType() {
    setDateDisplayType(dateDisplayType === 'absolute' ? 'relative' : 'absolute');
  }

  function calculateTimeframeHeader() {
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

  const {
    onClose,
    headers,
    todoKeywordSets,
    agendaDefaultDeadlineDelayValue,
    agendaDefaultDeadlineDelayUnit,
  } = props;

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
    <Drawer onClose={onClose} maxSize={true}>
      <h2 className="agenda__title">Agenda</h2>

      <div className="agenda__tab-container">
        <TabButtons
          buttons={['Day', 'Week', 'Month']}
          selectedButton={timeframeType}
          onSelect={handleTimeframeTypeChange}
          useEqualWidthTabs
        />
      </div>

      <div className="agenda__timeframe-header-container">
        <i className="fas fa-chevron-left fa-lg" onClick={handlePreviousDateClick} />
        <div className="agenda__timeframe-header">{calculateTimeframeHeader()}</div>
        <i className="fas fa-chevron-right fa-lg" onClick={handleNextDateClick} />
      </div>

      <div className="agenda__days-container">
        {dates.map(date => (
          <AgendaDay
            key={format(date, 'yyyy MM dd')}
            date={date}
            headers={headers}
            onHeaderClick={handleHeaderClick}
            todoKeywordSets={todoKeywordSets}
            dateDisplayType={dateDisplayType}
            onToggleDateDisplayType={handleToggleDateDisplayType}
            agendaDefaultDeadlineDelayValue={agendaDefaultDeadlineDelayValue}
            agendaDefaultDeadlineDelayUnit={agendaDefaultDeadlineDelayUnit}
          />
        ))}
      </div>

      <br />
    </Drawer>
  );
}

const mapStateToProps = state => ({
  todoKeywordSets: state.org.present.get('todoKeywordSets'),
  agendaDefaultDeadlineDelayValue: state.base.get('agendaDefaultDeadlineDelayValue') || 5,
  agendaDefaultDeadlineDelayUnit: state.base.get('agendaDefaultDeadlineDelayUnit') || 'd',
});

const mapDispatchToProps = dispatch => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(AgendaModal);
