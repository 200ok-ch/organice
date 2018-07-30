import React, { PureComponent } from 'react';

import './Landing.css';

export default class Landing extends PureComponent {
  render() {
    const { onSignInClick, onViewSampleClick } = this.props;

    return (
      <div className="landing-container">
        <h1 className="landing-app-name">org-web</h1>
        <h2 className="landing-tagline">Directly edit your org files online.</h2>
        <h2 className="landing-tagline">Optimized for mobile.</h2>
        <h2 className="landing-tagline">Syncs with Dropbox.</h2>

        <div className="btn landing-button view-sample-button" onClick={onViewSampleClick}>View sample</div>
        <div className="btn landing-button" onClick={onSignInClick}>Sign in</div>
      </div>
    );
  }
}
