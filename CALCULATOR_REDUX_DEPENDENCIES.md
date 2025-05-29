# Folder Reducers Analysis

## Overview

There are two separate folder-related reducers in the codebase that need to be merged:

1. `/src/store/reducers/folder.ts` - The main folder reducer with archive functionality
2. `/src/store/reducers/folders.ts` - A simpler folder reducer with batch operations

## 1. folder.ts Analysis

### Action Types

```typescript
SET_LOADING;
ADD_FOLDER;
GET_FOLDERS_BY_USER;
GET_FOLDERS_BY_GROUP;
GET_FOLDER_BY_ID;
DELETE_FOLDER;
UPDATE_FOLDER;
SET_FOLDER_ERROR;
ARCHIVE_FOLDERS;
UNARCHIVE_FOLDERS;
GET_ARCHIVED_FOLDERS;
```

### State Properties

```typescript
{
  folders: FolderData[];        // Active folders
  archivedFolders: FolderData[]; // Archived folders
  folder: FolderData | null;     // Single folder detail
  isLoader: boolean;
  error?: string;
}
```

### Actions

- `addFolder(folderData: FolderData)`
- `getFoldersByUserId(userId: string)`
- `getFoldersByGroupId(groupId: string)`
- `getFolderById(folderId: string)`
- `deleteFolderById(folderId: string)`
- `updateFolderById(folderId: string, updatedData: Partial<FolderData>)`
- `archiveFolders(userId: string, folderIds: string[])`
- `getArchivedFoldersByUserId(userId: string)`
- `unarchiveFolders(userId: string, folderIds: string[])`

### Key Features

- Archive/unarchive functionality
- Single folder detail view
- Error handling with specific messages
- Uses `FolderData` type from `types/folder`

## 2. folders.ts Analysis

### Action Types

```typescript
SET_LOADING;
ADD_FOLDER;
GET_FOLDERS_BY_USER;
GET_FOLDERS_BY_GROUP;
DELETE_FOLDER;
UPDATE_FOLDER;
SET_FOLDER_ERROR;
GET_FOLDERS_BY_IDS; // Unique to this reducer
```

### State Properties

```typescript
{
  folders: Folder[];          // Active folders
  selectedFolders: Folder[];  // Batch selected folders
  isLoader: boolean;
  error?: string;
}
```

### Actions

- `addFolder(folderData: Folder)`
- `updateFolder(folderId: string, updateData: Partial<Folder>)`
- `getFoldersByUserId(userId: string)`
- `getFoldersByGroupId(groupId: string)`
- `getFoldersByIds(folderIds: string[])` - Batch operation unique to this reducer
- `deleteFolder(folderId: string)`

### Key Features

- Batch folder fetching with `getFoldersByIds`
- Uses `selectedFolders` for batch operations
- Includes timeout handling for API requests
- Uses `Folder` type from `types/folders`
- No archive functionality

## 3. Type Differences

### folder.ts uses `types/folder`

- Type: `FolderData`
- More fields including `preFolder` and `judFolder` sub-objects
- Archive-related functionality

### folders.ts uses `types/folders`

- Type: `Folder`
- Different structure for `folderJuris` (object vs string)
- Includes `entryMethod`, `expedientNumber`, `expedientYear`
- No archive in type but has `selectedFolders` in state

## 4. Usage Patterns

### Files using folder.ts (from `store/reducers/folder`)

- `/src/pages/apps/folders/folders.tsx` - Main folders list view with archive functionality
- `/src/sections/apps/customer/LinkToCause.tsx` - Linking folders to contacts
- `/src/sections/apps/folders/AlertFolderDelete.tsx` - Delete confirmation

### Files using folders.ts (from `store/reducers/folders`)

- `/src/sections/apps/folders/AddFolder.tsx` - Add/edit folder form
- `/src/pages/calculator/labor/labor-tabs.tsx` - Calculator integration
- Various folder detail components

### Both reducers are registered in store

```typescript
// In /src/store/reducers/index.ts
import folder from "./folder";
import folders from "./folders";

const reducers = combineReducers({
	// ...
	folder, // Line 47
	folders, // Line 54
	// ...
});
```

## 5. Conflicts and Duplications

### Duplicate Action Types (same functionality)

- `ADD_FOLDER`
- `GET_FOLDERS_BY_USER`
- `GET_FOLDERS_BY_GROUP`
- `DELETE_FOLDER`
- `UPDATE_FOLDER`
- `SET_FOLDER_ERROR`
- `SET_LOADING`

### Unique to folder.ts

- `GET_FOLDER_BY_ID` - Single folder detail
- `ARCHIVE_FOLDERS` - Archive functionality
- `UNARCHIVE_FOLDERS` - Unarchive functionality
- `GET_ARCHIVED_FOLDERS` - Get archived folders

### Unique to folders.ts

- `GET_FOLDERS_BY_IDS` - Batch folder fetching

### Key Differences

1. **Archive functionality**: Only in folder.ts
2. **Batch operations**: Only in folders.ts (selectedFolders, getFoldersByIds)
3. **Single folder detail**: Only in folder.ts (folder property, getFolderById)
4. **Different type systems**: FolderData vs Folder
5. **API error handling**: More detailed in folder.ts

## 6. Merge Strategy Recommendations

### Recommended Approach

1. Keep `folder.ts` as the base since it has more functionality
2. Add the unique features from `folders.ts`:
   - `selectedFolders` state property
   - `GET_FOLDERS_BY_IDS` action type and handler
   - `getFoldersByIds` action creator

### Migration Steps

1. Add `selectedFolders: FolderData[]` to folder.ts state
2. Add `GET_FOLDERS_BY_IDS` case to reducer
3. Add `getFoldersByIds` action creator
4. Update all imports from `store/reducers/folders` to `store/reducers/folder`
5. Resolve type differences (Folder vs FolderData)
6. Remove folders.ts and its import from store/index.ts
7. Update all components to use consistent types

### Type Unification

Need to decide between:

- Using `FolderData` from `types/folder` (more complete)
- Using `Folder` from `types/folders` (has entry method fields)
- Creating a unified type that combines both

### Files to Update

All files currently importing from `store/reducers/folders` need to be updated to import from `store/reducers/folder` instead.
