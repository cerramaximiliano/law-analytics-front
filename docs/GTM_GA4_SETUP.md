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

## PARTE 1: Configuración en Google Tag Manager

> Estos pasos se pueden hacer inmediatamente.

### Paso 1: Crear Variables de Capa de Datos

1. Ve a **Variables** > **Nueva**
2. Click en el bloque de configuración
3. Selecciona **Variable de capa de datos**
4. Completa según la tabla
5. Versión: **Versión 2**
6. **Guardar**

| Nombre Variable | Nombre en Capa de Datos |
|-----------------|-------------------------|
| `dlv - section_name` | `section_name` |
| `dlv - cta_location` | `cta_location` |
| `dlv - feature` | `feature` |
| `dlv - source` | `source` |

### Paso 2: Crear Variable Constante para ID de GA4

1. Ve a **Variables** > **Nueva**
2. Nombre: `GA4 - Measurement ID`
3. Tipo: **Constante**
4. Valor: `G-XXXXXXXXXX` (reemplazar con tu ID real)
5. **Guardar**

### Paso 3: Crear Activadores (Triggers)

Para cada activador:
1. Ve a **Activadores** > **Nuevo**
2. Click en el bloque de configuración
3. Selecciona **Evento personalizado**
4. Completa el nombre del evento
5. Activar en: **Todos los eventos personalizados**
6. **Guardar**

| Nombre Activador | Nombre del Evento |
|------------------|-------------------|
| `CE - scroll_section` | `scroll_section` |
| `CE - cta_click_hero` | `cta_click_hero` |
| `CE - cta_click_citas` | `cta_click_citas` |
| `CE - cta_click_prueba_pagar` | `cta_click_prueba_pagar` |
| `CE - feature_interest` | `feature_interest` |
| `CE - high_scroll_no_cta` | `high_scroll_no_cta` |

### Paso 4: Crear Tags de GA4

Para cada tag:
1. Ve a **Etiquetas** > **Nueva**
2. **Configuración de la etiqueta**: Google Analytics: Evento de GA4
3. **ID de medición**: `{{GA4 - Measurement ID}}`
4. **Nombre del evento**: según tabla
5. **Parámetros del evento**: Agregar fila con nombre y valor
6. **Activación**: seleccionar el activador correspondiente
7. **Guardar**

#### Tag 1: GA4 - Scroll Section
| Campo | Valor |
|-------|-------|
| Nombre del evento | `scroll_section` |
| Parámetro | `section_name` = `{{dlv - section_name}}` |
| Activador | `CE - scroll_section` |

#### Tag 2: GA4 - CTA Click Hero
| Campo | Valor |
|-------|-------|
| Nombre del evento | `cta_click_hero` |
| Parámetro | `cta_location` = `{{dlv - cta_location}}` |
| Activador | `CE - cta_click_hero` |

#### Tag 3: GA4 - CTA Click Citas
| Campo | Valor |
|-------|-------|
| Nombre del evento | `cta_click_citas` |
| Parámetro | `cta_location` = `{{dlv - cta_location}}` |
| Activador | `CE - cta_click_citas` |

#### Tag 4: GA4 - CTA Click Prueba Pagar
| Campo | Valor |
|-------|-------|
| Nombre del evento | `cta_click_prueba_pagar` |
| Parámetro | `cta_location` = `{{dlv - cta_location}}` |
| Activador | `CE - cta_click_prueba_pagar` |

#### Tag 5: GA4 - Feature Interest
| Campo | Valor |
|-------|-------|
| Nombre del evento | `feature_interest` |
| Parámetro | `feature` = `{{dlv - feature}}` |
| Activador | `CE - feature_interest` |

#### Tag 6: GA4 - High Scroll No CTA
| Campo | Valor |
|-------|-------|
| Nombre del evento | `high_scroll_no_cta` |
| Parámetro | `source` = `{{dlv - source}}` |
| Activador | `CE - high_scroll_no_cta` |

### Paso 5: Publicar GTM

1. Click en **Enviar** (arriba a la derecha)
2. Nombre de la versión: `Landing Analytics - Scroll & CTA tracking`
3. Click en **Publicar**

