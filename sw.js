const CACHE_NAME = 'attendance-logger-cache-v2'

// 1. Skip waiting immediately when installed
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// 2. Clear out all existing caches completely on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)))
    }).then(() => self.clients.claim())
  )
})

// 3. Network-Only Fetch Strategy (Bypass Service Worker Cache + Browser Cache)
self.addEventListener('fetch', (event) => {

  event.respondWith(
    // cache: 'reload' forces the browser to bypass its HTTP cache and fetch fresh from server
    fetch(event.request, { cache: 'reload' })
  )
})