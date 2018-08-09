import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Link, withRouter } from 'react-router-dom';

import logo from './org-web.svg';

import './HeaderBar.css';

import * as baseActions from '../../actions/base';

import _ from 'lodash';
import classNames from 'classnames';

import goBackOrToRoot from '../../util/go_back_or_to_root';

class HeaderBar extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleSettingsWhatsNewClose']);
  }

  handleSettingsWhatsNewClose() {
    goBackOrToRoot(this.props.history);
  }

  renderFileBrowserBackButton() {
    const { location: { pathname } } = this.props;

    let directoryPath = pathname.substr('/files'.length);
    if (directoryPath.endsWith('/')) {
      directoryPath = directoryPath.substring(0, directoryPath.length - 1);
    }

    if (directoryPath === '') {
      return null;
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

  renderBackButton() {
    const { location: { pathname } } = this.props;

    if (pathname.startsWith('/files')) {
      return this.renderFileBrowserBackButton();
    } else if (pathname.startsWith('/file')) {
      return this.renderOrgFileBackButton();
    }

    return null;
  }

  render() {
    const {
      onSignInClick,
      isAuthenticated,
      hasUnseenWhatsNew,
      location: { pathname },
    } = this.props;

    const isWhatsNewPageActive = pathname === '/whats_new';
    const isSettingsPageActive = pathname === '/settings';

    const whatsNewClassName = classNames('fas fa-gift header-bar__actions__item', {
      'whats-new-icon--has-unseen': hasUnseenWhatsNew,
    });

    return (
      <div className="header-bar">
        {isAuthenticated ? (
          this.renderBackButton()
        ) : (
          <Fragment>
            <img className="header-bar__logo" src={logo} alt="Logo" width="45" height="45" />
            <h2 className="header-bar__title">org-web</h2>
          </Fragment>
        )}

        <div className="header-bar__actions">
          {!isAuthenticated && <div className="header-bar__actions__item" onClick={onSignInClick}>Sign in</div>}

          {isWhatsNewPageActive ? (
            <i className={whatsNewClassName} onClick={this.handleSettingsWhatsNewClose} />
          ) : (
            <Link to="/whats_new">
              <i className={whatsNewClassName} />
            </Link>
          )}

          <a href="https://github.com/DanielDe/org-web" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-github header-bar__actions__item" />
          </a>

          {isAuthenticated && (
            isSettingsPageActive ? (
              <i className="fas fa-cogs header-bar__actions__item" onClick={this.handleSettingsWhatsNewClose} />
            ) : (
              <Link to="/settings">
                <i className="fas fa-cogs header-bar__actions__item" />
              </Link>
            )
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    isAuthenticated: !!state.dropbox.get('accessToken'),
    hasUnseenWhatsNew: state.base.get('hasUnseenWhatsNew'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(HeaderBar));
