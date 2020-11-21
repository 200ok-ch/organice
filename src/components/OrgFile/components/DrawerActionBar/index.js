import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as orgActions from '../../../../actions/org';
import * as baseActions from '../../../../actions/base';

import './stylesheet.css';

import _ from 'lodash';

import DrawerActionButtons from './DrawerActionButtons';

import { indexOfHeaderWithId } from '../../../../lib/org_utils';

class DrawerActionBar extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleShowTitleEditModal',
      'handleShowDescriptionEditModal',
      'handleShowTagsModal',
      'handleShowPropertyListEditorModal',
      'handleShowDeadlineModal',
      'handleShowScheduledModal',
      'handleShowNoteModal',
    ]);
  }

  handleShowTitleEditModal() {
    this.props.onSwitch();
    this.props.base.activatePopup('title-editor');
  }

  handleShowDescriptionEditModal() {
    this.props.onSwitch();
    this.props.org.openHeader(this.props.selectedHeaderId);
    this.props.base.activatePopup('description-editor');
  }

  handleShowTagsModal() {
    this.props.onSwitch();
    this.props.base.activatePopup('tags-editor');
  }

  handleShowPropertyListEditorModal() {
    this.props.onSwitch();
    this.props.base.activatePopup('property-list-editor');
  }

  handleDeadlineAndScheduledClick(planningType) {
    const { header, selectedHeaderId } = this.props;

    const existingDeadlinePlanningItemIndex = header
      .get('planningItems', [])
      .findIndex((planningItem) => planningItem.get('type') === planningType);

    if (existingDeadlinePlanningItemIndex === -1) {
      this.props.org.addNewPlanningItem(selectedHeaderId, planningType);
      this.props.base.activatePopup('timestamp-editor', {
        headerId: selectedHeaderId,
        planningItemIndex: header.get('planningItems').size,
      });
    } else {
      this.props.base.activatePopup('timestamp-editor', {
        headerId: header.get('id'),
        planningItemIndex: existingDeadlinePlanningItemIndex,
      });
    }

    this.props.org.openHeader(selectedHeaderId);
  }

  handleShowDeadlineModal() {
    this.props.onSwitch();
    this.handleDeadlineAndScheduledClick('DEADLINE');
  }

  handleShowScheduledModal() {
    this.props.onSwitch();
    this.handleDeadlineAndScheduledClick('SCHEDULED');
  }

  handleShowNoteModal() {
    this.props.onSwitch();
    this.props.base.activatePopup('note-editor');
  }

  render() {
    return (
      <div className="static-action-bar">
        <DrawerActionButtons
          activePopupType={this.props.activePopupType}
          onEnterTitleEditMode={this.handleShowTitleEditModal}
          onEnterDescriptionEditMode={this.handleShowDescriptionEditModal}
          onTagsClick={this.handleShowTagsModal}
          onPropertiesClick={this.handleShowPropertyListEditorModal}
          onDeadlineClick={this.handleShowDeadlineModal}
          onScheduledClick={this.handleShowScheduledModal}
          onAddNote={this.handleShowNoteModal}
        />
      </div>
    );
  }
}

const getSelectedHeader = (state) => {
  const headerId = state.org.present.get('selectedHeaderId');
  const headers = state.org.present.get('headers');
  if (!headers) {
    return null;
  }
  const headerIdx = indexOfHeaderWithId(headers, headerId);
  if (headerIdx === -1) {
    return null;
  }
  return state.org.present.getIn(['headers', headerIdx]);
};

const mapStateToProps = (state) => {
  const activePopup = state.base.get('activePopup');
  return {
    selectedHeaderId: state.org.present.get('selectedHeaderId'),
    header: getSelectedHeader(state),
    activePopupType: !!activePopup ? activePopup.get('type') : null,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    org: bindActionCreators(orgActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DrawerActionBar);
