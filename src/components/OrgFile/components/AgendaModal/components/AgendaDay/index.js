import React, { PureComponent, Fragment } from 'react';

import './stylesheet.css';

import TitleLine from '../../../TitleLine';

import { isTodoKeywordCompleted } from '../../../../../../lib/org_utils';
import {
  momentDateForTimestamp,
  momentUnitForTimestampUnit,
} from '../../../../../../lib/timestamps';

import moment from 'moment';

export default class AgendaDay extends PureComponent {
  handleHeaderClick(headerId) {
    return () => this.props.onHeaderClick(headerId);
  }

  render() {
    const { date, headers, todoKeywordSets } = this.props;

    const isToday = date.isBetween(moment().startOf('day'), moment().endOf('day'), null, '[]');
    const dateStart = date.clone().startOf('day');
    const dateEnd = date.clone().endOf('day');

    const planningItemsAndHeaders = headers
      .flatMap(header => {
        const planningItemsforDate = header.get('planningItems').filter(planningItem => {
          const timestamp = planningItem.get('timestamp');
          const planningItemDate = momentDateForTimestamp(timestamp);
          const isIncompleteTodo =
            !!header.getIn(['titleLine', 'todoKeyword']) &&
            !isTodoKeywordCompleted(todoKeywordSets, header.getIn(['titleLine', 'todoKeyword']));

          if (planningItem.get('type') === 'DEADLINE') {
            if (isIncompleteTodo && planningItemDate < moment() && isToday) {
              return true;
            }

            if (timestamp.get('delayType') === '-' && isToday) {
              const delayUnit = momentUnitForTimestampUnit(timestamp.get('delayUnit'));
              const appearDate = planningItemDate
                .clone()
                .subtract(timestamp.get('delayValue'), delayUnit);

              return date > appearDate;
            }

            return planningItemDate.isBetween(dateStart, dateEnd, null, '[]');
          } else if (planningItem.get('type') === 'SCHEDULED') {
            let appearDate = planningItemDate;
            if (!!timestamp.get('delayType')) {
              const delayUnit = momentUnitForTimestampUnit(timestamp.get('delayUnit'));
              appearDate = planningItemDate.clone().add(timestamp.get('delayValue'), delayUnit);
            }

            if (isIncompleteTodo && isToday && date > appearDate) {
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
        const { startHour, startMinute, endHour, endMinute } = planningItem.get('timestamp').toJS();

        return [!!startHour ? 0 : 1, startHour, startMinute, endHour, endMinute];
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
            return (
              <div key={header.get('id')} className="agenda-day__header-container">
                <div className="agenda-day__header__planning-item-container">
                  <div className="agenda-day__header-planning-type">{planningItem.get('type')}</div>
                  {!!planningItem.getIn(['timestamp', 'startHour']) && (
                    <div className="agenda-day__header-planning-date">
                      {planningItem.getIn(['timestamp', 'startHour'])}
                      {':'}
                      {planningItem.getIn(['timestamp', 'startMinute'])}
                      {!!planningItem.getIn(['timestamp', 'endHour']) && (
                        <Fragment>
                          {'-'}
                          {planningItem.getIn(['timestamp', 'endHour'])}
                          {':'}
                          {planningItem.getIn(['timestamp', 'endMinute'])}
                        </Fragment>
                      )}
                    </div>
                  )}
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
