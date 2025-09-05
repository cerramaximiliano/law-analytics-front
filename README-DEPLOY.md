# 📦 Guía de Deployment - Law Analytics

## 🚀 Script Único de Deployment

Solo existe **UN ÚNICO SCRIPT** para deployment: `deploy.sh`

Este script maneja TODO automáticamente:
- ✅ Actualización de código (git pull)
- ✅ Versionado automático
- ✅ Build optimizado con Vite
- ✅ Configuración de caché para archivos estáticos
- ✅ Recarga de nginx

---

## 📝 Instrucciones de Uso

### En tu máquina local (desarrollo):

```bash
# Después de hacer cambios en el código:
./deploy.sh

# El script te indicará hacer commit:
git add -A
git commit -m "feat: descripción de cambios"
git push origin main
```

### En el servidor (producción):

```bash
cd /var/www/law-analytics-front
./deploy.sh
```

**¡Eso es todo!** El script detecta automáticamente si está en el servidor y hace todo lo necesario.

---

## ⚙️ ¿Qué hace el script?

1. **Detecta el entorno** (servidor o local)
2. **Git pull** si está en servidor
3. **Genera versión única** con timestamp
4. **Limpia directorios** de builds anteriores
5. **Construye la aplicación** con `npm run build`
6. **Optimiza index.html** con headers de no-cache
7. **Crea archivo de versión** para tracking
8. **Recarga nginx** automáticamente (si está en servidor)

---

## 🔄 Características Actuales

### ✅ Lo que funciona:
- **Sin Service Workers**: Eliminados completamente para evitar problemas de caché
- **Soporte completo para móviles**: Con polyfills de `regenerator-runtime`
- **Actualizaciones instantáneas**: Sin cachés persistentes
- **Compatible con navegadores antiguos**: Polyfills incluidos
- **Build optimizado**: Chunks separados para mejor performance

### 📱 Compatibilidad Móvil
- **Android**: Chrome, Firefox, navegador Samsung
- **iOS**: Safari, Chrome
- **Navegadores antiguos**: Soporte con polyfills

---

## 🛠️ Solución de Problemas

### Si el build falla con error de permisos:
```bash
# Limpiar caché de TypeScript
rm -rf node_modules/.cache
npm run build
```

### Si el build falla completamente:
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
./deploy.sh
```

### Si nginx no recarga:
```bash
sudo nginx -t  # Verificar configuración
sudo systemctl reload nginx  # Recargar manualmente
```

### Para verificar la versión desplegada:
```bash
curl https://lawanalytics.app/version.json
```

---

## 🔧 Configuración Técnica

### Dependencias Críticas:
- `regenerator-runtime`: Polyfill para async/await en móviles
- `vite`: Build tool (reemplaza a Create React App)
- `typescript`: Sin modo incremental para evitar problemas de permisos

### Estructura de Build:
```
build/
├── index.html (sin caché)
├── assets/ (con caché de 1 año)
│   ├── *.js (chunks con hash)
│   ├── *.css (estilos con hash)
│   └── *.png/jpg/svg (imágenes)
├── version.json (información del deployment)
└── sw.js (archivo vacío por compatibilidad)
```

### Headers de Caché:
- **HTML**: `no-cache, no-store, must-revalidate`
- **JS/CSS/Imágenes**: `public, immutable` con expires de 1 año
- **API**: Sin caché

---

## 📱 Cambios Recientes (2025)

### Problemas Resueltos:
1. **Error "regeneratorRuntime is not defined" en móviles**
   - Solución: Agregado `regenerator-runtime` en polyfills.ts
   
2. **Aplicación mostraba versiones viejas en móviles**
   - Solución: Eliminación completa de Service Workers
   
3. **"Failed to fetch dynamically imported module"**
   - Solución: Sistema de lazy loading con reintentos (`lazyRetry`)
   
4. **Permisos de node_modules/.cache**
   - Solución: Desactivado modo incremental en tsconfig.build.json

### Archivos Eliminados:
- Todos los Service Workers (`sw.js`, `sw-new.js`, `service-worker.js`)
- Archivos de debug (`debug.html`, `test.html`, `error-check.html`)
- Scripts obsoletos (`remove-sw.sh`, `deploy-optimized.sh`, etc.)
- Utilidades no usadas (`swUpdater.ts`, `updateChecker.ts`, `mobileCache.ts`)

---

## ⚠️ IMPORTANTE

### NO hacer:
- ❌ NO agregar Service Workers nuevamente
- ❌ NO crear scripts de deployment alternativos
- ❌ NO modificar la configuración de caché sin testing en móviles
- ❌ NO usar modo incremental de TypeScript (causa problemas de permisos)

### SÍ hacer:
- ✅ Siempre probar en móviles después de cambios importantes
- ✅ Usar el script `deploy.sh` para todos los deployments
- ✅ Mantener `regenerator-runtime` para compatibilidad
- ✅ Verificar que el build complete antes de hacer push

---

## 🚀 Flujo de Deployment Completo

```bash
# 1. En desarrollo - hacer cambios
npm run start  # Desarrollo local

# 2. Construir y verificar
./deploy.sh  # Build local

# 3. Commit y push
git add -A
git commit -m "feat: nuevas características"
git push origin main

# 4. En el servidor
ssh usuario@servidor
cd /var/www/law-analytics-front
./deploy.sh  # Deployment automático

# 5. Verificar
curl https://lawanalytics.app/version.json
```

---

## 📊 Monitoreo Post-Deploy

Para verificar que todo funciona:

1. **Desktop**: Abrir en modo incógnito
2. **Móvil**: Cerrar y reabrir navegador
3. **Verificar versión**: Ver version.json
4. **Logs de nginx**: `tail -f /var/log/nginx/law-analytics.error.log`

---

*Última actualización: Septiembre 2025*
*Sin Service Workers - Sin problemas de caché - 100% compatible con móviles*