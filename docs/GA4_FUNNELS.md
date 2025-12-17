# Funnels de GA4 para Landing Page

Este documento detalla todos los funnels configurados y recomendados para analizar el comportamiento de usuarios en la landing page.

---

## Funnel 1: Journey Principal (Activo)

### Objetivo
Medir el recorrido completo del usuario desde que llega hasta que hace click en el CTA de registro.

### Configuración

| Paso | Nombre | Evento | Parámetro |
|------|--------|--------|-----------|
| 1 | Visita Landing | `page_view` | - |
| 2 | Ve Herramientas | `scroll_section` | `section_name` = `herramientas` |
| 3 | Ve Prueba Pagar | `scroll_section` | `section_name` = `prueba_pagar` |
| 4 | Click CTA | `cta_click_prueba_pagar` | - |

### Qué mide cada paso

| Paso | Lo que indica | Drop-off alto significa |
|------|---------------|------------------------|
| Visita → Herramientas | ¿El hero enganchó? | Mejorar propuesta de valor |
| Herramientas → Prueba Pagar | ¿Las cards convencen? | Revisar beneficios/dolor |
| Prueba Pagar → Click CTA | ¿El CTA es efectivo? | Mejorar botón/urgencia |

### Segmentos recomendados
- Instagram vs Orgánico
- Mobile vs Desktop

---

## Funnel 2: Feature Interest

### Objetivo
Medir si los usuarios que interactúan con las cards de herramientas convierten más.

### Configuración

| Paso | Nombre | Evento | Parámetro |
|------|--------|--------|-----------|
| 1 | Visita Landing | `page_view` | - |
| 2 | Click en Card | `feature_interest` | (cualquier valor) |
| 3 | Click CTA | `cta_click_prueba_pagar` | - |

### Insight esperado
- ¿Los que exploran herramientas convierten más?
- ¿Vale la pena destacar más las cards?

---

## Funnel 3: Feature Específico - Carpetas

### Objetivo
Medir la conversión de usuarios interesados específicamente en Carpetas/Expedientes.

### Configuración

| Paso | Nombre | Evento | Parámetro |
|------|--------|--------|-----------|
| 1 | Click en Carpetas | `feature_interest` | `feature` = `carpetas` |
| 2 | Click CTA | `cta_click_prueba_pagar` | - |

### Variantes
Crear funnels similares para cada feature:

| Funnel | feature value |
|--------|---------------|
| 3a - Carpetas | `carpetas` |
| 3b - Contactos | `contactos` |
| 3c - Calendario | `calendario` |
| 3d - Cálculos | `calculos` |
| 3e - Intereses | `intereses` |
| 3f - Tareas | `tareas` |
| 3g - Sistema Citas | `sistema_citas` |

### Insight esperado
- ¿Qué herramienta "vende" mejor?
- ¿En cuál enfocar el marketing?

---

## Funnel 4: Comparativo de CTAs

### Objetivo
Comparar qué ubicación de CTA genera más conversiones.

### Configuración - 3 Funnels Separados

**Funnel 4a - CTA Hero:**

| Paso | Evento |
|------|--------|
| 1 | `page_view` |
| 2 | `cta_click_hero` |

**Funnel 4b - CTA Sistema Citas:**

| Paso | Evento |
|------|--------|
| 1 | `page_view` |
| 2 | `cta_click_citas` |

**Funnel 4c - CTA Prueba/Pagar:**

| Paso | Evento |
|------|--------|
| 1 | `page_view` |
| 2 | `cta_click_prueba_pagar` |

### Insight esperado
- ¿Dónde hacen más click?
- ¿El CTA del hero es suficiente o necesitan ver más?

---

## Funnel 5: Journey Completo con Registro

### Objetivo
Medir el funnel completo desde visita hasta registro completado.

### Configuración

