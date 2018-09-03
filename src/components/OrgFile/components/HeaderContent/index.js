import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './HeaderContent.css';

import _ from 'lodash';

import * as orgActions from '../../../../actions/org';

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
    ]);

    this.state = {
      descriptionValue: props.header.get('rawDescription'),
      containerWidth: null,
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
    const { header, cursorPosition } = this.props;

    if (prevProps.inEditMode && !this.props.inEditMode) {
      this.props.org.updateHeaderDescription(header.get('id'), this.state.descriptionValue);
    } else if (!prevProps.inEditMode && this.props.inEditMode) {
      if (cursorPosition !== null && !!this.textarea) {
        this.textarea.selectionStart = cursorPosition;
        this.textarea.selectionEnd = cursorPosition;
      }
    }

    if (prevProps.header !== this.props.header) {
      this.setState({
        descriptionValue: this.props.header.get('rawDescription'),
      }, () => this.storeContainerWidth());
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
    this.props.org.exitDescriptionEditMode();
  }

  handleTableCellSelect(cellId) {
    this.props.org.setSelectedTableCellId(cellId);
  }

  handleExitTableEditMode() {
    this.props.org.exitTableEditMode();
  }

  handleTableCellValueUpdate(cellId, newValue) {
    this.props.org.updateTableCellValue(cellId, newValue);
  }

  handleEnterTableEditMode() {
    this.props.org.enterTableEditMode();
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

  render() {
    const { header, inEditMode, selectedTableCellId, inTableEditMode } = this.props;
    const { containerWidth } = this.state;

    if (!header.get('opened')) {
      return <div></div>;
    }

    return (
      <div className="header-content-container nice-scroll"
           ref={this.handleRef}
           style={{width: containerWidth}}>
        {inEditMode ? (
          <textarea autoFocus
                    className="textarea"
                    rows="8"
                    ref={this.handleTextareaRef}
                    value={this.state.descriptionValue}
                    onBlur={this.handleTextareaBlur}
                    onChange={this.handleDescriptionChange} />
        ) : (
          <AttributedString parts={header.get('description')}
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
                            }} />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    inEditMode: (
      state.org.present.get('inDescriptionEditMode') && state.org.present.get('selectedHeaderId') === props.header.get('id')
    ),
    isSelected: state.org.present.get('selectedHeaderId') === props.header.get('id'),
    selectedTableCellId: state.org.present.get('selectedTableCellId'),
    inTableEditMode: state.org.present.get('inTableEditMode'),
    cursorPosition: state.org.present.get('cursorPosition'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(HeaderContent);
