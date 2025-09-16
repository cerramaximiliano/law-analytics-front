# 📁 Guía de Estados Visuales de Folders

## Descripción General

Este documento describe los diferentes estados visuales que puede tener un folder/causa en la tabla de la vista `/apps/folders/list` de Law Analytics. Estos estados indican el nivel de verificación y validación de cada expediente judicial en el sistema.

## ⚠️ Condición Principal para Mostrar Indicadores

**IMPORTANTE**: Los indicadores visuales de estado SOLO se mostrarán cuando:
- `pjn === true` (Folder vinculado al Poder Judicial de la Nación) **O**
- `mev === true` (Folder con Movimientos Electrónicos Verificados)

Si ambas propiedades son `false`, se mostrará únicamente el nombre del folder sin ningún indicador visual.

## 📊 Tabla de Estados Visuales

| **Indicador Visual** | **Descripción** | **Condición Previa** | **Condiciones de Estado** | **Tooltip/Mensaje** | **Acciones** |
|---------------------|-----------------|---------------------|--------------------------|---------------------|--------------|
| **Solo nombre del folder** | Sin vinculación judicial | `pjn = false`<br>`mev = false` | N/A | Ninguno | Ninguna |
| 🟢 **Ícono de tilde verde** (TickCircle) | Causa verificada y válida | `pjn = true` **O**<br>`mev = true` | `causaVerified = true`<br>**Y**<br>`causaIsValid = true` | • "Causa vinculada a PJN" (si `pjn = true`)<br>• "Causa vinculada" (si `pjn = false`) | Ninguna |
| 🟡 **Chip amarillo** "Pendiente de verificación" | Causa pendiente de verificar | `pjn = true` **O**<br>`mev = true` | `causaVerified = false` | "Actualizar estado de verificación" | Botón 🔄 |
| 🔴 **Ícono cruz roja** (CloseCircle) + **Chip rojo** "Causa inválida" | Causa verificada pero inválida | `pjn = true` **O**<br>`mev = true` | `causaVerified = true`<br>**Y**<br>`causaIsValid = false` | "Causa inválida - No se pudo verificar en el Poder Judicial" | Ninguna |
| 🟡 **Chip amarillo** "Pendiente" | Estado legacy para compatibilidad | `pjn = true` **O**<br>`mev = true` | `folderName = "Pendiente"` | "Actualizar estado de verificación" | Botón 🔄 |

### 📝 Notas sobre la tabla:
- **Condición Previa**: Debe cumplirse PRIMERO para que se evalúen las condiciones de estado
- **Condiciones de Estado**: Se evalúan SOLO si la condición previa es verdadera
- Los operadores lógicos son: **Y** (ambas condiciones deben ser verdaderas), **O** (al menos una debe ser verdadera)
- Si `pjn = false` Y `mev = false`, no se evalúan las condiciones de estado y solo se muestra el nombre

## 🔄 Diagrama de Flujo de Estados

```mermaid
graph TD
    A[Folder Creado] --> B{pjn === true O<br/>mev === true?}
    B -->|No| C[Solo nombre del folder<br/>Sin indicadores visuales]
    B -->|Sí| D{causaVerified?}
    D -->|false| E[🟡 Pendiente de verificación]
    E -->|Usuario hace clic en actualizar| F[Proceso de verificación]
    F --> G{Verificación exitosa?}
    G -->|Sí| H{causaVerified = true}
    H --> I{causaIsValid?}
    I -->|true| J[🟢 Causa Válida<br/>Ícono tilde verde]
    I -->|false| K[🔴 Causa Inválida<br/>Ícono cruz roja]
    G -->|No| E
    D -->|true| I
```

## 📋 Propiedades del Sistema

### Propiedades Principales

- **`pjn`** (Boolean): Indica si la causa está vinculada al Poder Judicial de la Nación
- **`mev`** (Boolean): Indica si el folder tiene Movimientos Electrónicos Verificados
- **`causaVerified`** (Boolean): Indica si se ha intentado verificar la causa en el sistema judicial
- **`causaIsValid`** (Boolean): Indica si la causa es válida en el sistema judicial
- **`causaAssociationStatus`** (String): Estado de asociación (success, pending, failed)
- **`causaUpdateEnabled`** (Boolean): Indica si las actualizaciones automáticas están habilitadas

