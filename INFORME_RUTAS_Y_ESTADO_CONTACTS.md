# Informe: Rutas de Colecciones y Consumo del Estado Contacts

## 1. Rutas API que obtienen colecciones de Contacts

### Resumen completo de rutas:

#### **Operaciones CRUD básicas**

- `POST /api/contacts/create` - Crear nuevo contacto
- `PUT /api/contacts/${contactId}` - Actualizar contacto existente
- `PUT /api/contacts/batch-update` - Actualizar múltiples contactos
- `DELETE /api/contacts/${contactId}` - Eliminar contacto

#### **Obtención de colecciones**

- `/api/contacts/user/${userId}` - `getContactsByUserId`
- `/api/contacts/user/${userId}?archived=true` - `getArchivedContactsByUserId`
- `/api/contacts/group/${groupId}` - `getContactsByGroupId`
- `/api/contacts/group/${groupId}?archived=true` - `getArchivedContactsByGroupId`

#### **Operaciones de vinculación con carpetas**

- `POST /api/contacts/${contactId}/link-folders` - Vincular contacto con carpetas
- `DELETE /api/contacts/${contactId}/folders/${folderId}` - Desvincular de carpeta

#### **Operaciones de archivo**

- `POST /api/subscriptions/archive-items?userId=${userId}` - Archivar múltiples contactos
- `POST /api/subscriptions/unarchive-items?userId=${userId}` - Desarchivar múltiples contactos

## 2. Uso de las funciones de obtención de Contacts

### **getContactsByUserId(userId)**

#### Ubicaciones de uso:

1. **src/pages/apps/customer/list.tsx**
   - **Línea ~619**: En `useEffect` para carga inicial
   - **En `handleRefreshData()`**: Después de operaciones CRUD
   - **Propósito**: Carga todos los contactos activos del usuario
   - **Estado actualizado**: `contacts`

### **getArchivedContactsByUserId(userId)**

#### Ubicaciones de uso:

1. **src/pages/apps/customer/list.tsx**
   - **Línea ~688**: En `handleOpenArchivedModal()`
   - **Propósito**: Cargar contactos archivados para mostrar en modal
   - **Estado actualizado**: `archivedContacts`

### **filterContactsByFolder(folderId)**

#### Ubicaciones de uso:

1. **src/pages/apps/folders/details/components/MembersImproved.tsx**
   - **Línea 144**: Después de agregar un nuevo miembro
   - **Línea 176**: Después de eliminar un contacto
2. **src/pages/apps/folders/details/alternatives/GestionTabImproved.tsx**
   - Para mostrar contactos de una carpeta específica
3. **src/pages/apps/folders/details/details.tsx**
   - Vista principal de detalles de carpeta
4. **src/pages/apps/folders/details/modals/ModalMembers.tsx**
   - Modal de miembros de la carpeta

**Propósito**: Filtrar contactos que pertenecen a una carpeta específica
**Estado actualizado**: `selectedContacts`

### **getContactsByGroupId(groupId)**

- **Estado**: Implementada pero NO utilizada actualmente
- **Ubicación**: Solo existe en el reducer
- **Nota**: Consistente con folders y calculators, funcionalidad de grupos no implementada

### **getArchivedContactsByGroupId(groupId)**

- **Estado**: Implementada pero NO utilizada directamente
- **Nota**: Llama internamente a `getContactsByGroupId` con parámetro archived

## 3. Componentes que consumen el estado contacts

### **Estructura del estado Contacts:**

```typescript
interface ContactState {
	contacts: Contact[]; // Lista completa de contactos activos
	archivedContacts: Contact[]; // Contactos archivados
	selectedContacts: Contact[]; // Contactos filtrados por carpeta
	isLoader: boolean; // Indicador de carga
	error: string | null; // Manejo de errores
}
```

### **Categorías de consumo:**

#### **1. Gestión principal de contactos**

- **src/pages/apps/customer/list.tsx**
  ```typescript
  const { contacts, archivedContacts, isLoader } = useSelector((state) => state.contacts);
  ```
  - Funcionalidad: Lista principal, búsqueda, filtrado, archivado
  - Componente central para gestión de contactos

#### **2. Integración con carpetas (folders)**

- **src/pages/apps/folders/details/components/MembersImproved.tsx**
  ```typescript
  const selectedContacts = useSelector((state: any) => state.contacts.selectedContacts || []);
  ```
  - Muestra contactos vinculados a una carpeta específica
