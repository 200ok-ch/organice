/* global process */

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Dropbox } from 'dropbox';

import _ from 'lodash';

import parseQueryString from '../../util/parse_query_string';

import HeaderBar from '../HeaderBar/HeaderBar';
import Landing from '../Landing/Landing';
import FileBrowser from '../FileBrowser/FileBrowser';
import LoadingIndicator from '../LoadingIndicator/LoadingIndicator';
import OrgFile from '../OrgFile/OrgFile';

import * as dropboxActions from '../../actions/dropbox';

class Entry extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleSignIn']);
  }

  componentDidMount() {
    const accessToken = parseQueryString(window.location.hash).access_token;
    if (accessToken) {
      this.props.dropbox.authenticate(accessToken);
      window.location.hash = '';
    }
  }

  handleSignIn() {
    const dropbox = new Dropbox({ clientId: process.env.REACT_APP_DROPBOX_CLIENT_ID });
    const authURL = dropbox.getAuthenticationUrl(window.location.href);
    window.location = authURL;
  }

  render() {
    const {
      isAuthenticated,
      loadingMessage,
      isOrgFileDownloaded,
    } = this.props;

    return (
      <div>
        <HeaderBar onSignInClick={this.handleSignIn} />

        {!!loadingMessage && <LoadingIndicator message={loadingMessage} />}

        {isAuthenticated ? (
          isOrgFileDownloaded ? (
            <OrgFile />
          ) : (
            <FileBrowser />
          )
        ) : (
          <Landing onSignInClick={this.handleSignIn} />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    loadingMessage: state.base.get('loadingMessage'),
    isOrgFileDownloaded: !!state.org.get('path'),
    isAuthenticated: !!state.dropbox.get('accessToken'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dropbox: bindActionCreators(dropboxActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Entry);
