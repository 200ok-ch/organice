import React, { Fragment, useState } from 'react';
import { UnmountClosed as Collapse } from 'react-collapse';

import { Draggable } from 'react-beautiful-dnd';

import './stylesheet.css';

import ActionButton from '../../../OrgFile/components/ActionDrawer/components/ActionButton';
import Switch from '../../../UI/Switch/';
import ExternalLink from '../../../UI/ExternalLink';

import classNames from 'classnames';

export default ({
  template,
  index,
  onFieldPathUpdate,
  onAddNewTemplateOrgFileAvailability,
  onRemoveTemplateOrgFileAvailability,
  onAddNewTemplateHeaderPath,
  onRemoveTemplateHeaderPath,
  onDeleteTemplate,
  syncBackendType,
  loadedFilePaths,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(!!template.get('description'));
  const handleHeaderBarClick = () => setIsCollapsed(!isCollapsed);

  const updateField = (fieldName) => (event) =>
    onFieldPathUpdate(template.get('id'), [fieldName], event.target.value);

  const toggleAvailabilityInAllOrgFiles = () =>
    onFieldPathUpdate(
      template.get('id'),
      ['isAvailableInAllOrgFiles'],
      !template.get('isAvailableInAllOrgFiles')
    );

  const togglePrepend = () =>
    onFieldPathUpdate(template.get('id'), ['shouldPrepend'], !template.get('shouldPrepend'));

  const toggleCaptureAsNewHeader = () =>
    onFieldPathUpdate(
      template.get('id'),
      ['shouldCaptureAsNewHeader'],
      !template.get('shouldCaptureAsNewHeader')
    );

  const handleAddNewOrgFileAvailability = () => {
    onAddNewTemplateOrgFileAvailability(template.get('id'));
  };

  const handleRemoveOrgFileAvailability = (index) => () =>
    onRemoveTemplateOrgFileAvailability(template.get('id'), index);

  const handleOrgFileAvailabilityChange = (orgFileAvailabilityIndex) => (event) =>
    onFieldPathUpdate(
      template.get('id'),
      ['orgFilesWhereAvailable', orgFileAvailabilityIndex],
      event.target.value
    );

  const handleAddNewHeaderPath = () => onAddNewTemplateHeaderPath(template.get('id'));

  const handleRemoveHeaderPath = (headerPathIndex) => () =>
    onRemoveTemplateHeaderPath(template.get('id'), headerPathIndex);

  const handleHeaderPathChange = (headerPathIndex) => (event) =>
    onFieldPathUpdate(template.get('id'), ['headerPaths', headerPathIndex], event.target.value);

  const handleDeleteClick = () => {
    if (
      window.confirm(
        `Are you sure you want to delete the "${template.get('description')}" template?`
      )
    ) {
      onDeleteTemplate(template.get('id'));
    }
  };

  const renderDescriptionField = (template) => (
    <div className="capture-template__field-container">
      <div className="capture-template__field">
        <div>Description:</div>
        <input
          type="text"
          className="textfield"
          value={template.get('description', '')}
          onChange={updateField('description')}
        />
      </div>
    </div>
  );

  const renderIconField = (template) => (
    <div className="capture-template__field-container">
      <div className="capture-template__field">
        <div>Letter:</div>
        <input
          type="text"
          className="textfield capture-template__letter-textfield"
          maxLength="1"
          value={template.get('letter', '')}
          onChange={updateField('letter')}
          autoCapitalize="none"
        />
      </div>

      <div className="capture-template__field__or-container">
        <div className="capture-template__field__or-line" />
        <div className="capture-template__field__or">or</div>
        <div className="capture-template__field__or-line" />
      </div>

      <div className="capture-template__field">
        <div>Icon name:</div>
        <input
          type="text"
          className="textfield"
          value={template.get('iconName')}
          onChange={updateField('iconName')}
          autoCapitalize="none"
          autoCorrect="none"
        />
      </div>

      <div className="capture-template__help-text">
        Instead of a letter, you can specify the name of any free Font Awesome icon (like lemon or
        calendar-plus) to use as the capture icon. You can search the available icons{' '}
        <ExternalLink href="https://fontawesome.com/icons?d=gallery&s=solid&m=free">
          here
        </ExternalLink>
        .
      </div>
    </div>
  );

  const renderOrgFileAvailability = (template) => (
    <div className="capture-template__field-container">
      <div className="capture-template__field">
        <div>Available in all org files?</div>
        <Switch
          isEnabled={template.get('isAvailableInAllOrgFiles')}
          onToggle={toggleAvailabilityInAllOrgFiles}
        />
      </div>

      <div className="capture-template__help-text">
        You can make this capture template available in all org files, or just the ones you specify.
        {syncBackendType === 'Dropbox' && (
          <Fragment>
            {' '}
            Specify full paths starting from the root of your Dropbox, like{' '}
            <code>/org/todo.org</code>
          </Fragment>
        )}
      </div>

      <Collapse
        isOpened={!template.get('isAvailableInAllOrgFiles')}
        springConfig={{ stiffness: 300 }}
      >
        <div className="multi-textfields-container">
          {template.get('orgFilesWhereAvailable').map((orgFilePath, index) => (
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

  const renderFilePath = (template) => {
    return (
      <div className="capture-template__field-container">
        <div className="capture-template__field">
          <div>File: </div>
          <select onChange={updateField('file')} style={{ width: '90%' }}>
            {(loadedFilePaths.filter((path) => (path === template.get('file', '')).length) !== 0
              ? loadedFilePaths
              : [template.get('file'), ...loadedFilePaths]
            ).map((path) => (
              <option key={path} value={path} selected={path === template.get('file')}>
                {path}
              </option>
            ))}
          </select>
        </div>
        <div className="capture-template__help-text">
          By default the file opened when capturing is the capture target. Select a specific file if
          you want this template to always capture to that file. Make sure the file is loaded for it
          to be selectable here. You might also consider to set the file to load on startup in the
          file settings so it's always available.
        </div>
      </div>
    );
  };

  const renderHeaderPaths = (template) => (
    <div className="capture-template__field-container">
      <div className="capture-template__field" style={{ marginTop: 7 }}>
        <div>Header path</div>
      </div>

      <div className="capture-template__help-text">
        Specify the path to the header under which the new header should be filed. One header per
        textfield.
      </div>

      <div className="multi-textfields-container">
        {template.get('headerPaths').map((headerPath, index) => (
          <div key={`header-path-${index}`} className="multi-textfield-container">
            <input
              type="text"
              placeholder="e.g., Todos"
              className="textfield multi-textfield-field"
              value={headerPath}
              onChange={handleHeaderPathChange(index)}
            />
            <button
              className="fas fa-times fa-lg remove-multi-textfield-button"
              onClick={handleRemoveHeaderPath(index)}
            />
          </div>
        ))}
      </div>

      <div className="add-new-multi-textfield-button-container">
        <button
          className="fas fa-plus add-new-multi-textfield-button"
          onClick={handleAddNewHeaderPath}
        />
      </div>
    </div>
  );

  const renderPrependField = (template) => (
    <div className="capture-template__field-container">
      <div className="capture-template__field">
        <div>Prepend?</div>
        <Switch isEnabled={template.get('shouldPrepend')} onToggle={togglePrepend} />
      </div>

      <div className="capture-template__help-text">
        By default, new captured headers are appended to the specified header path. Enable this
        setting to prepend them instead.
      </div>
    </div>
  );

  const renderCaptureAsNewHeader = (template) => (
    <div className="capture-template__field-container">
      <div className="capture-template__field">
        <div>Capture as new header?</div>
        <Switch
          isEnabled={template.get('shouldCaptureAsNewHeader')}
          onToggle={toggleCaptureAsNewHeader}
        />
      </div>

      <div className="capture-template__help-text">
        By default, new captured content is added as a new header. Disable this setting to append
        content to an existing one (the last one in the path).
      </div>
    </div>
  );

  const renderTemplateField = (template) => (
    <div className="capture-template__field-container">
      <div className="capture-template__field" style={{ marginTop: 7 }}>
        <div>Template</div>
      </div>

      <textarea
        className="textarea template-textarea"
        rows="3"
        value={template.get('template')}
        onChange={updateField('template')}
      />

      <div className="capture-template__help-text">
        The template for creating the capture item. You can use the following template variables
        that will be expanded upon capture:
        <ul>
          <li>
            <code>%?</code> - Place the cursor here.
          </li>
          <li>
            <code>%t</code> - Timestamp, date only.
          </li>
          <li>
            <code>%T</code> - Timestamp, with date and time.
          </li>
          <li>
            <code>%u</code> - Inactive timestamp, date only.
          </li>
          <li>
            <code>%U</code> - Inactive timestamp, with date and time.
          </li>
          <li>
            <code>%r</code> - Raw timestamp, date only, no surrounding punctation.
            <ul>
              <li>
                Build custom expressions like{' '}
                <code>TODO Monthly - %?\n DEADLINE: &lt;%r .+1m&gt;</code>
              </li>
            </ul>
          </li>
          <li>
            <code>%R</code> - Raw timestamp, with date and time, no surrounding punctuation.
          </li>
          <li>
            <code>%y</code> - Raw year
          </li>
          <li>
            <code>%{'<custom variable>'}</code> - A custom variable from a URL param capture. See{' '}
            <ExternalLink href="https://organice.200ok.ch/documentation.html#capture_templates">
              the README file
            </ExternalLink>{' '}
            for more details.
          </li>
        </ul>
        You can also use <code>%u</code> and <code>%t</code> as part of the header path.
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
    <Draggable draggableId={`capture-template--${template.get('id')}`} index={index}>
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
            <ActionButton
              iconName={template.get('iconName')}
              letter={template.get('letter')}
              onClick={() => {}}
              style={{ marginRight: 20 }}
            />
            <span className="capture-template-container__header__title">
              {template.get('description')}
            </span>
            <i
              className="fas fa-bars fa-lg capture-template-container__header__drag-handle"
              {...provided.dragHandleProps}
            />
          </div>

          <Collapse isOpened={!isCollapsed} springConfig={{ stiffness: 300 }}>
            <div className="capture-template-container__content">
              {renderDescriptionField(template)}
              {renderIconField(template)}
              {renderOrgFileAvailability(template)}
              {renderFilePath(template)}
              {renderHeaderPaths(template)}
              {renderPrependField(template)}
              {renderCaptureAsNewHeader(template)}
              {renderTemplateField(template)}
              {renderDeleteButton()}
            </div>
          </Collapse>
        </div>
      )}
    </Draggable>
  );
};
