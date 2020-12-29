import React, { useState } from 'react';
import { UnmountClosed as Collapse } from 'react-collapse';

import { Draggable } from 'react-beautiful-dnd';

import './stylesheet.css';

import Switch from '../../../UI/Switch';

import classNames from 'classnames';

export default ({ setting, index, onFieldPathUpdate, onDeleteSetting, loadedFilepaths, path }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
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

  const toggleIncludeInRefile = () =>
    onFieldPathUpdate(setting.get('id'), ['includeInRefile'], !setting.get('includeInRefile'));

  const handleDeleteClick = () => {
    if (
      window.confirm(`Are you sure you want to delete the settings for "${setting.get('path')}"?`)
    ) {
      onDeleteSetting(setting.get('id'));
    }
  };

  const renderPathField = (setting) => {
    if (setting.get('path') === '') {
      updateField('path')({ target: { value: path || loadedFilepaths[0] } });
    }
    return (
      <div className="file-setting__field-container">
        <div className="file-setting__field">
          <div>Path: </div>
          <select onChange={updateField('path')} style={{ width: '90%' }}>
            {[setting.get('path'), ...loadedFilepaths].map((path) => (
              <option key={path} value={path}>
                {path}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const renderOptionFields = (setting) => (
    <>
      <div className="file-setting__field-container">
        <div className="file-setting__field">
          <div>Sync on startup?</div>
          <Switch isEnabled={setting.get('loadOnStartup')} onToggle={toggleLoadOnStartup} />
        </div>

        <div className="file-setting__help-text">
          By default, files are loaded from localStorage when available and are only synced when
          visited or when a sync is manually triggered. Enable this setting to always sync this file
          when opening organice.
        </div>
      </div>

      <div className="file-setting__field-container">
        <div className="file-setting__field">
          <div>Include in Agenda?</div>
          <Switch isEnabled={setting.get('includeInAgenda')} onToggle={toggleIncludeInAgenda} />
        </div>

        <div className="file-setting__help-text">
          By default, only the currently opened file is included in the agenda. Enable this setting
          to always include this file. The currently viewed file is always included.
        </div>
      </div>

      <div className="file-setting__field-container">
        <div className="file-setting__field">
          <div>Include in Search?</div>
          <Switch isEnabled={setting.get('includeInSearch')} onToggle={toggleIncludeInSearch} />
        </div>

        <div className="file-setting__help-text">
          By default, only the current viewed file is included in search. Enable this setting to
          always include this file. The currently loaded file is always included.
        </div>
      </div>

      <div className="file-setting__field-container">
        <div className="file-setting__field">
          <div>Include in Tasklist?</div>
          <Switch isEnabled={setting.get('includeInTasklist')} onToggle={toggleIncludeInTasklist} />
        </div>

        <div className="file-setting__help-text">
          By default, only the current viewed file is included in the tasklist. Enable this setting
          to always include this file. The currently loaded file is always included.
        </div>
      </div>

      <div className="file-setting__field-container">
        <div className="file-setting__field">
          <div>Include in Refile?</div>
          <Switch isEnabled={setting.get('includeInRefile')} onToggle={toggleIncludeInRefile} />
        </div>

        <div className="file-setting__help-text">
          By default, only the currently viewed file is available as a refile targets. Enable this
          setting to always include this file. The currently loaded file is always included.
        </div>
      </div>
    </>
  );

  const renderDeleteButton = () => (
    <div className="file-setting__field-container file-setting__delete-button-container">
      <button className="btn settings-btn file-setting__delete-button" onClick={handleDeleteClick}>
        Delete setting
      </button>
    </div>
  );

  const caretClassName = classNames(
    'fas fa-2x fa-caret-right file-setting-container__header__caret',
    {
      'file-setting-container__header__caret--rotated': !isCollapsed,
    }
  );

  return (
    <Draggable draggableId={`file-setting--${setting.get('path')}`} index={index}>
      {(provided, snapshot) => (
        <div
          className={classNames('file-setting-container', {
            'file-setting-container--dragging': snapshot.isDragging,
          })}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div className="file-setting-container__header" onClick={handleHeaderBarClick}>
            <i className={caretClassName} />
            <div className="file-setting-icons">
              <div
                className={classNames('load-on-startup-icon', {
                  'fas fa-sync-alt fa-lg file-setting-icon': setting.get('loadOnStartup'),
                })}
              />
              <div
                className={classNames({
                  'fas fa-calendar-alt fa-lg file-setting-icon': setting.get('includeInAgenda'),
                })}
              />
              <div
                className={classNames({
                  'fas fa-search fa-lg file-setting-icon': setting.get('includeInSearch'),
                })}
              />
              <div
                className={classNames({
                  'fas fa-tasks fa-lg file-setting-icon': setting.get('includeInTasklist'),
                })}
              />
              <div
                className={classNames({
                  'fas fa-file-export fa-lg file-setting-icon': setting.get('includeInRefile'),
                })}
              />
            </div>

            <span className="file_setting-container__header__title">{setting.get('path')}</span>

            <i
              className="fas fa-bars fa-lg file-setting-container__header__drag-handle"
              {...provided.dragHandleProps}
            />
          </div>

          <Collapse isOpened={!isCollapsed} springConfig={{ stiffness: 300 }}>
            <div className="file-setting-container__content">
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
