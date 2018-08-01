import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Link, withRouter } from 'react-router-dom';

import logo from './org-web.svg';

import './HeaderBar.css';

import * as baseActions from '../../actions/base';

import _ from 'lodash';
import classNames from 'classnames';

class HeaderBar extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleSettingsClose', 'handleWhatsNewClose']);
  }

  handleSettingsClose() {
    this.props.history.goBack();
  }

  handleWhatsNewClose() {
    this.props.history.goBack();
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
        <img className="header-bar__logo" src={logo} alt="Logo" width="45" height="45" />
        <h2 className="header-bar__title">org-web</h2>

        <div className="header-bar__actions">
          {!isAuthenticated && <div className="header-bar__actions__item" onClick={onSignInClick}>Sign in</div>}

          {isWhatsNewPageActive ? (
            <i className={whatsNewClassName} onClick={this.handleWhatsNewClose} />
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
              <i className="fas fa-cogs header-bar__actions__item" onClick={this.handleSettingsClose} />
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
