#!/bin/bash

# Script para instalar dependencias de Puppeteer/Chrome headless en el servidor de producción
# Específicamente para resolver el error: libX11-xcb.so.1: cannot open shared object file

echo "======================================================"
echo "📦 Instalando dependencias para Puppeteer/React-Snap"
echo "======================================================"

# Detectar el sistema operativo
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    echo "❌ No se pudo detectar el sistema operativo"
    exit 1
fi

echo "🔍 Sistema detectado: $OS $VER"

# Para Ubuntu/Debian
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    echo "📦 Instalando paquetes para Ubuntu/Debian..."
    
    # Actualizar lista de paquetes
    sudo apt-get update
    
    # Instalar dependencias esenciales de Chrome/Chromium
    sudo apt-get install -y \
        libx11-xcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxi6 \
        libxtst6 \
        libnss3 \
        libcups2 \
        libxss1 \
        libxrandr2 \
        libasound2 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libgtk-3-0 \
        libgbm1 \
        libxshmfence1 \
        libglu1-mesa \
        libdrm2
    
    # Dependencias adicionales que podrían ser necesarias
    sudo apt-get install -y \
        ca-certificates \
        fonts-liberation \
        libappindicator3-1 \
        libnspr4 \
        lsb-release \
        xdg-utils \
        wget
    
    echo "✅ Dependencias instaladas exitosamente para Ubuntu/Debian"

# Para CentOS/RHEL/Rocky/AlmaLinux
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "rocky" ] || [ "$OS" = "almalinux" ]; then
    echo "📦 Instalando paquetes para CentOS/RHEL/Rocky/AlmaLinux..."
    
    # Instalar dependencias
    sudo yum install -y \
        libX11-xcb \
        libXcomposite \
        libXcursor \
        libXdamage \
        libXi \
        libXtst \
        cups-libs \
        libXScrnSaver \
        libXrandr \
        alsa-lib \
        atk \
        gtk3 \
        ipa-gothic-fonts \
        xorg-x11-fonts-100dpi \
        xorg-x11-fonts-75dpi \
        xorg-x11-fonts-cyrillic \
        xorg-x11-fonts-misc \
        xorg-x11-fonts-Type1 \
        xorg-x11-utils \
        libdrm \
        libgbm \
        libxshmfence \
        mesa-libgbm
    
    # Dependencias adicionales
    sudo yum install -y \
        nss \
        nspr \
        ca-certificates \
        liberation-fonts \
        wget
    
    echo "✅ Dependencias instaladas exitosamente para CentOS/RHEL"

# Para Amazon Linux 2
elif [ "$OS" = "amzn" ]; then
    echo "📦 Instalando paquetes para Amazon Linux..."
    
    sudo yum install -y \
        libX11-xcb \
        libXcomposite \
        libXcursor \
        libXdamage \
        libXext \
        libXi \
        libXtst \
        cups-libs \
        libXScrnSaver \
        libXrandr \
        alsa-lib \
        atk \
        gtk3 \
        ipa-gothic-fonts
    
    echo "✅ Dependencias instaladas exitosamente para Amazon Linux"

else
    echo "⚠️ Sistema operativo no reconocido: $OS"
    echo "Por favor, instala manualmente las siguientes librerías:"
    echo "- libX11-xcb"
    echo "- libXcomposite" 
    echo "- libXcursor"
    echo "- libXdamage"
    echo "- libXi"
    echo "- libXtst"
    echo "- NSS"
    echo "- CUPS"
    echo "- libXScrnSaver"
    echo "- libXrandr"
    echo "- ALSA"
    echo "- ATK"
    echo "- GTK3"
    exit 1
fi

echo ""
echo "======================================================"
echo "🎉 Instalación completada!"
echo "======================================================"
echo ""
echo "📝 Próximos pasos:"
echo "1. Navega a tu directorio del proyecto:"
echo "   cd /var/www/law-analytics-front"
echo ""
echo "2. Ejecuta el build:"
echo "   npm run build"
echo ""
echo "3. Si aún hay errores, ejecuta:"
echo "   ldd node_modules/puppeteer/.local-chromium/linux-*/chrome-linux/chrome | grep 'not found'"
echo "   para ver si faltan más dependencias"
echo ""
echo "💡 Tip: Si el build sigue fallando, puedes usar:"
echo "   SKIP_REACT_SNAP=true npm run build"
echo "   para omitir temporalmente react-snap"