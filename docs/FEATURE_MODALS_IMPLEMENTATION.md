# Implementación de Modals de Features

Este documento detalla la implementación de modals para las cards de herramientas en la landing page.

---

## Objetivo

Cuando un usuario hace click en una card de herramienta, se abre un modal con:
- Información detallada de la herramienta
- Beneficios específicos
- CTA para registro

Esto mejora la UX y aumenta las oportunidades de conversión.

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
│  ✓ Beneficio 4                                      │
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
| CTA | Botón primario, full width |

---

## Contenido por Feature

### 1. Carpetas / Expedientes

| Campo | Contenido |
|-------|-----------|
| Título | Expedientes Organizados |
| Descripción | Centralizá todas tus causas en un solo lugar. Gestioná movimientos, estados, plazos y documentos sin perder tiempo buscando información. |
| Beneficio 1 | Vista unificada de todas tus causas activas |
| Beneficio 2 | Seguimiento automático de movimientos |
| Beneficio 3 | Alertas de vencimientos y plazos |
| Beneficio 4 | Historial completo de cada expediente |
| CTA | Probar Expedientes Gratis |

### 2. Contactos / Clientes

| Campo | Contenido |
|-------|-----------|
| Título | Clientes Centralizados |
| Descripción | Toda la información de tus clientes en un solo lugar. Datos de contacto, causas asociadas, historial de interacciones y seguimiento personalizado. |
| Beneficio 1 | Ficha completa de cada cliente |
| Beneficio 2 | Causas asociadas a cada cliente |
| Beneficio 3 | Historial de comunicaciones |
| Beneficio 4 | Búsqueda rápida por nombre o documento |
| CTA | Probar Clientes Gratis |

### 3. Calendario / Vencimientos

| Campo | Contenido |
|-------|-----------|
| Título | Agenda Inteligente |
| Descripción | No te olvides nunca más de un vencimiento. Agenda integrada con alertas automáticas y sincronización con Google Calendar. |
| Beneficio 1 | Alertas automáticas de vencimientos |
| Beneficio 2 | Sincronización con Google Calendar |
| Beneficio 3 | Vista diaria, semanal y mensual |
| Beneficio 4 | Recordatorios por email |
| CTA | Probar Agenda Gratis |

### 4. Cálculos Laborales

| Campo | Contenido |
|-------|-----------|
| Título | Calculadora Laboral Precisa |
| Descripción | Calculá indemnizaciones, despidos, SAC y liquidaciones con precisión legal. Siempre actualizado con los últimos topes y valores. |
| Beneficio 1 | Cálculo de indemnizaciones por despido |
| Beneficio 2 | Liquidaciones finales completas |
| Beneficio 3 | SAC proporcional y aguinaldo |
| Beneficio 4 | Topes legales siempre actualizados |
| CTA | Probar Calculadora Gratis |

### 5. Intereses y Actualización

| Campo | Contenido |
|-------|-----------|
| Título | Actualización de Montos |
| Descripción | Actualizá montos en segundos con tasas BCRA, actas y criterios judiciales. Cálculo automático con diferentes métodos. |
| Beneficio 1 | Tasas BCRA actualizadas diariamente |
| Beneficio 2 | Múltiples métodos de cálculo |
| Beneficio 3 | Exportación de liquidaciones |
| Beneficio 4 | Historial de cálculos realizados |
| CTA | Probar Actualización Gratis |

### 6. Tareas

| Campo | Contenido |
|-------|-----------|
| Título | Gestión de Tareas |
| Descripción | Organizá el trabajo diario del estudio. Asigná tareas, definí prioridades y controlá plazos de manera simple. |
| Beneficio 1 | Asignación de tareas por responsable |
| Beneficio 2 | Prioridades y fechas límite |
| Beneficio 3 | Vista Kanban y lista |
| Beneficio 4 | Notificaciones de vencimiento |
| CTA | Probar Tareas Gratis |

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

---

## Eventos de Tracking

### Nuevos Eventos

| Evento | Cuándo se dispara | Parámetros |
|--------|-------------------|------------|
| `feature_modal_open` | Al abrir el modal | `feature`: nombre del feature |
| `feature_modal_close` | Al cerrar el modal | `feature`: nombre del feature |
| `feature_modal_cta_click` | Al hacer click en CTA del modal | `feature`: nombre del feature |

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

## Configuración GTM

### Variables de Capa de Datos

Ya existe `dlv - feature`, se reutiliza.

### Nuevos Activadores

