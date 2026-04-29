/**
 * Service Worker for Romanian Pension Calculator PWA
 *
 * Features:
 * - Cache-first strategy for static assets (JS, CSS, images, fonts)
 * - Network-first strategy for navigation requests
 * - Offline fallback page
 * - Background sync for data persistence
 * - Cache versioning and cleanup
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `pension-calc-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `pension-calc-dynamic-${CACHE_VERSION}`;
const OFFLINE_CACHE = `pension-calc-offline-${CACHE_VERSION}`;

// Base path for GitHub Pages deployment
const BASE_PATH = '/calculator-pensie/';

// Static assets to pre-cache during install
const PRECACHE_ASSETS = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}icons/icon-192x192.svg`,
  `${BASE_PATH}icons/icon-512x512.svg`,
];

// Background sync tag
const SYNC_TAG = 'pension-data-sync';

/**
 * Install event - pre-cache essential assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Pre-cache failed:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old version caches
              return name.startsWith('pension-calc-') &&
                     name !== STATIC_CACHE &&
                     name !== DYNAMIC_CACHE &&
                     name !== OFFLINE_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

/**
 * Determine the caching strategy based on the request
 */
function getCacheStrategy(request) {
  const url = new URL(request.url);

  // Navigation requests - network first with cache fallback
  if (request.mode === 'navigate') {
    return 'network-first';
  }

  // Static assets (JS, CSS, images) - cache first
  if (
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)$/) ||
    url.pathname.includes('/assets/')
  ) {
    return 'cache-first';
  }

  // API calls or other requests - network first
  return 'network-first';
}

/**
 * Cache-first strategy: Try cache, fall back to network
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network-first strategy: Try network, fall back to cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // For navigation requests, return the cached index page for offline support
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match(`${BASE_PATH}index.html`);
      if (offlinePage) {
        return offlinePage;
      }
    }

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Fetch event handler - route requests through appropriate strategy
 */
self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const strategy = getCacheStrategy(event.request);

  if (strategy === 'cache-first') {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(networkFirst(event.request));
  }
});

/**
 * Background sync event handler
 * Processes queued data sync operations when connectivity is restored
 */
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncPendingData());
  }
});

/**
 * Process pending data sync operations
 */
async function syncPendingData() {
  try {
    // Get all clients and notify them to save their data
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now(),
      });
    });
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    throw error; // Re-throw to retry sync
  }
}

/**
 * Message handler for communication with the app
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }

  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      }).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ cleared: true });
        }
      })
    );
  }
});

/**
 * Periodic background sync for keeping cache fresh
 * (requires browser support for periodicSync)
 */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});

/**
 * Update cached assets
 */
async function updateCache() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(PRECACHE_ASSETS);
    console.log('[SW] Cache updated via periodic sync');
  } catch (error) {
    console.error('[SW] Cache update failed:', error);
  }
}
