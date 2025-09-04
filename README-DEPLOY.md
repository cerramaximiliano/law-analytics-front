# 📦 Guía de Deployment - Law Analytics

## 🚀 Script Único de Deployment

Solo existe **UN ÚNICO SCRIPT** para deployment: `deploy.sh`

Este script maneja TODO automáticamente:
- ✅ Actualización de código (git pull)
- ✅ Versionado automático
- ✅ Limpieza de cachés
- ✅ Build optimizado
- ✅ Service Workers actualizados
- ✅ Eliminación de alerts molestos
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
4. **Limpia cachés antiguos** (elimina alerts)
5. **Construye la aplicación** optimizada
6. **Instala Service Workers** actualizados
7. **Recarga nginx** automáticamente
8. **Muestra resumen** del deployment

---

## 🔄 Características del Deployment

- **Actualizaciones automáticas**: Los usuarios no ven alerts molestos
- **Optimizado para móviles**: Service Workers inteligentes
- **Versionado automático**: Cada build tiene versión única
- **Limpieza de cachés**: Elimina versiones viejas automáticamente
- **Sin intervención manual**: Todo en un comando

---

## 🛠️ Solución de Problemas

### Si el build falla:
```bash
# Limpiar e intentar de nuevo
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

## 📱 Notas sobre Móviles

- Las actualizaciones son **completamente automáticas**
- No aparecen alerts pidiendo confirmación
- El Service Worker se actualiza silenciosamente
- Los usuarios siempre tienen la última versión

---

## ⚠️ IMPORTANTE

**NO crear otros scripts de deployment**. Todo está centralizado en `deploy.sh` para mantener consistencia y evitar errores.

---

*Última actualización: 2025*