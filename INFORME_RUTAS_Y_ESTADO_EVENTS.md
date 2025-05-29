# Informe: Rutas de Colecciones y Consumo del Estado Events

## 1. Rutas API que obtienen colecciones de Events

### Resumen completo de rutas:

#### **Operaciones CRUD básicas**

- `POST /api/events` - Crear nuevo evento
- `GET /api/events/${eventId}` - Obtener evento específico (no implementada directamente)
- `PUT /api/events/${eventId}` - Actualizar evento existente
- `DELETE /api/events/${eventId}` - Eliminar evento

#### **Obtención de colecciones**

- `/api/events/user/${userId}` - `getEventsByUserId`
- `/api/events/group/${groupId}` - `getEventsByGroupId`
- `/api/events/id/${_id}` - `getEventsById`

## 2. Uso de las funciones de obtención de Events

### **getEventsByUserId(userId)**

#### Ubicaciones de uso:

1. **src/pages/apps/calendar/calendar.tsx**
   - **Línea 389**: En `useEffect` para carga inicial
   - **Propósito**: Cargar todos los eventos del usuario para mostrar en el calendario
   - **Contexto**: Vista principal de calendario
   - **Estado actualizado**: `events`

### **getEventsById(\_id)**

#### Ubicaciones de uso:

1. **src/pages/apps/folders/details/components/ActivityTables.tsx**

   - **Línea 118**: `dispatch(getEventsById(id));`
   - **Propósito**: Cargar eventos de una carpeta específica
   - **Contexto**: Tab de actividades en vista de carpeta
   - **Estado actualizado**: `events`

2. **src/pages/apps/folders/details/components/Calendar.tsx**
   - Componente de calendario dentro de carpeta
   - **Propósito**: Mostrar eventos relacionados con la carpeta

**Nota**: La función `getEventsById` parece estar mal nombrada, ya que realmente obtiene eventos por folder ID, no por event ID.

### **getEventsByGroupId(groupId)**

- **Estado**: Implementada pero NO utilizada actualmente
- **Ubicación**: Solo existe en el reducer
- **Nota**: Consistente con todas las demás entidades

## 3. Componentes que consumen el estado events

### **Estructura del estado Events:**

```typescript
interface EventState {
	events: Event[]; // Lista principal de eventos
	isLoader: boolean; // Estado de carga
	error: string | undefined; // Manejo de errores
	selectedEventId: string | null; // ID del evento seleccionado
}
```

### **Categorías de consumo:**

#### **1. Calendario principal**

- **src/pages/apps/calendar/calendar.tsx**
  ```typescript
  const { events } = useSelector((state) => state.events);
  const selectedEvent = useSelector((state) => {
  	const { selectedEventId } = state.events;
  	const { events } = state.events;
  	if (selectedEventId) {
  		const found = events.find((event) => event._id === selectedEventId);
  		return found;
  	}
  	return null;
  });
  ```
  - Vista principal de calendario con eventos
  - Gestión completa de eventos (CRUD)
  - Vinculación con carpetas
  - Vista de detalles y edición

#### **2. Integración con carpetas (folders)**

- **src/pages/apps/folders/details/components/ActivityTables.tsx**

  ```typescript
  const eventsData = useSelector((state: any) => state.events);
  ```

  - Tab de calendario en vista de carpeta
  - Muestra eventos relacionados con la carpeta

- **src/pages/apps/folders/details/components/Calendar.tsx**
  - Componente de calendario embebido en carpeta
  - Vista específica de eventos de la carpeta

#### **3. Componentes de búsqueda y navegación**

- **src/hooks/useSearchEntityLoader.ts**

  ```typescript
  const { events } = useSelector((state) => state.events);
  ```

  - Hook para cargar datos de búsqueda incluyendo eventos

- **src/components/search/SearchModal.tsx**
  - Búsqueda global que incluye eventos

#### **4. Otros componentes**

- **src/pages/admin/users/UserView.tsx**

  - Posiblemente muestra estadísticas de eventos del usuario

- **src/layout/MainLayout/Header/HeaderContent/Notification.tsx**
  - Puede incluir notificaciones relacionadas con eventos próximos

### **Patrones de acceso al estado:**

```typescript
// Para lista completa de eventos
const { events } = useSelector((state) => state.events);

// Para evento seleccionado (con lógica adicional)
const selectedEvent = useSelector((state) => {
	const { selectedEventId, events } = state.events;
	return selectedEventId ? events.find((e) => e._id === selectedEventId) : null;
});

// Para estado de carga y error
const { isLoader, error } = useSelector((state) => state.events);
```

