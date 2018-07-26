import React, { Component } from 'react';
import { Provider } from 'react-redux';
import Store from './store';
import { readInitialState, subscribeToChanges } from './util/local_storage_persister';

import './App.css';
import './base.css';

import Entry from './components/Entry';

class App extends Component {
  constructor(props) {
    super(props);

    let initialState = readInitialState();
    initialState.dropbox = initialState.dropbox.set('currentFileBrowserDirectoryPath', '');

    this.store = Store(initialState);
    this.store.subscribe(subscribeToChanges(this.store));
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
