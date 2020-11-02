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
import { BrowserRouter as Router } from 'react-router-dom';

import { DragDropContext } from 'react-beautiful-dnd';

import { reorderCaptureTemplate } from './actions/capture';
import { reorderTags, reorderPropertyList } from './actions/org';
import { signOut } from './actions/sync_backend';
import { setDisappearingLoadingMessage } from './actions/base';

import createDropboxSyncBackendClient from './sync_backend_clients/dropbox_sync_backend_client';
import createGoogleDriveSyncBackendClient from './sync_backend_clients/google_drive_sync_backend_client';
import createWebDAVSyncBackendClient from './sync_backend_clients/webdav_sync_backend_client';

import './base.css';

import Entry from './components/Entry';

import _ from 'lodash';
import { Map } from 'immutable';

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    runAllMigrations();

    const initialState = readInitialState();

    window.initialHash = window.location.hash.substring(0);
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
        case 'Google Drive':
          client = createGoogleDriveSyncBackendClient();
          initialState.syncBackend = Map({
            isAuthenticated: true,
            client,
          });
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
        default:
      }
    }

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

    _.bindAll(this, ['handleDragEnd']);
  }

  handleDragEnd(result) {
    if (!result.destination) {
      return;
    }

    if (result.type === 'CAPTURE-TEMPLATE') {
      this.store.dispatch(reorderCaptureTemplate(result.source.index, result.destination.index));
    } else if (result.type === 'TAG') {
      this.store.dispatch(reorderTags(result.source.index, result.destination.index));
    } else if (result.type === 'PROPERTY-LIST') {
      this.store.dispatch(reorderPropertyList(result.source.index, result.destination.index));
    }
  }

  render() {
    return (
      <DragDropContext onDragEnd={this.handleDragEnd}>
        <Router>
          <Provider store={this.store}>
            <div className="App">
              <Entry />
            </div>
          </Provider>
        </Router>
      </DragDropContext>
    );
  }
}
