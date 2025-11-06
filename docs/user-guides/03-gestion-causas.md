# Guía de Gestión de Causas

## Descripción General

Aprende a organizar y gestionar carpetas para tus expedientes legales.

## Objetivos de Aprendizaje

- Crear y gestionar causas judiciales
- Importar causas automáticamente desde el Poder Judicial
- Vincular causas existentes con el sistema PJN
- Visualizar movimientos sincronizados automáticamente
- Organizar documentos y cálculos asociados a cada causa
- Manejar el estado y seguimiento de tus expedientes
- Archivar causas finalizadas y mantener tu sistema organizado

---

## 1. Introducción a la Gestión de Causas

Esta guía te mostrará cómo utilizar el sistema de gestión de causas para administrar eficientemente los expedientes legales, realizar seguimiento de casos y organizar toda la información relacionada con tus asuntos jurídicos.

### Lo que aprenderás:

- ✅ Crear y gestionar causas judiciales
- ✅ Importar causas automáticamente desde el Poder Judicial
- ✅ Vincular causas existentes con el sistema PJN
- ✅ Visualizar movimientos sincronizados automáticamente
- ✅ Organizar documentos y cálculos asociados a cada causa
- ✅ Manejar el estado y seguimiento de tus expedientes
- ✅ Archivar causas finalizadas y mantener tu sistema organizado

---

## 2. Creación de Nuevas Causas

### Pasos para crear una causa:

1. Haz clic en el botón **"Agregar Causa"** en la parte superior derecha de la tabla
2. Completa el formulario con los datos básicos de la causa
3. Haz clic en **"Guardar"** para crear la nueva causa en el sistema

> **💡 Nota**: Al crear una nueva causa, asegúrate de incluir toda la información relevante como jurisdicción, materia, parte representada y fechas importantes para facilitar su seguimiento posterior.

---

## 3. Importación Automática de Causas

Ahora puedes importar causas directamente desde el Poder Judicial de la Nación:

### 🔄 Proceso de importación:

1. Haz clic en el botón **"Agregar Causa"**
2. Selecciona la pestaña **"Importar Automáticamente"**
3. Selecciona la jurisdicción del Poder Judicial:
   - Civil
   - Laboral
   - Seguridad Social
4. Ingresa el **número de expediente** y el **año**
5. Haz clic en **"Siguiente"** y luego **"Guardar"**

### ⚠️ Estado de verificación

Las causas importadas automáticamente aparecerán con estado **"Pendiente de verificación"** hasta que la información sea validada por el sistema. Esto se indica visualmente en la tabla de causas.

> **💡 Nota**: Una vez que los datos hayan sido verificados y procesados, se actualizarán automáticamente con la información completa del expediente.

### 🏛️ Jurisdicciones disponibles:

- Cámara Nacional de Apelaciones en lo Civil
- Cámara Federal de la Seguridad Social
- Cámara Nacional de Apelaciones del Trabajo

> **✨ Beneficio**: La importación automática te permite ahorrar tiempo en la carga de datos y reducir errores de transcripción, facilitando la gestión de múltiples expedientes.

---

## 4. Vinculación de Causas Existentes con PJN

Si ya tienes causas creadas en el sistema, puedes vincularlas con el Poder Judicial de la Nación para sincronizar movimientos automáticamente:

### 🔗 Proceso de vinculación:

1. Abre la causa que deseas vincular
2. En la vista detallada, busca el botón **"Vincular con Poder Judicial"**
3. Se abrirá un modal con las opciones disponibles

#### Primera pantalla - Selección del Poder Judicial:

```
┌─────────────────────────────────────────────┐
│ 📄 Vincular con Poder Judicial              │
├─────────────────────────────────────────────┤
│                                             │
│ Seleccione el poder judicial:              │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ ⚖️ Poder Judicial de la Nación      │   │
│ │   Vincule causas del fuero federal  │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 🏛️ Poder Judicial de Buenos Aires   │   │
│ │   [Próximamente]                    │   │
│ └─────────────────────────────────────┘   │
│                                             │
│                      [Cancelar]             │
└─────────────────────────────────────────────┘
```

#### Segunda pantalla - Formulario de vinculación:

Al seleccionar "Poder Judicial de la Nación", verás:

