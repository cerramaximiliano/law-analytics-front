#!/bin/bash

# Script completo de deployment con limpieza de cachés
# Este script hace TODO en una sola ejecución

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo "========================================="
echo -e "${BLUE}🚀 LAW ANALYTICS - DEPLOYMENT${NC}"
echo "========================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: No se encontró package.json${NC}"
    echo "Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Detectar si estamos en el servidor
IS_SERVER=false
if [ -d "/var/www/law-analytics-front" ] && [ "$PWD" == "/var/www/law-analytics-front" ]; then
    IS_SERVER=true
fi

# 1. Git pull si estamos en el servidor
if [ "$IS_SERVER" = true ] || [ "$1" == "--pull" ]; then
    echo -e "${YELLOW}1. Actualizando desde git...${NC}"
    git pull
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error al hacer git pull${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Código actualizado${NC}"
else
    echo -e "${BLUE}1. Modo local - saltando git pull${NC}"
fi

# 2. Generar versión única
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
VERSION="2.0.${TIMESTAMP}"
echo -e "${MAGENTA}2. Versión de deployment: ${VERSION}${NC}"

# 3. Crear Service Worker de limpieza temporal
echo -e "${YELLOW}3. Creando Service Worker de limpieza...${NC}"
cat > public/sw-temp.js << 'EOF'
// Service Worker temporal - Limpieza completa de cachés
const TEMP_VERSION = 'cleanup-VERSION_PLACEHOLDER';

self.addEventListener('install', event => {
  console.log('[SW] Instalando limpieza v' + TEMP_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activando limpieza');
  event.waitUntil(
    (async () => {
      // Eliminar TODOS los cachés
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => {
          console.log('[SW] Eliminando caché:', name);
          return caches.delete(name);
        })
      );
      
      // Tomar control inmediato
      await clients.claim();
      
      // Notificar a clientes
      const allClients = await clients.matchAll({ type: 'window' });
      allClients.forEach(client => {
        client.postMessage({
          type: 'FORCE_UPDATE',
          version: TEMP_VERSION
        });
      });
      
      // Registrar el Service Worker real después de limpiar
      setTimeout(() => {
        console.log('[SW] Limpieza completa');
      }, 500);
    })()
  );
});

// No cachear nada durante la limpieza
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // No interceptar APIs externas
  if (!url.origin.includes(self.location.origin)) {
    return;
  }
  
  // Para todo lo demás, ir directo a la red
  event.respondWith(fetch(event.request));
});
EOF

# Reemplazar VERSION_PLACEHOLDER con la versión actual
sed -i "s/VERSION_PLACEHOLDER/${VERSION}/g" public/sw-temp.js

# 4. Actualizar Service Workers principales con nueva versión
echo -e "${YELLOW}4. Actualizando Service Workers principales...${NC}"

# Actualizar sw.js
cat > public/sw.js << 'EOF'
// Service Worker principal - Versión actualizada
const CACHE_VERSION = 'v-VERSION_PLACEHOLDER';
const CACHE_NAME = 'law-analytics-' + CACHE_VERSION;
const SKIP_CACHE_FOR = ['/api/', '/auth/', '.json', '/index.html'];

// Install - activación inmediata
self.addEventListener('install', event => {
  console.log('[SW] Instalando versión:', CACHE_VERSION);
  self.skipWaiting();
});

// Activate - limpiar cachés viejos
self.addEventListener('activate', event => {
  console.log('[SW] Activando versión:', CACHE_VERSION);
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
      await clients.claim();
    })()
  );
});

// Fetch - estrategia optimizada
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar APIs externas
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // No cachear rutas específicas
  const shouldSkipCache = SKIP_CACHE_FOR.some(path => url.pathname.includes(path));
  if (shouldSkipCache) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML siempre desde red
  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Assets - cache first
  event.respondWith(
    caches.match(request).then(response => {
      if (response) return response;
      
      return fetch(request).then(response => {
        if (!response || response.status !== 200) return response;
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
        
        return response;
      });
    })
  );
});

// Auto-actualización silenciosa
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
EOF

# Reemplazar VERSION_PLACEHOLDER
sed -i "s/VERSION_PLACEHOLDER/${VERSION}/g" public/sw.js

# Copiar sw.js a sw-new.js
cp public/sw.js public/sw-new.js

echo -e "${GREEN}✓ Service Workers actualizados${NC}"

# 5. Limpiar builds anteriores
echo -e "${YELLOW}5. Limpiando builds anteriores...${NC}"
rm -rf build/ node_modules/.vite/ node_modules/.cache/
echo -e "${GREEN}✓ Limpieza completada${NC}"

# 6. Construir aplicación
echo -e "${YELLOW}6. Construyendo aplicación...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Error durante el build${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completado${NC}"

