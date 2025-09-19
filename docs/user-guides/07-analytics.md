# Guía del Panel de Analíticas

## Descripción General

Aprende a utilizar el panel de analíticas para visualizar métricas clave, monitorear el rendimiento y acceder a reportes históricos de tu actividad legal.

## Objetivos de Aprendizaje

- Navegar por el panel de analíticas y comprender las métricas
- Exportar reportes en formato PDF
- Acceder y comparar datos históricos
- Interpretar las visualizaciones y gráficos

---

## 1. Bienvenido al Panel de Analíticas

El panel de analíticas es tu centro de comando para monitorear el rendimiento de tu práctica legal. Aquí podrás visualizar métricas en tiempo real sobre carpetas, tareas, vencimientos y aspectos financieros.

### Lo que aprenderás:

- ✅ Navegar por las diferentes secciones del panel
- ✅ Interpretar las métricas y visualizaciones
- ✅ Exportar reportes profesionales en PDF
- ✅ Acceder a datos históricos para análisis comparativo

---

## 2. Acceso al Panel de Analíticas

### Pasos para acceder:

1. **Desde el menú principal**: Ve a "Panel de Control" > "Analíticas"
2. **Acceso directo**: Navega a `/dashboard/analytics`
3. **Desde el dashboard**: Busca el widget "Ver Analíticas Completas"

> **💡 Nota**: Las analíticas avanzadas requieren un plan Standard o Premium. Con el plan gratuito, verás una vista limitada de las métricas.

---

## 3. Comprensión de las Métricas Principales

### 3.1 Métricas de Rendimiento

#### **Tiempo Promedio de Resolución**
- **¿Qué muestra?** El tiempo promedio en días que tardas en resolver tus casos
- **¿Por qué es importante?** Te ayuda a identificar eficiencias y establecer expectativas realistas con clientes
- **Tooltip disponible**: Pasa el cursor sobre el ícono ℹ️ para más detalles

#### **Tasa de Completado de Tareas**
- **¿Qué muestra?** Porcentaje de tareas completadas vs pendientes
- **¿Por qué es importante?** Indica tu productividad y gestión del tiempo
- **Código de colores**: Verde (>80%), Amarillo (50-80%), Rojo (<50%)

#### **Estado de Tareas**
- **Pendientes**: Tareas por realizar
- **Completadas**: Tareas finalizadas exitosamente
- **Vencidas**: Tareas que requieren atención inmediata

#### **Promedio por Carpeta**
- **¿Qué muestra?** Monto promedio económico por carpeta activa
- **¿Por qué es importante?** Ayuda a evaluar la rentabilidad de tu práctica

---

## 4. Indicador de Calidad de Datos

### ¿Qué es la Calidad de Datos?

El indicador de Calidad de Datos evalúa la completitud y confiabilidad de la información en el sistema, permitiéndote entender qué tan precisas son las analíticas mostradas.

### Cálculo del indicador:

El sistema comienza con **100%** y aplica descuentos según los datos faltantes:

- **-30%** si no hay carpetas registradas
- **-20%** si no hay montos financieros
- **-20%** si no hay actividad reciente (últimos 30 días)

### Interpretación del porcentaje:

| Rango | Nivel | Descripción |
|-------|-------|-------------|
| **90-100%** | 🟢 Excelente | Datos completos y confiables. Las analíticas reflejan con precisión el estado de tu práctica legal. |
| **70-89%** | 🔵 Bueno | Datos mayormente completos. Las métricas son confiables aunque falta algún componente menor. |
| **50-69%** | 🟡 Parcial | Datos incompletos. El análisis es limitado y las tendencias pueden no ser representativas. |
| **30-49%** | 🟠 Muy incompleto | Datos muy limitados. Se requiere más información para análisis útiles. |
| **0-29%** | 🔴 Insuficiente | Datos insuficientes para generar análisis significativos. |

### Ejemplos de escenarios:

| Escenario | Carpetas | Montos | Actividad | Calidad |
|-----------|----------|--------|-----------|---------|
| **Ideal** | ✅ | ✅ | ✅ | 100% |
| **Usuario activo** | ✅ 14 | ✅ $8M | ❌ 0 | 80% |
| **Datos parciales** | ✅ 5 | ❌ $0 | ❌ 0 | 60% |
| **Mínimo** | ❌ | ❌ | ❌ | 30% |

### Cómo mejorar la calidad de datos:

