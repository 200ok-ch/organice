import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './HeaderContent.css';

import _ from 'lodash';

import * as orgActions from '../../../../actions/org';
import * as baseActions from '../../../../actions/base';

import { getCurrentTimestampAsText } from '../../../../lib/timestamps';

import AttributedString from '../AttributedString';

class HeaderContent extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleRef',
      'handleTextareaRef',
      'handleDescriptionChange',
      'handleTextareaBlur',
      'handleTableCellSelect',
      'handleExitTableEditMode',
      'handleTableCellValueUpdate',
      'handleEnterTableEditMode',
      'handleAddNewTableRow',
      'handleRemoveTableRow',
      'handleAddNewTableColumn',
      'handleRemoveTableColumn',
      'handleCheckboxClick',
      'handleTimestampClick',
      'handleInsertTimestamp',
    ]);

    this.state = {
      descriptionValue: props.header.get('rawDescription'),
      containerWidth: null,
      shouldIgnoreBlur: false,
    };
  }

  storeContainerWidth() {
    if (this.containerDiv) {
      this.setState({ containerWidth: this.containerDiv.offsetWidth });
    }
  }

  componentDidMount() {
    this.storeContainerWidth();
  }

  componentDidUpdate(prevProps) {
    const { header } = this.props;

    if (prevProps.inEditMode && !this.props.inEditMode) {
      this.props.org.updateHeaderDescription(header.get('id'), this.state.descriptionValue);
    }

    if (prevProps.header !== this.props.header) {
      this.setState(
        {
          descriptionValue: this.props.header.get('rawDescription'),
        },
        () => this.storeContainerWidth()
      );
    }
  }

  handleTextareaRef(textarea) {
    this.textarea = textarea;
  }

  handleRef(div) {
    this.containerDiv = div;
  }

  handleDescriptionChange(event) {
    this.setState({ descriptionValue: event.target.value });
  }

  handleTextareaBlur() {
    // Give the "Insert timestamp" button click a chance to tell us to ignore the blur event.
    setTimeout(() => {
      if (!this.state.shouldIgnoreBlur) {
        this.props.org.exitEditMode();
      } else {
        this.setState({ shouldIgnoreBlur: false });
      }
    }, 0);
  }

  handleTableCellSelect(cellId) {
    this.props.org.setSelectedTableCellId(cellId);
  }

  handleExitTableEditMode() {
    this.props.org.exitEditMode();
  }

  handleTableCellValueUpdate(cellId, newValue) {
    this.props.org.updateTableCellValue(cellId, newValue);
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

  handleInsertTimestamp() {
    // Clicking this button will unfocus the textarea, but we don't want to exit edit mode,
    // so instruct the blur handler to ignore the event.
    this.setState({ shouldIgnoreBlur: true });

    const { descriptionValue } = this.state;
    const insertionIndex = this.textarea.selectionStart;
    this.setState({
      descriptionValue:
        descriptionValue.substring(0, insertionIndex) +
        getCurrentTimestampAsText() +
        descriptionValue.substring(this.textarea.selectionEnd || insertionIndex),
    });
  }

  render() {
    const {
      header,
      inEditMode,
      selectedTableCellId,
      inTableEditMode,
      shouldDisableActions,
    } = this.props;
    const { containerWidth } = this.state;

    if (!header.get('opened')) {
      return <div />;
    }

    return (
      <div
        className="header-content-container nice-scroll"
        ref={this.handleRef}
        style={{ width: containerWidth }}
      >
        {inEditMode ? (
          <div className="header-content__edit-container">
            <textarea
              autoFocus
              className="textarea"
              rows="8"
              ref={this.handleTextareaRef}
              value={this.state.descriptionValue}
              onBlur={this.handleTextareaBlur}
              onChange={this.handleDescriptionChange}
            />
            {/* TODO: style this */}
            <div
              className="title-line__insert-timestamp-button"
              onClick={this.handleInsertTimestamp}
            >
              <i className="fas fa-plus" />
              Insert timestamp
            </div>
          </div>
        ) : (
          <AttributedString
            parts={header.get('description')}
            subPartDataAndHandlers={{
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
              shouldDisableActions,
            }}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    inEditMode:
      state.org.present.get('editMode') === 'description' &&
      state.org.present.get('selectedHeaderId') === props.header.get('id'),
    isSelected: state.org.present.get('selectedHeaderId') === props.header.get('id'),
    selectedTableCellId: state.org.present.get('selectedTableCellId'),
    inTableEditMode: state.org.present.get('editMode') === 'table',
  };
};

const mapDispatchToProps = dispatch => {
  return {
    org: bindActionCreators(orgActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HeaderContent);
