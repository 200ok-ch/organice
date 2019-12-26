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
            const planningItemDate = planningItem
              ? dateForTimestamp(planningItem.get('timestamp'))
              : null;
            const hasTodoKeyword = !!header.getIn(['titleLine', 'todoKeyword']);

            const dateClassName = classNames('agenda-day__header-planning-date', {
              'agenda-day__header-planning-date--overdue':
                hasTodoKeyword && planningItem && isPast(planningItemDate),
            });

            let planningInformation = <div/>
            if (planningItemDate) {
              planningInformation = (
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
              )
            }

            return (
              <div key={header.get('id')} className="agenda-day__header-container">
                {planningInformation}
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
      .filter(header => header.get('titleLine').get('todoKeyword'))
      .map(header => {
        const firstPlanningItem = header.get('planningItems').first();
        return [firstPlanningItem, header]; // only the first planningItem information is displayed (randomly)
      })
      .sortBy(([planningItem, header]) => {
        const maybeTimestamp = planningItem ? planningItem.get('timestamp').toJS() : null;
        return [maybeTimestamp, header.get('titleLine').get('rawText')];
      });
  }
}
