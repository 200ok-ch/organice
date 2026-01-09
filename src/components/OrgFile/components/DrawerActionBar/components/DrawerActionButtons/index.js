import React, { PureComponent } from 'react';

import './stylesheet.css';

export default class DrawerActionButtons extends PureComponent {
  // A nasty hack required to get click handling to work properly in Firefox. No idea why its
  // broken in the first place or why this fixes it.
  iconWithFFClickCatcher({ className, onClick, title, disabled, testId = '' }) {
    return (
      <div
        title={title}
        onClick={!disabled ? onClick : undefined}
        className="header-action-drawer__ff-click-catcher-container"
        data-id={testId}
      >
        <div className="header-action-drawer__ff-click-catcher" />
        <i className={className} data-id={testId} />
      </div>
    );
  }

  render() {
    const {
      onSwitch,
      onTitleClick,
      onDescriptionClick,
      onTagsClick,
      onPropertiesClick,
      onDeadlineClick,
      onScheduledClick,
      onAddNote,
      onRemoveHeader,
      activePopupType,
      editRawValues,
      setEditRawValues,
      restorePreferEditRawValues,
    } = this.props;

    return (
      <div className="header-action-drawer-container">
        <div className="header-action-drawer__row">
          {this.iconWithFFClickCatcher({
            className:
              'fas fa-pencil-alt fa-lg' +
              ('title-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
            onClick: () => {
              if ('title-editor' === activePopupType) {
                onSwitch();
                setEditRawValues(!editRawValues);
              } else {
                restorePreferEditRawValues();
              }
              onTitleClick();
            },
            title: 'Edit title',
            testId: 'drawer-action-edit-title',
          })}

          {this.iconWithFFClickCatcher({
            className:
              'fas fa-edit fa-lg' +
              ('description-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
            onClick: () => {
              if ('description-editor' === activePopupType) {
                onSwitch();
                setEditRawValues(!editRawValues);
              } else {
                restorePreferEditRawValues();
              }
              onDescriptionClick();
            },
            title: 'Edit description',
            testId: 'edit-header-title',
          })}

          {this.iconWithFFClickCatcher({
            className:
              'fas fa-tags fa-lg' +
              ('tags-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
            onClick: onTagsClick,
            title: 'Modify tags',
            disabled: 'tags-editor' === activePopupType,
            testId: 'drawer-action-tags',
          })}

          {this.iconWithFFClickCatcher({
            className:
              'fas fa-list fa-lg' +
              ('property-list-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
            onClick: onPropertiesClick,
            title: 'Modify properties',
            disabled: 'property-list-editor' === activePopupType,
            testId: 'drawer-action-properties',
          })}

          {this.iconWithFFClickCatcher({
            className:
              'fas fa-calendar-check fa-lg' +
              ('deadline-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
            onClick: onDeadlineClick,
            title: 'Set deadline datetime',
            disabled: 'deadline-editor' === activePopupType,
            testId: 'drawer-action-deadline',
          })}
          {this.iconWithFFClickCatcher({
            className:
              'far fa-calendar-check fa-lg' +
              ('scheduled-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
            onClick: onScheduledClick,
            title: 'Set scheduled datetime',
            disabled: 'scheduled-editor' === activePopupType,
            testId: 'drawer-action-scheduled',
          })}

          {this.iconWithFFClickCatcher({
            className:
              'far fa-sticky-note fa-lg' +
              ('note-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
            onClick: onAddNote,
            title: 'Add a note',
            disabled: 'note-editor' === activePopupType,
          })}

          {this.iconWithFFClickCatcher({
            className:
              'fas fa-trash fa-lg' +
              ('note-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
            onClick: onRemoveHeader,
            title: 'Delete this header',
            disabled: 'note-editor' === activePopupType,
          })}
        </div>
      </div>
    );
  }
}
