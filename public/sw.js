// Service Worker para caché offline y mejor performance
// IMPORTANTE: Incrementar versión para forzar actualización
const CACHE_VERSION = 'v3-' + new Date().getTime(); // Versión única basada en timestamp
const CACHE_NAME = 'law-analytics-' + CACHE_VERSION;
const urlsToCache = [
  '/',
  '/index.html',
  // Vite genera archivos en /assets/, no en /static/
  // Los archivos específicos se cachean dinámicamente
];

// Install - cachea recursos iniciales y activa inmediatamente
self.addEventListener('install', event => {
  // Forzar activación inmediata del nuevo service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch - sirve desde caché cuando es posible
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// Activate - limpia caché viejo y toma control inmediato
self.addEventListener('activate', event => {
  // Tomar control de todas las páginas inmediatamente
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all([
        // Eliminar todos los cachés viejos
        ...cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        }),
        // Tomar control de todos los clientes inmediatamente
        clients.claim()
      ]);
    })
  );
});