```
┌─────────────────────────────────────────────┐
│ 📄 Vincular con Poder Judicial de la Nación │
├─────────────────────────────────────────────┤
│                                             │
│ Jurisdicción *                             │
│ ┌─────────────────────────────────────┐   │
│ │ Seleccione una jurisdicción     ▼   │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ Número de Expediente *                     │
│ ┌─────────────────────────────────────┐   │
│ │ Ej: 12345                           │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ Año del Expediente *                       │
│ ┌─────────────────────────────────────┐   │
│ │ Ej: 2024                            │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ☑ Sobrescribir datos locales con los      │
│   del Poder Judicial                       │
│                                             │
│            [Atrás]  [Vincular Causa]       │
└─────────────────────────────────────────────┘
```

### 📋 Campos del formulario:

| **Campo**                | **Descripción**                            | **Requerido** | **Ejemplo**          |
| ------------------------ | ------------------------------------------ | ------------- | -------------------- |
| **Jurisdicción**         | Tribunal específico del PJN                | Sí            | "Cámara Civil"       |
| **Número de Expediente** | Identificador numérico del caso            | Sí            | "12345"              |
| **Año del Expediente**   | Año de inicio del expediente               | Sí            | "2024"               |
| **Sobrescribir datos**   | Actualiza información local con la del PJN | No            | Activado por defecto |

### 📊 Estados post-vinculación:

Una vez completada la vinculación, tu causa mostrará diferentes estados visuales:

#### Estado 1: Vinculación iniciada

```
Carátula: [Nombre del Expediente] 🟡 Pendiente de verificación [🔄]
```

- El sistema está validando la información con el Poder Judicial
- Puedes hacer clic en el botón de actualización (🔄) para verificar el estado

#### Estado 2: Verificación exitosa

```
Carátula: [Nombre del Expediente] ✅
```

- **Indicador**: Ícono de tilde verde
- **Tooltip**: "Causa vinculada a PJN"
- El expediente fue encontrado y validado exitosamente
- La sincronización automática está activa

#### Estado 3: Verificación fallida

```
Carátula: [Nombre del Expediente] ❌ Causa inválida
```

- **Indicador**: Ícono de cruz roja con chip rojo
- **Tooltip**: "Causa inválida - No se pudo verificar en el Poder Judicial"
- Los datos no coinciden con ningún expediente en el sistema judicial
- Verifica el número y año del expediente

### 🔄 Sincronización automática:

Una vez vinculada exitosamente, la causa recibirá actualizaciones automáticas:

- **Movimientos procesales**: Nuevas actuaciones, providencias, sentencias
- **Notificaciones**: Cambios de estado importantes
- **Documentos**: Enlaces a documentos públicos disponibles
- **Frecuencia**: Las actualizaciones se sincronizan periódicamente

### 📝 Datos enviados al sistema:

Al vincular, el sistema envía automáticamente:

| **Dato**    | **Valor**              | **Descripción**                      |
| ----------- | ---------------------- | ------------------------------------ |
| `pjn`       | `true`                 | Marca la causa como vinculada al PJN |
| `pjnCode`   | Código de jurisdicción | Identifica el tribunal específico    |
| `number`    | Número de expediente   | Para localizar el caso               |
| `year`      | Año                    | Para identificación única            |
| `overwrite` | `true/false`           | Si sobrescribir datos locales        |

### ⚡ Actualización manual del estado:

Si tu causa muestra "Pendiente de verificación", puedes:

1. Hacer clic en el **botón de actualización (🔄)** junto al chip amarillo
2. El sistema intentará verificar nuevamente con el PJN
3. El estado se actualizará según el resultado de la verificación

### 🎯 Beneficios de la vinculación:

- ✅ **Actualizaciones automáticas**: No necesitas revisar manualmente el expediente
- ✅ **Validación oficial**: Confirma que el expediente existe en el sistema judicial
- ✅ **Historial completo**: Todos los movimientos procesales en un solo lugar
- ✅ **Notificaciones**: Alertas de movimientos importantes (si está habilitado)
- ✅ **Documentos sincronizados**: Acceso a documentos públicos del expediente

### ⚠️ Notas importantes:

- **Solo causas federales**: Actualmente solo disponible para el Poder Judicial de la Nación
- **Indicadores visuales**: Solo se muestran si la causa está vinculada (pjn = true)
- **Tiempo de verificación**: La verificación inicial puede tomar algunos segundos
- **Estado temporal**: "Pendiente de verificación" es temporal mientras se valida
- **Movimientos de solo lectura**: Los movimientos sincronizados no pueden editarse para mantener la integridad

