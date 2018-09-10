/* global gapi, process */

import React, { PureComponent } from 'react';
import { Provider } from 'react-redux';
import Store from './store';
import { readInitialState, loadSettingsFromConfigFile, subscribeToChanges } from './util/settings_persister';
import runAllMigrations from './migrations';
import parseQueryString from './util/parse_query_string';
import { BrowserRouter as Router } from 'react-router-dom';

import { DragDropContext } from 'react-beautiful-dnd';

import { reorderCaptureTemplate } from './actions/capture';
import { reorderTags } from './actions/org';
import { authenticate } from './actions/sync_backend';

import './App.css';
import './base.css';

import Entry from './components/Entry';

import _ from 'lodash';

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    runAllMigrations();

    this.store = Store(readInitialState());
    this.store.subscribe(subscribeToChanges(this.store));

    loadSettingsFromConfigFile(this.store);

    _.bindAll(this, ['handleDragEnd']);
  }

  componentDidMount() {
    const queryStringContents = parseQueryString(window.location.hash);

    const dropboxAccessToken = queryStringContents.access_token;
    if (dropboxAccessToken) {
      this.store.dispatch(authenticate(dropboxAccessToken));
      window.location.hash = '';
    }

    const checkForGoogleDriveLogin = () => {
      gapi.load('client:auth2', () => {
        gapi.client.init({
          client_id: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
          // TODO: use proper scope here.
          scope: 'https://www.googleapis.com/auth/drive.metadata.readonly',
        }).then(() => {
          console.log('Is signed in to Google?', gapi.auth2.getAuthInstance().isSignedIn.get());
        });
      });
    };

    if (gapi) {
      checkForGoogleDriveLogin();
    } else {
      window.handleGoogleDriveClick = checkForGoogleDriveLogin();
    }
  }

  handleDragEnd(result) {
    if (!result.destination) {
      return;
    }

    if (result.type === 'CAPTURE-TEMPLATE') {
      this.store.dispatch(reorderCaptureTemplate(result.source.index, result.destination.index));
    } else if (result.type === 'TAG') {
      this.store.dispatch(reorderTags(result.source.index, result.destination.index));
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
