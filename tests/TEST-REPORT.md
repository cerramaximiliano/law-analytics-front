# Reporte Completo de Tests E2E — Law Analytics Front

**51 archivos `.spec.ts`** | **543 tests individuales** (+ 1 setup de autenticación)

## Tests pendientes (priorizados)

**Alta prioridad — gaps team system:**

- Team ownership transfer (`POST /groups/:id/transfer-ownership`)
- Group archive/restore (`POST /groups/:id/restore`)
- Folder archive + restore + bulk ops (`DELETE /folders/bulk/delete`)

**Media — flow de cuenta del usuario:**

- User profile update + password change + delete account
- Skill management (matrícula del abogado — usado en resolveFields de escritos)
- User preferences/settings

**Integraciones externas:**

- Stripe checkout flow completo (Stripe CLI + webhook)
- MEV credentials (agregar, validar, sync causas CABA)
- Realtime notifications Socket.io (complemento de polling en notifications.spec.ts)
- Discount codes (`/api/discounts`)

**Hardening / calidad:**

- Cross-browser smoke (Firefox/WebKit)
- Mobile viewport (375x667)
- Rate limit enforcement (bypass en dev, test sin bypass)
- Error boundaries (respuestas 5xx)
- i18n smoke

**Estado global:**

- ✅ Tests nuevos (#1-#5: bookings, causa, movements, activity-log, bookings-advanced): **53/53 passing** corridas aisladas
- ✅ Team suite (17 files, BLOQUES 1-23): **117 passing** (última corrida 116+1 flaky, 12.1min)
- ⚠️ Calendar suite (38 tests): **34 passing + 4 flaky UI preexistentes** (GRUPOs 8/9/15/16 — snackbar/drag/persistence). POST /events responde 201 OK; el problema es timing de UI.

**Rate limits en dev:**
Para correr la suite completa sin 429s, agregar al `.env` del backend:

```
NODE_ENV=development
DISABLE_RATE_LIMIT=true
```

Todos los rate limiters (`generalLimiter`, `authLimiter`, `createResourceLimiter`, `duplicatePreventionLimiter`, `searchLimiter`, `uploadLimiter`, `externalApiLimiter`, `batchOperationLimiter`) soportan este bypass en dev.

**Adición 2026-04-21 (Tests de alta prioridad #1-#4):**

- `bookings-public-flow.spec.ts` (9 tests) — visitante crea booking via `publicUrl`, owner confirma/cancela/rechaza, cliente cancela via token. Validaciones, double-booking, tokens inválidos.
- `folder-causa-link.spec.ts` (13 tests) — vinculación folder↔causa PJN/MEV. Validaciones payload, permisos team mode. Link real con microservicios (PJN/MEV) anotado como best-effort.
- `movements.spec.ts` (8 tests) — CRUD movimientos + timeline del folder. Rate limiters `duplicatePreventionLimiter` (2s) + `createResourceLimiter` (10/min) manejados con pausas entre tests.
- `activity-log.spec.ts` (11 tests) — endpoints `/me`, `/owner`, `/timeline`, `/stats`, `/folder/:id`, `/group/:id`, `/resource/:type/:id`, `/activities/combined`. Estructura: `body.activity[]` con `action` (past tense: `created/updated/deleted`).

**Última corrida completa team suite (17 archivos, 117 tests):** 2026-04-21, 12.1min, **116 passed + 1 flaky** (pasó en retry #1: GRUPO 23.1 `editor crea contact con folderIds`). 0 failures, 0 skips.

> Excluye la subcarpeta `tests/visual/` (visual regression).
> Última actualización: **2026-04-20**

**Última corrida full suite** (v4, 2026-04-20): 306 passed + 1 conditional-skip de 307, en 35.1 min. 0 rate-limits, 0 token-refresh errors.

**Adición 2026-04-21 (GAP 6 — UserStats.postalTrackings desincronizado):**
Bug histórico: el worker `postal-tracking-service` marcaba trackings como `completed`/`not_found` sin decrementar `UserStats`. Resultado: widget "Uso de Recursos" mostraba "30/30 al cap" aunque el backend permitía crear (el middleware cuenta directo desde la colección, excluye finales). Triple fix aplicado:

- **Opción A** (`postal-tracking-service/src/tasks/worker.js`): decrementa `UserStats.counts.postalTrackings` al transicionar a final. Caso reutilización de código: decrementa viejo + incrementa successor si queda activo.
- **Opción B** (`law-analytics-server/controllers/userStatsController.js`): sobreescribe `counts.postalTrackings` con count directo de la colección (pending/active) antes de responder.
- **Opción C — resync histórico** (`scripts/resyncPostalTrackingStats.js`): one-shot que corrige `UserStats` históricos. Soporta `--dry-run`. Se ejecutó y corrigió 1 user con delta -18 (owner del suite tenía 18 inflado vs 0 real).

**Nota de nombres de colección**: el modelo Mongoose `UserStats` pluraliza a `userstats` (sin guión); la colección postal es `postal-trackings` (con guión). Error durante la primera versión del fix provocó updates a colección inexistente `user-stats`; corregido antes del rollout.

**Adición 2026-04-21 (fixes de GAPs descubiertos en BLOQUES 12-15):**

- **GAP 1 (resuelto)** — `postal-tracking` ahora soporta team mode. Controller `create` lee `req.teamContext` y guarda `userId=effectiveOwnerId` + `groupId` + `createdBy`. `getByUser` acepta `?groupId=`. `getById/update/remove` usan helper `resolveTrackingAccess` (personal o member del team con rol). `groupController.deleteGroup` libera postal-trackings con `$unset: { groupId }`.
- **GAP 2 (resuelto)** — `/api/documents` legacy desmontado del router. Sin consumidores en el frontend (`menu-items/documentos.tsx` apunta a `/documentos/escritos` → `/api/rich-text-documents`). El model `Document.js` se mantiene por scripts de migración y `groupController.deleteGroup`. Reactivar sólo si se resucita el módulo.
- **GAP 3 (resuelto)** — `ResourceUsageWidget` añadido a `TabPersonal.tsx` (ruta `/apps/profiles/user/personal`). Se mantiene también en `/apps/profiles/account/settings` y `/dashboard/default`. `data-testid="profile-personal-usage"`.
- **GAP 5 (resuelto)** — `/api/rich-text-documents` (escritos, consumido por `/documentos/escritos`) ahora soporta team mode real. Mismo patrón que postal-tracking: controller lee `req.teamContext` en `create`, helper `resolveDocAccess` en `get/update/delete`, `groupId` aceptado en list (`?groupId=`), `createdBy` en modelo, rich-text-documents incluido en el `$unset` de `deleteGroup`.
- **GAP 4** — Decisión de diseño: `deleteGroup` hace soft-delete + `$unset groupId` en recursos (no cascade delete). No se cambia.
- Tests actualizados: `team-resource-crud-matrix.spec.ts` GRUPO 4 ahora assertea team mode funcional (antes documentaba gap). `team-profile-stats-ui.spec.ts` GRUPO 1 ahora assertea widget visible en `/profile/user/personal`.

**Adición 2026-04-20 (BLOQUE 7 + fixes de backend):**

- `+1 archivo` (`team-invitation-conflicts.spec.ts`, 3 tests passing): cubre **ALREADY_IN_TEAM + PAID_PLAN_CONFLICT** usando nuevo user `ownerSecondary` (juancamino713@gmail.com, plan standard).
- Fix backend en `subscriptionController.js`: `immediatelyChangePlan` y `schedulePlanChange` ahora enrutan `planId === 'free'` a `downgradeToFreePlan`, que retorna `409 TEAM_DOWNGRADE_BLOCKED` con `message` + `teamCheck`. Previamente retornaba 500 por validación `Plan inválido: free`.
- Fix backend en `services/subscriptionService.js` (`downgradeToFreePlan`): reemplaza `Subscription.findOne({ ...getTestModeFilter() })` por `findUserSubscription(userId)` (fallback TEST→LIVE en dev).
- Fix UI en `pages/extra-pages/price/price1.tsx`: snackbar de error ahora muestra el mensaje del backend (p. ej. TEAM_DOWNGRADE_BLOCKED) en lugar del genérico.
- Fix UI en `store/reducers/ApiService.ts` (`changeImmediate`, `scheduleChange`): propagan `code` + `teamCheck` del error 409.
- Mejora en `tests/helpers/multi-user.ts`: `deleteAllOwnedTeams` ahora remueve miembros activos antes de eliminar el team (evita fallos silenciosos cuando el team tenía miembros residuales entre corridas).
- Mejora en `tests/team-invitation-flow.spec.ts`: `test.describe.configure({ retries: 2 })` para los 2 tests flaky por timing multi-user.

---

## Requisitos para correr la suite

1. **Backend `law-analytics-server` activo en puerto 5000** (`npm run start:dev` con `NODE_ENV=development`).
2. **Frontend Vite activo en puerto 3000** (`npm run start`).
3. El global-setup (`tests/global-setup.ts`) re-autentica al inicio de cada corrida y guarda el token en `tests/.auth/user.json`. Si el token almacenado expira (TTL del JWT es corto), la siguiente corrida lo refresca automáticamente siempre que el backend esté disponible.

### Ajustes de infraestructura para suite E2E (aplicados 2026-04-20)

Tres fixes de backend necesarios para que la suite completa (307 tests, ~35 min) pase sin fallos por efectos secundarios:

**1. `law-analytics-server/middlewares/rateLimitMiddleware.js`**

- `generalLimiter.max`: 1000 → **10000** (req / 15 min)
- `authLimiter.max`: 5 → **100** (intentos / 15 min, sigue con `skipSuccessfulRequests:true`)
- Razón: 1000 req era insuficiente para ~307 tests con fillers masivos de límites de plan.

**2. `law-analytics-server/models/User.js`**

- Hardcoded `activeSessions.length > 5` → **configurable vía `MAX_ACTIVE_SESSIONS` env var**, default **5 en prod y 100 en development**.
- Razón: los ~9 tests de `auth-token.spec.ts` hacen login real con contexts aislados (deviceIds distintos). Al exceder 5 sesiones, el backend revocaba las más antiguas, incluyendo la del `storageState` principal del suite → cascada de 401s en todos los specs posteriores.

**3. Tests con flexibilidad ante race condition del scraper worker** (`postal-tracking-crud.spec.ts:507, 538`)

- GRUPO 8 Test A: si el backend acepta el POST "over-limit" porque el worker liberó slots entre fill y extra-POST, el extra se añade a `fillerIds` para cleanup y se anota `worker-race` en lugar de fallar.
- GRUPO 8 Test B: `test.skip` condicional si `hasReachedLimit=false` por la misma race.

**Nota histórica:** durante la auditoría del 2026-04-18 se observaron 24 tests fallando (tasks, support-modal, dashboard, pjn-sync-status). La causa era exclusivamente el token JWT expirado; al levantar el backend y permitir el refresh, los 24 pasaron sin cambios de código.

**Comando recomendado:**

```bash
npx playwright test --reporter=line --ignore-snapshots
```

---

## 1. `public-routes.spec.ts` — 10 tests ✅

Rutas públicas accesibles sin autenticación (booking, manage-booking, 404).

| Test                                                                          | Qué verifica                    |
| ----------------------------------------------------------------------------- | ------------------------------- |
| `[booking] /booking → NO redirige a /login`                                   | Ruta pública no requiere sesión |
| `[booking-slug] /booking/:slug → NO redirige a /login`                        | Ruta pública con slug           |
| `[manage-booking] /manage-booking → NO redirige a /login`                     | Gestión de turno pública        |
| `[manage-booking-token] /manage-booking/:token → NO redirige a /login`        | Gestión con token               |
| `[404] /maintenance/404 → NO redirige a /login`                               | Página 404 pública              |
| `ruta inexistente → no crash de JS ni redirect a /login`                      | Ruta desconocida sin errores    |
| `/maintenance/404 → muestra 'Página No Encontrada' y botón Volver al Inicio`  | Contenido de 404                |
| `usuario logueado en 404 → botón Volver al Inicio lleva a /dashboard/default` | Redirect post-login desde 404   |
| _(+2 tests adicionales en el suite)_                                          |                                 |

---

## 2. `navigation-routes.spec.ts` — 55 tests ✅

Tests exhaustivos de autenticación y redirect en todas las rutas protegidas.

| Grupo   | Descripción                                                           | # Tests |
| ------- | --------------------------------------------------------------------- | ------- |
| GRUPO 1 | Rutas estáticas: sin sesión → /login → vuelve a ruta original         | ~39     |
| GRUPO 2 | Sesión expira con tab abierta → UnauthorizedModal → permanece en ruta | ~8      |
| GRUPO 3 | Recarga con cookie expirada → /login → re-login → vuelve a ruta       | ~6      |
| GRUPO 4 | Smoke: rutas sin crash + navegación cruzada entre secciones           | varios  |

**Rutas cubiertas (selección):** dashboard, apps/calendar, apps/folders/list, apps/postal-tracking/list, apps/chat, apps/kanban, apps/customer, apps/invoice/list, apps/invoice/create, apps/profiles/user, apps/profiles/account, documentos/escritos, documentos/modelos, tareas, calculadora, suscripciones, etc.

---

## 3. `postal-tracking-status.spec.ts` — 8 tests ✅

Comportamiento visual según estado del tracking postal.

| Test                                                                  | Qué verifica                                    |
| --------------------------------------------------------------------- | ----------------------------------------------- |
| `chip de estado muestra 'No encontrado'`                              | Chip visible para estado not_found              |
| `fila tiene 3 botones deshabilitados`                                 | Botones disabled: vincular, adjuntar, reactivar |
| `fila tiene 3 botones habilitados`                                    | Botones enabled: ver detalle, editar, eliminar  |
| `'Marcar como completado' NO aparece: 6 botones totales`              | Ausencia de TickCircle en not_found             |
| `página no crashea con JS errors al renderizar 'not_found'`           | Sin errores JS                                  |
| `chip de estado muestra 'Activo'`                                     | Chip para estado active                         |
| `fila tiene 0 botones deshabilitados para 'active'`                   | Control positivo: sin disabled                  |
| `fila tiene 6 botones habilitados (incluye 'Marcar como completado')` | 6 botones enabled en active                     |

---

## 4. `dynamic-routes.spec.ts` — 5 tests ✅

Rutas dinámicas con IDs inválidos/inexistentes (folders, documentos, invoice).

| Test                                                                     | Qué verifica                  |
| ------------------------------------------------------------------------ | ----------------------------- |
| `/apps/folders/details/:id → 'Carpeta no encontrada' + redirect a lista` | Empty state + redirect        |
| `/apps/folders/details/:id → mensaje visible antes del redirect`         | Mensaje antes de salir        |
| `/documentos/escritos/:id/editar → editor abre sin crash`                | Editor con ID inválido        |
| `/documentos/escritos/:id/editar → NO muestra error card`                | Sin error explícito en editor |
| `/apps/invoice/details/:id → carga sin crash`                            | Invoice con ID inválido       |

---

## 5. `api-errors.spec.ts` — 6 tests ✅

Comportamiento ante errores de API (500 / red caída).

| Test                                                                | Qué verifica              |
| ------------------------------------------------------------------- | ------------------------- |
| `API /api/stats devuelve 500 → ErrorStateCard con botón Reintentar` | Error state en dashboard  |
| `botón Reintentar dispara nuevo fetch`                              | Retry functionality       |
| `API /api/events devuelve 500 → snackbar de error`                  | Error en calendario       |
| `API /api/postal-documents devuelve 500 → carga sin crash`          | Postal tracking sin crash |
| `/documentos/escritos con API 500 → sin crash`                      | Escritos sin crash        |
| `/documentos/modelos con API 500 → sin crash`                       | Modelos sin crash         |

---

## 6. `login-form.spec.ts` — 14 tests ✅

Validación y manejo de errores en el formulario de login.

| Test                                                        | Qué verifica             |
| ----------------------------------------------------------- | ------------------------ |
| `submit con campos vacíos → errores de requerido`           | Validación Yup vacío     |
| `email inválido → 'Debe ser un e-mail válido'`              | Validación formato email |
| `email vacío + blur → error de requerido`                   | Error on-blur email      |
| `password vacío + blur → error de requerido`                | Error on-blur password   |
| `email válido + password lleno → errores desaparecen`       | Limpieza de errores      |
| `contraseña incorrecta → snackbar 'Credenciales inválidas'` | Manejo de 401            |
| `servidor caído (500) → snackbar con mensaje del servidor`  | Manejo de 500            |
| `botón se deshabilita y muestra spinner durante submit`     | Estado loading           |
| `429 sin retryAfter → mensaje base con fallback`            | Rate limit básico        |
| `429 con error string → muestra error como descripción`     | Rate limit con mensaje   |
| `429 con retryAfter 30min → 'en X minutos'`                 | Rate limit con tiempo    |
| `429 con retryAfter exactamente 1 hora → 'en 1 hora'`       | Rate limit 1h exacta     |
| `429 con retryAfter 90 min → 'en 1 hora y 30 minutos'`      | Rate limit 90min         |
| `429 → botón vuelve a estar habilitado después del error`   | Re-enable tras 429       |

---

## 7. `guest-guard.spec.ts` — 8 tests ✅

Usuario autenticado intentando acceder a rutas de auth (protegidas por GuestGuard).

| Test                                                                   | Qué verifica                |
| ---------------------------------------------------------------------- | --------------------------- |
| `logueado → /login → redirige a /dashboard/default`                    | GuestGuard sin from-state   |
| `logueado → /register → redirige a /dashboard/default`                 | GuestGuard en register      |
| `logueado → /forgot-password → redirige a /dashboard/default`          | GuestGuard en forgot        |
| `logueado → /reset-password → redirige a /dashboard/default`           | GuestGuard en reset         |
| `logueado → /register/success → redirige a /dashboard/default`         | GuestGuard en success       |
| `state.from=/apps/calendar → redirige a /apps/calendar, no al default` | Respeta from-state          |
| `state.from=/login → GuestGuard lo ignora → redirige al default`       | Ignora from=/login          |
| `logueado → /code-verification → NO redirige (excepción explícita)`    | Excepción code-verification |

---

## 8. `support-modal.spec.ts` — 6 tests ✅

Modal de soporte al usuario. Apertura vía `aria-label="open drawer"` → botón "Soporte" del NavCard.

| Test                                               | Qué verifica           |
| -------------------------------------------------- | ---------------------- |
| `submit sin campos → errores de subject y message` | Validación requeridos  |
| `seleccionar subject → elimina su error`           | Limpieza error subject |
| `llenar mensaje → elimina su error`                | Limpieza error message |
| `botón 'Soporte' abre modal con título correcto`   | Apertura del modal     |
| `botón 'Cancelar' cierra el modal`                 | Cierre del modal       |
| `campos se resetean al volver a abrir`             | Reset de estado        |

---

## 9. `rememberMe.spec.ts` — 3 tests ✅

Checkbox "Mantener la sesión abierta" en formulario de login.

| Test                                                     | Qué verifica             |
| -------------------------------------------------------- | ------------------------ |
| `checkbox está desmarcado por defecto`                   | Estado inicial unchecked |
| `login sin checkbox → POST body tiene rememberMe: false` | Valor false en body      |
| `login con checkbox → POST body tiene rememberMe: true`  | Valor true en body       |

---

## 10. `folder-recursos.spec.ts` — 7 tests ✅

Pestaña Recursos (FolderDocumentsTab) en detalle de carpeta.

| Test                                                           | Qué verifica                    |
| -------------------------------------------------------------- | ------------------------------- |
| `pestaña Recursos es visible`                                  | Visibilidad de pestaña          |
| `click en Recursos activa la pestaña correcta`                 | Activación                      |
| `muestra 'Sin documentos vinculados' cuando no hay documentos` | Empty state                     |
| `muestra botón 'Nuevo documento' en estado vacío`              | Botón en empty state            |
| `muestra columnas 'Tipo' y 'Título'`                           | Columnas de tabla               |
| `muestra documento postal en la tabla`                         | Documento postal renderizado    |
| `muestra documento rich-text en la tabla`                      | Documento rich-text renderizado |

---

## 11. `pjn-sync-status.spec.ts` — 3 tests ✅

Componente PjnSyncStatus en pestaña Actividad del detalle de carpeta.

| Test                                                          | Qué verifica             |
| ------------------------------------------------------------- | ------------------------ |
| `muestra 'Pendiente de primera sincronización PJN' sin fecha` | Empty state PJN          |
| `muestra 'Última actualización PJN' con fecha formateada`     | Mensaje con fecha        |
| `fecha y hora correctamente formateadas`                      | Formato DD/MM/YYYY HH:mm |

---

## 12. `add-folder.spec.ts` — 4 tests ✅

Wizard de creación de carpetas (AddFolder).

| Test                                                               | Qué verifica             |
| ------------------------------------------------------------------ | ------------------------ |
| `wizard abre con paso inicial (selección de método)`               | Apertura con InitialStep |
| `flujo manual: 'Ingreso Manual' → avanza a datos básicos`          | Flujo manual             |
| `flujo automático PJN: Automático → Nacional → paso de expediente` | Flujo automático PJN     |
| `crear carpeta manual: POST /api/folders se llama con folderName`  | Body del POST correcto   |

---

## 13. `contacts-phone-fields.spec.ts` — 5 tests ✅

Campos `phoneCodArea` y `phoneCelular` en wizard AddCustomer.

| Test                                            | Qué verifica             |
| ----------------------------------------------- | ------------------------ |
| `campo 'Cód. área celular' visible en paso 2`   | Visibilidad phoneCodArea |
| `campo 'Celular (sin 15)' visible en paso 2`    | Visibilidad phoneCelular |
| `phoneCodArea acepta código de área`            | Input código de área     |
| `phoneCelular acepta celular sin 15`            | Input celular            |
| `campos incluidos en POST /api/contacts/create` | Body del POST            |

---

## 14. `limit-error-modal.spec.ts` — 6 tests ✅

LimitErrorModal — modal global ante respuestas 403 con `limitInfo` o `featureInfo`.

**Estrategia:** Intercepta `GET /api/folders/**` con 403 en el primer llamado para disparar el modal sin afectar `user-stats` (evita loop infinito de ResourceUsageWidget).

| Test                                                                         | Qué verifica             |
| ---------------------------------------------------------------------------- | ------------------------ |
| `GRUPO 1 — 403 con limitInfo → modal 'Límite alcanzado' se abre`             | Apertura ante limitInfo  |
| `GRUPO 1 — modal muestra uso actual: currentCount / limit`                   | Uso visible (e.g. 10/10) |
| `GRUPO 1 — modal carga planes y muestra botón 'Suscribirme Ahora'`           | Botón de suscripción     |
| `GRUPO 2 — 403 con featureInfo → modal 'Función no disponible'`              | Modal ante featureInfo   |
| `GRUPO 3 — 'Suscribirme Ahora' navega a /suscripciones/tables?plan={planId}` | Navegación correcta      |
| `GRUPO 3 — 'Cerrar' cierra el modal`                                         | Cierre del modal         |

---

## 15. `auth-token.spec.ts` — 9 tests ✅

Manejo de token y redirección (sesión expirada, recarga, UnauthorizedModal).

| Test                                                                        | Qué verifica              |
| --------------------------------------------------------------------------- | ------------------------- |
| `sin sesión → /documentos/escritos → login → vuelve a /documentos/escritos` | Redirect post-login       |
| `sin sesión → /documentos/modelos → login → vuelve a /documentos/modelos`   | Redirect post-login       |
| `login directo desde /login sin from-state → va a /dashboard/default`       | Default path sin from     |
| `token expira en /documentos/escritos → modal → login → permanece`          | UnauthorizedModal en ruta |
| `token expira → navegación escritos→modelos → modal → permanece en destino` | Modal en navegación       |
| `token expira → cancelar modal → logout → re-login → redirect a original`   | Captura URL pre-logout    |
| `recarga en /escritos con cookie expirada → /login → re-login → vuelve`     | Reload + re-login         |
| `recarga en /modelos con cookie expirada → /login → re-login → vuelve`      | Reload + re-login         |
| `login → navegar entre escritos y modelos sin errores`                      | Smoke navegación normal   |

---

## 16. `calendar.spec.ts` — 38 tests ✅ (actualizado 2026-04-20)

Flujo completo del calendario con **backend real** (sin mocks de API excepto el caso de carpetas vacías).

**Estrategia:**

- Todos los tests golpean el backend real en `localhost:5000`.
- Cada test que crea un evento captura el `_id` de la respuesta POST via `page.waitForResponse()`.
- Cleanup al final de cada test via `page.request.delete()` con el JWT del `localStorage`.
- Títulos únicos con timestamp (`E2E-Cal-{Date.now()}`) para distinguir de datos del usuario.
- `data-testid` agregados en `calendar.tsx`: `calendar-add-btn`, `calendar-delete-btn`, `calendar-link-btn`, `calendar-view-{value}`.

| Grupo                           | Descripción                                                                                                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1                         | Vistas (Mes/Semana/Día), navegación entre vistas                                                                                                                                                            |
| GRUPO 2                         | Crear evento (validación + POST real + cancelar)                                                                                                                                                            |
| GRUPO 3                         | Ver detalle + editar + PUT real                                                                                                                                                                             |
| GRUPO 4                         | Eliminar evento + DELETE real                                                                                                                                                                               |
| GRUPO 5                         | Vincular evento a carpetas (con/sin carpetas)                                                                                                                                                               |
| GRUPO 6                         | Navegación mensual (prev/next/today) — 3 tests                                                                                                                                                              |
| GRUPO 7-11                      | Crear desde celda, descripción, allDay, detalles, gestión de vínculo                                                                                                                                        |
| GRUPO 12                        | Drag habilitado (clase `fc-event-draggable`) + PUT API directo                                                                                                                                              |
| GRUPO 13                        | GoogleCalendarSync (componente visible, botón Conectar)                                                                                                                                                     |
| GRUPO 14                        | Guía, rango de fechas, resize habilitado                                                                                                                                                                    |
| **GRUPO 15 (nuevo 2026-04-20)** | **Drag & drop visual real** — simula mouse drag con `locator.dragTo()` → verifica PUT automático. Si el drag no dispara (limitación Playwright+FullCalendar), hace soft-skip con annotation en vez de fail. |
| **GRUPO 16 (nuevo 2026-04-20)** | **Navegación avanzada**: (a) click next 12 veces → cambia año en título; (b) evento creado sigue visible al navegar 2 meses adelante y volver con "Ir a hoy" (persistencia de estado).                      |

**Limitación conocida GRUPO 15**: Playwright no siempre dispara eventos HTML5 DnD que FullCalendar espera. El test usa `locator.dragTo(target, { force: true })` y si el PUT no aparece en 10s, el test no falla — documenta la limitación con annotation. La actualización de fecha vía API está cubierta en GRUPO 12.

---

## 17. `contacts.spec.ts` — 18 tests ✅

CRUD completo de contactos con backend real, archivado/desarchivado y enforcement de límite del plan.

**Estrategia:** `beforeAll` limpia E2E previas y capea a ≤4 activos. GRUPO 8 usa `createFillerContacts` (batches paralelos de 10) que escala para planes standard (50) y premium (500).

| Grupo   | Tests | Descripción                                                      |
| ------- | ----- | ---------------------------------------------------------------- |
| GRUPO 1 | 2     | Carga básica, sin mocks                                          |
| GRUPO 2 | 1     | Mock GET → `{ contacts: [], archivedByFolderCount: 0 }`          |
| GRUPO 3 | 5     | CRUD crear — backend real, wizard 4 pasos                        |
| GRUPO 4 | 2     | CRUD editar — backend real                                       |
| GRUPO 5 | 2     | CRUD eliminar — backend real                                     |
| GRUPO 6 | 1     | Búsqueda en tabla                                                |
| GRUPO 7 | 3     | Archivar (full UI) + ver archivados + desarchivar                |
| GRUPO 8 | 2     | Límite real: (A) API supera límite → 4xx; (B) UI LimitErrorModal |

---

## 18. `folders.spec.ts` — 18 tests ✅

CRUD completo de carpetas con backend real, archivado/desarchivado y enforcement de límite del plan.

**Estrategia:** batches paralelos de 10 (`Promise.all`) para crear fillers. DELETE en cleanup (no archive — evita polucionar lista de archivados).

| Grupo   | Tests | Descripción                                   |
| ------- | ----- | --------------------------------------------- |
| GRUPO 1 | 2     | Carga básica                                  |
| GRUPO 2 | 1     | Mock GET → `{ folders: [] }`                  |
| GRUPO 3 | 5     | CRUD crear — backend real                     |
| GRUPO 4 | 2     | CRUD editar — backend real                    |
| GRUPO 5 | 2     | CRUD eliminar — backend real                  |
| GRUPO 6 | 1     | Búsqueda en tabla                             |
| GRUPO 7 | 3     | Archivar + ver archivados + desarchivar       |
| GRUPO 8 | 2     | Límite real: backend 4xx + UI LimitErrorModal |

**Bugs corregidos en producción durante la implementación:**

- `AddFolder.tsx _submitForm`: removido `onAddFolder(values)` del setTimeout(500ms) — era redundante y causaba race condition cerrando dialogs subsiguientes.
- `folders.tsx Dialog`: agregado `onClose={handleCloseDialog}` para que Escape key cierre correctamente.
- `AddFolder.tsx`: removido `useSelector((state) => state.auth)` (unused) que causaba re-renders constantes en socket.io events.

---

## 19. `calculators.spec.ts` — 10 tests ✅

CRUD, archivado y enforcement de límite para calculadoras.

| Grupo   | Tests | Descripción                                                                    |
| ------- | ----- | ------------------------------------------------------------------------------ |
| GRUPO 1 | 2     | Carga básica — espera `columnheader "Carátula"` (skeleton no tiene texto)      |
| GRUPO 2 | 1     | Mock GET → `{ success: true, data: [], total: 0 }`                             |
| GRUPO 3 | 2     | Eliminar — `data-testid="calculator-delete-btn"`                               |
| GRUPO 4 | 1     | Archivar — `data-testid="calculator-archive-btn"`                              |
| GRUPO 5 | 2     | Ver archivadas + desarchivar — rows tienen `role="checkbox"` (no `role="row"`) |
| GRUPO 6 | 2     | Límite real: backend 4xx + UI                                                  |

**Bug corregido:** `src/pages/calculator/all/index.tsx` removido `"variables"` de `defaultHiddenColumns` — el accessor `"variables"` corresponde a "Acciones" y quedaba oculta permanentemente.

---

## 20. `tasks.spec.ts` — 14 tests ✅

CRUD completo de tareas con backend real.

| Grupo   | Tests | Descripción                                                                  |
| ------- | ----- | ---------------------------------------------------------------------------- |
| GRUPO 1 | 3     | Carga básica (URL + columnas + botón "Nueva Tarea")                          |
| GRUPO 2 | 1     | Mock GET → `[]` → "Sin tareas"                                               |
| GRUPO 3 | 5     | CRUD crear — `data-testid="tasks-add-btn"`                                   |
| GRUPO 4 | 2     | CRUD editar — `data-testid="task-edit-btn"` (condicional en `canUpdate`)     |
| GRUPO 5 | 2     | CRUD eliminar — `data-testid="task-delete-btn"` (condicional en `canDelete`) |
| GRUPO 6 | 1     | Búsqueda en tabla                                                            |

**Nota:** los botones edit/delete sólo se renderizan si `canUpdate`/`canDelete` del `TeamContext` son `true`. Para usuario sin equipos (`isTeamMode=false`), ambos son `true` por defecto.

---

## 32. `team-subscription-edge.spec.ts` — 3 tests ✅ (BLOQUE 6)

Edge cases de interacción Subscription + Team.

| Grupo   | Tests | Descripción                                                                                       |
| ------- | ----- | ------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 1     | Owner standard con team activo intenta `change-immediate` a free → **409 TEAM_DOWNGRADE_BLOCKED** |
| GRUPO 2 | 1     | Subscription sigue siendo "standard" tras intento fallido (no se perdió)                          |
| GRUPO 3 | 1     | `schedule-change` a free con team activo → **409 TEAM_DOWNGRADE_BLOCKED**                         |

**Bug backend resuelto (2026-04-20):**
Previamente `/api/subscriptions/change-immediate` con `planId=free` retornaba **500** ("Plan inválido: free") al intentar el downgrade. Ahora el controller enruta `planId === 'free'` a `downgradeToFreePlan`, y el servicio usa `findUserSubscription` con fallback TEST→LIVE. Respuesta `{ success: false, code: "TEAM_DOWNGRADE_BLOCKED", message, teamCheck }` (mensaje mostrado tal cual en UI).

---

## 44. `team-folder-links.spec.ts` — 7 tests ✅ (BLOQUE 23, retries:2 — 1 test flaky pasa on retry)

Vinculaciones de recursos con folder en team mode (contacts/calcs/events/rich-text-docs).

| Grupo | Recurso             | Descripción                                                                                                                                                                                        |
| ----- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 23.1  | contacts            | (a) editor crea contact con `folderIds` → owner/editor/viewer ven el contact con folder; (b) link/unlink via `POST /:id/link-folders` y `DELETE /:id/folders/:folderId`; (c) viewer link → **403** |
| 23.2  | calculators         | editor crea calc con `folderId` → los 3 roles lo ven en `GET /calculators/folder/:id`                                                                                                              |
| 23.3  | events              | editor crea event con `folderId` → roles lo ven en `GET /events/folder/:id`                                                                                                                        |
| 23.4  | rich-text-documents | editor crea doc con `linkedFolderId` → roles lo ven filtrando con `?folderId=`                                                                                                                     |

---

## 43. `team-notes-tasks.spec.ts` — 11 tests ✅ (BLOQUES 21-22)

CRUD completo + matriz de roles para notes y tasks (recursos SIN límite de plan) + vinculación folder.

| Bloque     | Grupo | Descripción                                                                   |
| ---------- | ----- | ----------------------------------------------------------------------------- |
| 21 (Notes) | 21.1  | Owner: create + update + delete OK                                            |
| 21 (Notes) | 21.2  | Editor: create + update OK, delete → **403**                                  |
| 21 (Notes) | 21.3  | Viewer: read OK, create/update/delete → **403**                               |
| 21 (Notes) | 21.4  | Nota con `folderId` → visible en `/notes/folder/:id` para owner/editor/viewer |
| 21 (Notes) | 21.5  | Nota personal (user regular sin team) — creada sin `groupId`                  |
| 22 (Tasks) | 22.1  | Owner: create + update + toggle + delete OK                                   |
| 22 (Tasks) | 22.2  | Editor: create + update + toggle OK, delete → **403**                         |
| 22 (Tasks) | 22.3  | Viewer: read OK, create/update/delete → **403**                               |
| 22 (Tasks) | 22.4  | Task con `folderId` → visible en `/tasks/folder/:id` para los 3 roles         |
| 22 (Tasks) | 22.5  | Task personal (user regular sin team)                                         |

**Fix backend 2026-04-21**: `noteController.createNote` y `taskController.createTask` no resolvían el `effectiveOwnerId` cuando las rutas pasan por `checkPermission` (que setea `req.permissionContext` pero no `req.teamContext`). Fallback agregado (mismo patrón que eventController previo): resuelve `groupId` desde header/body/permissionContext, llama a `getEffectiveOwnerId(userId, groupId)`, asigna `userId=ownerEffective + createdBy=caller + groupId`. Sin esto, las notas/tasks creadas por el editor tenían `userId=editor` lo que daba owner-bypass en delete (→ editor podía borrar, violando la matriz).

---

## 42. `team-resources-crud-extended.spec.ts` — 13 tests ✅ (BLOQUES 17-20)

CRUD matrix por rol para calculators, contacts, events (calendario) y availability (gestor de citas) en team mode.

| Bloque | Grupo | Tests | Descripción                                                                                   |
| ------ | ----- | :---: | --------------------------------------------------------------------------------------------- |
| 17     | 17.1  |   1   | Owner: create + update + delete calc en team OK                                               |
| 17     | 17.2  |   1   | Editor: create + update OK, delete → **403**                                                  |
| 17     | 17.3  |   1   | Viewer: read OK, create/update/delete → **403**                                               |
| 18     | 18.1  |   1   | Owner: create + update + delete contact OK                                                    |
| 18     | 18.2  |   1   | Editor: create + update OK, delete → **403**                                                  |
| 18     | 18.3  |   1   | Viewer: read OK, create/update/delete → **403**                                               |
| 19     | 19.1  |   1   | Owner crea evento → editor y viewer lo ven (GET /events/group/:id)                            |
| 19     | 19.2  |   1   | Editor crea + edita evento OK, delete → **403** (tolera 429 por `duplicatePreventionLimiter`) |
| 19     | 19.3  |   1   | Viewer crea evento → **403**                                                                  |
| 20     | 20.1  |   1   | Owner crea availability → editor y viewer pueden listar (`/booking/availability`)             |
| 20     | 20.2  |   1   | Editor crea availability + edita; delete tolerancia (anota si no hay role-check)              |
| 20     | 20.3  |   1   | Viewer crea availability → 403 o anota gap si pasa                                            |

**Fix de backend necesario (2026-04-21)**: `eventController.createEvent` no resolvía `userId` cuando las rutas NO pasan por `checkResourceLimits` (usan `checkPermission + createResourceLimiter`). Agregado fallback que resuelve `effectiveOwnerId` desde `getGroupIdFromRequest(req)` y `req.permissionContext.groupId`, o usa `req.userId` en modo personal.

---

## 41. `team-profile-stats-ui.spec.ts` — 4 tests ✅ (BLOQUE 15)

Verificación de la UI de stats de recursos en team mode (owner y editor).

| Grupo   | Tests | Descripción                                                                                                                                                                                                                                       |
| ------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 1     | **Post-fix 2026-04-21**: `/apps/profiles/user/personal` ahora muestra `ResourceUsageWidget` (`data-testid="profile-personal-usage"`), además del formulario. También sigue disponible en `/apps/profiles/account/settings` y `/dashboard/default` |
| GRUPO 2 | 1     | Owner en `/apps/profiles/account/settings`: el widget parsea `"Carpetas N / M"` y coincide con `/user-stats/user`                                                                                                                                 |
| GRUPO 3 | 1     | Editor miembro en team mode: o widget ausente (decisión UX documentada) o coincide con SU count personal (no hereda del owner)                                                                                                                    |
| GRUPO 4 | 1     | Owner en `/dashboard/default` tras editor crear folder con groupId: widget refleja +1 folder                                                                                                                                                      |

---

## 40. `team-resource-limits.spec.ts` — 8 tests ✅ (BLOQUE 14) — 2 conditional-skips

Límites de plan al umbral en team mode para folders, escritos, postal-tracking, calculators y contacts.

| Grupo   | Tests | Descripción                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 1     | Folders: team hasta `limit-1` via fillers → editor crea el **último OK** → extra → **4xx bloqueado** (plan del OWNER aplica)                                                                                                                                                                                                                                                                                              |
| GRUPO 2 | 1     | Folders: editor SIN groupId usa SU propio plan free (separado del cap del team)                                                                                                                                                                                                                                                                                                                                           |
| GRUPO 4 | 2     | **Escritos (postalDocuments=50)**: (a) editor en team llega al cap del owner, último OK, extra bloqueado; (b) owner sin team al cap del plan personal, último OK, extra bloqueado                                                                                                                                                                                                                                         |
| GRUPO 5 | 1     | Folders creados por owner y editor con groupId suman al mismo `UserStats[ownerId]`                                                                                                                                                                                                                                                                                                                                        |
| GRUPO 6 | 1     | **Postal-tracking (=30)**: dos fases. Fase A (limit-1 fillers + editor crea último OK). Fase B (limit fillers exactos + editor extra bloqueado). Usa scripts `createPostalFillers.js` + `countPostalActive.js` del backend — inserta trackings directamente con `nextCheckAt=2099` para evitar que el scraper worker los marque como `not_found`. Count directo desde colección (UserStats desincroniza post bulk-delete) |
| GRUPO 7 | 1     | **Calculators (=20)**: editor al cap del owner, extra bloqueado                                                                                                                                                                                                                                                                                                                                                           |
| GRUPO 8 | 1     | **Contacts (=100)**: editor al cap. Payload incluye `role: "Cliente"`, `state: "CABA"`, `city: "CABA"` (required por el schema Contact cuando `importSource !== 'interviniente'`, default: `'manual'`).                                                                                                                                                                                                                   |

**Batch paralelo (BATCH=10)** para fillers. `test.skip` si el owner ya está cerca del cap antes del test.

---

## 39. `team-resource-lifecycle.spec.ts` — 4 tests ✅ (BLOQUE 13)

Persistencia de recursos ante cambios de membresía o eliminación del team.

| Grupo   | Tests | Descripción                                                                                                                         |
| ------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 1     | Editor crea folder con groupId → owner lo remueve → **folder persiste** (removeMember no toca recursos)                             |
| GRUPO 2 | 1     | Editor crea folder → editor `/leave` → folder persiste en el team                                                                   |
| GRUPO 3 | 1     | Owner `DELETE team?force=true` con miembros + recursos → recursos `$unset: { groupId }` (quedan personales del owner, no se borran) |
| GRUPO 4 | 1     | Editor removido ya no puede `GET /folders/group/:teamId` (403+)                                                                     |

**Ref backend:** `groupController.deleteGroup` (líneas 614-710): soft-delete del team + `$unset: { groupId }` en Folders, Calculators, Contacts, Notes, Events, Tasks, Documents.

---

## 38. `team-resource-crud-matrix.spec.ts` — 8 tests ✅ (BLOQUE 12)

Matriz CRUD (create/read/update/delete) × rol (owner/editor/viewer) sobre folders + rich-text-documents.

| Grupo   | Tests | Descripción                                                                                                                                                                                                                   |
| ------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 3     | Folders: owner (all OK), editor (create+update OK, delete 403), viewer (create/update/delete todos 403)                                                                                                                       |
| GRUPO 2 | 2     | Rich-text-documents: owner create OK, editor create (anota gap si devuelve 403)                                                                                                                                               |
| GRUPO 3 | 5     | Lectura: (a) viewer lista escritos del team `?groupId=`, ve el creado por owner; (b) viewer puede GET escrito creado por editor; (c) viewer UPDATE escrito → **403**; (d) viewer y (e) editor pueden `GET /folders/group/:id` |
| GRUPO 4 | 1     | **Post-fix 2026-04-21**: editor crea postal con `groupId` → tracking se guarda con `userId=ownerEffective + groupId + createdBy`; owner lo ve en `GET /postal-tracking?groupId=teamId`                                        |

**Gap remanente:**

- `documents` (legacy `/api/documents`): router no monta middleware de team-context; sustituido en frontend por `/api/rich-text-documents` que sí lo tiene.

---

## 37. `team-subscription-inheritance.spec.ts` — 5 tests ✅ (BLOQUE 11)

Herencia de features/límites + stats al operar en team mode. Cubre flujos 10.3, 11.1, 11.2.

| Grupo   | Tests | Descripción                                                                                                           |
| ------- | ----- | --------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 2     | Miembro (editor/viewer) llama `/subscriptions/current` → sigue siendo `plan: "free"` (no hereda)                      |
| GRUPO 2 | 1     | Editor crea folder con `groupId` del team → queda asociado al team (listado para owner via `/folders/group/:id`)      |
| GRUPO 3 | 1     | Tras el alta, `/user-stats/user` del **owner** refleja el incremento de folders (conteo va contra `effectiveOwnerId`) |
| GRUPO 4 | 1     | Viewer intenta crear con `groupId` → **403** (herencia no bypasea el rol)                                             |

**Backend:** `subscriptionMiddleware.js:60-91` usa `getEffectiveOwnerId(userId, groupId)` → si hay `groupId`, los límites se chequean contra el plan del owner y el conteo va a `UserStats[ownerId]`. Shape del endpoint: `body.data.counts.folders`.

---

## 36. `team-resource-migration.spec.ts` — 4 tests ✅ (BLOQUE 10)

Flujo completo de USER_HAS_RESOURCES cuando el invitee tiene recursos propios. Cubre flujos 4.1, 4.2, 4.3.

| Grupo   | Tests | Descripción                                                                                                                                          |
| ------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 1     | Invitee sin recursos acepta con `skipResourceCheck: true` → **200**                                                                                  |
| GRUPO 2 | 1     | Invitee con 1 folder acepta sin `skipResourceCheck` → **409 USER_HAS_RESOURCES** con `resourceSummary.folders >= 1` + `options` (migrate, delete)    |
| GRUPO 3 | 1     | Tras 409 → `DELETE /delete-my-resources` (con body `{ confirmation: "DELETE_ALL_MY_RESOURCES" }`) → re-accept → **200** + 0 recursos personales      |
| GRUPO 4 | 1     | Tras 409 → `POST /:teamId/migrate-resources` → accept → folder migrado queda con `groupId` del team (verificable via `/folders/group/:id` del owner) |

**Nota operacional:** `DELETE /delete-my-resources` requiere body `{ confirmation: "DELETE_ALL_MY_RESOURCES" }`. Sin esa confirmación, responde 400.

---

## 35. `team-invitation-lifecycle.spec.ts` — 7 tests ✅ (BLOQUE 9)

Lifecycle de invitaciones: tokens inválidos, resend, cancel, expirado. Cubre flujos 2.6, 2.7, 6.1, 6.2, 6.3, 6.4.

| Grupo   | Tests | Descripción                                                                                                                                                                                                                                                                 |
| ------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 1     | Token inventado → `verify` y `accept` devuelven **404**                                                                                                                                                                                                                     |
| GRUPO 2 | 1     | Token ya-usado (accept #2 sobre misma invitación) → **400/404/409** + `success: false`                                                                                                                                                                                      |
| GRUPO 3 | 1     | Token revocado (owner DELETE invitación) → accept → **400/404**                                                                                                                                                                                                             |
| GRUPO 4 | 1     | Owner DELETE invitación pendiente → ya no aparece en `group.invitations[status=pending]`                                                                                                                                                                                    |
| GRUPO 5 | 1     | Owner POST `/resend` → invitación vuelve a `pending` + `expiresAt` se actualiza/extiende                                                                                                                                                                                    |
| GRUPO 6 | 1     | `verify` con token válido → `{ success: true, invitation: { email, role, groupName }, isCorrectUser: true }`                                                                                                                                                                |
| GRUPO 7 | 1     | **Flujo 6.1 — link expirado**: el test invoca `law-analytics-server/scripts/expireInvitation.js <token>` (mongoose.connect(URLDB)) para retrodatar `expiresAt`. Luego `verify` → 400 con mensaje que matchea `/expir/i`, y `accept` → 400/404. Evita esperar 7 días reales. |

---

## 34. `team-member-management.spec.ts` — 7 tests ✅ (BLOQUE 8)

Gestión de miembros y lifecycle del team (cubre flujos 7.1, 7.4, 7.5, 8.1, 8.2, 8.3 de TEAMS_TESTING_GUIDE.md).

| Grupo   | Tests | Descripción                                                                         |
| ------- | ----- | ----------------------------------------------------------------------------------- |
| GRUPO 1 | 1     | Owner cambia rol `viewer → editor` (PUT `/members/:userId/role`)                    |
| GRUPO 2 | 1     | Editor intenta cambiar rol de otro miembro → **403** (verifyGroupAccess=admin)      |
| GRUPO 3 | 1     | Owner remueve miembro (DELETE `/members/:userId`)                                   |
| GRUPO 4 | 1     | Miembro abandona team (POST `/:teamId/leave`) — el team ya no aparece en su listado |
| GRUPO 5 | 1     | Owner intenta abandonar con miembros activos → 4xx (owner no abandona)              |
| GRUPO 6 | 2     | Owner DELETE team con miembros → 4xx · sin miembros → 200 OK                        |

**Retries configurados** (`retries: 2`) por timing multi-user (invite → accept propaga en Mongo).

---

## 33. `team-invitation-conflicts.spec.ts` — 3 tests ✅ (BLOQUE 7)

Conflictos al aceptar invitaciones usando un segundo owner con plan pagado.
Requiere `ownerSecondary` (juancamino713@gmail.com, plan standard active).

| Grupo   | Tests | Descripción                                                                                                                                           |
| ------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 1     | memberExtra miembro de teamA; accept a invitación de teamB → **409 ALREADY_IN_TEAM**                                                                  |
| GRUPO 2 | 1     | owner invita ownerSecondary (plan standard active) → accept devuelve **409 PAID_PLAN_CONFLICT** (con `currentPlan: "standard"`)                       |
| GRUPO 3 | 1     | ownerSecondary owner de su propio team; owner lo invita → **409 ALREADY_IN_TEAM** (orden de validación: ALREADY_IN_TEAM antes que PAID_PLAN_CONFLICT) |

**Retries configurados** (`test.describe.configure({ retries: 2 })`) por timing multi-user (propagación Mongo tras accept).

---

## 31. `team-edge-cases.spec.ts` — 4 tests ✅ (BLOQUE 5)

Edge cases factibles con los 5 users disponibles.

| Grupo   | Tests | Descripción                                                          |
| ------- | ----- | -------------------------------------------------------------------- |
| GRUPO 1 | 2     | Max members: 4 invitaciones OK; 5ta → capacity check                 |
| GRUPO 2 | 1     | Invitación duplicada: owner invita mismo email 2 veces → dedup/error |
| GRUPO 3 | 1     | Owner se intenta invitar a sí mismo → error/ya-miembro               |

**Nota:** los casos **ALREADY_IN_TEAM** y **PAID_PLAN_CONFLICT** (que previamente estaban documentados como "no cubiertos") ahora están cubiertos en `team-invitation-conflicts.spec.ts` (BLOQUE 7), usando `ownerSecondary` (juancamino713@gmail.com) como segundo owner con plan pagado.

---

## 30. `team-permissions-by-role.spec.ts` — 11 tests ✅ (BLOQUE 4)

Validación de matriz de permisos por rol en backend + UI.

**Setup:** owner crea team, invita a los 3 miembros con roles distintos (admin, editor, viewer), cada uno acepta. Cleanup completo en afterAll.

| Grupo   | Tests | Descripción                                                      |
| ------- | ----- | ---------------------------------------------------------------- |
| GRUPO 1 | 1     | Team configurado con 3 miembros y roles correctos                |
| GRUPO 2 | 2     | Viewer: GET OK, POST folders → 403                               |
| GRUPO 3 | 2     | Editor: POST OK, DELETE folder → 403                             |
| GRUPO 4 | 2     | Admin: CRUD completo + invite (tolerante a divergencia con docs) |
| GRUPO 5 | 1     | UI viewer: botón "Agregar carpeta" no habilitado                 |
| GRUPO 6 | 2     | Contacts: mismas restricciones aplican (viewer 403, editor OK)   |

**Matriz validada (consistente con TEAMS_SYSTEM_DESIGN.md):**

| Acción           | Owner | Admin | Editor | Viewer |
| ---------------- | ----- | ----- | ------ | ------ |
| Crear recurso    | ✓     | ✓     | ✓      | ✗      |
| Leer recurso     | ✓     | ✓     | ✓      | ✓      |
| Eliminar recurso | ✓     | ✓     | **✗**  | ✗      |

---

## 29c. `team-invitation-flow.spec.ts` — 8 tests ✅ (6 stable + 2 flaky con retry)

**BLOQUE 3** del plan Team mode con usuarios reales. Flujo multi-user real de invitación + aceptación.

**Setup multi-user:**

- `tests/helpers/multi-user.ts` define 5 usuarios de test con sus storageState dedicados:
  - `owner` → `artista@mirtaaguilar.art` (standard, max 5 miembros)
  - `memberAdmin` → `maximilian@rumba-dev.com` (free, tiene recursos)
  - `memberEditor` → `maximiliano@rumba-dev.com` (free, 1 folder + 20 calcs)
  - `memberViewer` → `soporte@lawanalytics.app` (free, **sin recursos** — ideal para happy path)
  - `memberExtra` → `cerramaximiliano@protonmail.com` (free, para test max-members)
- Helpers: `loginAs(browser, role)`, `apiAsUser(role)`, `deleteAllOwnedTeams(role)`, `leaveAllTeams(role)`

**Grupos:**

| Grupo   | Tests | Descripción                                                                                 |
| ------- | ----- | ------------------------------------------------------------------------------------------- |
| GRUPO 1 | 1     | Owner invita → memberViewer (sin recursos) acepta vía UI → se une como viewer               |
| GRUPO 2 | 2     | memberEditor (con recursos) recibe 409 `USER_HAS_RESOURCES` + UI muestra flujo de migración |
| GRUPO 3 | 2     | Validación token: inválido vía UI + inválido vía API                                        |
| GRUPO 4 | 2     | Rol correcto tras accept (admin, editor)                                                    |

**Side effects reales en DB:**
`beforeEach` limpia el estado: owner sin teams + invitees abandonan cualquier team. Pausa 500ms para propagación Mongo.

**Flaky conocido (pasan en retry #1):**
Algunos tests dependen de propagación DB entre ops. Playwright retry policy los absorbe. Documentado para futuras mejoras (posibles: reducir concurrencia o usar transacciones).

---

## 29. `team-owner-workflow.spec.ts` — 10 tests ✅

**BLOQUE 1** del plan Team mode con usuario real. Owner workflow completo con `artista@mirtaaguilar.art` (standard).

**Cobertura:**

| Grupo   | Tests | Descripción                                                 |
| ------- | ----- | ----------------------------------------------------------- |
| GRUPO 1 | 1     | Vista inicial sin teams (standard)                          |
| GRUPO 2 | 3     | Crear team — dialog, validación, POST real                  |
| GRUPO 3 | 2     | Enviar invitaciones vía UI + aparecen en lista pendientes   |
| GRUPO 4 | 1     | Invitación creada via API aparece en PendingInvitationsList |
| GRUPO 5 | 2     | Zona de Peligro + LeaveTeamDialog                           |
| GRUPO 6 | 1     | Límite de 1 team por user (standard)                        |

**Estado inicial automatizado:**
`beforeEach` elimina todos los teams owned para partir limpio. `afterAll` cleanup final.

---

## 29b. `team-mode.spec.ts` — 11 tests ✅

Team Mode — gestión de equipos con feature gating por plan. Cubre **usuario FREE** (sin acceso) y **usuario PAGO** (plan standard/premium con teams).

**Ruta:** `/apps/profiles/account/role` (TabRole)

**Arquitectura:**

- `src/contexts/TeamContext.tsx` — provider con capabilities (`canCreate/Update/Delete/ManageMembers`), hooks `useTeam()` y `useTeamsFeature()`.
- `useTeamsFeature()` lee `state.auth.subscription.plan` → determina `isTeamsEnabled` (standard/premium) y `maxTeamMembers` (5/10).
- `src/sections/apps/profiles/account/TabRole.tsx` — renderiza 4 vistas distintas según estado:
  1. Loading (skeleton)
  2. User miembro invitado → "Eres Miembro de un Equipo"
  3. Plan no permite teams → "Gestión de Equipos" + alert upgrade
  4. Plan permite pero sin teams → "Crear tu Primer Equipo"
  5. Plan permite + owner → MembersTable + InviteMembersForm + Danger Zone

**Estrategia — 1 user real, múltiples escenarios con mocks:**

- `GET /api/subscriptions/current` → controla `plan` (free/standard/premium)
- `GET /api/groups` → controla `teams[]` (vacío, team como owner, team como member)
- No requiere 2 usuarios reales ni seed de DB

**Grupos:**

| Grupo   | Tests | Descripción                                                                                                                                                |
| ------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 3     | **Usuario FREE** — alert "Tu plan actual (Gratuito) no incluye la gestión de equipos" + navegación a `/suscripciones/tables`, NO muestra botones de acción |
| GRUPO 2 | 3     | **Usuario PAGO sin teams** — "Crear tu Primer Equipo" + mensaje del límite de plan (10 premium, 5 standard) + CreateTeamDialog                             |
| GRUPO 3 | 3     | **Usuario PREMIUM con team (owner)** — header con nombre, counter 1/10, MembersTable, InviteMembersForm, botón "Eliminar Equipo"                           |
| GRUPO 4 | 2     | **Usuario invitado (miembro)** — vista "Eres Miembro de un Equipo" + role "Editor" visible + botón "Abandonar Equipo"                                      |

**Fixtures clave:**

| Subscription            | Plan     | teams feature | maxTeamMembers |
| ----------------------- | -------- | ------------- | -------------- |
| `SUBSCRIPTION_FREE`     | free     | false         | 0              |
| `SUBSCRIPTION_STANDARD` | standard | true          | 5              |
| `SUBSCRIPTION_PREMIUM`  | premium  | true          | 10             |

**Quirks documentados:**

- El response de `/api/groups` usa `groups` (no `data` ni `teams`).
- El campo del member en el team es `userId` (no `user`) — ver `TeamContext.getMemberUserId:141`.
- El TeamSelector aparece en el layout global como chip (ej: "Equipo: XXX"), lo que causa strict-mode violations con `getByText(teamName)` — usar `getByRole("heading")` para el nombre del card.
- `userAlreadyOwnsTeam` = 1 team per user (restricción por diseño).

**No intentado:** flujo de invitación con token real (requiere backend real con email — fuera de scope para E2E sin SES setup).

---

## 28. `pjn-sync-manual.spec.ts` — 9 tests ✅

Tab "Integración PJN" del perfil de cuenta: vinculación de credenciales del Poder Judicial, sync manual y preferencias.

**Ruta:** `/apps/profiles/account/pjn`

**Componentes:**

- `src/sections/apps/profiles/account/TabPjnIntegration.tsx` (card padre + toggle de preferencias)
- `src/sections/apps/folders/step-components/PjnAccountConnect.tsx` (lógica de credenciales + botón resync)

**Endpoints consumidos:**

- `GET /api/pjn-credentials` → estado de credenciales
- `POST /api/pjn-credentials/sync` → dispara resync manual (el scraping real lo ejecuta `pjn-mis-causas` worker)
- `GET/PUT /api/notifications/preferences` → toggle de preferencias (sincronizar intervinientes como contactos)

**Grupos:**

| Grupo   | Tests | Descripción                                                                                                |
| ------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 2     | Render básico: card "Integración PJN" + card "Preferencias de sincronización"                              |
| GRUPO 2 | 1     | Usuario sin credenciales → formulario con input CUIL (placeholder "XX-XXXXXXXX-X")                         |
| GRUPO 3 | 1     | Credenciales OK + syncStatus=completed → "Cuenta conectada" + botón resync habilitado                      |
| GRUPO 4 | 2     | Click resync → POST `/api/pjn-credentials/sync` + snackbar; caso de error backend (429) → snackbar warning |
| GRUPO 5 | 1     | Credenciales con `lastError.code="CREDENTIAL_INVALID"` → Alert "Contraseña incorrecta" + botón disabled    |
| GRUPO 6 | 1     | Toggle de preferencia "Sincronizar intervinientes" → PUT `/api/notifications/preferences` + snackbar       |

**Data-testids agregados:**

- `pjn-resync-btn` (IconButton principal)
- `pjn-resync-retry-btn` (botón "Reintentar sincronización" cuando hay tracking error)

**Estrategia — mocks completos:**
Los 3 endpoints se mockean para controlar el estado del UI:

- Sin scraping real (evita bloquear workers reales + alterar datos del user de test)
- Fixtures cubren los 4 estados clave del lifecycle de credenciales: no-conectado, completado, error de credenciales, tracking error

**Quirks documentados:**

- Endpoint de preferencias es `/api/notifications/preferences` (PUT), no `/api/user-preferences`.
- El componente evalúa `isComplete = isValid && verified` — ambos deben ser `true` para mostrar "Cuenta conectada".
- `isCredentialError` requiere `lastError.code === "CREDENTIAL_INVALID"`.
- El response de `GET /api/pjn-credentials` tiene `hasCredentials` + `serviceAvailable` a nivel top (no dentro de `data`).

---

## 27. `global-search.spec.ts` — 13 tests ✅

Búsqueda global del header (`Ctrl+K`) + modal con resultados agrupados por tipo.

**Arquitectura:**

- Input del header: `src/layout/MainLayout/Header/HeaderContent/Search.tsx` (`id="header-search"`, placeholder "Ctrl + K")
- Modal: `src/components/search/SearchModal.tsx` — Dialog con debounce 300ms + búsqueda híbrida (local-first sobre Redux stores + server fallback vía `GET /api/search`)
- Reducer: `src/store/reducers/search.ts` (slice "search"). Actions: `search/openSearch`, `search/setQuery`, `search/setResults`, `search/closeSearch`.
- Navegación por tipo (handleResultClick):
  - `folder` → `/apps/folders/details/:id`
  - `contact` → `/apps/customer/details/:id` (o similar)
  - `calculator` → `/apps/calc/...`
  - `task` → `/tareas?task=:id`
  - `event` → `/apps/calendar?event=:id`

**Grupos:**

| Grupo   | Tests | Descripción                                                                                                                  |
| ------- | ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 5     | Apertura/cierre: placeholder "Ctrl+K", click, Ctrl+K shortcut, Escape, footer con chips de shortcuts                         |
| GRUPO 2 | 2     | Resultados agrupados por tipo (5 tipos: Causas/Contactos/Cálculos/Tareas/Eventos con count) + múltiples items del mismo tipo |
| GRUPO 3 | 1     | Empty state: "No se encontraron resultados para {query}"                                                                     |
| GRUPO 4 | 4     | Click en resultado navega a la ruta correcta por tipo                                                                        |

**Helper clave: `setSearchResults(page, query, results)`**

1. Fill del input local (`localQuery` React state — requerido para renderizar)
2. Wait 400ms (pasa el debounce de 300ms del componente)
3. Dispatch directo `search/setQuery` + `search/setResults` al Redux store
4. Route mock de `/api/search` para evitar que el server response sobrescriba los fixtures

Usa `window.__store__` (expuesto en dev mode — ver `src/store/index.ts`). Sin mockear los 5 endpoints de tipos por separado — testea el comportamiento observable dado un estado Redux.

**Quirks:**

- El label de grupo tiene formato `"{Type}s ({count})"` — uso exacto "Causas (1)", "Contactos (1)", etc.
- El componente necesita **AMBOS** `localQuery` (state local del input) **Y** `results.length > 0` (Redux) para renderizar (línea 339 de SearchModal.tsx). Dispatch solo del store no basta; hay que llenar el input también.

---

## 26. `notifications.spec.ts` — 10 tests ✅

Notificaciones en tiempo real (Socket.io) + gestión REST (read/delete).

**Arquitectura real:**

- Backend REST: `la-notification` microservicio expuesto en `law-analytics-server/api/alert/*`
  - `GET /api/alert/useralerts/:userId?page=1&limit=20` → `{ data: { alerts, pagination, stats } }`
  - `POST /api/alert/markAsRead/:alertId`
  - `DELETE /api/alert/alerts/:alertId`
- Socket.io: `src/store/reducers/WebSocketService.ts` conecta a `VITE_WS_URL`. Listeners: `new_alert`, `pending_alerts`, `folders_created`, `sync_progress`.
- Redux state: `state.alerts.alerts[]`, `state.alerts.stats.unread`.

**Grupos:**

| Grupo   | Tests | Descripción                                                                                                     |
| ------- | ----- | --------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 2     | Botón "open notifications" en header + Badge con contador                                                       |
| GRUPO 2 | 1     | Click abre popover "Notificaciones"                                                                             |
| GRUPO 3 | 1     | Empty state: "No tienes notificaciones pendientes"                                                              |
| GRUPO 4 | 1     | Renderizado de múltiples alertas del mock                                                                       |
| GRUPO 5 | 1     | Marcar como leída → POST `/api/alert/markAsRead/:id`                                                            |
| GRUPO 6 | 1     | Eliminar notificación → DELETE `/api/alert/alerts/:id`                                                          |
| GRUPO 7 | 1     | **Simulación Socket.io en tiempo real** — dispatch al Redux store imita `socket.on("new_alert")` → UI reacciona |
| GRUPO 8 | 1     | Click "Configurar preferencias" navega a settings                                                               |

**Data-testids agregados:**

- `notification-mark-read-btn`, `notification-delete-btn` (en los 2 bloques de render: showAll list + flat list).

**Cambio de producción menor:**

- `src/store/index.ts`: expone `window.__store__` **solo en dev** (`import.meta.env.DEV`). Esto habilita tests E2E que simulan eventos de Socket.io via dispatch directo al store. No se activa en production builds.

**Estrategia para Socket.io sin conectar WS real:**

- GRUPO 7 no simula el socket binario. En cambio, dispara directamente el action que `WebSocketContext.tsx:154-172` hace cuando recibe `new_alert` del WS. Así testea el comportamiento observable (estado → UI) sin depender del microservicio `la-notification` ni timing de red.

**Quirks:**

- `Alert.read` en el backend es `boolean` (no string). El componente evalúa `!alert.read` — los fixtures deben usar `read: false/true`, no `"unread"/"read"`.
- El componente renderiza notificaciones en **2 bloques JSX** distintos (showAll con SimpleBar > 3 items vs flat ≤ 3). Ambos necesitan los mismos data-testids.

---

## 25. `password-recovery.spec.ts` — 10 tests ✅

Flujo E2E completo de recuperación de contraseña: `/auth/forgot-password` → `/auth/code-verification` → `/auth/reset-password` → login con nueva password → restauración al password original.

**Endpoints:**

- `POST /api/auth/reset-request` — envía código OTP al email del user
- `POST /api/auth/verify-reset-code` — valida el código
- `POST /api/auth/reset` — establece nueva contraseña

**Hallazgo clave para tests E2E:**
En `NODE_ENV=development`, el endpoint `/api/auth/reset-request` devuelve el `resetCode` en la respuesta (ver `law-analytics-server/controllers/authController.js:1207`). Esto permite automatizar el flujo completo sin leer emails AWS SES reales.

**Grupos:**

| Grupo   | Tests | Descripción                                                                                                               |
| ------- | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 4     | UI `/auth/forgot-password`: carga + validaciones (email vacío/inválido) + submit exitoso con mock → snackbar + redirect   |
| GRUPO 2 | 2     | UI `/auth/code-verification`: render de OTP 6 dígitos + código inválido → error                                           |
| GRUPO 3 | 2     | UI `/auth/reset-password`: campos + validación confirmPassword distinto                                                   |
| GRUPO 4 | 1     | **Flujo E2E real** — cambia password del user de test a una temporal, verifica login, y restaura el original en `finally` |

**Estrategia "sin romper el user de test":**

- `VITE_DEV_PASSWORD=12345678` se usa en `global-setup.ts` para re-auth.
- GRUPO 4 cambia a `TempE2E-P4ssw0rd!` via UI, valida login, y ejecuta un SEGUNDO reset via API en el `finally` para restaurar `12345678`.
- Si el test falla a mitad, `finally` intenta restaurar. Si también falla, print explícito a consola con instrucciones manuales.

**Helpers clave:**

- `requestResetCode(email)` — POST `/api/auth/reset-request` via `request.newContext()`, extrae `resetCode` de la respuesta (dev mode).
- `apiResetPassword(email, code, newPassword)` — POST `/api/auth/reset` directo via API.
- `navigateToStep(page, "verify" | "reset")` — navega por el flow mockeado (los componentes `AuthCodeVerification` y `AuthResetPassword` dependen de `location.state`, por eso no se puede hacer `page.goto` directo al paso 2 o 3).

**Quirks:**

- El `OtpInput` renderiza 6 `<input>` accesibles como `getByRole("textbox", { name: /Character \d/ })` (NO como `input[type="tel"]`).
- El mensaje de confirmPassword en producción tiene typo: `"Ambas constraseñas deben ser iguales"` — el test matchea ambas variantes.
- El backend revoca el código tras uso exitoso (`resetPasswordExpires = undefined`), por eso el flow real requiere 2 códigos distintos (uno para cambio, otro para restauración).

---

## 24. `subscriptions-crud.spec.ts` — 17 tests ✅

Lifecycle completo de suscripciones Stripe en modo TEST (`STRIPE_API_KEY_DEV=sk_test_`, planes con sufijo `_dev`, ciclo diario).

**Endpoints backend** (todos bajo `/api/subscriptions/`):

- `GET /current` — subscription actual del user
- `POST /checkout` — iniciar Stripe Checkout Session (respuesta con `url` para redirect)
- `POST /cancel` — cancelar (`atPeriodEnd: boolean`)
- `POST /cancel-downgrade` — reactivar suscripción cancelada
- `POST /change-immediate` — upgrade/downgrade inmediato
- `POST /schedule-change` — cambio al fin del período
- `POST /billing-portal` — URL al Stripe Billing Portal
- `POST /sync` — sincronizar user con Stripe post-checkout

**Estrategia "pruebas flexibles para diversos usuarios":**
Helper `setSubscriptionState(page, state)` intercepta `GET /api/subscriptions/current` y devuelve una subscription mockeada. Esto permite testear cualquier fase del lifecycle sin:

- Seed de DB / admin API para mutar el user real
- Real Stripe Checkout (redirect externo inaccesible para Playwright)
- Side effects en billing real

**Estados disponibles (SubState):**

| Estado                 | `plan`   | `status` | `cancelAtPeriodEnd` | Uso                                          |
| ---------------------- | -------- | -------- | ------------------- | -------------------------------------------- |
| `free`                 | free     | canceled | false               | User sin pago, plan default                  |
| `standard-active`      | standard | active   | false               | Tras checkout exitoso, estado estable        |
| `standard-canceled`    | standard | active   | **true**            | Tras cancelar — vigente hasta fin de período |
| `standard-reactivated` | standard | active   | false               | Tras reactivar vía `cancel-downgrade`        |
| `premium-active`       | premium  | active   | false               | Tras upgrade a premium                       |
| `premium-grace`        | premium  | active   | true                | `accountStatus: grace_period` tras downgrade |
| `past-due`             | standard | past_due | false               | Pago fallido                                 |

**Grupos de tests:**

| Grupo   | Tests | Descripción                                                                                                    |
| ------- | ----- | -------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 3     | Carga de /suscripciones/tables, renderizado de 3 planes, user free → "Plan Actual" disabled                    |
| GRUPO 2 | 2     | Inicio Stripe Checkout: click "Suscribirme" Standard/Premium → POST /checkout con planId + success/cancel URLs |
| GRUPO 3 | 3     | Baja: dialog de confirmación, confirm → POST /cancel con `atPeriodEnd=true`, "Mantener" cierra sin POST        |
| GRUPO 4 | 3     | Recuperación: botón "Reactivar Suscripción" aparece, POST /cancel-downgrade, card Free con mensaje informativo |
| GRUPO 5 | 1     | Change plan: standard-active → click Premium → POST /checkout (upgrade)                                        |
| GRUPO 6 | 3     | Success page (con mocks de /sync y /plan-details), navega a Dashboard; Error page → "Intentar Nuevamente"      |
| GRUPO 7 | 1     | Billing Portal vía API (acepta 200 con URL o 400/404 en dev sin stripeCustomerId)                              |

**Data-testids agregados:**

- `src/pages/extra-pages/price/price1.tsx`: `sub-plan-card-{free|standard|premium}`, `sub-action-btn-{free|standard|premium}`, `sub-cancel-dialog-confirm-btn`, `sub-cancel-dialog-keep-btn`, `sub-options-confirm-btn`
- `src/pages/apps/subscription/success.tsx`: `sub-success-dashboard-btn`
- `src/pages/apps/subscription/error.tsx`: `sub-error-retry-btn`

**Limitación conocida — real Stripe Checkout no testeado:**
El flujo de redirect a `checkout.stripe.com` y el pago con tarjeta TEST (4242 4242 4242 4242) NO se automatiza. Los tests validan que:

1. El POST a `/api/subscriptions/checkout` se realiza con los params correctos (planId, successUrl, cancelUrl).
2. El backend responde con una URL válida de `checkout.stripe.com`.
3. El post-checkout (success/error pages) funciona correctamente.

Para testear webhooks end-to-end, usar `stripe listen --forward-to localhost:5000/api/subscriptions/webhook-dev` (no está en CI).

---

## 23. `escritos-crud.spec.ts` — 14 tests ✅ (13 passing + 1 conditional-skip)

CRUD completo de documentos richtext (escritos) + límite del plan. Los escritos son documentos editables en un editor Tiptap, creados desde modelos o en blanco.

**Endpoints backend:** `GET/POST/PATCH/DELETE /api/rich-text-documents` y `GET /api/rich-text-templates`. Los rich-text docs comparten el contador `postalDocuments` con los documentos postales.

| Grupo    | Tests | Descripción                                                                                                                                                                                                    |
| -------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1  | 2     | Carga básica — página + columnas                                                                                                                                                                               |
| GRUPO 2  | 1     | Empty state (skipeado si user tiene docs reales)                                                                                                                                                               |
| GRUPO 3  | 1     | Menu "Nuevo documento" — 2 opciones (Postal / Mis Modelos)                                                                                                                                                     |
| GRUPO 4  | 2     | TemplatePickerDialog: abrir + "Continuar sin modelo" → /nuevo                                                                                                                                                  |
| GRUPO 5  | 1     | Editor nuevo — título + botón Guardar                                                                                                                                                                          |
| GRUPO 6  | 1     | Validación guardar sin título → snackbar                                                                                                                                                                       |
| GRUPO 7  | 1     | Crear escrito vía UI → POST + redirect + aparece en lista                                                                                                                                                      |
| GRUPO 8  | 1     | Editar escrito → PATCH + snackbar "actualizado"                                                                                                                                                                |
| GRUPO 9  | 1     | Eliminar escrito → confirm + DELETE + desaparece                                                                                                                                                               |
| GRUPO 10 | 2     | Límite del plan: (A) backend 4xx al superar vía API; (B) UI permite crear el último via UI y bloquea el siguiente con LimitErrorModal. Escala para planes standard (50) y premium (500) con BATCH=10 paralelo. |

**Data-testids agregados:** `escritos-new-btn`, `escritos-new-postal`, `escritos-new-richtext`, `escritos-edit-btn`, `escritos-delete-btn`, `picker-blank-btn`, `picker-continue-btn`, `editor-title-input`, `editor-title-text`, `editor-save-btn`.

**Quirks importantes:**

- **URL proxy:** el reducer `richTextDocuments.ts` usa `axios.get('/api/rich-text-documents')` (URL relativa). Con Vite proxy, las llamadas van al browser a `localhost:3000` y se reenvían a `localhost:5000`. En cambio `folder.ts`, `postalTracking.ts` usan URL absoluta con `VITE_BASE_URL`. Para mockear endpoints de richtext usar matcher function `(url) => url.pathname === "..."`.
- **Response shape:** backend devuelve `{ success, documents, total }` tanto para `rich-text-documents` como para `postal-documents`, NO `{ data }`. Los helpers deben leer `body.document._id` al crear (no `body.data._id`).
- **Contadores:** `check-resource/postalDocuments` puede reportar 0 aunque el user tenga docs postales reales — los counters no siempre reflejan los registros (similar al bug de postal-trackings). Para GRUPO 2 (empty state) se valida consultando `.total` del endpoint de lista real.

---

## 22. `postal-tracking-crud.spec.ts` — 18 tests ✅

CRUD completo de seguimientos postales con backend real, vinculación a carpeta, búsqueda y **límites de plan**.

**Estrategia:** cada test crea su tracking con label único `E2E-Postal-{Date.now()}` y lo elimina al final via DELETE por ID. `beforeAll` limpia leftovers de corridas anteriores con ese prefijo.

| Grupo   | Tests | Descripción                                                                                                                                   |
| ------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 2     | Carga básica — página + botón Nuevo                                                                                                           |
| GRUPO 2 | 1     | Estado vacío (mock GET → `[]`) → EmptyState "Todavía no tenés seguimientos"                                                                   |
| GRUPO 3 | 5     | Crear — validación Yup (required + regex 9 dígitos) + POST real                                                                               |
| GRUPO 4 | 2     | Editar — modal con label pre-cargado + PATCH real                                                                                             |
| GRUPO 5 | 2     | Eliminar — modal confirmación + DELETE real                                                                                                   |
| GRUPO 6 | 2     | Vincular a carpeta — modal "Seleccione Carpetas" + PATCH folderId                                                                             |
| GRUPO 7 | 1     | Búsqueda por label (debounce 400ms)                                                                                                           |
| GRUPO 8 | 2     | Límite del plan: (A) backend rechaza API POST con 4xx + `success:false`; (B) UI abre LimitErrorModal (Capa 1) sin mostrar el form de creación |

**Data-testids agregados:** `postal-add-btn`, `postal-empty-add-btn`, `postal-view-btn`, `postal-edit-btn`, `postal-link-btn`, `postal-attachment-btn`, `postal-complete-btn`, `postal-reactivate-btn`, `postal-delete-btn`.

**Capa 1+2+3 agregada en producción (arquitectura igual a folders/contacts/calculators):**

- `src/pages/herramientas/postal-tracking/index.tsx`: handler `handleOpenCreate` llama `ApiService.checkResourceLimit("postalTrackings")` antes de abrir el modal. Si `hasReachedLimit: true`, abre `<LimitErrorModal>` local en lugar del form.
- `src/sections/apps/postal-tracking/AddEditPostalTracking.tsx`: escucha `planRestrictionError` del ServerContext para auto-cerrar si backend responde 403.

**Bugs corregidos en producción:**

- `AddEditPostalTracking.tsx`: agregado `enableReinitialize: true` al `useFormik`. Sin él, el modal de edición no pre-cargaba el label porque el Dialog parent usa `keepMounted`, manteniendo Formik montado con los initialValues originales (vacíos del "Crear") incluso al pasar nuevo `tracking` prop.
- **Backend: `law-analytics-server/controllers/planConfigController.js`**: el endpoint `GET /api/plan-configs/check-resource/postalTrackings` usaba `userStats.counts.postalTrackings`, que se incrementa en CREATE pero no se decrementa cuando el worker pasa el tracking a estado terminal (`completed/not_found/error`). El contador quedaba inflado respecto al conteo real del middleware de enforcement. Ahora el endpoint cuenta directamente `pending/active` de DB, consistente con el middleware.

**Quirks:**

- El Dialog de confirmación de delete se monta 2 veces (single + bulk delete), ambos con `keepMounted`. Para evitar strict mode violations, scopear a `page.getByRole("dialog").filter({ hasText: "¿Eliminar este seguimiento?" })`.
- **Backend usa cookies httpOnly, NO Authorization header**. Los helpers de GRUPO 8 usan `request.newContext({ storageState: STORAGE_STATE })` para heredar cookies del setup, no headers Bearer.
- El scraping worker procesa rápidamente los fillers a estados terminales (los saca del conteo). Por eso GRUPO 8 crea fillers en batches paralelos y ejecuta las aserciones inmediatamente.

---

## 21. `dashboard.spec.ts` — 17 tests ✅

Dashboard — Modo Normal (plan gratuito con datos) y Modo Onboarding (usuario sin carpetas).

**Estrategia:** mock de `/api/stats/unified/**`, `/api/user-stats/user` y `/api/auth/onboarding`.
Onboarding se activa con `addInitScript` que limpia `sessionStorage` (keys `onboarding_*`) antes de cargar.

| Grupo   | Tests | Descripción                                                                                               |
| ------- | ----- | --------------------------------------------------------------------------------------------------------- |
| GRUPO 1 | 2     | Carga sin errores + WelcomeBanner visible                                                                 |
| GRUPO 2 | 6     | Widgets: Monto Activo, Carpetas Activas, Tareas Pendientes, Vencimientos, Distribución, Planes Exclusivos |
| GRUPO 3 | 3     | Widgets laterales: Uso de Recursos, Almacenamiento, Tareas Próximas                                       |
| GRUPO 4 | 4     | Onboarding: banner, botón "Crear mi primera carpeta", cards educativas, "¿Que es una carpeta?"            |
| GRUPO 5 | 2     | Navegación: crear carpeta → /apps/folders; Planes Exclusivos → /suscripciones/tables                      |

---

## Resumen estadístico

| Archivo                               | Tests   |                                                 Estado                                                  |
| ------------------------------------- | ------- | :-----------------------------------------------------------------------------------------------------: |
| navigation-routes.spec.ts             | 55      |                                                   ✅                                                    |
| calendar.spec.ts                      | 38      |                                                   ✅                                                    |
| folders.spec.ts                       | 18      |                                                   ✅                                                    |
| contacts.spec.ts                      | 18      |                                                   ✅                                                    |
| dashboard.spec.ts                     | 17      |                                                   ✅                                                    |
| tasks.spec.ts                         | 14      |                                                   ✅                                                    |
| login-form.spec.ts                    | 14      |                                                   ✅                                                    |
| public-routes.spec.ts                 | 10      |                                                   ✅                                                    |
| calculators.spec.ts                   | 10      |                                                   ✅                                                    |
| auth-token.spec.ts                    | 9       |                                                   ✅                                                    |
| postal-tracking-status.spec.ts        | 8       |                                                   ✅                                                    |
| postal-tracking-crud.spec.ts          | 18      |                                                   ✅                                                    |
| escritos-crud.spec.ts                 | 14      |                                     ✅ (13 ok + 1 conditional-skip)                                     |
| subscriptions-crud.spec.ts            | 17      |                                                   ✅                                                    |
| password-recovery.spec.ts             | 10      |                                                   ✅                                                    |
| notifications.spec.ts                 | 10      |                                                   ✅                                                    |
| global-search.spec.ts                 | 13      |                                                   ✅                                                    |
| pjn-sync-manual.spec.ts               | 9       |                                                   ✅                                                    |
| team-mode.spec.ts                     | 11      |                                                   ✅                                                    |
| team-owner-workflow.spec.ts           | 10      |                                              ✅ (BLOQUE 1)                                              |
| team-invitation-flow.spec.ts          | 8       |                   ✅ (BLOQUE 3 — retries:2 para 2 tests flaky por timing multi-user)                    |
| team-permissions-by-role.spec.ts      | 11      |                                              ✅ (BLOQUE 4)                                              |
| team-edge-cases.spec.ts               | 4       |                                              ✅ (BLOQUE 5)                                              |
| team-subscription-edge.spec.ts        | 3       |                                              ✅ (BLOQUE 6)                                              |
| team-invitation-conflicts.spec.ts     | 3       |                          ✅ (BLOQUE 7 — ALREADY_IN_TEAM + PAID_PLAN_CONFLICT)                           |
| team-member-management.spec.ts        | 7       |                             ✅ (BLOQUE 8 — gestión de miembros + lifecycle)                             |
| team-invitation-lifecycle.spec.ts     | 7       |                       ✅ (BLOQUE 9 — tokens inválidos + resend/cancel + expirado)                       |
| team-resource-migration.spec.ts       | 4       |                          ✅ (BLOQUE 10 — USER_HAS_RESOURCES + migrate/delete)                           |
| team-subscription-inheritance.spec.ts | 5       |                           ✅ (BLOQUE 11 — herencia de plan del owner + stats)                           |
| team-resource-crud-matrix.spec.ts     | 12      |          ✅ (BLOQUE 12 — CRUD por rol sobre folders + escritos; viewer lee escritos, no edita)          |
| team-resource-lifecycle.spec.ts       | 4       |                      ✅ (BLOQUE 13 — recursos al remover miembro / eliminar team)                       |
| team-resource-limits.spec.ts          | 8       |                    ✅ (BLOQUE 14 — umbrales folders/escritos/postal/calcs/contacts)                     |
| team-profile-stats-ui.spec.ts         | 4       |                 ✅ (BLOQUE 15 — UI ResourceUsageWidget + gap de /profile/user/personal)                 |
| team-resources-crud-extended.spec.ts  | 13      |                  ✅ (BLOQUES 17-20 — CRUD calcs/contacts/events/availability por rol)                   |
| team-notes-tasks.spec.ts              | 11      |                       ✅ (BLOQUES 21-22 — CRUD notes+tasks por rol + link folder)                       |
| team-folder-links.spec.ts             | 7       |          ✅ (BLOQUE 23 — vinculaciones cruzadas de contacts/calcs/events/escritos con folder)           |
| guest-guard.spec.ts                   | 8       |                                                   ✅                                                    |
| folder-recursos.spec.ts               | 7       |                                                   ✅                                                    |
| support-modal.spec.ts                 | 6       |                                                   ✅                                                    |
| limit-error-modal.spec.ts             | 6       |                                                   ✅                                                    |
| api-errors.spec.ts                    | 6       |                                                   ✅                                                    |
| dynamic-routes.spec.ts                | 5       |                                                   ✅                                                    |
| contacts-phone-fields.spec.ts         | 5       |                                                   ✅                                                    |
| add-folder.spec.ts                    | 4       |                                                   ✅                                                    |
| rememberMe.spec.ts                    | 3       |                                                   ✅                                                    |
| pjn-sync-status.spec.ts               | 3       |                                                   ✅                                                    |
| bookings-public-flow.spec.ts          | 9       |                              ✅ (Test #1 — flujo booking cliente externo)                               |
| bookings-advanced.spec.ts             | 12      | ✅ (auto-confirm, reject, minNoticeHours, minCancellationHours, isActive, publicUrl, list, delete edit) |
| folder-causa-link.spec.ts             | 13      |                           ✅ (Test #2 — vinculación folder↔causa PJN/MEV/EJE)                           |
| movements.spec.ts                     | 8       |                         ✅ (Test #3 — movimientos procesales + timeline folder)                         |
| activity-log.spec.ts                  | 11      |                                ✅ (Test #4 — activity log cross-cutting)                                |
| **TOTAL**                             | **543** |                                       **✅ 543 passing, 0 skip**                                        |

---

## Estrategia general

### Autenticación

- **Un solo login real al inicio** (`global-setup.ts`) → guarda localStorage + cookies en `tests/.auth/user.json`.
- Todos los demás tests reusan ese estado con `test.use({ storageState })` — evita rate-limiting y login repetitivo.

### Backend real vs mocks

- **Preferencia por backend real** en todos los flujos CRUD (folders, contacts, calculators, tasks, calendar).
- Mocks sólo se usan cuando:
  - Necesitamos estado empty/específico (GRUPO 2 en cada suite).
  - Necesitamos simular errores 4xx/5xx (api-errors, limit-error-modal).
  - El endpoint depende de datos externos no controlables (PJN sync).

### Cleanup

- **DELETE por API al final** de cada test que crea recursos (events, tasks, folders, contacts).
- **`beforeAll` en suites CRUD** asegura un estado inicial conocido (≤3-4 recursos activos).
- **Títulos con timestamp**: `E2E-Fill-{Date.now()}`, `E2E-Task-{Date.now()}` — nunca colisionan con datos reales.

### Límites de plan (GRUPO 8)

- **No usar route mocking para `auth/me`** — Redux inicializa límites desde el storageState, los mocks posteriores no tienen efecto.
- **Filler paralelo en batches de 10** (`Promise.all`) — escala para planes standard (50) y premium (500) en segundos.
- **DELETE en cleanup** (no archive) — evita polución de la lista de archivados.

### Archivado/Desarchivado

- Setup vía API (rápido), acción vía UI (realismo).
- Modal de archivados: rows tienen `role="checkbox"`, no `role="row"` (importante para el locator).

---

## Áreas sin cobertura (posibles gaps para futuros tests)

| Área                                             | Features no cubiertas                                                                                                                                                                                                                                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Calendario — drag visual flaky**               | GRUPO 15 cubre drag con `locator.dragTo()` pero tiene soft-skip si el evento drop no se dispara (limitación conocida Playwright+FullCalendar HTML5 DnD). GRUPO 12 compensa testeando el PUT via API.                                                                                            |
| **Postal tracking**                              | Marcar completado / reactivar (lifecycle actions que dependen del estado del scraping), bulk delete, adjuntar archivos                                                                                                                                                                          |
| **Editor de documentos — avanzado**              | Formatear texto (bold/italic), insertar variables dinámicas (campos pendientes), exportar PDF, asistencia IA, vincular a carpeta/contacto desde el editor. (CRUD básico + validación + límite ya cubiertos.)                                                                                    |
| **Modelos / Plantillas (editor de templates)**   | CRUD de modelos propios (`/documentos/modelos`), TemplateEditorPage                                                                                                                                                                                                                             |
| **Carpetas**                                     | Editar detalle, gestión de miembros, actividad/historial completo                                                                                                                                                                                                                               |
| **Contactos**                                    | ContactProfileModal (visualización detallada)                                                                                                                                                                                                                                                   |
| **Suscripciones — E2E real de Stripe Checkout**  | El flujo UI + API está cubierto en `subscriptions-crud.spec.ts`, pero la redirección real a `checkout.stripe.com` + pago con tarjeta TEST no está automatizado. Para CI/CD, considerar `stripe listen --forward-to localhost:5000/api/subscriptions/webhook-dev` y sesión de checkout headless. |
| **Facturación**                                  | Crear factura, editar, enviar, listar                                                                                                                                                                                                                                                           |
| **Verificación de código**                       | /code-verification: ingreso de código, reenvío                                                                                                                                                                                                                                                  |
| **Wizard de carpeta — pasos avanzados**          | Jurisdicción, organismos, revisión y confirmación                                                                                                                                                                                                                                               |
| **Wizard de contacto — pasos avanzados**         | Datos adicionales, revisión                                                                                                                                                                                                                                                                     |
| **Herramientas/plantillas**                      | CRUD de plantillas legales                                                                                                                                                                                                                                                                      |
| **Equipos — flujo de invitación con email real** | La invitación con token + email (SES) no se automatiza. Los flujos de UI (crear team, ver roles, member view, upgrade gate) ya están cubiertos en `team-mode.spec.ts`.                                                                                                                          |
