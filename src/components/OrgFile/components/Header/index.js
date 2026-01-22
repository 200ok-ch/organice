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
import { shareContent } from '../../../../lib/share_utils';
import { exportHeaderWithSubheaders } from '../../../../lib/export_org';

class Header extends PureComponent {
  SWIPE_ACTION_ACTIVATION_DISTANCE = 80;
  FREE_DRAG_ACTIVATION_DISTANCE = 10;
  DRAG_REORDER_LONG_PRESS_DURATION = 600;
  DRAG_REORDER_MOVEMENT_THRESHOLD = 10;

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
      'handleDuplicateHeader',
      // Drag-reorder long-press handlers
      'handleDragReorderPressStart',
      'handleDragReorderPressMove',
      'handleDragReorderPressEnd',
      'handleDragReorderPressCancel',
      'handleEscapeKey',
    ]);

    this.state = {
      isDraggingFreely: false,
      dragStartX: null,
      currentDragX: null,
      containerWidth: null,
      isPlayingRemoveAnimation: false,
      heightBeforeRemove: null,
      disabledBackgroundColor: readRgbaVariable('--base3'),
      // Track vertical touch positions to detect vertical scrolling intent
      touchStartY: null,
      currentTouchY: null,
      // Track vertical drag-reorder state
      isDraggingVertically: false,
      dragStartY: null,
      currentDragY: null,
      dragModeActive: false,
      dragTranslateY: 0,
      // Drop target detection
      dropTargetHeaderId: null,
      dropPosition: null, // 'above' or 'below'
    };

    // Store member callbacks handling global mouse/touch events to be able to handle dragging
    // interactions outside of the current component.
    this.globalMouseMoveHandler = this.handleMouseMove.bind(this);
    this.globalMouseUpHandler = this.handleMouseUp.bind(this);
    this.globalTouchMoveHandler = this.handleTouchMove.bind(this);
    this.globalTouchEndHandler = this.handleTouchEnd.bind(this);

    // Long-press timer for drag-reorder mode
    this.dragReorderLongPressTimer = null;
    this.dragReorderPressStartPosition = null;
    this.isDragReorderLongPressing = false;

    // RequestAnimationFrame for smooth drag updates
    this.dragReorderRAFId = null;
    this.pendingDragY = null;
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

  addEscapeKeyHandler() {
    window.addEventListener('keydown', this.handleEscapeKey);
  }

  removeEscapeKeyHandler() {
    window.removeEventListener('keydown', this.handleEscapeKey);
  }

  componentDidMount() {
    if (this.containerDiv) {
      this.setState({ containerWidth: this.containerDiv.offsetWidth });
    }
  }

  componentWillUnmount() {
    this.removeGlobalDragHandlers();
    this.removeEscapeKeyHandler();
    if (this.dragReorderLongPressTimer) {
      clearTimeout(this.dragReorderLongPressTimer);
    }
    if (this.dragReorderRAFId) {
      cancelAnimationFrame(this.dragReorderRAFId);
    }
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
      if (currentDragX >= 2 * dragStartX) {
        this.props.org.advanceTodoState(
          this.props.header.get('id'),
          this.props.shouldLogIntoDrawer
        );
      }

      if (dragStartX >= 2 * currentDragX) {
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
    // Start drag-reorder long-press detection
    this.handleDragReorderPressStart(event.clientX, event.clientY, event);
    // Also start horizontal swipe detection (will be canceled if drag-reorder activates)
    this.handleDragStart(event, event.clientX);
  }

  handleMouseMove(event) {
    // Handle drag-reorder movement
    this.handleDragReorderPressMove(event.clientX, event.clientY);
    // Handle horizontal swipe movement
    this.handleDragMove(event.clientX, event.clientY);
  }

  handleMouseUp() {
    // Handle drag-reorder end
    this.handleDragReorderPressEnd();
    // Handle horizontal swipe end
    this.handleDragEnd();
  }

  handleTouchStart(event) {
    const touch = event.changedTouches[0];

    // Capture the initial Y position of the touch to track vertical movement
    this.setState({
      touchStartY: touch.clientY,
    });

    // Start drag-reorder long-press detection
    this.handleDragReorderPressStart(touch.clientX, touch.clientY, event);
    // Also start horizontal swipe detection (will be canceled if drag-reorder activates)
    this.handleDragStart(event, touch.clientX);
  }

  handleTouchMove(event) {
    const touch = event.changedTouches[0];
    const currentY = touch.clientY;
    const currentX = touch.clientX;

    // Update the current Y position for vertical movement tracking
    this.setState({ currentTouchY: currentY });

    // Handle drag-reorder movement
    this.handleDragReorderPressMove(currentX, currentY);

    // Detect if this is primarily a vertical scroll gesture
    // If the user is moving more vertically than horizontally, we should
    // cancel the horizontal drag to allow normal page scrolling
    if (this.state.touchStartY !== null && this.state.dragStartX !== null) {
      const verticalDistance = Math.abs(currentY - this.state.touchStartY);
      const horizontalDistance = Math.abs(currentX - this.state.dragStartX);

      // If vertical movement is significantly greater than horizontal movement,
      // cancel the drag operation to allow normal page scrolling
      // The threshold of 10px ensures small movements don't trigger cancellation
      if (verticalDistance > horizontalDistance && verticalDistance > 10) {
        this.handleDragCancel();
        return;
      }
    }

    this.handleDragMove(currentX, currentY);
  }

  handleTouchEnd() {
    // Reset vertical touch tracking when touch ends
    this.setState({
      touchStartY: null,
      currentTouchY: null,
    });
    // Handle drag-reorder end
    this.handleDragReorderPressEnd();
    // Handle horizontal swipe end
    this.handleDragEnd();
  }

  handleTouchCancel() {
    // Reset vertical touch tracking when touch is cancelled
    this.setState({
      touchStartY: null,
      currentTouchY: null,
    });
    // Handle drag-reorder cancel
    this.handleDragReorderPressCancel();
    // Handle horizontal swipe cancel
    this.handleDragCancel();
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Drag-Reorder Long-Press Handlers
  ////////////////////////////////////////////////////////////////////////////////

  handleDragReorderPressStart(clientX, clientY, event) {
    // Prevent drag if actions are disabled (e.g., during editing)
    if (this.props.shouldDisableActions) {
      return;
    }

    // Prevent drag if the target is within a table cell
    if (event && event.target && event.target.closest('.table-part')) {
      return;
    }

    // Prevent drag if the target is within the action drawer
    if (event && event.target && event.target.closest('.header-action-drawer-container')) {
      return;
    }

    this.isDragReorderLongPressing = false;
    this.didDragReorder = false; // Reset flag at start
    this.dragReorderPressStartPosition = { x: clientX, y: clientY };

    this.dragReorderLongPressTimer = setTimeout(() => {
      this.isDragReorderLongPressing = true;
      this.didDragReorder = true; // Mark that drag-reorder mode activated
      this.addEscapeKeyHandler();
      this.setState({
        dragModeActive: true,
        isDraggingVertically: true,
        dragStartY: clientY,
        currentDragY: clientY,
      });
    }, this.DRAG_REORDER_LONG_PRESS_DURATION);
  }

  handleDragReorderPressMove(clientX, clientY) {
    if (this.dragReorderPressStartPosition && !this.isDragReorderLongPressing) {
      const deltaX = Math.abs(clientX - this.dragReorderPressStartPosition.x);
      const deltaY = Math.abs(clientY - this.dragReorderPressStartPosition.y);

      // Only cancel if there's significant movement
      if (deltaX > 5 || deltaY > 5) {
        // If horizontal movement dominates (horizontal swipe intent), cancel drag-reorder
        // The + 10px threshold gives preference to horizontal swipe when ambiguous
        if (deltaX > deltaY + 10) {
          this.handleDragReorderPressCancel();
          return;
        }

        // If total movement exceeds threshold but vertical intent isn't clear,
        // cancel to let normal scrolling/swiping work
        const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (movement > this.DRAG_REORDER_MOVEMENT_THRESHOLD && deltaX >= deltaY) {
          this.handleDragReorderPressCancel();
          return;
        }
      }
    }

    if (this.state.isDraggingVertically) {
      this.pendingDragY = clientY;
      if (!this.dragReorderRAFId) {
        this.dragReorderRAFId = requestAnimationFrame(this.updateDragPosition.bind(this));
      }
    }
  }

  updateDragPosition() {
    if (this.pendingDragY !== null && this.state.dragStartY !== null) {
      const translateY = this.pendingDragY - this.state.dragStartY;

      // Handle scrolling if dragged header is at viewport boundary
      this.handleScrollIfAtBoundary();

      // Update drop target detection
      const dropTarget = this.findDropTarget(this.pendingDragY);
      this.setState({
        currentDragY: this.pendingDragY,
        dragTranslateY: translateY,
        dropTargetHeaderId: dropTarget.headerId,
        dropPosition: dropTarget.position,
      });
      this.pendingDragY = null;
    }
    this.dragReorderRAFId = null;
  }

  handleScrollIfAtBoundary() {
    if (!this.containerDiv) return;

    const SCROLL_THRESHOLD = 50; // pixels from edge
    const SCROLL_AMOUNT = 10; // pixels to scroll per frame
    const draggedRect = this.containerDiv.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Check if dragged header is near the top edge
    if (draggedRect.top < SCROLL_THRESHOLD) {
      window.scrollBy(0, -SCROLL_AMOUNT);
    }
    // Check if dragged header is near the bottom edge
    else if (draggedRect.bottom > viewportHeight - SCROLL_THRESHOLD) {
      window.scrollBy(0, SCROLL_AMOUNT);
    }
  }

  findDropTarget(pointerY) {
    // Find the header element under the pointer
    const headerElements = document.querySelectorAll('.header');
    const currentHeaderId = this.props.header.get('id');

    // Get the parent of the dragged header to constrain drops to same-level siblings
    const draggedParentId = this.getParentHeaderId(currentHeaderId);

    let targetElement = null;
    let minDistance = Infinity;
    let firstValidElement = null;
    let lastValidElement = null;

    headerElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const headerId = element.dataset?.headerId;

      // Skip the dragged header itself and its children
      if (headerId === currentHeaderId || this.isDescendantHeader(headerId, currentHeaderId)) {
        return;
      }

      // Filter to only include headers with the same parent (same-level siblings)
      const candidateParentId = this.getParentHeaderId(headerId);
      if (candidateParentId !== draggedParentId) {
        return;
      }

      // Track first and last valid elements for boundary handling
      if (!firstValidElement) {
        firstValidElement = { element, rect, headerId };
      }
      lastValidElement = { element, rect, headerId };

      // Check if pointer is within or near this header element
      if (pointerY >= rect.top - 20 && pointerY <= rect.bottom + 20) {
        const distance = Math.abs(pointerY - (rect.top + rect.height / 2));
        if (distance < minDistance) {
          minDistance = distance;
          targetElement = { element, rect, headerId };
        }
      }
    });

    // Handle document boundaries
    if (!targetElement) {
      if (!firstValidElement) {
        return { headerId: null, position: null };
      }

      // Pointer is above all headers - target the first one
      const firstRect = firstValidElement.rect;
      if (pointerY < firstRect.top) {
        return { headerId: firstValidElement.headerId, position: 'above' };
      }

      // Pointer is below all headers - target the last one
      const lastRect = lastValidElement.rect;
      if (pointerY > lastRect.bottom) {
        return { headerId: lastValidElement.headerId, position: 'below' };
      }

      // No valid target found
      return { headerId: null, position: null };
    }

    // Determine if pointer is in top or bottom half of target header
    const midpoint = targetElement.rect.top + targetElement.rect.height / 2;
    const position = pointerY < midpoint ? 'above' : 'below';

    return { headerId: targetElement.headerId, position };
  }

  getParentHeaderId(headerId) {
    // Returns the immediate parent header ID for a given header, or null for top-level headers
    const headers = this.props.headers || this.props.file?.get('headers');
    if (!headers) return null;

    const headerIndex = headers.findIndex(h => h.get('id') === headerId);
    if (headerIndex === -1) return null;

    const headerLevel = headers.getIn([headerIndex, 'nestingLevel']);

    // Top-level headers have no parent
    if (headerLevel === 1) {
      return null;
    }

    // Search backwards for the parent header
    // Parent is the most recent header with a lower nesting level
    for (let i = headerIndex - 1; i >= 0; i--) {
      const header = headers.get(i);
      const nestingLevel = header.get('nestingLevel');

      if (nestingLevel < headerLevel) {
        return header.get('id');
      }
    }

    return null;
  }

  isDescendantHeader(potentialDescendantId, ancestorId) {
    // Check if potentialDescendantId is a child/grandchild of ancestorId
    const headers = this.props.headers || this.props.file?.get('headers');
    if (!headers) return false;

    const ancestorIndex = headers.findIndex(h => h.get('id') === ancestorId);
    if (ancestorIndex === -1) return false;

    const ancestorLevel = headers.getIn([ancestorIndex, 'nestingLevel']);

    // Find the potential descendant
    for (let i = ancestorIndex + 1; i < headers.size; i++) {
      const header = headers.get(i);
      const headerId = header.get('id');
      const nestingLevel = header.get('nestingLevel');

      // If we've reached a sibling or parent of the ancestor, stop looking
      if (nestingLevel <= ancestorLevel) {
        return false;
      }

      if (headerId === potentialDescendantId) {
        return true;
      }
    }

    return false;
  }

  handleDragReorderPressEnd() {
    if (this.dragReorderLongPressTimer) {
      clearTimeout(this.dragReorderLongPressTimer);
      this.dragReorderLongPressTimer = null;
    }

    this.dragReorderPressStartPosition = null;

    if (this.dragReorderRAFId) {
      cancelAnimationFrame(this.dragReorderRAFId);
      this.dragReorderRAFId = null;
    }

    this.pendingDragY = null;

    this.removeEscapeKeyHandler();

    // Commit the drop if we have a valid drop target
    if (
      this.state.isDraggingVertically &&
      this.state.dropTargetHeaderId &&
      this.state.dropPosition
    ) {
      this.props.org.moveHeaderToPosition(
        this.props.header.get('id'),
        this.state.dropTargetHeaderId,
        this.state.dropPosition
      );
    }

    if (this.state.isDraggingVertically) {
      this.setState({
        isDraggingVertically: false,
        dragStartY: null,
        currentDragY: null,
        dragModeActive: false,
        dragTranslateY: 0,
        dropTargetHeaderId: null,
        dropPosition: null,
      });
    }

    this.isDragReorderLongPressing = false;
  }

  handleDragReorderPressCancel() {
    if (this.dragReorderLongPressTimer) {
      clearTimeout(this.dragReorderLongPressTimer);
      this.dragReorderLongPressTimer = null;
    }

    this.dragReorderPressStartPosition = null;

    if (this.dragReorderRAFId) {
      cancelAnimationFrame(this.dragReorderRAFId);
      this.dragReorderRAFId = null;
    }

    this.pendingDragY = null;

    this.removeEscapeKeyHandler();

    if (this.state.isDraggingVertically) {
      this.setState({
        isDraggingVertically: false,
        dragStartY: null,
        currentDragY: null,
        dragModeActive: false,
        dragTranslateY: 0,
        dropTargetHeaderId: null,
        dropPosition: null,
      });
    }

    this.isDragReorderLongPressing = false;
  }

  handleEscapeKey(event) {
    if (event.key === 'Escape' && this.state.isDraggingVertically) {
      this.handleDragReorderPressCancel();
    }
  }

  handleHeaderClick(event) {
    // Prevent click if a drag-reorder was just completed
    if (this.didDragReorder) {
      this.didDragReorder = false;
      return;
    }

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

  handleDuplicateHeader() {
    this.props.org.duplicateHeader(this.props.header.get('id'));
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
    const { header, headers } = this.props;

    const titleLine = header.get('titleLine');
    const todoKeyword = titleLine.get('todoKeyword');
    const title = titleLine.get('rawTitle').trim();
    const fullTitle = todoKeyword ? `${todoKeyword} ${title}` : title;

    // Export header with all sub-headers
    const content = exportHeaderWithSubheaders(header, headers, {
      includeSubheaders: true,
      recursive: true,
      includeTitle: true,
      dontIndent: false,
    });

    // Use Web Share API with fallback to email
    shareContent({
      title: fullTitle,
      text: content,
    });
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
      headerIndex,
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

    let isOverdue = false;
    let deadlineString = '';
    if (showDeadlineDisplay && headerDeadlineMap) {
      const year = headerDeadlineMap.get('year');
      const month = headerDeadlineMap.get('month');
      const day = headerDeadlineMap.get('day');
      // Ensure parts are parsed as integers for Date constructor
      const deadlineDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today to midnight for date-only comparison

      isOverdue = deadlineDate < today;
      deadlineString = `${year}-${month}-${day}`;
    }

    const clockDisplayString =
      showClockDisplay && header.get('totalTimeLoggedRecursive') !== 0
        ? millisDuration(header.get('totalTimeLoggedRecursive'))
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
      'header--dragging': this.state.isDraggingVertically,
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

          // Apply vertical drag transform when drag-reorder is active
          if (this.state.isDraggingVertically && this.state.dragTranslateY !== 0) {
            headerStyle.transform = `translateY(${this.state.dragTranslateY}px)`;
            // Ensure the dragged header appears on top of other headers
            headerStyle.zIndex = 1000;
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
              data-header-id={header.get('id')}
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
                addition={clockDisplayString}
                showDeadlineDisplay={showDeadlineDisplay}
                headerDeadlineMap={headerDeadlineMap}
                deadlineString={deadlineString}
                isOverdue={isOverdue}
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
                  onDuplicateHeader={this.handleDuplicateHeader}
                />
              </Collapse>

              <HeaderContent
                header={header}
                headerIndex={headerIndex}
                shouldDisableActions={shouldDisableActions}
              />
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
    closeSubheadersRecursively: state.base.get('closeSubheadersRecursively'),
    narrowedHeader,
    isNarrowed: !!narrowedHeader && narrowedHeader.get('id') === ownProps.header.get('id'),
    showClockDisplay: state.org.present.get('showClockDisplay'),
    showDeadlineDisplay: state.base.get('showDeadlineDisplay'),
    headers: file.get('headers'),
  };
};

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
  base: bindActionCreators(baseActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