| Nombre | Tipo | Evento |
|--------|------|--------|
| `CE - feature_modal_open` | Evento personalizado | `feature_modal_open` |
| `CE - feature_modal_close` | Evento personalizado | `feature_modal_close` |
| `CE - feature_modal_cta_click` | Evento personalizado | `feature_modal_cta_click` |

### Nuevos Tags

#### Tag: GA4 - Feature Modal Open

| Campo | Valor |
|-------|-------|
| Tipo | Google Analytics: Evento de GA4 |
| ID de medición | `{{GA4 - Measurement ID}}` |
| Nombre del evento | `feature_modal_open` |
| Parámetro | `feature` = `{{dlv - feature}}` |
| Activador | `CE - feature_modal_open` |

#### Tag: GA4 - Feature Modal Close

| Campo | Valor |
|-------|-------|
| Tipo | Google Analytics: Evento de GA4 |
| ID de medición | `{{GA4 - Measurement ID}}` |
| Nombre del evento | `feature_modal_close` |
| Parámetro | `feature` = `{{dlv - feature}}` |
| Activador | `CE - feature_modal_close` |

#### Tag: GA4 - Feature Modal CTA Click

| Campo | Valor |
|-------|-------|
| Tipo | Google Analytics: Evento de GA4 |
| ID de medición | `{{GA4 - Measurement ID}}` |
| Nombre del evento | `feature_modal_cta_click` |
| Parámetro | `feature` = `{{dlv - feature}}` |
| Activador | `CE - feature_modal_cta_click` |

---

## Configuración GA4

### Nueva Conversión

Marcar como evento clave:
- `feature_modal_cta_click`

### Dimensión Personalizada

Ya existe la dimensión `Feature` con parámetro `feature`, se reutiliza.

---

## Implementación en Código

### Archivos a Modificar/Crear

| Archivo | Acción |
|---------|--------|
| `src/utils/gtm.ts` | Agregar nuevos eventos |
| `src/components/FeatureModal.tsx` | Crear componente modal |
| `src/sections/landing/Technologies.tsx` | Integrar modal |

### Nuevas Funciones en gtm.ts

```typescript
// Track feature modal open
export const trackFeatureModalOpen = (featureName: string): void => {
  pushGTMEvent("feature_modal_open", { feature: featureName });
};

// Track feature modal close
export const trackFeatureModalClose = (featureName: string): void => {
  pushGTMEvent("feature_modal_close", { feature: featureName });
};

// Track feature modal CTA click
export const trackFeatureModalCTAClick = (featureName: string): void => {
  pushGTMEvent("feature_modal_cta_click", { feature: featureName });
};
```

### Nuevos Eventos en GTMEvents

```typescript
export const GTMEvents = {
  // ... eventos existentes
  FEATURE_MODAL_OPEN: "feature_modal_open",
  FEATURE_MODAL_CLOSE: "feature_modal_close",
  FEATURE_MODAL_CTA_CLICK: "feature_modal_cta_click",
} as const;
```

---

## Checklist de Implementación

### Código
- [ ] Agregar eventos a `gtm.ts`
- [ ] Crear componente `FeatureModal.tsx`
- [ ] Agregar datos de contenido por feature
- [ ] Integrar modal en `Technologies.tsx`
- [ ] Testing de eventos

### GTM
- [ ] Crear activador `CE - feature_modal_open`
- [ ] Crear activador `CE - feature_modal_close`
- [ ] Crear activador `CE - feature_modal_cta_click`
- [ ] Crear tag `GA4 - Feature Modal Open`
- [ ] Crear tag `GA4 - Feature Modal Close`
- [ ] Crear tag `GA4 - Feature Modal CTA Click`
- [ ] Publicar GTM

### GA4
- [ ] Marcar `feature_modal_cta_click` como evento clave
- [ ] Crear Funnel 7: Feature Modal

---

## Flujo de Usuario Esperado

```
1. Usuario ve landing
2. Scrollea a Herramientas
3. Click en card "Expedientes"
   → Dispara: feature_interest (carpetas)
   → Abre modal
   → Dispara: feature_modal_open (carpetas)
4. Lee beneficios
5. Click en "Probar Expedientes Gratis"
   → Dispara: feature_modal_cta_click (carpetas)
   → Navega a /register
6. Completa registro
   → Dispara: register_complete
```

---

## Métricas Esperadas

| Métrica | Fórmula | Objetivo |
|---------|---------|----------|
| Tasa de apertura de modal | `modal_open / feature_interest` | >50% |
| Tasa de click en CTA modal | `modal_cta_click / modal_open` | >20% |
| Conversión desde modal | `register_complete (desde modal) / modal_cta_click` | >30% |
