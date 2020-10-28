import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { Map } from 'immutable';

import './stylesheet.css';

import TitleLine from '../../../TitleLine';

import { dateForTimestamp } from '../../../../../../lib/timestamps';
import {
  createIsTodoKeywordInDoneState,
  getPlanningItemTypeText,
  customFormatDistanceToNow,
} from '../../../../../../lib/org_utils';

import { format, isPast } from 'date-fns';
import classNames from 'classnames';

function TaskListView(props) {
  function handleHeaderClick(path, headerId) {
    return () => props.onHeaderClick(path, headerId);
  }

  const { dateDisplayType, onToggleDateDisplayType, headers, todoKeywordSets } = props;

  // TODO this uses the todokeywordset of the current file for all files
  // use each files own todokeywordset instead
  const planningItemsAndHeaders = headers.map((headersForFile) =>
    getPlanningItemsAndHeaders({
      headers: headersForFile,
      todoKeywordSets,
    })
  );

  return (
    <div className="agenda-day__container">
      <div className="agenda-day__headers-container">
        {Array.from(planningItemsAndHeaders.entries(), ([path, planningItemsAndHeadersOfFile]) => (
          <div>
            <span>{path}</span>
            {planningItemsAndHeadersOfFile.map(([planningItem, header]) => {
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
                    <div className="task-list__header-planning-type">
                      {getPlanningItemTypeText(planningItem)}
                    </div>
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
                      color="var(--base03)"
                      hasContent={false}
                      isSelected={false}
                      shouldDisableActions
                      shouldDisableExplicitWidth
                      onClick={handleHeaderClick(path, header.get('id'))}
                    />
                    {planningInformation}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
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
      .filter((header) => header.getIn(['titleLine', 'todoKeyword']))
      .map((header) => {
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

const mapStateToProps = (state) => {
  const path = state.org.present.get('path');
  const file = state.org.present.getIn(['files', path]);
  return {
    todoKeywordSets: file.get('todoKeywordSets'),
    // When no filtering has happened, yet (initial state), use all headers.
    headers:
      state.org.present.getIn(['search', 'filteredHeaders']) ||
      // TODO: this uses only the current file when no search term is entered. Use all of them.
      new Map().set(path, file.get('headers')),
  };
};

const getTimeFromPlanningItem = (planningItem) =>
  dateForTimestamp(planningItem.get('timestamp')).getTime();

export default connect(mapStateToProps)(TaskListView);
