# Informe: Rutas de Colecciones y Consumo del Estado Tasks

## 1. Rutas API que obtienen colecciones de Tasks

### Resumen completo de rutas:

#### **Operaciones CRUD básicas**

- `POST /api/tasks` - Crear nueva tarea
- `GET /api/tasks/${id}` - Obtener detalle de una tarea específica
- `PUT /api/tasks/${id}` - Actualizar tarea existente
- `DELETE /api/tasks/${id}` - Eliminar tarea

#### **Obtención de colecciones**

- `/api/tasks/user/${userId}` - `getTasksByUserId`
- `/api/tasks/group/${groupId}` - `getTasksByGroupId`
- `/api/tasks/folder/${folderId}` - `getTasksByFolderId`
- `/api/tasks/upcoming/${userId}?days=${days}` - `getUpcomingTasks`

#### **Operaciones específicas de tareas**

- `PUT /api/tasks/${id}/toggle` - Cambiar estado completado/pendiente
- `POST /api/tasks/${id}/comments` - Añadir comentario a tarea
- `POST /api/tasks/${id}/subtasks` - Añadir subtarea
- `PUT /api/tasks/${id}/subtasks` - Actualizar subtarea
- `POST /api/tasks/${id}/assign` - Asignar tarea a usuarios

## 2. Uso de las funciones de obtención de Tasks

### **getTasksByUserId(userId)**

#### Ubicaciones de uso:

1. **src/pages/tasks/index.tsx**

   - **Línea 397**: En `useEffect` para carga inicial
   - **Propósito**: Cargar todas las tareas del usuario
   - **Contexto**: Vista principal de gestión de tareas
   - **Estado actualizado**: `tasks`

2. **src/pages/apps/folders/details/modals/LinkTaskModal.tsx**
   - **Línea 82**: Al abrir el modal
   - **Propósito**: Cargar tareas disponibles para vincular
   - **Estado actualizado**: `tasks`

### **getTasksByFolderId(folderId)**

#### Ubicaciones de uso:

1. **src/pages/apps/folders/details/components/TaskList.tsx**

   - **Línea 45**: En `useEffect` cuando cambia la carpeta
   - **Propósito**: Mostrar tareas de una carpeta específica

2. **src/pages/apps/folders/details/components/TaskListImproved.tsx**

   - Vista mejorada de tareas en carpeta

3. **src/pages/apps/folders/details/alternatives/GestionTabImproved.tsx**
   - **Línea 68**: Tab de gestión integral
   - **Propósito**: Mostrar tareas junto con otros recursos de la carpeta

**Estado actualizado**: `tasks` (filtradas en el componente)

### **getUpcomingTasks(userId, days)**

#### Ubicaciones de uso:

1. **src/sections/widget/chart/TaskWidget.tsx**
   - **Línea 83**: En `useEffect` al montar
   - **Propósito**: Mostrar widget con tareas próximas a vencer
   - **Parámetro days**: Por defecto 7 días
   - **Estado actualizado**: `upcomingTasks`

### **getTasksByGroupId(groupId)**

- **Estado**: Implementada pero NO utilizada actualmente
- **Ubicación**: Solo existe en el reducer
- **Nota**: Consistente con otras entidades, funcionalidad de grupos no implementada

### **getTaskDetail(taskId)**

#### Ubicaciones de uso:

1. **src/pages/tasks/index.tsx**
   - En `handleViewTask` cuando se expande una fila
   - **Propósito**: Cargar detalles completos de una tarea bajo demanda
   - **Estado actualizado**: `taskDetails[taskId]`

## 3. Componentes que consumen el estado tasks

### **Estructura del estado Tasks:**

```typescript
interface TaskState {
	tasks: TaskType[]; // Lista principal de tareas del usuario
	upcomingTasks: TaskType[]; // Tareas próximas a vencer (widget)
	task: TaskType | null; // Tarea individual (deprecated)
	taskDetails: {
		// Cache de detalles por ID
		[key: string]: TaskType;
	};
	taskDetailsLoading: {
		// Estado de carga individual
		[key: string]: boolean;
	};
	isLoader: boolean; // Estado de carga general
	error: string | null; // Manejo de errores
}
```

### **Categorías de consumo:**

#### **1. Gestión principal de tareas**

- **src/pages/tasks/index.tsx**
  ```typescript
  const { tasks, isLoader, taskDetails, taskDetailsLoading } = useSelector((state) => state.tasksReducer);
  ```
  - Lista principal con tabla, filtros, paginación
  - Expansión de filas para ver detalles
  - Operaciones CRUD completas

#### **2. Widgets y dashboards**

- **src/sections/widget/chart/TaskWidget.tsx**
  ```typescript
  const { upcomingTasks, isLoader } = useSelector((state) => state.tasksReducer);
  ```
  - Widget de tareas próximas a vencer
  - Muestra resumen en dashboard

#### **3. Integración con carpetas (folders)**

- **src/pages/apps/folders/details/components/TaskList.tsx**
  ```typescript
  const { tasks, isLoader } = useSelector((state) => state.tasksReducer);
  ```
  - Lista de tareas dentro de una carpeta
