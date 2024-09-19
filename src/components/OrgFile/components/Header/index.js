import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Motion, spring } from 'react-motion';
import { UnmountClosed as Collapse } from 'react-collapse';

import * as orgActions from '../../../../actions/org';
import * as baseActions from '../../../../actions/base';

import './stylesheet.css';

import classNames from 'classnames';
import _ from 'lodash';

import TitleLine from '../TitleLine';
import HeaderContent from '../HeaderContent';
import HeaderActionDrawer from './components/HeaderActionDrawer';

import { headerWithId } from '../../../../lib/org_utils';
import { interpolateColors, rgbaObject, rgbaString, readRgbaVariable } from '../../../../lib/color';
import { getCurrentTimestamp, millisDuration } from '../../../../lib/timestamps';
import { Map } from 'immutable';

class Header extends PureComponent {
  SWIPE_ACTION_ACTIVATION_DISTANCE = 80;
  FREE_DRAG_ACTIVATION_DISTANCE = 10;

  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleRef',
      'handleMouseDown',
      'handleTouchStart',
      'handleTouchCancel',
      'handleHeaderClick',
      'handleShowTitleModal',
      'handleShowDescriptionModal',
      'handleShowTagsModal',
      'handleShowPropertyListEditorModal',
      'handleNarrow',
      'handleWiden',
      'handleAddNewHeader',
      'handleRest',
      'handleDeadlineClick',
      'handleClockInOutClick',
      'handleScheduledClick',
      'handleShareHeaderClick',
      'handleRefileHeaderRequest',
      'handleAddNoteClick',
    ]);

    this.state = {
      isDraggingFreely: false,
      dragStartX: null,
      currentDragX: null,
      containerWidth: null,
      isPlayingRemoveAnimation: false,
      heightBeforeRemove: null,
      disabledBackgroundColor: readRgbaVariable('--base3'),
    };

    // Store member callbacks handling global mouse/touch events to be able to handle dragging
    // interactions outside of the current component.
    this.globalMouseMoveHandler = this.handleMouseMove.bind(this);
    this.globalMouseUpHandler = this.handleMouseUp.bind(this);
    this.globalTouchMoveHandler = this.handleTouchMove.bind(this);
    this.globalTouchEndHandler = this.handleTouchEnd.bind(this);
  }

  addGlobalDragHandlers() {
    // Begin listening for global mouse/touch events after dragging begins
    window.addEventListener('mousemove', this.globalMouseMoveHandler);
    window.addEventListener('mouseup', this.globalMouseUpHandler);
    window.addEventListener('touchmove', this.globalTouchMoveHandler);
    window.addEventListener('touchend', this.globalTouchEndHandler);
  }

  removeGlobalDragHandlers() {
    // Stop listening for global mouse/touch events after dragging ends
    window.removeEventListener('mousemove', this.globalMouseMoveHandler);
    window.removeEventListener('mouseup', this.globalMouseUpHandler);
    window.removeEventListener('touchmove', this.globalTouchMoveHandler);
    window.removeEventListener('touchend', this.globalTouchEndHandler);
  }

  componentDidMount() {
    if (this.containerDiv) {
      this.setState({ containerWidth: this.containerDiv.offsetWidth });
    }
  }

  componentWillUnmount() {
    this.removeGlobalDragHandlers();
  }

  handleRef(containerDiv) {
    this.containerDiv = containerDiv;
    this.props.onRef(containerDiv);
  }

  handleDragStart(event, dragX) {
    if (this.props.shouldDisableActions) {
      return;
    }

    if (!!event.target.closest('.table-part')) {
      return;
    }

    this.setState({
      dragStartX: dragX,
    });

    // Begin listening to global mouse/touch events to allow dragging outside of the current
    // component.
    this.addGlobalDragHandlers();
  }

  handleDragMove(dragX) {
    if (this.state.dragStartX === null) {
      return;
    }

    if (!this.state.isDraggingFreely) {
      if (Math.abs(dragX - this.state.dragStartX) >= this.FREE_DRAG_ACTIVATION_DISTANCE) {
        this.setState({ isDraggingFreely: true });
      }
    }

    this.setState({ currentDragX: dragX });
  }

  handleDragEnd() {
    const { dragStartX, currentDragX } = this.state;

    if (!!dragStartX && !!currentDragX) {
      const swipeDistance = currentDragX - dragStartX;

      if (swipeDistance >= this.SWIPE_ACTION_ACTIVATION_DISTANCE) {
        this.props.org.advanceTodoState(
          this.props.header.get('id'),
          this.props.shouldLogIntoDrawer,
          this.props.shouldLogDone
        );
      }

      if (-1 * swipeDistance >= this.SWIPE_ACTION_ACTIVATION_DISTANCE) {
        this.setState({
          isPlayingRemoveAnimation: true,
          heightBeforeRemove: this.containerDiv.offsetHeight,
        });
      }
    }

    this.setState({
      dragStartX: null,
      currentDragX: null,
      isDraggingFreely: false,
    });

    this.removeGlobalDragHandlers();
  }

  handleDragCancel() {
    this.setState({
      dragStartX: null,
      currentDragX: null,
      isDraggingFreely: false,
    });
  }

  handleMouseDown(event) {
    this.handleDragStart(event, event.clientX);
  }

  handleMouseMove(event) {
    this.handleDragMove(event.clientX, event.clientY);
  }

  handleMouseUp() {
    this.handleDragEnd();
  }

  handleTouchStart(event) {
    this.handleDragStart(event, event.changedTouches[0].clientX);
  }

  handleTouchMove(event) {
    this.handleDragMove(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
  }

  handleTouchEnd() {
    this.handleDragEnd();
  }

  handleTouchCancel() {
    this.handleDragCancel();
  }

  handleHeaderClick(event) {
    const classList = event.target.classList;
    if (classList.contains('header') || classList.contains('header__bullet')) {
      const { header, hasContent, isSelected, closeSubheadersRecursively } = this.props;

      if (hasContent && (!header.get('opened') || isSelected)) {
        this.props.org.toggleHeaderOpened(header.get('id'), closeSubheadersRecursively);
      }

      this.props.org.selectHeader(header.get('id'));
    }
  }

  handleShowTitleModal() {
    this.props.base.activatePopup('title-editor');
  }

  handleShowDescriptionModal() {
    this.props.base.activatePopup('description-editor');
  }

  handleShowTagsModal() {
    this.props.base.activatePopup('tags-editor');
  }

  handleShowPropertyListEditorModal() {
    this.props.base.activatePopup('property-list-editor');
  }

  handleNarrow() {
    this.props.org.narrowHeader(this.props.header.get('id'));
  }

  handleWiden() {
    this.props.org.widenHeader();
  }

  handleAddNewHeader() {
    this.props.org.addHeaderAndEdit(this.props.header.get('id'));
  }

  handleRest() {
    if (this.state.isPlayingRemoveAnimation) {
      this.props.org.removeHeader(this.props.header.get('id'));
    }
  }

  handleDeadlineAndScheduledClick(planningType) {
    const { header } = this.props;
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

    this.props.org.openHeader(header.get('id'));
  }

  handleDeadlineClick() {
    this.handleDeadlineAndScheduledClick('DEADLINE');
  }

  handleClockInOutClick() {
    const { header } = this.props;
    const logBook = header.get('logBookEntries', []);
    const existingClockIndex = logBook.findIndex((entry) => entry.get('end') === null);
    const now = getCurrentTimestamp({ isActive: false, withStartTime: true });
    if (existingClockIndex !== -1) {
      this.props.org.setLogEntryStop(
        header.get('id'),
        logBook.getIn([existingClockIndex, 'id']),
        now
      );
    } else {
      this.props.org.createLogEntryStart(header.get('id'), now);
    }
  }

  handleScheduledClick() {
    this.handleDeadlineAndScheduledClick('SCHEDULED');
  }

  handleShareHeaderClick() {
    const { header } = this.props;

    const titleLine = header.get('titleLine');
    const todoKeyword = titleLine.get('todoKeyword');
    const tags = titleLine.get('tags');
    const title = titleLine.get('rawTitle').trim();
    const subject = todoKeyword ? `${todoKeyword} ${title}` : title;
    const body = `
${tags.isEmpty() ? '' : `Tags: ${tags.join(' ')}\n`}
${header.get('rawDescription')}`;
    //const titleParts = titleLine.get('title'); // List of parsed tokens in title
    //const properties = header.get('propertyListItem'); //.get(0) .get('property') or .get('value')
    //const planningItems = header.get('planningItems'); //.get(0) .get('type') [DEADLINE|SCHEDULED] or .get('timestamp')
    const mailtoURI = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body
    )}`;
    // TODO: If available, use webshare
    // Maybe there's synergy with this PR: https://github.com/200ok-ch/organice/pull/138/files

    window.open(mailtoURI);
    // INFO: Alternative implementation that works without having a
    // popup window. We didn't go this route, because it's non-trivial
    // to mock the window object, so it's harder to test. Having
    // slightly worse UX in favor of having a test is not optimal, as
    // well, of course.
    // window.location.href = mailtoURI;
  }

  handleAddNoteClick() {
    this.props.base.activatePopup('note-editor');
  }

  handlePopupClose() {
    this.props.base.closePopup();
  }

  handleRefileHeaderRequest() {
    this.props.base.activatePopup('refile');
  }

  render() {
    const {
      header,
      color,
      hasContent,
      isSelected,
      bulletStyle,
      narrowedHeader,
      isNarrowed,
      shouldDisableActions,
      showClockDisplay,
      showDeadlineDisplay,
    } = this.props;
    const indentLevel = !!narrowedHeader
      ? header.get('nestingLevel') - narrowedHeader.get('nestingLevel') + 1
      : header.get('nestingLevel');

    const headerDeadlineMap = header
      .get('planningItems')
      .filter((p) => p.get('type') === 'DEADLINE')
      .map((p) => p.get('timestamp'))
      .get(0);

    const headerDeadline =
      headerDeadlineMap !== undefined
        ? headerDeadlineMap.get('month') +
          '-' +
          headerDeadlineMap.get('day') +
          '-' +
          headerDeadlineMap.get('year')
        : '';

    const {
      dragStartX,
      currentDragX,
      isDraggingFreely,
      isPlayingRemoveAnimation,
      containerWidth,
    } = this.state;
    const marginLeft =
      !!dragStartX && !!currentDragX && isDraggingFreely
        ? currentDragX - dragStartX
        : isPlayingRemoveAnimation
        ? spring(-1 * containerWidth, { stiffness: 300 })
        : spring(0, { stiffness: 300 });

    const style = {
      paddingLeft: 20 * indentLevel,
      marginLeft,
      heightFactor: isPlayingRemoveAnimation ? spring(0, { stiffness: 300 }) : 1,
    };

    const className = classNames('header', {
      'header--selected': isSelected,
      'header--removing': isPlayingRemoveAnimation,
    });

    const logBookEntries = header
      .get('logBookEntries')
      .filter((entry) => entry.get('raw') === undefined);
    const hasActiveClock =
      logBookEntries.size !== 0 && logBookEntries.filter((entry) => !entry.get('end')).size !== 0;

    return (
      <Motion style={style} onRest={this.handleRest}>
        {(interpolatedStyle) => {
          const swipedDistance = interpolatedStyle.marginLeft;
          const isLeftActionActivated = swipedDistance >= this.SWIPE_ACTION_ACTIVATION_DISTANCE;
          const isRightActionActivated =
            -1 * swipedDistance >= this.SWIPE_ACTION_ACTIVATION_DISTANCE;

          const leftActivatedBackgroundColor = rgbaObject(0, 128, 0, 1);
          const rightActivatedBackgroundColor = rgbaObject(255, 0, 0, 1);

          const disabledIconColor = rgbaObject(0, 0, 0, 1);
          const activatedIconColor = rgbaObject(255, 255, 255, 1);

          const leftSwipeActionContainerStyle = {
            width: interpolatedStyle.marginLeft,
            backgroundColorFactor: spring(isLeftActionActivated ? 1 : 0, { stiffness: 300 }),
          };
          const rightSwipeActionContainerStyle = {
            width: -1 * interpolatedStyle.marginLeft,
            backgroundColorFactor: spring(isRightActionActivated ? 1 : 0, { stiffness: 300 }),
          };

          const { heightFactor, ...headerStyle } = interpolatedStyle;

          if (isPlayingRemoveAnimation) {
            headerStyle.height = this.state.heightBeforeRemove * heightFactor;
          }

          return (
            <div
              className={className}
              style={headerStyle}
              ref={this.handleRef}
              onClick={this.handleHeaderClick}
              onMouseDown={this.handleMouseDown}
              onTouchStart={this.handleTouchStart}
              onTouchCancel={this.handleTouchCancel}
            >
              <Motion style={leftSwipeActionContainerStyle}>
                {(leftInterpolatedStyle) => {
                  const leftStyle = {
                    width: leftInterpolatedStyle.width,
                    backgroundColor: rgbaString(
                      interpolateColors(
                        this.state.disabledBackgroundColor,
                        leftActivatedBackgroundColor,
                        leftInterpolatedStyle.backgroundColorFactor
                      )
                    ),
                  };

                  const leftIconStyle = {
                    display: swipedDistance > 30 ? '' : 'none',
                    color: rgbaString(
                      interpolateColors(
                        disabledIconColor,
                        activatedIconColor,
                        leftInterpolatedStyle.backgroundColorFactor
                      )
                    ),
                  };

                  return (
                    <div className="left-swipe-action-container" style={leftStyle}>
                      <i
                        className="fas fa-check swipe-action-container__icon swipe-action-container__icon--left"
                        style={leftIconStyle}
                      />
                    </div>
                  );
                }}
              </Motion>
              <Motion style={rightSwipeActionContainerStyle}>
                {(rightInterpolatedStyle) => {
                  const rightStyle = {
                    width: rightInterpolatedStyle.width,
                    backgroundColor: rgbaString(
                      interpolateColors(
                        this.state.disabledBackgroundColor,
                        rightActivatedBackgroundColor,
                        rightInterpolatedStyle.backgroundColorFactor
                      )
                    ),
                  };

                  const rightIconStyle = {
                    display: -1 * swipedDistance > 30 ? '' : 'none',
                    color: rgbaString(
                      interpolateColors(
                        disabledIconColor,
                        activatedIconColor,
                        rightInterpolatedStyle.backgroundColorFactor
                      )
                    ),
                  };

                  return (
                    <div className="right-swipe-action-container" style={rightStyle}>
                      <i
                        className="fas fa-times swipe-action-container__icon swipe-action-container__icon--right"
                        style={rightIconStyle}
                      />
                    </div>
                  );
                }}
              </Motion>

              <div style={{ marginLeft: -16, color }} className="header__bullet">
                {bulletStyle === 'Fancy' ? '●' : '*'}
              </div>
              <TitleLine
                header={header}
                color={color}
                hasContent={hasContent}
                isSelected={isSelected}
                shouldDisableExplicitWidth={swipedDistance === 0}
                shouldDisableActions={shouldDisableActions}
                addition={
                  (showClockDisplay && header.get('totalTimeLoggedRecursive') !== 0
                    ? millisDuration(header.get('totalTimeLoggedRecursive'))
                    : '') +
                  // Spacing between 'clock display' and 'deadline
                  // display' overlays
                  (showClockDisplay && showDeadlineDisplay ? ' ' : '') +
                  (showDeadlineDisplay && headerDeadline !== undefined ? headerDeadline : '')
                }
              />

              <Collapse
                isOpened={isSelected && !shouldDisableActions}
                springConfig={{ stiffness: 300 }}
                style={{ marginRight: rightSwipeActionContainerStyle.width }}
              >
                <HeaderActionDrawer
                  onTitleClick={this.handleShowTitleModal}
                  onDescriptionClick={this.handleShowDescriptionModal}
                  isNarrowed={isNarrowed}
                  onTagsClick={this.handleShowTagsModal}
                  onPropertiesClick={this.handleShowPropertyListEditorModal}
                  onNarrow={this.handleNarrow}
                  onWiden={this.handleWiden}
                  onAddNewHeader={this.handleAddNewHeader}
                  onDeadlineClick={this.handleDeadlineClick}
                  onClockInOutClick={this.handleClockInOutClick}
                  onScheduledClick={this.handleScheduledClick}
                  hasActiveClock={hasActiveClock}
                  onShareHeader={this.handleShareHeaderClick}
                  onRefileHeader={this.handleRefileHeaderRequest}
                  onAddNote={this.handleAddNoteClick}
                />
              </Collapse>

              <HeaderContent header={header} shouldDisableActions={shouldDisableActions} />
            </div>
          );
        }}
      </Motion>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const path = state.org.present.get('path');
  const file = state.org.present.getIn(['files', path], Map());
  const narrowedHeader = !!file.get('narrowedHeaderId')
    ? headerWithId(file.get('headers'), file.get('narrowedHeaderId'))
    : null;

  return {
    bulletStyle: state.base.get('bulletStyle'),
    shouldLogIntoDrawer: state.base.get('shouldLogIntoDrawer'),
    shouldLogDone: state.base.get('shouldLogDone'),
    closeSubheadersRecursively: state.base.get('closeSubheadersRecursively'),
    narrowedHeader,
    isNarrowed: !!narrowedHeader && narrowedHeader.get('id') === ownProps.header.get('id'),
    showClockDisplay: state.org.present.get('showClockDisplay'),
    showDeadlineDisplay: state.base.get('showDeadlineDisplay'),
  };
};

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
  base: bindActionCreators(baseActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
