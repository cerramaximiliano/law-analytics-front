# Guía de Límites y Almacenamiento de Law Analytics

## Índice

1. [Introducción](#introducción)
2. [Planes y Límites](#planes-y-límites)
3. [Elementos Activos vs Archivados](#elementos-activos-vs-archivados)
4. [Sistema de Almacenamiento](#sistema-de-almacenamiento)
5. [Período de Gracia](#período-de-gracia)
6. [Preguntas Frecuentes](#preguntas-frecuentes)
7. [Consejos para Optimizar](#consejos-para-optimizar)

---

## Introducción

Law Analytics utiliza un sistema de límites dual para garantizar el mejor rendimiento y experiencia para todos los usuarios:

- **Límites de Cantidad**: Controlan cuántos elementos activos puedes tener
- **Límites de Almacenamiento**: Controlan el espacio total que utilizas

### ¿Por qué existen estos límites?

Los límites nos permiten:

- ✅ Mantener la aplicación rápida y fluida
- ✅ Ofrecer diferentes planes según tus necesidades
- ✅ Garantizar respaldos seguros de tu información
- ✅ Proporcionar un servicio estable para todos

---

## Planes y Límites

### 📋 Comparación de Planes

| Característica              | Plan Free | Plan Standard     | Plan Premium |
| --------------------------- | --------- | ----------------- | ------------ |
| **Carpetas Activas**        | 5         | 50                | 500          |
| **Calculadoras Activas**    | 3         | 20                | 200          |
| **Contactos Activos**       | 10        | 100               | 1,000        |
| **Almacenamiento Total**    | 50 MB     | 1 GB              | 5 GB         |
| **Analíticas Avanzadas**    | ❌        | ✅                | ✅           |
| **Exportación de Reportes** | ❌        | ✅                | ✅           |
| **Soporte**                 | Email     | Email Prioritario | Chat y Email |

### 🎯 ¿Qué plan es para ti?

- **Plan Free**: Ideal para profesionales independientes comenzando
- **Plan Standard**: Perfecto para pequeños despachos o estudios jurídicos
- **Plan Premium**: Diseñado para firmas grandes con múltiples casos

---

## Elementos Activos vs Archivados

### 📂 Elementos Activos

Los elementos **activos** son aquellos en los que trabajas regularmente:

- ✅ Aparecen en tu lista principal
- ✅ Puedes editarlos y modificarlos
- ✅ Se incluyen en búsquedas rápidas
- ⚠️ Cuentan para tu límite de cantidad

**Ejemplo**: Si tienes Plan Free (5 carpetas), solo puedes tener 5 carpetas activas a la vez.

### 📦 Elementos Archivados

Los elementos **archivados** son registros históricos que conservas:

- ✅ Se mantienen para consulta
- ✅ Conservan toda su información
- ✅ Puedes buscarlos cuando los necesites
- ✅ NO cuentan para el límite de cantidad
- ⚠️ SÍ ocupan espacio de almacenamiento

**Ejemplo**: Puedes archivar casos cerrados para liberar espacio para nuevos casos activos.

### 🔄 ¿Cómo funciona el archivado?

```
Estado Inicial (Plan Free):
├── 5 Carpetas Activas (límite alcanzado)
└── 0 Carpetas Archivadas

Acción: Archivar 2 carpetas antiguas
         ↓
Estado Final:
├── 3 Carpetas Activas (2 espacios libres)
└── 2 Carpetas Archivadas

Resultado: ¡Puedes crear 2 carpetas nuevas!
```

---

## Sistema de Almacenamiento

### 📊 ¿Qué cuenta para el almacenamiento?

El almacenamiento total incluye **TODOS** tus datos (activos + archivados):

| Tipo de Elemento | Tamaño Aproximado | Equivalencia                   |
| ---------------- | ----------------- | ------------------------------ |
| **Contacto**     | 2 KB              | ~500 contactos = 1 MB          |
| **Carpeta**      | 10 KB             | ~100 carpetas = 1 MB           |
| **Calculadora**  | 5 KB              | ~200 calculadoras = 1 MB       |
| **Archivo PDF**  | Variable          | Según tamaño real del archivo  |
| **Imagen**       | Variable          | Según tamaño real de la imagen |

### 🧮 Ejemplo de Cálculo

**Usuario con Plan Standard (1 GB):**

```
Elementos:
- 30 carpetas activas      = 300 KB
- 70 carpetas archivadas   = 700 KB
- 50 contactos             = 100 KB
- 10 calculadoras          = 50 KB
- 5 PDFs (promedio 2 MB c/u) = 10 MB
                           ___________
TOTAL USADO:               ~11.15 MB de 1,024 MB (1.1%)
```

### 📈 Indicadores de Uso

El sistema te mostrará tu uso de almacenamiento con colores:

- 🟢 **Verde** (0-60%): Uso normal, sin preocupaciones
- 🟡 **Amarillo** (60-80%): Considera limpiar elementos antiguos
- 🔴 **Rojo** (80-100%): Acción necesaria pronto

---

## Período de Gracia

### ⏰ ¿Qué es el Período de Gracia?

Es un tiempo adicional que te damos cuando:

- Cambias a un plan inferior (downgrade)
- Hay un problema temporal con tu pago
- Tu suscripción está por vencer

Durante este período:

- ✅ Puedes seguir trabajando normalmente
- ⚠️ Recibirás avisos para ajustar tu uso
- 📅 Típicamente dura entre 7 y 30 días

### 📋 Ejemplo Práctico

```
Situación: Cambias de Premium (500 carpetas) a Standard (50 carpetas)
Tienes actualmente: 100 carpetas activas

Día 1-30 (Período de Gracia):
✅ Puedes seguir usando tus 100 carpetas
✅ Recibes recordatorios para archivar 50 carpetas
⚠️ Se muestra advertencia en cada operación

Día 31 (Gracia Expirada):
❌ No puedes crear nuevas carpetas
✅ Puedes archivar carpetas para cumplir el límite
✅ Una vez bajo el límite, todo vuelve a la normalidad
```

---

## Preguntas Frecuentes

### ❓ ¿Puedo recuperar elementos archivados?

**Sí**, puedes desarchivar elementos en cualquier momento, pero:

- Necesitas tener espacio disponible en tu límite de activos
- El elemento volverá a contar para tu límite de cantidad

### ❓ ¿Qué pasa si elimino en lugar de archivar?

| Acción       | Efecto en Límite de Cantidad | Efecto en Almacenamiento |
| ------------ | ---------------------------- | ------------------------ |
| **Archivar** | ✅ Libera espacio            | ❌ Mantiene el uso       |
| **Eliminar** | ✅ Libera espacio            | ✅ Libera espacio        |

⚠️ **Importante**: Los elementos eliminados no se pueden recuperar.

### ❓ ¿Cómo sé cuánto espacio me queda?

Puedes ver tu uso actual en:

- Dashboard principal (widget de almacenamiento)
- Configuración de cuenta
- Al intentar crear nuevos elementos

### ❓ ¿Puedo comprar almacenamiento adicional?

Actualmente, el almacenamiento está vinculado a tu plan. Para más espacio, necesitas actualizar a un plan superior.

### ❓ ¿Los archivos adjuntos cuentan?

Sí, todos los archivos adjuntos (PDFs, imágenes, documentos) cuentan para tu límite de almacenamiento con su tamaño real.

---

## Consejos para Optimizar

### 🎯 Mejores Prácticas

1. **Archiva Regularmente**

   - Casos cerrados hace más de 6 meses
   - Contactos inactivos
   - Calculadoras de casos finalizados

2. **Gestiona Archivos Inteligentemente**

   - Comprime PDFs grandes antes de subirlos
   - Elimina duplicados
   - Usa enlaces externos para archivos muy grandes

3. **Organiza por Prioridad**
   - Mantén activos solo casos en curso
   - Usa etiquetas para organizar sin crear carpetas extra
   - Agrupa contactos relacionados

### 📊 Estrategia de Archivado Sugerida

| Tiempo desde Última Actividad | Acción Recomendada                |
| ----------------------------- | --------------------------------- |
| Más de 12 meses               | Archivar automáticamente          |
| 6-12 meses                    | Revisar y archivar selectivamente |
| 3-6 meses                     | Mantener activo si es relevante   |
| Menos de 3 meses              | Mantener siempre activo           |

### 🔔 Configuración de Alertas

Recomendamos configurar alertas cuando:

- Alcances el 80% de tu límite de cantidad
- Uses más del 70% de tu almacenamiento
- Te queden 7 días de período de gracia

---

## Acciones Rápidas

### 🚀 Si alcanzas tu límite de elementos activos:

1. **Opción A**: Archiva elementos antiguos

   - Ve a la lista de carpetas/contactos
   - Filtra por "Más antiguos"
   - Selecciona y archiva masivamente

2. **Opción B**: Actualiza tu plan
   - Ve a Configuración → Suscripción
   - Compara planes
   - Actualiza instantáneamente

### 💾 Si te quedas sin almacenamiento:

1. **Libera espacio**:

   - Elimina archivos duplicados
   - Comprime documentos grandes
   - Elimina elementos que ya no necesitas

2. **Considera un upgrade**:
   - Plan Standard: 20x más espacio que Free
   - Plan Premium: 10x más espacio que Standard

---

## Soporte

### 📧 ¿Necesitas ayuda?

- **Plan Free**: Soporte por email en soporte@lawanalytics.app
- **Plan Standard**: Email prioritario con respuesta en 24h
- **Plan Premium**: Chat en vivo y email con respuesta en 4h

### 📚 Recursos Adicionales

- [Centro de Ayuda](https://ayuda.lawanalytics.app)
- [Video Tutoriales](https://lawanalytics.app/tutoriales)
- [Blog con Consejos](https://blog.lawanalytics.app)

---

## Resumen de Límites por Plan

### Plan Free

```
Elementos Activos:
├── 5 Carpetas
├── 3 Calculadoras
└── 10 Contactos

Almacenamiento Total: 50 MB
Ideal para: Comenzar y probar el sistema
```

### Plan Standard

```
Elementos Activos:
├── 50 Carpetas
├── 20 Calculadoras
└── 100 Contactos

Almacenamiento Total: 1 GB
Ideal para: Despachos pequeños y medianos
```

### Plan Premium

```
Elementos Activos:
├── 500 Carpetas
├── 200 Calculadoras
└── 1,000 Contactos

Almacenamiento Total: 5 GB
Ideal para: Firmas grandes y estudios jurídicos
```

---

_Última actualización: Diciembre 2024_
_Versión: 1.0.0_

💡 **Tip Final**: Mantén tu espacio organizado archivando regularmente. Un workspace limpio es un workspace productivo.
