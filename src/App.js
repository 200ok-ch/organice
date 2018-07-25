import React, { Component } from 'react';
import { Provider } from 'react-redux';
import Store from './store';

import './App.css';
import './base.css';

import Entry from './components/Entry/Entry';

class App extends Component {
  constructor(props) {
    super(props);

    this.store = Store();
  }

  render() {
    return (
      <Provider store={this.store}>
        <div className="App">
          <Entry />
        </div>
      </Provider>
    );
  }
}

export default App;
