#!/bin/bash

# Script automatizado de deployment para Law Analytics
# Maneja automáticamente Service Workers y versionado

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo -e "${BLUE}LAW ANALYTICS - DEPLOYMENT AUTOMATIZADO${NC}"
echo "========================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: No se encontró package.json${NC}"
    echo "Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# 1. Obtener última versión de git (si estamos en servidor)
if [ "$1" == "--pull" ]; then
    echo -e "${YELLOW}1. Actualizando desde git...${NC}"
    git pull
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error al hacer git pull${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Código actualizado${NC}"
else
    echo -e "${BLUE}1. Saltando git pull (modo local)${NC}"
fi

# 2. Generar timestamp y versión únicos
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
VERSION="1.0.${TIMESTAMP}"
echo -e "${YELLOW}2. Versión de deployment: ${VERSION}${NC}"

# 3. Actualizar versiones en Service Workers ANTES del build
echo -e "${YELLOW}3. Actualizando Service Workers...${NC}"

# Actualizar sw.js
if [ -f "public/sw.js" ]; then
    sed -i "s/const CACHE_VERSION = .*/const CACHE_VERSION = 'v-${VERSION}';/" public/sw.js
    echo -e "${GREEN}✓ sw.js actualizado${NC}"
fi

# Actualizar sw-new.js
if [ -f "public/sw-new.js" ]; then
    sed -i "s/const SW_VERSION = .*/const SW_VERSION = '${VERSION}';/" public/sw-new.js
    echo -e "${GREEN}✓ sw-new.js actualizado${NC}"
fi

# 4. Limpiar builds y caché anteriores
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

# 6. Copiar Service Workers al build
echo -e "${YELLOW}6. Copiando Service Workers al build...${NC}"
if [ -f "public/sw-new.js" ]; then
    cp public/sw-new.js build/sw-new.js
    cp public/sw-new.js build/sw.js
    echo -e "${GREEN}✓ Service Workers copiados${NC}"
fi

# 7. Copiar logos si existen
echo -e "${YELLOW}7. Copiando recursos adicionales...${NC}"
[ -f "public/logo192.png" ] && cp public/logo192.png build/
[ -f "public/logo512.png" ] && cp public/logo512.png build/
[ -f "public/manifest.json" ] && cp public/manifest.json build/
echo -e "${GREEN}✓ Recursos copiados${NC}"

# 8. Crear archivo de versión
echo -e "${YELLOW}8. Creando archivo de versión...${NC}"
cat > build/version.json <<EOF
{
  "version": "${VERSION}",
  "buildTime": "${TIMESTAMP}",
  "deployment": "production",
  "gitCommit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
}
EOF
echo -e "${GREEN}✓ Archivo de versión creado${NC}"

# 9. Actualizar index.html con timestamp
echo -e "${YELLOW}9. Optimizando index.html...${NC}"
if [ -f "build/index.html" ]; then
    # Añadir comentario con versión
    sed -i "1i<!-- Build Version: ${VERSION} -->" build/index.html
    
    # Asegurar meta tags de no-cache
    if ! grep -q "no-store" build/index.html; then
        sed -i '/<head>/a <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />' build/index.html
        sed -i '/<head>/a <meta http-equiv="Pragma" content="no-cache" />' build/index.html
    fi
    echo -e "${GREEN}✓ index.html optimizado${NC}"
fi

# 10. Verificar nginx (solo si está instalado)
if command -v nginx &> /dev/null; then
    echo -e "${YELLOW}10. Verificando configuración de nginx...${NC}"
    sudo nginx -t &> /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Configuración de nginx válida${NC}"
        echo -e "${YELLOW}   Recargando nginx...${NC}"
        sudo systemctl reload nginx
        echo -e "${GREEN}✓ Nginx recargado${NC}"
    else
        echo -e "${YELLOW}⚠ Advertencia: Verifica la configuración de nginx manualmente${NC}"
    fi
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}DEPLOYMENT COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}Versión: ${VERSION}${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# Mostrar información útil
echo -e "${BLUE}Información del deployment:${NC}"
echo "• Versión desplegada: ${VERSION}"
echo "• Hora: $(date)"
echo "• Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
echo ""

# Instrucciones según el entorno
if [ "$1" == "--pull" ]; then
    echo -e "${BLUE}Deployment en servidor completado.${NC}"
    echo "La aplicación ya está actualizada y funcionando."
else
    echo -e "${BLUE}Build local completado.${NC}"
    echo ""
    echo "Para desplegar en el servidor:"
    echo -e "${YELLOW}1. git add -A${NC}"
    echo -e "${YELLOW}2. git commit -m 'deploy: v${VERSION}'${NC}"
    echo -e "${YELLOW}3. git push origin main${NC}"
    echo ""
    echo "En el servidor:"
    echo -e "${YELLOW}cd /var/www/law-analytics-front${NC}"
    echo -e "${YELLOW}./scripts/deploy.sh --pull${NC}"
fi

echo ""
echo -e "${GREEN}Los usuarios móviles se actualizarán automáticamente.${NC}"