import React from 'react';

import './stylesheet.css';

export default ({
  subPartDataAndHandlers: {
    selectedTableCellId,
    onEnterTableEditMode,
    onAddNewTableRow,
    onRemoveTableRow,
    onAddNewTableColumn,
    onRemoveTableColumn,
    onUpClick,
    onLeftClick,
    onRightClick,
    onDownClick,
  },
}) => {
  return (
    <div className="table-action-drawer">
      {selectedTableCellId ? (
        <>
          <div className="table-action-drawer-container">
            <div
              className=" table-action-drawer__edit-icon-container"
              onClick={onEnterTableEditMode}
            >
              <i className="fas fa-pencil-alt fa-lg" />
            </div>

            <div className="table-action-drawer__sub-icon-container" onClick={onAddNewTableRow}>
              <i className="fas fa-plus fa-lg table-action-drawer__main-icon" />
              <i className="fas fa-columns fa-sm table-action-drawer__sub-icon table-action-drawer__sub-icon--rotated" />
            </div>

            <div className="table-action-drawer__sub-icon-container" onClick={onRemoveTableRow}>
              <i className="fas fa-times fa-lg table-action-drawer__main-icon" />
              <i className="fas fa-columns fa-sm table-action-drawer__sub-icon table-action-drawer__sub-icon--rotated" />
            </div>

            <div className="table-action-drawer__sub-icon-container" onClick={onAddNewTableColumn}>
              <i className="fas fa-plus fa-lg table-action-drawer__main-icon" />
              <i className="fas fa-columns fa-sm table-action-drawer__sub-icon" />
            </div>

            <div className="table-action-drawer__sub-icon-container" onClick={onRemoveTableColumn}>
              <i className="fas fa-times fa-lg table-action-drawer__main-icon" />
              <i className="fas fa-columns fa-sm table-action-drawer__sub-icon" />
            </div>
          </div>

          <div className="table-action-movement-container">
            <div className="table-action-movement__up" onClick={onUpClick}>
              <i className="fas fa-arrow-up fa-lg table-action-drawer__main-icon" />
            </div>
            <div className="table-action-movement__left" onClick={onLeftClick}>
              <i className="fas fa-arrow-left fa-lg table-action-drawer__main-icon" />
            </div>

            <div className="table-action-movement__right" onClick={onRightClick}>
              <i className="fas fa-arrow-right fa-lg table-action-drawer__main-icon" />
            </div>
            <div className="table-action-movement__down" onClick={onDownClick}>
              <i className="fas fa-arrow-down fa-lg table-action-drawer__main-icon" />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
