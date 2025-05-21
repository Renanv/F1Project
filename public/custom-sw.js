const CACHE_NAME = 'f1project-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add paths to your main JS/CSS bundles once you know them (e.g., '/static/js/bundle.js')
  // These filenames should match what's in your public folder or your build output for icons.
  '/android-chrome-192x192.png', // Adjusted path
  '/android-chrome-512x512.png', // Adjusted path
  // Regarding logo.svg: If this is imported from src/, it gets a hashed name and this path won't work.
  // If it's a static file in public/, this path is fine.
  '/logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Use {cache: 'reload'} to ensure fresh copies are fetched during install, bypassing HTTP cache.
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Serve from cache
        }
        // If not in cache, fetch from network. 
        // This version does not add the fetched resource to the cache here.
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 