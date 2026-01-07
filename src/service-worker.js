import { manifest, version } from '@parcel/service-worker';

addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(version).then((cache) => cache.addAll(manifest))
  );
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

addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
