import React, { PureComponent } from 'react';
import { Link } from 'react-router-dom';

import './Landing.css';

export default class Landing extends PureComponent {
  render() {
    return (
      <div className="landing-container">
        <h1 className="landing-app-name">org-web</h1>
        <h2 className="landing-tagline">Edit your org files online.</h2>
        <h2 className="landing-tagline">Optimized for mobile.</h2>
        <h2 className="landing-tagline">Syncs with Dropbox.</h2>

        <Link to="/sample">
          <div className="btn landing-button view-sample-button">View sample</div>
        </Link>
        <Link to="/sign_in">
          <div className="btn landing-button">Sign in</div>
        </Link>
      </div>
    );
  }
}
