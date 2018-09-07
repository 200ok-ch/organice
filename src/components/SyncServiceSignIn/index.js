/* global process */

import React, { PureComponent } from 'react';

import './SyncServiceSignIn.css';

import DropboxLogo from './dropbox.svg';
import GoogleDriveLogo from './google_drive.png';

import { Dropbox } from 'dropbox';

import _ from 'lodash';

export default class SyncServiceSignIn extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleDropboxClick', 'handleGoogleDriveClick']);
  }

  handleDropboxClick() {
    const dropbox = new Dropbox({ clientId: process.env.REACT_APP_DROPBOX_CLIENT_ID });
    const authURL = dropbox.getAuthenticationUrl(window.location.origin + '/');
    window.location = authURL;
  }

  handleGoogleDriveClick() {
    console.log('google drive');
  }

  render() {
    return (
      <div className="sync-service-sign-in-container">
        <div className="sync-service-container" onClick={this.handleDropboxClick}>
          <img src={DropboxLogo} alt="Dropbox logo" className="dropbox-logo" />
        </div>

        <div className="sync-service-container" onClick={this.handleGoogleDriveClick}>
          <img src={GoogleDriveLogo} alt="Google Drive logo" className="google-drive-logo" />
        </div>
      </div>
    );
  }
}