- **src/pages/apps/folders/details/components/TaskListImproved.tsx**
  - Versión mejorada con más funcionalidades
- **src/pages/apps/folders/details/alternatives/GestionTabImproved.tsx**

  - Tab integrado con múltiples recursos

- **src/pages/apps/folders/details/modals/LinkTaskModal.tsx**
  - Modal para vincular tareas existentes a carpetas

#### **4. Componentes de creación/edición**

- **src/sections/apps/tasks/AddEditTask.tsx**

  - No consume estado directamente
  - Despacha acciones: `addTask()`, `updateTask()`
  - Incluye selector de carpetas

- **src/sections/apps/tasks/TaskModal.tsx**
  - Modal wrapper para AddEditTask

#### **5. Componentes de visualización**

- **src/sections/apps/tasks/TaskDetailRow.tsx**
  - Fila expandible con detalles completos
  - Muestra subtareas, comentarios, archivos adjuntos

### **Patrones de acceso al estado:**

```typescript
// Para lista principal y estado de carga
const { tasks, isLoader } = useSelector((state) => state.tasksReducer);

// Para tareas próximas (widget)
const { upcomingTasks } = useSelector((state) => state.tasksReducer);

// Para detalles con carga individual
const { taskDetails, taskDetailsLoading } = useSelector((state) => state.tasksReducer);
```

**Nota importante**: El reducer se accede como `tasksReducer` en lugar de `tasks`, lo cual es inconsistente con otras entidades.

## 4. Características especiales de Tasks

### **Sistema de carga de detalles bajo demanda**

- Los detalles completos de cada tarea se cargan solo cuando se necesitan
- Se mantiene un cache en `taskDetails` indexado por ID
- Estado de carga individual en `taskDetailsLoading`

### **Funcionalidades adicionales**

1. **Subtareas**: Sistema jerárquico de tareas
2. **Comentarios**: Thread de comentarios por tarea
3. **Asignaciones**: Asignar tareas a múltiples usuarios
4. **Toggle de estado**: Cambio rápido completado/pendiente
5. **Archivos adjuntos**: Soporte para attachments

### **Integración con calendario**

- Las tareas con fecha de vencimiento pueden aparecer en el calendario
- Widget de tareas próximas para vista rápida

## 5. Observaciones importantes

1. **Naming inconsistente**: `tasksReducer` vs patrón común de nombres singulares (`folder`, `calculator`, `contacts`)

2. **Sistema de cache optimizado**: A diferencia de otras entidades, tasks implementa un cache sofisticado para detalles individuales

3. **Sin sistema de archivado**: A diferencia de folders, calculators y contacts, las tareas no tienen funcionalidad de archivo

4. **getTasksByGroupId no utilizada**: Consistente con todas las demás entidades

5. **Fuerte integración con folders**: Las tareas están vinculadas a carpetas pero de forma más flexible que calculators

6. **Estado upcoming separado**: Único en tener un estado dedicado para items próximos

## 6. Comparación con otras entidades

| Aspecto              | Folders  | Calculators | Contacts | Tasks     |
| -------------------- | -------- | ----------- | -------- | --------- |
| Estados principales  | 1        | 2           | 3        | 2 + cache |
| Archivado            | Sí       | Sí          | Sí       | No        |
| Filtrado por tipo    | No       | Sí          | No       | No        |
| Filtrado por carpeta | N/A      | Sí          | Sí       | Sí        |
| Cache de detalles    | No       | No          | No       | Sí        |
| Estado "upcoming"    | No       | No          | No       | Sí        |
| Subtareas/jerarquía  | No       | No          | No       | Sí        |
| Comentarios          | No       | No          | No       | Sí        |
| Asignaciones         | No       | No          | No       | Sí        |
| Grupos               | No usado | No usado    | No usado | No usado  |

## 7. Flujo de datos típico

```
1. Carga inicial:
   TasksPage → getTasksByUserId() → Redux (tasks)

2. Vista de carpeta:
   FolderDetails → getTasksByFolderId() → Redux (tasks) → Filtro local

3. Widget dashboard:
   TaskWidget → getUpcomingTasks(7) → Redux (upcomingTasks)

4. Detalles bajo demanda:
   TaskRow → getTaskDetail(id) → Redux (taskDetails[id])

5. Operaciones CRUD:
   TaskModal → addTask/updateTask() → Redux → Refresh lista

6. Toggle estado:
   TaskRow → toggleTaskStatus() → Redux → Update inmediato
```

## 8. Recomendaciones

1. **Renombrar reducer**: Cambiar `tasksReducer` a `tasks` para consistencia
2. **Implementar archivado**: Añadir funcionalidad de archivo como otras entidades
3. **Optimizar upcomingTasks**: Considerar actualización automática periódica
4. **Unificar estado de carpeta**: Considerar un estado `folderTasks` similar a `selectedCalculators`

---

_Fecha de generación: ${new Date().toLocaleDateString('es-ES')}_
