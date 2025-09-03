#!/bin/bash

# Script para forzar actualización en dispositivos móviles
# Uso: ./force-mobile-update.sh

echo "========================================="
echo "Forzando actualización para móviles"
echo "========================================="

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: No se encontró package.json${NC}"
    echo "Asegúrate de ejecutar este script desde la raíz del proyecto"
    exit 1
fi

echo -e "${YELLOW}1. Incrementando versión del Service Worker...${NC}"
# Actualizar versión del Service Worker
SW_FILE="public/sw.js"
if [ -f "$SW_FILE" ]; then
    # Obtener fecha y hora actual
    TIMESTAMP=$(date +"%Y-%m-%d-%H%M")
    
    # Actualizar la línea de versión
    sed -i "s/const CACHE_VERSION = .*/const CACHE_VERSION = 'v${TIMESTAMP}-mobile'; \/\/ Cambiar esta versión con cada deployment/" "$SW_FILE"
    echo -e "${GREEN}✓ Service Worker actualizado con versión: v${TIMESTAMP}-mobile${NC}"
else
    echo -e "${RED}✗ No se encontró el archivo sw.js${NC}"
fi

echo -e "${YELLOW}2. Actualizando versión en manifest.json...${NC}"
# Actualizar versión en manifest.json
MANIFEST_FILE="public/manifest.json"
if [ -f "$MANIFEST_FILE" ]; then
    # Obtener versión actual del package.json
    VERSION=$(grep '"version"' package.json | head -1 | awk -F'"' '{print $4}')
    
    # Actualizar versión en manifest.json
    sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" "$MANIFEST_FILE"
    echo -e "${GREEN}✓ Manifest actualizado con versión: $VERSION${NC}"
else
    echo -e "${RED}✗ No se encontró el archivo manifest.json${NC}"
fi

echo -e "${YELLOW}3. Construyendo aplicación...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completado exitosamente${NC}"
else
    echo -e "${RED}✗ Error durante el build${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Actualización preparada exitosamente${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Hacer commit de los cambios:"
echo "   git add -A"
echo "   git commit -m 'fix: Forzar actualización de caché en móviles'"
echo ""
echo "2. Push a repositorio:"
echo "   git push origin main"
echo ""
echo "3. En el servidor de producción:"
echo "   cd /var/www/law-analytics-front"
echo "   git pull"
echo "   npm run build"
echo ""
echo "4. Limpiar caché de CloudFlare/CDN si aplica"
echo ""
echo -e "${YELLOW}Nota: Los dispositivos móviles se actualizarán automáticamente${NC}"
echo -e "${YELLOW}al detectar la nueva versión del Service Worker${NC}"