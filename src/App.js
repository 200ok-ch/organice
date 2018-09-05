import React, { PureComponent } from 'react';
import { Provider } from 'react-redux';
import Store from './store';
import { readInitialState, loadSettingsFromConfigFile, subscribeToChanges } from './util/settings_persister';
import { BrowserRouter as Router } from 'react-router-dom';

import { DragDropContext } from 'react-beautiful-dnd';

import { reorderCaptureTemplate } from './actions/capture';
import { reorderTags } from './actions/org';

import './App.css';
import './base.css';

import Entry from './components/Entry';

import _ from 'lodash';

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.store = Store(readInitialState());
    this.store.subscribe(subscribeToChanges(this.store));

    loadSettingsFromConfigFile(this.store);

    _.bindAll(this, ['handleDragEnd']);
  }

  handleDragEnd(result) {
    if (result.type === 'CAPTURE-TEMPLATE') {
      this.store.dispatch(reorderCaptureTemplate(result.source.index, result.destination.index));
    } else if (result.type === 'TAG') {
      this.store.dispatch(reorderTags(result.source.index, result.destination.index));
    }
  }

  render() {
    return (
      <DragDropContext onDragEnd={this.handleDragEnd}>
        <Router>
          <Provider store={this.store}>
            <div className="App">
              <Entry />
            </div>
          </Provider>
        </Router>
      </DragDropContext>
    );
  }
}
