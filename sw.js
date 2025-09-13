
const CACHE_NAME = 'fishing-encyclopedia-cache-v1';
// This list is intentionally minimal.
// We are not caching external resources from cdns or esm.sh
// The browser's HTTP cache is generally sufficient for those.
const urlsToCache = [
  '/',
  '/index.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only handle navigation requests for the app shell.
  // Other requests for assets, images, API calls, etc., will pass through to the network.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Cache hit - return response
          if (response) {
            return response;
          }
          
          // Not in cache, go to the network.
          // We don't cache the response here to keep it simple,
          // allowing for easy updates by just refreshing.
          return fetch(event.request);
        }
      )
    );
  }
});
