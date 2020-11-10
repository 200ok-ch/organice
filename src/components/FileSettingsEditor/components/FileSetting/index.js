import React, { Fragment, useState } from 'react';
import { UnmountClosed as Collapse } from 'react-collapse';

import { Draggable } from 'react-beautiful-dnd';

import './stylesheet.css';

import Switch from '../../../UI/Switch';

import classNames from 'classnames';

export default ({ setting, index, onFieldPathUpdate, onDeleteSetting }) => {
  const [isCollapsed, setIsCollapsed] = useState(!!setting.get('description'));
  const handleHeaderBarClick = () => setIsCollapsed(!isCollapsed);

  const updateField = (fieldName) => (event) =>
    onFieldPathUpdate(setting.get('id'), [fieldName], event.target.value);

  const toggleLoadOnStartup = () =>
    onFieldPathUpdate(setting.get('id'), ['loadOnStartup'], !setting.get('loadOnStartup'));

  const toggleIncludeInAgenda = () =>
    onFieldPathUpdate(setting.get('id'), ['includeInAgenda'], !setting.get('includeInAgenda'));

  const toggleIncludeInSearch = () =>
    onFieldPathUpdate(setting.get('id'), ['includeInSearch'], !setting.get('includeInSearch'));

  const toggleIncludeInTasklist = () =>
    onFieldPathUpdate(setting.get('id'), ['includeInTasklist'], !setting.get('includeInTasklist'));

  const handleDeleteClick = () => {
    if (
      window.confirm(`Are you sure you want to delete the settings for "${setting.get('path')}"?`)
    ) {
      onDeleteSetting(setting.get('id'));
    }
  };

  const renderPathField = (setting) => (
    <div className="capture-template__field-container">
      <div className="capture-template__field">
        <div>Path: </div>
        <input
          type="text"
          className="textfield"
          style={{ width: '90%' }}
          value={setting.get('path', '')}
          onChange={updateField('path')}
          placeholder="e.g. /org/todo.org"
        />
      </div>
    </div>
  );

  const renderOptionFields = (setting) => (
    <>
      <div className="capture-template__field-container">
        <div className="capture-template__field">
          <div>Load on startup?</div>
          <Switch isEnabled={setting.get('loadOnStartup')} onToggle={toggleLoadOnStartup} />
        </div>

        <div className="capture-template__help-text">
          By default, only the files you visit are loaded. Enable this setting to always load this
          file when opening organice.
        </div>
      </div>

      <div className="capture-template__field-container">
        <div className="capture-template__field">
          <div>Include in Agenda?</div>
          <Switch isEnabled={setting.get('includeInAgenda')} onToggle={toggleIncludeInAgenda} />
        </div>

        <div className="capture-template__help-text">
          By default, all loaded files are included in the agenda. Disable this setting to exclude
          this file. The currently viewed file is always included.
        </div>
      </div>

      <div className="capture-template__field-container">
        <div className="capture-template__field">
          <div>Include in Search?</div>
          <Switch isEnabled={setting.get('includeInSearch')} onToggle={toggleIncludeInSearch} />
        </div>

        <div className="capture-template__help-text">
          By default, only the current viewed file is included in search. Enable this setting to
          always include this file. The currently loaded file is always included.
        </div>
      </div>

      <div className="capture-template__field-container">
        <div className="capture-template__field">
          <div>Include in Tasklist?</div>
          <Switch isEnabled={setting.get('includeInTasklist')} onToggle={toggleIncludeInTasklist} />
        </div>

        <div className="capture-template__help-text">
          By default, only the current viewed file is included in the tasklist. Enable this setting
          to always include this file. The currently loaded file is always included.
        </div>
      </div>
    </>
  );

  const renderDeleteButton = () => (
    <div className="capture-template__field-container capture-template__delete-button-container">
      <button
        className="btn settings-btn capture-template__delete-button"
        onClick={handleDeleteClick}
      >
        Delete setting
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
    <Draggable draggableId={`capture-template--${setting.get('path')}`} index={index}>
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
            <div className="file-setting-icons">
              <div
                className={classNames({
                  'fas fa-sync-alt fa-lg file-setting-icon': setting.get('loadOnStartup'),
                })}
              />
              <div
                className={classNames({
                  'fas fa-calendar-alt fa-lg file-setting-icon': setting.get('includeInAgenda'),
                })}
              />
              <div
                className={classNames({ 'fas fa-search fa-lg file-setting-icon': setting.get('includeInSearch') })}
              />
              <div
                className={classNames({ 'fas fa-tasks fa-lg file-setting-icon': setting.get('includeInTasklist') })}
              />
            </div>

            <span className="file_setting-container__header__title">{setting.get('path')}</span>

            <i
              className="fas fa-bars fa-lg capture-template-container__header__drag-handle"
              {...provided.dragHandleProps}
            />
          </div>

          <Collapse isOpened={!isCollapsed} springConfig={{ stiffness: 300 }}>
            <div className="capture-template-container__content">
              {renderPathField(setting)}
              {renderOptionFields(setting)}
              {renderDeleteButton()}
            </div>
          </Collapse>
        </div>
      )}
    </Draggable>
  );
};
