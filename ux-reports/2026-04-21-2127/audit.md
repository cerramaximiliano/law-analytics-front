# UX Audit — 2026-04-21-2127

**Rama:** `dev`
**Commit base:** `b34f830`
**Rutas auditadas:** 8 (5 activas + 3 del template)
**Viewports:** desktop (1440×900) · tablet (820×1180) · mobile (390×844)
**Total issues accionables:** 36 (🔴 alta: 9 · 🟡 media: 18 · 🟢 baja: 9)

## Estado: COMPLETADO ✓

Implementación en branch `ux/audit-2026-04-21`, 4 commits:

- `7484731` — **Batch 1** · 5 patrones sistémicos (P-S1..P-S5)
- `496c145` — **Batch 2** · 9 issues alta prioridad (D1..E2)
- `866c820` — **Batch 3** · 14 issues media prioridad (D3..E6)
- `a4932d8` — **Batch 4** · 9 issues baja prioridad (D5..E7)

**Pendientes:** rutas del template a eliminar (DEL-1..4) — quedaron fuera de scope del audit por decisión del usuario (PR separada).

Comparación visual antes/después disponible en `compare.html` (4 batches seleccionables).

---

## Cómo usar este reporte

Marcá con `[x]` los issues que querés que implemente en la fase `apply`. Podés hacerlo en la sección **Checklist** de abajo (más rápido) o directamente en cada issue detallado. Después corremos:

```
/ux-audit apply   # (fase 2, pendiente)
```

…y se aplican solo los marcados en un worktree aislado con compare.html.

---

## Rutas del template a eliminar (NO auditar)

Las siguientes rutas existen en `src/routes/MainRoutes.tsx` pero son restos del template base (Mantis/MUI). No son features del producto. **No hay UX que mejorar acá — hay que eliminar el código.**

