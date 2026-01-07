import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import classNames from 'classnames';
import { calculateHabitConsistency, HABIT_DEFAULTS } from '../../../../../../lib/org_utils';

import './stylesheet.css';

/**
 * HabitConsistencyGraph Component
 *
 * Displays the consistency graph for org-mode habits.
 * Shows a visual representation of habit completion over time
 * with color-coded status indicators matching Emacs org-mode.
 *
 * Color scheme (matching org-mode):
 * - Green: Completed on this day
 * - Blue: Not due yet (in grace period)
 * - Yellow: Due tomorrow
 * - Red: Overdue
 * - Empty: Not scheduled / future beyond window
 */
export default class HabitConsistencyGraph extends React.PureComponent {
  static propTypes = {
    header: PropTypes.object.isRequired,
    viewDate: PropTypes.instanceOf(Date),
    precedingDays: PropTypes.number,
    followingDays: PropTypes.number,
  };

  static defaultProps = {
    viewDate: new Date(),
    precedingDays: HABIT_DEFAULTS.PRECEDING_DAYS,
    followingDays: HABIT_DEFAULTS.FOLLOWING_DAYS,
  };

  render() {
    const { header, viewDate, precedingDays, followingDays } = this.props;

    const consistencyData = calculateHabitConsistency(header, viewDate, {
      precedingDays,
      followingDays,
    });

    if (!consistencyData || consistencyData.length === 0) {
      return null;
    }

    return (
      <div className="habit-consistency-graph">
        <div className="habit-consistency-graph__days">
          {consistencyData.map((dayData) => this.renderDay(dayData))}
        </div>
      </div>
    );
  }

  renderDay(dayData) {
    const { date, status } = dayData;
    const { viewDate } = this.props;

    const dayClassName = classNames('habit-consistency-graph__day', {
      'habit-consistency-graph__day--done': status === 'done',
      'habit-consistency-graph__day--future': status === 'future',
      'habit-consistency-graph__day--scheduled': status === 'scheduled',
      'habit-consistency-graph__day--overdue': status === 'overdue',
      'habit-consistency-graph__day--missed': status === 'missed',
      'habit-consistency-graph__day--due-soon': status === 'due-soon',
      'habit-consistency-graph__day--today': this.isToday(date, viewDate),
    });

    return (
      <div key={date.getTime()} className={dayClassName} title={this.getDayTooltip(date, status)}>
        {format(date, 'EEE')[0]}
      </div>
    );
  }

  isToday(date, viewDate) {
    return (
      date.getDate() === viewDate.getDate() &&
      date.getMonth() === viewDate.getMonth() &&
      date.getFullYear() === viewDate.getFullYear()
    );
  }

  getDayTooltip(date, status) {
    const dateStr = format(date, 'MMM d, yyyy');
    const statusText =
      {
        done: 'Completed',
        future: 'Not due yet',
        scheduled: 'Scheduled',
        overdue: 'Overdue',
        missed: 'Missed',
        'due-soon': 'Due tomorrow',
        'not-scheduled': 'Not scheduled',
      }[status] || status;

    return `${dateStr}: ${statusText}`;
  }
}
