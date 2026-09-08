/**
 * Qada PWA Service Worker — Production Grade
 *
 * Cache strategy:
 * - App shell + index.html  → Cache-first (install precache)
 * - /assets/* (Vite JS/CSS) → Cache-first + background update
 * - /data/*.json (Quran)    → Cache-first + background update
 * - /icons/*, /apple-touch-icon.png → Cache-first
 * - Google Fonts            → Cache-first (runtime)
 * - Navigation (/app, /)   → Cache-first (serve cached index.html offline)
 * - External push payload   → handled in push event
 */

const CACHE_NAME = 'qada-v10';
const FONT_CACHE = 'qada-fonts-v2';

// Core app shell — no query strings
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/apple-touch-icon.png',
];

// ==================================================
// INSTALL — Precache app shell
// ==================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll fails atomically; individual failures are caught below
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Failed to precache:', url, err);
          })
        )
      );
    })
  );
  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting();
});

// ==================================================
// ACTIVATE — Clean stale caches
// ==================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== FONT_CACHE)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ==================================================
// FETCH — Smart routing
// ==================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET and browser extension requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // 2. Let browser handle media range requests (video)
  if (request.destination === 'video' || url.pathname.endsWith('.mp4')) {
    return;
  }

  // 3. Google Fonts — cache-first with font cache
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(fontCacheFirst(request));
    return;
  }

  // 4. Navigation requests — serve cached /index.html to support SPA offline
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        if (cached) {
          // Always return cached shell; SPA router handles the rest
          // Background-update for online scenario
          fetch(request)
            .then((networkRes) => {
              if (networkRes && networkRes.status === 200) {
                caches.open(CACHE_NAME).then((c) => c.put('/index.html', networkRes));
              }
            })
            .catch(() => {});
          return cached;
        }
        // Nothing in cache — attempt network
        return fetch(request).catch(() => new Response('Offline', { status: 503 }));
      })
    );
    return;
  }

  // 5. Vite production assets — cache-first with background revalidation
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
    return;
  }

  // 6. Local Quran datasets — cache-first
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
    return;
  }

  // 7. Local icons & manifest — cache-first
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/icon.svg' ||
    url.pathname === '/qada-garden-poster.jpg'
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // 8. Everything else: network-first with cache fallback
  event.respondWith(networkFirstWithFallback(request));
});

// ==================================================
// Helper: Cache-first
// ==================================================
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkRes = await fetch(request);
    if (networkRes && (networkRes.status === 200 || networkRes.type === 'opaque')) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkRes.clone());
    }
    return networkRes;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// ==================================================
// Helper: Stale-while-revalidate
// ==================================================
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((networkRes) => {
      if (networkRes && (networkRes.status === 200 || networkRes.type === 'opaque')) {
        cache.put(request, networkRes.clone());
      }
      return networkRes;
    })
    .catch(() => null);

  return cached || networkPromise || new Response('Offline', { status: 503 });
}

// ==================================================
// Helper: Network-first with cache fallback
// ==================================================
async function networkFirstWithFallback(request) {
  try {
    const networkRes = await fetch(request);
    if (networkRes && (networkRes.status === 200 || networkRes.type === 'opaque')) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkRes.clone());
    }
    return networkRes;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// ==================================================
// Helper: Font cache-first (separate cache)
// ==================================================
async function fontCacheFirst(request) {
  const cache = await caches.open(FONT_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const networkRes = await fetch(request);
    if (networkRes && networkRes.status === 200) {
      cache.put(request, networkRes.clone());
    }
    return networkRes;
  } catch {
    return new Response('', { status: 503 });
  }
}

// ==================================================
// PUSH — Receive Web Push notifications from server
// ==================================================
self.addEventListener('push', (event) => {
  let payload = {
    title: 'قضاء 🤲',
    body: 'تذكير يومي',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'qada-push',
    data: { url: '/app' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192.png',
      badge: payload.badge || '/icons/icon-192.png',
      tag: payload.tag || 'qada-push',
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      data: payload.data || { url: '/app' },
    })
  );
});

// ==================================================
// NOTIFICATION CLICK — Focus or open the app
// ==================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/app';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an existing app window
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          if (
            clientUrl.pathname.startsWith('/app') ||
            clientUrl.pathname === '/'
          ) {
            client.focus();
            if (targetUrl !== '/app') {
              client.navigate(targetUrl);
            }
            return;
          }
        }
        // No existing window — open a new one
        return self.clients.openWindow(targetUrl);
      })
  );
});
