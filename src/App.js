import React, { PureComponent } from 'react';
import { Provider } from 'react-redux';
import Store from './store';
import { readInitialState, loadSettingsFromConfigFile, subscribeToChanges } from './util/settings_persister';
import { BrowserRouter as Router } from 'react-router-dom';

import './App.css';
import './base.css';

import Entry from './components/Entry';

class App extends PureComponent {
  constructor(props) {
    super(props);

    this.store = Store(readInitialState());
    this.store.subscribe(subscribeToChanges(this.store));

    loadSettingsFromConfigFile(this.store);
  }

  render() {
    return (
      <Router>
        <Provider store={this.store}>
          <div className="App">
            <Entry />
          </div>
        </Provider>
      </Router>
    );
  }
}

export default App;
