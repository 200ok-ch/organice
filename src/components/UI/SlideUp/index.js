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
      }
    });
  }

  handleInnerContainerClick(event) {
    event.stopPropagation();
  }

  handleClose() {
    this.setState({ isVisible: false });
  }

  handleAnimationRest() {
    if (!this.state.isVisible) {
      this.props.onClose();
    }
  }

  render() {
    const { children, shouldIncludeCloseButton } = this.props;
    const { isVisible } = this.state;

    const outerClassName = classNames('slide-up-outer-container', {
      'slide-up-outer-container--visible': isVisible,
    });

    const innerStyle = {
      animationProgress: spring(isVisible ? 100 : 0, { stiffness: 300 }),
    };

    return (
      <Motion style={innerStyle} onRest={this.handleAnimationRest}>
        {style => {
          return (
            <div className={outerClassName} onClick={this.handleClose}>
              <div
                onClick={this.handleInnerContainerClick}
                className="slide-up-inner-container nice-scroll"
                ref={div => (this.innerContainer = div)}
                style={{ transform: `translateY(${100 - style.animationProgress}%)` }}
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
