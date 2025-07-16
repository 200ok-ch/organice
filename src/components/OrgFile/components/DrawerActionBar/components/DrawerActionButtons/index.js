import React, { useCallback } from 'react';

import './stylesheet.css';

const DrawerActionButtons = ({
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
}) => {
  // A nasty hack required to get click handling to work properly in Firefox. No idea why its
  // broken in the first place or why this fixes it.
  const iconWithFFClickCatcher = useCallback(
    ({ className, onClick, title, disabled, testId = '' }) => {
      return (
        <div
          title={title}
          onClick={!disabled ? onClick : undefined}
          className="header-action-drawer__ff-click-catcher-container"
        >
          <div className="header-action-drawer__ff-click-catcher" />
          <i className={className} data-testid={testId} />
        </div>
      );
    },
    []
  );

  const handleTitleClick = useCallback(() => {
    if ('title-editor' === activePopupType) {
      onSwitch();
      setEditRawValues(!editRawValues);
    } else {
      restorePreferEditRawValues();
    }
    onTitleClick();
  }, [
    activePopupType,
    editRawValues,
    onSwitch,
    setEditRawValues,
    restorePreferEditRawValues,
    onTitleClick,
  ]);

  const handleDescriptionClick = useCallback(() => {
    if ('description-editor' === activePopupType) {
      onSwitch();
      setEditRawValues(!editRawValues);
    } else {
      restorePreferEditRawValues();
    }
    onDescriptionClick();
  }, [
    activePopupType,
    editRawValues,
    onSwitch,
    setEditRawValues,
    restorePreferEditRawValues,
    onDescriptionClick,
  ]);

  return (
    <div className="header-action-drawer-container">
      <div className="header-action-drawer__row">
        {iconWithFFClickCatcher({
          className:
            'fas fa-pencil-alt fa-lg' +
            ('title-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
          onClick: handleTitleClick,
          title: 'Edit title',
        })}

        {iconWithFFClickCatcher({
          className:
            'fas fa-edit fa-lg' +
            ('description-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
          onClick: handleDescriptionClick,
          title: 'Edit description',
          testId: 'edit-header-title',
        })}

        {iconWithFFClickCatcher({
          className:
            'fas fa-tags fa-lg' +
            ('tags-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
          onClick: onTagsClick,
          title: 'Modify tags',
          disabled: 'tags-editor' === activePopupType,
        })}

        {iconWithFFClickCatcher({
          className:
            'fas fa-list fa-lg' +
            ('property-list-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
          onClick: onPropertiesClick,
          title: 'Modify properties',
          disabled: 'property-list-editor' === activePopupType,
        })}

        {iconWithFFClickCatcher({
          className:
            'fas fa-calendar-check fa-lg' +
            ('deadline-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
          onClick: onDeadlineClick,
          title: 'Set deadline datetime',
          disabled: 'deadline-editor' === activePopupType,
        })}
        {iconWithFFClickCatcher({
          className:
            'far fa-calendar-times fa-lg' +
            ('scheduled-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
          onClick: onScheduledClick,
          title: 'Set scheduled datetime',
          disabled: 'scheduled-editor' === activePopupType,
        })}

        {iconWithFFClickCatcher({
          className:
            'far fa-sticky-note fa-lg' +
            ('note-editor' === activePopupType ? ' drawer-action-button--selected' : ''),
          onClick: onAddNote,
          title: 'Add a note',
          disabled: 'note-editor' === activePopupType,
        })}

        {iconWithFFClickCatcher({
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
};

export default React.memo(DrawerActionButtons);
