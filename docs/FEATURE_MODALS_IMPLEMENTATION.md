# Implementación de Modals de Features

Este documento detalla la implementación de modals para las cards de herramientas en la landing page.

---

## Estado: ✅ IMPLEMENTADO

Última actualización: Diciembre 2024

---

## Objetivo

Cuando un usuario hace click en una card de herramienta, se abre un modal con:
- Información detallada de la herramienta
- Beneficios específicos
- CTA para registro con atribución

Esto mejora la UX y permite tracking preciso de intención por feature.

---

## Diseño del Modal

### Estructura Visual

```
┌─────────────────────────────────────────────────────┐
│  [X]                                                │
│                                                     │
│         [Ícono Grande]                              │
│                                                     │
│         TÍTULO DE LA HERRAMIENTA                    │
│                                                     │
│  Descripción expandida de la herramienta con más    │
│  detalle sobre qué hace y cómo ayuda al usuario.    │
│                                                     │
│  ✓ Beneficio 1                                      │
│  ✓ Beneficio 2                                      │
│  ✓ Beneficio 3                                      │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │       Probar [Feature] Gratis               │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  No requiere tarjeta · Registrate en 1 minuto       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Especificaciones

| Elemento | Especificación |
|----------|----------------|
| Ancho | Max 500px, responsive |
| Posición | Centrado con overlay oscuro |
| Animación | Fade in + scale (framer-motion) |
| Cierre | Click en X, overlay, o tecla Escape |
| Ícono | 64px, color de la herramienta |
| CTA | Botón primario, full width, con query params |
| Scroll | Tracking al 50% de scroll |

---

## Contenido por Feature (Actualizado)

### 1. Carpetas / Expedientes

| Campo | Contenido |
|-------|-----------|
| Título | Expedientes Organizados |
| Descripción | Centralizá todas tus causas en un solo lugar. Gestioná movimientos, estados, plazos y documentos sin perder tiempo buscando información. |
| Beneficio 1 | Vista unificada de todas tus causas activas |
| Beneficio 2 | Seguimiento automático de movimientos en PJN y MEV |
| Beneficio 3 | Alertas de vencimientos y plazos |
| CTA | Probar Expedientes Gratis |
| URL | `/register?source=modal&feature=carpetas` |

### 2. Contactos / Clientes

| Campo | Contenido |
|-------|-----------|
| Título | Clientes Centralizados |
| Descripción | Toda la información de tus clientes en un solo lugar. Datos de contacto, causas asociadas, historial de interacciones y seguimiento personalizado. |
| Beneficio 1 | Ficha completa de cada cliente |
| Beneficio 2 | Causas asociadas a cada cliente |
| Beneficio 3 | Búsqueda rápida por nombre o documento |
| CTA | Probar Clientes Gratis |
| URL | `/register?source=modal&feature=contactos` |

### 3. Calendario / Vencimientos

| Campo | Contenido |
|-------|-----------|
| Título | Agenda Inteligente |
| Descripción | No te olvides nunca más de un vencimiento. Agenda integrada con alertas automáticas y sincronización con Google Calendar. |
| Beneficio 1 | Alertas automáticas de vencimientos |
| Beneficio 2 | Sincronización con Google Calendar |
| Beneficio 3 | Recordatorios por email |
| CTA | Probar Agenda Gratis |
| URL | `/register?source=modal&feature=calendario` |

### 4. Cálculos Laborales

| Campo | Contenido |
|-------|-----------|
| Título | Calculadora Laboral Precisa |
| Descripción | Calculá indemnizaciones, despidos, SAC y liquidaciones con precisión legal. Siempre actualizado con los últimos topes y valores. |
| Beneficio 1 | Cálculo de indemnizaciones por despido |
| Beneficio 2 | Liquidaciones finales completas |
| Beneficio 3 | Topes legales siempre actualizados |
| CTA | Probar Calculadora Gratis |
| URL | `/register?source=modal&feature=calculos` |

### 5. Intereses y Actualización

| Campo | Contenido |
|-------|-----------|
| Título | Actualización de Montos |
| Descripción | Actualizá montos en segundos con tasas BCRA, actas y criterios judiciales. Cálculo automático con diferentes métodos. |
| Beneficio 1 | Tasas BCRA y BNA actualizadas diariamente |
| Beneficio 2 | Múltiples métodos de cálculo |
| Beneficio 3 | Exportación de liquidaciones |
| CTA | Probar Actualización Gratis |
| URL | `/register?source=modal&feature=intereses` |

### 6. Tareas

| Campo | Contenido |
|-------|-----------|
| Título | Gestión de Tareas |
| Descripción | Organizá el trabajo diario del estudio. Asigná tareas, definí prioridades y controlá plazos de manera simple. |
| Beneficio 1 | Prioridades y fechas límite |
| Beneficio 2 | Notificaciones de vencimiento |
| Beneficio 3 | Asignación de tareas a carpetas |
| CTA | Probar Tareas Gratis |
| URL | `/register?source=modal&feature=tareas` |

### 7. Sistema de Citas

| Campo | Contenido |
|-------|-----------|
| Título | Reservas Online |
| Descripción | Dejá que tus clientes agenden solos. Sistema de reservas con link compartible, confirmaciones automáticas y agenda sincronizada. |
| Beneficio 1 | Link compartible para agendar |
| Beneficio 2 | Confirmaciones automáticas |
| Beneficio 3 | Sincronización con tu calendario |
| Beneficio 4 | Recordatorios a clientes |
| CTA | Probar Sistema de Citas Gratis |
| URL | `/register?source=modal&feature=sistema_citas` |

---

## Eventos de Tracking (Completos)

### Eventos del Modal

| Evento | Cuándo se dispara | Parámetros |
|--------|-------------------|------------|
| `view_features_section` | Sección visible ≥50% | `section: "features"`, `page: "landing"` |
| `feature_interest` | Click en card | `feature` |
| `feature_modal_open` | Al abrir el modal | `feature` |
| `feature_modal_scroll` | Scroll ≥50% dentro del modal | `feature` |
| `feature_modal_close` | Al cerrar el modal | `feature` |
| `feature_modal_cta_click` | Click en CTA del modal | `feature`, `destination`, `source` |

### Eventos de Registro (con atribución)

| Evento | Cuándo se dispara | Parámetros |
|--------|-------------------|------------|
| `register_view` | Al cargar /register | `source`, `feature` |
| `sign_up` | Registro exitoso | `method`, `source`, `feature` |

### Valores de `feature`

| Feature | Valor |
|---------|-------|
| Carpetas | `carpetas` |
| Contactos | `contactos` |
| Calendario | `calendario` |
| Cálculos | `calculos` |
| Intereses | `intereses` |
| Tareas | `tareas` |
| Sistema Citas | `sistema_citas` |

---

## Implementación en Código

### Archivos Implementados

| Archivo | Descripción |
|---------|-------------|
| `src/utils/gtm.ts` | Funciones de tracking |
| `src/components/FeatureModal.tsx` | Componente modal |
| `src/sections/landing/Technologies.tsx` | Sección con Intersection Observer |
| `src/pages/auth/auth1/register.tsx` | Tracking de register_view y sign_up |
| `src/sections/auth/auth-forms/AuthRegister.tsx` | Tracking de sign_up email |

### Funciones en gtm.ts

```typescript
// Vista de sección (Intersection Observer 50%)
export const trackViewFeaturesSection = (): void => {
  pushGTMEvent("view_features_section", {
    section: "features",
    page: "landing",
  });
};

