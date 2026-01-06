import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');

function render() {
  ReactDOM.render(<App />, rootElement);
}

render();

// Enable Hot Module Replacement (full reload for ES modules)
if (module.hot) {
  module.hot.accept();
}
