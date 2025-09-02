#!/bin/bash

# Script de despliegue para Law Analytics Frontend
# Este script limpia cachés y despliega correctamente la aplicación Vite

echo "🚀 Iniciando despliegue de Law Analytics Frontend..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: No se encontró package.json. Asegúrate de estar en el directorio correcto.${NC}"
    exit 1
fi

echo -e "${YELLOW}1. Limpiando cachés y builds anteriores...${NC}"
rm -rf build
rm -rf node_modules/.vite
rm -rf dist
rm -rf static  # Eliminar cualquier carpeta static antigua

echo -e "${YELLOW}2. Instalando dependencias...${NC}"
npm install

echo -e "${YELLOW}3. Construyendo la aplicación...${NC}"
npm run build

# Verificar que el build se completó correctamente
if [ ! -d "build" ]; then
    echo -e "${RED}Error: El build falló. Revisa los errores anteriores.${NC}"
    exit 1
fi

# Verificar que se creó la carpeta assets (Vite)
if [ ! -d "build/assets" ]; then
    echo -e "${RED}Error: No se encontró la carpeta build/assets. El build puede estar corrupto.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completado exitosamente${NC}"

# Si estamos en el servidor de producción
if [ -d "/var/www/law-analytics-front" ] && [ "$PWD" = "/var/www/law-analytics-front" ]; then
    echo -e "${YELLOW}4. Limpiando caché de nginx...${NC}"
    sudo nginx -s reload
    
    echo -e "${YELLOW}5. Limpiando service workers antiguos...${NC}"
    # Crear un archivo para forzar actualización del service worker
    echo "// Force update: $(date)" > build/sw-version.js
fi

echo -e "${GREEN}✅ Despliegue completado exitosamente!${NC}"
echo -e "${YELLOW}Nota: Si ves errores de chunks no encontrados en el navegador:${NC}"
echo "  1. Limpia el caché del navegador (Ctrl+Shift+R)"
echo "  2. Borra los service workers desde DevTools > Application > Storage > Clear site data"
echo "  3. Si el problema persiste, verifica que nginx esté sirviendo desde /var/www/law-analytics-front/build"