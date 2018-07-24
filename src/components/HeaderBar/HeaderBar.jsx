import React, { Component } from 'react';
import { connect } from 'react-redux';

import logo from './org-web.svg';

import './HeaderBar.css';

class HeaderBar extends Component {
  render() {
    // TODO: sign in button
    // TODO: "whats new" button
    // TODO: settings button

    return (
      <div className="header-bar">
        <img className="header-bar__logo" src={logo} alt="Logo" width="45" height="45" />
        <h2 className="header-bar__title">org-web</h2>

        <div className="header-bar__actions">
          <a href="https://github.com/DanielDe/org-web" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-github header-bar__icon" />
          </a>
        </div>

        <span style={{color: 'white'}}>The value of a is {this.props.a}</span>
        <button onClick={() => this.props.someAction()}>Press me!</button>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    a: state.auth.get('a'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    someAction: () => dispatch({type: 'test1', value: 2}),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(HeaderBar);
