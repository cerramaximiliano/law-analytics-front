#!/bin/bash

# Script único de deployment para Law Analytics
# Sin Service Worker - Sin problemas de caché
# Con verificaciones previas para prevenir errores en producción

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Parámetros
SKIP_CHECKS=false
PREVIEW_MODE=false

# Parsear argumentos
for arg in "$@"; do
    case $arg in
        --skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        --preview)
            PREVIEW_MODE=true
            shift
            ;;
        --help)
            echo "Uso: ./deploy.sh [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --skip-checks    Saltar verificaciones previas (NO RECOMENDADO)"
            echo "  --preview        Solo build y preview local (sin deploy)"
            echo "  --help           Mostrar esta ayuda"
            exit 0
            ;;
    esac
done

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

# Modo preview solo para local
if [ "$PREVIEW_MODE" = true ] && [ "$IS_SERVER" = true ]; then
    echo -e "${RED}Error: --preview solo funciona en modo local${NC}"
    exit 1
fi

# 1. Git pull si estamos en el servidor
if [ "$IS_SERVER" = true ]; then
    echo -e "${YELLOW}1. Actualizando desde git...${NC}"
    git fetch origin
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error al hacer git fetch${NC}"
        exit 1
    fi
    git reset --hard origin/main
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error al sincronizar con origin/main${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Código actualizado y sincronizado con origin/main${NC}"
else
    echo -e "${BLUE}1. Modo local - saltando git pull${NC}"
fi

# 2. VERIFICACIONES PREVIAS (Pre-flight checks)
if [ "$SKIP_CHECKS" = false ]; then
    echo ""
    echo -e "${CYAN}=========================================${NC}"
    echo -e "${CYAN}🔍 VERIFICACIONES PREVIAS${NC}"
    echo -e "${CYAN}=========================================${NC}"

    # 2.1 Type checking
    echo -e "${YELLOW}2.1. Verificando tipos TypeScript...${NC}"
    npm run type-check
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Errores de TypeScript encontrados${NC}"
        echo -e "${YELLOW}Tip: Ejecuta 'npm run type-check' para ver los errores${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Types verificados${NC}"

    # 2.2 Linting
    echo -e "${YELLOW}2.2. Verificando código con ESLint...${NC}"
    npm run lint > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠ Warnings de ESLint encontrados (no crítico)${NC}"
        # No fallar por warnings de lint
    else
        echo -e "${GREEN}✓ Lint OK${NC}"
    fi

    # 2.3 Verificar node_modules
    echo -e "${YELLOW}2.3. Verificando dependencias...${NC}"
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠ node_modules no encontrado, instalando dependencias...${NC}"
        npm ci
        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ Error al instalar dependencias${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}✓ Dependencias OK${NC}"

    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✅ VERIFICACIONES COMPLETADAS${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠ Verificaciones previas saltadas (--skip-checks)${NC}"
fi

# 3. Generar versión única basada en timestamp
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
    
    # No agregar Service Workers
    
    echo -e "${GREEN}✓ index.html optimizado${NC}"
fi

# 8. Copiar recursos adicionales si existen
echo -e "${YELLOW}8. Copiando recursos...${NC}"
[ -f public/logo192.png ] && cp public/logo192.png build/
[ -f public/logo512.png ] && cp public/logo512.png build/
[ -f public/manifest.json ] && cp public/manifest.json build/
echo -e "${GREEN}✓ Recursos copiados${NC}"

# 9. Archivo vacío por compatibilidad (algunos navegadores pueden cachear la ruta)
echo -e "${YELLOW}9. Creando archivo SW vacío por compatibilidad...${NC}"
echo "// No Service Worker" > build/sw.js
echo -e "${GREEN}✓ Archivo de compatibilidad creado${NC}"

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
echo ""

if [ "$IS_SERVER" = true ]; then
    echo -e "${GREEN}🌐 Aplicación actualizada en producción${NC}"
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

