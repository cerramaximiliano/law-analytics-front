#!/bin/bash

# Script rápido de deployment - versión simplificada
# Uso: ./deploy-quick.sh

echo "🚀 Iniciando deployment rápido..."

# Actualizar versiones de Service Workers
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
VERSION="1.0.${TIMESTAMP}"

echo "📝 Actualizando versión a: ${VERSION}"

# Actualizar Service Workers
sed -i "s/const CACHE_VERSION = .*/const CACHE_VERSION = 'v-${VERSION}';/" public/sw.js 2>/dev/null
sed -i "s/const SW_VERSION = .*/const SW_VERSION = '${VERSION}';/" public/sw-new.js 2>/dev/null

# Limpiar y construir
echo "🔨 Construyendo..."
rm -rf build/
npm run build

# Copiar Service Workers
echo "📋 Copiando Service Workers..."
[ -f public/sw-new.js ] && cp public/sw-new.js build/sw.js
[ -f public/sw-new.js ] && cp public/sw-new.js build/sw-new.js
[ -f public/logo192.png ] && cp public/logo192.png build/
[ -f public/logo512.png ] && cp public/logo512.png build/

# Crear versión
echo '{"version":"'${VERSION}'","updated":"'$(date)'"}' > build/version.json

echo "✅ Build completado: v${VERSION}"
echo ""
echo "Para desplegar:"
echo "1. git add -A && git commit -m 'deploy: v${VERSION}' && git push"
echo "2. En el servidor: git pull && ./deploy-quick.sh"