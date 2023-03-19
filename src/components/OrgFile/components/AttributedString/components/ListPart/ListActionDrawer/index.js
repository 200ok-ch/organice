import React from 'react';

import './stylesheet.css';

export default ({
  subPartDataAndHandlers: {
    onEnterListTitleEditMode,
    onEnterListContentsEditMode,
    onAddNewListItem,
    onRemoveListItem,
  },
}) => {
  return (
    <div className="list-action-drawer-container">
      <div className="list-action-drawer__row">
        <div className="list-action-drawer__edit-icon-container" onClick={onEnterListTitleEditMode}>
          <i className="fas fa-pencil-alt fa-lg" />
        </div>

        <span className="list-action-drawer__separator" />

        <div
          className="list-action-drawer__edit-icon-container"
          onClick={onEnterListContentsEditMode}
        >
          <i className="fas fa-edit fa-lg" />
        </div>

        <span className="list-action-drawer__separator" />

        <div className="list-action-drawer__edit-icon-container" onClick={onAddNewListItem}>
          <i className="fas fa-plus fa-lg" />
        </div>

        <span className="list-action-drawer__separator" />

        <div className="list-action-drawer__edit-icon-container" onClick={onRemoveListItem}>
          <i className="fas fa-times fa-lg" />
        </div>
      </div>
    </div>
  );
};