# 7. Primera fase: Instalar SW de limpieza
echo -e "${MAGENTA}7. Instalando Service Worker de limpieza...${NC}"
cp public/sw-temp.js build/sw.js
cp public/sw-temp.js build/sw-new.js
cp public/sw-temp.js build/service-worker.js

# 8. Copiar recursos adicionales
echo -e "${YELLOW}8. Copiando recursos...${NC}"
[ -f public/logo192.png ] && cp public/logo192.png build/
[ -f public/logo512.png ] && cp public/logo512.png build/
[ -f public/manifest.json ] && cp public/manifest.json build/
echo -e "${GREEN}✓ Recursos copiados${NC}"

# 9. Crear archivo de versión
echo -e "${YELLOW}9. Creando archivo de versión...${NC}"
cat > build/version.json <<EOF
{
  "version": "${VERSION}",
  "buildTime": "${TIMESTAMP}",
  "deployment": "production",
  "cleanupPhase": "active"
}
EOF
echo -e "${GREEN}✓ Archivo de versión creado${NC}"

# 10. Optimizar index.html
echo -e "${YELLOW}10. Optimizando index.html...${NC}"
if [ -f "build/index.html" ]; then
    # Añadir versión
    sed -i "1i<!-- Build Version: ${VERSION} -->" build/index.html
    
    # Asegurar no-cache
    if ! grep -q "no-store" build/index.html; then
        sed -i '/<head>/a <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />' build/index.html
        sed -i '/<head>/a <meta http-equiv="Pragma" content="no-cache" />' build/index.html
    fi
    echo -e "${GREEN}✓ index.html optimizado${NC}"
fi

# 11. Recargar nginx si está disponible
if [ "$IS_SERVER" = true ] && command -v nginx &> /dev/null; then
    echo -e "${YELLOW}11. Recargando nginx...${NC}"
    sudo nginx -t &> /dev/null
    if [ $? -eq 0 ]; then
        sudo systemctl reload nginx
        echo -e "${GREEN}✓ Nginx recargado${NC}"
    fi
fi

# 12. Esperar para la limpieza
echo ""
echo -e "${MAGENTA}=========================================${NC}"
echo -e "${MAGENTA}FASE 1: LIMPIEZA INICIADA${NC}"
echo -e "${MAGENTA}=========================================${NC}"
echo ""
echo -e "${YELLOW}⏱️  Esperando 30 segundos para limpieza de cachés...${NC}"
sleep 30

# 13. Segunda fase: Instalar SW normal
echo ""
echo -e "${MAGENTA}=========================================${NC}"
echo -e "${MAGENTA}FASE 2: INSTALANDO SERVICE WORKER NORMAL${NC}"
echo -e "${MAGENTA}=========================================${NC}"
echo ""

echo -e "${YELLOW}Instalando Service Worker optimizado...${NC}"
cp public/sw.js build/sw.js
cp public/sw-new.js build/sw-new.js
cp public/sw.js build/service-worker.js

# Actualizar archivo de versión
cat > build/version.json <<EOF
{
  "version": "${VERSION}",
  "buildTime": "${TIMESTAMP}",
  "deployment": "production",
  "status": "completed"
}
EOF

echo -e "${GREEN}✓ Service Worker normal instalado${NC}"

# 14. Limpiar archivos temporales
rm -f public/sw-temp.js

# 15. Mostrar resumen
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}📊 Información del deployment:${NC}"
echo "   • Versión: ${VERSION}"
echo "   • Hora: $(date)"
echo "   • Modo: $([ "$IS_SERVER" = true ] && echo "Servidor" || echo "Local")"
echo ""
echo -e "${GREEN}✨ Características aplicadas:${NC}"
echo "   ✓ Cachés antiguos eliminados"
echo "   ✓ Service Workers actualizados"
echo "   ✓ Actualización automática sin alerts"
echo "   ✓ Optimizado para móviles"
echo ""

if [ "$IS_SERVER" = true ]; then
    echo -e "${GREEN}🌐 La aplicación está actualizada en producción${NC}"
    echo -e "${GREEN}📱 Los dispositivos móviles se actualizarán automáticamente${NC}"
else
    echo -e "${BLUE}📝 Para desplegar en el servidor:${NC}"
    echo ""
    echo "   1. Hacer commit y push:"
    echo -e "      ${YELLOW}git add -A${NC}"
    echo -e "      ${YELLOW}git commit -m 'deploy: v${VERSION}'${NC}"
    echo -e "      ${YELLOW}git push origin main${NC}"
    echo ""
    echo "   2. En el servidor ejecutar:"
    echo -e "      ${YELLOW}cd /var/www/law-analytics-front${NC}"
    echo -e "      ${YELLOW}./deploy.sh${NC}"
fi

echo ""
echo -e "${MAGENTA}🎯 Los usuarios ya no verán mensajes de confirmación${NC}"
echo -e "${MAGENTA}🔄 Las actualizaciones serán completamente automáticas${NC}"