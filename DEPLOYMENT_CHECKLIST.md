# 📋 Checklist de Deployment - Law Analytics

## ✅ Pre-Build (Local)

- [ ] **Type checking**: `npm run type-check`
- [ ] **Linting**: `npm run lint`
- [ ] **Formato**: `npm run format`
- [ ] **Tests unitarios**: `npm run test` (si aplica)

## ✅ Build & Test

- [ ] **Build completo**: `npm run build`
- [ ] **Preview local**: `npm run preview`
- [ ] **Verificación completa**: `npm run build:check`

## ✅ Pruebas Funcionales (en Preview)

### Rutas críticas a probar:

- [ ] `/` - Home
- [ ] `/login` - Login funcional
- [ ] `/apps/folders` - Lista de expedientes
- [ ] `/apps/folders/:id` - Detalle de expediente
- [ ] `/apps/calc` - Calculadoras
- [ ] `/apps/calc/labor` - Calculadora laboral
- [ ] `/apps/chat` - Chat (si usa Socket.io)

### Features críticas:

- [ ] Redux funciona (ver estado en DevTools)
- [ ] Autenticación funciona
- [ ] Modal de cálculos se abre
- [ ] Formularios se envían correctamente
- [ ] No hay errores en consola del navegador
- [ ] No hay warnings de React en producción

## ✅ Análisis de Bundle

- [ ] **Análisis visual**: `npm run build:analyze`
  - Abrir `bundle-stats.html` generado
  - Verificar que no hay chunks muy grandes (>500KB)
  - Verificar que las dependencias están en los chunks correctos

## ✅ Performance

- [ ] **Lighthouse score** > 80 en todas las categorías
- [ ] **Tiempo de carga inicial** < 3 segundos
- [ ] **First Contentful Paint (FCP)** < 1.8s
- [ ] **Largest Contentful Paint (LCP)** < 2.5s

## 🚨 Errores Comunes a Verificar

### En la consola del navegador:

- [ ] No hay `Cannot read properties of undefined`
- [ ] No hay `X is not a function`
- [ ] No hay `Module not found` o errores de import
- [ ] No hay errores 404 de assets

### En Redux DevTools:

- [ ] Estado inicial se carga correctamente
- [ ] Actions se disparan sin errores
- [ ] Reducers actualizan el estado correctamente

### En Network tab:

- [ ] Todos los chunks se cargan exitosamente
- [ ] No hay errores 403/401 inesperados
- [ ] API calls funcionan correctamente

## 📦 Deployment

- [ ] **Variables de entorno** configuradas en el servidor
- [ ] **VITE_BASE_URL** apunta al backend correcto
- [ ] Archivos estáticos servidos con cache headers correctos
- [ ] Verificar en ambiente de staging ANTES de producción

## 🔧 Scripts Útiles

```bash
# Verificación completa pre-deployment
npm run build:check

# Build + Preview para testing local
npm run build:test

# Análisis de bundle (ver qué librerías ocupan espacio)
npm run build:analyze
```

## 📚 Notas Importantes

1. **SIEMPRE probar el build con `npm run preview`** antes de deployar
2. **Revisar consola del navegador** en el preview (F12 → Console)
3. **Probar en modo incógnito** para evitar cache del navegador
4. **Usar diferentes navegadores** (Chrome, Firefox, Safari) si es posible
5. **Verificar responsive** (mobile, tablet, desktop)

## 🐛 Debugging de Errores de Producción

Si algo falla en producción:

1. **Reproducir localmente**:

   ```bash
   npm run build
   npm run preview
   ```

2. **Ver logs en consola** del navegador (F12)

3. **Verificar chunks cargados** en Network tab

4. **Revisar configuración de Vite** (`vite.config.ts`):

   - Manual chunks correctamente configurados
   - Dependencias relacionadas en el mismo chunk

5. **Usar sourcemaps temporalmente** para debug:
   ```typescript
   // vite.config.ts
   build: {
   	sourcemap: true; // Solo para debugging
   }
   ```
