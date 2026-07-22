// ⚠️ This CACHE_NAME is automatically replaced with a unique build timestamp
//    by the stampServiceWorker Vite plugin on every `npm run build`.
//    DO NOT manually edit the version string — it will be overwritten.
const CACHE_NAME = 'attendance-logger-cache-v1784731134334'

// 1. Cache the app shell on install for offline fallback
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/attendance_logger/',
        '/attendance_logger/index.html',
      ])
    })
  )
})

// 2. Clear out ALL old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// 3. Network-First with Cache Fallback
//    - Always tries to fetch fresh from network
//    - Falls back to cache if offline
//    - Caches successful responses for offline use
self.addEventListener('fetch', (event) => {
  // Only handle GET requests (skip POST, etc.)
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((networkResponse) => {
        // Cache a clone of the fresh response
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
        }
        return networkResponse
      })
      .catch(() => {
        // Network failed → serve from cache
        return caches.match(event.request)
      })
  )
})