1. **Registra todas tus carpetas**: Mantén actualizada la información de todos tus casos activos
2. **Agrega montos económicos**: Incluye valores monetarios en tus carpetas para análisis financiero
3. **Mantén actividad regular**: Registra movimientos, tareas y actualizaciones frecuentemente
4. **Completa información básica**: Asegúrate de que cada carpeta tenga los datos mínimos requeridos

> **💡 Tip**: Una calidad de datos superior al 70% garantiza que las métricas y tendencias mostradas sean representativas de tu práctica legal real.

---

## 5. Proyección de Vencimientos

### Interpretación de los plazos:

| Período | Urgencia | Acción Recomendada |
|---------|----------|-------------------|
| **Próximos 7 días** | 🔴 Alta | Revisar diariamente y priorizar |
| **Próximos 15 días** | 🟡 Media | Planificar en tu agenda semanal |
| **Próximos 30 días** | 🟢 Normal | Incluir en planificación mensual |

### Origen de los datos:
- **Eventos del calendario**: Audiencias, reuniones, presentaciones
- **Movimientos judiciales**: Plazos procesales, vencimientos legales
- **Tareas programadas**: Entregas, seguimientos

> **💡 Tip**: Haz clic en cada tarjeta para ver el detalle de los vencimientos específicos.

---

## 6. Visualizaciones Financieras

### 6.1 Resumen Financiero

Muestra tres métricas clave:
- **Monto Activo Total**: Suma de todos los casos activos
- **Promedio por Carpeta**: División del monto total entre carpetas activas
- **Monto Pendiente**: Casos en estado pendiente de resolución

### 6.2 Distribución por Estado

Gráfico que muestra cómo se distribuyen los montos según el estado de las carpetas:
- Nueva
- En Proceso
- Cerrada
- Pendiente

---

## 7. Métricas de Actividad

### Indicadores disponibles:

- **Total Carpetas**: Número total de casos en el sistema
- **Total Tareas**: Suma de todas las tareas (pendientes + completadas + vencidas)
- **Promedio Diario**: Actividad promedio por día laborable
- **Día Más Activo**: Día de la semana con mayor actividad registrada

---

## 8. Información de Actualización de Datos

### Chip de Estado de Caché

En la parte superior del panel verás un indicador que muestra:
- **"Actualizado hace X horas"**: Indica cuándo se generaron los datos
- **Color verde**: Datos actualizados (menos de 24 horas)
- **Color amarillo**: Datos con más de 24 horas de antigüedad

> **ℹ️ Información**: Los datos se actualizan automáticamente cada 24 horas a las 5:00 AM.

---

## 9. Histórico de Analíticas

### Acceso a datos históricos:

1. **Haz clic en "Ver Histórico"** (botón azul en la parte superior)
2. **Selecciona una fecha** del menú desplegable
3. **Visualiza los datos** de esa fecha específica

### Información mostrada:
- Fecha del reporte
- Antigüedad (Hoy, Ayer, Hace X días)
- Última actualización
- Indicador "Actual" para el reporte más reciente

### Casos de uso:
- **Comparación mensual**: Evalúa tu progreso mes a mes
- **Análisis de tendencias**: Identifica patrones en tu práctica
- **Reportes para clientes**: Demuestra evolución de casos

---

## 10. Exportación de Reportes

### Proceso detallado:

1. **Apertura del modal**
   - El botón "Exportar Reporte" abre un modal con vista previa
   - Se muestra un resumen de todas las métricas actuales
   - Verificación automática del plan del usuario

2. **Contenido del PDF**
   - Encabezado profesional con branding
   - Datos del usuario y suscripción
   - Todas las métricas en formato tabla
   - Visualizaciones adaptadas para impresión

3. **Generación y descarga**
   - Click en "Generar PDF" para crear el archivo
   - Descarga automática al navegador
   - Nombre del archivo incluye fecha de generación

### El reporte incluye:
- Encabezado con logo de Law Analytics
- Información del usuario (nombre, email, plan)
- Fecha y hora de generación
- Tabla de métricas principales
- Resumen financiero detallado
- Análisis de tareas y vencimientos
- Gráficos y visualizaciones

### Formatos de uso:
- **Presentaciones a clientes**: Demuestra profesionalismo
- **Análisis interno**: Revisa el rendimiento mensual
- **Documentación**: Mantén registros históricos

---

## 11. Interpretación de Tendencias

### Gráficos de evolución (últimos 6 meses):

