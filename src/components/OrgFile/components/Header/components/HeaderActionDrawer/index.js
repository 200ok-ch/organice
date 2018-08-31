import React, { PureComponent } from 'react';

import './HeaderActionDrawer.css';

export default class HeaderActionDrawer extends PureComponent {
  render() {
    const {
      onEnterTitleEditMode,
      onEnterDescriptionEditMode,
      isFocused,
      onFocus,
      onUnfocus,
    } = this.props;

    return (
      <div className="header-action-drawer-container">
        <i className="fas fa-pencil-alt fa-lg" onClick={onEnterTitleEditMode} />

        <span className="header-action-drawer__separator" />

        <i className="fas fa-edit fa-lg" onClick={onEnterDescriptionEditMode} />

        <span className="header-action-drawer__separator" />

        {isFocused ? (
          <i className="fas fa-expand fa-lg" onClick={onUnfocus} />
        ) : (
          <i className="fas fa-compress fa-lg" onClick={onFocus} />
        )}
      </div>
    );
  }
}
