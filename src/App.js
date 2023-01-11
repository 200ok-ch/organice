import React, { PureComponent } from 'react';

import { Provider } from 'react-redux';
import Store from './store';
import {
  readInitialState,
  loadSettingsFromConfigFile,
  subscribeToChanges,
  persistField,
  getPersistedField,
} from './util/settings_persister';

import runAllMigrations from './migrations';
import parseQueryString from './util/parse_query_string';
import { BrowserRouter } from 'react-router-dom';

import { DragDropContext } from 'react-beautiful-dnd';

import { reorderCaptureTemplate } from './actions/capture';
import { reorderTags, reorderPropertyList, reorderFileSetting } from './actions/org';
import { signOut } from './actions/sync_backend';
import { setDisappearingLoadingMessage, restoreStaticFile } from './actions/base';

import createDropboxSyncBackendClient from './sync_backend_clients/dropbox_sync_backend_client';
import createWebDAVSyncBackendClient from './sync_backend_clients/webdav_sync_backend_client';
import createAndroidSyncBackendClient from './sync_backend_clients/android_sync_backend_client';
import createGitLabSyncBackendClient, {
  createGitlabOAuth,
} from './sync_backend_clients/gitlab_sync_backend_client';

import './base.css';

import Turnout from './components/Turnout';

import {
  listenToBrowserButtons,
  syncOnBecomingVisible,
  listenToNetworkConnectionEvents,
} from './lib/initial_setup';

import _ from 'lodash';
import { Map } from 'immutable';

import AppUrlListener from './AppUrlListener';

import { configure } from 'react-hotkeys';

// import { SendIntent } from 'send-intent';

// do handle hotkeys even if they come from within 'input', 'select' or 'textarea'
configure({ ignoreTags: [] });

// SendIntent.checkSendIntentReceived()
//   .then((result) => {
//     if (result) {
//       console.log('SendIntent received');
//       console.log(JSON.stringify(result));
//     }
//     if (result.url) {
//       let resultUrl = decodeURIComponent(result.url);
//       console.log(resultUrl);
//       // Filesystem.readFile({path: resultUrl})
//       //   .then((content) => {
//       //     console.log(content.data);
//       //   })
//       //   .catch((err) => console.error(err));
//     }
//   })
//   .catch((err) => console.error(err));

const handleGitLabAuthResponse = async (oauthClient) => {
  let success = false;
  let error;
  try {
    success = await oauthClient.isReturningFromAuthServer();
    await oauthClient.getAccessToken();
  } catch (e) {
    error = e;
    success = false;
  }
  if (!success) {
    // Edge case: somehow OAuth success redirect occurred but there isn't a code in
    // the current location's search params. This /shouldn't/ happen in practice.
    alert('Unexpected sign in error, please try again: ' + error);
    return;
  }

  const syncClient = createGitLabSyncBackendClient(oauthClient);
  const isAccessible = await syncClient.isProjectAccessible();
  if (!isAccessible) {
    alert('Failed to access GitLab project - is the URL correct?');
  } else {
    window.location.search = '';
  }
};

