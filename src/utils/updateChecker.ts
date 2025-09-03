// Utilidad para detectar y manejar actualizaciones de la aplicación

let refreshing = false;

export const setupUpdateChecker = () => {
  // Escuchar cuando el service worker se actualiza
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && !refreshing) {
              // Nueva versión disponible
              console.log('Nueva versión de la aplicación disponible');
              
              // Mostrar notificación al usuario (opcional)
              if (window.confirm('Hay una nueva versión disponible. ¿Deseas actualizar ahora?')) {
                refreshing = true;
                window.location.reload();
              }
            }
          });
        }
      });
    });

    // Verificar actualizaciones cada 30 minutos
    setInterval(() => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
      }
    }, 30 * 60 * 1000); // 30 minutos
  }
};

// Función para forzar actualización manual
export const forceUpdate = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    // Desregistrar todos los service workers
    await Promise.all(registrations.map(reg => reg.unregister()));
    
    // Limpiar todos los cachés
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    }
    
    // Recargar la página
    window.location.reload();
  }
};