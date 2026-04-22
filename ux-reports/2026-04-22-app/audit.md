# UX Audit — Pasada 2 · App auth (top-level)

**Fecha:** 2026-04-22
**Rama:** `ux/audit-2026-04-21`
**Rutas auditadas:** 26 (sin template, sin admin, sin dinámicas)
**Viewports:** desktop (1440×900) · tablet (820×1180) · mobile (390×844)
**Total issues:** 93 (🔴 alta: 19 · 🟡 media: 56 · 🟢 baja: 18)

## Estado: PENDIENTE

Fixes pendientes de aprobación y estrategia de branch.

---

## Resumen ejecutivo

Pasada 2 descubrió **casi el doble de issues** que el audit inicial de las 5 rutas principales. Tres macro-problemas:

### 1. Los "tabs hermanos" del perfil están en estado inconsistente
- `account/password` está **100% en inglés**, usa `autoComplete` no estándar, y su `onSubmit` no llama a ningún servicio real (muestra "éxito" siempre). Es una cáscara vacía.
- `account/role` se llama "Roles" pero su contenido es 100% gestión de equipos — mismatch semántico grave.
- `account/settings` es en realidad "Suscripción" (path + label + componente divergen).
- `user/password`, `user/professional`, `user/settings`, `user/payment`: ninguno usa `useFormWithSnackbar` aún (P-S4 solo se aplicó en Personal), y **todos los botones "Cancelar" están sin `onClick`**. El patrón de snackbar del hook Batch 1 está a medio distribuir.

### 2. Pantallas que no deberían renderizar / renderizan mal
- `/apps/calendar/booking-config` → **pantalla en blanco total** en todos los viewports (BC1, posible crash o loading infinito).
- `/apps/calendar/availability` → screenshots muestran estado 404 porque el componente comparte archivo con reservations y el query `?id=` inválido dispara el branch de error.
- `/apps/calc` (índice) → siempre en skeleton, nunca con datos (CA1, sugiere bug de fetch o config de test).
- `/dashboard/analytics` → modal + overlay bloquean todo el contenido en plan free (DA1) — el usuario no puede siquiera ver el preview de la feature antes de decidir pagar.

### 3. Timezone y datos hardcodeados críticos
- `/apps/calendar/availability`: **timezone fijo en `America/Mexico_City`** (AV1). La app es argentina — slots calculados con offset de −1 h incorrecto.
- `/apps/profiles/user/payment`: nombres "Selena Litten", "Stebin Ben" y números de tarjeta ficticios visibles en producción (UP1).
- `/suscripciones/tables`: `console.log` de datos de suscripción activos en producción (ST4).
- Typo: `/apps/calc/intereses` muestra tab "Cáculo Intereses" (falta una L, CI1).

### Patrones sistémicos grandes detectados

Muchos issues se agrupan en patrones que, si se resuelven sistémicamente, cubren ~30 issues individuales:

- **Tabs de perfil sin snackbar ni `useFormWithSnackbar`** — se extiende el hook P-S4 a UW, UR, UT, UP, AP
- **Botones "Cancelar" muertos** — pattern repeat en UW3, UR3, UT2 (y probablemente otros)
- **Tablas sin vista mobile** — HP1, DX1, y el patrón P-S1 del audit anterior debería migrarlas
- **i18n inconsistente dentro de app logueada** — CH2, CH3, AP1 (todo account/TabPassword en inglés)
- **Duplicidad de rutas** — HL1: `/herramientas/plantillas` y `/documentos/modelos` son el mismo componente

---

## Top 15 críticos

1. **[BC1]** `/apps/calendar/booking-config` → pantalla en blanco total, posible crash silencioso.
2. **[AV1]** Calendar availability → timezone hardcodeado `America/Mexico_City` (debería ser Argentina).
3. **[AP1]** Account/password → todo en inglés ("Change Password", "Old Password", "Update Profile", etc.).
4. **[AP2]** Account/password → onSubmit fake, nunca llama al servicio real — muestra éxito siempre.
5. **[DA1]** Dashboard/analytics → modal + overlay tapan todo el contenido en plan free, sin preview posible.
6. **[RE1]** Calendar/reservations → LimitErrorModal bloquea toda la pantalla al entrar; no permite explorar.
7. **[UW1]** User/password → submit exitoso sin feedback (resetForm silencioso).
8. **[AM1]** Account → la tab "password" no existe en el router real (auditábamos una ruta fantasma).
9. **[AM2]** Account/my-account → switch "Navegación segura (HTTPS)" fantasma que no hace nada.
10. **[DX1]** Apps/documents → tabla sin scroll horizontal ni vista mobile, columnas clave cortadas.
11. **[HP1]** Herramientas/seguimiento-postal → tabla 8 columnas ilegible en mobile (cortada).
12. **[HL1]** `/herramientas/plantillas` y `/documentos/modelos` renderizan el mismo componente sin redirect.
13. **[CH1]** Chat sin sidebar en tablet/mobile — usuario entra y ve pantalla vacía sin explicación.
14. **[CH2]** Chat empty state inexistente; input con placeholder "Your Message..." en inglés.
15. **[DA2]** Dashboard/analytics → skeleton con 12 items apilados verticalmente en mobile (~2500px de scroll ciego).

