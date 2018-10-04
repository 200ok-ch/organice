import React, { PureComponent } from 'react';
import { Motion, spring } from 'react-motion';

import './stylesheet.css';

import _ from 'lodash';

export default class LoadingIndicator extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleAnimationRest', 'handleClick']);

    this.state = {
      shouldRenderIndicator: true,
      lastMessage: props.message,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.message !== this.props.message && !!this.props.message) {
      this.setState({
        lastMessage: this.props.message,
        shouldRenderIndicator: true,
      });
    }
  }

  handleAnimationRest() {
    if (!!this.props.message) {
      return;
    }

    this.setState({
      shouldRenderIndicator: false,
      lastMessage: null,
    });
  }

  handleClick() {
    this.setState({ shouldRenderIndicator: false });
  }

  render() {
    const { message } = this.props;
    const { lastMessage, shouldRenderIndicator } = this.state;

    if (!shouldRenderIndicator) {
      return null;
    }

    const style = {
      opacity: spring(!!message ? 0.9 : 0, { stiffness: 300 }),
    };

    return (
      <Motion style={style} onRest={this.handleAnimationRest}>
        {style => (
          <div className="loading-indicator" style={style} onClick={this.handleClick}>
            {lastMessage}
          </div>
        )}
      </Motion>
    );
  }
}
