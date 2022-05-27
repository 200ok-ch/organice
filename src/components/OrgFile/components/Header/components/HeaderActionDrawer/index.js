import React, { PureComponent } from 'react';

import './stylesheet.css';

export default class HeaderActionDrawer extends PureComponent {
  // A nasty hack required to get click handling to work properly in Firefox. No idea why its
  // broken in the first place or why this fixes it.
  iconWithFFClickCatcher({ className, onClick, title, testId = '' }) {
    return (
      <div
        title={title}
        onClick={onClick}
        className="header-action-drawer__ff-click-catcher-container"
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
      onNotificationsClick,
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
    } = this.props;

    return (
      <div className="header-action-drawer-container">
        <div className="header-action-drawer__row">
          {this.iconWithFFClickCatcher({
            className: 'fas fa-pencil-alt fa-lg',
            onClick: onTitleClick,
            title: 'Edit header title',
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
          })}

          {this.iconWithFFClickCatcher({
            className: 'fas fa-bell fa-lg',
            onClick: onNotificationsClick,
            title: 'Modify notifications',
          })}

          {this.iconWithFFClickCatcher({
            className: 'fas fa-list fa-lg',
            onClick: onPropertiesClick,
            title: 'Modify properties',
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
            testId: 'header-action-plus',
            title: 'Create new header below',
          })}
        </div>

        <div className="header-action-drawer__row">
          {this.iconWithFFClickCatcher({
            className: 'fas fa-envelope fa-lg',
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
