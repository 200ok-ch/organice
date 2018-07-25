import React, { Component } from 'react';

import './Landing.css';

export default class Landing extends Component {
  render() {
    const { onSignInClick } = this.props;

    return (
      <div className="landing-container">
        <div className="btn landing-button" onClick={onSignInClick}>Sign in</div>
      </div>
    );
  }
}