---

## Checklist de implementación

### 🔴 Alta prioridad (19)

- [ ] **[DA1]** Dashboard analytics — modal + overlay tapan todo en free, sin preview
- [ ] **[DA2]** Dashboard analytics — skeleton con 12 items apilados en mobile
- [ ] **[CH1]** Chat — sin sidebar en tablet/mobile, pantalla vacía inicial
- [ ] **[CH2]** Chat — empty state inexistente, placeholder "Your Message..." inglés
- [ ] **[DX1]** Apps/documents — tabla sin scroll ni vista mobile
- [ ] **[CL1]** Calc laboral — labels truncados en desktop/tablet ("Fecha de ingre...", "Aplicar Ley 27....")
- [ ] **[CC1]** Calc civil — labels truncados (dos campos "Probabilidad d..." indistinguibles)
- [ ] **[AV1]** Calendar availability — timezone hardcodeado `America/Mexico_City`
- [ ] **[AV2]** Calendar availability — Sliders sin input numérico en mobile
- [ ] **[RE1]** Calendar reservations — modal upgrade bloquea pantalla al entrar
- [ ] **[BC1]** Calendar booking-config — pantalla en blanco total (posible crash)
- [ ] **[BC2]** Calendar booking-config — título "Configuración de Citas" sin diferenciar crear vs editar
- [ ] **[UW1]** User/password — submit sin snackbar (silencioso)
- [ ] **[AM1]** Account/password → ruta fantasma (tab no existe)
- [ ] **[AM2]** Account/my-account — switch HTTPS que no hace nada
- [ ] **[AP1]** Account/password — 100% en inglés (Change Password, Old Password, etc.)
- [ ] **[AP2]** Account/password — onSubmit fake, no llama servicio real
- [ ] **[HP1]** Seguimiento postal — tabla ilegible en mobile (8 columnas)
- [ ] **[HL1]** Plantillas legacy / modelos — duplicidad de ruta sin redirect

### 🟡 Media prioridad (56)

**Dashboard analytics + Chat + Ayuda + Documents:**
- [ ] **[DA3]** Exportar reporte en free — disabled sin feedback, ícono Lock rompe jerarquía
- [ ] **[DA4]** Chip "Viendo histórico" sin onDelete ni contraste suficiente
- [ ] **[CH3]** Chat — textos en inglés (Archive/Muted/Delete, Messages, Search, Active ago)
- [ ] **[AY1]** Ayuda — menú lateral oculto en mobile sin indicación
- [ ] **[AY2]** Ayuda — sección "Recursos Adicionales" placeholder ("Próximamente...")
- [ ] **[DX2]** Documents — colores de acciones inconsistentes (3 íconos primary en misma fila)
- [ ] **[DX3]** Documents — paginación mobile desborda en una sola línea

**Calculators:**
- [ ] **[CA1]** Calc all — captura siempre muestra skeleton (sin datos)
- [ ] **[CA2]** Calc all — scroll horizontal mobile sin indicador visual
- [ ] **[CA3]** Calc all — ícono `Archive` para dos acciones distintas
- [ ] **[CL2]** Calc labor — tab "Guardados" fuera del viewport mobile sin scroll indicator
- [ ] **[CL3]** Calc labor — checkboxes sin FormControlLabel, touch target 20px
- [ ] **[CL4]** Calc labor — stepper custom sin numeración ni completed state
- [ ] **[CC2]** Calc civil — InfoCircle sin onClick handler (botón inoperativo)
- [ ] **[CC3]** Calc civil — tabs "Vuoto" y "Mendez" mismo componente sin diferenciación
- [ ] **[CI1]** Calc intereses — typo "Cáculo Intereses"
- [ ] **[CI2]** Calc intereses — Capital disabled sin feedback prominente
- [ ] **[CI3]** Calc intereses — checkbox "Capitalizar" sin contexto legal (art. 770 CCyCN)

