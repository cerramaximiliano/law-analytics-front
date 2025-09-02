#!/bin/bash

echo "=== Configuración de Nginx para www.lawanalytics.app ==="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Verificando configuración actual de Nginx...${NC}"
sudo nginx -t

echo ""
echo -e "${YELLOW}2. Verificando certificados SSL...${NC}"
if [ -f "/etc/letsencrypt/live/lawanalytics.app/fullchain.pem" ]; then
    echo -e "${GREEN}✓ Certificado SSL encontrado para lawanalytics.app${NC}"
else
    echo -e "${RED}✗ Certificado SSL no encontrado${NC}"
    echo ""
    echo -e "${YELLOW}Necesitas generar/expandir el certificado SSL para incluir www:${NC}"
    echo "sudo certbot certonly --nginx -d lawanalytics.app -d www.lawanalytics.app"
    echo ""
fi

echo ""
echo -e "${YELLOW}3. Para aplicar la configuración:${NC}"
echo ""
echo "# Copia la configuración a Nginx:"
echo "sudo cp nginx-config-fix.conf /etc/nginx/sites-available/lawanalytics.app"
echo ""
echo "# Crea el enlace simbólico si no existe:"
echo "sudo ln -sf /etc/nginx/sites-available/lawanalytics.app /etc/nginx/sites-enabled/"
echo ""
echo "# Verifica la configuración:"
echo "sudo nginx -t"
echo ""
echo "# Si todo está bien, recarga Nginx:"
echo "sudo systemctl reload nginx"
echo ""

echo -e "${YELLOW}4. Comandos adicionales útiles:${NC}"
echo ""
echo "# Ver logs de error:"
echo "sudo tail -f /var/log/nginx/error.log"
echo ""
echo "# Ver configuración actual:"
echo "sudo cat /etc/nginx/sites-enabled/lawanalytics.app"
echo ""
echo "# Expandir certificado SSL para incluir www (si es necesario):"
echo "sudo certbot --expand -d lawanalytics.app -d www.lawanalytics.app"
echo ""

echo -e "${GREEN}=== Script completado ===${NC}"