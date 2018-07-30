/* global process */

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Dropbox } from 'dropbox';

import _ from 'lodash';

import parseQueryString from '../../util/parse_query_string';

import HeaderBar from '../HeaderBar';
import Landing from '../Landing';
import FileBrowser from '../FileBrowser';
import LoadingIndicator from '../LoadingIndicator';
import OrgFile from '../OrgFile';
import Settings from '../Settings';

import * as dropboxActions from '../../actions/dropbox';
import * as orgActions from '../../actions/org';
import * as baseActions from '../../actions/base';

class Entry extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleSignIn',
      'handleViewSample',
      'handleLiveFileBack',
      'handleSampleFileBack',
      'handleWhatsNewFileBack',
    ]);
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

  handleLiveFileBack() {
    this.props.org.stopDisplayingFile();
  }

  handleViewSample() {
    this.props.base.displaySample();
  }

  handleSampleFileBack() {
    this.props.base.hideSample();
  }

  handleWhatsNewFileBack() {
    this.props.base.hideWhatsNew();
  }

  render() {
    const {
      isAuthenticated,
      loadingMessage,
      isOrgFileDownloaded,
      isShowingSettingsPage,
      isShowingSamplePage,
      isShowingWhatsNewPage,
    } = this.props;

    return (
      <div>
        <HeaderBar onSignInClick={this.handleSignIn} />

        {!!loadingMessage && <LoadingIndicator message={loadingMessage} />}

        {isShowingWhatsNewPage ? (
          <OrgFile backButtonText="Done"
                   onBackClick={this.handleWhatsNewFileBack}
                   shouldDisableActionDrawer={true}
                   shouldDisableSyncButtons={false} />
        ) : (
          isAuthenticated ? (
            isShowingSettingsPage ? (
              <Settings />
            ) : (
              isOrgFileDownloaded ? (
                <OrgFile backButtonText="Back to file browser"
                         onBackClick={this.handleLiveFileBack}
                         shouldDisableActionDrawer={false}
                         shouldDisableSyncButtons={false} />
              ) : (
                <FileBrowser />
              )
            )
          ) : (
            isShowingSamplePage ? (
              <OrgFile backButtonText="Exit sample"
                       onBackClick={this.handleSampleFileBack}
                       shouldDisableActionDrawer={false}
                       shouldDisableSyncButtons={true} />
            ) : (
              <Landing onSignInClick={this.handleSignIn} onViewSampleClick={this.handleViewSample} />
            )
          )
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    loadingMessage: state.base.get('loadingMessage'),
    isOrgFileDownloaded: !!state.org.present.get('path'),
    isAuthenticated: !!state.dropbox.get('accessToken'),
    isShowingSettingsPage: state.base.get('isShowingSettingsPage'),
    isShowingSamplePage: state.base.get('isShowingSamplePage'),
    isShowingWhatsNewPage: state.base.get('isShowingWhatsNewPage'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dropbox: bindActionCreators(dropboxActions, dispatch),
    org: bindActionCreators(orgActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Entry);
