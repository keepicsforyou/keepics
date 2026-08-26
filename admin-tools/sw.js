const CACHE_NAME = 'admin-tools-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  '../styles/styles.css',
  '../styles/optimizations.css',
  '../assets/image/website/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});