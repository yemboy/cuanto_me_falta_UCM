// Service Worker — MCU Tracker
// Estrategia: network-first con fallback a cache. No hay build step ni hashing
// de assets, así que cache-first dejaría datos stale tras cada commit de data.js.
const CACHE_NAME = 'mcu-tracker-v6';

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './utils.js',
  './progress-codec.js',
  './progress-order.js',
  './data.js',
  './releases.js',
  './owner_progress.js',
  './equivalences.js',
  './three-scene.js',
  './three.module.js',
  './countdown.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './fonts/rajdhani-400.woff2',
  './fonts/rajdhani-500.woff2',
  './fonts/rajdhani-600.woff2',
  './fonts/rajdhani-700.woff2',
  './fonts/inter-var.woff2'
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

  // GitHub Pages sirve todo con max-age=600: sin revalidar, tras un deploy el
  // navegador puede mezclar un app.js nuevo con un utils.js viejo y el import
  // falla (app en blanco). 'no-cache' revalida con ETag (304 si no cambió).
  // Las navegaciones no admiten RequestInit; esas ya revalidan por su cuenta.
  const request = event.request.mode === 'navigate'
    ? event.request
    : new Request(event.request, { cache: 'no-cache' });

  event.respondWith(
    fetch(request)
      .then(response => {
        // Solo cachear respuestas same-origin exitosas
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});