---

## PARTE 2: Configuración en GA4 - Dimensiones

> Estos pasos se pueden hacer inmediatamente.

### Crear Dimensiones Personalizadas

1. Abre [Google Analytics](https://analytics.google.com)
2. Selecciona tu propiedad
3. Click en **Administrar** (engranaje abajo a la izquierda)
4. En columna "Propiedad", click en **Definiciones personalizadas**
5. Click en **Crear dimensión personalizada**

Crear las siguientes dimensiones:

#### Dimensión 1
| Campo | Valor |
|-------|-------|
| Nombre de la dimensión | `Section Name` |
| Ámbito | Evento |
| Descripción | Nombre de la sección vista en landing |
| Parámetro de evento | `section_name` |

#### Dimensión 2
| Campo | Valor |
|-------|-------|
| Nombre de la dimensión | `CTA Location` |
| Ámbito | Evento |
| Descripción | Ubicación del CTA clickeado |
| Parámetro de evento | `cta_location` |

#### Dimensión 3
| Campo | Valor |
|-------|-------|
| Nombre de la dimensión | `Feature` |
| Ámbito | Evento |
| Descripción | Herramienta de interés del usuario |
| Parámetro de evento | `feature` |

#### Dimensión 4
| Campo | Valor |
|-------|-------|
| Nombre de la dimensión | `Source` |
| Ámbito | Evento |
| Descripción | Fuente de tráfico para high scroll |
| Parámetro de evento | `source` |

---

## PARTE 3: Configuración en GA4 - Conversiones

> ⚠️ **IMPORTANTE**: Estos pasos requieren que los eventos ya se hayan disparado al menos una vez.
> Esperar 24-48 horas después de publicar GTM y tener tráfico en la landing.

### Marcar Eventos como Conversiones

1. En GA4, ve a **Administrar** (engranaje)
2. En columna "Propiedad", click en **Eventos**
3. Espera a que aparezcan los eventos en la lista
4. Busca cada evento y activa el toggle **Marcar como conversión**

| Evento | ¿Marcar como conversión? |
|--------|--------------------------|
| `cta_click_hero` | ✅ SÍ |
| `cta_click_citas` | ✅ SÍ |
| `cta_click_prueba_pagar` | ✅ SÍ |
| `scroll_section` | ❌ NO |
| `feature_interest` | ❌ NO |
| `high_scroll_no_cta` | ❌ NO |

### Si los eventos no aparecen en la lista

Los eventos personalizados pueden tardar hasta 48 horas en aparecer. Para verificar que están llegando:

1. Ve a **Administrar** > **DebugView**
2. Instala la extensión [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
3. Activa la extensión (ícono se pone rojo)
4. Navega por tu landing
5. Los eventos deberían aparecer en DebugView en tiempo real

---

## PARTE 4: Crear Funnel de Exploración

> ⚠️ **IMPORTANTE**: Este paso requiere que los eventos ya se hayan disparado al menos una vez.
> Esperar 24-48 horas después de publicar GTM y tener tráfico en la landing.

### Paso 1: Crear Nueva Exploración

1. En GA4, en el menú izquierdo click en **Explorar**
2. Click en **En blanco**

### Paso 2: Cambiar Técnica

1. En la columna central "Configuración"
2. Busca **Técnica**
3. Cambia de "Exploración de forma libre" a **Exploración del embudo**

### Paso 3: Configurar Pasos del Embudo

1. En "Configuración", busca **Pasos**
2. Click en el ícono de lápiz para editar
3. Crea cada paso:

#### Paso 1 - Visita Landing
1. Click en **Agregar paso**
2. Nombre: `Visita Landing`
3. Click en **Agregar condición nueva**
4. Selecciona: Evento → `page_view`
5. (Opcional) Agregar parámetro: `page_location` contiene tu URL

#### Paso 2 - Ve Hero
1. Click en **Agregar paso**
2. Nombre: `Ve Hero`
3. Condición: Evento → `scroll_section`
4. Click en **Agregar parámetro**
5. Parámetro: `section_name`
6. Operador: `es exactamente`
7. Valor: `hero`

#### Paso 3 - Ve Herramientas
1. Click en **Agregar paso**
2. Nombre: `Ve Herramientas`
3. Condición: Evento → `scroll_section`
4. Agregar parámetro:
   - `section_name` es exactamente `herramientas`

#### Paso 4 - Ve Prueba/Pagar
1. Click en **Agregar paso**
2. Nombre: `Ve Prueba Pagar`
3. Condición: Evento → `scroll_section`
4. Agregar parámetro:
   - `section_name` es exactamente `prueba_pagar`

#### Paso 5 - Click CTA
1. Click en **Agregar paso**
2. Nombre: `Click CTA Registro`
3. Condición: Evento → `cta_click_prueba_pagar`

5. Click en **Aplicar**

### Paso 4: Agregar Desglose

1. En la columna izquierda "Variables", busca **Dimensiones**
2. Click en el **+** para agregar
3. Busca y selecciona:
   - `Fuente/medio de la sesión`
   - `Categoría de dispositivo`
4. Arrastra una dimensión a **Desglose** en la columna central

### Paso 5: Configurar Opciones

En la columna "Configuración":
- **Embudo abierto/cerrado**: Cerrado
- **Mostrar tiempo transcurrido**: Activado

### Paso 6: Guardar

1. Click en el título "Exploración sin título" (arriba a la izquierda)
2. Renombra a: `Funnel Landing - Scroll to CTA`
3. Se guarda automáticamente

---

## PARTE 5: Funnel Adicional - Segmento Instagram

> ⚠️ **IMPORTANTE**: Este paso requiere tráfico de Instagram para tener datos.

### Crear Segmento de Instagram

1. En tu exploración de funnel
2. En la columna "Variables", busca **Segmentos**
3. Click en el **+**
4. Selecciona **Segmento de usuario**
5. Nombre: `Usuarios Instagram`
6. Click en **Agregar condición nueva**
7. Selecciona: `Fuente de la sesión`
8. Operador: `contiene`
9. Valor: `instagram`
10. Click en **Guardar y aplicar**

### Comparar Segmentos

1. Arrastra el segmento `Usuarios Instagram` a **Comparación de segmentos**
2. Esto mostrará el funnel comparando Instagram vs todos los usuarios

---

## Checklist de Implementación

### Inmediato (Día 1)
- [ ] Crear 4 variables de capa de datos en GTM
- [ ] Crear variable constante con ID de GA4
- [ ] Crear 6 activadores en GTM
- [ ] Crear 6 tags de GA4 en GTM
- [ ] Publicar GTM
- [ ] Crear 4 dimensiones personalizadas en GA4
- [ ] Deployar código a producción

### Después de 24-48 horas (Día 2-3)
- [ ] Verificar eventos en GA4 DebugView
- [ ] Verificar eventos en GA4 > Administrar > Eventos
- [ ] Marcar 3 eventos como conversiones
- [ ] Crear Funnel de Exploración principal
- [ ] Crear Segmento de Instagram (opcional)

### Análisis semanal
- [ ] Revisar drop-off en funnel
- [ ] Analizar `feature_interest` más clickeados
- [ ] Comparar conversión Instagram vs otras fuentes
- [ ] Ajustar landing según insights

---

## Cómo Interpretar el Funnel

```
Visita Landing  →  Ve Hero  →  Ve Herramientas  →  Ve Prueba Pagar  →  Click CTA
    1000           950 (95%)     700 (74%)          400 (57%)          50 (12%)
```

### Qué significa cada drop-off:

| Caída | Posible problema | Acción sugerida |
|-------|------------------|-----------------|
| Hero → Herramientas alta | El hero no engancha | Mejorar propuesta de valor |
| Herramientas → Prueba/Pagar alta | Las cards no convencen | Revisar copy de beneficios |
| Prueba/Pagar → Click CTA alta | El CTA no es claro | Mejorar botón y microcopy |

### Métricas clave a monitorear:

1. **Tasa de conversión total**: Click CTA / Visitas
2. **Feature más interesante**: Mayor cantidad de `feature_interest`
3. **Diferencia Instagram**: Comparar funnel Instagram vs orgánico
