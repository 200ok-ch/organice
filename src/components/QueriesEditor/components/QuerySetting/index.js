import React, { Fragment, useState } from 'react';
import { UnmountClosed as Collapse } from 'react-collapse';

import { Draggable } from 'react-beautiful-dnd';

import './stylesheet.css';

import Switch from '../../../UI/Switch';
import TabButtons from '../../../UI/TabButtons';

import classNames from 'classnames';

export default ({
  query,
  index,
  onFieldPathUpdate,
  onAddNewQueryOrgFileAvailability,
  onRemoveQueryOrgFileAvailability,
  onAddNewQueryConfig,
  onRemoveQueryConfig,
  onDeleteQuery,
  syncBackendType,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(!!query.get('description'));
  const handleHeaderBarClick = () => setIsCollapsed(!isCollapsed);

  const updateField = (fieldName) => (event) =>
    onFieldPathUpdate(query.get('id'), [fieldName], event.target.value);

  const toggleAvailabilityInAllOrgFiles = () =>
    onFieldPathUpdate(
      query.get('id'),
      ['isAvailableInAllOrgFiles'],
      !query.get('isAvailableInAllOrgFiles')
    );

  const handleAddNewOrgFileAvailability = () => {
    onAddNewQueryOrgFileAvailability(query.get('id'));
  };

  const handleRemoveOrgFileAvailability = (index) => () =>
    onRemoveQueryOrgFileAvailability(query.get('id'), index);

  const handleOrgFileAvailabilityChange = (orgFileAvailabilityIndex) => (event) =>
    onFieldPathUpdate(
      query.get('id'),
      ['orgFilesWhereAvailable', orgFileAvailabilityIndex],
      event.target.value
    );

  const handleAddNewQueryConfig = () => onAddNewQueryConfig(query.get('id'));

  const handleRemoveQueryString = (queryIndex) => () =>
    onRemoveQueryConfig(query.get('id'), queryIndex);

  const handleQueryCollapseChange = (queryIndex) => () => {
    onFieldPathUpdate(
      query.get('id'),
      ['queries', queryIndex, 'collapse'],
      !query.getIn(['queries', queryIndex, 'collapse'])
    );
  };

  const handleQueryStringChange = (queryIndex) => (event) =>
    onFieldPathUpdate(query.get('id'), ['queries', queryIndex, 'query'], event.target.value);

  const handleQueryTypeChange = (queryIndex) => (value) =>
    onFieldPathUpdate(query.get('id'), ['queries', queryIndex, 'type'], value);

  const handleDeleteClick = () => {
    if (
      window.confirm(`Are you sure you want to delete the "${query.get('description')}" query?`)
    ) {
      onDeleteQuery(query.get('id'));
    }
  };

  const renderDescriptionField = (query) => (
    <div className="capture-template__field-container">
      <div className="capture-template__field">
        <div>Description:</div>
        <input
          type="text"
          className="textfield"
          value={query.get('description', '')}
          onChange={updateField('description')}
        />
      </div>
    </div>
  );

  const renderOrgFileAvailability = (query) => (
    <div className="capture-template__field-container">
      <div className="capture-template__field">
        <div>Available in all org files?</div>
        <Switch
          isEnabled={query.get('isAvailableInAllOrgFiles')}
          onToggle={toggleAvailabilityInAllOrgFiles}
        />
      </div>

      <div className="capture-template__help-text">
        You can make this query available in all org files, or just the ones you specify.
        {syncBackendType === 'Dropbox' && (
          <Fragment>
            {' '}
            Specify full paths starting from the root of your Dropbox, like{' '}
            <code>/org/todo.org</code>
          </Fragment>
        )}
        {syncBackendType === 'Google Drive' && (
          <Fragment>
            {' '}
            Specify the file id of each file. You can find the file id in the URL of the file in
            organice (e.g.,{' '}
            <code>
              /file/
              {'<file id>'}
            </code>
            ).
          </Fragment>
        )}
      </div>

      <Collapse isOpened={!query.get('isAvailableInAllOrgFiles')} springConfig={{ stiffness: 300 }}>
        <div className="multi-textfields-container">
          {query.get('orgFilesWhereAvailable').map((orgFilePath, index) => (
            <div key={`org-file-availability-${index}`} className="multi-textfield-container">
              <input
                type="text"
                placeholder="e.g., /org/todo.org"
                className="textfield multi-textfield-field"
                value={orgFilePath}
                onChange={handleOrgFileAvailabilityChange(index)}
              />
              <button
                className="fas fa-times fa-lg remove-multi-textfield-button"
                onClick={handleRemoveOrgFileAvailability(index)}
              />
            </div>
          ))}
        </div>

        <div className="add-new-multi-textfield-button-container">
          <button
            className="fas fa-plus add-new-multi-textfield-button"
            onClick={handleAddNewOrgFileAvailability}
          />
        </div>
      </Collapse>
    </div>
  );

  const renderQueryStrings = (query) => (
    <div className="capture-template__field-container">
      <div className="capture-template__field" style={{ marginTop: 7 }}>
        <div>Query strings</div>
      </div>

      <div className="capture-template__help-text">
        Specify whether the results should start out collapsed, the query string and the type of
        query. You can add multiple query strings.
      </div>

      <div className="multi-textfields-container">
        {query.get('queries').map((queryConfig, index) => (
          <div key={`query-config-${index}`} className="multi-textfield-container">
            <Switch
              isEnabled={queryConfig.get('collapse')}
              onToggle={handleQueryCollapseChange(index)}
            />
            <input
              type="text"
              placeholder="e.g., TODO organice"
              className="textfield multi-textfield-field"
              value={queryConfig.get('query')}
              onChange={handleQueryStringChange(index)}
            />
            <TabButtons
              buttons={['search', 'task-list']}
              selectedButton={queryConfig.get('type')}
              onSelect={handleQueryTypeChange(index)}
              useEqualWidthTabs
            />
            <button
              className="fas fa-times fa-lg remove-multi-textfield-button"
              onClick={handleRemoveQueryString(index)}
            />
          </div>
        ))}
      </div>

      <div className="add-new-multi-textfield-button-container">
        <button
          className="fas fa-plus add-new-multi-textfield-button"
          onClick={handleAddNewQueryConfig}
        />
      </div>
    </div>
  );

  const renderDeleteButton = () => (
    <div className="capture-template__field-container capture-template__delete-button-container">
      <button
        className="btn settings-btn capture-template__delete-button"
        onClick={handleDeleteClick}
      >
        Delete template
      </button>
    </div>
  );

  const caretClassName = classNames(
    'fas fa-2x fa-caret-right capture-template-container__header__caret',
    {
      'capture-template-container__header__caret--rotated': !isCollapsed,
    }
  );

  return (
    <Draggable draggableId={`capture-template--${query.get('id')}`} index={index}>
      {(provided, snapshot) => (
        <div
          className={classNames('capture-template-container', {
            'capture-template-container--dragging': snapshot.isDragging,
          })}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div className="capture-template-container__header" onClick={handleHeaderBarClick}>
            <i className={caretClassName} />
            <span className="capture-template-container__header__title">
              {query.get('description')}
            </span>
            <i
              className="fas fa-bars fa-lg capture-template-container__header__drag-handle"
              {...provided.dragHandleProps}
            />
          </div>

          <Collapse isOpened={!isCollapsed} springConfig={{ stiffness: 300 }}>
            <div className="capture-template-container__content">
              {renderDescriptionField(query)}
              {renderOrgFileAvailability(query)}
              {renderQueryStrings(query)}
              {renderDeleteButton()}
            </div>
          </Collapse>
        </div>
      )}
    </Draggable>
  );
};
