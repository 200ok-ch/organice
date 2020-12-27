import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import './stylesheet.css';
import logo from '../../images/organice.svg';
import ExternalLink from '../UI/ExternalLink';
import * as baseActions from '../../actions/base';

const Landing = ({ base }) => {
  return (
    <main className="landing-container-wrapper">
      <div className="landing-container">
        <h1 className="landing-app-name">organice</h1>

        <img className="landing-logo" src={logo} alt="Logo" />

        <h2 className="landing-tagline">organice organizes Org files nicely!</h2>

        <h2 className="landing-tagline">
          Syncs with Dropbox,
          <br /> Google Drive and WebDAV.
        </h2>

        <p className="landing-description">
          organice allows you to view and edit Org files from cloud storage directly on your device!
          No Org file or other user-data will be stored on our servers; the entire app is
          browser-based.
        </p>

        <Link to="/sign_in">
          <div className="btn landing-button">Sign in</div>
        </Link>
        <Link to="/sample" onClick={() => base.restoreStaticFile('sample')}>
          <div className="btn landing-button doc-button">View sample</div>
        </Link>
        <ExternalLink href="https://organice.200ok.ch/documentation.html">
          <div className="btn landing-button doc-button">Documentation</div>
        </ExternalLink>
      </div>
      <footer>
        <Link to="/privacy-policy">Privacy Policy</Link>
      </footer>
    </main>
  );
};

const mapDispatchToProps = (dispatch) => {
  return {
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default connect(null, mapDispatchToProps)(Landing);
