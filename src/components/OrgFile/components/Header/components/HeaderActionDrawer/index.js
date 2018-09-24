import React, { PureComponent } from 'react';

import './HeaderActionDrawer.css';

export default class HeaderActionDrawer extends PureComponent {
  render() {
    const {
      onEnterTitleEditMode,
      onEnterDescriptionEditMode,
      onTagsClick,
      isFocused,
      onFocus,
      onUnfocus,
      onAddNewHeader,
    } = this.props;

    return (
      <div className="header-action-drawer-container">
        <div className="header-action-drawer__row">
          <i className="fas fa-pencil-alt fa-lg" onClick={onEnterTitleEditMode} />

          <span className="header-action-drawer__separator" />

          <i className="fas fa-edit fa-lg" onClick={onEnterDescriptionEditMode} />

          <span className="header-action-drawer__separator" />

          <i className="fas fa-tags fa-lg" onClick={onTagsClick} />

          <span className="header-action-drawer__separator" />

          {isFocused ? (
            <i className="fas fa-expand fa-lg" onClick={onUnfocus} />
          ) : (
            <i className="fas fa-compress fa-lg" onClick={onFocus} />
          )}

          <span className="header-action-drawer__separator" />

          <i className="fas fa-plus fa-lg" onClick={onAddNewHeader} />
        </div>
        <div className="header-action-drawer__row">
          <div className="header-action-drawer__deadline-scheduled-button">Deadline</div>

          <span className="header-action-drawer__separator" />

          <div className="header-action-drawer__deadline-scheduled-button">Scheduled</div>
        </div>
      </div>
    );
  }
}
