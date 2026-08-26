const CACHE_NAME = 'keepics-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/order.html',
  '/features.html',
  '/services.html',
  '/about.html',
  '/feedback.html',
  '/game.html',
  '/login.html',
  '/photobooth.html',
  '/promo.html',
  '/public-chat.html',
  '/rating-wall.html',
  '/scratch.html',
  '/shop.html',
  '/manifest.json',
  '/styles/card.css',
  '/styles/styles.css',
  "/styles/fontstyles/mac's Minecraft.ttf",
  '/styles/fontstyles/Minecraft.ttf',
  '/assets/database/firebase-config.js',
  '/assets/image/member-profile/cg.jpg',
  '/assets/image/member-profile/cnt.jpg',
  '/assets/image/member-profile/dd.jpg',
  '/assets/image/member-profile/jdd.jpg',
  '/assets/image/member-profile/jnl.jpg',
  '/assets/image/member-profile/jra.jpg',
  '/assets/image/member-profile/mas.jpg',
  '/assets/image/member-profile/nt.jpg',
  '/assets/image/member-profile/pd.png',
  '/assets/image/member-profile/ps.jpg',
  '/assets/image/member-profile/psm.jpg',
  '/assets/image/member-profile/sab.jpg',
  '/assets/image/shop_assets/2VOUCHER.png',
  '/assets/image/shop_assets/3VOUCHER.png',
  '/assets/image/shop_assets/4VOUCHER.png',
  '/assets/image/shop_assets/5VOUCHER.png',
  '/assets/image/shop_assets/6VOUCHER.png',
  '/assets/image/shop_assets/MEMESTICKER.Png',
  '/assets/image/website/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
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

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
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