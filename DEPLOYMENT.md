# Guía de Deployment con React-Snap

## Instalación de Dependencias en el Servidor de Producción

React-snap requiere Chrome/Chromium headless para generar HTML estático. Si encuentras el error:
```
error while loading shared libraries: libX11-xcb.so.1: cannot open shared object file
```

### Paso 1: Instalar Dependencias

En el servidor de producción, ejecuta:

```bash
# 1. Obtener el script de instalación
cd /var/www/law-analytics-front
chmod +x install-puppeteer-deps.sh

# 2. Ejecutar el script
sudo ./install-puppeteer-deps.sh
```

El script detectará automáticamente tu sistema operativo (Ubuntu, Debian, CentOS, RHEL, Amazon Linux) e instalará las dependencias necesarias.

### Paso 2: Build de Producción

Una vez instaladas las dependencias:

```bash
# Build normal (con react-snap)
npm run build

# O si prefieres ser explícito
npm run build:prod
```

### Alternativas de Build

Si el servidor no puede ejecutar react-snap:

```bash
# Opción 1: Omitir react-snap temporalmente
SKIP_REACT_SNAP=true npm run build

# Opción 2: Usar el script sin react-snap
npm run build:ci
```

## Verificación

Para verificar que el contenido estático se generó correctamente:

```bash
# Verificar que existen los archivos HTML
ls -la build/*.html
ls -la build/*/index.html

# Verificar contenido
grep "Law Analytics" build/index.html
grep "Política de Privacidad" build/privacy-policy/index.html
```

## Troubleshooting

### Si siguen faltando dependencias

Identifica qué librerías faltan:
```bash
ldd node_modules/puppeteer/.local-chromium/linux-*/chrome-linux/chrome | grep "not found"
```

### Para Ubuntu/Debian

Instalación manual completa:
```bash
sudo apt-get update
sudo apt-get install -y \
    libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 \
    libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 \
    libasound2 libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0 \
    libgbm1 libxshmfence1 libglu1-mesa libdrm2
```

### Para CentOS/RHEL

```bash
sudo yum install -y \
    libX11-xcb libXcomposite libXcursor libXdamage \
    libXi libXtst cups-libs libXScrnSaver libXrandr \
    alsa-lib atk gtk3 nss
```

## Scripts Disponibles

- `npm run build` - Build estándar (ejecuta react-snap si no se omite)
- `npm run build:prod` - Build explícito con react-snap
- `npm run build:ci` - Build sin react-snap (para CI/CD)
- `SKIP_REACT_SNAP=true npm run build` - Omitir react-snap con variable de entorno

## Notas Importantes

1. **Primera vez**: La instalación de dependencias solo se hace una vez por servidor
2. **Performance**: React-snap puede tardar 1-2 minutos extra en el build
3. **Beneficios**: Mejor SEO y permite verificación de Google Cloud
4. **Fallback**: Si react-snap falla, la app funciona normalmente (pero sin pre-rendering)