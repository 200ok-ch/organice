import React from 'react';
import { Link } from 'react-router-dom';

import './stylesheet.css';

export default () => {
  return (
    <div className="landing-container">
      <h1 className="landing-app-name">org-web</h1>
      <h2 className="landing-tagline">Edit your org files online.</h2>
      <h2 className="landing-tagline">Optimized for mobile.</h2>
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

      <div className="mailing-list-signup-container">
        Interested in getting updates about org-web? Sign up for the{' '}
        <a href="http://eepurl.com/dK5F9w" target="_blank" rel="noopener noreferrer">
          mailing list
        </a>{' '}
        (Or check out some{' '}
        <a
          href="https://us19.campaign-archive.com/home/?u=36b9d8082ddb55e6cc7e22339&id=f427625e31"
          target="_blank"
          rel="noopener noreferrer"
        >
          past emails
        </a>{' '}
        before you sign up)
      </div>
    </div>
  );
};
