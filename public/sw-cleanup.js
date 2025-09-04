// Service Worker de limpieza - Se auto-elimina
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Eliminar TODOS los cachés
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      // Desregistrarse a sí mismo
      await self.registration.unregister();
      
      // Notificar a todos los clientes
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({ type: 'SW_REMOVED' });
      });
    })()
  );
});
