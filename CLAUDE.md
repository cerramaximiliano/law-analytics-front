# CLAUDE.md - Law Analytics Front-end Guide

## Commands

- `npm run start` - Start development server
- `npm run build` - Build for production
- `npm run build-stage` - Build for staging using .env.qa
- `npm run test` - Run tests
- `npm run lint` - Run ESLint to check for issues
- `npm run format` - Format code with Prettier

## Code Style Guidelines

- **TypeScript**: Use strict typing and interfaces
- **Imports**: Order imports logically, avoid deep MUI imports (`@mui/*/*/*`)
- **Formatting**:
  - Use tabs for indentation
  - 140 characters print width
  - Double quotes, not single quotes
  - Trailing commas
- **Naming**: Use camelCase for variables/functions, PascalCase for components/classes
- **Error Handling**: Use try/catch for API calls and async operations
- **Components**: Follow React functional component patterns with hooks
- **State Management**: Use Redux for global state, React context for theme/auth
- **Styling**: Use MUI theming system and styled components
- **Icons**: Use iconsax

## Consejos para el proyecto

1. Sigue las convenciones de TypeScript para nombramiento y estructura
2. Usa variables prefijadas con `_` cuando tengas variables obligatorias que no se usan
3. Al trabajar con componentes React, asegúrate de utilizar todos los props o desestructurarlos con `...rest`

Use VS Code with auto-formatting on save for consistent code style.

---

## Flujo de credenciales judiciales (SCBA / PJN)

UX de la card de cred + sincronización + manejo de errores. SCBA y PJN comparten patrón, con algunas particularidades por jurisdicción.

### Componentes principales

| Archivo | Rol |
|---|---|
| `sections/apps/folders/step-components/ScbaAccountConnect.tsx` | Card SCBA + form + estado sync. Usado en `TabPjnIntegration` y como step de wizard. |
| `sections/apps/folders/step-components/PjnAccountConnect.tsx` | Gemelo para PJN. Mismo patrón. |
| `sections/apps/profiles/account/TabPjnIntegration.tsx` | Tab "Integraciones" del perfil (`/apps/profiles/account/pjn?view=scba`). Hostea las dos cards + pill de estado. |
| `utils/scbaBindingState.ts` | Fuente única de verdad SCBA (gemelo de `pjnBindingState`): estado de carpeta (`unlinked / list_removed / cred_error / ok`, labels y copy "Integraciones → SCBA", `SCBA_PROFILE_PATH`) y de credencial (`getScbaStatusReason`, `isScbaConnected`, `isScbaCredentialBroken`, `isScbaRetryDeferred`, `scbaStatusNotice`). No recalcular estos predicados en las vistas. |
| `pages/apps/folders/folders.tsx` | Listado de folders. Renderiza el badge "Vinculado a SCBA/PJN" por folder. |
| `pages/apps/folders/details/details.tsx` | Detalle de un folder. Renderiza la "binding pill" (Vinculado / Sincronización pausada). |
| `hooks/useScbaCredentialError.ts` | Hook con cache singleton. 1 fetch para N folders. Reactivo al slice `scbaSync`. |
| `components/GlobalSyncErrorListener.tsx` | Mounted en `App.tsx`. Dispara snackbar global de error desde cualquier ruta. |

### Estados de la cred (UI)

Tres estados visibles, basados en `credentialsStatus.syncStatus`:

| Estado | Pill (TabPjnIntegration) | Card | Folders en listado | Pill detalle |
|---|---|---|---|---|
| `completed` / `pending` (OK) | "Conectado" verde | "Cuenta conectada" verde | TickCircle azul | "Vinculado con SCBA" verde |
| `error` (cred rechazada) | "Requiere atención" amber | "Error de sincronización" rojo + form re-link | Warning2 amber + tooltip | "SCBA — Sincronización pausada" amber |
| sin cred | "No conectado" gris | Form de conexión | (sin badge) | "Vincular con Poder Judicial" |

El callback `onConnectionStatusChange` pasa el enum `"connected" | "error" | "disconnected"` (NO un boolean).

### Form re-link inline (cred en error)

Cuando `syncStatus === 'error'` la card muestra botón **"Actualizar contraseña"** que abre un form inline (CUIL + password + Cancelar/Guardar). NO obliga al user a desvincular + re-vincular (2 pasos confusos).

- El CUIL viene **pre-populado y bloqueado** desde `credentialsStatus.username` (SCBA) o `.cuil` (PJN). Si el user lo edita, el endpoint `saveCredentials` actualizaría con el valor nuevo y dejaría la cred con CUIL incorrecto.
- Si el backend NO devuelve el username/cuil (cred legacy o server sin el fix nuevo), el campo cae a editable como fallback.
- El submit reutiliza el `handleSubmit` existente: POST `/api/scba-credentials` actualiza la cred existente (`saveCredentials` controller), no crea duplicado.

