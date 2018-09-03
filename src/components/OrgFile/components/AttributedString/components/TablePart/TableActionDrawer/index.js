import React, { PureComponent } from 'react';

import './TableActionDrawer.css';

export default class TableActionDrawer extends PureComponent {
  render() {
    return (
      <div>
        <div className="table-action-drawer-row">
          <i className="fas fa-pencil-alt fa-lg" />

          <span className="table-action-drawer__separator" />

          <div className="table-action-drawer__sub-icon-container">
            <i className="fas fa-plus fa-lg table-action-drawer__main-icon" />
            <i className="fas fa-columns fa-sm table-action-drawer__sub-icon table-action-drawer__sub-icon--rotated" />
          </div>

          <span className="table-action-drawer__separator" />

          <div className="table-action-drawer__sub-icon-container">
            <i className="fas fa-times fa-lg table-action-drawer__main-icon" />
            <i className="fas fa-columns fa-sm table-action-drawer__sub-icon table-action-drawer__sub-icon--rotated" />
          </div>
        </div>
        <div className="table-action-drawer-row table-action-drawer-row--lower">
          <div className="table-action-drawer__sub-icon-container">
            <i className="fas fa-plus fa-lg table-action-drawer__main-icon" />
            <i className="fas fa-columns fa-sm table-action-drawer__sub-icon" />
          </div>

          <span className="table-action-drawer__separator" />

          <div className="table-action-drawer__sub-icon-container">
            <i className="fas fa-times fa-lg table-action-drawer__main-icon" />
            <i className="fas fa-columns fa-sm table-action-drawer__sub-icon" />
          </div>
        </div>
      </div>
    );
  }
}
