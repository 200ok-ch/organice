import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import Header from '../Header';

import * as orgActions from '../../../../actions/org';
import { numSubheadersOfHeaderWithId, hasHeaderContent } from '../../../../lib/org_utils';

import _ from 'lodash';
import classNames from 'classnames';
import { List, Map } from 'immutable';

class HeaderList extends PureComponent {
  LONG_PRESS_DELAY_MS = 350;
  LONG_PRESS_CANCEL_DISTANCE = 8;
  AUTO_SCROLL_MARGIN = 80;
  AUTO_SCROLL_SPEED = 18;

  constructor(props) {
    super(props);

    this.headerRefs = {};
    this.longPressCandidate = null;
    this.longPressTimer = null;
    this.autoScrollAnimationFrame = null;
    this.pointerX = null;
    this.pointerY = null;

    this.state = {
      draggingHeaderId: null,
      draggingStartY: null,
      currentPointerY: null,
      dropTargetHeaderId: null,
      dropPosition: null,
    };

    _.bindAll(this, [
      'handleHeaderRef',
      'handleHeaderLongPressStart',
      'handleHeaderLongPressEnd',
      'handleWindowPointerMove',
      'handleWindowPointerEnd',
      'stopLongPressCandidate',
      'startDrag',
      'updateDragState',
      'finishDrag',
      'loopAutoScroll',
      'stopAutoScrollLoop',
    ]);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedHeaderId !== this.props.selectedHeaderId) {
      const selectedHeaderDiv = this.headerRefs[this.props.selectedHeaderId];
      if (!!selectedHeaderDiv) {
        const boundingRectangle = selectedHeaderDiv.getBoundingClientRect();
        const viewportHeight = document.documentElement.clientHeight;

        if (boundingRectangle.top > viewportHeight * 0.9 || boundingRectangle.bottom < 0) {
          selectedHeaderDiv.scrollIntoView();
        }
      }
    }
  }

  componentWillUnmount() {
    this.stopLongPressCandidate();
    this.stopAutoScrollLoop();
    this.pointerX = null;
    this.pointerY = null;
    this.removeWindowListeners();
  }

  addWindowListeners() {
    window.addEventListener('mousemove', this.handleWindowPointerMove);
    window.addEventListener('mouseup', this.handleWindowPointerEnd);
    window.addEventListener('touchmove', this.handleWindowPointerMove, { passive: false });
    window.addEventListener('touchend', this.handleWindowPointerEnd);
    window.addEventListener('touchcancel', this.handleWindowPointerEnd);

    document.addEventListener('mousemove', this.handleWindowPointerMove);
    document.addEventListener('mouseup', this.handleWindowPointerEnd);
    document.addEventListener('touchmove', this.handleWindowPointerMove, { passive: false });
    document.addEventListener('touchend', this.handleWindowPointerEnd);
    document.addEventListener('touchcancel', this.handleWindowPointerEnd);
  }

  removeWindowListeners() {
    window.removeEventListener('mousemove', this.handleWindowPointerMove);
    window.removeEventListener('mouseup', this.handleWindowPointerEnd);
    window.removeEventListener('touchmove', this.handleWindowPointerMove);
    window.removeEventListener('touchend', this.handleWindowPointerEnd);
    window.removeEventListener('touchcancel', this.handleWindowPointerEnd);

    document.removeEventListener('mousemove', this.handleWindowPointerMove);
    document.removeEventListener('mouseup', this.handleWindowPointerEnd);
    document.removeEventListener('touchmove', this.handleWindowPointerMove);
    document.removeEventListener('touchend', this.handleWindowPointerEnd);
    document.removeEventListener('touchcancel', this.handleWindowPointerEnd);
  }

  pointerCoordinatesFromEvent(event) {
    if (event.changedTouches && event.changedTouches[0]) {
      return {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };
    }

    if (event.touches && event.touches[0]) {
      return {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }

    if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
      return {
        x: event.clientX,
        y: event.clientY,
      };
    }

    return null;
  }

  headerIdFromDatasetValue(datasetHeaderId) {
    const matchingHeader = this.props.headers.find(
      (header) => String(header.get('id')) === String(datasetHeaderId)
    );

    return matchingHeader ? matchingHeader.get('id') : null;
  }

  nestingLevelOfHeaderId(headerId) {
    const matchingHeader = this.props.headers.find((header) => header.get('id') === headerId);
    return matchingHeader ? matchingHeader.get('nestingLevel') : null;
  }

  dropTargetFromPointer(pointerX, pointerY, draggingHeaderId) {
    const draggingNestingLevel = this.nestingLevelOfHeaderId(draggingHeaderId);
    const headerElements = Array.from(document.querySelectorAll('.header[data-header-id]'));
    const candidateElements = headerElements.filter((headerElement) => {
      const candidateHeaderId = this.headerIdFromDatasetValue(headerElement.dataset.headerId);
      return (
        candidateHeaderId !== draggingHeaderId &&
        this.nestingLevelOfHeaderId(candidateHeaderId) === draggingNestingLevel
      );
    });

    if (candidateElements.length === 0) {
      return {
        targetHeaderId: null,
        dropPosition: null,
      };
    }

    const directHitElement = document
      .elementFromPoint(pointerX, pointerY)
      ?.closest('.header[data-header-id]');
    const directHitHeaderId = this.headerIdFromDatasetValue(directHitElement?.dataset.headerId);
    const directHitNestingLevel = this.nestingLevelOfHeaderId(directHitHeaderId);

    let targetElement =
      directHitElement &&
      directHitHeaderId !== draggingHeaderId &&
      directHitNestingLevel === draggingNestingLevel
        ? directHitElement
        : null;

    if (!targetElement) {
      targetElement = _.minBy(candidateElements, (headerElement) => {
        const rectangle = headerElement.getBoundingClientRect();
        const centerY = rectangle.top + rectangle.height / 2;
        return Math.abs(pointerY - centerY);
      });
    }

    if (!targetElement) {
      return {
        targetHeaderId: null,
        dropPosition: null,
      };
    }

    const targetHeaderId = this.headerIdFromDatasetValue(targetElement.dataset.headerId);
    const rectangle = targetElement.getBoundingClientRect();
    const dropPosition = pointerY < rectangle.top + rectangle.height / 2 ? 'before' : 'after';

    return {
      targetHeaderId,
      dropPosition,
    };
  }

  handleWindowPointerMove(event) {
    const coordinates = this.pointerCoordinatesFromEvent(event);
    if (!coordinates) {
      return;
    }

    const { x, y } = coordinates;

    if (this.state.draggingHeaderId) {
      if (event.cancelable) {
        event.preventDefault();
      }
      this.updateDragState(x, y);
      return;
    }

    if (!this.longPressCandidate) {
      return;
    }

    this.longPressCandidate.currentX = x;
    this.longPressCandidate.currentY = y;

    const horizontalDistance = Math.abs(this.longPressCandidate.startX - x);
    const verticalDistance = Math.abs(this.longPressCandidate.startY - y);

    if (
      horizontalDistance > this.LONG_PRESS_CANCEL_DISTANCE ||
      verticalDistance > this.LONG_PRESS_CANCEL_DISTANCE
    ) {
      this.stopLongPressCandidate();
      this.removeWindowListeners();
    }
  }

  handleWindowPointerEnd(event) {
    const coordinates = this.pointerCoordinatesFromEvent(event || {});
    if (coordinates) {
      this.pointerX = coordinates.x;
      this.pointerY = coordinates.y;
    }

    this.stopLongPressCandidate();

    if (this.state.draggingHeaderId) {
      this.finishDrag(true);
    }

    this.removeWindowListeners();
  }

  stopLongPressCandidate() {
    this.longPressCandidate = null;

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  startDrag() {
    if (!this.longPressCandidate) {
      return;
    }

    this.setState({
      draggingHeaderId: this.longPressCandidate.headerId,
      draggingStartY: this.longPressCandidate.startY,
      currentPointerY: this.longPressCandidate.currentY,
      dropTargetHeaderId: null,
      dropPosition: null,
    });

    this.pointerX = this.longPressCandidate.currentX;
    this.pointerY = this.longPressCandidate.currentY;
    this.stopLongPressCandidate();
    this.loopAutoScroll();
  }

  updateDragState(pointerX, pointerY) {
    this.pointerX = pointerX;
    this.pointerY = pointerY;
    const draggedHeaderId = this.state.draggingHeaderId;

    const { targetHeaderId, dropPosition } = this.dropTargetFromPointer(
      pointerX,
      pointerY,
      draggedHeaderId
    );

    if (!targetHeaderId) {
      this.setState({
        currentPointerY: pointerY,
        dropTargetHeaderId: null,
        dropPosition: null,
      });
      return;
    }

    this.setState({
      currentPointerY: pointerY,
      dropTargetHeaderId: targetHeaderId,
      dropPosition,
    });
  }

  finishDrag(shouldPersist = false) {
    const { draggingHeaderId } = this.state;
    let { dropTargetHeaderId, dropPosition } = this.state;

    if (shouldPersist && draggingHeaderId && this.pointerX !== null && this.pointerY !== null) {
      const latestDropTarget = this.dropTargetFromPointer(
        this.pointerX,
        this.pointerY,
        draggingHeaderId
      );
      dropTargetHeaderId = latestDropTarget.targetHeaderId;
      dropPosition = latestDropTarget.dropPosition;
    }

    if (shouldPersist && draggingHeaderId && dropTargetHeaderId && dropPosition) {
      this.props.org.moveHeaderToPosition(draggingHeaderId, dropTargetHeaderId, dropPosition);
    }

    this.stopAutoScrollLoop();
    this.pointerX = null;
    this.pointerY = null;

    this.setState({
      draggingHeaderId: null,
      draggingStartY: null,
      currentPointerY: null,
      dropTargetHeaderId: null,
      dropPosition: null,
    });
  }

  loopAutoScroll() {
    this.stopAutoScrollLoop();

    const scroll = () => {
      if (!this.state.draggingHeaderId || this.pointerY === null) {
        this.autoScrollAnimationFrame = null;
        return;
      }

      const appRoot = document.querySelector('.App');
      if (!appRoot) {
        this.autoScrollAnimationFrame = requestAnimationFrame(scroll);
        return;
      }

      if (this.pointerY <= this.AUTO_SCROLL_MARGIN) {
        appRoot.scrollTop -= this.AUTO_SCROLL_SPEED;
      } else if (this.pointerY >= window.innerHeight - this.AUTO_SCROLL_MARGIN) {
        appRoot.scrollTop += this.AUTO_SCROLL_SPEED;
      }

      if (this.pointerX !== null && this.pointerY !== null) {
        this.updateDragState(this.pointerX, this.pointerY);
      }

      this.autoScrollAnimationFrame = requestAnimationFrame(scroll);
    };

    this.autoScrollAnimationFrame = requestAnimationFrame(scroll);
  }

  stopAutoScrollLoop() {
    if (this.autoScrollAnimationFrame) {
      cancelAnimationFrame(this.autoScrollAnimationFrame);
      this.autoScrollAnimationFrame = null;
    }
  }

  handleHeaderLongPressStart(headerId, pointerX, pointerY) {
    if (this.props.shouldDisableActions) {
      return;
    }

    this.stopLongPressCandidate();
    this.addWindowListeners();

    this.longPressCandidate = {
      headerId,
      startX: pointerX,
      startY: pointerY,
      currentX: pointerX,
      currentY: pointerY,
    };

    this.longPressTimer = setTimeout(this.startDrag, this.LONG_PRESS_DELAY_MS);
  }

  handleHeaderLongPressEnd() {
    this.handleWindowPointerEnd();
  }

  handleHeaderRef(headerId) {
    return (div) => (this.headerRefs[headerId] = div);
  }

  render() {
    const { headers, selectedHeaderId, narrowedHeaderId, shouldDisableActions } = this.props;
    const {
      draggingHeaderId,
      draggingStartY,
      currentPointerY,
      dropTargetHeaderId,
      dropPosition,
    } = this.state;

    const headerRenderData = headers
      .map((header, index) => {
        return {
          header,
          displayed: false,
          hasContent: hasHeaderContent(header),
          absoluteIndex: index,
        };
      })
      .toArray();

    headerRenderData.forEach((headerRenderDatum, index) => {
      const nestingLevel = headerRenderDatum.header.get('nestingLevel');

      const hasNoParents = headerRenderData
        .slice(0, index)
        .every(
          (previousRenderDatum) => previousRenderDatum.header.get('nestingLevel') >= nestingLevel
        );
      if (hasNoParents) {
        headerRenderDatum.displayed = true;
      }

      const followingHeaders = headerRenderData.slice(index + 1);
      for (
        let followingHeaderIndex = 0;
        followingHeaderIndex < followingHeaders.length;
        ++followingHeaderIndex
      ) {
        const followingHeader = followingHeaders[followingHeaderIndex];
        if (followingHeader.header.get('nestingLevel') <= nestingLevel) {
          break;
        }

        headerRenderDatum.hasContent = true;

        followingHeader.displayed =
          headerRenderDatum.header.get('opened') && headerRenderDatum.displayed;
      }
    });

    if (!!narrowedHeaderId) {
      const narrowedHeaderIndex = headerRenderData.findIndex(
        (headerRenderDatum) => headerRenderDatum.header.get('id') === narrowedHeaderId
      );

      const previousHeaders = headerRenderData.slice(0, narrowedHeaderIndex);
      previousHeaders.forEach((headerRenderDatum) => (headerRenderDatum.displayed = false));

      const numSubheaders = numSubheadersOfHeaderWithId(headers, narrowedHeaderId);
      const followingHeaders = headerRenderData.slice(narrowedHeaderIndex + numSubheaders + 1);
      followingHeaders.forEach((headerRenderDatum) => (headerRenderDatum.displayed = false));
    }

    const headerColors = [
      'var(--blue)',
      'var(--green)',
      'var(--cyan)',
      'var(--yellow)',
      'var(--blue)',
      'var(--green)',
      'var(--cyan)',
      'var(--yellow)',
    ];

    const displayedHeaderRenderData = headerRenderData.filter(
      (headerRenderDatum) => headerRenderDatum.displayed
    );

    const className = classNames('header-list-container', {
      'header-list-container--narrowed': !!narrowedHeaderId,
      'header-list-container--reordering': !!draggingHeaderId,
    });

    return (
      <div className={className}>
        {displayedHeaderRenderData.map((headerRenderDatum) => {
          const header = headerRenderDatum.header;
          const headerIndex = headerRenderDatum.absoluteIndex;
          const color = headerColors[(header.get('nestingLevel') - 1) % headerColors.length];
          const headerId = header.get('id');

          return (
            <Header
              key={headerId}
              header={header}
              headerIndex={headerIndex}
              color={color}
              hasContent={headerRenderDatum.hasContent}
              isSelected={headerId === selectedHeaderId}
              onRef={this.handleHeaderRef(headerId)}
              shouldDisableActions={shouldDisableActions}
              onLongPressPointerStart={this.handleHeaderLongPressStart}
              onLongPressPointerEnd={this.handleHeaderLongPressEnd}
              isLongPressDragging={!!draggingHeaderId}
              isDraggedForReorder={draggingHeaderId === headerId}
              reorderDragOffsetY={
                draggingHeaderId === headerId && draggingStartY !== null && currentPointerY !== null
                  ? currentPointerY - draggingStartY
                  : 0
              }
              isReorderDropTarget={dropTargetHeaderId === headerId}
              reorderDropPosition={dropPosition}
            />
          );
        })}
        <div style={{ height: '90px' }} />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const path = state.org.present.get('path');
  const file = state.org.present.getIn(['files', path], Map());
  return {
    headers: file.get('headers', List()),
    selectedHeaderId: file.get('selectedHeaderId'),
    narrowedHeaderId: file.get('narrowedHeaderId'),
  };
};

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(HeaderList);
