import React, { useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Map } from 'immutable';

import * as orgActions from '../../../../../../actions/org';
import './stylesheet.css';

import { millisDuration } from '../../../../../../lib/timestamps';

import TitleLine from '../../../TitleLine';
import { getBreadcrumbsStringFunction } from '../../../../../../lib/org_utils';

function HeaderListView(props) {
  const { context } = props;
  function handleHeaderClick(path, headerId) {
    return () => props.onHeaderClick(path, headerId);
  }

  // Populate filteredHeaders
  useEffect(() => {
    // No specific searchFilter and cursorPosition, but set the
    // context (like 'search' or 'refile')
    props.org.setSearchFilterInformation('', 0, context);
  }, [context, props.org]);

  const { headers, allHeaders, showClockedTimes } = props;

  return (
    <div className="agenda-day__container">
      <div className="agenda-day__headers-container">
        {Array.from(headers.entries(), ([path, headersOfFile]) => {
          const getBreadcrumbs = getBreadcrumbsStringFunction(allHeaders, path);
          return headersOfFile.map((header) => {
            return (
              <div key={header.get('id')} className="agenda-day__header-container">
                <div className="search__breadcrumbs">{getBreadcrumbs(header)}</div>
                <div className="agenda-day__header__header-container">
                  <TitleLine
                    header={header}
                    color="var(--base03)"
                    hasContent={false}
                    isSelected={false}
                    shouldDisableActions
                    shouldDisableExplicitWidth
                    onClick={handleHeaderClick(path, header.get('id'))}
                    addition={
                      showClockedTimes && header.get('totalFilteredTimeLoggedRecursive') !== 0
                        ? millisDuration(header.get('totalFilteredTimeLoggedRecursive'))
                        : null
                    }
                  />
                </div>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

const mapStateToProps = (state) => {
  const path = state.org.present.get('path');
  const files = state.org.present.get('files');
  const file = files.get(path);
  return {
    // When no filtering has happened, yet (initial state), use all headers.
    // TODO: currently only headers of opened file are initially shown.
    // Decide if it should be all files.
    allHeaders: files.map((file) => file.get('headers')),
    headers:
      state.org.present.getIn(['search', 'filteredHeaders']) ||
      new Map().set(path, file.get('headers')),
    showClockedTimes: state.org.present.getIn(['search', 'showClockedTimes']),
  };
};

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(HeaderListView);
