#!/bin/bash

# Script definitivo para resolver caché en móviles
# Este script debe ejecutarse ANTES de cada deployment

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================="
echo "FIX DEFINITIVO: Caché Móvil"
echo "========================================="

# 1. Actualizar timestamp en Service Worker
echo -e "${YELLOW}1. Actualizando Service Worker...${NC}"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
sed -i "s/const CACHE_VERSION = .*/const CACHE_VERSION = 'v-${TIMESTAMP}';/" public/sw.js
echo -e "${GREEN}✓ Service Worker actualizado con versión: v-${TIMESTAMP}${NC}"

# 2. Actualizar manifest.json con nueva versión
echo -e "${YELLOW}2. Actualizando manifest.json...${NC}"
VERSION=$(grep '"version"' package.json | head -1 | awk -F'"' '{print $4}')
BUILD_NUMBER="${TIMESTAMP}"
sed -i "s/\"version\": \".*\"/\"version\": \"${VERSION}-${BUILD_NUMBER}\"/" public/manifest.json
echo -e "${GREEN}✓ Manifest actualizado: ${VERSION}-${BUILD_NUMBER}${NC}"

# 3. Limpiar build anterior completamente
echo -e "${YELLOW}3. Limpiando build anterior...${NC}"
rm -rf build/
echo -e "${GREEN}✓ Directorio build limpiado${NC}"

# 4. Construir con hash único
echo -e "${YELLOW}4. Construyendo aplicación con hash único...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Error en build${NC}"
    exit 1
fi

# 5. Añadir headers de no-cache al index.html generado
echo -e "${YELLOW}5. Modificando index.html para prevenir caché...${NC}"
if [ -f "build/index.html" ]; then
    # Añadir timestamp como comentario para forzar cambio
    sed -i "1i<!-- Build: ${TIMESTAMP} -->" build/index.html
    
    # Añadir query string a la referencia del Service Worker
    sed -i "s|/sw.js|/sw.js?v=${TIMESTAMP}|g" build/index.html
    
    echo -e "${GREEN}✓ index.html modificado${NC}"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}BUILD COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "IMPORTANTE para deployment:"
echo ""
echo "1. En el servidor, ELIMINAR el directorio build anterior:"
echo "   ${YELLOW}rm -rf /var/www/law-analytics-front/build${NC}"
echo ""
echo "2. Luego hacer pull y build:"
echo "   ${YELLOW}git pull && npm run build${NC}"
echo ""
echo "3. Limpiar caché de CloudFlare/CDN si existe"
echo ""
echo -e "${RED}CRÍTICO:${NC} Los usuarios móviles DEBEN:"
echo "  - Android: Configuración > Apps > Chrome > Almacenamiento > Borrar caché"
echo "  - iOS: Configuración > Safari > Borrar historial y datos"
echo "  - O usar modo incógnito la primera vez"