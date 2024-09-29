/* global process */

import React, { PureComponent, useState } from 'react';

import './stylesheet.css';

import DropboxLogo from './dropbox.svg';
import GitLabLogo from './gitlab.svg';

import { persistField } from '../../util/settings_persister';
import {
  createGitlabOAuth,
  gitLabProjectIdFromURL,
} from '../../sync_backend_clients/gitlab_sync_backend_client';

import { DropboxAuth } from 'dropbox';
import _ from 'lodash';

function WebDAVForm() {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisible = () => setIsVisible(!isVisible);
  const [url, setUrl] = useState(process.env.REACT_APP_WEBDAV_URL);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div id="webdavLogin">
      <h2>
        <a href="#webdav" onClick={toggleVisible} style={{ textDecoration: 'none' }}>
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

function GitLab() {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisible = () => setIsVisible(!isVisible);

  const defaultProject = 'https://gitlab.com/your/project';
  const [project, setProject] = useState(defaultProject);
  const handleSubmit = (evt) => {
    const [hostname, projectId] = gitLabProjectIdFromURL(project);
    if (projectId) {
      persistField('authenticatedSyncService', 'GitLab');
      persistField('gitLabHost', hostname);
      persistField('gitLabProject', projectId);
      createGitlabOAuth().fetchAuthorizationCode();
    } else {
      evt.preventDefault();
      alert('Project does not appear to be a valid gitlab.com URL');
    }
  };

  return (
    <>
      <a href="#gitlab" onClick={toggleVisible}>
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
              placeholder={defaultProject}
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

    _.bindAll(this, ['handleDropboxClick']);
  }

  handleDropboxClick() {
    persistField('authenticatedSyncService', 'Dropbox');
    const REDIRECT_URI = window.location.origin + '/';

    const dbxAuth = new DropboxAuth({
      clientId: process.env.REACT_APP_DROPBOX_CLIENT_ID,
      fetch: fetch.bind(window),
    });

    dbxAuth
      .getAuthenticationUrl(REDIRECT_URI, undefined, 'code', 'offline', undefined, undefined, true)
      .then((authUrl) => {
        persistField('codeVerifier', dbxAuth.codeVerifier);
        window.location.href = authUrl;
      })
      .catch((error) => console.error(error));
  }

  render() {
    return (
      <div className="sync-service-sign-in-container">
        <p className="sync-service-sign-in__help-text">
          organice syncs your files with Dropbox, GitLab, and WebDAV.
        </p>
        <p className="sync-service-sign-in__help-text">Click to sign in with:</p>

        <div className="sync-service-container">
          <a href="#dropbox" onClick={this.handleDropboxClick}>
            <img src={DropboxLogo} alt="Dropbox logo" className="dropbox-logo" />
          </a>
        </div>

        <div className="sync-service-container">
          <GitLab />
        </div>

        <div className="sync-service-container">
          <WebDAVForm />
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
