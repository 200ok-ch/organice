import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import AgendaDay from './components/AgendaDay';
import TabButtons from '../../../UI/TabButtons';

import { isMobileBrowser } from '../../../../lib/browser_utils';
import * as baseActions from '../../../../actions/base';
import * as orgActions from '../../../../actions/org';
import { determineIncludedFiles } from '../../../../reducers/org';

import _ from 'lodash';
import {
  addDays,
  addWeeks,
  addMonths,
  getDay,
  subDays,
  subWeeks,
  subMonths,
  startOfWeek,
  startOfMonth,
  getDaysInMonth,
  format,
} from 'date-fns';

// INFO: SearchModal, AgendaModal and TaskListModal are very similar
// in structure and partially in logic. When changing one, consider
// changing all.
function AgendaModal(props) {
  const {
    files,
    todoKeywordSets,
    agendaTimeframe,
    agendaDefaultDeadlineDelayValue,
    agendaDefaultDeadlineDelayUnit,
    agendaStartOnWeekday,
  } = props;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateDisplayType, setDateDisplayType] = useState('absolute');

  const weekStartsOn = agendaStartOnWeekday < 0 ? getDay(selectedDate) : agendaStartOnWeekday;

  function handleTimeframeTypeChange(agendaTimeframe) {
    props.base.setAgendaTimeframe(agendaTimeframe);
  }

  function handleNextDateClick() {
    switch (agendaTimeframe) {
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

  function handleHeaderClick(path, headerId) {
    props.onClose();
    props.org.selectHeaderAndOpenParents(path, headerId);
  }

  function handlePreviousDateClick() {
    switch (agendaTimeframe) {
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
    switch (agendaTimeframe) {
      case 'Day':
        return format(selectedDate, 'MMMM do');
      case 'Week':
        const weekStart = startOfWeek(selectedDate, { weekStartsOn });
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

  let dates = [];
  switch (agendaTimeframe) {
    case 'Day':
      dates = [selectedDate];
      break;
    case 'Week':
      const weekStart = startOfWeek(selectedDate, { weekStartsOn });
      dates = _.range(7).map((daysAfter) => addDays(weekStart, daysAfter));
      break;
    case 'Month':
      const monthStart = startOfMonth(selectedDate);
      dates = _.range(getDaysInMonth(selectedDate)).map((daysAfter) =>
        addDays(monthStart, daysAfter)
      );
      break;
    default:
  }

  return (
    <>
      <h2 className="agenda__title">Agenda</h2>

      <div className="agenda__tab-container">
        <TabButtons
          buttons={['Day', 'Week', 'Month']}
          selectedButton={agendaTimeframe}
          onSelect={handleTimeframeTypeChange}
          useEqualWidthTabs
        />
      </div>

      <div className="agenda__timeframe-header-container">
        <i className="fas fa-chevron-left fa-lg" onClick={handlePreviousDateClick} />
        <div className="agenda__timeframe-header">{calculateTimeframeHeader()}</div>
        <i className="fas fa-chevron-right fa-lg" onClick={handleNextDateClick} />
      </div>

      <div
        className="agenda__days-container"
        style={isMobileBrowser ? undefined : { overflow: 'auto' }}
      >
        {dates.map((date) => (
          <AgendaDay
            key={format(date, 'yyyy MM dd')}
            date={date}
            files={files}
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
    </>
  );
}

const mapStateToProps = (state) => {
  const path = state.org.present.get('path');
  const file = state.org.present.getIn(['files', path]);
  const allFiles = state.org.present.get('files');
  const fileSettings = state.org.present.get('fileSettings');
  const agendaStartOnWeekday = state.base.get('agendaStartOnWeekday');
  return {
    files: determineIncludedFiles(allFiles, fileSettings, path, 'includeInAgenda', false),
    todoKeywordSets: file.get('todoKeywordSets'),
    agendaTimeframe: state.base.get('agendaTimeframe'),
    agendaDefaultDeadlineDelayValue: state.base.get('agendaDefaultDeadlineDelayValue') || 5,
    agendaDefaultDeadlineDelayUnit: state.base.get('agendaDefaultDeadlineDelayUnit') || 'd',
    agendaStartOnWeekday: agendaStartOnWeekday == null ? 1 : +agendaStartOnWeekday,
  };
};

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
  base: bindActionCreators(baseActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(AgendaModal);
