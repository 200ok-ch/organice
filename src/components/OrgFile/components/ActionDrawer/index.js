import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './ActionDrawer.css';

import _ from 'lodash';
import { List } from 'immutable';

import * as orgActions from '../../../../actions/org';
import * as dropboxActions from '../../../../actions/dropbox';
import { ActionCreators as undoActions } from 'redux-linear-undo';

import ActionButton from './components/ActionButton/';

class ActionDrawer extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleAdvanceTodoClick',
      'handleEditTitleClick',
      'handleEditDescriptionClick',
      'handleAddHeaderClick',
      'handleRemoveHeaderClick',
      'handleMoveHeaderUpClick',
      'handleMoveHeaderDownClick',
      'handleMoveHeaderLeftClick',
      'handleMoveHeaderRightClick',
      'handleMoveSubtreeLeftClick',
      'handleMoveSubtreeRightClick',
      'handleFocus',
      'handleUnfocus',
      'handleUndoClick',
      'handlePushClick',
      'handlePullClick',
      'handleDoneClick',
      'handleEnterTableEditModeClick',
      'handleAddNewTableRowClick',
      'handleRemoveTableRowClick',
      'handleAddNewTableColumnClick',
      'handleRemoveTableColumnClick',
      'handleMoveTableRowDownClick',
      'handleMoveTableRowUpClick',
      'handleMoveTableColumnLeftClick',
      'handleMoveTableColumnRightClick',
    ]);
  }

  componentDidMount() {
    // Send a no-op action to take care of the bug where redux-undo won't allow the first
    // action to be undone.
    this.props.org.noOp();

    document.querySelector('html').style.paddingBottom = '90px';
  }

  componentWillUnmount() {
    document.querySelector('html').style.paddingBottom = '0px';
  }

  handleAdvanceTodoClick() {
    this.props.org.advanceTodoState();
  }

  handleEditTitleClick() {
    this.props.org.enterTitleEditMode();
  }

  handleEditDescriptionClick() {
    this.props.org.openHeader(this.props.selectedHeaderId);
    this.props.org.enterDescriptionEditMode();
  }

  handleAddHeaderClick() {
    this.props.org.addHeaderAndEdit(this.props.selectedHeaderId);
  }

  handleRemoveHeaderClick() {
    this.props.org.selectNextSiblingHeader(this.props.selectedHeaderId);
    this.props.org.removeHeader(this.props.selectedHeaderId);
  }

  handleMoveHeaderUpClick() {
    this.props.org.moveHeaderUp(this.props.selectedHeaderId);
  }

  handleMoveHeaderDownClick() {
    this.props.org.moveHeaderDown(this.props.selectedHeaderId);
  }

  handleMoveHeaderLeftClick() {
    this.props.org.moveHeaderLeft(this.props.selectedHeaderId);
  }

  handleMoveHeaderRightClick() {
    this.props.org.moveHeaderRight(this.props.selectedHeaderId);
  }

  handleMoveSubtreeLeftClick() {
    this.props.org.moveSubtreeLeft(this.props.selectedHeaderId);
  }

  handleMoveSubtreeRightClick() {
    this.props.org.moveSubtreeRight(this.props.selectedHeaderId);
  }

  handleFocus() {
    this.props.org.focusHeader(this.props.selectedHeaderId);
  }

  handleUnfocus() {
    this.props.org.unfocusHeader();
  }

  handleUndoClick() {
    this.props.undo.undo();
  }

  handlePushClick() {
    this.props.dropbox.pushCurrentFile();
  }

  handlePullClick() {
    const { isDirty } = this.props;

    const pull = () => this.props.dropbox.redownloadCurrentFile();

    if (isDirty) {
      if (window.confirm('You have unpushed changes. Are you sure you want to overwrite them?')) {
        pull();
      }
    } else {
      pull();
    }
  }

  handleDoneClick() {
    this.props.org.exitTitleEditMode();
    this.props.org.exitDescriptionEditMode();
    this.props.org.exitTableEditMode();
  }

  handleEnterTableEditModeClick() {
    this.props.org.enterTableEditMode();
  }

  handleAddNewTableRowClick() {
    this.props.org.addNewTableRow();
  }

  handleRemoveTableRowClick() {
    this.props.org.removeTableRow();
  }

  handleAddNewTableColumnClick() {
    this.props.org.addNewTableColumn();
  }

  handleRemoveTableColumnClick() {
    this.props.org.removeTableColumn();
  }

  handleMoveTableRowDownClick() {
    this.props.org.moveTableRowDown();
  }

  handleMoveTableRowUpClick() {
    this.props.org.moveTableRowUp();
  }

  handleMoveTableColumnLeftClick() {
    this.props.org.moveTableColumnLeft();
  }

  handleMoveTableColumnRightClick() {
    this.props.org.moveTableColumnRight();
  }

  handleCaptureButtonClick(templateId) {
    return () => console.log(`clickity on ${templateId}`);
  }

  renderCaptureButtons() {
    const { captureTemplates, path } = this.props;

    const availableCaptureTemplates = captureTemplates.filter(template => (
      template.get('isAvailableInAllOrgFiles') || template.get('orgFilesWhereAvailable').map(availablePath => (
        availablePath.trim()
      )).includes(path.trim())
    ));

    if (availableCaptureTemplates.size === 0) {
      return null;
    }

    return (
      <Fragment>
        {availableCaptureTemplates.map(template => (
          <ActionButton key={template.get('id')}
                        letter={template.get('letter')}
                        iconName={template.get('iconName')}
                        isDisabled={false}
                        onClick={this.handleCaptureButtonClick(template.get('id'))} />
        ))}
        <div className="action-drawer__separator" />
      </Fragment>
    );
  }

  render() {
    const {
      inTitleEditMode,
      inDescriptionEditMode,
      historyCount,
      shouldDisableSyncButtons,
      isFocusedHeaderActive,
      selectedTableCellId,
      inTableEditMode,
    } = this.props;

    return (
      <div className="action-drawer-container nice-scroll">
        {(inTitleEditMode || inDescriptionEditMode || inTableEditMode) ? (
          <button className="btn action-drawer__done-btn"
                  onClick={this.handleDoneClick}>Done</button>
        ) : (
          <Fragment>
            {!!selectedTableCellId && (
              <Fragment>
                <ActionButton iconName="pencil-alt" subIconName="table" isDisabled={false} onClick={this.handleEnterTableEditModeClick} />
                <ActionButton iconName="plus" subIconName="columns" shouldRotateSubIcon isDisabled={false} onClick={this.handleAddNewTableRowClick} />
                <ActionButton iconName="times" subIconName="columns" shouldRotateSubIcon isDisabled={false} onClick={this.handleRemoveTableRowClick} />
                <ActionButton iconName="plus" subIconName="columns" isDisabled={false} onClick={this.handleAddNewTableColumnClick} />
                <ActionButton iconName="times" subIconName="columns" isDisabled={false} onClick={this.handleRemoveTableColumnClick} />
                <ActionButton iconName="arrow-up" subIconName="columns" shouldRotateSubIcon isDisabled={false} onClick={this.handleMoveTableRowUpClick} />
                <ActionButton iconName="arrow-down" subIconName="columns" shouldRotateSubIcon isDisabled={false} onClick={this.handleMoveTableRowDownClick} />
                <ActionButton iconName="arrow-left" subIconName="columns" isDisabled={false} onClick={this.handleMoveTableColumnLeftClick} />
                <ActionButton iconName="arrow-right" subIconName="columns" isDisabled={false} onClick={this.handleMoveTableColumnRightClick} />
                <div className="action-drawer__separator" />
              </Fragment>
            )}

            {this.renderCaptureButtons()}

            <ActionButton iconName="check" isDisabled={false} onClick={this.handleAdvanceTodoClick} />
            <ActionButton iconName="pencil-alt" isDisabled={false} onClick={this.handleEditTitleClick} />
            <ActionButton iconName="edit" isDisabled={false} onClick={this.handleEditDescriptionClick} />
            <ActionButton iconName="plus" isDisabled={false} onClick={this.handleAddHeaderClick} />
            <ActionButton iconName="times" isDisabled={false} onClick={this.handleRemoveHeaderClick} />
            <ActionButton iconName="arrow-up" isDisabled={false} onClick={this.handleMoveHeaderUpClick} />
            <ActionButton iconName="arrow-down" isDisabled={false} onClick={this.handleMoveHeaderDownClick} />
            <ActionButton iconName="arrow-left" isDisabled={false} onClick={this.handleMoveHeaderLeftClick} />
            <ActionButton iconName="arrow-right" isDisabled={false} onClick={this.handleMoveHeaderRightClick} />
            <ActionButton iconName="chevron-left" isDisabled={false} onClick={this.handleMoveSubtreeLeftClick} />
            <ActionButton iconName="chevron-right" isDisabled={false} onClick={this.handleMoveSubtreeRightClick} />
            {isFocusedHeaderActive ? (
              <ActionButton iconName="expand" isDisabled={false} onClick={this.handleUnfocus} />
            ) : (
              <ActionButton iconName="compress" isDisabled={false} onClick={this.handleFocus} />
            )}
            <ActionButton iconName="undo" isDisabled={historyCount <= 1} onClick={this.handleUndoClick} />
            <ActionButton iconName="cloud-upload-alt" isDisabled={shouldDisableSyncButtons} onClick={this.handlePushClick} />
            <ActionButton iconName="cloud-download-alt" isDisabled={shouldDisableSyncButtons} onClick={this.handlePullClick} />
          </Fragment>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    inTitleEditMode: state.org.present.get('inTitleEditMode'),
    inDescriptionEditMode: state.org.present.get('inDescriptionEditMode'),
    inTableEditMode: state.org.present.get('inTableEditMode'),
    selectedHeaderId: state.org.present.get('selectedHeaderId'),
    historyCount: state.org.past.length,
    isDirty: state.org.present.get('isDirty'),
    isFocusedHeaderActive: !!state.org.present.get('focusedHeaderId'),
    selectedTableCellId: state.org.present.get('selectedTableCellId'),
    captureTemplates: state.capture.get('captureTemplates', new List()),
    path: state.org.present.get('path'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    org: bindActionCreators(orgActions, dispatch),
    dropbox: bindActionCreators(dropboxActions, dispatch),
    undo: bindActionCreators(undoActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ActionDrawer);
