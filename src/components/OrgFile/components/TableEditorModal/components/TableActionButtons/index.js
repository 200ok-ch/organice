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
      {
        <>
          <div className="table-action-drawer-container">
            <div
              className=" table-action-drawer__edit-icon-container"
              onClick={() => (selectedTableCellId ? onEnterTableEditMode() : undefined)}
            >
              <i className="fas fa-pencil-alt fa-lg" />
            </div>

            <div
              className="table-action-drawer__sub-icon-container"
              onClick={() => (selectedTableCellId ? onAddNewTableColumn() : undefined)}
            >
              <i className="fas fa-plus fa-lg table-action-drawer__main-icon" />
              <i className="fas fa-columns fa-sm table-action-drawer__sub-icon table-action-drawer__sub-icon--rotated" />
            </div>

            <div
              className="table-action-drawer__sub-icon-container"
              onClick={() => (selectedTableCellId ? onRemoveTableColumn() : undefined)}
            >
              <i className="fas fa-times fa-lg table-action-drawer__main-icon" />
              <i className="fas fa-columns fa-sm table-action-drawer__sub-icon table-action-drawer__sub-icon--rotated" />
            </div>

            <div
              className="table-action-drawer__sub-icon-container"
              onClick={() => (selectedTableCellId ? onAddNewTableRow() : undefined)}
            >
              <i className="fas fa-plus fa-lg table-action-drawer__main-icon" />
              <i className="fas fa-columns fa-sm table-action-drawer__sub-icon" />
            </div>

            <div
              className="table-action-drawer__sub-icon-container"
              onClick={() => (selectedTableCellId ? onRemoveTableRow() : undefined)}
            >
              <i className="fas fa-times fa-lg table-action-drawer__main-icon" />
              <i className="fas fa-columns fa-sm table-action-drawer__sub-icon" />
            </div>
          </div>

          <div className="table-action-movement-container">
            <div
              className="table-action-movement__up"
              onClick={() => (selectedTableCellId ? onUpClick() : undefined)}
            >
              <i className="fas fa-arrow-up fa-lg table-action-drawer__main-icon" />
            </div>
            <div
              className="table-action-movement__left"
              onClick={() => (selectedTableCellId ? onLeftClick() : undefined)}
            >
              <i className="fas fa-arrow-left fa-lg table-action-drawer__main-icon" />
            </div>

            <div
              className="table-action-movement__right"
              onClick={() => (selectedTableCellId ? onRightClick() : undefined)}
            >
              <i className="fas fa-arrow-right fa-lg table-action-drawer__main-icon" />
            </div>
            <div
              className="table-action-movement__down"
              onClick={() => (selectedTableCellId ? onDownClick() : undefined)}
            >
              <i className="fas fa-arrow-down fa-lg table-action-drawer__main-icon" />
            </div>
          </div>
        </>
      }
    </div>
  );
};
