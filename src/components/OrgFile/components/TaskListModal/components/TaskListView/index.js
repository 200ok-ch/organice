import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';

import './stylesheet.css';

import TitleLine from '../../../TitleLine';

import { dateForTimestamp } from '../../../../../../lib/timestamps';

import { format, isPast, formatDistanceToNow } from 'date-fns';
import classNames from 'classnames';

class TaskListView extends PureComponent {
  handleHeaderClick(headerId) {
    return () => this.props.onHeaderClick(headerId);
  }

  render() {
    const {
      dateDisplayType,
      onToggleDateDisplayType,
      headers,
      searchAllHeaders,
      todoKeywordSets,
    } = this.props;

    const planningItemsAndHeaders = this.getPlanningItemsAndHeaders({
      headers,
      searchAllHeaders,
      todoKeywordSets,
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
                  {planningInformation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  getPlanningItemsAndHeaders({ headers, searchAllHeaders, todoKeyword }) {
    return headers
      .filter(header => searchAllHeaders || header.getIn(['titleLine', 'todoKeyword']))
      .map(header => {
        const earliestPlanningItem = header
          .get('planningItems')
          .sortBy(getTimeFromPlanningItem)
          .first();
        return [earliestPlanningItem, header];
      })
      .sortBy(([planningItem, header]) => {
        const timeAsSortCriterion = planningItem
          ? getTimeFromPlanningItem(planningItem)
          : Number.MAX_SAFE_INTEGER; // Sort tasks without timestamp last
        const title = header.getIn(['titleLine', 'rawTitle']);
        return [timeAsSortCriterion, title];
      });
  }
}

const mapStateToProps = state => ({
  todoKeywordSets: state.org.present.get('todoKeywordSets'),
  searchAllHeaders: state.org.present.getIn(['search', 'searchAllHeaders']),
  // When no filtering has happened, yet (initial state), use all headers.
  headers:
    state.org.present.getIn(['search', 'filteredHeaders']) || state.org.present.get('headers'),
});

const mapDispatchToProps = dispatch => ({});

const getTimeFromPlanningItem = planningItem =>
  dateForTimestamp(planningItem.get('timestamp')).getTime();

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskListView);
