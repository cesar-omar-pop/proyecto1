// Nombre de la caché y lista de archivos del App Shell a guardar
const CACHE_NAME = 'v1_cache_pwa';
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// 1. Evento Install: Se dispara cuando el Service Worker se instala
self.addEventListener('install', e => {
  console.log('SW: Evento Install');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Archivos guardados en caché');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Evento Activate: Se dispara cuando toma el control de la app
self.addEventListener('activate', e => {
  console.log('SW: Evento Activate');
  e.waitUntil(self.clients.claim());
});

// 3. Evento Fetch: Intercepta las peticiones de red
self.addEventListener('fetch', e => {
  console.log('SW: Interceptando petición a:', e.request.url);
  e.respondWith(
    caches.match(e.request)
      .then(res => {
        if (res) {
          return res; // Devuelve desde caché si existe
        }
        return fetch(e.request); // Si no está en caché, va a la red
      })
  );
});