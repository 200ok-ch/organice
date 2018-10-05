import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Motion, spring } from 'react-motion';

import './stylesheet.css';

import _ from 'lodash';
import { List } from 'immutable';

import * as orgActions from '../../../../actions/org';
import * as captureActions from '../../../../actions/capture';
import * as baseActions from '../../../../actions/base';

import sampleCaptureTemplates from '../../../../lib/sample_capture_templates';

import ActionButton from './components/ActionButton/';

class ActionDrawer extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleUpClick',
      'handleDownClick',
      'handleLeftClick',
      'handleRightClick',
      'handleMoveSubtreeLeftClick',
      'handleMoveSubtreeRightClick',
      'handleDoneClick',
      'handleSync',
      'handleMainArrowButtonClick',
      'handleMainCaptureButtonClick',
    ]);

    this.state = {
      isDisplayingArrowButtons: false,
      isDisplayingCaptureButtons: false,
      mainArrowButtonBoundingRect: null,
    };
  }

  componentDidMount() {
    // Send a no-op action to take care of the bug where redux-undo won't allow the first
    // action to be undone.
    this.props.org.noOp();

    document.querySelector('html').style.paddingBottom = '90px';

    this.setState({
      mainArrowButtonBoundingRect: this.mainArrowButton.getBoundingClientRect(),
    });
  }

  componentWillUnmount() {
    document.querySelector('html').style.paddingBottom = '0px';
  }

  handleUpClick() {
    if (!!this.props.selectedHeaderId) {
      this.props.org.moveHeaderUp(this.props.selectedHeaderId);
    } else {
      this.props.org.moveTableRowUp();
    }
  }

  handleDownClick() {
    if (!!this.props.selectedHeaderId) {
      this.props.org.moveHeaderDown(this.props.selectedHeaderId);
    } else {
      this.props.org.moveTableRowDown();
    }
  }

  handleLeftClick() {
    if (!!this.props.selectedHeaderId) {
      this.props.org.moveHeaderLeft(this.props.selectedHeaderId);
    } else {
      this.props.org.moveTableColumnLeft();
    }
  }

  handleRightClick() {
    if (!!this.props.selectedHeaderId) {
      this.props.org.moveHeaderRight(this.props.selectedHeaderId);
    } else {
      this.props.org.moveTableColumnRight();
    }
  }

  handleMoveSubtreeLeftClick() {
    this.props.org.moveSubtreeLeft(this.props.selectedHeaderId);
  }

  handleMoveSubtreeRightClick() {
    this.props.org.moveSubtreeRight(this.props.selectedHeaderId);
  }

  handleDoneClick() {
    this.props.org.exitEditMode();
  }

  handleCaptureButtonClick(templateId) {
    return () => {
      this.setState({ isDisplayingCaptureButtons: false });
      this.props.base.activatePopup('capture', { templateId });
    };
  }

  getSampleCaptureTemplates() {
    return sampleCaptureTemplates;
  }

  getAvailableCaptureTemplates() {
    if (this.props.staticFile === 'sample') {
      return this.getSampleCaptureTemplates();
    }

    return this.props.captureTemplates.filter(
      template =>
        template.get('isAvailableInAllOrgFiles') ||
        template
          .get('orgFilesWhereAvailable')
          .map(
            availablePath =>
              availablePath.trim().startsWith('/')
                ? availablePath.trim()
                : '/' + availablePath.trim()
          )
          .includes((this.props.path || '').trim())
    );
  }

  handleSync() {
    this.props.org.sync();
  }

  handleMainArrowButtonClick() {
    this.setState({
      isDisplayingArrowButtons: !this.state.isDisplayingArrowButtons,
    });
  }

  handleMainCaptureButtonClick() {
    if (!this.state.isDisplayingCaptureButtons && this.getAvailableCaptureTemplates().size === 0) {
      alert(
        `You don't have any capture templates set up for this file! Add some in Settings > Capture Templates`
      );
      return;
    }

    this.setState({
      isDisplayingCaptureButtons: !this.state.isDisplayingCaptureButtons,
    });
  }

  renderCaptureButtons() {
    const { isDisplayingArrowButtons, isDisplayingCaptureButtons } = this.state;

    const availableCaptureTemplates = this.getAvailableCaptureTemplates();

    const baseCaptureButtonStyle = {
      position: 'absolute',
      zIndex: 0,
      left: 0,
      opacity: isDisplayingArrowButtons ? 0 : 1,
    };
    if (!isDisplayingCaptureButtons) {
      baseCaptureButtonStyle.boxShadow = 'none';
    }

    const mainButtonStyle = {
      opacity: isDisplayingArrowButtons ? 0 : 1,
      position: 'relative',
      zIndex: 1,
    };

    const animatedStyle = {
      bottom: spring(isDisplayingCaptureButtons ? 70 : 0, { stiffness: 300 }),
    };

    return (
      <Motion style={animatedStyle}>
        {style => (
          <div className="action-drawer__capture-buttons-container">
            <ActionButton
              iconName={isDisplayingCaptureButtons ? 'times' : 'list-ul'}
              isDisabled={false}
              onClick={this.handleMainCaptureButtonClick}
              style={mainButtonStyle}
              tooltip={
                isDisplayingCaptureButtons ? 'Hide capture templates' : 'Show capture templates'
              }
            />

            {availableCaptureTemplates.map((template, index) => (
              <ActionButton
                key={template.get('id')}
                letter={template.get('letter')}
                iconName={template.get('iconName')}
                isDisabled={false}
                onClick={this.handleCaptureButtonClick(template.get('id'))}
                style={{ ...baseCaptureButtonStyle, bottom: style.bottom * (index + 1) }}
                tooltip={`Activate "${template.get('description')}" capture template`}
              />
            ))}
          </div>
        )}
      </Motion>
    );
  }

  renderMovementButtons() {
    const { selectedTableCellId } = this.props;
    const {
      isDisplayingArrowButtons,
      isDisplayingCaptureButtons,
      mainArrowButtonBoundingRect,
    } = this.state;

    const baseArrowButtonStyle = {
      opacity: isDisplayingCaptureButtons ? 0 : 1,
    };
    if (!isDisplayingArrowButtons) {
      baseArrowButtonStyle.boxShadow = 'none';
    }

    let centerXOffset = 0;
    if (!!mainArrowButtonBoundingRect) {
      centerXOffset =
        window.screen.width / 2 -
        (mainArrowButtonBoundingRect.x + mainArrowButtonBoundingRect.width / 2);
    }

    const animatedStyles = {
      centerXOffset: spring(isDisplayingArrowButtons ? centerXOffset : 0, { stiffness: 300 }),
      topRowYOffset: spring(isDisplayingArrowButtons ? 150 : 0, { stiffness: 300 }),
      bottomRowYOffset: spring(isDisplayingArrowButtons ? 80 : 0, { stiffness: 300 }),
      firstColumnXOffset: spring(isDisplayingArrowButtons ? 70 : 0, {
        stiffness: 300,
      }),
      secondColumnXOffset: spring(isDisplayingArrowButtons ? 140 : 0, {
        stiffness: 300,
      }),
    };

    return (
      <Motion style={animatedStyles}>
        {style => (
          <div
            className="action-drawer__arrow-buttons-container"
            style={{ left: style.centerXOffset }}
          >
            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="arrow-up"
              subIconName={!!selectedTableCellId ? 'table' : null}
              isDisabled={false}
              onClick={this.handleUpClick}
              style={{ ...baseArrowButtonStyle, bottom: style.topRowYOffset }}
              tooltip={!!selectedTableCellId ? 'Move row up' : 'Move header up'}
            />
            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="arrow-down"
              subIconName={!!selectedTableCellId ? 'table' : null}
              isDisabled={false}
              onClick={this.handleDownClick}
              style={{ ...baseArrowButtonStyle, bottom: style.bottomRowYOffset }}
              tooltip={!!selectedTableCellId ? 'Move row down' : 'Move header down'}
            />
            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="arrow-left"
              subIconName={!!selectedTableCellId ? 'table' : null}
              isDisabled={false}
              onClick={this.handleLeftClick}
              style={{
                ...baseArrowButtonStyle,
                bottom: style.bottomRowYOffset,
                right: style.firstColumnXOffset,
              }}
              tooltip={!!selectedTableCellId ? 'Move column left' : 'Move header left'}
            />
            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="arrow-right"
              subIconName={!!selectedTableCellId ? 'table' : null}
              isDisabled={false}
              onClick={this.handleRightClick}
              style={{
                ...baseArrowButtonStyle,
                bottom: style.bottomRowYOffset,
                left: style.firstColumnXOffset,
              }}
              tooltip={!!selectedTableCellId ? 'Move column right' : 'Move header right'}
            />
            {!selectedTableCellId && (
              <Fragment>
                <ActionButton
                  additionalClassName="action-drawer__arrow-button"
                  iconName="chevron-left"
                  isDisabled={false}
                  onClick={this.handleMoveSubtreeLeftClick}
                  style={{
                    ...baseArrowButtonStyle,
                    bottom: style.bottomRowYOffset,
                    right: style.secondColumnXOffset,
                  }}
                  tooltip="Move entire subtree left"
                />
                <ActionButton
                  additionalClassName="action-drawer__arrow-button"
                  iconName="chevron-right"
                  isDisabled={false}
                  onClick={this.handleMoveSubtreeRightClick}
                  style={{
                    ...baseArrowButtonStyle,
                    bottom: style.bottomRowYOffset,
                    left: style.secondColumnXOffset,
                  }}
                  tooltip="Move entire subtree right"
                />
              </Fragment>
            )}

            <ActionButton
              iconName={isDisplayingArrowButtons ? 'times' : 'arrows-alt'}
              subIconName={!!selectedTableCellId ? 'table' : null}
              additionalClassName="action-drawer__main-arrow-button"
              isDisabled={false}
              onClick={this.handleMainArrowButtonClick}
              style={{ opacity: isDisplayingCaptureButtons ? 0 : 1 }}
              tooltip={isDisplayingArrowButtons ? 'Hide movement buttons' : 'Show movement buttons'}
              onRef={button => (this.mainArrowButton = button)}
            />
          </div>
        )}
      </Motion>
    );
  }

  render() {
    const { inEditMode, shouldDisableSyncButtons, isLoading } = this.props;
    const { isDisplayingArrowButtons, isDisplayingCaptureButtons } = this.state;

    return (
      <div className="action-drawer-container nice-scroll">
        {inEditMode ? (
          <button className="btn action-drawer__done-btn" onClick={this.handleDoneClick}>
            Done
          </button>
        ) : (
          <Fragment>
            <ActionButton
              iconName="cloud"
              subIconName="sync-alt"
              shouldSpinSubIcon={isLoading}
              isDisabled={shouldDisableSyncButtons}
              onClick={this.handleSync}
              style={{ opacity: isDisplayingArrowButtons || isDisplayingCaptureButtons ? 0 : 1 }}
              tooltip="Sync changes"
            />

            {this.renderMovementButtons()}

            <ActionButton
              iconName="calendar-alt"
              shouldSpinSubIcon={isLoading}
              isDisabled={false}
              onClick={() => {}}
              style={{ opacity: isDisplayingArrowButtons || isDisplayingCaptureButtons ? 0 : 1 }}
              tooltip="Show agenda"
            />

            {this.renderCaptureButtons()}
          </Fragment>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    inEditMode: !!state.org.present.get('editMode'),
    selectedHeaderId: state.org.present.get('selectedHeaderId'),
    isDirty: state.org.present.get('isDirty'),
    isFocusedHeaderActive: !!state.org.present.get('focusedHeaderId'),
    selectedTableCellId: state.org.present.get('selectedTableCellId'),
    captureTemplates: state.capture.get('captureTemplates', new List()),
    path: state.org.present.get('path'),
    isLoading: state.base.get('isLoading'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    org: bindActionCreators(orgActions, dispatch),
    capture: bindActionCreators(captureActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ActionDrawer);
