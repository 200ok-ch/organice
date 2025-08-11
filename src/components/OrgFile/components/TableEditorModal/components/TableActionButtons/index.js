import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { curry } from 'lodash/fp';
import {
  addNewTableRow,
  removeTableRow,
  addNewTableColumn,
  removeTableColumn,
  enterEditMode,
  moveTableRowUp,
  moveTableRowDown,
  moveTableColumnLeft,
  moveTableColumnRight,
} from '../../../../../../actions/org';

import './stylesheet.css';

const getSelectedCellId = curry((filePath, state) => {
  return state.org.present.getIn(['files', filePath, 'selectedTableCellId']);
});

const TableActionButtons = ({ filePath }) => {
  const dispatch = useDispatch();
  const selectedTableCellId = useSelector(getSelectedCellId(filePath));

  const handleEnterTableEditMode = () => {
    dispatch(enterEditMode('table'));
  };

  const handleAddNewTableRow = () => {
    dispatch(addNewTableRow());
  };

  const handleRemoveTableRow = () => {
    dispatch(removeTableRow());
  };

  const handleAddNewTableColumn = () => {
    dispatch(addNewTableColumn());
  };

  const handleRemoveTableColumn = () => {
    dispatch(removeTableColumn());
  };

  const handleUpClick = () => {
    dispatch(moveTableRowUp());
  };

  const handleDownClick = () => {
    dispatch(moveTableRowDown());
  };

  const handleLeftClick = () => {
    dispatch(moveTableColumnLeft());
  };

  const handleRightClick = () => {
    dispatch(moveTableColumnRight());
  };

  return (
    <div className="table-action-drawer">
      {
        <>
          <div className="table-action-drawer-container">
            <div
              className=" table-action-drawer__edit-icon-container"
              onClick={() => (selectedTableCellId ? handleEnterTableEditMode() : undefined)}
            >
              <i data-testid="edit-cell-button" className="fas fa-pencil-alt fa-lg" />
            </div>

            <div
              className="table-action-drawer__sub-icon-container"
              onClick={() => (selectedTableCellId ? handleAddNewTableColumn() : undefined)}
            >
              <i className="fas fa-plus fa-lg table-action-drawer__main-icon" />
              <i
                data-testid="add-column-button"
                className="fas fa-columns fa-sm table-action-drawer__sub-icon table-action-drawer__sub-icon--rotated"
              />
            </div>

            <div
              className="table-action-drawer__sub-icon-container"
              onClick={() => (selectedTableCellId ? handleRemoveTableColumn() : undefined)}
            >
              <i className="fas fa-times fa-lg table-action-drawer__main-icon" />
              <i
                data-testid="delete-column-button"
                className="fas fa-columns fa-sm table-action-drawer__sub-icon table-action-drawer__sub-icon--rotated"
              />
            </div>

            <div
              className="table-action-drawer__sub-icon-container"
              onClick={() => (selectedTableCellId ? handleAddNewTableRow() : undefined)}
            >
              <i className="fas fa-plus fa-lg table-action-drawer__main-icon" />
              <i
                data-testid="add-row-button"
                className="fas fa-columns fa-sm table-action-drawer__sub-icon"
              />
            </div>

            <div
              className="table-action-drawer__sub-icon-container"
              onClick={() => (selectedTableCellId ? handleRemoveTableRow() : undefined)}
            >
              <i className="fas fa-times fa-lg table-action-drawer__main-icon" />
              <i
                data-testid="delete-row-button"
                className="fas fa-columns fa-sm table-action-drawer__sub-icon"
              />
            </div>
          </div>

          <div className="table-action-movement-container">
            <div
              className="table-action-movement__up"
              onClick={() => (selectedTableCellId ? handleUpClick() : undefined)}
            >
              <i
                data-testid="up-button"
                className="fas fa-arrow-up fa-lg table-action-drawer__main-icon"
              />
            </div>
            <div
              className="table-action-movement__left"
              onClick={() => (selectedTableCellId ? handleLeftClick() : undefined)}
            >
              <i
                data-testid="left-button"
                className="fas fa-arrow-left fa-lg table-action-drawer__main-icon"
              />
            </div>

            <div
              className="table-action-movement__right"
              onClick={() => (selectedTableCellId ? handleRightClick() : undefined)}
            >
              <i
                data-testid="right-button"
                className="fas fa-arrow-right fa-lg table-action-drawer__main-icon"
              />
            </div>
            <div
              className="table-action-movement__down"
              onClick={() => (selectedTableCellId ? handleDownClick() : undefined)}
            >
              <i
                data-testid="down-button"
                className="fas fa-arrow-down fa-lg table-action-drawer__main-icon"
              />
            </div>
          </div>
        </>
      }
    </div>
  );
};

export default TableActionButtons;
