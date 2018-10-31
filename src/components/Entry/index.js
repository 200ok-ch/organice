import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Route, Switch, Redirect, Prompt, withRouter } from 'react-router-dom';

import './stylesheet.css';

import { List } from 'immutable';
import _ from 'lodash';
import classNames from 'classnames';

import { parseOrg } from '../../lib/parse_org';

import raw from 'raw.macro';

import Modal from '../UI/Modal';
import HeaderBar from '../HeaderBar';
import Landing from '../Landing';
import FileBrowser from '../FileBrowser';
import LoadingIndicator from '../LoadingIndicator';
import OrgFile from '../OrgFile';
import Settings from '../Settings';
import KeyboardShortcutsEditor from '../KeyboardShortcutsEditor';
import CaptureTemplatesEditor from '../CaptureTemplatesEditor';
import SyncServiceSignIn from '../SyncServiceSignIn';

import * as syncBackendActions from '../../actions/sync_backend';
import * as orgActions from '../../actions/org';
import * as baseActions from '../../actions/base';

class Entry extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['renderChangelogFile', 'renderSampleFile', 'renderFileBrowser', 'renderFile']);
  }

  componentDidMount() {
    const { lastSeenChangelogHeader, isAuthenticated } = this.props;

    const changelogFile = parseOrg(raw('../../../changelog.org'));
    const firstHeaderTitle = changelogFile.getIn(['headers', 0, 'titleLine', 'rawTitle']);
    if (
      isAuthenticated &&
      !!lastSeenChangelogHeader &&
      firstHeaderTitle !== lastSeenChangelogHeader
    ) {
      this.props.base.setHasUnseenChangelog(true);
    }
    this.props.base.setLastSeenChangelogHeader(firstHeaderTitle);
  }

  componentDidUpdate() {
    this.shouldPromptWhenLeaving()
      ? (window.onbeforeunload = () => true)
      : (window.onbeforeunload = undefined);
  }

  componentWillUnmount() {
    window.onbeforeunload = undefined;
  }

  renderChangelogFile() {
    return (
      <Modal>
        <OrgFile
          staticFile="changelog"
          shouldDisableDirtyIndicator={true}
          shouldDisableActions={true}
          shouldDisableSyncButtons={false}
          parsingErrorMessage={
            "The contents of changelog.org couldn't be loaded. You probably forgot to set the environment variable - see the Development section of README.org for details!"
          }
        />
      </Modal>
    );
  }

  renderSampleFile() {
    return (
      <Modal>
        <OrgFile
          staticFile="sample"
          shouldDisableDirtyIndicator={true}
          shouldDisableActionDrawer={false}
          shouldDisableSyncButtons={true}
          parsingErrorMessage={
            "The contents of sample.org couldn't be loaded. You probably forgot to set the environment variable - see the Development section of README.org for details!"
          }
        />
      </Modal>
    );
  }

  renderFileBrowser({
    match: {
      params: { path = '' },
    },
  }) {
    if (!!path) {
      path = '/' + path;
    }

    const hasActiveModalPage = !!this.props.activeModalPage;

    return <FileBrowser path={path} shouldSuppressScrolling={hasActiveModalPage} />;
  }

  renderFile({
    match: {
      params: { path },
    },
  }) {
    if (!!path) {
      path = '/' + path;
    }

    const hasActiveModalPage = !!this.props.activeModalPage;

    return (
      <OrgFile
        path={path}
        shouldDisableDirtyIndicator={false}
        shouldDisableActionDrawer={false}
        shouldDisableSyncButtons={false}
        shouldSuppressScrolling={hasActiveModalPage}
      />
    );
  }

  shouldPromptWhenLeaving() {
    return this.props.location.pathname.startsWith('/file/') && this.props.isDirty;
  }

  render() {
    const {
      isAuthenticated,
      loadingMessage,
      fontSize,
      activeModalPage,
      pendingCapture,
      location: { pathname },
    } = this.props;

    const pendingCapturePath = !!pendingCapture && `/file${pendingCapture.get('capturePath')}`;
    const shouldRedirectToCapturePath = pendingCapturePath && pendingCapturePath !== pathname;

    const className = classNames('entry-container', {
      'entry-container--large-font': fontSize === 'Large',
    });

    return (
      <div className={className}>
        <HeaderBar />

        <LoadingIndicator message={loadingMessage} />

        {isAuthenticated ? (
          <Fragment>
            <Prompt
              when={this.shouldPromptWhenLeaving()}
              message={() =>
                'You have unpushed changes - are you sure you want to leave this page?'
              }
            />

            <Switch>
              {shouldRedirectToCapturePath && <Redirect to={pendingCapturePath} />}
              <Route path="/file/:path+" render={this.renderFile} />
              <Route path="/files/:path*" render={this.renderFileBrowser} />
              <Redirect to="/files" />
            </Switch>

            {activeModalPage === 'changelog' && this.renderChangelogFile()}
            {activeModalPage === 'settings' && <Settings />}
            {activeModalPage === 'keyboard_shortcuts_editor' && <KeyboardShortcutsEditor />}
            {activeModalPage === 'capture_templates_editor' && <CaptureTemplatesEditor />}
            {activeModalPage === 'sample' && this.renderSampleFile()}
          </Fragment>
        ) : (
          <Switch>
            <Route path="/sample" exact={true} render={this.renderSampleFile} />
            <Route path="/sign_in" exact={true} component={SyncServiceSignIn} />
            <Route path="/" exact={true} component={Landing} />
            <Redirect to="/" />
          </Switch>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    loadingMessage: state.base.get('loadingMessage'),
    isAuthenticated: state.syncBackend.get('isAuthenticated'),
    fontSize: state.base.get('fontSize'),
    lastSeenChangelogHeader: state.base.get('lastSeenChangelogHeader'),
    activeModalPage: state.base.get('modalPageStack', List()).last(),
    pendingCapture: state.org.present.get('pendingCapture'),
    isDirty: state.org.present.get('isDirty'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    syncBackend: bindActionCreators(syncBackendActions, dispatch),
    org: bindActionCreators(orgActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Entry)
);
