/* global process, gapi */

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
    try {
      gapi.load('client:auth2', () => {
        gapi.client.init({
          apiKey: process.env.REACT_APP_GOOGLE_DRIVE_API_KEY,
          clientId: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
          // TODO: use proper scope here
          scope: 'https://www.googleapis.com/auth/drive.metadata.readonly',
        }).then(() => {
          gapi.auth2.getAuthInstance().signIn({
            ux_mode: 'redirect',
            redirect_uri: window.location.origin,
          });
        });
      });
    } catch(error) {
      alert(`The Google Drive client isn't available - you might be blocking it with an ad blocker`);
      return;
    }
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
