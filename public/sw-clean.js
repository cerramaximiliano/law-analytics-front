// Service Worker mínimo para limpiar cachés viejos
// Este SW se auto-destruye después de limpiar

const CLEAN_VERSION = 'clean-' + Date.now();

self.addEventListener('install', (event) => {
  console.log('[SW Clean] Instalando Service Worker de limpieza...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW Clean] Limpiando todos los cachés...');
  
  event.waitUntil(
    (async () => {
      // Eliminar TODOS los cachés existentes
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => {
          console.log(`[SW Clean] Eliminando caché: ${name}`);
          return caches.delete(name);
        })
      );
      
      // Tomar control de todos los clientes
      await clients.claim();
      
      // Notificar a todos los clientes
      const allClients = await clients.matchAll({ type: 'window' });
      allClients.forEach(client => {
        client.postMessage({
          type: 'CACHE_CLEANED',
          message: 'Actualización completada'
        });
      });
      
      // Auto-desregistrarse después de limpiar
      setTimeout(async () => {
        console.log('[SW Clean] Auto-desregistrando...');
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
        }
      }, 1000);
    })()
  );
});

// No interceptar ninguna petición
self.addEventListener('fetch', (event) => {
  // Dejar pasar todas las peticiones sin modificar
  return;
});