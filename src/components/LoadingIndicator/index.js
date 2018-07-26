import React, { Component } from 'react';

import './LoadingIndicator.css';

export default class LoadingIndicator extends Component {
  render() {
    const { message } = this.props;

    return (
      <div className="loading-indicator">
        {message}
      </div>
    );
  }
}
