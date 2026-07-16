const CACHE_NAME = 'attendance-logger-cache-v1'
const APP_SHELL = [
  '/attendance_logger/',
  '/attendance_logger/index.html',
  '/attendance_logger/manifest.webmanifest',
  '/attendance_logger/icon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request)
        .then((networkResponse) => {
          const clonedResponse = networkResponse.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse)
          })

          return networkResponse
        })
        .catch(() => caches.match('/attendance_logger/index.html'))
    }),
  )
})