- **src/pages/apps/folders/details/alternatives/GestionTabImproved.tsx**
  - Tab de gestión que incluye contactos de la carpeta
- **src/pages/apps/folders/details/details.tsx**
  - Vista principal que integra contactos en carpetas
- **src/pages/apps/folders/details/modals/ModalMembers.tsx**
  - Modal para gestionar miembros (contactos) de la carpeta

#### **3. Componentes de creación/edición**

- **src/sections/apps/customer/AddCustomer.tsx**
  - No consume estado directamente
  - Despacha acciones: `addContact()`, `updateContact()`
- **src/sections/apps/customer/LinkToCause.tsx**
  - Modal para vincular contactos con carpetas
  - Despacha: `linkFoldersToContact()`

#### **4. Componentes de visualización**

- **src/sections/apps/customer/CustomerView.tsx**
  - Vista detallada de un contacto
  - Recibe datos como props, no consume Redux directamente

#### **5. Posibles consumidores adicionales**

- **src/components/calculator/CalculationDetailsView.tsx**
  - Podría mostrar contactos relacionados con cálculos
- **src/pages/admin/users/UserView.tsx**
  - Estadísticas de contactos del usuario

### **Patrones de acceso al estado:**

```typescript
// Para lista completa y archivados
const { contacts, archivedContacts, isLoader } = useSelector((state) => state.contacts);

// Para contactos filtrados por carpeta
const selectedContacts = useSelector((state) => state.contacts.selectedContacts || []);
```

## 4. Sistema paralelo: Marketing Contacts

Existe un sistema completamente separado para contactos de marketing:

### **Características:**

- **Reducer separado**: `src/store/reducers/marketing-contacts.ts`
- **Service dedicado**: `MarketingContactService`
- **NO usa Redux**: Gestión con estado local de React
- **API diferente**: Endpoints específicos para marketing

### **Componentes de marketing:**

- `src/sections/admin/marketing/ContactsPanel.tsx`
- `src/sections/admin/marketing/CampaignContactsModal.tsx`
- `src/sections/admin/marketing/CampaignContactsList.tsx`
- `src/sections/admin/marketing/ContactDetailModal.tsx`

## 5. Observaciones importantes

1. **Triple estado para contactos**: Similar a calculators, mantiene tres listas:

   - `contacts`: Lista completa de contactos activos
   - `archivedContacts`: Contactos archivados
   - `selectedContacts`: Contactos filtrados por carpeta

2. **Fuerte integración con folders**: Los contactos están profundamente integrados con el sistema de carpetas, especialmente en las vistas de detalles.

3. **Sistema dual de contactos**: Existe una separación clara entre:

   - Contactos de negocio (sistema principal)
   - Contactos de marketing (sistema independiente)

4. **getContactsByGroupId no utilizada**: Consistente con otras entidades, la funcionalidad de grupos permanece sin implementar.

5. **Vinculación múltiple con carpetas**: A diferencia de otros recursos, los contactos pueden vincularse a múltiples carpetas.

6. **Operaciones batch**: Soporta actualización y archivado de múltiples contactos simultáneamente.

## 6. Comparación con otras entidades

| Aspecto                  | Folders  | Calculators | Contacts       |
| ------------------------ | -------- | ----------- | -------------- |
| Estados principales      | 1        | 2           | 3              |
| Archivado                | Sí       | Sí          | Sí             |
| Filtrado por tipo        | No       | Sí          | No             |
| Filtrado por carpeta     | N/A      | Sí          | Sí             |
| Vinculación con carpetas | N/A      | Única       | Múltiple       |
| Sistema paralelo         | No       | No          | Sí (Marketing) |
| Operaciones batch        | No       | Sí          | Sí             |
| Grupos                   | No usado | No usado    | No usado       |

## 7. Flujo de datos típico

```
1. Carga inicial:
   CustomerList → getContactsByUserId() → Redux (contacts)

2. Filtrado por carpeta:
   FolderDetails → filterContactsByFolder() → Redux (selectedContacts)

3. Operaciones CRUD:
   AddCustomer → addContact/updateContact() → Redux → Refresh

4. Archivado:
   CustomerList → archiveContacts() → Redux → Modal archivados

5. Vinculación:
   LinkToCause → linkFoldersToContact() → Redux → Refresh
```

---

_Fecha de generación: ${new Date().toLocaleDateString('es-ES')}_
