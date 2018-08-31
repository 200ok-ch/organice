import React, { PureComponent } from 'react';

import './HeaderActionDrawer.css';

export default class HeaderActionDrawer extends PureComponent {
  render() {
    return (
      <div className="header-action-drawer-container">
        <i className="fas fa-pencil-alt fa-lg" />

        <span className="header-action-drawer__separator" />

        <i className="fas fa-edit fa-lg" />

        <span className="header-action-drawer__separator" />

        <i className="fas fa-compress fa-lg" />
      </div>
    );
  }
}
