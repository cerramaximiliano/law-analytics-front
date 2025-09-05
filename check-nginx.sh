#!/bin/bash

echo "==================================="
echo "🔍 DIAGNÓSTICO DE NGINX"
echo "==================================="

# Verificar configuración actual
echo -e "\n📁 Verificando directorio de build:"
if [ -d "/var/www/law-analytics-front/build" ]; then
    echo "✓ Directorio build existe"
    echo "  Archivos principales:"
    ls -la /var/www/law-analytics-front/build/ | head -10
    
    echo -e "\n  Chunks de JavaScript:"
    ls -la /var/www/law-analytics-front/build/assets/*.js 2>/dev/null | head -5 || echo "  No se encontraron chunks"
else
    echo "✗ Directorio build NO existe"
fi

echo -e "\n📋 Configuración de Nginx:"
grep -A 5 "location.*\/" /etc/nginx/sites-available/law-analytics.app 2>/dev/null || echo "No se encontró configuración"

echo -e "\n🔧 Headers de caché actuales:"
curl -sI https://lawanalytics.app/ | grep -i "cache\|expires\|etag\|modified"

echo -e "\n📦 Verificando archivos servidos:"
echo "  Index.html:"
curl -s https://lawanalytics.app/ | grep -o "app-version.*content=\"[^\"]*\"" | head -1

echo -e "\n  Service Worker:"
curl -sI https://lawanalytics.app/sw.js | head -3

echo -e "\n🎯 Sugerencias:"
echo "1. Si los chunks no existen, ejecuta: ./deploy.sh"
echo "2. Si nginx no está configurado correctamente, verifica /etc/nginx/sites-available/law-analytics.app"
echo "3. Para ver el panel de debug en móvil: https://lawanalytics.app/debug.html"