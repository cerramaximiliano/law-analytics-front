#!/bin/bash

# Script para actualizar la configuración de nginx con mejor manejo de caché
# Ruta del archivo de configuración de nginx
NGINX_CONF="/etc/nginx/sites-available/lawanalytics"
BACKUP_FILE="/etc/nginx/sites-available/lawanalytics.backup.$(date +%Y%m%d_%H%M%S)"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Actualizando configuración de nginx para Law Analytics...${NC}"

# Verificar si se está ejecutando como root o con sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Este script debe ejecutarse con sudo${NC}"
   echo "Uso: sudo ./update-nginx-cache.sh"
   exit 1
fi

# Hacer backup del archivo actual
echo -e "${YELLOW}1. Creando backup de la configuración actual...${NC}"
cp "$NGINX_CONF" "$BACKUP_FILE"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup creado: $BACKUP_FILE${NC}"
else
    echo -e "${RED}✗ Error al crear backup${NC}"
    exit 1
fi

# Crear nueva configuración
echo -e "${YELLOW}2. Creando nueva configuración...${NC}"
cat > "$NGINX_CONF" << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name www.lawanalytics.app lawanalytics.app;
    return 301 https://lawanalytics.app$request_uri;
}

# Redirección de www a non-www en HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.lawanalytics.app;

    ssl_certificate /etc/letsencrypt/live/lawanalytics-frontend/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lawanalytics-frontend/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://lawanalytics.app$request_uri;
}

# Servidor principal
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name lawanalytics.app;

    root /var/www/law-analytics-front/build;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/lawanalytics-frontend/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lawanalytics-frontend/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # React Router - configuración principal
    location / {
        try_files $uri $uri/ /index.html;
    }

    # HTML files - sin caché (para actualizaciones inmediatas)
    location ~ \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Service Worker - sin caché (crítico para actualizaciones)
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Assets con hash (Vite genera hashes únicos) - caché largo
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Imágenes, fuentes y otros archivos estáticos - caché moderado
    location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
    
    # JSON y archivos de datos - caché corto
    location ~* \.(json|xml)$ {
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # Compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 10M;
}
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nueva configuración creada${NC}"
else
    echo -e "${RED}✗ Error al crear nueva configuración${NC}"
    exit 1
fi

# Verificar sintaxis de nginx
echo -e "${YELLOW}3. Verificando sintaxis de nginx...${NC}"
nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Sintaxis correcta${NC}"
else
    echo -e "${RED}✗ Error en la sintaxis de nginx${NC}"
    echo -e "${YELLOW}Restaurando configuración anterior...${NC}"
    cp "$BACKUP_FILE" "$NGINX_CONF"
    exit 1
fi

# Recargar nginx
echo -e "${YELLOW}4. Recargando nginx...${NC}"
systemctl reload nginx
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nginx recargado exitosamente${NC}"
else
    echo -e "${RED}✗ Error al recargar nginx${NC}"
    echo -e "${YELLOW}Intentando restaurar configuración anterior...${NC}"
    cp "$BACKUP_FILE" "$NGINX_CONF"
    systemctl reload nginx
    exit 1
fi

echo -e "${GREEN}✅ Configuración actualizada exitosamente!${NC}"
echo ""
echo -e "${YELLOW}Mejoras aplicadas:${NC}"
echo "  • HTML y Service Worker sin caché (actualizaciones inmediatas)"
echo "  • Assets de Vite con caché largo (1 año)"
echo "  • Imágenes y fuentes con caché moderado (30 días)"
echo "  • JSON/XML con caché corto (1 hora)"
echo ""
echo -e "${YELLOW}Backup guardado en:${NC} $BACKUP_FILE"
echo ""
echo -e "${GREEN}La aplicación ahora detectará y aplicará actualizaciones automáticamente.${NC}"
echo -e "${GREEN}Los usuarios no necesitarán hacer Ctrl+Shift+R para ver cambios nuevos.${NC}"