export function handleAuthenticatedSyncService(initialState) {
  const hashContents = parseQueryString(window.location.hash);
  const authenticatedSyncService = getPersistedField('authenticatedSyncService', true);
  let client = null;

  if (!!authenticatedSyncService) {
    switch (authenticatedSyncService) {
      case 'Dropbox':
        const dropboxAccessToken = hashContents.access_token;
        if (dropboxAccessToken) {
          client = createDropboxSyncBackendClient(dropboxAccessToken);
          initialState.syncBackend = Map({
            isAuthenticated: true,
            client,
          });
          persistField('dropboxAccessToken', dropboxAccessToken);
          window.location.hash = '';
        } else {
          const persistedDropboxAccessToken = getPersistedField('dropboxAccessToken', true);
          if (!!persistedDropboxAccessToken) {
            client = createDropboxSyncBackendClient(persistedDropboxAccessToken);
            initialState.syncBackend = Map({
              isAuthenticated: true,
              client,
            });
          }
        }
        break;
      case 'GitLab':
        const gitlabOAuth = createGitlabOAuth();
        if (gitlabOAuth.isAuthorized()) {
          client = createGitLabSyncBackendClient(gitlabOAuth);
          initialState.syncBackend = Map({
            isAuthenticated: true,
            client,
          });
        } else {
          handleGitLabAuthResponse(gitlabOAuth);
        }
        break;
      case 'WebDAV':
        client = createWebDAVSyncBackendClient(
          getPersistedField('webdavEndpoint'),
          getPersistedField('webdavUsername'),
          getPersistedField('webdavPassword')
        );
        initialState.syncBackend = Map({
          isAuthenticated: true,
          client,
        });
        break;
      case 'AndroidStorage':
        client = createAndroidSyncBackendClient(
          getPersistedField("orgDirectory"),
          getPersistedField("orgDirectoryPath")
        );
        initialState.syncBackend = Map({
          isAuthenticated: true,
          client,
        });
        break;
      default:
    }
  }
  return client;
}

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    runAllMigrations();

    const initialState = readInitialState();

    const client = handleAuthenticatedSyncService(initialState);

    const queryStringContents = parseQueryString(window.location.search);
    const { captureFile, captureTemplateName, captureContent } = queryStringContents;
    if (!!captureFile && !!captureTemplateName) {
      const capturePath = captureFile.startsWith('/') ? captureFile : `/${captureFile}`;
      const customCaptureVariables = Map(
        Object.entries(queryStringContents)
          .map(([key, value]) => {
            const CUSTOM_VARIABLE_PREFIX = 'captureVariable_';
            if (key.startsWith(CUSTOM_VARIABLE_PREFIX)) {
              return [key.substring(CUSTOM_VARIABLE_PREFIX.length), value];
            }

            return null;
          })
          .filter((item) => !!item)
      );
      initialState.org.present = initialState.org.present.set(
        'pendingCapture',
        Map({
          capturePath,
          captureTemplateName,
          captureContent,
          customCaptureVariables,
        })
      );
    }

    this.store = Store(initialState);
    this.store.subscribe(subscribeToChanges(this.store));

    if (!!client) {
      client.isSignedIn().then((isSignedIn) => {
        if (isSignedIn) {
          loadSettingsFromConfigFile(this.store.dispatch, this.store.getState);
        } else {
          this.store.dispatch(signOut());
        }
      });
    } else {
      if (!!this.store.getState().org.present.get('pendingCapture')) {
        this.store.dispatch(
          setDisappearingLoadingMessage(
            `You need to sign in before you can use capture templates`,
            5000
          )
        );
      }
    }

    // Initially load the sample file.
    this.store.dispatch(restoreStaticFile('sample'));

    listenToBrowserButtons(this.store);
    syncOnBecomingVisible(this.store);
    listenToNetworkConnectionEvents(this.store);

    _.bindAll(this, ['handleDragEnd']);
  }

  handleDragEnd(result) {
    if (!result.destination) {
      return;
    }

    if (result.type === 'TAG') {
      this.store.dispatch(reorderTags(result.source.index, result.destination.index));
    } else if (result.type === 'PROPERTY-LIST') {
      this.store.dispatch(reorderPropertyList(result.source.index, result.destination.index));
    } else if (result.type === 'CAPTURE-TEMPLATE') {
      this.store.dispatch(reorderCaptureTemplate(result.source.index, result.destination.index));
    } else if (result.type === 'FILE-SETTING') {
      this.store.dispatch(reorderFileSetting(result.source.index, result.destination.index));
    }
  }

  render() {
    return (
      <DragDropContext onDragEnd={this.handleDragEnd}>
        <BrowserRouter>
          <AppUrlListener></AppUrlListener>
          <Provider store={this.store}>
            <Turnout />
          </Provider>
        </BrowserRouter>
      </DragDropContext>
    );
  }
}