#### **Nuevas Carpetas**
- Muestra la cantidad de casos nuevos por mes
- Útil para evaluar crecimiento del estudio

#### **Carpetas Cerradas**
- Indica casos resueltos mensualmente
- Refleja eficiencia operativa

#### **Movimientos**
- Actividad procesal mensual
- Indicador de carga de trabajo

---

## 12. Tooltips y Ayuda Contextual

### Cómo obtener más información:

1. **Busca el ícono ℹ️** junto a cada métrica
2. **Pasa el cursor** sobre el ícono
3. **Lee la descripción** contextual que aparece

Los tooltips aparecen automáticamente al pasar el mouse y contienen información detallada sobre cómo se calcula cada métrica.

### Descripciones disponibles para:
- Definición de cada métrica
- Método de cálculo
- Período de medición
- Fuente de datos

---

## 13. Limitaciones por Plan

### Plan Gratuito:
- ❌ Vista completa de analíticas (con overlay)
- ❌ Exportación de reportes
- ✅ Métricas básicas visibles

### Plan Standard:
- ✅ Acceso completo a analíticas
- ✅ Exportación de reportes
- ✅ Histórico de 6 meses

### Plan Premium:
- ✅ Todas las características Standard
- ✅ Histórico ilimitado
- ✅ Reportes personalizados
- ✅ API para integración

---

## 14. Preguntas Frecuentes

### ¿Con qué frecuencia se actualizan los datos?
Los datos se procesan automáticamente cada 24 horas a las 5:00 AM hora del servidor.

### ¿Puedo personalizar las métricas mostradas?
Actualmente las métricas son estándar para todos los usuarios. Estamos trabajando en personalización para futuras versiones.

### ¿Los datos históricos se mantienen para siempre?
Sí, cada actualización crea un documento histórico que se preserva indefinidamente.

### ¿Puedo exportar los datos en otros formatos además de PDF?
Actualmente solo PDF está disponible mediante el modal de exportación. El PDF generado incluye todas las métricas en formato profesional listo para presentación o archivo.

### ¿Cómo se calculan los promedios?
- **Tiempo de resolución**: Diferencia entre fecha inicial y final de carpeta
- **Promedios financieros**: Suma total dividida por cantidad de elementos
- **Tasas de completado**: (Completadas / Total) × 100

---

## 15. Consejos y Mejores Prácticas

### Para maximizar el valor de las analíticas:

1. **Revisa diariamente** la proyección de vencimientos
2. **Compara mensualmente** tus métricas usando el histórico
3. **Exporta reportes** al finalizar cada mes para archivo
4. **Usa los tooltips** para entender mejor cada métrica
5. **Monitorea tendencias** más que valores absolutos

### Indicadores de alerta:

- ⚠️ **Tasa de completado < 50%**: Revisa tu gestión de tareas
- ⚠️ **Tiempo de resolución creciente**: Analiza cuellos de botella
- ⚠️ **Muchos vencimientos próximos**: Reorganiza prioridades
- ⚠️ **Montos pendientes altos**: Seguimiento de cobros

---

## 16. Solución de Problemas

### El panel no muestra datos:
1. Verifica estar autenticado correctamente
2. Espera que cargue (indicador de carga visible)
3. Actualiza la página con F5
4. Contacta soporte si persiste

### Las métricas parecen incorrectas:
1. Verifica la fecha del último update (chip superior)
2. Revisa que tus carpetas tengan datos completos
3. Los cálculos se basan en datos ingresados

### No puedo exportar reportes:
1. Verifica tener plan Standard o Premium
2. El botón debe estar habilitado (no gris)
3. Permite ventanas emergentes en tu navegador

### El histórico no carga:
1. Haz clic nuevamente en "Ver Histórico"
2. Espera el indicador de carga
3. Verifica tu conexión a internet

---

## Recursos Adicionales

- 📚 [Documentación técnica de métricas](../USER_ANALYTICS_DOCUMENTATION.md)
- 💬 [Soporte técnico](mailto:soporte@lawanalytics.app)
- 🎥 [Video tutorial](https://lawanalytics.app/tutoriales/analytics)
- 📊 [Plantillas de reportes](https://lawanalytics.app/recursos/plantillas)

---

> **Última actualización**: Enero 2025
> **Versión**: 2.0
> **Autor**: Equipo Law Analytics
> **Basado en**: USER_ANALYTICS_DOCUMENTATION.md