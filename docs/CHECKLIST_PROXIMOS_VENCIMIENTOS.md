# Checklist de validación — Próximos vencimientos vinculados a movimientos (Capa A + B)

Feature: widget de dashboard + endpoint que listan los próximos eventos
(vencimientos/audiencias) **vinculados a un movimiento judicial** (`Event.movementRef`),
y la capacidad de crear esos vencimientos en todas las jurisdicciones.

- **Capa B** (commits server `285373d`, front `25a3a76`): endpoint `GET /api/events/upcoming` + widget `UpcomingMovementEventsWidget` en el dashboard.
- **Capa A** (commits server `cd43e9e`, front `872c968`): enum `movementSource` ampliado a `["pjn","mev","scba","eje","manual",null]` en Event/Note/Task + acción "Crear vencimiento" en `DocumentExplorer` (visores no-PJN).

Sugerido: validar en **local/dev** primero, deployar al final (paso E).
Auth: el front usa cookie (`axios.defaults.withCredentials = true`). Para curl,
copiar el token del browser: DevTools → consola → `localStorage.getItem("token")`
y enviarlo como `Authorization: Bearer <token>`.

Cuenta de prueba: `artista@mirtaaguilar.art` (plan estándar, con espacio para carpetas nuevas).

---

## A. Capa B — Endpoint `GET /api/events/upcoming`
- [ ] **A1** Sin auth → `401`.
- [ ] **A2** Con auth y sin vencimientos de movimiento → `{ success:true, count:0, events:[] }`.
- [ ] **A3** Tras crear un vencimiento PJN → aparece con `folderName` y ordenado por `start` ascendente.
- [ ] **A4** `?limit=2` → devuelve como máximo 2.
- [ ] **A5** Un evento solo-folder (sin `movementRef`) NO aparece.
- [ ] **A6** Vencimiento all-day de HOY SÍ aparece (valida `since = inicio del día`); evento pasado NO.
- [ ] **A7** Equipo: `?groupId=<equipo>` siendo miembro trae los del equipo; `groupId` ajeno → `403`.

## B. Capa B — Widget del dashboard
- [ ] **B1** El widget "Próximos vencimientos" se renderiza (loading → empty/lista).
- [ ] **B2** Empty state correcto sin datos.
- [ ] **B3** Orden por fecha; chip Vencimiento (rojo) / Audiencia (azul); fecha relativa ("hoy"/"mañana"/"en N días").
- [ ] **B4** "Ver N más" expande el resto.
- [ ] **B5** Click en una fila → navega al folder, abre Actividad; en PJN resalta la fila.
- [ ] **B6** Equipo: el widget muestra los del equipo.

## C. Capa A — Creación de vencimientos no-PJN
Para cada jurisdicción: folder → "Expediente digital" (DocumentExplorer) → seleccionar movimiento → "Crear vencimiento".
- [ ] **C1 (MEV)** crear → aparece en "Vinculados" y en el widget.
- [ ] **C2 (SCBA)** idem — confirma que el enum `scba` no rompe la validación.
- [ ] **C3 (EJE)** idem.
- [ ] **C4 (manual)** idem — guarda `movementSource: "manual"`.
- [ ] **C5** Toggle Audiencia → `type: audiencia`, color azul.
- [ ] **C6** Validaciones: título vacío deshabilita "Crear"; fecha inválida no crea.
- [ ] **C7** El vencimiento aparece también en el calendario del folder y el global.
- [ ] **C8** Regresión: crear nota/tarea sobre movimiento SCBA/EJE ahora funciona sin error.

## D. Regresión (no romper lo existente)
- [ ] **D1** PJN sigue creando vencimientos igual.
- [ ] **D2** Calendario general muestra 5 tipos; desde un movimiento, solo Audiencia/Vencimiento.
- [ ] **D3** Editar un evento de movimiento no pierde `movementRef`/`movementSource`.
- [ ] **D4** `AddEventForm` sin `movementSource` no rompe (omite el campo).

## E. Deploy (tras validar)
- [ ] **E1** Deploy hub (server) → restart limpio + `/api/events/upcoming` responde `401` sin auth en prod.
- [ ] **E2** Deploy front (incluye commits pendientes de Fases 4/5/5b + chip + calendario + tipo-evento).
- [ ] **E3** Smoke test en prod: widget visible + crear un vencimiento real por jurisdicción.

---

## Gaps conocidos (ver memoria project_upcoming_movement_events)
1. Deep-link no-PJN sin highlight: `MovementsTable` no resalta la fila (solo `PjnMovementsViewerSection`).
2. La creación se agregó solo en el panel `DocumentExplorer`, no en el row quick-action de `MovementsTable`.
3. Movimientos sin documento/link podrían no aparecer en `DocumentExplorer`.
