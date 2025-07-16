# Guías de Usuario - Law Analytics

## Descripción General
Este directorio contiene todas las guías de usuario extraídas del sistema Law Analytics. Las guías están estructuradas en un formato que permite su uso para múltiples propósitos: guías interactivas, videos, tours visuales, documentación, y más.

## Índice de Guías

### 1. [Calculadora Laboral](./01-calculadora-laboral.md)
**Descripción**: Aprende a usar la calculadora para indemnizaciones laborales, despidos y liquidaciones.

**Contenido principal**:
- Acceso y navegación de la calculadora
- Proceso paso a paso para cálculos de despido
- Fórmulas legales aplicadas (Art. 245 LCT, preaviso, integración)
- Gestión y exportación de cálculos guardados
- Vinculación con expedientes

**Tiempo estimado**: 10-15 minutos

---

### 2. [Calculadora de Intereses](./02-calculadora-intereses.md)
**Descripción**: Aprende a calcular intereses con distintas tasas para tus procesos legales.

**Contenido principal**:
- Tipos de tasas disponibles (BCRA, CER, CNAT)
- Métodos de cálculo (indexación vs interés diario)
- Interpretación de resultados
- Exportación y gestión de cálculos

**Tiempo estimado**: 5-10 minutos

---

### 3. [Gestión de Causas](./03-gestion-causas.md)
**Descripción**: Aprende a organizar y gestionar carpetas para tus expedientes legales.

**Contenido principal**:
- Creación manual de causas
- Importación automática desde Poder Judicial
- Vista detallada y gestión de expedientes
- Sistema de archivado inteligente
- Vinculación de documentos y cálculos

**Tiempo estimado**: 15-20 minutos

---

### 4. [Contactos](./04-contactos.md)
**Descripción**: Aprende a gestionar tus contactos y clientes en el sistema.

**Contenido principal**:
- Creación de perfiles (personas físicas y jurídicas)
- Sistema de búsqueda y categorización
- Vinculación con carpetas y casos
- Importación y exportación masiva

**Tiempo estimado**: 10-15 minutos

---

### 5. [Calendario](./05-calendario.md)
**Descripción**: Aprende a gestionar eventos y agenda en tu calendario legal.

**Contenido principal**:
- Múltiples vistas (mes, semana, día, agenda)
- Tipos de eventos (audiencias, vencimientos, reuniones)
- Sistema de recordatorios y notificaciones
- Vinculación con causas
- Configuración básica de disponibilidad

**Tiempo estimado**: 20-25 minutos

---

### 6. [Sistema de Citas](./06-sistema-citas.md)
**Descripción**: Aprende a configurar y gestionar el sistema de citas online para tus clientes.

**Contenido principal**:
- Configuración de disponibilidad y horarios
- Personalización de formularios de reserva
- Gestión de reservaciones
- Sistema de notificaciones automáticas
- Experiencia del cliente paso a paso

**Tiempo estimado**: 25-30 minutos

---

## Estructura de las Guías

Cada guía sigue una estructura consistente:

1. **Descripción General**: Resumen del módulo
2. **Objetivos de Aprendizaje**: Lo que el usuario aprenderá
3. **Secciones numeradas**: Contenido paso a paso
4. **Elementos visuales**: Tablas, listas, íconos para mejor comprensión
5. **Consejos prácticos**: Recomendaciones de uso
6. **Resumen de características**: Tabla con funcionalidades clave
7. **Metadatos**: Tags, categoría, nivel, prerrequisitos

## Formatos de Salida Sugeridos

Las guías están preparadas para ser transformadas en:

### 📱 Digitales Interactivos
- **Tours guiados in-app**: Usar el contenido para crear tours paso a paso
- **Tutoriales web interactivos**: Con simulaciones de la interfaz
- **Chatbot de ayuda**: Base de conocimiento para asistente virtual

### 🎥 Contenido Audiovisual
- **Videos tutoriales**: Guiones basados en los pasos
- **Webinars de capacitación**: Presentaciones estructuradas
- **Podcasts educativos**: Explicaciones en audio

### 📄 Documentación
- **PDFs descargables**: Manuales de usuario formateados
- **Wiki interna**: Base de conocimiento searchable
- **Guías de referencia rápida**: Versiones condensadas

### 🎨 Contenido Visual
- **Infografías**: Procesos visualizados
- **Diagramas de flujo**: Workflows de cada módulo
- **Presentaciones**: Slides para capacitación

### 🎮 Experiencias Inmersivas
- **Simuladores**: Práctica sin afectar datos reales
- **Gamificación**: Aprendizaje mediante logros
- **Realidad aumentada**: Overlay de ayuda contextual

## Integración Técnica

### Estructura JSON disponible
El archivo original `guides-data.json` contiene la estructura completa con:
- IDs únicos por guía
- Pasos con títulos y contenido
- Bullets, secciones y subsecciones
- Notas, tips y advertencias
- Metadatos para categorización

### APIs sugeridas
Para implementar las guías dinámicamente:
```javascript
// Ejemplo de endpoint
GET /api/guides - Lista todas las guías
GET /api/guides/:id - Obtiene guía específica
GET /api/guides/:id/steps/:step - Obtiene paso específico
```

## Mantenimiento

### Actualización de contenido
1. Las guías deben actualizarse cuando cambien las funcionalidades
2. Mantener consistencia en formato y estructura
3. Revisar enlaces y referencias cruzadas

### Versionado sugerido
- Incluir fecha de última actualización
- Mantener changelog de cambios significativos
- Archivar versiones anteriores para referencia

## Métricas y Analytics

### KPIs sugeridos para medir efectividad:
- Tiempo de completación por guía
- Tasa de finalización
- Puntos de abandono
- Búsquedas frecuentes
- Calificación de utilidad

### Feedback del usuario
- Incluir opción de calificación
- Comentarios por sección
- Sugerencias de mejora
- Reportar contenido desactualizado

---

## Contacto y Soporte

Para actualizaciones o mejoras en las guías, considerar:
- Sistema de tickets para solicitudes
- Foro de comunidad para tips
- Base de conocimiento colaborativa
- Canal de video tutoriales

---

*Última actualización: Generado desde guides-data.json*
*Versión: 1.0*