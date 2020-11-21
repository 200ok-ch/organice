import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { UnmountClosed as Collapse } from 'react-collapse';

import './stylesheet.css';

import Drawer from '../../../UI/Drawer/';
import AttributedString from '../AttributedString';
import TableActionButtons from './TableActionButtons';

import * as baseActions from '../../../../actions/base';
import * as orgActions from '../../../../actions/org';

import _ from 'lodash';
import classNames from 'classnames';
import { Map } from 'immutable';

import { headerWithId } from '../../../../lib/org_utils';
import { getCurrentTimestampAsText } from '../../../../lib/timestamps';

class TableEditorModal extends PureComponent {
  constructor(props) {
    super(props);
    _.bindAll(this, [
      'handleCellSelect',
      'handleTextareaBlur',
      'handleCellChange',
      'handleInsertTimestamp',
      'handleTextareaRef',
      'handleTableCellSelect',
      'handleTableCellValueUpdate',
      'handleExitTableEditMode',
      'handleEnterTableEditMode',
      'handleAddNewTableRow',
      'handleRemoveTableRow',
      'handleAddNewTableColumn',
      'handleRemoveTableColumn',
      'handleCheckboxClick',
      'handleTimestampClick',
      'handleUpClick',
      'handleDownClick',
      'handleLeftClick',
      'handleRightClick',
    ]);

    this.state = {
      rawCellValues: this.generateCellValueMap(props.table),
      shouldIgnoreBlur: false,
    };
  }

  componentDidUpdate(prevProps) {
    const { selectedTableCellId, inTableEditMode } = this.props;
    const { rawCellValues } = this.state;

    if (prevProps.inTableEditMode && !inTableEditMode) {
      if (rawCellValues.has(selectedTableCellId)) {
        this.handleTableCellValueUpdate(
          selectedTableCellId,
          rawCellValues.get(selectedTableCellId)
        );
      }
    }

    if (this.props.table !== prevProps.table) {
      this.setState({ rawCellValues: this.generateCellValueMap(this.props.table) });
    }
  }

  generateCellValueMap(table) {
    return Map(
      table
        .get('contents')
        .map((row) => row.get('contents').map((cell) => [cell.get('id'), cell.get('rawContents')]))
        .flatten()
    );
  }

  handleCellSelect(cellId) {
    return () => this.handleTableCellSelect(cellId);
  }

  handleTextareaBlur() {
    setTimeout(() => {
      if (!this.state.shouldIgnoreBlur) {
        this.handleExitTableEditMode();
      } else {
        this.setState({ shouldIgnoreBlur: false });
      }
    }, 0);
  }

  handleCellChange(event) {
    const { rawCellValues } = this.state;
    const { selectedTableCellId } = this.props;

    this.setState({
      rawCellValues: rawCellValues.set(selectedTableCellId, event.target.value),
    });
  }

  handleInsertTimestamp() {
    // Clicking this button will unfocus the textarea, but we don't want to exit edit mode,
    // so instruct the blur handler to ignore the event.
    this.setState({ shouldIgnoreBlur: true });

    const { rawCellValues } = this.state;
    const { selectedTableCellId } = this.props;
    const cellValue = rawCellValues.get(selectedTableCellId);

    const insertionIndex = this.textarea.selectionStart;
    this.setState({
      rawCellValues: rawCellValues.set(
        selectedTableCellId,
        cellValue.substring(0, insertionIndex) +
          getCurrentTimestampAsText() +
          cellValue.substring(this.textarea.selectionEnd || insertionIndex)
      ),
    });

    this.textarea.focus();
  }

  handleTextareaRef(textarea) {
    this.textarea = textarea;
  }

  handleTableCellSelect(cellId) {
    this.props.org.setSelectedTableCellId(cellId);
  }

  handleTableCellValueUpdate(cellId, newValue) {
    this.props.org.updateTableCellValue(cellId, newValue);
  }

  handleExitTableEditMode() {
    this.props.org.exitEditMode();
  }

  handleEnterTableEditMode() {
    this.props.org.enterEditMode('table');
  }

  handleAddNewTableRow() {
    this.props.org.addNewTableRow();
  }

