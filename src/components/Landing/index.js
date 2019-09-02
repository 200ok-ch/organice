import React from 'react';
import { Link } from 'react-router-dom';

import './stylesheet.css';
import logo from '../../images/organice.svg';

export default () => {
  return (
    <main>
      <div className="landing-container">
        <h1 className="landing-app-name">organice</h1>

        <img className="landing-logo" src={logo} alt="Logo" />

        <h2 className="landing-tagline">organice organizes Org files nicely!</h2>
        <h2 className="landing-tagline">Edit your Org files in a web browser.</h2>

        <h2 className="landing-tagline">
          Syncs with Dropbox
          <br />
          and Google Drive.
        </h2>

        <Link to="/sample">
          <div className="btn landing-button view-sample-button">View sample</div>
        </Link>
        <Link to="/sign_in">
          <div className="btn landing-button">Sign in</div>
        </Link>
      </div>
      <footer>
        <a href="/privacy-policy">Privacy Policy</a>
      </footer>
    </main>
  );
};
