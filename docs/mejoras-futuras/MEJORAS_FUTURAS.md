# Mejoras Futuras - Law Analytics Front

Este documento contiene ideas y recomendaciones para futuras mejoras del sistema.

---

## Ingreso Masivo de Causas (PJN y PJBA)

**Fecha de propuesta:** 06/10/2025
**Estado:** Pendiente
**Prioridad:** Media-Alta

### Descripción

Implementar funcionalidad de ingreso masivo de causas para ambos poderes judiciales (PJN y PJBA), permitiendo crear múltiples causas en una sola operación.

### Opciones de Implementación Propuestas

#### **Opción 1: Modal Independiente "Ingreso Masivo" (Recomendada)**

**Flujo:**

1. Usuario abre modal "Ingreso Masivo"
2. Selecciona Poder Judicial (PJN o PJBA)
3. Carga archivo CSV/Excel **O** llena formulario en líneas
4. Sistema valida automáticamente cada fila
5. Muestra preview con indicadores de válido/inválido
6. Usuario confirma y envía
7. Muestra progreso de carga
8. Reporte final de éxitos/errores

**Formato CSV sugerido:**

Para PJN:

```csv
jurisdiccion,numero_expediente,año
CIV,123456,2024
CNT,789012,2023
```

Para PJBA:

```csv
jurisdiccion,organismo,numero_expediente,año
LAP,Juzgado Civil 1,123456,2024
QUI,Juzgado Penal 2,789012,2023
```

**Ventajas:**

- No interfiere con el flujo actual
- Puede ser más complejo sin afectar UX simple
- Permite cargar archivos grandes
- Ideal para migraciones masivas

**Desventajas:**

- Requiere crear nuevo modal
- Usuario debe aprender formato CSV

---

#### **Opción 2: Formulario Multi-fila en Modal Existente**

**Flujo:**

1. Usuario abre "Nueva Carpeta" → "Ingreso Automático"
2. Selecciona "Modo masivo" (toggle switch)
3. Selecciona Poder Judicial una sola vez
4. Aparece tabla con campos por fila
5. Botón "+ Agregar fila" para más causas
6. Validación en tiempo real por fila
7. Botón "Crear todas" al final

**UI Sugerida:**

```
┌─────────────────────────────────────────┐
│ Poder Judicial: [PJN ▼]                │
│                                         │
│ ┌───────────┬────────────┬──────┬───┐  │
│ │Jurisdicción│  N° Expte  │ Año  │ × │  │
│ ├───────────┼────────────┼──────┼───┤  │
│ │ CIV ▼     │  123456    │ 2024 │ × │  │
│ │ CNT ▼     │  789012    │ 2023 │ × │  │
│ └───────────┴────────────┴──────┴───┘  │
│                                         │
│ [+ Agregar otra causa]                  │
│                                         │
│ [Cancelar]            [Crear 2 causas] │
└─────────────────────────────────────────┘
```

**Ventajas:**

- Integrado en flujo existente
- Intuitivo, no requiere archivos
- Validación inmediata por fila
- Mejor para 2-10 causas

**Desventajas:**

- No escalable para muchas causas (>20)
- Puede hacer el modal muy largo

---

#### **Opción 3: Área de Texto con Formato Específico**

**Flujo:**

1. Usuario abre modal "Ingreso Masivo"
2. Selecciona Poder Judicial
3. Pega o escribe en área de texto:

```
CIV 123456/2024
CNT 789012/2023
COM 456789/2024
```

4. Sistema parsea automáticamente
5. Muestra preview en tabla
6. Usuario confirma y crea

**Ventajas:**

- Muy rápido para usuarios avanzados
- Fácil copiar/pegar desde otros sistemas
- Menos campos visuales

**Desventajas:**

- Curva de aprendizaje del formato
- Más propenso a errores de formato

---

### Recomendación Final: Opción 1 + Opción 2 Híbrida

**Implementación sugerida:**

1. **Crear nuevo modal "Ingreso Masivo"** accesible desde:

   - Botón dropdown en "Nueva Carpeta" → "Ingreso Masivo"
   - O botón independiente en toolbar de lista de carpetas