### Snackbar global de error

`GlobalSyncErrorListener` (montado en `App.tsx` dentro de `<Notistack>`) escucha `scbaSync.hasError` y `pjnSync.hasError` desde cualquier ruta. Sin esto, el snackbar viviría solo en `Scba/PjnAccountConnect` (mounted-scoped) y el user en otra vista nunca se enteraría del error en vivo.

Importante: los handlers locales en `Scba/PjnAccountConnect` siguen haciendo `loadCredentialsStatus + stopPolling` cuando llega el WS de error (para que la card transita visualmente al estado de error), pero ya NO disparan `enqueueSnackbar` (lo hace el global). Si los locales también disparaban, salían 2 snackbars.

El listener llama a `invalidateScbaCredentialErrorCache()` para que el hook re-fetche y propague el cambio a todos los chips/pills de folders SCBA en uso.

### Indicador visual en folders con cred en error

Cuando la cred del user está en error, **todos** los folders SCBA del user muestran un indicador amber en lugar del check azul:
- **Listado** (`folders.tsx`): `Warning2` amber + tooltip `SCBA_BINDING_COPY.cred_error` ("…Actualizá tu contraseña desde Integraciones → SCBA…"), clickeable a `SCBA_PROFILE_PATH`.
- **Badge BA** (`FoldersSyncBadges`): estado `attention` ámbar "BA · Requiere atención — El portal rechazó tus credenciales".

El hub manda `statusReason` (`credential_invalid | sync_error | user_inactive | unlinked | rejection_pending | session_conflict | portal_unstable | syncing | ok | never_synced`) y `rejectionProgress {count, required}`; la card traduce con `scbaStatusNotice`. Con `syncStatus='pending'` + `rejection_pending | session_conflict | portal_unstable` (`isScbaRetryDeferred`) NO mostrar "Sincronizando" ni arrancar el polling: el worker difirió el reintento.
- **Detalle** (`details.tsx`): binding pill amber "SCBA — Sincronización pausada".

El hook `useScbaCredentialError` hace un **único fetch global** (cache singleton con TTL 30s + queue de Promise en-flight) para que N cards/pills no spammeen el backend. Reactivo al slice `scbaSync` — cuando llega un WS de error, el listener global invalida el cache → el hook revalida → todos los suscriptores re-renderizan con el indicador correcto.

### Bypass del modal de desvinculación

Si `folders.total === 0` (cred fallida desde el principio, nunca sincronizó nada), `handleUnlinkClick` desvincula **directo** sin mostrar el modal "Conservar / Eliminar carpetas" — no hay carpetas que preguntar qué hacer con ellas. El backend acompaña el mensaje contextual: "Cuenta desvinculada." (sin el sufijo "carpetas eliminadas/conservadas").

### Loading bar guard

El bloque "Sincronizando causas..." en la card chequea **primero** `credentialsStatus.syncStatus`. Si está en estado terminal (`completed` o `error`), NO renderiza la card de loading aunque `isSyncing` (local) o `pjnSync.isActive` (slice) quedaron stuck en true. El state de DB es la fuente de verdad — evita el caso de loading bar perpetuo cuando el WS de `phase=completed` no llega al componente.

### Polling de estado

`scbaCredentialsService.pollSyncStatus(intervalMs, onProgress, onComplete, onError)`:

- Detiene al ver `syncStatus === 'completed'` (llama `onComplete`).
- Detiene al ver `syncStatus === 'error'` (llama `onError` con `lastError.message` real).
- **Detiene silenciosamente** si `response.data` viene null (cred eliminada o desvinculada mid-flight). Sin esto, mostraría un snackbar genérico "Error obteniendo estado" que pisaba el mensaje real.

### Patrones a respetar al tocar este flujo

1. **Snackbar de error de sync**: solo desde `GlobalSyncErrorListener`. NO duplicar en componentes locales.
2. **Cred en error visible**: el endpoint server filtra por `enabled OR syncStatus='error'`. Si tocás filtros del endpoint, NO removas la rama de error — la UI necesita ver creds en error para mostrar el form de re-link.
3. **Pre-popular form re-link**: si agregás un campo nuevo al form, asegurate de que el backend lo devuelva en `getCredentialsStatus` (con decrypt si es encriptado) Y que el frontend lo pre-popule en el click del botón "Actualizar contraseña".
4. **PJN paridad**: la mayoría de los fixes SCBA tienen gemelo en PJN. Si arreglás algo en SCBA, chequeá si aplica también a PJN.
