import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import logo from './org-web.svg';

import './HeaderBar.css';

import * as baseActions from '../../actions/base';

import _ from 'lodash';

class HeaderBar extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleSettingsClick']);
  }

  handleSettingsClick() {
    const { isShowingSettingsPage } = this.props;

    if (isShowingSettingsPage) {
      this.props.base.hideSettingsPage();
    } else {
      this.props.base.showSettingsPage();
    }
  }

  render() {
    // TODO: "whats new" button

    const { onSignInClick, isAuthenticated } = this.props;

    return (
      <div className="header-bar">
        <img className="header-bar__logo" src={logo} alt="Logo" width="45" height="45" />
        <h2 className="header-bar__title">org-web</h2>

        <div className="header-bar__actions">
          {!isAuthenticated && <div className="header-bar__actions__item" onClick={onSignInClick}>Sign in</div>}

          <a href="https://github.com/DanielDe/org-web" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-github header-bar__actions__item" />
          </a>

          {isAuthenticated && (
            <i className="fas fa-cogs header-bar__actions__item" onClick={this.handleSettingsClick} />
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    isAuthenticated: !!state.dropbox.get('accessToken'),
    isShowingSettingsPage: state.base.get('isShowingSettingsPage'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(HeaderBar);
