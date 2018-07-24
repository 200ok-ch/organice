import React, { Component } from 'react';

import logo from './org-web.svg';

import './HeaderBar.css';

export default class HeaderBar extends Component {
  render() {
    // TODO: sign in button
    // TODO: "whats new" button
    // TODO: settings button

    return (
      <div className="header-bar">
        <img className="header-bar__logo" src={logo} alt="Logo" width="45" height="45" />
        <h2 className="header-bar__title">org-web</h2>

        <div className="header-bar__actions">
          <a href="https://github.com/DanielDe/org-web" target="_blank">
            <i className="fab fa-github header-bar__icon" />
          </a>
        </div>
      </div>
    );
  }
}
