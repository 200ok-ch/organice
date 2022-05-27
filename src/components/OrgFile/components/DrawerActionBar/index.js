import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Map } from 'immutable';

import * as orgActions from '../../../../actions/org';
import * as baseActions from '../../../../actions/base';

import './stylesheet.css';

import _ from 'lodash';

import DrawerActionButtons from './components/DrawerActionButtons';

import { getSelectedHeader } from '../../../../lib/org_utils';

class DrawerActionBar extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleShowTitleEditModal',
      'handleShowDescriptionEditModal',
      'handleShowTagsModal',
      'handleShowNotificationsModal',
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

  handleShowNotificationsModal() {
    this.props.onSwitch();
    this.props.base.activatePopup('notifications-editor');
  }

  handleShowPropertyListEditorModal() {
    this.props.onSwitch();
    this.props.base.activatePopup('property-list-editor');
  }

  handleDeadlineAndScheduledClick(planningType) {
    const { header, selectedHeaderId } = this.props;
    const popupType = {
      DEADLINE: 'deadline-editor',
      SCHEDULED: 'scheduled-editor',
    }[planningType];

    const existingDeadlinePlanningItemIndex = header
      .get('planningItems', [])
      .findIndex((planningItem) => planningItem.get('type') === planningType);
    this.props.base.activatePopup(popupType, {
      headerId: header.get('id'),
      planningItemIndex: existingDeadlinePlanningItemIndex,
    });

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
          onSwitch={this.props.onSwitch}
          onTitleClick={this.handleShowTitleEditModal}
          onDescriptionClick={this.handleShowDescriptionEditModal}
          onTagsClick={this.handleShowTagsModal}
          onNotificationsClick={this.handleShowNotificationsModal}
          onPropertiesClick={this.handleShowPropertyListEditorModal}
          onDeadlineClick={this.handleShowDeadlineModal}
          onScheduledClick={this.handleShowScheduledModal}
          onAddNote={this.handleShowNoteModal}
          editRawValues={this.props.editRawValues}
          setEditRawValues={this.props.setEditRawValues}
          restorePreferEditRawValues={this.props.restorePreferEditRawValues}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const path = state.org.present.get('path');
  const file = state.org.present.getIn(['files', path], Map());
  const activePopup = state.base.get('activePopup');
  return {
    selectedHeaderId: file.get('selectedHeaderId'),
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