// Modal open
export const trackFeatureModalOpen = (featureName: string): void => {
  pushGTMEvent("feature_modal_open", { feature: featureName });
};

// Modal scroll (50%)
export const trackFeatureModalScroll = (featureName: string): void => {
  pushGTMEvent("feature_modal_scroll", { feature: featureName });
};

// Modal close
export const trackFeatureModalClose = (featureName: string): void => {
  pushGTMEvent("feature_modal_close", { feature: featureName });
};

// Modal CTA click
export const trackFeatureModalCTAClick = (featureName: string): void => {
  pushGTMEvent("feature_modal_cta_click", {
    feature: featureName,
    destination: "/register",
    source: "modal",
  });
};

// Register view con atribución
export const trackRegisterView = (source?: string, feature?: string): void => {
  pushGTMEvent("register_view", {
    source: source || "direct",
    feature: feature || null,
  });
};

// Sign up con atribución
export const trackSignUp = (method: "email" | "google", source?: string, feature?: string): void => {
  pushGTMEvent("sign_up", {
    method,
    source: source || "direct",
    feature: feature || null,
  });
};
```

---

## Flujo de Usuario Completo

```
1. Usuario ve landing
   → (scroll)

2. Sección Features visible (50%)
   → Dispara: view_features_section

3. Click en card "Expedientes"
   → Dispara: feature_interest (carpetas)
   → Abre modal
   → Dispara: feature_modal_open (carpetas)