**Calendar variants + Subscription states:**
- [ ] **[AV3]** Calendar availability — link de citas solo visible si `availabilityId`; redirect auto oculta
- [ ] **[AV4]** Calendar availability — checkboxes disabled mezclan semántica editable/no editable
- [ ] **[RE2]** Calendar reservations — doble superficie de acción (botones inline + menú)
- [ ] **[RE3]** Calendar reservations — sin feedback de combinación de filtros activa
- [ ] **[BC3]** Calendar booking-config — tras guardar, redirect sin confirmar qué se creó
- [ ] **[SS1]** Subscription success — Chip muestra plan viejo mientras `userStats` no actualiza
- [ ] **[SS2]** Subscription success — countdown 10s no cancelable
- [ ] **[SE1]** Subscription error — ícono sin Avatar, visualmente inconsistente con success
- [ ] **[SE2]** Subscription error — snackbar se superpone con CTA en mobile

**Profile user tabs:**
- [ ] **[UP1]** User/payment — datos hardcodeados "Selena Litten"/"Stebin Ben"
- [ ] **[UP2]** User/payment — sin validación Luhn ni detección de red
- [ ] **[UP3]** User/payment — sin autocomplete cc-* ni useFormWithSnackbar
- [ ] **[UW2]** User/password — strength indicator estático sin barra de progreso
- [ ] **[UW3]** User/password — botón Cancelar sin onClick
- [ ] **[UR1]** User/professional — submit sin snackbar (no usa useFormWithSnackbar)
- [ ] **[UR2]** User/professional — Autocomplete "Agregar colegio" sin InputLabel
- [ ] **[UT1]** User/settings — acordeones colapsados por defecto, estado oculto
- [ ] **[UT2]** User/settings — botón Cancelar sin onClick

**Profile account tabs:**
- [ ] **[AM3]** Account/my-account — sesiones activas con botón cerrar sin variant (poco distinguible)
- [ ] **[AM4]** Account/my-account — formulario desactivar cuenta sin autoComplete="current-password"
- [ ] **[AP3]** Account/password — duplicidad funcional con user/TabPassword
- [ ] **[AP4]** Account/password — autoComplete no estándar ("password-old", "password-password")
- [ ] **[AR1]** Account/role — tab "Roles" pero contenido 100% gestión de equipos (mismatch)
- [ ] **[AR2]** Account/role — Alert "plan no incluye equipos" con severity=info (debería warning)
- [ ] **[AS1]** Account/subscription — tabla historial facturación no responsive mobile
- [ ] **[AS2]** Account/subscription — íconos con letras sueltas "P/F/D" en lugar de íconos reales
- [ ] **[AS3]** Account/subscription — nombre ruta "settings" no coincide con tab "Suscripción"
- [ ] **[AJ1]** Account/pjn — estado de conexión no visible antes de interactuar
- [ ] **[AJ2]** Account/pjn — CUIL sin inputMode, autocomplete, máscara ni validación
- [ ] **[AJ3]** Account/pjn — toggle sync intervinientes sin explicar impacto (deduplicación, volumen)

**Tools + Modelos + Suscripciones:**
- [ ] **[HP2]** Seguimiento postal — "Último chequeo" no ordenable
- [ ] **[HP3]** Seguimiento postal — stack de 7 IconButtons en tablet <44px touch
- [ ] **[HL2]** Plantillas — botón "Solicitar Modelo" cortado en mobile
- [ ] **[DM1]** Modelos — título MainCard duplica h1
- [ ] **[DM2]** Modelos — tab "Mis Modelos" sin badge de conteo
- [ ] **[ST1]** Suscripciones — toggle anual/mensual `disabled` fantasma
- [ ] **[ST2]** Suscripciones — plan actual no distinguido visualmente del upgrade
- [ ] **[ST3]** Suscripciones — mobile scroll de ~2800px sin vista compacta de comparación

### 🟢 Baja prioridad (18)

