import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Link, withRouter } from 'react-router-dom';

import logo from './org-web.svg';

import './HeaderBar.css';

import * as baseActions from '../../actions/base';
import { ActionCreators as undoActions } from 'redux-linear-undo';

import { List } from 'immutable';
import _ from 'lodash';
import classNames from 'classnames';

class HeaderBar extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleChangelogClick',
      'handleSettingsClick',
      'handleModalPageDoneClick',
      'handleSettingsSubPageBackClick',
      'handleUndoClick',
    ]);
  }

  getPathRoot() {
    const { location: { pathname } } = this.props;
    return pathname.split('/')[1];
  }

  renderFileBrowserBackButton() {
    const { location: { pathname } } = this.props;

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
    const { location: { pathname } } = this.props;

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
        <h2 className="header-bar__app-name">org-web</h2>
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

  handleSettingsSubPageBackClick() {
    this.props.base.pushModalPage('settings');
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
      return <div />;
    case 'keyboard_shortcuts_editor':
      return this.renderSettingsSubPageBackButton();
    case 'capture_templates_editor':
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
    default:
      return <div />;
    }
  }

  renderTitle() {
    const titleContainerWithText = text => <div className="header-bar__title">{text}</div>;

    switch (this.props.activeModalPage) {
    case 'changelog':
      return titleContainerWithText('Changelog');
    case 'settings':
      return titleContainerWithText('Settings');
    case 'keyboard_shortcuts_editor':
      return titleContainerWithText('Shortcuts');
    case 'capture_templates_editor':
      return titleContainerWithText('Capture');
    default:
    }

    switch (this.getPathRoot()) {
    case 'sample':
      return titleContainerWithText('Sample');
    default:
    }

    return titleContainerWithText('');
  }

  handleChangelogClick() {
    this.props.base.pushModalPage('changelog');
  }

  handleSettingsClick() {
    this.props.base.pushModalPage('settings');
  }

  handleModalPageDoneClick() {
    this.props.base.popModalPage();
  }

  handleUndoClick() {
    if (this.props.isUndoEnabled) {
      this.props.undo.undo();
    }
  }

  renderActions() {
    const {
      isAuthenticated,
      onSignInClick,
      hasUnseenChangelog,
      activeModalPage,
      path,
      isUndoEnabled,
    } = this.props;

    if (!!activeModalPage) {
      return (
        <div className="header-bar__actions" onClick={this.handleModalPageDoneClick}>
          Done
        </div>
      );
    } else {
      const undoIconClassName = classNames('fas fa-undo header-bar__actions__item', {
        'header-bar__actions__item--disabled': !isUndoEnabled
      });

      const settingsIconClassName = classNames('fas fa-cogs header-bar__actions__item', {
        'settings-icon--has-unseen-changelog': hasUnseenChangelog,
      });

      switch (this.getPathRoot()) {
      default:
        return (
          <div className="header-bar__actions">
            {!isAuthenticated && <div className="header-bar__actions__item" onClick={onSignInClick}>Sign in</div>}

            {!isAuthenticated && (
              <a href="https://github.com/DanielDe/org-web" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-github header-bar__actions__item" />
              </a>
            )}

            {(isAuthenticated && !activeModalPage && !!path) && (
              <i className={undoIconClassName} onClick={this.handleUndoClick} />
            )}

            {isAuthenticated && (
              <i className={settingsIconClassName} onClick={this.handleSettingsClick} />
            )}
          </div>
        );
      }
    }
  }

  render() {
    return (
      <div className="header-bar">
        {this.renderBackButton()}
        {this.renderTitle()}
        {this.renderActions()}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    isAuthenticated: !!state.dropbox.get('accessToken'),
    hasUnseenChangelog: state.base.get('hasUnseenChangelog'),
    activeModalPage: state.base.get('modalPageStack', List()).last(),
    path: state.org.present.get('path'),
    isUndoEnabled: state.org.past.length > 1,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    base: bindActionCreators(baseActions, dispatch),
    undo: bindActionCreators(undoActions, dispatch),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(HeaderBar));
