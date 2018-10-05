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

  componentDidMount() {
    this.setState({ isVisible: true });
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
                className="slide-up-inner-container"
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