  handleRemoveTableRow() {
    this.props.org.removeTableRow();
  }

  handleAddNewTableColumn() {
    this.props.org.addNewTableColumn();
  }

  handleRemoveTableColumn() {
    this.props.org.removeTableColumn();
  }

  handleCheckboxClick(listItemId) {
    this.props.org.advanceCheckboxState(listItemId);
  }

  handleTimestampClick(timestampId) {
    this.props.base.activatePopup('timestamp-editor', { timestampId });
  }

  handleUpClick() {
    this.props.org.moveTableRowUp();
  }

  handleDownClick() {
    this.props.org.moveTableRowDown();
  }

  handleLeftClick() {
    this.props.org.moveTableColumnLeft();
  }

  handleRightClick() {
    this.props.org.moveTableColumnRight();
  }

  render() {
    const { table, selectedTableCellId, inTableEditMode, shouldDisableActions } = this.props;
    const { rawCellValues } = this.state;

    const subPartDataAndHandlers = {
      onTableCellSelect: this.handleTableCellSelect,
      selectedTableCellId: selectedTableCellId,
      inTableEditMode: inTableEditMode,
      onExitTableEditMode: this.handleExitTableEditMode,
      onTableCellValueUpdate: this.handleTableCellValueUpdate,
      onEnterTableEditMode: this.handleEnterTableEditMode,
      onAddNewTableRow: this.handleAddNewTableRow,
      onRemoveTableRow: this.handleRemoveTableRow,
      onAddNewTableColumn: this.handleAddNewTableColumn,
      onRemoveTableColumn: this.handleRemoveTableColumn,
      onCheckboxClick: this.handleCheckboxClick,
      onTimestampClick: this.handleTimestampClick,
      onUpClick: this.handleUpClick,
      onDownClick: this.handleDownClick,
      onLeftClick: this.handleLeftClick,
      onRightClick: this.handleRightClick,
      shouldDisableActions,
    };

    return (
      <>
        <h2 className="drawer-modal__title">Edit table</h2>
        <table className="table-part">
          <tbody>
            {table.get('contents').map((row) => (
              <tr key={row.get('id')}>
                {row.get('contents').map((cell) => {
                  const isCellSelected = cell.get('id') === selectedTableCellId;

                  const className = classNames('table-part__cell', {
                    'table-part__cell--selected': isCellSelected,
                  });

                  return (
                    <td
                      className={className}
                      key={cell.get('id')}
                      onClick={this.handleCellSelect(cell.get('id'))}
                    >
                      {isCellSelected && inTableEditMode ? (
                        <div className="table-cell__edit-container">
                          <textarea
                            autoFocus
                            className="textarea"
                            rows="3"
                            value={rawCellValues.get(cell.get('id'))}
                            onBlur={this.handleTextareaBlur}
                            onChange={this.handleCellChange}
                            ref={this.handleTextareaRef}
                          />
                          <div
                            className="table-cell__insert-timestamp-button"
                            onClick={this.handleInsertTimestamp}
                          >
                            <i className="fas fa-plus insert-timestamp-icon" />
                            Insert timestamp
                          </div>
                        </div>
                      ) : cell.get('contents').size > 0 ? (
                        <AttributedString
                          parts={cell.get('contents')}
                          subPartDataAndHandlers={subPartDataAndHandlers}
                        />
                      ) : (
                        '   '
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <Collapse isOpened={!shouldDisableActions}>
          <TableActionButtons subPartDataAndHandlers={subPartDataAndHandlers} />
        </Collapse>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const headers = state.org.present.get('headers');
  const selectedHeaderId = state.org.present.get('selectedHeaderId');
  const selectedHeader = headers && selectedHeaderId && headerWithId(headers, selectedHeaderId);
  const selectedTableId = state.org.present.get('selectedTableId');
  const table = selectedHeader
    ? selectedHeader.get('description').find((part) => part.get('id') === selectedTableId)
    : null;
  return {
    table,
    selectedTableCellId: state.org.present.get('selectedTableCellId'),
    inTableEditMode: state.org.present.get('editMode') === 'table',
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    base: bindActionCreators(baseActions, dispatch),
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(TableEditorModal);