- [ ] **[DEL-1]** Eliminar ruta `/tasks` (devuelve 404, componente `src/pages/tasks` huérfano)
- [ ] **[DEL-2]** Eliminar ruta `/apps/customer/list` (devuelve 404, componente `src/pages/apps/customer/list` huérfano)
- [ ] **[DEL-3]** Eliminar ruta `/apps/invoice/dashboard` (data mock en inglés + moneda £/$, componente `src/pages/apps/invoice/dashboard` huérfano)
- [ ] **[DEL-4]** (Opcional) Barrido completo de rutas del template — revisar `MainRoutes.tsx` y mapear cualquier otra ruta sin uso real (ej. chat, invoice/*, profiles/account si no aplica, sample-page, price1, etc.)

> Recomendación: tratar esto como una PR separada del resto del audit, enfocada solo en limpieza de template.

---

## Resumen ejecutivo

Sobre las **5 rutas activas** (dashboard, calendar, folders, profile, escritos), los patrones dominantes son:

1. **Mobile es el viewport más débil.** Las tablas de folders y escritos cortan columnas sin scroll ni vista alternativa, el calendar deja títulos de eventos en 3-4 caracteres, y varios touch targets quedan por debajo de 44×44 px.
2. **Íconos de acción sin label** (folders, calendar, escritos) — ni tooltip ni aria-label. Impacto en accesibilidad y usabilidad, sobre todo con el dedo.
3. **Forms sin feedback post-submit** (profile) y con botones disabled sin explicación (folders "Archivar", profile "Guardar").
4. **Pequeñas inconsistencias de copy en español** — palabras sin tildes en el dashboard, mensajes del 404 con `!` en vez de `¡` y Title Case.

No hay problemas estructurales graves en las rutas activas. El producto se ve coherente en desktop; el trabajo mayor está en mobile.

---

## Top 5 críticos

1. **[F1]** Folders — tabla corta columnas clave en mobile (Parte, Fechas, Jurisdicción, Estado) sin scroll ni vista alternativa.
2. **[E1]** Escritos — mismo patrón: tabla cortada en tablet/mobile, acciones inaccesibles.
3. **[C1]** Calendar — en mobile los títulos quedan en 3-4 caracteres ("Pag", "Cum"); no se activa la vista `listWeek`.
4. **[P2]** Profile — date picker de fecha de nacimiento roto (lógica de días hábiles + tres controles apretados en mobile).
5. **[F2]** Folders — toolbar fragmentada en 2 filas con el buscador (acción primaria) desalineado y visualmente secundario.

---

## Checklist de implementación

### 🔴 Alta prioridad (9)

- [x] **[D1]** Dashboard — "Ultima actualizacion" sin tildes
- [x] **[C1]** Calendar — títulos truncados a 3-4 chars en mobile
- [x] **[C2]** Calendar — eventos cortados sin tooltip/ellipsis
- [x] **[F1]** Folders — tabla corta columnas en mobile
- [x] **[F2]** Folders — toolbar fragmentada, primary oculto
- [x] **[P1]** Profile — dos campos "Domicilio" idénticos
- [x] **[P2]** Profile — date picker de nacimiento buggy + apretado en mobile
- [x] **[E1]** Escritos — tabla cortada en tablet/mobile sin scroll
- [x] **[E2]** Escritos — botón "Nuevo Documento" desproporcionado en mobile

### 🟡 Media prioridad (18)

- [x] **[D2]** Dashboard — palabras sin tildes ("Proximos", "guia", "fecha limite")
- [x] **[D3]** Dashboard — cards apretadas en mobile/tablet (overlap sparkline + número)
- [x] **[D4]** Dashboard — columna `lg={3}` derecha con whitespace excesivo
- [x] **[C3]** Calendar — skeleton residual sobre toolbar (GoogleCalendarSync)
- [x] **[C4]** Calendar — touch targets <44×44px en mobile
- [x] **[C5]** Calendar — jerarquía confusa: CTA primario como IconButton
- [x] **[F3]** Folders — badges PJN/BA/CABA sin tooltip ni aria-label
- [x] **[F4]** Folders — botón "Archivar" disabled sin feedback del motivo
- [x] **[F5]** Folders — barra de progreso amarilla sin label descriptiva
- [x] **[F6]** Folders — íconos de acción derecha sin labels
- [x] **[P3]** Profile — sin feedback al usuario tras submit exitoso
- [x] **[P4]** Profile — botón Guardar disabled sin mostrar errores
- [x] **[P5]** Profile — campo email disabled sin explicación
- [x] **[P6]** Profile — "Cargo" como TextField libre (debería ser select)
- [x] **[E3]** Escritos — filtros sin aprovechar ancho en mobile
- [x] **[E4]** Escritos — título del card duplica el breadcrumb
- [x] **[E5]** Escritos — acciones inconsistentes entre filas postales y rich-text
- [x] **[E6]** Escritos — paginación ausente en "Todos los tipos"

### 🟢 Baja prioridad (9)

- [x] **[D5]** Dashboard — timestamp con `fontStyle` inline (usar variante de theme)
- [x] **[D6]** Dashboard — alturas del skeleton no coinciden con contenido real
- [x] **[C6]** Calendar — color de evento hardcodeado (`"#1890ff"`)
- [x] **[C7]** Calendar — nota informativa pintada como error
- [x] **[F7]** Folders — celdas con truncamiento forzado y alturas inconsistentes
- [x] **[F8]** Folders — paginación duplicada con 5 controles para 1 página
- [x] **[P7]** Profile — widget "Uso de Recursos" duplicado dentro de Personal
- [x] **[P8]** Profile — validación contraintuitiva en campo "Nota"
- [x] **[E7]** Escritos — duplicidad de buscadores (topbar global + página)

### Patrones sistémicos (recomendados — resuelven varios issues de golpe)

- [x] **[P-S1]** Crear `<ResponsiveTable>` que switchee a cards en `<sm`; migrar folders + escritos (cubre F1, E1 y evita el patrón en futuras tablas)
- [x] **[P-S2]** Regla ESLint `jsx-a11y/icon-button-has-label` o revisión sistemática de todos los `IconButton` para forzar `Tooltip` + `aria-label` (cubre F3, F6, parcialmente C, E5)
- [x] **[P-S3]** Theme override global de `MuiIconButton-sizeSmall` en mobile con `minWidth: 44, minHeight: 44` (cubre C4, touch targets en F y E)
- [x] **[P-S4]** Hook `useFormWithSnackbar` que centralice feedback de submits (cubre P3 y previene en futuros forms)
- [x] **[P-S5]** Linter de tildes sobre strings en español (pasada única, cubre D1, D2)

---

## Issues por ruta (detalle)

### `/dashboard/default` — Dashboard

Screenshots: `screenshots/dashboard-desktop.png` · `screenshots/dashboard-tablet.png` · `screenshots/dashboard-mobile.png`

#### 🔴 [D1] Texto "Ultima actualizacion" sin tildes
- **Viewport:** all
- **Archivo:** `src/pages/dashboard/default.tsx:365`
- **Descripción:** El timestamp del banner dice "Ultima actualizacion" sin tildes; el resto de la app usa "Última actualización".
- **Propuesta:** Cambiar a `Última actualización:`.

#### 🟡 [D2] Copy del dashboard con varias palabras sin tildes
- **Viewport:** all
- **Archivo:** `src/pages/dashboard/default.tsx:157,321,481,487`
- **Descripción:** "No volveras a ver esta guia de inicio", "Vencimientos Proximos", "En los proximos 7 dias", "fecha limite". Convive con textos correctamente acentuados en el mismo archivo.
- **Propuesta:** Unificar ortografía con tildes.

#### 🟡 [D3] Cards "Vencimientos Próximos" apretadas en mobile y tablet
- **Viewport:** mobile, tablet
- **Archivo:** `src/pages/dashboard/default.tsx:479-496`
- **Descripción:** El mini-chart placeholder "No hay datos suficientes" se superpone con el número `0` y el texto descriptivo.
- **Propuesta:** `minWidth` al texto o esconder sparkline en breakpoints chicos.

#### 🟡 [D4] Tercera columna en desktop con whitespace excesivo
- **Viewport:** desktop
- **Archivo:** `src/pages/dashboard/default.tsx:499-511`
- **Descripción:** La columna `lg={3}` derecha queda angosta con mucho espacio vacío comparada con la columna izquierda `lg={6}`.
- **Propuesta:** Rebalancear a `lg={5}/lg={4}/lg={3}`.

#### 🟢 [D5] Timestamp con estilo inline en vez de variante de theme
- **Viewport:** all
- **Archivo:** `src/pages/dashboard/default.tsx:354-374`
- **Descripción:** `Typography variant="caption"` con `sx` (`fontStyle: "italic"`) y color custom.
- **Propuesta:** Mover a variante del theme o componente `LastUpdatedLabel`.

#### 🟢 [D6] Altura del skeleton no coincide con contenido real
- **Viewport:** all
- **Archivo:** `src/pages/dashboard/default.tsx:246-265`
- **Descripción:** Alturas fijas (180/300/200) no reflejan el layout real; layout shift perceptible.
- **Propuesta:** Alinear dimensiones con el grid final.

---

### `/apps/calendar` — Calendario

Screenshots: `screenshots/calendar-desktop.png` · `screenshots/calendar-tablet.png` · `screenshots/calendar-mobile.png`

#### 🔴 [C1] Títulos de eventos truncados a 3-4 caracteres en mobile
- **Viewport:** mobile
- **Archivo:** `src/pages/apps/calendar/calendar.tsx`
- **Descripción:** En 390px se mantiene `dayGridMonth` y los eventos se recortan a "Pag", "Cum", "Int", "10 VD". El switch a `listWeek` via `matchDownSM` no surge efecto.
- **Propuesta:** Asegurar `initialView: listWeek` bajo `sm` sin depender solo del `useEffect`.

#### 🔴 [C2] Eventos cortados a media palabra sin tooltip ni ellipsis
- **Viewport:** desktop, tablet
- **Archivo:** `src/pages/apps/calendar/calendar.tsx:1194-1239`
- **Descripción:** `E2E-Cal-17766911...`, `Reservation at N...`, `Vence mandamiento A...` cortados. Horas tipo `13:3 Reservation` truncadas.
- **Propuesta:** `eventContent` custom con ellipsis + `<Tooltip title={event.title}>`.

#### 🟡 [C3] Skeleton residual sobre la barra superior
- **Viewport:** all
- **Archivo:** `src/pages/apps/calendar/calendar.tsx:1101` (`GoogleCalendarSync`)
- **Descripción:** Barra gris con círculo y píldora parece un `Skeleton` permanente encima de los controles.
- **Propuesta:** Mostrar el CTA real ("Conectar con Google Calendar") cuando no está sincronizado.

#### 🟡 [C4] Touch targets por debajo de 44×44px en mobile
- **Viewport:** mobile
- **Archivo:** `src/pages/apps/calendar/calendar.tsx:1120-1188`
- **Descripción:** `IconButton size="small"` rinde ~28-34px, por debajo de WCAG 2.5.5.
- **Propuesta:** `size="medium"` en `matchDownSM` o `sx={{ minWidth: 44, minHeight: 44 }}`.

#### 🟡 [C5] Jerarquía de acciones poco clara en la toolbar
- **Viewport:** desktop, tablet
- **Archivo:** `src/pages/apps/calendar/calendar.tsx:1178-1189`
- **Descripción:** "Agregar evento" es un `IconButton +` del mismo peso que navegación; "Guía" usa `color="success"` compitiendo con primary.
- **Propuesta:** `Button variant="contained" startIcon={<Add/>}>Nuevo evento</Button>`; Guía en `color="default"`.

#### 🟢 [C6] Color de evento hardcodeado
- **Viewport:** all
- **Archivo:** `src/pages/apps/calendar/calendar.tsx:278`
- **Descripción:** `backgroundColor: event?.color || "#1890ff"` — hex literal.
- **Propuesta:** `theme.palette.primary.main` como fallback.

#### 🟢 [C7] Nota informativa pintada como error
- **Viewport:** all
- **Archivo:** `src/pages/apps/calendar/calendar.tsx:154`
- **Descripción:** "Sólo se permite vincular un evento a una única carpeta" con `color="error.main"`.
- **Propuesta:** `color="warning.main"` o `textSecondary` con icono `Info`.

---

### `/apps/folders/list` — Listado de Causas

Screenshots: `screenshots/folders-desktop.png` · `screenshots/folders-tablet.png` · `screenshots/folders-mobile.png`

#### 🔴 [F1] Tabla se desborda en mobile y corta columnas clave
- **Viewport:** mobile
- **Archivo:** `src/pages/apps/folders/folders.tsx`
- **Descripción:** "Parte" aparece como "Pa", columnas Fechas/Jurisdicción/Fuero/Estado fuera de vista, sin indicación de scroll ni layout alternativo.
- **Propuesta:** Vista de tarjetas en `<sm` o scroll horizontal visible con columna Carátula sticky.

#### 🔴 [F2] Acciones fragmentadas en 2 filas con jerarquía confusa
- **Viewport:** desktop, tablet
- **Archivo:** `src/pages/apps/folders/folders.tsx`
- **Descripción:** Toolbar separa acciones en una fila y buscador desalineado en otra; la búsqueda queda visualmente secundaria.
- **Propuesta:** Toolbar en una sola fila, buscador a la izquierda, filtros agrupados a la derecha, overflow menu en mobile.

#### 🟡 [F3] Íconos PJN/BA/CABA sin tooltips ni estado accesible
- **Viewport:** all
- **Archivo:** `src/pages/apps/folders/folders.tsx`
- **Descripción:** Tres badges junto al "3/5" sin label ni aria-label; tercero cortado por el borde en mobile.
- **Propuesta:** `Tooltip`, `aria-label`, permitir wrap.

#### 🟡 [F4] Botón "Archivar" disabled sin feedback del motivo
- **Viewport:** all
- **Archivo:** `src/pages/apps/folders/folders.tsx`
- **Descripción:** Aparece disabled sin indicación de que requiere selección previa.
- **Propuesta:** `Tooltip` en disabled ("Seleccioná una carpeta para archivar") o mostrar solo cuando hay selección.

#### 🟡 [F5] Barra de progreso amarilla sin etiqueta descriptiva
- **Viewport:** all
- **Archivo:** `src/pages/apps/folders/folders.tsx`
- **Descripción:** Sin label que explique que es cuota del plan; el amarillo sugiere advertencia cuando aún hay cuota disponible.
- **Propuesta:** Leyenda "Carpetas activas del plan"; `primary` hasta ≤20% restante.

#### 🟡 [F6] Íconos de acción derecha sin labels
- **Viewport:** all
- **Archivo:** `src/pages/apps/folders/folders.tsx`
- **Descripción:** Descarga, filtro y punto verde sin tooltip.
- **Propuesta:** `Tooltip`/`aria-label`; agrupar exportar en dropdown único.

#### 🟢 [F7] Celdas con truncamiento forzado y alturas inconsistentes
- **Viewport:** desktop, tablet
- **Archivo:** `src/pages/apps/folders/folders.tsx`
- **Descripción:** Carátulas largas ocupan 4 líneas, desalineando verticalmente las demás celdas.
- **Propuesta:** `WebkitLineClamp: 2` + Tooltip + `min-width` razonable.

#### 🟢 [F8] Paginación duplicada con 5 controles para 1 página
- **Viewport:** mobile
- **Archivo:** `src/pages/apps/folders/folders.tsx`
- **Descripción:** Para 3 registros: selector de filas + "Ir a" + 5 botones, aunque solo haya 1 página.
- **Propuesta:** Ocultar controles cuando `pageCount <= 1`; colapsar "Ir a".

---

### `/apps/profiles/user/personal` — Perfil (datos personales)

Screenshots: `screenshots/profile-desktop.png` · `screenshots/profile-tablet.png` · `screenshots/profile-mobile.png`

#### 🔴 [P1] Dos campos con el mismo label "Domicilio"
- **Viewport:** all
- **Archivo:** `src/sections/apps/profiles/user/TabPersonal.tsx:389,411`
- **Descripción:** Dos textareas con label idéntico; los placeholders ("principal"/"alternativo") desaparecen al escribir.
- **Propuesta:** Renombrar a "Domicilio principal" y "Domicilio alternativo".

#### 🔴 [P2] Date picker de fecha de nacimiento roto + apretado en mobile
- **Viewport:** all
- **Archivo:** `src/sections/apps/profiles/user/TabPersonal.tsx:239-331`
- **Descripción:** Dos `Select` (día/mes) + `DatePicker` de año; lógica de días hábiles incorrecta (`month % 2 !== 0 && month < 7` no cubre todos los meses de 30/31). En mobile el año queda truncado ("1…"). Sin validación Yup.
- **Propuesta:** Un único `DatePicker` con vista completa + validación Yup (`required`, `maxDate`).

#### 🟡 [P3] Sin feedback al usuario tras submit exitoso
- **Viewport:** all
- **Archivo:** `src/sections/apps/profiles/user/TabPersonal.tsx:141-171`
- **Descripción:** `onSubmit` hace `setStatus({ success: true })` pero no dispara snackbar. "Cancelar" tampoco se deshabilita durante el envío.
- **Propuesta:** `openSnackbar` con éxito/error + disable Cancelar durante `isSubmitting`.

#### 🟡 [P4] Botón Guardar disabled sin mostrar errores
- **Viewport:** all
- **Archivo:** `src/sections/apps/profiles/user/TabPersonal.tsx:527`
- **Descripción:** Condición `Object.keys(errors).filter(...).length !== 0` deja el botón disabled sin exponer los errores hasta blur.
- **Propuesta:** `validateOnMount` para que `errors` refleje el estado real.

#### 🟡 [P5] Correo Electrónico disabled sin explicación
- **Viewport:** all
- **Archivo:** `src/sections/apps/profiles/user/TabPersonal.tsx:222-233`
- **Descripción:** Campo email disabled sin indicar por qué. En mobile el placeholder parece campo vacío.
- **Propuesta:** Mostrar valor real + `helperText` con icono lock.

#### 🟡 [P6] "Cargo" como TextField libre
- **Viewport:** all
- **Archivo:** `src/sections/apps/profiles/user/TabPersonal.tsx:363-373`
- **Descripción:** Valor "Abogado" precargado pero cualquier usuario escribe lo que quiera.
- **Propuesta:** `Select`/`Autocomplete` con catálogo (Abogado, Procurador, Estudio, etc.).

#### 🟢 [P7] Widget "Uso de Recursos" duplicado
- **Viewport:** desktop, tablet
- **Archivo:** `src/sections/apps/profiles/user/TabPersonal.tsx:541`
- **Descripción:** `ResourceUsageWidget` aparece dentro de Personal además del almacenamiento ya visible en la columna izquierda.
- **Propuesta:** Mover a una tab propia ("Uso") o remover de Personal.

#### 🟢 [P8] Nota con validación contraintuitiva
- **Viewport:** all
- **Archivo:** `src/sections/apps/profiles/user/TabPersonal.tsx:139`
- **Descripción:** `note.min(5)` pero el campo no es requerido; usuario que escriba "ok" recibe error inesperado.
- **Propuesta:** `helperText` "Mínimo 5 caracteres" o eliminar validación si es opcional.

---

### `/documentos/escritos` — Escritos

Screenshots: `screenshots/escritos-desktop.png` · `screenshots/escritos-tablet.png` · `screenshots/escritos-mobile.png`

#### 🔴 [E1] Columnas de tabla cortadas sin scroll en tablet/mobile
- **Viewport:** tablet, mobile
- **Archivo:** `src/pages/documentos/escritos/index.tsx`
- **Descripción:** En tablet la columna CARPETA queda truncada y FECHA/ACCIONES desaparecen; en mobile se pierden aún más. Sin overflow horizontal ni vista alternativa — acciones clave inaccesibles.
- **Propuesta:** `sx={{ overflowX: "auto" }}` y/o variante mobile con cards/Stack.

#### 🔴 [E2] Botón "Nuevo Documento" desproporcionado en mobile
- **Viewport:** mobile
- **Archivo:** `src/pages/documentos/escritos/index.tsx:1024-1034`
- **Descripción:** El botón queda debajo del subtítulo ocupando ancho casi completo con dos íconos (start + end).
- **Propuesta:** Layout vertical solo cuando hace wrap, o `SpeedDial`/menu compacto en mobile.

#### 🟡 [E3] Filtros sin aprovechar el ancho en mobile
- **Viewport:** mobile
- **Archivo:** `src/pages/documentos/escritos/index.tsx:1081-1110`
- **Descripción:** Select "Todos los tipos" y botón "Buscar" en líneas separadas, TextField comprimido.
- **Propuesta:** `width: { xs: "100%", sm: "auto" }` + `direction={{ xs: "column", sm: "row" }}`.

#### 🟡 [E4] Título del card duplica el breadcrumb
- **Viewport:** all
- **Archivo:** `src/pages/documentos/escritos/index.tsx:1018-1022`
- **Descripción:** El `h4` "Documentos" dentro del MainCard repite breadcrumb + page title.
- **Propuesta:** Quitar o reemplazar por título más específico.

#### 🟡 [E5] Acciones inconsistentes entre filas postales y rich-text
- **Viewport:** desktop, tablet
- **Archivo:** `src/pages/documentos/escritos/index.tsx:1209-1255`
- **Descripción:** Postales muestran 4 iconos, rich-text muestran 3; ancho de columna ACCIONES varía por fila; tooltip también varía.
- **Propuesta:** Unificar con `MoreVert` + Menu contextual por `kind`, o fijar ancho mínimo.

#### 🟡 [E6] Paginación ausente en "Todos los tipos"
- **Viewport:** all
- **Archivo:** `src/pages/documentos/escritos/index.tsx:1266-1275`
- **Descripción:** Cuando `typeFilter === "all"` se oculta el `Pagination`; el aviso es una caption gris pequeña.
- **Propuesta:** Paginación unificada (fetch combinado backend) o `Alert` accionable "Ver más".

#### 🟢 [E7] Duplicidad de buscadores
- **Viewport:** desktop
- **Archivo:** `src/pages/documentos/escritos/index.tsx` + layout/topbar
- **Descripción:** Topbar con "Ctrl + K" global + buscador de página.
- **Propuesta:** Diferenciar visualmente o consolidar.

---

## Patrones sistémicos

### 🔴 P-S1 · Tablas que no colapsan en mobile
Folders y Escritos cortan columnas clave sin scroll ni vista alternativa.
**Recomendación:** componente `<ResponsiveTable>` que switchee a cards/Stack en `<sm`, y migrar ambas.

### 🟡 P-S2 · Íconos de acción sin tooltip ni aria-label
Folders (badges PJN/BA/CABA, íconos descarga/filtro/estado), Calendar (toolbar), Escritos (columna ACCIONES parcialmente).
**Recomendación:** regla ESLint `jsx-a11y/icon-button-has-label` + revisión sistemática envolviendo todos los `IconButton` en `<Tooltip>` con `aria-label`.

### 🟡 P-S3 · Touch targets <44×44px en mobile
Calendar (toolbar), Folders (paginación), Escritos (acciones inline).
**Recomendación:** theme override global para `MuiIconButton-sizeSmall` forzando min 44×44 en mobile, o `size="medium"` en `matchDownSM`.

### 🟡 P-S4 · Feedback post-submit ausente o débil
Profile (submit sin snackbar), Folders (Archivar disabled sin razón).
**Recomendación:** hook `useFormWithSnackbar` que centralice feedback de Formik submits exitosos/fallidos.

### 🟢 P-S5 · Palabras sin tildes
Dashboard copy ("Proximos", "guia", etc.) + copy del 404 genérico.
**Recomendación:** linter de tildes sobre strings en español (pasada única de limpieza).

---

## Siguiente paso

1. Marcá con `[x]` los issues del checklist que querés que implemente.
2. Decidí si querés correr la limpieza del template (`DEL-1..4`) en una PR separada (recomendado).
3. Corremos la fase `apply` sobre los marcados:
   - Worktree aislado en branch `ux/audit-2026-04-21`.
   - Fixes aplicados.
   - Re-captura de screenshots.
   - `compare.html` con before/after lado a lado.
   - Review vista por vista y merge selectivo.

---

*Reporte generado por `/ux-audit` · Screenshots en `./screenshots/` (no versionados).*
