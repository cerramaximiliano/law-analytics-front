# Informe: Rutas de Colecciones y Consumo del Estado Calculators

## 1. Rutas API que obtienen colecciones de Calculators

### Resumen completo de rutas:

#### **Operaciones CRUD básicas**

- `POST /api/calculators` - Crear nuevo calculator
- `PUT /api/calculators/${id}` - Actualizar calculator existente
- `DELETE /api/calculators/${id}` - Eliminar calculator

#### **Obtención de colecciones**

- `/api/calculators/user/${userId}` - `getCalculatorsByUserId`
- `/api/calculators/user/${userId}?archived=true` - `getArchivedCalculatorsByUserId`
- `/api/calculators/group/${groupId}` - `getCalculatorsByGroupId`
- `/api/calculators/folder/${folderId}` - `getCalculatorsByFolderId`
- `/api/calculators/filter?${queryParams}` - `getCalculatorsByFilter`

#### **Operaciones de archivo**

- `POST /api/subscriptions/archive-items` - Archivar múltiples calculators
- `POST /api/subscriptions/unarchive-items` - Desarchivar múltiples calculators

## 2. Uso de las funciones de obtención de Calculators

### **getCalculatorsByUserId(userId)**

#### Ubicaciones de uso:

1. **src/pages/calculator/all/index.tsx**
   - **Propósito**: Carga inicial de todos los calculators del usuario
   - **Contexto**: Vista principal de gestión de calculators
   - **Estado actualizado**: `calculators`

### **getArchivedCalculatorsByUserId(userId)**

#### Ubicaciones de uso:

1. **src/pages/calculator/all/index.tsx**
   - **Propósito**: Cargar calculators archivados cuando se abre el modal de archivados
   - **Contexto**: Modal de elementos archivados
   - **Estado actualizado**: `archivedCalculators`

### **getCalculatorsByFolderId(folderId)**

#### Ubicaciones de uso:

1. **src/pages/apps/folders/details/components/CalcTable.tsx**

   - Tabla principal de calculators en vista de carpeta

2. **src/pages/apps/folders/details/components/CalcTableCompact.tsx**

   - Vista compacta de calculators en carpeta

3. **src/pages/apps/folders/details/components/CalcTableEnhanced.tsx**

   - Vista mejorada con funcionalidades adicionales

4. **src/pages/apps/folders/details/modals/ModalCalcTable.tsx**
   - Modal con tabla de calculators de la carpeta

**Propósito común**: Mostrar calculators asociados a una carpeta específica
**Estado actualizado**: `selectedCalculators`

### **getCalculatorsByFilter(params)**

#### Ubicaciones de uso:

1. **src/pages/calculator/labor/components/SavedLabor.tsx**
   - Filtro: `{ type: 'laboral', userId }`
2. **src/pages/calculator/civil/components/SavedCivil.tsx**
   - Filtro: `{ type: 'civil', userId }`
3. **src/pages/calculator/intereses/components/SavedIntereses.tsx**
   - Filtro: `{ type: 'intereses', userId }`
4. **src/pages/apps/folders/details/alternatives/GestionTabImproved.tsx**
   - Filtros múltiples según necesidad
5. **src/pages/apps/folders/details/modals/ModalCalcData.tsx**
   - Filtros contextuales según datos mostrados

**Propósito**: Obtener calculators con filtros específicos de tipo y otros criterios
**Estado actualizado**: `selectedCalculators`

### **getCalculatorsByGroupId(groupId)**

- **Estado**: Implementada pero NO utilizada actualmente
- **Ubicación**: Solo existe en el reducer
- **Nota**: Similar a folders, sugiere funcionalidad de grupos no implementada

## 3. Componentes que consumen el estado calculator

### **Categorías de consumo:**

#### **1. Gestión principal de calculators**

- `src/pages/calculator/all/index.tsx`
  - Acceso: `const { calculators, archivedCalculators, isLoader } = useSelector((state) => state.calculator);`
  - Funcionalidad: Vista principal, archivado, búsqueda, filtrado

#### **2. Calculators por tipo**

- `src/pages/calculator/labor/components/SavedLabor.tsx`
  - Acceso: `const { selectedCalculators, isLoader } = useSelector((state) => state.calculator);`
- `src/pages/calculator/civil/components/SavedCivil.tsx`
  - Acceso: `const { selectedCalculators, isLoader } = useSelector((state) => state.calculator);`
- `src/pages/calculator/intereses/components/SavedIntereses.tsx`
  - Acceso: `const { selectedCalculators, isLoader } = useSelector((state) => state.calculator);`

#### **3. Integración con carpetas (folders)**

- `src/pages/apps/folders/details/components/CalcTable.tsx`
- `src/pages/apps/folders/details/components/CalcTableCompact.tsx`
- `src/pages/apps/folders/details/components/CalcTableEnhanced.tsx`
- `src/pages/apps/folders/details/alternatives/GestionTabImproved.tsx`
- `src/pages/apps/folders/details/modals/ModalCalcTable.tsx`
- `src/pages/apps/folders/details/modals/ModalCalcData.tsx`

Todos acceden principalmente a: `selectedCalculators` para mostrar calculators filtrados por carpeta

#### **4. Componentes de búsqueda y navegación**

- `src/components/search/SearchModal.tsx` - Búsqueda global incluyendo calculators
- `src/hooks/useSearchEntityLoader.ts` - Hook para cargar datos de búsqueda

### **Estructura del estado Calculator:**

```typescript
interface CalculatorStateProps {
	calculators: CalculatorType[]; // Lista completa de calculators del usuario
	selectedCalculators: CalculatorType[]; // Calculators filtrados (por tipo, carpeta, etc.)
	archivedCalculators: CalculatorType[]; // Calculators archivados
	isLoader: boolean; // Indicador de carga
	error: string | null; // Manejo de errores
}
```

### **Patrones de acceso al estado:**

```typescript
// Para lista completa y archivados
const { calculators, archivedCalculators, isLoader } = useSelector((state) => state.calculator);

// Para listas filtradas
const { selectedCalculators, isLoader } = useSelector((state) => state.calculator);
```

## 4. Observaciones importantes

1. **Doble estado para calculators**: A diferencia de folders, calculator mantiene dos listas principales:

   - `calculators`: Lista completa del usuario
   - `selectedCalculators`: Lista filtrada según contexto

2. **Fuerte integración con folders**: Muchos componentes de calculators están dentro del módulo de folders, mostrando la relación estrecha entre ambas entidades.

3. **Filtrado por tipo**: Los calculators se filtran principalmente por tipo (laboral, civil, intereses), lo que sugiere que son entidades polimórficas.

4. **getCalculatorsByGroupId no utilizada**: Al igual que con folders, existe la función pero no se usa, indicando funcionalidad de grupos pendiente.

5. **Sistema de archivado robusto**: A diferencia de otras entidades, calculators tiene un sistema completo de archivado/desarchivado con límites de suscripción.

6. **Carga diferenciada**: El uso de `selectedCalculators` permite cargar solo los datos necesarios según el contexto, optimizando el rendimiento.

## 5. Comparación con Folders

| Aspecto             | Folders     | Calculators                          |
| ------------------- | ----------- | ------------------------------------ |
| Estados principales | 1 (folders) | 2 (calculators, selectedCalculators) |
| Archivado           | Sí          | Sí                                   |
| Filtrado por tipo   | No          | Sí (laboral, civil, intereses)       |
| Integración         | Central     | Dependiente de folders               |
| Grupos              | No usado    | No usado                             |

---

_Fecha de generación: ${new Date().toLocaleDateString('es-ES')}_
