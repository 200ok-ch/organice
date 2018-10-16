import React, { PureComponent, Fragment } from 'react';

import './stylesheet.css';

import TitleLine from '../../../TitleLine';

import { momentDateForTimestamp } from '../../../../../../lib/timestamps';

export default class AgendaDay extends PureComponent {
  render() {
    const { date, headers } = this.props;

    const dateStart = date.clone().startOf('day');
    const dateEnd = date.clone().endOf('day');

    const planningItemsAndHeaders = headers
      .flatMap(header => {
        const planningItemsOnDate = header.get('planningItems').filter(planningItem => {
          const planningItemDate = momentDateForTimestamp(planningItem.get('timestamp'));

          return planningItemDate.isBetween(dateStart, dateEnd, null, '[]');
        });

        return planningItemsOnDate.map(planningItem => [planningItem, header]);
      })
      .sortBy(([planningItem, header]) => {
        const { startHour, startMinute, endHour, endMinute } = planningItem.get('timestamp').toJS();

        if (!!startHour && !!startMinute) {
          return [0, startHour, startMinute, endHour, endMinute];
        } else {
          return [1, null, null, null, null];
        }
      });

    return (
      <div className="agenda-day__container">
        <div className="agenda-day__title">
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
                    shouldDisableActions={true}
                    shouldDisableExplicitWidth
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
