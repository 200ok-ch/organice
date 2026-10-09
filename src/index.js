/* global module, process */

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './fontawesome.css';
import App from './App';
import { readCachedFiles } from './util/file_persister';

const rootElement = document.getElementById('root');

// Local copies of Org files are read from IndexedDB, which is
// asynchronous. Render only once they are loaded: otherwise startup
// syncs and downloads could run before local copies with unsynced edits
// are known, and overwrite them.
// Never keep the app from starting: if reading takes too long, start
// without local copies. A local copy with unsynced edits is then loaded
// when its file is first synced or opened (`restoreUnsyncedLocalCopy`),
// before anything is downloaded.
const READ_CACHED_FILES_TIMEOUT_MS = 15000;
let readTimeout;
const cachedFilesPromise = Promise.race([
  readCachedFiles(),
  new Promise((resolve) => {
    readTimeout = setTimeout(() => {
      console.warn('Reading local file copies timed out');
      resolve({ files: [], fileStoreAvailable: true });
    }, READ_CACHED_FILES_TIMEOUT_MS);
  }),
])
  .finally(() => clearTimeout(readTimeout))
  .catch((error) => {
    console.error('Could not read local file copies', error);
    return { files: [], fileStoreAvailable: false };
  });

function render() {
  cachedFilesPromise.then(({ files, fileStoreAvailable }) => {
    ReactDOM.render(
      <App cachedFiles={files} fileStoreAvailable={fileStoreAvailable} />,
      rootElement
    );
  });
}

render();

// The service worker caches the app, so that it also starts offline.
// Not in development: it would serve stale bundles.
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .register(new URL('../public/service-worker.js', import.meta.url), { type: 'module' })
    .catch((error) => console.warn('Could not register the service worker', error));
}

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
