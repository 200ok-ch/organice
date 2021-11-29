import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { UnmountClosed as Collapse } from 'react-collapse';

import './stylesheet.css';

import classNames from 'classnames';

import * as orgActions from '../../../../../../actions/org';
import HeaderListView from '../HeaderListView';
import TaskListView from '../TaskListView';

function QueryView(props) {
  const { query, queryResults } = props;
  const [dateDisplayType, setdateDisplayType] = useState('absolute');
  const [isCollapsed, setIsCollapsed] = useState({});

  useEffect(() => {
    return () => props.org.removeQueryResults();
  }, [props.org]);
  useEffect(() => {
    props.org.executeQuery(query);
  }, [props.org, query]);
  useEffect(() => {
    if (queryResults.size !== 0) {
      setIsCollapsed(queryResults.map((result) => result.get('collapse')).toJS());
    }
  }, [queryResults]);

  function handleHeaderClick(path, headerId) {
    props.onClose(path, headerId);
  }

  function handleToggleDateDisplayType() {
    setdateDisplayType(dateDisplayType === 'absolute' ? 'relative' : 'absolute');
  }

  function renderQueryResult(result, index) {
    const searchFilterValid = result.get('searchFilterValid');
    const searchFilter = result.get('searchFilter');
    const context = result.get('context');
    const filteredHeaders = result.get('filteredHeaders');
    const showClockedTimes = result.get('showClockedTimes');
    const clockedTime = result.get('clockedTime');

    if (!searchFilterValid) {
      return <span>There was an error parsing '{searchFilter}'</span>;
    }
    return (
      <div key={`query-config-${index}`} style={{ marginBottom: '10px' }}>
        <div
          style={{ display: 'flex', alignItems: 'center' }}
          onClick={() =>
            setIsCollapsed({ ...isCollapsed, [searchFilter]: !isCollapsed[searchFilter] })
          }
        >
          <i
            className={classNames(
              'fas fa-2x fa-caret-right capture-template-container__header__caret',
              {
                'capture-template-container__header__caret--rotated': !isCollapsed[searchFilter],
              }
            )}
          />
          <span>{searchFilter}</span>
        </div>
        <Collapse isOpened={!isCollapsed[searchFilter]} springConfig={{ stiffness: 300 }}>
          {context === 'search' ? (
            <HeaderListView
              onHeaderClick={handleHeaderClick}
              dateDisplayType={dateDisplayType}
              onToggleDateDisplayType={handleToggleDateDisplayType}
              headers={filteredHeaders}
              showClockedTimes={showClockedTimes}
              clockedTime={clockedTime}
            />
          ) : context === 'task-list' ? (
            <TaskListView
              onHeaderClick={handleHeaderClick}
              dateDisplayType={dateDisplayType}
              onToggleDateDisplayType={handleToggleDateDisplayType}
              headersForFiles={filteredHeaders}
            />
          ) : (
            <span>Error</span>
          )}
        </Collapse>
      </div>
    );
  }

  if (queryResults.size === 0) {
    return <span>loading</span>;
  } else {
    return (
      <>
        <h2>{query.get('description')}</h2>
        {query
          .get('queries')
          .map((queryConfig, index) =>
            renderQueryResult(queryResults.get(queryConfig.get('query')), index)
          )}
      </>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    queryResults: state.org.present.get('query'),
  };
};

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(QueryView);
