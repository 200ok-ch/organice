import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Link, withRouter } from 'react-router-dom';

import logo from '../../images/organice.svg';

import './stylesheet.css';

import * as baseActions from '../../actions/base';
import * as orgActions from '../../actions/org';
import { ActionCreators as undoActions } from 'redux-undo';

import { List } from 'immutable';
import _ from 'lodash';
import classNames from 'classnames';

class HeaderBar extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleChangelogClick',
      'handleModalPageDoneClick',
      'handleHeaderBarTitleClick',
      'handleSettingsSubPageBackClick',
      'handleUndoClick',
      'handleRedoClick',
      'handleHelpClick',
    ]);
  }

  getPathRoot() {
    const {
      location: { pathname },
    } = this.props;
    return pathname.split('/')[1];
  }

  getFilename() {
    const {
      location: { pathname },
    } = this.props;
    // only show a filename if it's a file and not a path
    if (pathname.includes('.org')) {
      return pathname.substring(pathname.lastIndexOf('/') + 1, pathname.lastIndexOf('.'));
    } else {
      return '';
    }
  }

  renderFileBrowserBackButton() {
    const {
      location: { pathname },
      syncBackendType,
    } = this.props;
    if (syncBackendType === 'Google Drive') {
      return <div />;
    }

    let directoryPath = pathname.substr('/files'.length);
    if (directoryPath.endsWith('/')) {
      directoryPath = directoryPath.substring(0, directoryPath.length - 1);
    }

    if (directoryPath === '') {
      return <div />;
    } else {
      const pathParts = directoryPath.split('/');
      const parentDirectoryName = pathParts[pathParts.length - 2];
      const parentPath = pathParts.slice(0, pathParts.length - 1).join('/');

      return (
        <Link to={`/files${parentPath}`} className="header-bar__back-button">
          <i className="fas fa-chevron-left" />
          <span className="header-bar__back-button__directory-path">{parentDirectoryName}/</span>
        </Link>
      );
    }
  }

  renderOrgFileBackButton() {
    const {
      location: { pathname },
    } = this.props;

    let filePath = pathname.substr('/file'.length);
    if (filePath.endsWith('/')) {
      filePath = filePath.substring(0, filePath.length - 1);
    }

    const pathParts = filePath.split('/');
    const directoryPath = pathParts.slice(0, pathParts.length - 1).join('/');

    return (
      <Link to={`/files${directoryPath}`} className="header-bar__back-button">
        <i className="fas fa-chevron-left" />
        <span className="header-bar__back-button__directory-path">File browser</span>
      </Link>
    );
  }

  renderLogo() {
    return (
      <div className="header-bar__logo-container">
        <img className="header-bar__logo" src={logo} alt="Logo" width="30" height="30" />
        <h2 className="header-bar__app-name">organice</h2>
      </div>
    );
  }

  renderSampleFileBackButton() {
    return (
      <Link to={`/`} className="header-bar__back-button">
        <i className="fas fa-chevron-left" />
        <span className="header-bar__back-button__directory-path">Home</span>
      </Link>
    );
  }

  renderSignInBackButton() {
    return (
      <Link to={`/`} className="header-bar__back-button">
        <i className="fas fa-chevron-left" />
        <span className="header-bar__back-button__directory-path">Home</span>
      </Link>
    );
  }

  handleSettingsSubPageBackClick() {
    this.props.base.popModalPage();
  }

  renderSettingsSubPageBackButton() {
    return (
      <div className="header-bar__back-button" onClick={this.handleSettingsSubPageBackClick}>
        <i className="fas fa-chevron-left" />
        <span className="header-bar__back-button__directory-path">Settings</span>
      </div>
    );
  }

  renderBackButton() {
    const { activeModalPage } = this.props;

    switch (activeModalPage) {
      case 'changelog':
        return this.renderSettingsSubPageBackButton();
      case 'keyboard_shortcuts_editor':
        return this.renderSettingsSubPageBackButton();
      case 'capture_templates_editor':
        return this.renderSettingsSubPageBackButton();
      case 'sample':
        return this.renderSettingsSubPageBackButton();
      case 'settings':
        return <div />;
      default:
    }

    switch (this.getPathRoot()) {
      case '':
        return this.renderLogo();
      case 'files':
        return this.renderFileBrowserBackButton();
      case 'file':
        return this.renderOrgFileBackButton();
      case 'sample':
        return this.renderSampleFileBackButton();
      case 'sign_in':
        return this.renderSignInBackButton();
      default:
        return <div />;
    }
  }

  renderTitle() {
    const titleContainerWithText = text => (
      <div className="header-bar__title" onClick={this.handleHeaderBarTitleClick}>
        {text}
      </div>
    );

    switch (this.props.activeModalPage) {
      case 'changelog':
        return titleContainerWithText('Changelog');
      case 'settings':
        return titleContainerWithText('Settings');
      case 'keyboard_shortcuts_editor':
        return titleContainerWithText('Shortcuts');
      case 'capture_templates_editor':
        return titleContainerWithText('Capture');
      case 'sample':
        return titleContainerWithText('Sample');
      default:
    }

    switch (this.getPathRoot()) {
      case 'sample':
        return titleContainerWithText('Sample');
      case 'sign_in':
        return titleContainerWithText('Sign in');
      default:
    }

    return titleContainerWithText(this.props.shouldShowTitleInOrgFile ? this.getFilename() : '');
  }

  handleChangelogClick() {
    this.props.base.pushModalPage('changelog');
  }

  handleModalPageDoneClick() {
    this.props.base.clearModalStack();
  }

  handleHeaderBarTitleClick() {
    this.props.org.selectHeader(null);
  }

  handleUndoClick() {
    if (this.props.isUndoEnabled) {
      this.props.undo.undo();
    }
  }

  handleRedoClick() {
    if (this.props.isRedoEnabled) {
      this.props.undo.redo();
    }
  }

  handleHelpClick() {
    this.props.base.pushModalPage('settings');
    this.props.base.pushModalPage('sample');
  }

  renderActions() {
    const {
      isAuthenticated,
      hasUnseenChangelog,
      activeModalPage,
      path,
      isUndoEnabled,
      isRedoEnabled,
    } = this.props;

    if (!!activeModalPage) {
      return (
        <div className="header-bar__actions" onClick={this.handleModalPageDoneClick}>
          Done
        </div>
      );
    } else {
      const undoIconClassName = classNames('fas fa-undo header-bar__actions__item', {
        'header-bar__actions__item--disabled': !isUndoEnabled,
      });
      const redoIconClassName = classNames('fas fa-redo header-bar__actions__item', {
        'header-bar__actions__item--disabled': !isRedoEnabled,
      });

      const settingsIconClassName = classNames('fas fa-cogs header-bar__actions__item');

      return (
        <div className="header-bar__actions">
          {!isAuthenticated && this.getPathRoot() !== 'sign_in' && (
            <Link to="/sign_in">
              <div className="header-bar__actions__item" title="Sign in">
                Sign in
              </div>
            </Link>
          )}

          {!isAuthenticated && (
            <a
              href="https://github.com/200ok-ch/organice"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-github header-bar__actions__item" />
            </a>
          )}

          {isAuthenticated && !activeModalPage && !!path && (
            <Fragment>
              <i className={undoIconClassName} onClick={this.handleUndoClick} title="Undo" />
              <i className={redoIconClassName} onClick={this.handleRedoClick} title="Redo" />
              <i
                className="fas fa-question-circle header-bar__actions__item"
                onClick={this.handleHelpClick}
                title="Help"
              />
            </Fragment>
          )}

          {isAuthenticated && (
            <div>
              {hasUnseenChangelog && (
                <i className="changelog-icon--has-unseen-changelog header-bar__actions__item fas fa-gift" />
              )}
              <Link to="/settings">
                <i className={settingsIconClassName} title="Settings" />
              </Link>
            </div>
          )}
        </div>
      );
    }
  }

  render() {
    const className = classNames('header-bar', {
      'header-bar--with-logo': this.getPathRoot() === '',
    });

    return (
      <div className={className}>
        {this.renderBackButton()}
        {this.renderTitle()}
        {this.renderActions()}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    isAuthenticated: state.syncBackend.get('isAuthenticated'),
    hasUnseenChangelog: state.base.get('hasUnseenChangelog'),
    activeModalPage: state.base.get('modalPageStack', List()).last(),
    shouldShowTitleInOrgFile: state.base.get('shouldShowTitleInOrgFile'),
    path: state.org.present.get('path'),
    isUndoEnabled: state.org.past.length > 0,
    isRedoEnabled: state.org.future.length > 0,
    syncBackendType: state.syncBackend.get('client') && state.syncBackend.get('client').type,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    base: bindActionCreators(baseActions, dispatch),
    org: bindActionCreators(orgActions, dispatch),
    undo: bindActionCreators(undoActions, dispatch),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(HeaderBar));