2. **Dentro del modal, ofrecer 2 métodos:**

   **Método A: Carga de archivo** (para >10 causas)

   - Drag & drop de CSV/Excel
   - Template descargable
   - Validación automática con reporte

   **Método B: Formulario multi-fila** (para 2-10 causas)

   - Tabla con filas dinámicas
   - Validación en tiempo real
   - Más intuitivo

3. **Estructura del modal:**

```
┌──────────────────────────────────────────────┐
│  Ingreso Masivo de Causas              [×]   │
├──────────────────────────────────────────────┤
│                                              │
│  Poder Judicial: [ ○ PJN  ○ PJBA ]          │
│                                              │
│  Método de ingreso:                          │
│  [ ▣ Cargar archivo ]  [ ▢ Formulario ]      │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  📁 Arrastra archivo CSV/Excel aquí    │ │
│  │     o haz click para seleccionar       │ │
│  │                                        │ │
│  │  [Descargar template]                  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Preview (0 causas válidas)             │ │
│  │  ┌────────┬────────┬──────┬─────────┐  │ │
│  │  │Jurisd. │N° Expte│ Año  │ Estado  │  │ │
│  │  ├────────┼────────┼──────┼─────────┤  │ │
│  │  │ ...    │  ...   │ ...  │   ...   │  │ │
│  │  └────────┴────────┴──────┴─────────┘  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  [Cancelar]          [Crear 0 causas]       │
└──────────────────────────────────────────────┘
```

### Backend Requerido

**Nuevo endpoint:**

```
POST /api/folders/bulk
```

**Request body:**

```json
{
  "judicialPower": "nacional" | "buenosaires",
  "folders": [
    {
      "folderJuris": "1",
      "expedientNumber": "123456",
      "expedientYear": "2024"
    },
    {
      "folderJuris": "7",
      "expedientNumber": "789012",
      "expedientYear": "2023"
    }
  ]
}
```

**Response:**

```json
{
	"success": [
		{
			"expedientNumber": "123456",
			"expedientYear": "2024",
			"folderId": "65f..."
		}
	],
	"errors": [
		{
			"expedientNumber": "789012",
			"expedientYear": "2023",
			"error": "Duplicado - Ya existe causa con este expediente"
		}
	]
}
```

**Procesamiento:**

- Promise.all o batch processing
- Validaciones por cada causa
- Control de duplicados
- Límite por request (ej: 100 causas máximo)

### Validaciones Necesarias

- **Duplicados:** Mismo expediente + año + jurisdicción
- **Formato número expediente:** Numérico, longitud válida
- **Año válido:** Entre 1900 y 2099
- **Jurisdicción/organismo válidos:** Existencia en base de datos
- **Límite por request:** Máximo 100 causas por operación

### Casos de Uso

**Por volumen:**

- 2-5 causas → Opción 2 (formulario multi-fila)
- 10-50 causas → Opción 1 (carga CSV)
- 100+ causas → Opción 1 + backend robusto con paginación

**Por origen de datos:**

- Datos de otro sistema → CSV mejor
- Datos en papel/email → Formulario mejor

**Por frecuencia:**

- Ocasional (migración inicial) → CSV simple
- Frecuente → Formulario + templates guardados

### Archivos a Modificar/Crear

**Frontend:**

- `/src/sections/apps/folders/BulkAddFolder.tsx` (nuevo)
- `/src/sections/apps/folders/index.tsx` (agregar botón)
- `/src/store/reducers/folder.ts` (agregar acción `bulkAddFolders`)
- `/src/api/folders.ts` (agregar endpoint `/bulk`)

**Backend:**

- `/routes/folders.js` (nueva ruta POST /bulk)
- `/controllers/foldersController.js` (nueva función `bulkCreate`)
- `/validators/folderValidator.js` (validación de array)

### Estimación de Esfuerzo

- **Frontend:** 3-5 días

  - Modal base: 1 día
  - Carga CSV + parsing: 1 día
  - Formulario multi-fila: 1 día
  - Validaciones + preview: 1 día
  - Testing e integración: 1 día

- **Backend:** 2-3 días
  - Endpoint bulk: 1 día
  - Validaciones: 1 día
  - Testing: 1 día

**Total estimado:** 5-8 días de desarrollo

---

## Otras Mejoras Pendientes

_(Agregar aquí otras mejoras futuras)_
