// Service Worker Optimizado para PWAs - Basado en mejores prácticas 2024
// NUNCA cachea index.html para evitar problemas en móviles

const SW_VERSION = '1.0.20250904-131540';
const CACHE_NAME = `law-analytics-v${SW_VERSION}`;
const RUNTIME_CACHE = `runtime-${SW_VERSION}`;

// CRÍTICO: NO cachear estos archivos
const NEVER_CACHE = [
  '/index.html',
  '/',
  '/manifest.json',
  '/sw.js',
  '/sw-new.js'
];

// Archivos para cachear (solo assets con hash)
const CACHE_ASSETS = [
  // Solo cachear archivos con hash en el nombre
  // Los archivos se añaden dinámicamente
];

// Función para determinar si un archivo debe cachearse
const shouldCache = (url) => {
  const pathname = new URL(url).pathname;
  
  // Nunca cachear index.html o rutas base
  if (NEVER_CACHE.some(path => pathname === path || pathname.endsWith('index.html'))) {
    return false;
  }
  
  // Nunca cachear API calls
  if (pathname.includes('/api/') || pathname.includes('/auth/')) {
    return false;
  }
  
  // Solo cachear assets con hash (contienen un guión seguido de hash)
  if (pathname.includes('/assets/') && pathname.match(/\-[a-f0-9]{8}\./)) {
    return true;
  }
  
  return false;
};

// Instalación - mínima, sin pre-cachear nada
self.addEventListener('install', (event) => {
  console.log(`[SW v${SW_VERSION}] Installing...`);
  // Activar inmediatamente sin esperar
  self.skipWaiting();
});

// Activación - limpiar cachés viejos
self.addEventListener('activate', (event) => {
  console.log(`[SW v${SW_VERSION}] Activating...`);
  
  event.waitUntil(
    (async () => {
      // Limpiar TODOS los cachés antiguos
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
      
      // Tomar control de todos los clientes inmediatamente
      await clients.claim();
      
      // Notificar a todos los clientes que hay una nueva versión
      const allClients = await clients.matchAll({ type: 'window' });
      allClients.forEach(client => {
        client.postMessage({
          type: 'SW_UPDATED',
          version: SW_VERSION
        });
      });
    })()
  );
});

// Fetch - Estrategia Network First para HTML, Cache First para assets con hash
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // IMPORTANTE: No interceptar peticiones a otros dominios (API, etc)
  if (!url.origin.includes(self.location.origin)) {
    // Para peticiones externas (API), dejar pasar sin modificar
    return;
  }
  
  // Para navegación y HTML - SIEMPRE de red
  if (request.mode === 'navigate' || 
      url.pathname.endsWith('.html') || 
      url.pathname === '/' ||
      !shouldCache(url.href)) {
    
    event.respondWith(
      // Para HTML, usar la petición original sin modificar headers
      fetch(request).catch(() => {
        // Si falla la red (offline), intentar caché como fallback
        return caches.match(request);
      })
    );
    return;
  }
  
  // Para assets con hash - Cache First (son inmutables)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Si no está en caché, buscar de red y cachear
      return fetch(request).then(networkResponse => {
        // Solo cachear respuestas exitosas de nuestro dominio
        if (networkResponse.ok && request.url.startsWith(self.location.origin)) {
          const responseToCache = networkResponse.clone();
          
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        
        return networkResponse;
      });
    })
  );
});

// Mensaje para detectar actualizaciones
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});