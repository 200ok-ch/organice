import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';

import './stylesheet.css';

import TitleLine from '../../../TitleLine';

import { dateForTimestamp } from '../../../../../../lib/timestamps';

import { format, startOfDay, endOfDay, isPast, formatDistanceToNow } from 'date-fns';
import classNames from 'classnames';

class TaskListView extends PureComponent {
  handleHeaderClick(headerId) {
    return () => this.props.onHeaderClick(headerId);
  }

  render() {
    const {
      date,
      headers,
      searchAllHeaders,
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
      searchAllHeaders,
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

            let planningInformation = <div />;
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
              );
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
    searchAllHeaders,
    todoKeywordSets,
    date,
    agendaDefaultDeadlineDelayValue,
    agendaDefaultDeadlineDelayUnit,
    dateStart,
    dateEnd,
    only,
  }) {
    return headers
      .filter(header => searchAllHeaders || header.get('titleLine').get('todoKeyword'))
      .map(header => {
        const earliestPlanningItem = header
          .get('planningItems')
          .sortBy(x => dateForTimestamp(x.get('timestamp')))
          // TODO: sort DESC by timestamp (must be converted to
          // datetime) - and items without planning info should appear below
          .first();
        return [earliestPlanningItem, header];
      })
      .sortBy(([planningItem, header]) => {
        const maybeTimestamp = planningItem
          ? dateForTimestamp(planningItem.get('timestamp'))
          : null;
        const title = header.get('titleLine').get('rawText');
        return [maybeTimestamp, title];
      });
  }
}

const mapStateToProps = state => ({
  todoKeywordSets: state.org.present.get('todoKeywordSets'),
  searchAllHeaders: state.org.present.get('search').get('searchAllHeaders'),
  // When no filtering has happened, yet (initial state), use all headers.
  headers:
    state.org.present.get('search').get('filteredHeaders') || state.org.present.get('headers'),
});

const mapDispatchToProps = dispatch => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskListView);
