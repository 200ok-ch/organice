/* global process, gapi */

import React, { PureComponent, useState } from 'react';

import './stylesheet.css';

import DropboxLogo from './dropbox.svg';
import GoogleDriveLogo from './google_drive.png';

import { persistField } from '../../util/settings_persister';

import { Dropbox } from 'dropbox';

import _ from 'lodash';

function WebDAVForm() {
  const [isVisible, setIsVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return !isVisible ? (
    <div
      id="webdavLogin"
      onClick={() => {
        setIsVisible(true);
      }}
    >
      <h2>WebDAV</h2>
    </div>
  ) : (
    <div id="webdavLogin">
      <h2>WebDAV</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          persistField('authenticatedSyncService', 'WebDAV');
          persistField('webdavEndpoint', url);
          persistField('webdavUsername', username);
          persistField('webdavPassword', password);
          window.location = window.location.origin + '/';
        }}
      >
        <p>
          <label>Url:</label>
          <input
            name="url"
            type="url"
            value={url}
            className="textfield"
            onChange={(e) => {
              setUrl(e.target.value);
            }}
          />
        </p>
        <p>
          <label>Username:</label>
          <input
            type="text"
            className="textfield"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
          />
        </p>
        <p>
          <label>Password:</label>
          <input
            type="password"
            className="textfield"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </p>
        <input type="submit" value="Sign-in" />
      </form>
    </div>
  );
}

export default class SyncServiceSignIn extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleDropboxClick', 'handleGoogleDriveClick']);
  }

  handleDropboxClick() {
    persistField('authenticatedSyncService', 'Dropbox');

    const dropbox = new Dropbox({ clientId: process.env.REACT_APP_DROPBOX_CLIENT_ID, fetch });
    const authURL = dropbox.getAuthenticationUrl(window.location.origin + '/');
    window.location = authURL;
  }

  handleGoogleDriveClick() {
    try {
      gapi.load('client:auth2', () => {
        gapi.client
          .init({
            apiKey: process.env.REACT_APP_GOOGLE_DRIVE_API_KEY,
            clientId: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: 'https://www.googleapis.com/auth/drive',
          })
          .then(() => {
            persistField('authenticatedSyncService', 'Google Drive');

            gapi.auth2.getAuthInstance().signIn({
              ux_mode: 'redirect',
              redirect_uri: window.location.origin,
            });
          });
      });
    } catch (error) {
      alert(
        `The Google Drive API client isn't available - you might be blocking it with an ad blocker`
      );
      return;
    }
  }

  render() {
    return (
      <div className="sync-service-sign-in-container">
        <p className="sync-service-sign-in__help-text">
          organice syncs your files with Dropbox, Google Drive and WebDAV.
        </p>
        <p className="sync-service-sign-in__help-text">Click to sign in with:</p>

        <div className="sync-service-container" onClick={this.handleDropboxClick}>
          <img src={DropboxLogo} alt="Dropbox logo" className="dropbox-logo" />
        </div>

        <div className="sync-service-container" onClick={this.handleGoogleDriveClick}>
          <img src={GoogleDriveLogo} alt="Google Drive logo" className="google-drive-logo" />
        </div>

        <div className="sync-service-container">
          <WebDAVForm />
        </div>
      </div>
    );
  }
}
