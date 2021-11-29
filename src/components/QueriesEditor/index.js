import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Droppable } from 'react-beautiful-dnd';

import './stylesheet.css';

import * as queryActions from '../../actions/query';

import QuerySetting from './components/QuerySetting';

import { List } from 'immutable';

const QueriesEditor = ({ querySettings, syncBackendType, query }) => {
  const handleAddNewQueryClick = () => query.addNewEmptyQuery();

  const handleFieldPathUpdate = (queryId, fieldPath, newValue) =>
    query.updateQueryFieldPathValue(queryId, fieldPath, newValue);

  const handleAddNewQueryOrgFileAvailability = (queryId) =>
    query.addNewQueryOrgFileAvailability(queryId);

  const handleRemoveQueryOrgFileAvailability = (queryId, orgFileAvailabilityIndex) =>
    query.removeQueryOrgFileAvailability(queryId, orgFileAvailabilityIndex);

  const handleAddNewQueryConfig = (queryId) => query.addNewQueryConfig(queryId);

  const handleRemoveQueryConfig = (queryId) => query.removeQueryConfig(queryId);

  const handleDeleteQuery = (queryId) => query.deleteQuery(queryId);

  const handleReorderQuery = (fromIndex, toIndex) => query.reorderQuery(fromIndex, toIndex);

  return (
    <div>
      <Droppable droppableId="capture-templates-editor-droppable" type="CAPTURE-TEMPLATE">
        {(provided) => (
          <div
            className="capture-templates-container"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {querySettings.size === 0 ? (
              <div className="no-capture-templates-message">
                You don't currently have any custom queries - add one by pressing the{' '}
                <i className="fas fa-plus" /> button.
                <br />
                <br />
                Custom Queries show up in the search drawer under the 'queries' tab and give you
                quick access to pre-defined search configurations.
              </div>
            ) : (
              <Fragment>
                {querySettings.map((query, index) => (
                  <QuerySetting
                    key={query.get('id')}
                    index={index}
                    query={query}
                    syncBackendType={syncBackendType}
                    onFieldPathUpdate={handleFieldPathUpdate}
                    onAddNewQueryOrgFileAvailability={handleAddNewQueryOrgFileAvailability}
                    onRemoveQueryOrgFileAvailability={handleRemoveQueryOrgFileAvailability}
                    onAddNewQueryConfig={handleAddNewQueryConfig}
                    onRemoveQueryConfig={handleRemoveQueryConfig}
                    onDeleteQuery={handleDeleteQuery}
                    onReorder={handleReorderQuery}
                  />
                ))}

                {provided.placeholder}
              </Fragment>
            )}
          </div>
        )}
      </Droppable>

      <div className="new-capture-template-button-container">
        <button className="fas fa-plus fa-lg btn btn--circle" onClick={handleAddNewQueryClick} />
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  querySettings: state.query.get('querySettings', List()),
  syncBackendType: state.syncBackend.get('client').type,
});

const mapDispatchToProps = (dispatch) => {
  return {
    query: bindActionCreators(queryActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(QueriesEditor);
