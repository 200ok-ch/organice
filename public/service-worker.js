/* global clients */

import { manifest, version } from '@parcel/service-worker';

addEventListener('install', (event) => {
  self.skipWaiting();
  // The manifest can list a file twice, and `addAll` rejects duplicates.
  event.waitUntil(caches.open(version).then((cache) => cache.addAll([...new Set(manifest)])));
});

addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== version) {
              return caches.delete(key);
            }
          })
        );
      }),
    ])
  );
});

// Every route (`/`, `/files/...`, `/file/...`) is served by the same
// `index.html`. Fetch it from the network to get new deploys right away,
// and fall back to the cached copy when offline.
const handleNavigation = (request) =>
  fetch(request).catch(() =>
    caches
      .match(request)
      .then((response) => response || caches.match(new URL('index.html', self.location).href))
  );

addEventListener('fetch', (event) => {
  const { request } = event;
  // Requests to sync back-ends (Dropbox, WebDAV, GitLab) are not cached.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  // Bundle names contain a content hash, so cached bundles never go stale.
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});

addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
