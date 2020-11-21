import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import PlanningItems from './components/PlanningItems';
import PropertyListItems from './components/PropertyListItems';
import LogBookEntries from './components/LogBookEntries';

import _ from 'lodash';

import * as orgActions from '../../../../actions/org';
import * as baseActions from '../../../../actions/base';

import { getCurrentTimestampAsText } from '../../../../lib/timestamps';
import { createRawDescriptionText } from '../../../../lib/export_org';

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
      'handleLogEntryTimestampClick',
      'handleInsertTimestamp',
      'handlePlanningItemTimestampClick',
      'handlePropertyListEdit',
    ]);

    this.state = {
      descriptionValue: this.calculateRawDescription(props.header),
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
          descriptionValue: this.calculateRawDescription(this.props.header),
        },
        () => this.storeContainerWidth()
      );
    }
  }

  calculateRawDescription(header) {
    // This generates the text that appears in the description text field.
    const dontIndent = this.props.dontIndent;
    return createRawDescriptionText(header, false, dontIndent);
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

  // Exits from edit mode if a 'blur' happens. One exception: If an
  // 'insert timestamp' event happened before, this actually also
  // triggered a 'blur'. Since the 'blur' and 'click' events are
  // non-deterministic in their order, the only option to prevent the
  // blur is to mark it as 'should be ignored' in the 'click' event.
  // However, sufficient time needs to pass for this workaround to be
  // consistent. Hence, the functionality is wrapped in a setTimeout.
  // Original workaround taken from an old blog post:
  // https://medium.com/@jessebeach/dealing-with-focus-and-blur-in-a-composite-widget-in-react-90d3c3b49a9b
  // The same workaround is used in TitleLine/index.js
  handleTextareaBlur() {
    setTimeout(() => {
      if (!this.state.shouldIgnoreBlur) {
        this.props.org.exitEditMode();
      } else {
        this.setState({ shouldIgnoreBlur: false });
      }
    }, 200);
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
    this.props.base.activatePopup('timestamp-editor', {
      timestampId,
      headerId: this.props.header.get('id'),
    });
  }

  handleLogEntryTimestampClick(headerId) {
    return (logEntryIndex, entryType) =>
      this.props.base.activatePopup('timestamp-editor', {
        headerId,
        logEntryIndex,
        entryType,
      });
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
    this.textarea.focus();
  }

  handlePlanningItemTimestampClick(headerId) {
    return (planningItemIndex) =>
      this.props.base.activatePopup('timestamp-editor', { headerId, planningItemIndex });
  }

  handlePropertyListEdit() {
    const { header } = this.props;
    this.props.base.activatePopup('property-list-editor', { headerId: header.get('id') });
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
            <div
              className="header-content__insert-timestamp-button"
              onClick={this.handleInsertTimestamp}
            >
              <i className="fas fa-plus insert-timestamp-icon" />
              Insert timestamp
            </div>
          </div>
        ) : (
          <Fragment>
            <PlanningItems
              planningItems={header.get('planningItems')}
              onClick={this.handlePlanningItemTimestampClick(header.get('id'))}
            />
            <PropertyListItems
              propertyListItems={header.get('propertyListItems')}
              onTimestampClick={this.handleTimestampClick}
              shouldDisableActions={shouldDisableActions}
              onEdit={this.handlePropertyListEdit}
            />
            <AttributedString
              parts={header.get('logNotes')}
              subPartDataAndHandlers={{
                onTimestampClick: this.handleTimestampClick,
                shouldDisableActions,
              }}
            />
            <LogBookEntries
              logBookEntries={header.get('logBookEntries')}
              onTimestampClick={this.handleLogEntryTimestampClick(header.get('id'))}
              shouldDisableActions={shouldDisableActions}
            />
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
          </Fragment>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const path = state.org.present.get('path');
  const file = state.org.present.getIn(['files', path]);
  return {
    inEditMode:
      file.get('editMode') === 'description' &&
      file.get('selectedHeaderId') === ownProps.header.get('id'),
    isSelected: file.get('selectedHeaderId') === ownProps.header.get('id'),
    selectedTableCellId: file.get('selectedTableCellId'),
    inTableEditMode: file.get('editMode') === 'table',
    dontIndent: state.base.get('shouldNotIndentOnExport'),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    org: bindActionCreators(orgActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(HeaderContent);
