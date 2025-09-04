#!/bin/bash

# Script de deployment con fix definitivo para móviles
# Basado en las mejores prácticas de la comunidad 2024

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo -e "${BLUE}DEPLOYMENT CON FIX MÓVIL DEFINITIVO${NC}"
echo "========================================="

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: No se encontró package.json${NC}"
    exit 1
fi

# 2. Actualizar versión del Service Worker
echo -e "${YELLOW}1. Actualizando versión del Service Worker...${NC}"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
SW_VERSION="1.0.${TIMESTAMP}"

# Actualizar versión en el nuevo Service Worker
sed -i "s/const SW_VERSION = .*/const SW_VERSION = '${SW_VERSION}';/" public/sw-new.js
echo -e "${GREEN}✓ Service Worker actualizado: v${SW_VERSION}${NC}"

# 3. Limpiar build anterior
echo -e "${YELLOW}2. Limpiando build anterior...${NC}"
rm -rf build/
rm -rf node_modules/.vite/
echo -e "${GREEN}✓ Directorios limpiados${NC}"

# 4. Construir con optimizaciones
echo -e "${YELLOW}3. Construyendo aplicación...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Error en build${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completado${NC}"

# 5. Copiar el nuevo Service Worker al build
echo -e "${YELLOW}4. Copiando Service Worker al build...${NC}"
cp public/sw-new.js build/sw-new.js
cp public/sw-new.js build/sw.js  # También como sw.js para compatibilidad
echo -e "${GREEN}✓ Service Worker copiado${NC}"

# 6. Modificar index.html para prevenir cache
echo -e "${YELLOW}5. Optimizando index.html...${NC}"
if [ -f "build/index.html" ]; then
    # Añadir timestamp como comentario
    sed -i "1i<!-- Build: ${TIMESTAMP} -->" build/index.html
    
    # Añadir meta tags anti-cache si no existen
    if ! grep -q "no-store" build/index.html; then
        sed -i '/<head>/a <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />' build/index.html
        sed -i '/<head>/a <meta http-equiv="Pragma" content="no-cache" />' build/index.html
        sed -i '/<head>/a <meta http-equiv="Expires" content="0" />' build/index.html
    fi
    
    echo -e "${GREEN}✓ index.html optimizado${NC}"
fi

# 7. Crear archivo de versión
echo -e "${YELLOW}6. Creando archivo de versión...${NC}"
cat > build/version.json <<EOF
{
  "version": "${SW_VERSION}",
  "buildTime": "${TIMESTAMP}",
  "deployment": "production"
}
EOF
echo -e "${GREEN}✓ Archivo de versión creado${NC}"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}BUILD COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}INSTRUCCIONES DE DEPLOYMENT:${NC}"
echo ""
echo "1. Commit y push:"
echo -e "   ${YELLOW}git add -A${NC}"
echo -e "   ${YELLOW}git commit -m 'fix: Solución definitiva caché móvil v${SW_VERSION}'${NC}"
echo -e "   ${YELLOW}git push origin main${NC}"
echo ""
echo "2. En el servidor:"
echo -e "   ${YELLOW}cd /var/www/law-analytics-front${NC}"
echo -e "   ${YELLOW}git pull${NC}"
echo -e "   ${YELLOW}rm -rf build/ node_modules/.vite/${NC}"
echo -e "   ${YELLOW}./scripts/deploy-mobile-fix.sh${NC}"
echo ""
echo "3. Actualizar nginx (si no está actualizado):"
echo -e "   ${YELLOW}sudo cp nginx-mobile-fix.conf /etc/nginx/sites-available/lawanalytics${NC}"
echo -e "   ${YELLOW}sudo nginx -t${NC}"
echo -e "   ${YELLOW}sudo systemctl reload nginx${NC}"
echo ""
echo "4. Limpiar CDN/CloudFlare (si aplica)"
echo ""
echo -e "${RED}IMPORTANTE PARA USUARIOS CON PROBLEMAS:${NC}"
echo "Primera vez después del deployment:"
echo "- Android: Limpiar datos de la app en Configuración > Apps"
echo "- iOS: Eliminar la PWA y volver a instalarla"
echo "- O usar modo incógnito una vez"
echo ""
echo -e "${GREEN}Después de esto, las actualizaciones serán automáticas${NC}"