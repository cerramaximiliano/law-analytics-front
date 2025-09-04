// Actualizador inteligente de Service Worker para móviles
// Basado en las mejores prácticas de la comunidad 2024

export class ServiceWorkerUpdater {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: number = 5 * 60 * 1000; // 5 minutos
  private checkTimer: NodeJS.Timeout | null = null;

  async init() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker no soportado');
      return;
    }

    try {
      // Registrar el nuevo Service Worker
      this.registration = await navigator.serviceWorker.register('/sw-new.js', {
        updateViaCache: 'none' // CRÍTICO: Nunca cachear el SW
      });

      console.log('Service Worker registrado exitosamente');

      // Escuchar actualizaciones
      this.setupUpdateListener();

      // Verificar actualizaciones periódicamente
      this.startUpdateCheck();

      // Verificar al volver de background (móvil)
      this.setupVisibilityListener();

      // Escuchar mensajes del SW
      this.setupMessageListener();

    } catch (error) {
      console.error('Error registrando Service Worker:', error);
    }
  }

  private setupUpdateListener() {
    if (!this.registration) return;

    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (!newWorker) return;

      console.log('Nueva versión del Service Worker detectada');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Hay una nueva versión disponible
          this.handleUpdate();
        }
      });
    });
  }

  private handleUpdate() {
    console.log('Aplicando actualización automáticamente...');
    
    // Actualizar automáticamente sin preguntar en todos los dispositivos
    this.showUpdateNotification();
    setTimeout(() => {
      this.applyUpdate();
    }, 2000);
  }

  private showUpdateNotification() {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4caf50;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    notification.textContent = 'Actualizando aplicación...';
    document.body.appendChild(notification);
  }

  private async applyUpdate() {
    // Decirle al SW que se active
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Limpiar cachés del navegador
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Recargar con timestamp para evitar caché
    const url = new URL(window.location.href);
    url.searchParams.set('_v', Date.now().toString());
    window.location.href = url.toString();
  }

  private startUpdateCheck() {
    // Verificar actualizaciones periódicamente
    this.checkTimer = setInterval(() => {
      this.checkForUpdates();
    }, this.updateCheckInterval);

    // Verificar inmediatamente
    this.checkForUpdates();
  }

  private async checkForUpdates() {
    if (!this.registration) return;

    try {
      // Forzar verificación de actualización
      await this.registration.update();
    } catch (error) {
      console.error('Error verificando actualizaciones:', error);
    }
  }

  private setupVisibilityListener() {
    // Cuando la app vuelve a estar visible (móvil)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });

    // Cuando vuelve online
    window.addEventListener('online', () => {
      this.checkForUpdates();
    });
  }

  private setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_UPDATED') {
        console.log(`Service Worker actualizado a versión ${event.data.version}`);
      }
    });
  }

  // Método público para forzar actualización
  async forceUpdate() {
    await this.applyUpdate();
  }

  // Cleanup
  destroy() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
  }
}

// Singleton
let updater: ServiceWorkerUpdater | null = null;

export const initServiceWorkerUpdater = () => {
  if (!updater) {
    updater = new ServiceWorkerUpdater();
    updater.init();
  }
  return updater;
};

export const forceServiceWorkerUpdate = async () => {
  if (updater) {
    await updater.forceUpdate();
  } else {
    // Fallback
    window.location.reload();
  }
};