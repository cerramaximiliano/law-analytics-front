# Configuración de GTM y GA4 para Landing Page

## Resumen de Eventos Implementados

### 1. Eventos de Scroll por Sección
Se disparan automáticamente cuando el usuario hace scroll y cada sección se hace visible (30% visible).

| Evento | section_name | Cuándo se dispara |
|--------|--------------|-------------------|
| `scroll_section` | `hero` | Hero visible |
| `scroll_section` | `herramientas` | Cards de herramientas visibles |
| `scroll_section` | `integraciones` | Logos PJN/MEV visibles |
| `scroll_section` | `prueba_pagar` | Sección "Prueba antes de pagar" visible |
| `scroll_section` | `testimonios` | Testimonios visibles |
| `scroll_section` | `contacto` | Formulario de contacto visible |

### 2. Eventos de CTA (Conversiones)

| Evento | cta_location | Botón |
|--------|--------------|-------|
| `cta_click_hero` | `hero` | "Probar Gratis" (hero principal) |
| `cta_click_citas` | `citas` | "Activar sistema de citas" (card destacada) |
| `cta_click_prueba_pagar` | `prueba_pagar` | "Probar gratis ahora" / "Registrarse Gratis" |

### 3. Evento de Feature Interest
Se dispara cuando el usuario hace click en una card de herramienta.

| Evento | Parámetro | Valores posibles |
|--------|-----------|------------------|
| `feature_interest` | `feature` | `carpetas`, `contactos`, `calendario`, `calculos`, `intereses`, `tareas`, `sistema_citas` |

### 4. Evento de High Scroll sin CTA (Instagram)
Se dispara cuando un usuario de Instagram hace scroll hasta "herramientas" pero no hace click en ningún CTA.

| Evento | Parámetro | Valor |
|--------|-----------|-------|
| `high_scroll_no_cta` | `source` | `instagram` |

---

## Configuración en Google Tag Manager

### Paso 1: Crear Variables de Capa de Datos

1. Ve a **Variables** > **Nueva** > **Variable de capa de datos**
2. Crea las siguientes variables:

| Nombre Variable | Nombre en Capa de Datos |
|-----------------|-------------------------|
| `dlv - section_name` | `section_name` |
| `dlv - cta_location` | `cta_location` |
| `dlv - feature` | `feature` |
| `dlv - source` | `source` |

### Paso 2: Crear Activadores (Triggers)

#### A. Activador para Scroll por Sección
- **Nombre:** `CE - scroll_section`
- **Tipo:** Evento personalizado
- **Nombre del evento:** `scroll_section`

#### B. Activador para CTA Hero
- **Nombre:** `CE - cta_click_hero`
- **Tipo:** Evento personalizado
- **Nombre del evento:** `cta_click_hero`

#### C. Activador para CTA Citas
- **Nombre:** `CE - cta_click_citas`
- **Tipo:** Evento personalizado
- **Nombre del evento:** `cta_click_citas`

#### D. Activador para CTA Prueba/Pagar
- **Nombre:** `CE - cta_click_prueba_pagar`
- **Tipo:** Evento personalizado
- **Nombre del evento:** `cta_click_prueba_pagar`

#### E. Activador para Feature Interest
- **Nombre:** `CE - feature_interest`
- **Tipo:** Evento personalizado
- **Nombre del evento:** `feature_interest`

#### F. Activador para High Scroll No CTA
- **Nombre:** `CE - high_scroll_no_cta`
- **Tipo:** Evento personalizado
- **Nombre del evento:** `high_scroll_no_cta`

### Paso 3: Crear Tags de GA4

#### A. Tag: GA4 - Scroll Section
- **Tipo:** Google Analytics: Evento de GA4
- **ID de medición:** Tu ID de GA4
- **Nombre del evento:** `scroll_section`
- **Parámetros del evento:**
  - `section_name` = `{{dlv - section_name}}`
