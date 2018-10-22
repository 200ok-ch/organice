import React, { PureComponent, Fragment } from 'react';

import './stylesheet.css';

import TitleLine from '../../../TitleLine';

import { isTodoKeywordCompleted } from '../../../../../../lib/org_utils';
import {
  momentDateForTimestamp,
  momentUnitForTimestampUnit,
} from '../../../../../../lib/timestamps';

import moment from 'moment';
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

    const isToday = date.isBetween(moment().startOf('day'), moment().endOf('day'), null, '[]');
    const dateStart = date.clone().startOf('day');
    const dateEnd = date.clone().endOf('day');

    const planningItemsAndHeaders = headers
      .flatMap(header => {
        const planningItemsforDate = header.get('planningItems').filter(planningItem => {
          const timestamp = planningItem.get('timestamp');
          if (!timestamp.get('isActive')) {
            return false;
          }

          const planningItemDate = momentDateForTimestamp(timestamp);
          const isCompletedTodo =
            !!header.getIn(['titleLine', 'todoKeyword']) &&
            isTodoKeywordCompleted(todoKeywordSets, header.getIn(['titleLine', 'todoKeyword']));
          if (isCompletedTodo) {
            return false;
          }

          if (planningItem.get('type') === 'DEADLINE') {
            //---------------------------
            // HANDLING THE CURRENT DAY
            if (isToday) {
              // PAST DEADLINES (ALWAYS SHOW)
              if (planningItemDate < moment()) {
                return true;
              }

              if (timestamp.get('delayType') === '-') {
                // DELAY IS EXPLICITY SET
                const delayUnit = momentUnitForTimestampUnit(timestamp.get('delayUnit'));
                const appearDate = planningItemDate
                  .clone()
                  .subtract(timestamp.get('delayValue'), delayUnit);

                return date >= appearDate;
              } else {
                // DELAY DEFAULTS TO VALUES IN SETTINGS
                const appearDate = planningItemDate
                  .clone()
                  .subtract(agendaDefaultDeadlineDelayValue, agendaDefaultDeadlineDelayUnit);

                return date >= appearDate;
              }
            }
            //---------------------------

            return planningItemDate.isBetween(dateStart, dateEnd, null, '[]');
          } else if (planningItem.get('type') === 'SCHEDULED') {
            let appearDate = planningItemDate;
            if (!!timestamp.get('delayType')) {
              const delayUnit = momentUnitForTimestampUnit(timestamp.get('delayUnit'));
              appearDate = planningItemDate.clone().add(timestamp.get('delayValue'), delayUnit);
            }

            if (isToday && date > appearDate) {
              return true;
            }

            return appearDate.isBetween(dateStart, dateEnd, null, '[]');
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
          {isToday && <div className="agenda-day__today-indicator" />}
          <div className="agenda-day__title__day-name">{date.format('dddd')}</div>
          <div className="agenda-day__title__date">{date.format('MMMM Do, YYYY')}</div>
        </div>

        <div className="agenda-day__headers-container">
          {planningItemsAndHeaders.map(([planningItem, header]) => {
            const planningItemDate = momentDateForTimestamp(planningItem.get('timestamp'));
            const hasTodoKeyword = !!header.getIn(['titleLine', 'todoKeyword']);

            const dateClassName = classNames('agenda-day__header-planning-date', {
              'agenda-day__header-planning-date--overdue':
                hasTodoKeyword && planningItemDate < moment(),
            });

            return (
              <div key={planningItem.get('id')} className="agenda-day__header-container">
                <div className="agenda-day__header__planning-item-container">
                  <div className="agenda-day__header-planning-type">{planningItem.get('type')}</div>
                  <div className={dateClassName} onClick={onToggleDateDisplayType}>
                    {dateDisplayType === 'absolute'
                      ? planningItemDate.format('MM/DD')
                      : planningItemDate.fromNow()}

                    {!!planningItem.getIn(['timestamp', 'startHour']) && (
                      <Fragment>
                        <br />
                        {planningItemDate.format('h:mma')}
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