4. Scrollea en el modal (50%)
   → Dispara: feature_modal_scroll (carpetas)

5. Click en "Probar Expedientes Gratis"
   → Dispara: feature_modal_cta_click (carpetas)
   → Navega a /register?source=modal&feature=carpetas

6. Ve página de registro
   → Dispara: register_view (source=modal, feature=carpetas)

7. Completa registro (email o Google)
   → Dispara: sign_up (method=email, source=modal, feature=carpetas)
```

---

## Funnel en GA4

### Funnel de Intención por Feature

| Paso | Evento | Lo que indica |
|------|--------|---------------|
| 1 | `view_features_section` | Exposición |
| 2 | `feature_interest` | Interés (curiosidad) |
| 3 | `feature_modal_open` | Consideración |
| 4 | `feature_modal_cta_click` | Alta intención |
| 5 | `sign_up` | Conversión |

**Filtrar por:** `feature` = `carpetas`, `calculos`, etc.

### Preguntas que responde

- ¿Qué feature genera más interés?
- ¿Qué feature convierte mejor?
- ¿Dónde se cae el usuario?
- ¿Qué feature debería ir en el hero o en ads?

---

## Métricas Esperadas

| Métrica | Fórmula | Objetivo |
|---------|---------|----------|
| Tasa de exposición | `view_features_section / page_view` | >60% |
| Tasa de interés | `feature_interest / view_features_section` | >20% |
| Tasa de apertura modal | `modal_open / feature_interest` | >80% |
| Tasa de lectura modal | `modal_scroll / modal_open` | >50% |
| Tasa de click CTA | `modal_cta_click / modal_open` | >25% |
| Tasa de conversión | `sign_up (desde modal) / modal_cta_click` | >30% |

---

## Checklist de Implementación

### Código ✅
- [x] Agregar eventos a `gtm.ts`
- [x] Crear componente `FeatureModal.tsx`
- [x] Agregar datos de contenido por feature
- [x] Integrar modal en `Technologies.tsx`
- [x] Agregar Intersection Observer para `view_features_section`
- [x] Agregar scroll tracking en modal
- [x] Agregar query params a URLs de CTA
- [x] Agregar `register_view` tracking
- [x] Agregar `sign_up` tracking (email y Google)

### GTM (Pendiente configurar)
- [ ] Crear variables de capa de datos
- [ ] Crear activadores para nuevos eventos
- [ ] Crear tags de GA4
- [ ] Publicar GTM

### GA4 (Después de 24-48h)
- [ ] Crear dimensiones personalizadas
- [ ] Marcar `feature_modal_cta_click` como conversión
- [ ] Marcar `sign_up` como conversión
- [ ] Crear Funnel de Intención por Feature

---

## Documentos Relacionados

- [GTM_GA4_SETUP.md](./GTM_GA4_SETUP.md) - Configuración completa de GTM y GA4
- [GA4_FUNNELS.md](./GA4_FUNNELS.md) - Todos los funnels de análisis
