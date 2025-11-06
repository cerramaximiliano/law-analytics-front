# Guía de Límites de Recursos: Folders, Calculators y Contacts

## Índice

1. [Conceptos Fundamentales](#conceptos-fundamentales)
2. [Límites por Plan](#límites-por-plan)
3. [Reglas de Aplicación](#reglas-de-aplicación)
4. [Elementos Activos vs Archivados](#elementos-activos-vs-archivados)
5. [Período de Gracia](#período-de-gracia)
6. [Casos de Uso y Ejemplos](#casos-de-uso-y-ejemplos)
7. [API y Verificación](#api-y-verificación)
8. [Preguntas Frecuentes](#preguntas-frecuentes)

## Conceptos Fundamentales

### Dos Tipos de Límites

El sistema maneja **DOS tipos de límites diferentes**:

1. **Límite de CANTIDAD**: Aplica solo a elementos **ACTIVOS** (no archivados)
2. **Límite de STORAGE**: Aplica al **TOTAL** de elementos (activos + archivados)

### ¿Qué cuenta para cada límite?

| Recurso              | Límite de Cantidad | Límite de Storage   |
| -------------------- | ------------------ | ------------------- |
| Folder activo        | ✅ SÍ cuenta       | ✅ SÍ cuenta (10KB) |
| Folder archivado     | ❌ NO cuenta       | ✅ SÍ cuenta (10KB) |
| Calculator activo    | ✅ SÍ cuenta       | ✅ SÍ cuenta (5KB)  |
| Calculator archivado | ❌ NO cuenta       | ✅ SÍ cuenta (5KB)  |
| Contact activo       | ✅ SÍ cuenta       | ✅ SÍ cuenta (2KB)  |
| Contact archivado    | ❌ NO cuenta       | ✅ SÍ cuenta (2KB)  |

## Límites por Plan

### Plan FREE

| Recurso         | Límite Activos         | Storage Total |
| --------------- | ---------------------- | ------------- |
| **Folders**     | 5 carpetas activas     | 50 MB total   |
| **Calculators** | 3 calculadoras activas | (compartido)  |
| **Contacts**    | 10 contactos activos   | (compartido)  |

### Plan STANDARD

| Recurso         | Límite Activos          | Storage Total  |
| --------------- | ----------------------- | -------------- |
| **Folders**     | 50 carpetas activas     | 1,024 MB (1GB) |
| **Calculators** | 20 calculadoras activas | (compartido)   |
| **Contacts**    | 100 contactos activos   | (compartido)   |

### Plan PREMIUM

| Recurso         | Límite Activos           | Storage Total    |
| --------------- | ------------------------ | ---------------- |
| **Folders**     | 500 carpetas activas     | 10,240 MB (10GB) |
| **Calculators** | 200 calculadoras activas | (compartido)     |
| **Contacts**    | 1,000 contactos activos  | (compartido)     |

## Reglas de Aplicación

### 🟢 CUÁNDO SÍ SE PUEDE GUARDAR

#### 1. Elemento ACTIVO (archived: false)

```javascript
✅ SE PUEDE si:
- Cantidad de elementos activos < Límite del plan
- O está en período de gracia

Ejemplo Plan Standard:
- Tienes: 49 folders activos, 100 archivados
- Límite: 50 folders activos
- Resultado: ✅ PUEDES crear 1 folder activo más
```

#### 2. Elemento ARCHIVADO (archived: true)

```javascript
✅ SE PUEDE si:
- Storage total usado + tamaño nuevo < Límite storage del plan

Ejemplo Plan Standard (1GB storage):
- Tienes: 500MB usados
- Nuevo folder archivado: 10KB
- Resultado: ✅ PUEDES crear (500MB + 10KB < 1GB)
```

### 🔴 CUÁNDO NO SE PUEDE GUARDAR

#### 1. Elemento ACTIVO - Límite excedido

```javascript
❌ NO SE PUEDE si:
- Cantidad de elementos activos >= Límite del plan
- Y NO está en período de gracia

Ejemplo Plan Free:
- Tienes: 5 folders activos
- Límite: 5 folders activos
- Resultado: ❌ NO PUEDES crear más folders activos
- Solución: Archivar folders o actualizar plan
```

#### 2. Elemento ARCHIVADO - Sin storage

```javascript
❌ NO SE PUEDE si:
- Storage total usado + tamaño nuevo > Límite storage

Ejemplo Plan Free (50MB storage):
- Tienes: 49MB usados
- Nuevo folder archivado: 10KB
- Total sería: 49MB + 10KB = 49.01MB
- Resultado: ✅ AÚN PUEDES (menor a 50MB)

Pero si tienes 49.995MB:
- Total sería: 49.995MB + 10KB = 50.005MB
- Resultado: ❌ NO PUEDES (excede 50MB)
```

## Elementos Activos vs Archivados

### Características de Elementos ACTIVOS

```javascript
{
  archived: false,  // o campo no existe
  // Características:
  // - Visible en listados principales
  // - Cuenta para límite de cantidad
  // - Se puede editar libremente
  // - Aparece en búsquedas
}
```

**Verificación al crear:**

1. ¿Cuántos elementos activos tengo?
2. ¿Es menor al límite del plan?
3. Sí → Crear / No → Verificar período de gracia

### Características de Elementos ARCHIVADOS

```javascript
{
  archived: true,
  archivedAt: "2024-12-19T10:00:00Z",
  // Características:
  // - NO visible en listados principales
  // - NO cuenta para límite de cantidad
  // - SÍ cuenta para storage total
  // - Acceso limitado (solo consulta)
}
```

**Verificación al crear:**

1. ¿Cuánto storage tengo usado?
2. ¿Hay espacio para 10KB/5KB/2KB más?
3. Sí → Crear / No → Bloquear

### Estrategia de Archivado

```javascript
// BUENA PRÁCTICA: Archivar en lugar de eliminar
// Permite mantener histórico sin ocupar límite de activos

// Caso de uso: Plan Free con 5 folders máximo
Estado inicial: 5 folders activos (límite alcanzado)
↓
Archivar 2 folders antiguos
↓
Estado final: 3 activos + 2 archivados
↓
Resultado: Puedes crear 2 folders nuevos
```

## Período de Gracia

### ¿Qué es?

Un período temporal donde **SE IGNORAN los límites de cantidad** pero se mantienen los de storage.

### Activación

Se activa en 3 escenarios:

1. **Downgrade de Plan**

   ```
   Premium (500 folders) → Standard (50 folders)
   Si tienes 100 folders activos:
   - Entras en período de gracia
   - Puedes seguir operando normalmente
   - Tienes 30 días para reducir a 50
   ```

2. **Fallo de Pago**

   ```
   Tarjeta rechazada → Plan se mantiene temporalmente
   - 7-14 días de gracia típicamente
   - Permite continuidad del servicio
   ```

3. **Cancelación Pendiente**
   ```
   Cancelas suscripción → Activa hasta fin de período
   - Funcionalidad completa hasta fecha de expiración
   ```

### Comportamiento Durante el Período

```javascript
// CON período de gracia activo:
{
  Plan: "Standard" (límite: 50 folders)
  Folders activos: 75
  Período de gracia: Activo hasta 2024-12-31

  Crear folder activo #76: ✅ PERMITIDO (con advertencia)
  Crear folder archivado: Depende del storage
}

// Respuesta incluye advertencia:
{
  success: true,
  folder: { ... },
  gracePeriodWarning: {
    inGracePeriod: true,
    expiresAt: "2024-12-31T23:59:59Z",
    daysRemaining: 7,
    message: "Tienes 75 de 50 folders permitidos. Ajusta antes del 31/12"
  }
}
```

### Después del Período de Gracia

```javascript
// SIN período de gracia:
{
  Plan: "Standard" (límite: 50 folders)
  Folders activos: 75
  Período de gracia: EXPIRADO

  Crear folder activo #76: ❌ BLOQUEADO
  Opciones:
  1. Archivar 26 folders para cumplir límite
  2. Actualizar a Premium
  3. Eliminar folders no necesarios
}
```

## Casos de Uso y Ejemplos

### Caso 1: Usuario Free alcanza límite

```javascript
// Situación:
Plan: FREE
Folders: 5/5 activos, 0 archivados
Storage: 10MB/50MB usado

// Intenta crear folder #6
POST /api/folders { name: "Nuevo", archived: false }
Resultado: ❌ ERROR 403 "Límite alcanzado"

// Soluciones:
1. Archivar folder antiguo:
   PUT /api/folders/123 { archived: true }
   Ahora: 4/5 activos, 1 archivado
   POST /api/folders { name: "Nuevo" } → ✅ ÉXITO

2. Crear directamente como archivado:
   POST /api/folders { name: "Backup", archived: true }
   Si storage < 50MB → ✅ ÉXITO
```

### Caso 2: Migración masiva con archivado

```javascript
// Situación: Importar 100 folders históricos
Plan: STANDARD (límite: 50 activos, 1GB storage)

// Estrategia:
for (folder of folders) {
  if (folder.year < 2024) {
    folder.archived = true;  // Antiguos como archivados
  } else {
    folder.archived = false; // Recientes como activos
  }
  await createFolder(folder);
}

// Resultado:
- 30 folders activos (2024) ✅ Dentro del límite
- 70 folders archivados (<2024) ✅ Solo usan storage
- Storage usado: ~1MB (100 folders × 10KB)
```

### Caso 3: Downgrade con período de gracia

```javascript
// Situación inicial:
Plan: PREMIUM
Folders activos: 200
Calculators activos: 50

// Usuario hace downgrade a STANDARD:
Nuevo plan: STANDARD (límite: 50 folders, 20 calculators)
Estado: PERÍODO DE GRACIA (30 días)

// Durante los 30 días:
- Puede crear más folders ✅ (con advertencia)
- Puede seguir operando normalmente ✅
- Recibe notificaciones diarias del estado

// Día 31 (gracia expirada):
- NO puede crear folders (200 > 50) ❌
- NO puede crear calculators (50 > 20) ❌
- DEBE archivar o eliminar exceso
```

## API y Verificación

### Endpoints de Verificación

#### 1. Verificar límite antes de crear

```http
GET /api/plan-configs/check-resource/folders
Authorization: Bearer {token}
```

**Respuesta:**

```json
{
	"isWithinLimit": false,
	"currentCount": 50,
	"limit": 50,
	"plan": "standard",
	"percentageUsed": 100,
	"canArchive": true,
	"storageAvailable": true,
	"suggestions": ["Archive old folders to free up active slots", "Upgrade to Premium for 500 active folders"]
}
```

#### 2. Crear con verificación automática

```http
POST /api/folders
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Nueva Carpeta",
  "client": "Cliente ABC",
  "archived": false  // Crítico: determina qué límite aplica
}
```

### Middleware de Verificación

```javascript
// routes/folderRoutes.js
router.post(
	"/",
	authMiddleware,
	checkResourceLimits("folders"), // ← Verifica automáticamente
	createFolder,
);
```

### Flujo interno del Middleware

```javascript
checkResourceLimits('folders') {
  1. ¿Es archived: true?
     SÍ → Verificar storage disponible
     NO → Continuar al paso 2

  2. Obtener cantidad actual de folders activos

  3. Comparar con límite del plan

  4. ¿Está dentro del límite?
     SÍ → next() [continuar]
     NO → Verificar período de gracia

  5. ¿Tiene período de gracia activo?
     SÍ → next() con advertencia
     NO → res.status(403) [bloquear]
}
```

## Preguntas Frecuentes

### ¿Por qué puedo tener más elementos que mi límite?

**R:** Probablemente tienes elementos archivados o estás en período de gracia.

- Archivados no cuentan para límite de cantidad
- Período de gracia permite exceder temporalmente

### ¿Qué pasa si archivo todos mis folders?

**R:** Puedes crear nuevos hasta el límite del plan.

```
Ejemplo: Plan Free (5 folders)
- Archives 5 folders → 0 activos
- Puedes crear 5 nuevos folders activos
- Total: 5 activos + 5 archivados = 10 folders
```

### ¿Puedo desarchivar si estoy en el límite?

**R:** NO, desarchivar cuenta como crear un elemento activo.

```javascript
// Situación: 50/50 folders activos (límite)
PUT /api/folders/123 { archived: false }
Resultado: ❌ ERROR 403 "Límite alcanzado"

// Primero debes archivar otro folder
```

### ¿Los elementos archivados tienen algún límite?

**R:** SÍ, el límite de STORAGE total del plan.

```
Plan Free: 50MB total
- Puedes tener 5,000 folders archivados si usas < 50MB
- O solo 5 si cada uno tiene archivos pesados
```

### ¿Cómo optimizo mi uso de límites?

**R:** Estrategias recomendadas:

1. **Archivar regularmente**: Folders cerrados > 6 meses
2. **Limpiar duplicados**: Reduce storage usado
3. **Usar etiquetas**: En vez de múltiples folders
4. **Revisar período de gracia**: Ajustar antes de que expire

### ¿Qué pasa si elimino en lugar de archivar?

**R:** Pierdes el histórico pero liberas ambos límites.

| Acción   | Límite Cantidad | Storage     |
| -------- | --------------- | ----------- |
| Archivar | ✅ Libera       | ❌ Mantiene |
| Eliminar | ✅ Libera       | ✅ Libera   |

### ¿Cómo sé cuánto me queda disponible?

**R:** Consulta el endpoint de estadísticas:

```http
GET /api/user-stats/user
```

Te mostrará:

- Elementos activos actuales vs límite
- Storage usado vs disponible
- Días restantes de período de gracia (si aplica)

## Scripts Útiles

### Archivar folders antiguos masivamente

```javascript
// scripts/archiveOldFolders.js
const MONTHS_TO_ARCHIVE = 6;
const cutoffDate = new Date();
cutoffDate.setMonth(cutoffDate.getMonth() - MONTHS_TO_ARCHIVE);

await Folder.updateMany(
	{
		userId: userId,
		archived: false,
		updatedAt: { $lt: cutoffDate },
	},
	{
		$set: {
			archived: true,
			archivedAt: new Date(),
		},
	},
);
```

### Verificar estado de límites

```javascript
// scripts/checkUserLimits.js
const stats = await UserStats.findOne({ userId });
const subscription = await Subscription.findOne({ user: userId });
const planConfig = await PlanConfig.findOne({ planId: subscription.plan });

console.log("Límites actuales:");
planConfig.resourceLimits.forEach((limit) => {
	const current = stats.counts[limit.name] || 0;
	const percentage = (current / limit.limit) * 100;
	console.log(`${limit.name}: ${current}/${limit.limit} (${percentage.toFixed(1)}%)`);
});
```

## Resumen de Reglas Clave

1. **Elementos ACTIVOS**: Verifican límite de CANTIDAD
2. **Elementos ARCHIVADOS**: Verifican límite de STORAGE
3. **Período de gracia**: Ignora límites de cantidad temporalmente
4. **Storage**: Siempre se verifica, sin excepciones
5. **Archivar ≠ Eliminar**: Archivar mantiene datos usando storage
6. **Desarchivar = Crear**: Cuenta como nuevo elemento activo

---

_Última actualización: Diciembre 2024_
_Versión: 1.0.0_