> **💡 Nota**: Los movimientos sincronizados desde PJN se muestran con la etiqueta "Sincronizado • PJN" y son de solo lectura para mantener la integridad de los datos oficiales.

---

## 5. Visualización de Movimientos y Actividad

### 📋 Vista de Movimientos:

En la vista detallada de cada causa vinculada con PJN, encontrarás una pestaña **"Movimientos"** que muestra:

- **Movimientos manuales**: Agregados por tu equipo
- **Movimientos sincronizados**: Importados automáticamente desde PJN
- **Vista combinada**: Todos los movimientos en orden cronológico

### 🎯 Características de los movimientos:

- **Filtros avanzados**: Por tipo, origen, fecha
- **Indicadores visuales**:
  - 🔵 Manual (editable)
  - 🟢 Sincronizado PJN (solo lectura)
- **Detalles completos**: Fecha, tipo, descripción, documentos adjuntos
- **Vista previa de documentos**: Visualiza PDFs sin descargar

### 📊 Vista de Actividad Combinada:

Accede a una vista unificada que incluye:

- **Movimientos procesales**
- **Eventos del calendario**
- **Notificaciones importantes**
- **Cambios de estado**

Todo en una línea de tiempo cronológica para un seguimiento completo del expediente.

---

## 6. Campos del Formulario de Causa

El formulario contiene los siguientes campos organizados por secciones:

### 📝 Datos Básicos

- **Carátula**: Nombre identificativo del expediente (ej. "Pérez c/ González s/ Daños")
- **Parte**: Rol que representa (Actora, Demandada, Tercero, etc.)
- **Descripción**: Resumen o notas sobre la causa

### ⚖️ Información Jurisdiccional

- **Jurisdicción**: Ámbito territorial (ej. CABA, Provincia de Buenos Aires)
- **Fuero**: Especialidad del tribunal (Civil, Laboral, Comercial, etc.)
- **Materia**: Tipo de proceso (Daños y Perjuicios, Despido, etc.)

### 📅 Estado y Fechas

- **Fecha de Inicio**: Cuándo comenzó la causa
- **Fecha Final**: Estimación de finalización o fecha de cierre
- **Estado**: Situación actual (Nueva, En proceso, Finalizada)

---

## 7. Gestión de Causas

Una vez creadas, gestiona tus expedientes con estas funciones:

### 🔍 Ver Causa

Haz clic en el icono de **ojo** para desplegar una vista previa con toda la información detallada de la causa directamente en la tabla.

### ✏️ Editar Causa

Utiliza el botón de **edición** para modificar cualquier dato de la causa, actualizar su estado o añadir nueva información.

### 🗑️ Eliminar Causa

Permite eliminar causas del sistema. Esta acción requiere confirmación y es irreversible, por lo que se recomienda archivar en lugar de eliminar.

### 📂 Abrir Causa

Abre la **vista detallada** de la causa donde podrás gestionar documentos, cálculos y toda la información relacionada con el expediente.

### 📦 Acciones adicionales:

- **Archivar Causas**: Selecciona una o varias causas y haz clic en "Archivar"
- **Ver Archivados**: Accede a las causas archivadas y recupera las que necesites
- **Exportar CSV**: Exporta la lista de causas para uso en otras aplicaciones

---

## 8. Vista Detallada de Causa

Al abrir una causa accederás a:

### 📋 Información General

Muestra todos los datos básicos de la causa con opción de edición rápida. Si la causa está vinculada con PJN, verás:

- **Badge "Vinculado con PJN"**: Indica conexión activa con el Poder Judicial
- **Estado de verificación**: Ícono que muestra si la vinculación es válida
- **Última sincronización**: Fecha y hora de la última actualización

### 📊 Movimientos

Para causas vinculadas con PJN, esta pestaña muestra:

- **Movimientos sincronizados**: Actuaciones importadas automáticamente del expediente judicial
- **Movimientos manuales**: Notas y actuaciones agregadas por tu equipo
- **Filtros y búsqueda**: Encuentra rápidamente movimientos específicos
- **Vista de documentos**: Previsualiza PDFs adjuntos sin descargar

### 📎 Documentos Asociados

Permite subir, visualizar y gestionar todos los documentos relacionados con la causa, manteniendo un expediente digital completo y organizado.

### 🧮 Cálculos Vinculados

Muestra todos los cálculos (laborales, intereses, etc.) que has asociado a esta causa, permitiéndote acceder rápidamente a ellos.