## 4. Características especiales de Events

### **Integración con FullCalendar**

- Los eventos se formatean específicamente para ser compatibles con FullCalendar
- Soporte para eventos de día completo (`allDay`)
- Arrastrar y soltar para cambiar fechas
- Redimensionar eventos para cambiar duración

### **Tipos de eventos**

Los eventos tienen tipos específicos:

- `audiencia` - Audiencias judiciales
- `vencimiento` - Fechas de vencimiento
- `reunion` - Reuniones
- `otro` - Otros eventos

### **Vinculación con carpetas**

- Los eventos pueden vincularse a una carpeta específica
- Incluyen `folderId` y `folderName`
- Modal dedicado para gestionar vinculaciones

### **Campos adicionales**

```typescript
interface Event {
	_id: string;
	title: string;
	description?: string;
	start: Date | string;
	end: Date | string;
	allDay: boolean;
	color?: string;
	type?: string;
	folderId?: string;
	folderName?: string;
	userId: string;
	groupId?: string;
}
```

## 5. Observaciones importantes

1. **Sin sistema de archivado**: A diferencia de folders, calculators y contacts, los eventos no tienen funcionalidad de archivo

2. **Naming confuso**: `getEventsById` realmente obtiene eventos por folder ID, no por event ID

3. **getEventsByGroupId no utilizada**: Consistente con todas las demás entidades

4. **Estado simplificado**: Comparado con otras entidades, events tiene un estado más simple sin listas filtradas o cache

5. **Fuerte dependencia de calendario**: Los eventos están diseñados específicamente para trabajar con FullCalendar

6. **Sin paginación**: No se implementa paginación para la lista de eventos

7. **Color personalizable**: Los eventos soportan colores personalizados basados en el tipo

## 6. Comparación con otras entidades

| Aspecto                  | Folders  | Calculators | Contacts    | Tasks       | Events           |
| ------------------------ | -------- | ----------- | ----------- | ----------- | ---------------- |
| Estados principales      | 1        | 2           | 3           | 2 + cache   | 1                |
| Archivado                | Sí       | Sí          | Sí          | No          | No               |
| Filtrado por tipo        | No       | Sí          | No          | No          | Sí (implícito)   |
| Filtrado por carpeta     | N/A      | Sí          | Sí          | Sí          | Sí               |
| Cache de detalles        | No       | No          | No          | Sí          | No               |
| Vinculación con carpetas | N/A      | Única       | Múltiple    | Única       | Única            |
| Subtareas/jerarquía      | No       | No          | No          | Sí          | No               |
| Comentarios              | No       | No          | No          | Sí          | No               |
| Grupos                   | No usado | No usado    | No usado    | No usado    | No usado         |
| Integración especial     | Central  | Con folders | Con folders | Con folders | Con FullCalendar |

## 7. Flujo de datos típico

```
1. Carga inicial:
   CalendarPage → getEventsByUserId(userId) → Redux (events)

2. Vista de carpeta:
   FolderDetails → getEventsById(folderId) → Redux (events)

3. Crear evento:
   AddEventForm → addEvent() → Redux → Actualización calendario

4. Editar evento (drag & drop):
   FullCalendar → updateEvent() → Redux → Sincronización visual

5. Vincular con carpeta:
   LinkFoldersModal → updateEvent(folderId) → Redux → Refresh

6. Eliminar evento:
   EventDetails → deleteEvent() → Redux → Remover del calendario
```

## 8. Integraciones con Calendar Reducer

Events trabaja en conjunto con un reducer de calendar separado que maneja:

- Estado del modal (`isModalOpen`)
- Rango seleccionado (`selectedRange`)
- Vista actual del calendario (`calendarView`)

Esta separación permite gestionar la UI del calendario independientemente de los datos de eventos.

## 9. Recomendaciones

1. **Renombrar getEventsById**: Cambiar a `getEventsByFolderId` para claridad
2. **Implementar archivado**: Añadir funcionalidad de archivo como otras entidades
3. **Añadir paginación**: Para usuarios con muchos eventos
4. **Cache de eventos**: Considerar cache para eventos frecuentemente accedidos
5. **Unificar con calendar reducer**: Considerar fusionar los dos reducers relacionados

---

_Fecha de generación: ${new Date().toLocaleDateString('es-ES')}_
