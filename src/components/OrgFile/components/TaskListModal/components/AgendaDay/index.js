import React, { PureComponent, Fragment } from 'react';

import './stylesheet.css';

import TitleLine from '../../../TitleLine';

import {
  dateForTimestamp,
} from '../../../../../../lib/timestamps';

import {
  format,
  startOfDay,
  endOfDay,
  isPast,
  formatDistanceToNow,
} from 'date-fns';
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

    const planningItemsAndHeaders = this.getPlanningItemsAndHeaders({
      headers,
      todoKeywordSets,
      date,
      agendaDefaultDeadlineDelayValue,
      agendaDefaultDeadlineDelayUnit,
      dateStart,
      dateEnd,
    });

    return (
      <div className="agenda-day__container">

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
                      ? format(planningItemDate, 'MM/dd')
                      : `${formatDistanceToNow(planningItemDate)} ago`}

                    {!!planningItem.getIn(['timestamp', 'startHour']) && (
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

  getPlanningItemsAndHeaders({
    headers,
    todoKeywordSets,
    date,
    agendaDefaultDeadlineDelayValue,
    agendaDefaultDeadlineDelayUnit,
    dateStart,
    dateEnd,
  }) {
    return headers
      .flatMap(header => {
        const planningItemsforDate = header.get('planningItems');
        return planningItemsforDate.map(planningItem => [planningItem, header]);
      })
      .sortBy(([planningItem, header]) => {
        const { startHour, startMinute, endHour, endMinute, month, day } = planningItem
          .get('timestamp')
          .toJS();
        return [!!startHour ? 0 : 1, startHour, startMinute, endHour, endMinute, month, day];
      });
  }
}
