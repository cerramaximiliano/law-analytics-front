#!/bin/bash

# Script para configurar sudo sin contraseña para deploy.sh
# Ejecutar en el servidor de producción

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo -e "${BLUE}🔐 Configuración de Sudo para Deploy${NC}"
echo "========================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "deploy.sh" ]; then
	echo -e "${RED}Error: No se encontró deploy.sh en este directorio${NC}"
	echo "Ejecuta este script desde /var/www/law-analytics-front"
	exit 1
fi

# Obtener información del usuario y ruta
CURRENT_USER=$(whoami)
CURRENT_DIR=$(pwd)
SUDOERS_FILE="/etc/sudoers.d/github-deploy"

echo -e "${YELLOW}Información detectada:${NC}"
echo "  Usuario: $CURRENT_USER"
echo "  Directorio: $CURRENT_DIR"
echo "  Script: $CURRENT_DIR/deploy.sh"
echo ""

# Confirmar
read -p "¿Es correcta esta información? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
	echo -e "${RED}Operación cancelada${NC}"
	exit 1
fi

echo ""
echo -e "${YELLOW}Selecciona la opción de configuración:${NC}"
echo "  1) Permitir deploy.sh completo (MÁS SIMPLE, RECOMENDADO)"
echo "  2) Permitir solo comandos nginx específicos (MÁS GRANULAR)"
echo ""
read -p "Opción (1 o 2): " -n 1 -r OPTION
echo ""

# Crear el contenido del archivo sudoers según la opción
if [ "$OPTION" = "1" ]; then
	SUDOERS_CONTENT="# GitHub Actions - Deploy automático
$CURRENT_USER ALL=(ALL) NOPASSWD: $CURRENT_DIR/deploy.sh"
	echo -e "${BLUE}Configurando para permitir deploy.sh completo...${NC}"
elif [ "$OPTION" = "2" ]; then
	SUDOERS_CONTENT="# GitHub Actions - Deploy automático (comandos específicos)
$CURRENT_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx
$CURRENT_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
$CURRENT_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
$CURRENT_USER ALL=(ALL) NOPASSWD: /bin/systemctl status nginx"
	echo -e "${BLUE}Configurando para permitir comandos nginx específicos...${NC}"
else
	echo -e "${RED}Opción inválida${NC}"
	exit 1
fi

# Crear archivo temporal con el contenido
TEMP_FILE=$(mktemp)
echo "$SUDOERS_CONTENT" > "$TEMP_FILE"

# Verificar sintaxis del archivo
sudo visudo -c -f "$TEMP_FILE" > /dev/null 2>&1
if [ $? -ne 0 ]; then
	echo -e "${RED}Error: La sintaxis del archivo sudoers es inválida${NC}"
	rm "$TEMP_FILE"
	exit 1
fi

# Copiar el archivo a sudoers.d
echo -e "${YELLOW}Creando archivo de configuración...${NC}"
sudo cp "$TEMP_FILE" "$SUDOERS_FILE"
sudo chmod 440 "$SUDOERS_FILE"
sudo chown root:root "$SUDOERS_FILE"
rm "$TEMP_FILE"

echo -e "${GREEN}✓ Archivo creado: $SUDOERS_FILE${NC}"
echo ""

# Mostrar contenido
echo -e "${YELLOW}Contenido del archivo:${NC}"
sudo cat "$SUDOERS_FILE"
echo ""

# Verificar la configuración
echo -e "${YELLOW}Verificando configuración...${NC}"

if [ "$OPTION" = "1" ]; then
	# Probar deploy.sh
	if sudo -n "$CURRENT_DIR/deploy.sh" --help > /dev/null 2>&1; then
		echo -e "${GREEN}✅ ¡Configuración exitosa!${NC}"
		echo -e "${GREEN}   sudo deploy.sh funciona sin contraseña${NC}"
	else
		echo -e "${RED}❌ Error: sudo sigue pidiendo contraseña${NC}"
		echo "   Revisa la configuración manualmente:"
		echo "   sudo visudo -f $SUDOERS_FILE"
		exit 1
	fi
elif [ "$OPTION" = "2" ]; then
	# Probar nginx
	if sudo -n /usr/sbin/nginx -t > /dev/null 2>&1; then
		echo -e "${GREEN}✅ ¡Configuración exitosa!${NC}"
		echo -e "${GREEN}   sudo nginx funciona sin contraseña${NC}"
	else
		echo -e "${RED}❌ Error: sudo sigue pidiendo contraseña${NC}"
		echo "   Revisa la configuración manualmente:"
		echo "   sudo visudo -f $SUDOERS_FILE"
		exit 1
	fi
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ Configuración completada${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo "  1. Configurar los GitHub Secrets"
echo "  2. Hacer push a main"
echo "  3. Ver el deploy automático en acción"
echo ""
echo -e "${YELLOW}Para probar manualmente:${NC}"
if [ "$OPTION" = "1" ]; then
	echo "  sudo -n ./deploy.sh --help"
else
	echo "  sudo -n /usr/sbin/nginx -t"
	echo "  sudo -n /bin/systemctl reload nginx"
fi
echo ""
