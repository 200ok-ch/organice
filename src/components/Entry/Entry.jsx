/* global process */

import React, { Component } from 'react';
import { Provider } from 'react-redux';
import Store from '../../store';

import './Entry.css';

import { Dropbox } from 'dropbox';

import _ from 'lodash';

import HeaderBar from '../HeaderBar/HeaderBar';

export default class Entry extends Component {
  constructor(props) {
    super(props);

    this.store = Store();

    _.bindAll(this, ['handleSignIn']);
  }

  handleSignIn() {
    const dropbox = new Dropbox({ clientId: process.env.REACT_APP_DROPBOX_CLIENT_ID });
    const authURL = dropbox.getAuthenticationUrl(window.location.href);
    window.location = authURL;
  }

  render() {
    return (
      <Provider store={this.store}>
        <div>
          <HeaderBar onSignInClick={this.handleSignIn} />

          <br />
          <br />
          <div className="btn landing-button" onClick={this.handleSignIn}>Sign in</div>
        </div>
      </Provider>
    );
  }
}
