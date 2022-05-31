/* global process, gapi */

import React, { PureComponent, useState } from 'react';

import './stylesheet.css';

import DropboxLogo from './dropbox.svg';
import GoogleDriveLogo from './google_drive.png';
import GitLabLogo from './gitlab.svg';

import { persistField } from '../../util/settings_persister';
import {
  createGitlabOAuth,
  gitLabProjectIdFromURL,
} from '../../sync_backend_clients/gitlab_sync_backend_client';

import { Dropbox } from 'dropbox';
import _ from 'lodash';

function WebDAVForm() {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisible = () => setIsVisible(!isVisible);
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div id="webdavLogin">
      <h2>
        <a href="#" onClick={toggleVisible} style={{ textDecoration: 'none' }}>
          WebDAV
        </a>
      </h2>
      {isVisible && (
        <>
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
              <label htmlFor="input-webdav-url">URL:</label>
              <input
                id="input-webdav-url"
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
              <label htmlFor="input-webdav-user">Username:</label>
              <input
                id="input-webdav-user"
                type="text"
                className="textfield"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
              />
            </p>
            <p>
              <label htmlFor="input-webdav-password">Password:</label>
              <input
                id="input-webdav-password"
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
          <p>
            Please make sure your WebDAV backend meets the requirements as documented{' '}
            <a
              href="https://organice.200ok.ch/documentation.html#faq_webdav"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </a>
            , especially{' '}
            <a
              href="https://organice.200ok.ch/documentation.html#webdav_cors"
              target="_blank"
              rel="noopener noreferrer"
            >
              CORS
            </a>
            .
          </p>
        </>
      )}
    </div>
  );
}

function GoogleDriveNote() {
  const [isVisible, setIsVisible] = useState(false);

  return !isVisible ? (
    <div
      id="googleDriveNote"
      onClick={() => {
        setIsVisible(true);
      }}
    >
      <h4>Click to read news regarding use of Google drive</h4>
    </div>
  ) : (
    <div id="googleDriveNote">
      <h2>News regarding use of Google drive</h2>
      We are waiting for Google to put{' '}
      <a href="https://github.com/200ok-ch/organice/issues/127">
        Google Drive for this instance into production mode
      </a>
      . Until that has happend, only 100 users can use this instance of organice. If you cannot log
      in here, but want to use Google Drive,{' '}
      <a href="https://organice.200ok.ch/documentation.html#google_drive">
        here are the instructions
      </a>{' '}
      on running your own instance of organice with Google Drive enabled.
      <p>
        If you don't want to do that, you are welcome to use Dropbox or WebDAV as synchronisation
        back-ends.
      </p>
    </div>
  );
}

function GitLab() {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisible = () => setIsVisible(!isVisible);

  const [project, setProject] = useState('');
  const handleSubmit = (evt) => {
    const projectId = gitLabProjectIdFromURL(project);
    if (projectId) {
      persistField('authenticatedSyncService', 'GitLab');
      persistField('gitLabProject', projectId);
      createGitlabOAuth().fetchAuthorizationCode();
    } else {
      evt.preventDefault();
      alert('Project does not appear to be a valid gitlab.com URL');
    }
  };

  return (
    <>
      <a href="#" onClick={toggleVisible}>
        <img src={GitLabLogo} alt="GitLab logo" />
      </a>
      {isVisible && (
        <form onSubmit={handleSubmit}>
          <p>
            <label htmlFor="input-gitlab-project">Project:</label>
            <input
              id="input-gitlab-project"
              type="url"
              className="textfield"
              placeholder="gitlab.com/your/project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            />
          </p>
          <input type="submit" value="Sign-in" />
        </form>
      )}
    </>
  );
}

export default class SyncServiceSignIn extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleDropboxClick', 'handleGoogleDriveClick']);
  }

  handleDropboxClick() {
    persistField('authenticatedSyncService', 'Dropbox');

    const dropbox = new Dropbox({
      clientId: process.env.REACT_APP_DROPBOX_CLIENT_ID,
      fetch: fetch.bind(window),
    });
    dropbox.auth.getAuthenticationUrl(window.location.origin + '/').then((authURL) => {
      window.location = authURL;
    });
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
          organice syncs your files with Dropbox, GitLab, WebDAV and Google Drive.
        </p>
        <p className="sync-service-sign-in__help-text">Click to sign in with:</p>

        <div className="sync-service-container">
          <a href="#" onClick={this.handleDropboxClick}>
            <img src={DropboxLogo} alt="Dropbox logo" className="dropbox-logo" />
          </a>
        </div>

        <div className="sync-service-container">
          <GitLab />
        </div>

        <div className="sync-service-container">
          <WebDAVForm />
        </div>

        <div className="sync-service-container">
          <img
            src={GoogleDriveLogo}
            onClick={this.handleGoogleDriveClick}
            alt="Google Drive logo"
            className="google-drive-logo"
          />
          <GoogleDriveNote />
        </div>

        <footer>
          For questions regarding synchronization back-ends, please consult the{' '}
          <a
            href="https://organice.200ok.ch/documentation.html#sync_backends"
            target="_blank"
            rel="noopener noreferrer"
          >
            documentation
          </a>
          .
        </footer>
      </div>
    );
  }
}
