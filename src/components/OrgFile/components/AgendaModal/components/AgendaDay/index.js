import React, { PureComponent, Fragment } from 'react';

import './stylesheet.css';

import TitleLine from '../../../TitleLine';

import {
  isTodoKeywordCompleted,
  customFormatDistanceToNow,
  getPlanningItemTypeText,
} from '../../../../../../lib/org_utils';
import {
  dateForTimestamp,
  subtractTimestampUnitFromDate,
  addTimestampUnitToDate,
} from '../../../../../../lib/timestamps';

import {
  format,
  isToday,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
  isEqual,
  isWithinInterval,
  isPast,
} from 'date-fns';
import classNames from 'classnames';
import { List } from 'immutable';

export default class AgendaDay extends PureComponent {
  handleHeaderClick(path, headerId) {
    return () => this.props.onHeaderClick(path, headerId);
  }

  render() {
    const {
      date,
      files,
      dateDisplayType,
      onToggleDateDisplayType,
      agendaDefaultDeadlineDelayValue,
      agendaDefaultDeadlineDelayUnit,
      orgHabitShowAllToday,
    } = this.props;

    const dateStart = startOfDay(date);
    const dateEnd = endOfDay(date);

    const planningItemsAndHeaders = this.getPlanningItemsAndHeaders({
      files,
      date,
      agendaDefaultDeadlineDelayValue,
      agendaDefaultDeadlineDelayUnit,
      dateStart,
      dateEnd,
      orgHabitShowAllToday,
    });

    return (
      <div className="agenda-day__container">
        <div className="agenda-day__title">
          {isToday(date) && <div className="agenda-day__today-indicator" />}
          <div className="agenda-day__title__day-name">{format(date, 'eeee')}</div>
          <div className="agenda-day__title__date">{format(date, 'MMMM do, yyyy')}</div>
        </div>

        <div className="agenda-day__headers-container">
          <div>
            {planningItemsAndHeaders.map(([planningItem, header]) => {
              const planningItemDate = dateForTimestamp(planningItem.get('timestamp'));
              const hasTodoKeyword = !!header.getIn(['titleLine', 'todoKeyword']);

              const dateClassName = classNames('agenda-day__header-planning-date', {
                'agenda-day__header-planning-date--overdue':
                  hasTodoKeyword && isPast(planningItemDate),
              });

              return (
                <div key={planningItem.get('id')} className="agenda-day__header-container">
                  <div className="agenda-day__header__planning-item-container">
                    <div className="agenda-day__header-planning-type">
                      {getPlanningItemTypeText(planningItem)}
                    </div>
                    <div className={dateClassName} onClick={onToggleDateDisplayType}>
                      {dateDisplayType === 'absolute'
                        ? format(planningItemDate, 'MM/dd')
                        : customFormatDistanceToNow(planningItemDate)}

                      {planningItem.getIn(['timestamp', 'startHour']) && (
                        <Fragment>
                          <br />
                          {format(planningItemDate, 'h:mma')}
                        </Fragment>
                      )}
                    </div>
                  </div>
                  <div className="agenda-day__header__header-container">
                    <TitleLine
                      header={header}
                      color="var(--base03)"
                      hasContent={false}
                      isSelected={false}
                      shouldDisableActions
                      shouldDisableExplicitWidth
                      onClick={this.handleHeaderClick(header.get('path'), header.get('id'))}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  getPlanningItemsAndHeaders({
    files,
    date,
    agendaDefaultDeadlineDelayValue,
    agendaDefaultDeadlineDelayUnit,
    dateStart,
    dateEnd,
    orgHabitShowAllToday,
  }) {
    const headers = List().concat(
      ...files
        .mapEntries(([path, file]) => [
          path,
          file.get('headers').map((header) => header.set('path', path)),
        ])
        .valueSeq()
    );
    const todoKeywordSets = files.map((file) => file.get('todoKeywordSets'));

    return headers
      .flatMap((header) => {
        const planningItemsforDate = header.get('planningItems').filter((planningItem) => {
          const timestamp = planningItem.get('timestamp');
          if (!timestamp.get('isActive')) {
            return false;
          }

          // Check if this is a habit
          const isHabit = header
            .get('propertyListItems')
            .some((item) => {
              const prop = item.get('property');
              const value = item.get('value');
              return (
                prop &&
                prop.toLowerCase() === 'style' &&
                value.some(
                  (v) => v.get('type') === 'text' && v.get('contents').trim() === 'habit'
                )
              );
            });

          // When org-habit-show-all-today is enabled and viewing today:
          // Show ALL habits (even if not scheduled or completed)
          if (orgHabitShowAllToday && isHabit && isToday(date)) {
            return true;
          }

          const planningItemDate = dateForTimestamp(timestamp);
          const todoKeyword = header.getIn(['titleLine', 'todoKeyword']);
          const isCompletedTodo =
            todoKeyword &&
            isTodoKeywordCompleted(todoKeywordSets.get(header.get('path')), todoKeyword);
          if (isCompletedTodo) {
            return false;
          }
          switch (planningItem.get('type')) {
            case 'DEADLINE':
              if (isToday(date)) {
                if (isBefore(planningItemDate, new Date())) {
                  return true;
                }
                const [delayValue, delayUnit] = timestamp.get('delayType')
                  ? [timestamp.get('delayValue'), timestamp.get('delayUnit')]
                  : [agendaDefaultDeadlineDelayValue, agendaDefaultDeadlineDelayUnit];
                const appearDate = subtractTimestampUnitFromDate(
                  planningItemDate,
                  delayValue,
                  delayUnit
                );
                return isAfter(date, appearDate) || isEqual(date, appearDate);
              } else {
                return isWithinInterval(planningItemDate, { start: dateStart, end: dateEnd });
              }
            case 'SCHEDULED':
              let appearDate = planningItemDate;
              if (timestamp.get('delayType')) {
                const hasBeenRepeated = header
                  .get('propertyListItems')
                  .some((propertyListItem) => propertyListItem.get('property') === 'LAST_REPEAT');
                if (timestamp.get('delayType') === '--' && !hasBeenRepeated) {
                  appearDate = addTimestampUnitToDate(
                    planningItemDate,
                    timestamp.get('delayValue'),
                    timestamp.get('delayUnit')
                  );
                }
              }
              if (isToday(date) && isAfter(date, appearDate)) {
                return true;
              }
              return isWithinInterval(appearDate, { start: dateStart, end: dateEnd });
            default:
              return isWithinInterval(planningItemDate, { start: dateStart, end: dateEnd });
          }
        });
        return planningItemsforDate.map((planningItem) => [planningItem, header]);
      })
      .sortBy(([planningItem]) => {
        const { startHour, startMinute, endHour, endMinute, month, day } = planningItem
          .get('timestamp')
          .toJS();
        return [startHour ? 0 : 1, startHour, startMinute, endHour, endMinute, month, day];
      });
  }
}