### Propiedades Relacionadas

- **`causaId`**: ID de la causa vinculada en el sistema judicial
- **`causaType`**: Tipo de causa (CausasCivil, CausasTrabajo, CausasSegSocial)
- **`folderName`**: Nombre/carátula del expediente (máximo 50 caracteres en vista)

## 🛠️ Implementación Técnica

### Ubicación del Código
- **Archivo principal**: `/src/pages/apps/folders/folders.tsx`
- **Líneas**: 689-804 (definición de la columna "Carátula")
- **Tipos**: `/src/types/folder.ts`

### Lógica de Visualización
```javascript
// Verificación principal antes de mostrar cualquier indicador
const showStatusIndicators = folder.pjn === true || folder.mev === true;

if (!showStatusIndicators) {
    // Si pjn y mev son false, solo mostrar el nombre
    return <span>{formatFolderName(value, 50)}</span>;
}

// Si pasa la verificación, aplicar la lógica de estados visuales
```

### Función de Actualización
Cuando el usuario hace clic en el botón de actualización (🔄):

```javascript
dispatch(getFolderById(folder._id, true))
```

Esta acción:
1. Consulta el estado actual del folder en la base de datos
2. Intenta verificar contra el sistema del Poder Judicial
3. Actualiza las propiedades `causaVerified` y `causaIsValid`
4. Refresca la vista de la tabla

### Campos Solicitados al Backend
Los campos específicos solicitados en las consultas son:
```
_id, folderName, status, materia, orderStatus,
initialDateFolder, finalDateFolder, folderJuris,
folderFuero, description, customerName, pjn,
causaVerified, causaIsValid, causaAssociationStatus
```

## 🎨 Aspectos Visuales

### Colores y Estilos
- **Verde (#22C55E)**: Causa válida y verificada
- **Amarillo (warning)**: Estado pendiente
- **Rojo (#EF4444)**: Causa inválida
- **Tamaño de íconos**: 16px
- **Tamaño de chips**: "small"
- **Variante de chips**: "light"

### Truncamiento de Texto
- Los nombres de folders se truncan a **50 caracteres** máximo
- Se usa la función `formatFolderName(value, 50)`

## 📌 Casos de Uso

### Caso 1: Folder sin vinculación judicial
1. Usuario crea un nuevo folder
2. No activa PJN ni MEV (`pjn === false` y `mev === false`)
3. Sistema muestra SOLO el nombre del folder
4. No hay indicadores visuales de estado

### Caso 2: Folder con vinculación pendiente
1. Usuario crea folder con PJN o MEV activado
2. Sistema muestra chip amarillo "Pendiente de verificación"
3. Usuario puede hacer clic en actualizar para verificar

### Caso 3: Verificación exitosa
1. Sistema verifica el expediente en el Poder Judicial
2. Expediente existe y es válido
3. Se muestra ícono de tilde verde
4. Solo visible si `pjn === true` o `mev === true`

### Caso 4: Verificación fallida
1. Sistema intenta verificar el expediente
2. Expediente no existe o datos no coinciden
3. Se muestra ícono de cruz roja con chip "Causa inválida"
4. Solo visible si `pjn === true` o `mev === true`

### Caso 5: Folder mixto
1. Folder tiene `pjn === false` pero `mev === true`
2. Se muestran los indicadores de estado
3. Permite verificación de movimientos electrónicos sin PJN

## 🔍 Consideraciones Adicionales

### Compatibilidad Legacy
El sistema mantiene compatibilidad con folders antiguos que tienen `folderName === "Pendiente"`. Estos se tratan como casos pendientes de verificación.

### Performance
- La verificación se realiza bajo demanda (no automática)
- El usuario debe iniciar manualmente el proceso de verificación
- Evita llamadas innecesarias al sistema judicial

### Accesibilidad
- Todos los íconos incluyen tooltips descriptivos
- Los colores siguen patrones de contraste accesibles
- Los estados son identificables sin depender solo del color

## 📅 Última Actualización

- **Fecha**: Enero 2025
- **Versión**: 2.0.0
- **Cambio principal**: Agregada condición para mostrar indicadores solo cuando `pjn === true` o `mev === true`
- **Autor**: Sistema Law Analytics

---

*Este documento es parte de la documentación técnica de Law Analytics y debe mantenerse actualizado con los cambios en el código.*