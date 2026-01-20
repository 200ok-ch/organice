/* global module */

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './fontawesome.css';
import App from './App';

const rootElement = document.getElementById('root');

function render() {
  ReactDOM.render(<App />, rootElement);
}

render();

// Remove Parcel error overlay for e2e testing
// See: https://github.com/parcel-bundler/parcel/issues/9738
// The overlay intercepts pointer events when running e2e tests after jest
if (typeof window !== 'undefined') {
  const removeParcelErrorOverlay = () => {
    const overlay = document.querySelector('parcel-error-overlay');
    if (overlay) {
      overlay.remove();
    }
  };

  // Remove immediately
  removeParcelErrorOverlay();

  // Watch for overlay being added
  const observer = new MutationObserver(() => {
    removeParcelErrorOverlay();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

// Enable Hot Module Replacement (full reload for ES modules)
if (module.hot) {
  module.hot.accept();
}
