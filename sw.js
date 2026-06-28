// Service Worker — MCU Tracker
// Estrategia: network-first con fallback a cache. No hay build step ni hashing
// de assets, así que cache-first dejaría datos stale tras cada commit de data.js.
const CACHE_NAME = 'mcu-tracker-v2';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/data.js',
  '/releases.js',
  '/owner_progress.js',
  '/three-scene.js',
  '/three.module.js',
  '/countdown.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // addAll es atómico: un solo 404 cancelaría todo el precache.
      // allSettled tolera fallos individuales — mejor offline parcial que ninguno.
      .then(cache => Promise.allSettled(PRECACHE_URLS.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Solo cachear respuestas same-origin exitosas (las opacas de Google Fonts pasan directo)
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match('/index.html');
          return Response.error();
        })
      )
  );
});
