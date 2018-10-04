import React, { PureComponent } from 'react';

import './stylesheet.css';

import { Motion, spring } from 'react-motion';
import _ from 'lodash';

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
    const { children, shouldIncludeCloseButton, onClose } = this.props;
    const { isVisible } = this.state;

    const innerStyle = {
      animationProgress: spring(isVisible ? 100 : 0, { stiffness: 300 }),
    };

    return (
      <Motion style={innerStyle} onRest={this.handleAnimationRest}>
        {style => {
          return (
            <div
              className="slide-up-outer-container test"
              onClick={this.handleClose}
              style={{ opacity: `${style.animationProgress / 100}` }}
            >
              <div
                onClick={this.handleInnerContainerClick}
                className="slide-up-inner-container"
                ref={div => (this.innerContainer = div)}
                style={{ bottom: `${style.animationProgress - 100}%` }}
              >
                {children}
              </div>
            </div>
          );
        }}
      </Motion>
    );
  }
}
