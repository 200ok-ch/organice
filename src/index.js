import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));

// We register a service worker to serve assets from local cache.

// This lets the app load faster on subsequent visits in production,
// and gives it offline capabilities. However, it also means that
// developers (and users) will only see deployed updates on the "N+1"
// visit to a page, since previously cached resources are updated in
// the background.

// Here's the upstream doc: https://parceljs.org/languages/javascript/#service-workers

navigator.serviceWorker.register(new URL('service-worker.js', import.meta.url), { type: 'module' });