| Paso | Nombre | Evento | Parámetro |
|------|--------|--------|-----------|
| 1 | Visita Landing | `page_view` | - |
| 2 | Ve Herramientas | `scroll_section` | `section_name` = `herramientas` |
| 3 | Click CTA | `cta_click_prueba_pagar` | - |
| 4 | Inicia Registro | `register_start` | - |
| 5 | Completa Registro | `register_complete` | - |

### Insight esperado
- ¿Cuántos que hacen click realmente se registran?
- ¿Dónde abandonan el registro?

---

## Funnel 6: Engagement Profundo

### Objetivo
Medir qué porcentaje de usuarios ve toda la landing page.

### Configuración

| Paso | Nombre | Evento | Parámetro |
|------|--------|--------|-----------|
| 1 | Visita Landing | `page_view` | - |
| 2 | Ve Herramientas | `scroll_section` | `section_name` = `herramientas` |
| 3 | Ve Integraciones | `scroll_section` | `section_name` = `integraciones` |
| 4 | Ve Prueba/Pagar | `scroll_section` | `section_name` = `prueba_pagar` |
| 5 | Ve Testimonios | `scroll_section` | `section_name` = `testimonios` |
| 6 | Ve Contacto | `scroll_section` | `section_name` = `contacto` |

### Insight esperado
- ¿Cuántos ven toda la página?
- ¿Qué sección hace que abandonen?

---

## Funnel 7: Feature Modal (Próximo a implementar)

### Objetivo
Medir la efectividad de los modals de detalle de features.

### Configuración

| Paso | Nombre | Evento | Parámetro |
|------|--------|--------|-----------|
| 1 | Click en Card | `feature_interest` | (cualquier feature) |
| 2 | Abre Modal | `feature_modal_open` | `feature` = nombre |
| 3 | Click CTA Modal | `feature_modal_cta_click` | `feature` = nombre |
| 4 | Inicia Registro | `register_start` | - |

### Insight esperado
- ¿Los modals mejoran la conversión?
- ¿Qué feature en modal convierte mejor?

---

## Cómo Crear un Funnel en GA4

### Paso 1: Crear Exploración
1. **Explorar** > **En blanco**
2. Cambiar **Técnica** a **Exploración del embudo**

### Paso 2: Configurar Pasos
1. En "Configuración", click en **Pasos** > lápiz
2. **Agregar paso** para cada paso
3. Configurar evento y parámetros
4. **Aplicar**

### Paso 3: Agregar Desglose (Opcional)
1. En "Variables", agregar dimensiones:
   - `Fuente/medio de la sesión`
   - `Categoría de dispositivo`
2. Arrastrar a **Desglose**

### Paso 4: Configurar Opciones
- **Embudo cerrado:** Solo secuencias exactas
- **Embudo abierto:** Cualquier usuario en cada paso
- **Mostrar tiempo transcurrido:** Ver cuánto tardan

### Paso 5: Guardar
- Click en el título y renombrar
- Se guarda automáticamente

---

## Segmentos Recomendados

### Segmento: Tráfico Instagram
- **Tipo:** Segmento de sesión
- **Condición:** `Fuente de la sesión` contiene `instagram`

### Segmento: Mobile
- **Tipo:** Segmento de sesión
- **Condición:** `Categoría de dispositivo` = `mobile`

### Segmento: Desktop
- **Tipo:** Segmento de sesión
- **Condición:** `Categoría de dispositivo` = `desktop`

### Segmento: Usuarios que Interactúan con Features
- **Tipo:** Segmento de usuario
- **Condición:** Evento `feature_interest` ocurrió

---

## Checklist de Implementación

### Funnels Activos
- [x] Funnel 1: Journey Principal
- [ ] Funnel 2: Feature Interest
- [ ] Funnel 3: Feature Específico (x7)
- [ ] Funnel 4: Comparativo de CTAs (x3)
- [ ] Funnel 5: Journey Completo con Registro
- [ ] Funnel 6: Engagement Profundo
- [ ] Funnel 7: Feature Modal (requiere implementación de modals)

### Segmentos
- [x] Tráfico Instagram
- [ ] Mobile
- [ ] Desktop
- [ ] Usuarios que Interactúan con Features