- **Activador:** `CE - scroll_section`

#### B. Tag: GA4 - CTA Click Hero
- **Tipo:** Google Analytics: Evento de GA4
- **Nombre del evento:** `cta_click_hero`
- **Parámetros del evento:**
  - `cta_location` = `{{dlv - cta_location}}`
- **Activador:** `CE - cta_click_hero`

#### C. Tag: GA4 - CTA Click Citas
- **Tipo:** Google Analytics: Evento de GA4
- **Nombre del evento:** `cta_click_citas`
- **Parámetros del evento:**
  - `cta_location` = `{{dlv - cta_location}}`
- **Activador:** `CE - cta_click_citas`

#### D. Tag: GA4 - CTA Click Prueba Pagar
- **Tipo:** Google Analytics: Evento de GA4
- **Nombre del evento:** `cta_click_prueba_pagar`
- **Parámetros del evento:**
  - `cta_location` = `{{dlv - cta_location}}`
- **Activador:** `CE - cta_click_prueba_pagar`

#### E. Tag: GA4 - Feature Interest
- **Tipo:** Google Analytics: Evento de GA4
- **Nombre del evento:** `feature_interest`
- **Parámetros del evento:**
  - `feature` = `{{dlv - feature}}`
- **Activador:** `CE - feature_interest`

#### F. Tag: GA4 - High Scroll No CTA
- **Tipo:** Google Analytics: Evento de GA4
- **Nombre del evento:** `high_scroll_no_cta`
- **Parámetros del evento:**
  - `source` = `{{dlv - source}}`
- **Activador:** `CE - high_scroll_no_cta`

---

## Configuración en GA4

### Paso 1: Registrar Dimensiones Personalizadas

Ve a **Admin** > **Definiciones personalizadas** > **Crear dimensión personalizada**

| Nombre | Parámetro del evento | Ámbito |
|--------|---------------------|--------|
| Section Name | `section_name` | Evento |
| CTA Location | `cta_location` | Evento |
| Feature | `feature` | Evento |
| Source | `source` | Evento |

### Paso 2: Marcar Eventos como Conversiones

Ve a **Admin** > **Eventos** y marca como conversión:
- `cta_click_hero`
- `cta_click_citas`
- `cta_click_prueba_pagar`

### Paso 3: Crear Funnel de Exploración

Ve a **Explorar** > **Crear nueva exploración** > **Exploración del embudo**

**Pasos del embudo:**
1. `page_view` (evento)
2. `scroll_section` con `section_name` = `hero`
3. `scroll_section` con `section_name` = `herramientas`
4. `scroll_section` con `section_name` = `prueba_pagar`
5. `cta_click_prueba_pagar` (evento)

**Segmentos sugeridos:**
- Fuente / medio
- Dispositivo
- `utm_source` = `instagram` vs otros

---

## Verificación

### En GTM Preview Mode
1. Activa el modo de vista previa en GTM
2. Navega por la landing page
3. Verifica que los eventos aparezcan en el panel de debug:
   - `scroll_section` al hacer scroll
   - `cta_click_*` al hacer click en botones
   - `feature_interest` al hacer click en cards

### En GA4 DebugView
1. Ve a **Admin** > **DebugView**
2. Los eventos deberían aparecer en tiempo real con sus parámetros

---

## Análisis Recomendado

### 1. Dónde se pierde intención
Crea un informe de embudo para ver el drop-off entre secciones.

### 2. Qué features enganchan
Analiza `feature_interest` para ver qué herramientas generan más interés.

### 3. Comportamiento Instagram
Filtra por `session_source = instagram` y analiza:
- Tasa de scroll completo
- Tasa de conversión vs otras fuentes
- `high_scroll_no_cta` events

### 4. Click rate por CTA
Compara conversiones de:
- Hero (entrada directa)
- Sistema de Citas (feature específica)
- Prueba/Pagar (final del journey)