- [ ] **[CH4]** Chat — IconButtons sin aria-label
- [ ] **[AY3]** Ayuda — cards sin estado activo cuando expandidas
- [ ] **[CA4]** Calc all — sidebar muestra "Civil" sin chip "Próximamente"
- [ ] **[CC4]** Calc civil — campos % sin helperText de rango (0-100)
- [ ] **[CI4]** Calc intereses — NumberField sin inputMode (no activa teclado numérico mobile)
- [ ] **[RE4]** Calendar reservations — hora en formato 12h vs TimePicker en 24h
- [ ] **[SS3]** Subscription success — "Cargando características..." como item de lista real
- [ ] **[SE3]** Subscription error — `theme.palette.grey[50/300]` en lugar de semantic tokens
- [ ] **[UP4]** User/payment — botón "Cancel" sin onClick
- [ ] **[UR3]** User/professional — botón Cancelar sin onClick
- [ ] **[UR4]** User/professional — labels read-only en color primary (parecen links)
- [ ] **[UT3]** User/settings — snackbar local dead code (duplica con openSnackbar del store)
- [ ] **[AM5]** Account/my-account — lista timezones con solo 11 zonas (faltan muchas ar)
- [ ] **[AR3]** Account/role — "Danger Zone" eliminar equipo con ícono Logout (debería Trash)
- [ ] **[HP4]** Seguimiento postal — título card duplica h1
- [ ] **[DM3]** Modelos — card "Solicitar nuevo" sin role="button" ni tabIndex
- [ ] **[ST4]** Suscripciones — console.log con datos de suscripción en producción

### Patrones sistémicos (recomendados)

- [ ] **[P-APP-1]** **Distribuir `useFormWithSnackbar`** a user/password, user/professional, user/payment, account/password (consolidado con user/password). Cubre UW1, UR1, UP3, AP2 parcial.
- [ ] **[P-APP-2]** **Arreglar los botones "Cancelar" muertos** en 4+ tabs de perfil con `resetForm()` del render-prop de Formik. Cubre UW3, UR3, UT2, UP4.
- [ ] **[P-APP-3]** **Consolidar duplicidades**: redirect `/herramientas/plantillas` → `/documentos/modelos`; eliminar `account/TabPassword` o redirect a `user/TabPassword`. Cubre HL1, AP3.
- [ ] **[P-APP-4]** **Traducir strings al español**: chat (Your Message, Archive/Muted/Delete, Messages, Search, Active ago), account/password (todo). Cubre CH3, CH2 parcial, AP1.
- [ ] **[P-APP-5]** **Aplicar ResponsiveTable (del Batch 1 P-S1)** a documents y seguimiento-postal. Cubre DX1, HP1.
- [ ] **[P-APP-6]** **Corregir autocomplete attrs** en forms de perfil: cc-* en payment, current-password/new-password donde aplique. Cubre UP3, AM4, AP4.
- [ ] **[P-APP-7]** **Timezone correcto en availability**: usar `dayjs.tz.guess()` o `America/Argentina/Buenos_Aires` como fallback. Corrige AV1.
- [ ] **[P-APP-8]** **NumberField con inputMode**: aplicar `inputMode="decimal"` global al componente `NumberField`. Cubre CI4 + todos los futuros campos numéricos del ecosistema.

---

## Issues por ruta (referencia rápida)

> Los detalles completos (file, viewport, descripción, propuesta) están en los reportes por grupo del audit.

### Dashboard + Chat + Ayuda + Docs (14)
- `/dashboard/analytics`: 🔴 DA1 modal blocks · 🔴 DA2 skeleton · 🟡 DA3 export disabled · 🟡 DA4 chip histórico
- `/apps/chat`: 🔴 CH1 sin sidebar mobile · 🔴 CH2 empty state + "Your Message" · 🟡 CH3 textos inglés · 🟢 CH4 aria-labels
- `/ayuda`: 🟡 AY1 menú mobile · 🟡 AY2 placeholder sección · 🟢 AY3 cards sin estado activo
- `/apps/documents`: 🔴 DX1 tabla mobile · 🟡 DX2 colores · 🟡 DX3 paginación

### Calculadoras (16)
- `/apps/calc`: 🟡 CA1 siempre skeleton · 🟡 CA2 scroll sin indicador · 🟡 CA3 Archive duplicado · 🟢 CA4 civil sidebar
- `/apps/calc/labor`: 🔴 CL1 labels truncados · 🟡 CL2 tab Guardados mobile · 🟡 CL3 checkboxes touch · 🟡 CL4 stepper custom
- `/apps/calc/civil`: 🔴 CC1 labels truncados · 🟡 CC2 InfoCircle inoperativo · 🟡 CC3 Vuoto/Mendez igual · 🟢 CC4 rango %
- `/apps/calc/intereses`: 🟡 CI1 typo Cáculo · 🟡 CI2 capital disabled · 🟡 CI3 capitalizar sin contexto · 🟢 CI4 inputMode

