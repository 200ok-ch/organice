import React, { PureComponent } from 'react';

import './stylesheet.css';

export default class HeaderActionDrawer extends PureComponent {
  constructor(props) {
    super(props);
    this.longPressTimer = null;
    this.isLongPressing = false;
  }

  // A nasty hack required to get click handling to work properly in Firefox. No idea why its
  // broken in the first place or why this fixes it.
  iconWithFFClickCatcher({ className, onClick, onLongPress, title, testId = '' }) {
    const handleMouseDown = onLongPress
      ? (e) => {
          this.isLongPressing = false;
          // Store reference to the target element to avoid React event pooling issues
          const targetElement = e.currentTarget;
          // Add visual feedback class immediately for better UX
          targetElement.classList.add('header-action-drawer__long-press-feedback');
          this.longPressTimer = setTimeout(() => {
            this.isLongPressing = true;
            onLongPress(e);
            // Add success feedback class
            targetElement.classList.add('header-action-drawer__long-press-success');
          }, 600);
        }
      : undefined;

    const handleMouseUp = onLongPress
      ? (e) => {
          if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
          }
          // Remove visual feedback classes
          e.currentTarget.classList.remove('header-action-drawer__long-press-feedback');
          e.currentTarget.classList.remove('header-action-drawer__long-press-success');
        }
      : undefined;

    const handleMouseLeave = onLongPress
      ? (e) => {
          if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
          }
          // Remove visual feedback classes
          e.currentTarget.classList.remove('header-action-drawer__long-press-feedback');
          e.currentTarget.classList.remove('header-action-drawer__long-press-success');
        }
      : undefined;

    const handleClick = onClick
      ? (e) => {
          // Only trigger regular click if it wasn't a long press
          if (!this.isLongPressing) {
            onClick(e);
          }
          this.isLongPressing = false;
        }
      : undefined;

    return (
      <div
        title={title}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onTouchCancel={handleMouseLeave}
        className="header-action-drawer__ff-click-catcher-container"
        data-id={testId}
      >
        <div className="header-action-drawer__ff-click-catcher" />
        <i className={className} data-testid={testId} />
      </div>
    );
  }

  render() {
    const {
      onTitleClick,
      onDescriptionClick,
      onTagsClick,
      onPropertiesClick,
      isNarrowed,
      onNarrow,
      onWiden,
      onAddNewHeader,
      onDeadlineClick,
      onClockInOutClick,
      onScheduledClick,
      hasActiveClock,
      onShareHeader,
      onRefileHeader,
      onAddNote,
      onDuplicateHeader,
    } = this.props;

    // Create a fallback function for onDuplicateHeader if not provided
    const handleDuplicateHeader =
      onDuplicateHeader ||
      ((e) => {
        // As a fallback, just call the regular add new header function
        if (onAddNewHeader) {
          onAddNewHeader(e);
        }
      });

    return (
      <div className="header-action-drawer-container" data-testid="header-action-drawer">
        <div className="header-action-drawer__row">
          {this.iconWithFFClickCatcher({
            className: 'fas fa-pencil-alt fa-lg',
            onClick: onTitleClick,
            title: 'Edit header title',
            testId: 'drawer-action-edit-title',
          })}

          {this.iconWithFFClickCatcher({
            className: 'fas fa-edit fa-lg',
            onClick: onDescriptionClick,
            title: 'Edit header description',
            testId: 'edit-header-title',
          })}

          {this.iconWithFFClickCatcher({
            className: 'fas fa-tags fa-lg',
            onClick: onTagsClick,
            title: 'Modify tags',
            testId: 'drawer-action-tags',
          })}

          {this.iconWithFFClickCatcher({
            className: 'fas fa-list fa-lg',
            onClick: onPropertiesClick,
            title: 'Modify properties',
            testId: 'drawer-action-properties',
          })}

          {isNarrowed
            ? this.iconWithFFClickCatcher({
                className: 'fas fa-expand fa-lg',
                onClick: onWiden,
                title: 'Widen (Cancelling the narrowing.)',
              })
            : this.iconWithFFClickCatcher({
                className: 'fas fa-compress fa-lg',
                onClick: onNarrow,
                testId: 'header-action-narrow',
                title:
                  'Narrow to subtree (focusing in on some portion of the buffer, making the rest temporarily inaccessible.)',
              })}

          {this.iconWithFFClickCatcher({
            className: 'fas fa-plus fa-lg',
            onClick: onAddNewHeader,
            onLongPress: handleDuplicateHeader,
            testId: 'header-action-plus',
            title: 'Create new header below (long-press to duplicate current header)',
          })}
        </div>

        <div className="header-action-drawer__row">
          {this.iconWithFFClickCatcher({
            className: 'fas fa-share fa-lg',
            onClick: onShareHeader,
            testId: 'share',
            title: 'Share this header via email',
          })}
          {this.iconWithFFClickCatcher({
            className: 'fas fa-calendar-check fa-lg',
            onClick: onDeadlineClick,
            title: 'Set deadline datetime',
          })}
          {this.iconWithFFClickCatcher({
            className: 'far fa-calendar-check fa-lg',
            onClick: onScheduledClick,
            title: 'Set scheduled datetime',
          })}
          {hasActiveClock
            ? this.iconWithFFClickCatcher({
                className: 'fas fa-hourglass-end fa-lg',
                onClick: onClockInOutClick,
                testId: 'org-clock-out',
                title: 'Clock out (Stop the clock)',
              })
            : this.iconWithFFClickCatcher({
                className: 'fas fa-hourglass-start fa-lg',
                onClick: onClockInOutClick,
                testId: 'org-clock-in',
                title: 'Clock in (Start the clock)',
              })}

          {this.iconWithFFClickCatcher({
            className: 'fas fa-file-export fa-lg',
            onClick: onRefileHeader,
            testId: 'org-refile',
            title: 'Refile this header to another header',
          })}
          {this.iconWithFFClickCatcher({
            className: 'far fa-sticky-note fa-lg',
            onClick: onAddNote,
            title: 'Add a note',
          })}
        </div>
      </div>
    );
  }
}