### 📝 Notas y Comentarios

Espacio para añadir notas, recordatorios o comentarios relacionados con la causa, facilitando el seguimiento y la colaboración.

### 🔗 Vinculación con Poder Judicial

Si la causa no está vinculada, encontrarás aquí la opción para conectarla con el sistema PJN e iniciar la sincronización automática de movimientos.

> **💡 Consejo**: Puedes vincular cualquier cálculo realizado en el sistema a una causa específica. Para vincular un cálculo, selecciona la opción "Vincular a Causa" al guardar el cálculo.

---

## 9. Archivado y Organización

Mantén tu espacio de trabajo organizado:

### 📥 Proceso de Archivado:

1. Selecciona una o varias causas marcando las casillas de selección
2. Haz clic en el botón **"Archivar"** en la barra de herramientas
3. Confirma la acción cuando se te solicite

### 📤 Gestión de Archivados:

1. Accede mediante el botón **"Ver Archivados"**
2. Selecciona las causas que deseas recuperar
3. Haz clic en **"Desarchivar"** para restaurarlas

> **⚠️ Importante**: Las causas archivadas permanecen en el sistema y pueden ser recuperadas en cualquier momento. El archivado es diferente a la eliminación, que es permanente.

> **💡 Recomendación**: Usa el archivado regularmente para mantener tu lista de causas activas más manejable, mejorando la eficiencia al centrarte en los casos que requieren atención inmediata.

---

## 10. Consejos Prácticos

### 🏷️ Organización Sistemática

Utiliza un sistema coherente para nombrar las carátulas de tus causas, lo que facilitará su identificación y búsqueda posterior.

### 🔄 Actualización Regular

Mantén actualizado el estado de tus causas y añade notas relevantes después de cada novedad o actuación procesal importante.

### 🔗 Vinculación de Contenidos

Vincula todos los cálculos y documentos relacionados a la causa correspondiente para tener un expediente digital completo y centralizado.

### 📦 Archivado Estratégico

Archiva regularmente las causas finalizadas o inactivas para mantener tu lista principal enfocada en casos activos que requieren atención.

### 💡 Tips de flujo de trabajo:

- Utiliza la sección de notas para registrar recordatorios, plazos y observaciones importantes
- Aprovecha la función de vincular cálculos para mantener toda la información financiera asociada
- Exporta regularmente tus causas a CSV como respaldo adicional
- Utiliza la importación automática para ahorrar tiempo en la carga de expedientes
- Vincula causas existentes con PJN para recibir actualizaciones automáticas de movimientos
- Revisa periódicamente los movimientos sincronizados para estar al día con las novedades procesales
- Combina movimientos manuales con los sincronizados para tener un registro completo

> **📢 Nota Final**: Estamos constantemente mejorando el sistema de gestión de causas. Si tienes sugerencias o detectas oportunidades de mejora, háznoslo saber para seguir perfeccionando la herramienta.

---

## Resumen de Características Clave

| Característica                | Descripción                                          |
| ----------------------------- | ---------------------------------------------------- |
| **Creación manual**           | Formulario completo para nuevas causas               |
| **Importación automática**    | Conexión con Poder Judicial para crear causas        |
| **Vinculación PJN**           | Conecta causas existentes con expedientes judiciales |
| **Movimientos sincronizados** | Actualización automática de actuaciones procesales   |
| **Vista detallada**           | Gestión integral del expediente con movimientos      |
| **Actividad combinada**       | Línea de tiempo unificada de todos los eventos       |
| **Vinculación**               | Documentos y cálculos asociados                      |
| **Archivado inteligente**     | Organización sin pérdida de datos                    |
| **Exportación**               | Respaldo y compartir información                     |

---

## Metadatos para Uso Posterior

### Tags

- causas
- expedientes
- gestión
- carpetas
- poder judicial
- PJN
- importación
- vinculación
- movimientos
- sincronización
- archivado
- organización

### Categoría

Gestión de Expedientes

### Nivel de Usuario

Principiante - Avanzado

### Tiempo Estimado

15-20 minutos para dominar la herramienta

### Prerrequisitos

- Cuenta activa en Law Analytics
- Información básica de los expedientes

### Formatos de Salida Posibles

- Tutorial interactivo web
- Video tutorial con casos de uso
- Diagrama de flujo de trabajo
- Manual de mejores prácticas
- Tour guiado in-app
- Webinar de capacitación
