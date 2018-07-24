import React, { Component } from 'react';
import { Provider } from 'react-redux';
import Store from '../../store';

import './Entry.css';

import HeaderBar from '../HeaderBar/HeaderBar';

export default class Entry extends Component {
  constructor(props) {
    super(props);

    this.store = Store();
  }

  render() {
    return (
      <Provider store={this.store}>
        <div>
          <HeaderBar />

          <br />
          <br />
          Entry
        </div>
      </Provider>
    );
  }
}
