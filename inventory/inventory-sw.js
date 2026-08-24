const CACHE_NAME = 'inventory-management-pwa-v1';
const ASSETS = [
  'inventory.html',
  'inventory.webmanifest',
  '../assets/image/website/logo.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'CHECK_UPDATE') {
    event.source.postMessage({
      action: 'UPDATE_STATUS',
      changedAssets: []
    });
  }
});