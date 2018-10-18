import React, { PureComponent } from 'react';

import './stylesheet.css';

import { Motion, spring } from 'react-motion';
import _ from 'lodash';
import classNames from 'classnames';

export default class SlideUp extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleClose', 'handleAnimationRest']);

    this.state = {
      isVisible: false,
      dragOffsetY: null,
    };
  }

  componentDidMount() {
    this.setState({ isVisible: true });

    // Super annoying logic for disabling scrolling of the body when a slide up is active.
    // Briefly: if we're already at the top of our SlideUp and trying to scroll up, disable
    // scrolling. Likewise, if we're already at the bottom of our SlideUp and trying to scroll
    // down, disable scrolling.
    this.innerContainer.addEventListener('touchstart', event => {
      this.initialClientY = event.targetTouches[0].clientY;
    });

    this.innerContainer.addEventListener('touchmove', event => {
      const isScrollingDown = this.initialClientY > event.targetTouches[0].clientY;

      if (
        isScrollingDown &&
        this.innerContainer.scrollHeight - this.innerContainer.scrollTop <=
          this.innerContainer.clientHeight
      ) {
        event.preventDefault();
      } else if (!isScrollingDown && this.innerContainer.scrollTop === 0) {
        event.preventDefault();

        this.setState({ dragOffsetY: event.targetTouches[0].clientY - this.initialClientY });
      }
    });

    this.innerContainer.addEventListener('touchend', event => {
      this.endInnerContainerDrag(this.state.dragOffsetY);
    });

    this.innerContainer.addEventListener('touchcancel', event => {
      this.endInnerContainerDrag(this.state.dragOffsetY);
    });

    this.updateInnerContainerHeight();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.dragOffsetY === prevState.dragOffsetY) {
      // A ridiculous hack to get around what is presumably a Mobile Safari bug in iOS 12.
      // Without this, I can't scroll the inner container in the agenda view.
      setTimeout(() => {
        this.innerContainer.style.left = '0';
        setTimeout(() => {
          this.innerContainer.style.left = '-1px';
        }, 0);
      }, 0);
    }

    this.updateInnerContainerHeight();
  }

  updateInnerContainerHeight() {
    this.innerContainerHeight = this.innerContainer.offsetHeight;
  }

  endInnerContainerDrag(endingDragOffset) {
    const isVisible = endingDragOffset <= this.innerContainerHeight * 0.3;

    this.setState({ dragOffsetY: null, isVisible });
  }

  handleInnerContainerClick(event) {
    event.stopPropagation();
  }

  handleClose() {
    this.setState({ isVisible: false });
  }

  handleAnimationRest() {
    if (!this.state.isVisible && !!this.props.onClose) {
      this.props.onClose();
    }
  }

  render() {
    const { children, shouldIncludeCloseButton, onClose } = this.props;
    const { isVisible, dragOffsetY } = this.state;

    const outerClassName = classNames('slide-up-outer-container', {
      'slide-up-outer-container--visible': isVisible,
    });

    const innerStyle = {
      offsetY:
        dragOffsetY ||
        spring(isVisible ? 0 : this.innerContainerHeight || window.innerHeight, {
          stiffness: 300,
        }),
    };

    return (
      <Motion style={innerStyle} onRest={this.handleAnimationRest}>
        {style => {
          const interpolatedStyle = {
            transform: `translateY(${style.offsetY}px)`,
          };

          return (
            <div className={outerClassName} onClick={!!onClose ? this.handleClose : null}>
              <div
                onClick={this.handleInnerContainerClick}
                className="slide-up-inner-container nice-scroll"
                ref={div => (this.innerContainer = div)}
                style={interpolatedStyle}
              >
                {shouldIncludeCloseButton && (
                  <button
                    className="fas fa-times fa-lg slide-up__close-button"
                    onClick={this.handleClose}
                  />
                )}

                {children}
              </div>
            </div>
          );
        }}
      </Motion>
    );
  }
}
