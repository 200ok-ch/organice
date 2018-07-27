import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './ActionDrawer.css';

import _ from 'lodash';

import * as orgActions from '../../../../actions/org';

import ActionButton from './components/ActionButton';

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
      'handleUndoClick',
      'handlePushClick',
      'handlePullClick',
      'handleDoneClick',
    ]);
  }

  handleAdvanceTodoClick() {
    this.props.org.advanceTodoState();
  }

  handleEditTitleClick() {
    this.props.org.enterTitleEditMode();
  }

  handleEditDescriptionClick() {
    this.props.org.enterDescriptionEditMode();
  }

  handleAddHeaderClick() {
    this.props.org.addHeader(this.props.selectedHeaderId);
    this.props.org.selectNextSiblingHeader(this.props.selectedHeaderId);
    this.props.org.enterTitleEditMode();
  }

  handleRemoveHeaderClick() {
    // TODO:
    console.log('handleRemoveHeaderClick');
  }

  handleMoveHeaderUpClick() {
    // TODO:
    console.log('handleMoveHeaderUpClick');
  }

  handleMoveHeaderDownClick() {
    // TODO:
    console.log('handleMoveHeaderDownClick');
  }

  handleMoveHeaderLeftClick() {
    // TODO:
    console.log('handleMoveHeaderLeftClick');
  }

  handleMoveHeaderRightClick() {
    // TODO:
    console.log('handleMoveHeaderRightClick');
  }

  handleMoveSubtreeLeftClick() {
    // TODO:
    console.log('handleMoveSubtreeLeftClick');
  }

  handleMoveSubtreeRightClick() {
    // TODO:
    console.log('handleMoveSubtreeRightClick');
  }

  handleUndoClick() {
    // TODO:
    console.log('handleUndoClick');
  }

  handlePushClick() {
    // TODO:
    console.log('handlePushClick');
  }

  handlePullClick() {
    // TODO:
    console.log('handlePullClick');
  }

  handleDoneClick() {
    this.props.org.exitTitleEditMode();
    this.props.org.exitDescriptionEditMode();
  }

  render() {
    const { inTitleEditMode, inDescriptionEditMode } = this.props;

    return (
      <div className="action-drawer-container nice-scroll">
        {(inTitleEditMode || inDescriptionEditMode) ? (
          <button className="btn action-drawer__done-btn"
                  onClick={this.handleDoneClick}>Done</button>
        ) : (
          <Fragment>
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
            <ActionButton iconName="undo" isDisabled={false} onClick={this.handleUndoClick} />
            <ActionButton iconName="cloud-upload-alt" isDisabled={false} onClick={this.handlePushClick} />
            <ActionButton iconName="cloud-download-alt" isDisabled={false} onClick={this.handlePullClick} />
          </Fragment>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    inTitleEditMode: state.org.get('inTitleEditMode'),
    inDescriptionEditMode: state.org.get('inDescriptionEditMode'),
    selectedHeaderId: state.org.get('selectedHeaderId'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ActionDrawer);
