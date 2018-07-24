import React, { Component } from 'react';
import { connect } from 'react-redux';

import logo from './org-web.svg';

import './HeaderBar.css';

class HeaderBar extends Component {
  render() {
    // TODO: sign in button
    // TODO: "whats new" button
    // TODO: settings button

    const { onSignInClick } = this.props;

    return (
      <div className="header-bar">
        <img className="header-bar__logo" src={logo} alt="Logo" width="45" height="45" />
        <h2 className="header-bar__title">org-web</h2>

        <div className="header-bar__actions">
          {/* TODO: show this conditionally */}
          <div className="header-bar__actions__item" onClick={onSignInClick}>Sign in</div>

          <a href="https://github.com/DanielDe/org-web" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-github header-bar__actions__item" />
          </a>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {};
};

const mapDispatchToProps = dispatch => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(HeaderBar);
