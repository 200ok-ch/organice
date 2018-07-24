import React, { Component } from 'react';

import logo from './org-web.svg';

import './Entry.css';

export default class Entry extends Component {
  render() {
    return (
      <div>
        <div className="entry-header-bar">
          <img className="entry-header-bar__logo" src={logo} alt="Logo" width="45" height="45" />
          <h2 className="entry-header-bar__title">org-web</h2>
        </div>

        <br />
        <br />
        Entry
      </div>
    );
  }
}
