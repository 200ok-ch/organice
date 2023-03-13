import React from 'react';

import './stylesheet.css';

export default ({
  subPartDataAndHandlers: { onEnterListEditMode, onAddNewListItem, onRemoveListItem },
}) => {
  return (
    <div className="list-action-drawer-container">
      <div className=" list-action-drawer__edit-icon-container" onClick={onEnterListEditMode}>
        <i className="fas fa-pencil-alt fa-lg" />
      </div>

      <div className="list-action-drawer__edit-icon-container" onClick={onAddNewListItem}>
        <i className="fas fa-plus fa-lg list-action-drawer__main-icon" />
      </div>

      <div className="list-action-drawer__edit-icon-container" onClick={onRemoveListItem}>
        <i className="fas fa-times fa-lg list-action-drawer__main-icon" />
      </div>
    </div>
  );
};
