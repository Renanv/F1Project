const CACHE_VERSION = 'v1.0.5'; // Increment this with each app update that needs cache busting
const CURRENT_CACHE_NAME = `f1project-cache-${CACHE_VERSION}`;

// Add main application shell files here.
// Hashed assets (like main.js, main.css) are typically handled by the browser cache
// once index.html requests them with their new hashed names.
// So, index.html and manifest.json are key for the app shell.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Consider adding essential icons if they are not referenced with hashes
  // and you want them available offline immediately.
  '/android-chrome-192x192.png', // Adjusted to match existing files
  '/android-chrome-512x512.png', // Adjusted to match existing files
  '/logo.svg' // Assuming this is a static file in public/
  // Remove specific asset paths like '/static/js/bundle.js' unless you are NOT using hashed filenames from CRA.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CURRENT_CACHE_NAME)
      .then((cache) => {
        console.log(`[Service Worker] Opened cache: ${CURRENT_CACHE_NAME}`);
        // Use { cache: 'reload' } to ensure fresh copies are fetched from the network during install
        // for these specific app shell URLs.
        const requests = urlsToCache.map(url => new Request(url, { cache: 'reload' }));
        return cache.addAll(requests);
      })
      .then(() => {
        console.log('[Service Worker] App shell cached');
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any caches that are not the current one
          // and belong to this app (prefixed with 'f1project-cache-')
          if (cacheName.startsWith('f1project-cache-') && cacheName !== CURRENT_CACHE_NAME) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activated and old caches cleaned.');
      // Tell the active service worker to take control of the page immediately.
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy: Network first for navigation requests (HTML pages)
  // to ensure users get the latest app version if online.
  if (event.request.mode === 'navigate' || 
      (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If a valid response is received from network, cache it and return it
          if (response && response.ok) {
            const responseToCache = response.clone();
            caches.open(CURRENT_CACHE_NAME)
              .then(cache => {
                // Cache the new HTML page.
                // Be careful if you have query parameters that shouldn't vary the cache,
                // or if some HTML pages should not be cached.
                if (event.request.method === 'GET') { // Only cache GET requests
                    cache.put(event.request, responseToCache);
                }
              });
            return response;
          }
          // If network fetch fails (e.g. offline) or returns an error, try to serve from cache as a fallback.
          // This is important for offline functionality.
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If nothing in cache and network failed, you might want a generic offline page.
              // For now, let it fail as the browser would normally.
              // return caches.match('/offline.html'); // Example
              // If response was not ok and not in cache, return original non-ok response
              return response || new Response("Network error and not in cache", { status: 500, statusText: "Network error and not in cache" });

            });
        })
        .catch(() => {
          // Network totally failed (e.g., offline), try cache.
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Optional: return a generic offline fallback page
              // if (!url.pathname.startsWith('/api/')) { // Don't show offline page for API calls
              //   return caches.match('/offline.html');
              // }
              // Let the browser handle the error for non-HTML assets or if no offline page
              return new Response("Offline and not in cache", { status: 503, statusText: "Offline and not in cache" });
            });
        })
    );
    return;
  }

  // Strategy: Network ONLY for API calls (paths starting with /api/)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.error('[Service Worker] API fetch error:', event.request.url, error);
          // For API calls, if the network fails, we don't want to return a generic HTML offline page.
          // Instead, let the frontend handle the API error (e.g., show a specific error message).
          // Returning a specific error response allows the frontend to distinguish this.
          return new Response(JSON.stringify({ success: false, message: 'API request failed in service worker', error: error.message }), {
            status: 503, // Service Unavailable or a more specific error
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Strategy: Cache first, then network for other static assets (JS, CSS, images etc. not covered by navigation)
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            // For non-HTML, non-navigation, non-API requests, we might still want to cache them if they are successful GETs
            if (event.request.method === 'GET') { 
              const responseToCache = networkResponse.clone();
              caches.open(CURRENT_CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
          }
          return networkResponse;
        }).catch(error => {
          console.warn('[Service Worker] Static asset fetch failed, returning error response:', event.request.url, error);
          // Provide a generic error response or let the browser handle it
          return new Response(JSON.stringify({ error: 'Service Worker static asset fetch failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
  );
}); 