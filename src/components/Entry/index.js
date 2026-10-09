import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Route, Switch, Redirect, withRouter } from 'react-router-dom';

import './stylesheet.css';

import { List, Set } from 'immutable';
import _ from 'lodash';
import classNames from 'classnames';

import { changelogHash, STATIC_FILE_PREFIX } from '../../lib/org_utils';
import PrivacyPolicy from '../PrivacyPolicy';
import HeaderBar from '../HeaderBar';
import FileBrowser from '../FileBrowser';
import LoadingIndicator from '../LoadingIndicator';
import OrgFile from '../OrgFile';
import Settings from '../Settings';
import KeyboardShortcutsEditor from '../KeyboardShortcutsEditor';
import CaptureTemplatesEditor from '../CaptureTemplatesEditor';
import FileSettingsEditor from '../FileSettingsEditor';

import * as syncBackendActions from '../../actions/sync_backend';
import * as orgActions from '../../actions/org';
import * as baseActions from '../../actions/base';
import { loadTheme } from '../../lib/color';

class Entry extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'renderChangelogFile',
      'renderSampleFile',
      'renderFileBrowser',
      'renderFile',
      'setChangelogUnseenChanges',
    ]);
  }

  componentDidMount() {
    this.setChangelogUnseenChanges();
    this.props.filesToLoad.forEach((path) => this.props.syncBackend.downloadFile(path));
    this.props.filesToSync.forEach((path) => this.props.org.sync({ path }));
  }

  // TODO: Should this maybe done on init of the application and not in the component?
  setChangelogUnseenChanges() {
    const { lastSeenChangelogHash, isAuthenticated } = this.props;
    changelogHash().then((changelogHash) => {
      const hasChanged =
        isAuthenticated &&
        lastSeenChangelogHash &&
        !_.isEqual(changelogHash, lastSeenChangelogHash);

      this.props.base.setHasUnseenChangelog(hasChanged);
    });
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
      <OrgFile
        staticFile="changelog"
        shouldDisableDirtyIndicator={true}
        shouldDisableActions={true}
        shouldDisableSyncButtons={false}
        parsingErrorMessage={
          "The contents of changelog.org couldn't be loaded. You probably forgot to set the environment variable - see the Development section of README.org for details!"
        }
      />
    );
  }

  renderSampleFile() {
    return (
      <OrgFile
        staticFile="sample"
        shouldDisableDirtyIndicator={true}
        shouldDisableActionDrawer={false}
        shouldDisableSyncButtons={true}
        parsingErrorMessage={
          "The contents of sample.org couldn't be loaded. You probably forgot to set the environment variable - see the Development section of README.org for details!"
        }
      />
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

    return <FileBrowser path={path} />;
  }

  renderFile({
    match: {
      params: { path },
    },
  }) {
    if (!!path) {
      path = '/' + path;
    }
    if (
      this.props.path &&
      !this.props.path.startsWith(STATIC_FILE_PREFIX) &&
      this.props.path !== path
    ) {
      this.props.org.sync({ path: this.props.path });
      return <Redirect push to={'/file' + this.props.path} />;
    } else {
      return (
        <OrgFile
          path={path}
          shouldDisableDirtyIndicator={false}
          shouldDisableActionDrawer={false}
          shouldDisableSyncButtons={false}
        />
      );
    }
  }

  shouldPromptWhenLeaving() {
    return this.props.hasDirtyFiles;
  }

  render() {
    const {
      isAuthenticated,
      loadingMessage,
      fontSize,
      activeModalPage,
      pendingCapture,
      location: { pathname },
      colorScheme,
      theme,
      defaultFilePath,
    } = this.props;

    loadTheme(theme, colorScheme);

    const pendingCapturePath = !!pendingCapture && `/file${pendingCapture.get('capturePath')}`;
    const shouldRedirectToCapturePath = pendingCapturePath && pendingCapturePath !== pathname;

    const className = classNames('App entry-container', {
      'entry-container--large-font': fontSize === 'Large',
    });

    return (
      <div className={className}>
        <HeaderBar />
        <LoadingIndicator message={loadingMessage} />

        {isAuthenticated &&
          ([
            'changelog',
            'keyboard_shortcuts_editor',
            'settings',
            'capture_templates_editor',
            'file_settings_editor',
            'sample',
          ].includes(activeModalPage) ? (
            <Fragment>
              {activeModalPage === 'keyboard_shortcuts_editor' && <KeyboardShortcutsEditor />}
              {activeModalPage === 'capture_templates_editor' && <CaptureTemplatesEditor />}
              {activeModalPage === 'file_settings_editor' && <FileSettingsEditor />}
              {activeModalPage === 'changelog' && this.renderChangelogFile()}
              {activeModalPage === 'sample' && this.renderSampleFile()}
            </Fragment>
          ) : (
            <Switch>
              {shouldRedirectToCapturePath && <Redirect to={pendingCapturePath} />}
              <Route path="/privacy-policy" exact component={PrivacyPolicy} />
              <Route path="/file/:path+" render={this.renderFile} />
              <Route path="/files/:path*" render={this.renderFileBrowser} />
              <Route path="/sample" exact={true} render={this.renderSampleFile} />
              <Route path="/changelog" exact={true} render={this.renderChangelogFile} />
              <Route path="/settings" exact={true}>
                <Settings />
              </Route>
              {defaultFilePath ? <Redirect to={defaultFilePath} /> : <Redirect to="/files" />}
            </Switch>
          ))}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const files = state.org.present.get('files');
  const path = state.org.present.get('path');
  const defaultFilePath = state.org.present
    .get('fileSettings')
    .filter((setting) => setting.get('defaultOnStartup'))
    .map((setting) => `file${setting.get('path')}`)
    .first();
  const filesToLoadOnStartup = state.org.present
    .get('fileSettings')
    .filter((setting) => setting.get('loadOnStartup'))
    .map((setting) => setting.get('path'));
  const loadedFiles = Set.fromKeys(files);
  const fileIsLoaded = (path) => loadedFiles.includes(path);
  const filesToLoad = filesToLoadOnStartup.filter((path) => !fileIsLoaded(path));
  const filesToSync = filesToLoadOnStartup.filter((path) => fileIsLoaded(path));
  const hasDirtyFiles = !!files.find((file) => file.get('isDirty'));
  return {
    path,
    filesToLoad,
    filesToSync,
    defaultFilePath,
    loadingMessage: state.base.get('loadingMessage'),
    isAuthenticated: state.syncBackend.get('isAuthenticated'),
    fontSize: state.base.get('fontSize'),
    lastSeenChangelogHash: state.base.get('lastSeenChangelogHash'),
    activeModalPage: state.base.get('modalPageStack', List()).last(),
    pendingCapture: state.org.present.get('pendingCapture'),
    hasDirtyFiles,
    colorScheme: state.base.get('colorScheme'),
    theme: state.base.get('theme'),
    osColorSchemeChangeCount: state.base.get('osColorSchemeChangeCount'),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    syncBackend: bindActionCreators(syncBackendActions, dispatch),
    org: bindActionCreators(orgActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Entry));
