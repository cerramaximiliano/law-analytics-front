# Informe: Rutas de Colecciones y Consumo del Estado Folders

## 1. Rutas que obtienen colecciones por userId

### Resumen de rutas API por entidad:

#### **Folders**

- `/api/folders/user/${userId}` - `getFoldersByUserId`
- `/api/folders/group/${groupId}` - `getFoldersByGroupId`

#### **Calculators**

- `/api/calculators/user/${userId}` - `getCalculatorsByUserId`
- `/api/calculators/group/${groupId}` - `getCalculatorsByGroupId`
- `/api/calculators/user/${userId}?archived=true` - `getArchivedCalculatorsByUserId`
- `/api/calculators/folder/${folderId}` - `getCalculatorsByFolderId`
- `/api/calculators/filter?${queryParams}` - `getCalculatorsByFilter`

#### **Events**

- `/api/events/user/${userId}` - `getEventsByUserId`
- `/api/events/group/${groupId}` - `getEventsByGroupId`
- `/api/events/id/${_id}` - `getEventsById`

#### **Tasks**

- `/api/tasks/user/${userId}` - `getTasksByUserId`
- `/api/tasks/group/${groupId}` - `getTasksByGroupId`
- `/api/tasks/folder/${folderId}` - `getTasksByFolderId`
- `/api/tasks/upcoming/${userId}?days=${days}` - `getUpcomingTasks`

#### **Contacts**

- `/api/contacts/user/${userId}` - `getContactsByUserId`
- `/api/contacts/group/${groupId}` - `getContactsByGroupId`
- `/api/contacts/user/${userId}?archived=true` - `getArchivedContactsByUserId`
- `/api/contacts/group/${groupId}?archived=true` - `getArchivedContactsByGroupId`

## 2. Uso de getFoldersByUserId y getFoldersByGroupId

### **getFoldersByUserId**

#### Ubicaciones de uso:

1. **src/pages/apps/folders/folders.tsx**

   - Línea 465: Carga inicial de carpetas
   - Línea 487: Recarga cuando cambia el usuario
   - Línea 567: Actualización de datos
   - **Propósito**: Cargar y mantener actualizada la lista de carpetas del usuario

2. **src/pages/tasks/index.tsx**

   - Línea 398: `dispatch(getFoldersByUserId(userId))`
   - **Propósito**: Cargar carpetas disponibles para asociar con tareas

3. **src/pages/apps/calendar/calendar.tsx**

   - Línea 542: `const result = await dispatch(getFoldersByUserId(id))`
   - **Propósito**: Cargar carpetas para vincular eventos del calendario

4. **Componentes de vinculación**:
   - LinkToCause.tsx
   - labor-tabs.tsx
   - LinkCauseSelector.tsx (múltiples variantes)
   - linkCauseModal.tsx
   - **Propósito**: Permitir la vinculación de diferentes entidades con carpetas

### **getFoldersByGroupId**

- **Estado**: Definida pero NO utilizada actualmente en ningún componente
- **Ubicación**: Solo existe en los reducers (folders.ts y folder.ts)

## 3. Componentes que consumen el estado folders

### **Categorías de consumo:**

#### **1. Gestión principal de carpetas**

- `src/pages/apps/folders/folders.tsx`
- `src/pages/apps/folders/details/details.tsx`
- `src/pages/apps/folders/details/components/NavigationControls.tsx`
- `src/sections/apps/folders/AddFolder.tsx`

#### **2. Integración con tareas**

- `src/pages/tasks/index.tsx`
- `src/sections/apps/tasks/AddEditTask.tsx`

#### **3. Dashboard y estadísticas**

- `src/pages/dashboard/default.tsx`
- `src/sections/widget/chart/FoldersDataRate.tsx`
- `src/sections/widget/chart/ProjectOverview.tsx`
- `src/sections/widget/chart/ProjectRelease.tsx`

#### **4. Calculadoras**

- `src/pages/calculator/labor/labor-tabs.tsx`
- `src/pages/calculator/civil/components/SavedCivil.tsx`
- `src/sections/forms/wizard/calc-laboral/liquidacion/first.tsx`
- `src/sections/forms/wizard/calc-laboral/despido/first.tsx`
- `src/sections/forms/wizard/calc-intereses/components/LinkCauseSelector.tsx`

#### **5. Vinculación de entidades**

- `src/sections/apps/customer/LinkToCause.tsx`
- `src/sections/forms/wizard/calc-laboral/components/linkCauseModal.tsx`
- `src/sections/forms/wizard/calc-laboral/liquidacion/components/LinkCauseSelector.tsx`
- `src/sections/forms/wizard/calc-laboral/despido/components/LinkCauseSelector.tsx`

#### **6. Otros componentes**

- `src/pages/apps/calendar/calendar.tsx`
- `src/components/search/SearchModal.tsx`
- `src/hooks/useSearchEntityLoader.ts`
- `src/pages/admin/users/UserView.tsx`
- `src/layout/MainLayout/Header/HeaderContent/Notification.tsx`
- `src/sections/apps/profiles/user/ProfileTabs.tsx`
- `src/sections/apps/profiles/account/TabProfile.tsx`

### **Patrones de acceso al estado:**

Los componentes acceden al estado usando dos formas principales:

1. **Para el reducer individual**:

   ```typescript
   const { folders, archivedFolders, isLoader } = useSelector((state) => state.folder);
   ```

2. **Para el reducer de colección**:
   ```typescript
   const { folders } = useSelector((state) => state.folders);
   ```

## 4. Observaciones importantes

1. **Consistencia en nombres**: Existe cierta inconsistencia entre `state.folder` y `state.folders` que podría causar confusión.

2. **getFoldersByGroupId no utilizada**: Esta función está implementada pero no se usa en ningún componente, lo que sugiere que la funcionalidad de grupos podría no estar completamente implementada.

3. **Amplio uso del estado folders**: El estado de folders es consumido por una gran variedad de componentes, indicando que es una parte central de la aplicación.

4. **Integración con múltiples módulos**: Las carpetas están integradas con tareas, eventos, calculadoras y contactos, mostrando su importancia como entidad organizadora principal.

---

_Fecha de generación: ${new Date().toLocaleDateString('es-ES')}_
