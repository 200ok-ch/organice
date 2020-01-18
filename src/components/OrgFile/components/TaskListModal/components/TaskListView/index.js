import React, { Fragment } from 'react';
import { connect } from 'react-redux';

import './stylesheet.css';

import TitleLine from '../../../TitleLine';

import { dateForTimestamp } from '../../../../../../lib/timestamps';
import {
  createIsTodoKeywordInDoneState,
  customFormatDistanceToNow,
} from '../../../../../../lib/org_utils';

import { format, isPast } from 'date-fns';
import classNames from 'classnames';

function TaskListView(props) {
  function handleHeaderClick(headerId) {
    return () => props.onHeaderClick(headerId);
  }

  const { dateDisplayType, onToggleDateDisplayType, headers, todoKeywordSets } = props;

  const planningItemsAndHeaders = getPlanningItemsAndHeaders({
    headers,
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

          const dateClassName = classNames('task-list__header-planning-date', {
            'task-list__header-planning-date--overdue':
              hasTodoKeyword && planningItem && isPast(planningItemDate),
          });

          let planningInformation = <div />;
          if (planningItemDate) {
            planningInformation = (
              <div className="agenda-day__header__planning-item-container">
                <div className="task-list__header-planning-type">{planningItem.get('type')}</div>
                <div className={dateClassName} onClick={onToggleDateDisplayType}>
                  {dateDisplayType === 'absolute'
                    ? format(planningItemDate, 'MM/dd')
                    : customFormatDistanceToNow(planningItemDate)}

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
                  onClick={handleHeaderClick(header.get('id'))}
                />
                {planningInformation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Doing this on every render of the TaskListView is potentially
  // inefficient and could be done in the reducer. However, doing it
  // on every update of the headers state when not even looking at the
  // Agenda is certainly more inefficient. Hence, we're doing it on
  // every render.
  function getPlanningItemsAndHeaders({ headers, todoKeywordSets }) {
    const isTodoKeywordInDoneState = createIsTodoKeywordInDoneState(todoKeywordSets);

    return headers
      .filter(header => header.getIn(['titleLine', 'todoKeyword']))
      .map(header => {
        const earliestPlanningItem = header
          .get('planningItems')
          .sortBy(getTimeFromPlanningItem)
          .first();
        return [earliestPlanningItem, header];
      })
      .sortBy(([planningItem, header]) => {
        const doneState = isTodoKeywordInDoneState(header.getIn(['titleLine', 'todoKeyword']));

        const timeAsSortCriterion = planningItem
          ? getTimeFromPlanningItem(planningItem)
          : Number.MAX_SAFE_INTEGER; // Sort tasks without timestamp last
        const title = header.getIn(['titleLine', 'rawTitle']);
        return [doneState, timeAsSortCriterion, title];
      });
  }
}

const mapStateToProps = state => ({
  todoKeywordSets: state.org.present.get('todoKeywordSets'),
  // When no filtering has happened, yet (initial state), use all headers.
  headers:
    state.org.present.getIn(['search', 'filteredHeaders']) || state.org.present.get('headers'),
});

const mapDispatchToProps = dispatch => ({});

const getTimeFromPlanningItem = planningItem =>
  dateForTimestamp(planningItem.get('timestamp')).getTime();

export default connect(mapStateToProps, mapDispatchToProps)(TaskListView);
