import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fromJS, List, Map } from 'immutable';

import './stylesheet.css';

import * as orgActions from '../../../../../../actions/org';
import { determineIncludedFiles } from '../../../../../../reducers/org';
import QueryView from '../QueryView';

const clockList = fromJS({
  description: 'Clock List',
  queries: List([Map({ query: 'clock:now', type: 'search', collapse: false })]),
});

function QueryModal(props) {
  const { onClose, path, querySettings, activeClocks, selectedQuery, setSelectedQuery } = props;
  let contextQueries = List();
  if (activeClocks) {
    contextQueries = contextQueries.push(clockList);
  }
  const fileQueries = querySettings.filter((query) =>
    query.get('orgFilesWhereAvailable').some((filePath) => filePath === path)
  );
  const globalQueries = querySettings.filter((query) => query.get('isAvailableInAllOrgFiles'));

  const renderQuery = (query, index) => (
    <h2
      key={`${query.get('searchFilter')}-${index}`}
      style={{ textAlign: 'center' }}
      onClick={() => setSelectedQuery(query)}
    >
      {query.get('description')}
    </h2>
  );

  if (contextQueries.size === 0 && fileQueries.size === 0 && globalQueries.size === 0) {
    return <div>No queries available. You can create custom queries in the settings menu.</div>;
  } else if (selectedQuery) {
    return <QueryView query={selectedQuery} onClose={onClose} />;
  } else {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {contextQueries.size !== 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ textDecoration: 'underline' }}>context queries</h2>
            {contextQueries.map(renderQuery)}
          </div>
        ) : null}
        {fileQueries.size !== 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ textDecoration: 'underline' }}>file queries</h2>
            {fileQueries.map(renderQuery)}
          </div>
        ) : null}
        {globalQueries.size !== 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ textDecoration: 'underline' }}>global queries</h2>
            {globalQueries.map(renderQuery)}
          </div>
        ) : null}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const path = state.org.present.get('path');
  const files = state.org.present.get('files');
  const fileSettings = state.org.present.get('fileSettings');
  const searchFiles = determineIncludedFiles(files, fileSettings, path, 'includeInSearch', false);
  const activeClocks = Object.values(
    searchFiles.map((f) => (f.get('headers').size ? f.get('activeClocks') : 0)).toJS()
  ).reduce((acc, val) => (typeof val === 'number' ? acc + val : acc), 0);
  return {
    path: state.org.present.get('path'),
    querySettings: state.query.get('querySettings'),
    activeClocks,
  };
};

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(QueryModal);
