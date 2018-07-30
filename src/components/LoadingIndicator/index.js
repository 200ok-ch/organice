import React, { PureComponent } from 'react';

import './LoadingIndicator.css';

export default class LoadingIndicator extends PureComponent {
  render() {
    const { message } = this.props;

    return (
      <div className="loading-indicator">
        {message}
      </div>
    );
  }
}
