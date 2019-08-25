import React, { PureComponent, Fragment } from 'react';

import './stylesheet.css';

import TitleLine from '../../../TitleLine';

import { isTodoKeywordCompleted } from '../../../../../../lib/org_utils';
import {
  dateForTimestamp,
  subtractTimestampUnitFromDate,
  addTimestampUnitToDate,
} from '../../../../../../lib/timestamps';

import {
  isToday,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
  isEqual,
  isWithinInterval,
  isPast,
  formatDistance,
} from 'date-fns';
import formatDate from 'date-fns/format';
import classNames from 'classnames';

export default class AgendaDay extends PureComponent {
  handleHeaderClick(headerId) {
    return () => this.props.onHeaderClick(headerId);
  }

  render() {
    const {
      date,
      headers,
      todoKeywordSets,
      dateDisplayType,
      onToggleDateDisplayType,
      agendaDefaultDeadlineDelayValue,
      agendaDefaultDeadlineDelayUnit,
    } = this.props;

    const dateStart = startOfDay(date);
    const dateEnd = endOfDay(date);

    const planningItemsAndHeaders = headers
      .flatMap(header => {
        const planningItemsforDate = header.get('planningItems').filter(planningItem => {
          const timestamp = planningItem.get('timestamp');
          if (!timestamp.get('isActive')) {
            return false;
          }

          const planningItemDate = dateForTimestamp(timestamp);
          const isCompletedTodo =
            !!header.getIn(['titleLine', 'todoKeyword']) &&
            isTodoKeywordCompleted(todoKeywordSets, header.getIn(['titleLine', 'todoKeyword']));
          if (isCompletedTodo) {
            return false;
          }

          if (planningItem.get('type') === 'DEADLINE') {
            if (isToday(date)) {
              if (isBefore(planningItemDate, new Date())) {
                return true;
              }

              const [delayValue, delayUnit] = !!timestamp.get('delayType')
                ? [timestamp.get('delayValue'), timestamp.get('delayUnit')]
                : [agendaDefaultDeadlineDelayValue, agendaDefaultDeadlineDelayUnit];

              const appearDate = subtractTimestampUnitFromDate(
                planningItemDate,
                delayValue,
                delayUnit
              );
              return isAfter(date, appearDate) || isEqual(date, appearDate);
            } else {
              return isWithinInterval(planningItemDate, dateStart, dateEnd);
            }
          } else if (planningItem.get('type') === 'SCHEDULED') {
            let appearDate = planningItemDate;
            if (!!timestamp.get('delayType')) {
              const hasBeenRepeated = header
                .get('propertyListItems')
                .some(propertyListItem => propertyListItem.get('property') === 'LAST_REPEAT');
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

            return isWithinInterval(appearDate, dateStart, dateEnd);
          } else {
            return false;
          }
        });

        return planningItemsforDate.map(planningItem => [planningItem, header]);
      })
      .sortBy(([planningItem, header]) => {
        const { startHour, startMinute, endHour, endMinute, month, day } = planningItem
          .get('timestamp')
          .toJS();

        return [!!startHour ? 0 : 1, startHour, startMinute, endHour, endMinute, month, day];
      });

    return (
      <div className="agenda-day__container">
        <div className="agenda-day__title">
          {isToday(date) && <div className="agenda-day__today-indicator" />}
          <div className="agenda-day__title__day-name">{formatDate(date, 'dddd')}</div>
          <div className="agenda-day__title__date">{formatDate(date, 'MMMM Do, YYYY')}</div>
        </div>

        <div className="agenda-day__headers-container">
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
                  <div className="agenda-day__header-planning-type">{planningItem.get('type')}</div>
                  <div className={dateClassName} onClick={onToggleDateDisplayType}>
                    {dateDisplayType === 'absolute'
                      ? formatDate(planningItemDate, 'MM/DD')
                      : `${formatDistance(planningItemDate)} ago`}

                    {!!planningItem.getIn(['timestamp', 'startHour']) && (
                      <Fragment>
                        <br />
                        {formatDate(planningItemDate, 'h:mma')}
                      </Fragment>
                    )}
                  </div>
                </div>
                <div className="agenda-day__header__header-container">
                  <TitleLine
                    header={header}
                    color="black"
                    hasContent={false}
                    isSelected={false}
                    shouldDisableActions
                    shouldDisableExplicitWidth
                    onClick={this.handleHeaderClick(header.get('id'))}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
