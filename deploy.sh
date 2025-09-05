#!/bin/bash

# Script único de deployment para Law Analytics
# Sin Service Worker - Sin problemas de caché

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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
if [ "$IS_SERVER" = true ]; then
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

# 2. Generar versión única basada en timestamp
TIMESTAMP=$(date +"%Y%m%d.%H%M%S")
VERSION="${TIMESTAMP}"
echo -e "${BLUE}2. Versión de deployment: ${VERSION}${NC}"

# 3. Crear variable de entorno con versión
echo -e "${YELLOW}3. Configurando versión...${NC}"
echo "VITE_APP_VERSION=${VERSION}" > .env.production.local
echo -e "${GREEN}✓ Versión configurada${NC}"

# 4. Limpiar builds anteriores
echo -e "${YELLOW}4. Limpiando builds anteriores...${NC}"
rm -rf build/ node_modules/.vite/ node_modules/.cache/
echo -e "${GREEN}✓ Directorios limpiados${NC}"

# 5. Construir aplicación
echo -e "${YELLOW}5. Construyendo aplicación...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Error durante el build${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completado${NC}"

# 6. Crear archivo de versión para tracking
echo -e "${YELLOW}6. Creando archivo de versión...${NC}"
cat > build/version.json <<EOF
{
  "version": "${VERSION}",
  "timestamp": "${TIMESTAMP}",
  "deployment": "$([ "$IS_SERVER" = true ] && echo "production" || echo "local")",
  "git_commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "no_service_worker": true
}
EOF
echo -e "${GREEN}✓ Archivo de versión creado${NC}"

# 7. Optimizar index.html
echo -e "${YELLOW}7. Optimizando index.html...${NC}"
if [ -f "build/index.html" ]; then
    # Añadir versión como meta tag
    sed -i "s|</head>|<meta name=\"app-version\" content=\"${VERSION}\">\\n</head>|" build/index.html
    
    # Asegurar headers de no-cache
    if ! grep -q "no-store" build/index.html; then
        sed -i '/<head>/a <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />' build/index.html
        sed -i '/<head>/a <meta http-equiv="Pragma" content="no-cache" />' build/index.html
    fi
    
    # Agregar registro del Service Worker de limpieza (temporal)
    sed -i 's|</body>|<script>if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").then(function(r){console.log("SW limpieza OK");r.update();}).catch(function(e){console.log("SW error:",e);});}</script></body>|' build/index.html
    
    echo -e "${GREEN}✓ index.html optimizado${NC}"
fi

# 8. Copiar recursos adicionales si existen
echo -e "${YELLOW}8. Copiando recursos...${NC}"
[ -f public/logo192.png ] && cp public/logo192.png build/
[ -f public/logo512.png ] && cp public/logo512.png build/
[ -f public/manifest.json ] && cp public/manifest.json build/
echo -e "${GREEN}✓ Recursos copiados${NC}"

# 9. Crear Service Worker de limpieza (temporal)
echo -e "${YELLOW}9. Instalando limpiador de Service Workers viejos...${NC}"
cat > build/sw.js << 'EOF'
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
EOF

# Copiar como sw-new.js también
cp build/sw.js build/sw-new.js
cp build/sw.js build/service-worker.js
echo -e "${GREEN}✓ Limpiador de SW instalado${NC}"

# 10. Recargar nginx si está disponible y estamos en servidor
if [ "$IS_SERVER" = true ] && command -v nginx &> /dev/null; then
    echo -e "${YELLOW}10. Recargando nginx...${NC}"
    sudo nginx -t &> /dev/null
    if [ $? -eq 0 ]; then
        sudo systemctl reload nginx
        echo -e "${GREEN}✓ Nginx recargado${NC}"
    else
        echo -e "${YELLOW}⚠ Verifica la configuración de nginx manualmente${NC}"
    fi
fi

# 11. Mostrar resumen
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETADO${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}📊 Información del deployment:${NC}"
echo "   • Versión: ${VERSION}"
echo "   • Hora: $(date)"
echo "   • Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
echo "   • Service Worker: ELIMINADO"
echo ""

if [ "$IS_SERVER" = true ]; then
    echo -e "${GREEN}🌐 Aplicación actualizada en producción${NC}"
    echo ""
    echo -e "${YELLOW}Importante para usuarios con problemas:${NC}"
    echo "   • Los Service Workers viejos se eliminarán automáticamente"
    echo "   • Si persisten problemas, limpiar caché del navegador"
    echo ""
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
echo -e "${GREEN}✨ Beneficios de este deployment:${NC}"
echo "   ✅ Sin problemas de caché en móviles"
echo "   ✅ Actualizaciones instantáneas"
echo "   ✅ Menos complejidad"
echo "   ✅ Mejor experiencia de usuario"