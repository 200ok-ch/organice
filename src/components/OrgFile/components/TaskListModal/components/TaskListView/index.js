import React, { Fragment, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { List, Map } from 'immutable';

import * as orgActions from '../../../../../../actions/org';

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

  const { dateDisplayType, onToggleDateDisplayType, headersForFiles, todoKeywordSetsForFiles } =
    props;

  // Populate filteredHeaders
  useEffect(() => {
    props.org.setSearchFilterInformation('', 0, 'task-list');
  }, [props.org]);

  const planningItemsAndHeaders = getPlanningItemsAndHeaders({
    headersForFiles,
    todoKeywordSetsForFiles,
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
                  onClick={handleHeaderClick(header.get('path'), header.get('id'))}
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
  function getPlanningItemsAndHeaders({ headersForFiles, todoKeywordSetsForFiles }) {
    const headers = List().concat(
      ...headersForFiles
        .mapEntries(([path, headersOfFile]) => [
          path,
          headersOfFile.map((header) => header.set('path', path)),
        ])
        .valueSeq()
    );
    const isTodoKeywordInDoneState = todoKeywordSetsForFiles.map((todoKeywordSets) =>
      createIsTodoKeywordInDoneState(todoKeywordSets)
    );

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
        const doneState = isTodoKeywordInDoneState.get(header.get('path'))(
          header.getIn(['titleLine', 'todoKeyword'])
        );

        const timeAsSortCriterion = planningItem
          ? getTimeFromPlanningItem(planningItem)
          : Number.MAX_SAFE_INTEGER; // Sort tasks without timestamp last
        const title = header.getIn(['titleLine', 'rawTitle']);
        return [doneState, timeAsSortCriterion, title];
      });
  }
}

const mapStateToProps = (state) => {
  const files = state.org.present.get('files');
  return {
    // When no filtering has happened, yet (initial state), use all headers.
    headersForFiles: state.org.present.getIn(['search', 'filteredHeaders']) || Map(),
    todoKeywordSetsForFiles: files.map((file) => file.get('todoKeywordSets')),
  };
};

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
});

const getTimeFromPlanningItem = (planningItem) =>
  dateForTimestamp(planningItem.get('timestamp')).getTime();

export default connect(mapStateToProps, mapDispatchToProps)(TaskListView);