### Calendar variants + Subscription (17)
- `/apps/calendar/availability`: 🔴 AV1 tz México · 🔴 AV2 sliders sin input · 🟡 AV3 link oculto · 🟡 AV4 checkboxes
- `/apps/calendar/reservations`: 🔴 RE1 modal blocks · 🟡 RE2 doble acción · 🟡 RE3 sin chips filtros · 🟢 RE4 hora 12h/24h
- `/apps/calendar/booking-config`: 🔴 BC1 pantalla blanco · 🔴 BC2 título genérico · 🟡 BC3 redirect sin confirm
- `/apps/subscription/success`: 🟡 SS1 chip plan viejo · 🟡 SS2 countdown no cancelable · 🟢 SS3 "Cargando..." como item
- `/apps/subscription/error`: 🟡 SE1 ícono sin Avatar · 🟡 SE2 snackbar superpone CTA · 🟢 SE3 grey literales

### Profile user tabs (14)
- `/apps/profiles/user/payment`: 🟡 UP1 datos mock · 🟡 UP2 sin Luhn · 🟡 UP3 sin autocomplete/snackbar · 🟢 UP4 cancel sin onClick
- `/apps/profiles/user/password`: 🔴 UW1 sin feedback · 🟡 UW2 strength estático · 🟡 UW3 cancel sin onClick
- `/apps/profiles/user/professional`: 🟡 UR1 sin snackbar · 🟡 UR2 autocomplete sin label · 🟢 UR3 cancel · 🟢 UR4 labels color primary
- `/apps/profiles/user/settings`: 🟡 UT1 acordeón colapsado · 🟡 UT2 cancel sin onClick · 🟢 UT3 snackbar dead code

### Profile account tabs (19)
- `/apps/profiles/account/my-account`: 🔴 AM1 ruta fantasma · 🔴 AM2 HTTPS fantasma · 🟡 AM3 sesiones · 🟡 AM4 autocomplete · 🟢 AM5 timezones
- `/apps/profiles/account/password`: 🔴 AP1 todo inglés · 🔴 AP2 onSubmit fake · 🟡 AP3 duplicidad · 🟡 AP4 autocomplete
- `/apps/profiles/account/role`: 🟡 AR1 mismatch nombre · 🟡 AR2 severity=info · 🟢 AR3 ícono Logout
- `/apps/profiles/account/settings`: 🟡 AS1 tabla mobile · 🟡 AS2 letras sueltas P/F/D · 🟡 AS3 nombre ruta
- `/apps/profiles/account/pjn`: 🟡 AJ1 estado oculto · 🟡 AJ2 CUIL sin masks · 🟡 AJ3 toggle sin contexto · 🟢 AJ4 servicio vs no-conectado

### Tools + Modelos + Suscripciones (13)
- `/herramientas/seguimiento-postal`: 🔴 HP1 mobile cortado · 🟡 HP2 ordenar · 🟡 HP3 touch targets · 🟢 HP4 título duplicado
- `/herramientas/plantillas` (legacy): 🔴 HL1 duplicidad · 🟡 HL2 botón cortado
- `/documentos/modelos`: 🟡 DM1 h1 duplicado · 🟡 DM2 sin badge · 🟢 DM3 card sin role
- `/suscripciones/tables`: 🟡 ST1 toggle fantasma · 🟡 ST2 plan actual indistinto · 🟡 ST3 scroll mobile · 🟢 ST4 console.log

---

## Siguiente paso

Con las **dos pasadas completadas** (audit inicial 5 rutas + Pasada 1 públicas + Pasada 2 app), el universo de issues está mapeado:

- **Audit inicial (dev logueado 5 rutas)**: 36 issues · **ya implementado** en batches 1-4 sobre `ux/audit-2026-04-21`
- **Pasada 1 (públicas + auth)**: 53 issues · pendiente
- **Pasada 2 (app auth 26 rutas)**: 93 issues · pendiente

**Total pendiente: 146 issues.**

Mi recomendación:

1. **Mergeá el audit inicial a `dev`** (la branch `ux/audit-2026-04-21` tiene los fixes de batches 1-4 funcionando, testeados, con compare.html).
2. **Creá dos branches independientes** para las dos pasadas pendientes:
   - `ux/audit-public-2026-04-22` para Pasada 1
   - `ux/audit-app-2026-04-22` para Pasada 2
3. **Priorizá Pasada 2** antes que Pasada 1 si tu usuario principal es el autenticado. Priorizá Pasada 1 si vas a lanzar una campaña de adquisición pronto.
4. **No intentes atacar los 146 issues.** Elegí los 🔴 críticos (13 + 19 = 32) + 4-5 patrones sistémicos. Eso cubre el 80% del impacto con el 30% del esfuerzo.

---

*Reporte generado por `/ux-audit` — Pasada 2 (app auth top-level, sin template, sin admin, sin dinámicas) · Screenshots en `screenshots/` (no versionados).*
