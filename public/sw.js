// Service Worker para caché offline y mejor performance
// IMPORTANTE: Incrementar versión para forzar actualización
const CACHE_VERSION = 'v6-2025-01-03-mobile-fix'; // Cambiar esta versión con cada deployment
const CACHE_NAME = 'law-analytics-' + CACHE_VERSION;
const SKIP_CACHE_FOR = ['/api/', '/auth/', '.json']; // Rutas que nunca se cachean
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
    // Limpiar TODOS los cachés viejos al instalar
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('law-analytics-'))
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => {
      return caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache));
    })
  );
});

// Fetch - estrategia network-first para HTML, cache-first para assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // No cachear ciertas rutas
  const shouldSkipCache = SKIP_CACHE_FOR.some(path => url.pathname.includes(path));
  if (shouldSkipCache) {
    event.respondWith(fetch(request));
    return;
  }

  // Para archivos HTML, siempre buscar la versión más reciente
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Actualizar caché con la nueva versión
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Si falla, usar caché
          return caches.match(request);
        })
    );
    return;
  }

  // Para assets (JS, CSS, etc), usar caché primero
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        
        // Si no está en caché, buscar en red
        return fetch(request).then(response => {
          // Solo cachear respuestas exitosas
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
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