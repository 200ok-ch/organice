import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Motion, spring } from 'react-motion';

import './ActionDrawer.css';

import _ from 'lodash';
import { List } from 'immutable';

import * as orgActions from '../../../../actions/org';
import * as dropboxActions from '../../../../actions/dropbox';
import * as captureActions from '../../../../actions/capture';

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
      'handleSync',
      'handleArrowButtonClick',
    ]);

    this.state = {
      isDisplayingArrowButtons: false,
    };
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
    return () => this.props.capture.activateCaptureModalForTemplateId(templateId);
  }

  renderCaptureButtons() {
    const { captureTemplates, path } = this.props;

    if (!path) {
      return null;
    }

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
      </Fragment>
    );
  }

  handleArrowButtonClick() {
    this.setState({
      isDisplayingArrowButtons: !this.state.isDisplayingArrowButtons,
    });
  }

  renderArrowButtons() {
    const { isDisplayingArrowButtons } = this.state;

    const baseArrowButtonStyle = {
      position: 'absolute',
      zIndex: 0,
    };
    if (!isDisplayingArrowButtons) {
      baseArrowButtonStyle.boxShadow = 'none';
    }

    const animatedStyles = {
      topRowYOffset: spring(isDisplayingArrowButtons ? 150 : 0, { stiffness: 300 }),
      bottomRowYOffset:spring(isDisplayingArrowButtons ?  80 : 0, { stiffness: 300 }),
      firstColumnXOffset:spring(isDisplayingArrowButtons ?  70 : 0, { stiffness: 300 }),
      secondColumnXOffset: spring(isDisplayingArrowButtons ? 140 : 0, { stiffness: 300 }),
    };

    return (
      <Motion style={animatedStyles}>
        {style => (
          <div className="action-drawer__arrow-buttons-container">
            <ActionButton iconName="arrow-up" isDisabled={false} onClick={this.handleMoveHeaderUpClick} style={{...baseArrowButtonStyle, bottom: style.topRowYOffset}} />
            <ActionButton iconName="arrow-down" isDisabled={false} onClick={this.handleMoveHeaderDownClick} style={{...baseArrowButtonStyle, bottom: style.bottomRowYOffset}} />
            <ActionButton iconName="arrow-left" isDisabled={false} onClick={this.handleMoveHeaderLeftClick} style={{...baseArrowButtonStyle, bottom: style.bottomRowYOffset, right: style.firstColumnXOffset}} />
            <ActionButton iconName="arrow-right" isDisabled={false} onClick={this.handleMoveHeaderRightClick} style={{...baseArrowButtonStyle, bottom: style.bottomRowYOffset, left: style.firstColumnXOffset}} />
            <ActionButton iconName="chevron-left" isDisabled={false} onClick={this.handleMoveSubtreeLeftClick} style={{...baseArrowButtonStyle, bottom: style.bottomRowYOffset, right: style.secondColumnXOffset}} />
            <ActionButton iconName="chevron-right" isDisabled={false} onClick={this.handleMoveSubtreeRightClick} style={{...baseArrowButtonStyle, bottom: style.bottomRowYOffset, left: style.secondColumnXOffset}} />

            <ActionButton iconName={isDisplayingArrowButtons ? 'times' : 'arrows-alt'} isDisabled={false} onClick={this.handleArrowButtonClick} style={{position: 'relative', zIndex: 1}} />
          </div>
        )}
      </Motion>
    );
  }

  handleSync() {
    this.props.org.sync();
  }

  render() {
    const {
      inTitleEditMode,
      inDescriptionEditMode,
      shouldDisableSyncButtons,
      selectedTableCellId,
      inTableEditMode,
    } = this.props;
    const { isDisplayingArrowButtons } = this.state;

    return (
      <div className="action-drawer-container nice-scroll">
        {(inTitleEditMode || inDescriptionEditMode || inTableEditMode) ? (
          <button className="btn action-drawer__done-btn"
                  onClick={this.handleDoneClick}>Done</button>
        ) : (
          <Fragment>
            {!!selectedTableCellId && (
              <Fragment>
                <ActionButton iconName="arrow-up" subIconName="columns" shouldRotateSubIcon isDisabled={false} onClick={this.handleMoveTableRowUpClick} />
                <ActionButton iconName="arrow-down" subIconName="columns" shouldRotateSubIcon isDisabled={false} onClick={this.handleMoveTableRowDownClick} />
                <ActionButton iconName="arrow-left" subIconName="columns" isDisabled={false} onClick={this.handleMoveTableColumnLeftClick} />
                <ActionButton iconName="arrow-right" subIconName="columns" isDisabled={false} onClick={this.handleMoveTableColumnRightClick} />
              </Fragment>
            )}

            {/* this.renderCaptureButtons() */}
            <ActionButton iconName="list-ul"
                          isDisabled={false}
                          onClick={this.handleSync}
                          style={{opacity: isDisplayingArrowButtons ? 0 : 1}} />

            {this.renderArrowButtons()}

            <ActionButton iconName="cloud"
                          subIconName="sync-alt"
                          isDisabled={shouldDisableSyncButtons}
                          onClick={this.handleSync}
                          style={{opacity: isDisplayingArrowButtons ? 0 : 1}} />
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
    capture: bindActionCreators(captureActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ActionDrawer);
