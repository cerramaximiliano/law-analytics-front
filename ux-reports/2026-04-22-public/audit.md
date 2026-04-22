# UX Audit — Pasada 1 · Públicas + Auth

**Fecha:** 2026-04-22
**Rama:** `ux/audit-2026-04-21`
**Rutas auditadas:** 14 (8 públicas + 6 auth)
**Viewports:** desktop (1440×900) · tablet (820×1180) · mobile (390×844)
**Total issues:** 53 (🔴 alta: 13 · 🟡 media: 35 · 🟢 baja: 5)

## Estado: PENDIENTE

Este audit es independiente del anterior (rutas del producto logueado). Los fixes se aplicarán en una branch separada `ux/audit-public-2026-04-22` si el usuario los aprueba, para no mezclarlos con el audit de la app.

---

## Cómo usar este reporte

Marcá con `[x]` los issues que querés que implemente en la fase `apply`. Podés hacerlo en la sección **Checklist** de abajo o en cada issue detallado.

---

## Resumen ejecutivo

Los patrones dominantes son **más preocupantes que en el audit interno**, porque estas son las superficies públicas — primera impresión del producto:

1. **Mezcla de idioma ES/EN en auth.** "Sign In", "Enter password", "Password", "Reset Password", "Olvidé mi Password" — toda la app está en español menos el flujo de auth, que mezcla ambos idiomas dentro de la misma pantalla. Daña credibilidad en la primera conversión.

2. **Flujos de recuperación con estado frágil.** `/reset-password` y `/code-verification` redirigen silenciosamente si faltan parámetros de navegación (state/sessionStorage). Un bookmark, un F5, o un link directo rompen el flujo sin explicación al usuario. **Grave en un flujo de recuperación de cuenta.**

3. **Login con Enter key deshabilitado** (`keyDown` + button `type="button"` + `onSubmit` devuelve false). Viola WCAG 2.1 SC 2.1.1 (Keyboard). El usuario no puede enviar el form con teclado — flujo roto para power users y screen readers.

4. **Páginas legales extensas sin TOC** (privacy-policy, cookies-policy, terms). 12+ secciones en la privacy — el usuario no puede saltar a "Integración con Google Calendar" o "Control de tu información personal" sin scroll largo.

5. **Social proof dudosa en landing.** Rating 4.7/5 hardcodeado sin fuente verificable (Google Reviews, Trustpilot). Testimonios con solo iniciales. "500+ Usuarios" sin verificación.

6. **Forms sin autocomplete attrs correctos.** `autocomplete="email"` en login (debería ser `username`), `forgot-password` sin autocomplete, `register` sin `InputLabel` visible (solo placeholder).

La **landing se ve polished pero con bloques vacíos** entre secciones (posible bug de `FadeInWhenVisible` al capturar). El **register tiene labels que desaparecen al escribir**. **Check-mail no muestra el email destinatario** — el usuario no puede verificar si escribió bien su correo.

---

## Top 10 críticos

1. **[LG1]** Login — Enter key deshabilitado (WCAG violation, flujo roto para teclado).
2. **[RS1]** Reset-password — redirige silenciosamente sin explicación si no hay state previo.
3. **[CV1]** Code-verification — mismo problema de estado dependiente sin fallback.
4. **[CM1]** Check-mail — CTA en inglés ("Sign In") en una app 100% en español.
5. **[CM2]** Check-mail — no muestra email destinatario, dead-end sin reenviar código.
6. **[RG1]** Register — campos de email y password sin `InputLabel` visible (solo placeholder).
7. **[FP2]** Forgot-password — falta `autocomplete="email"` (password managers no asisten).
8. **[LD1]** Landing — secciones intermedias con bloques vacíos visibles (posible bug de lazy-load).
9. **[LD2]** Landing — rating 4.7/5 hardcodeado sin fuente verificable, social proof dudosa.
10. **[UN1]** Unsubscribe — estado de error al acceder sin params es una pantalla casi vacía con mensaje rojo suelto.

---

## Checklist de implementación

### 🔴 Alta prioridad (13)

- [ ] **[LG1]** Login — Enter key deshabilitado; `type="button"` + `onSubmit` devuelve false
- [ ] **[LD1]** Landing — bloques vacíos entre secciones (Combo/Free no renderizan contenido)
- [ ] **[LD2]** Landing — rating + testimonios con social proof hardcodeada sin fuente verificable
- [ ] **[PL1]** Plans — toggle anual/mensual sin mostrar descuento ("Ahorrá 25%")
- [ ] **[FQ1]** FAQ — sin búsqueda por keyword, 20 items solo filtrables por categoría
- [ ] **[PR3]** Privacy-policy — fecha "Última actualización" inconsistente entre privacy (Ago 2025) y otros legales (May 2025)
- [ ] **[UN1]** Unsubscribe — estado de error con acceso directo muestra pantalla casi vacía con mensaje rojo suelto
- [ ] **[RG1]** Register — campos sin `InputLabel` visible, solo placeholder (a11y + inconsistencia con login)
- [ ] **[FP2]** Forgot-password — falta `autocomplete="email"` en el input
- [ ] **[CM1]** Check-mail — CTA "Sign In" en inglés (el resto es español)
- [ ] **[CM2]** Check-mail — no muestra email destinatario, no hay opción de reenviar
- [ ] **[RS1]** Reset-password — redirige a forgot-password sin feedback si no hay state
- [ ] **[CV1]** Code-verification — redirige a register/forgot silenciosamente si no hay state

### 🟡 Media prioridad (35)

- [ ] **[LD3]** Landing — hex hardcoded `#3A7BFF`, `#8A5CFF`, `#6E6E6E` en Header.tsx
- [ ] **[LD4]** Landing — CTA único en hero (sin secundario tipo "Ver planes"/"Ver demo")
- [ ] **[LD5]** Landing — logos EJE/SECLO desde Cloudinary sin fallback local
- [ ] **[PL2]** Plans — plan Premium bloqueado sin lead capture ("Avisame cuando esté disponible")
- [ ] **[PL3]** Plans — features en mobile como wall-of-text sin agrupar por categoría
- [ ] **[GU1]** Guides — header decorativo oculto en mobile/tablet rompe balance
- [ ] **[GU2]** Guides — sin estado leído/completado en cards
- [ ] **[GU3]** Guides — `<Button>` anidado dentro de `<CardActionArea>` (a11y violation)
- [ ] **[GU4]** Guides — grid colapsa a 1 col en mobile con animaciones acumuladas (último item ~1s)
- [ ] **[FQ2]** FAQ — color de chip con hex concatenado (`${color}20`) en lugar de `alpha()`
- [ ] **[FQ3]** FAQ — sin botón "volver arriba" ni anchor links de categoría
- [ ] **[FQ4]** FAQ — ícono de categoría oculto en mobile sin reemplazo visual
- [ ] **[PR1]** Privacy-policy — ausencia de TOC navegable (12 secciones)
- [ ] **[PR2]** Privacy-policy — capitalización Title Case en títulos ("Enlaces a Terceros", etc.)
- [ ] **[PR4]** Privacy-policy — bloque "IMPORTANTE: …" con fontWeight bold hardcoded + MAYÚSCULAS sostenidas (debería ser Alert)
- [ ] **[CK1]** Cookies-policy — tipos de cookies como wall-of-text sin separación visual
- [ ] **[CK2]** Cookies-policy — `<ul>` HTML nativo sin estilos MUI (texto pegado al borde en mobile)
- [ ] **[CK3]** Cookies-policy — sin TOC / navegación interna
- [ ] **[TR1]** Terms — las 3 tabs montan componentes que hacen fetch independiente sin context del tab al cargar
- [ ] **[TR3]** Terms — acordeón "solo uno abierto a la vez" molesto en legales comparativos
- [ ] **[UN2]** Unsubscribe — logo duplicado (navbar + dentro del contenido)
- [ ] **[UN3]** Unsubscribe — feedback de éxito no menciona la categoría desuscripta
- [ ] **[LG2]** Login — "Olvidé mi Password" (mezcla inglés/español)
- [ ] **[LG3]** Login — título h3 "Inicio" ambiguo (debería ser "Iniciar sesión")
- [ ] **[LG4]** Login — `autocomplete="email"` debería ser `"username"` en form de login
- [ ] **[RG2]** Register — título "Empezá gratis" se parte en dos líneas en mobile junto al link "¿Ya tenés cuenta?"
- [ ] **[RG3]** Register — texto legal con `fontSize: 0.65rem` + `opacity: 0.7` (ilegible en mobile)
- [ ] **[FP1]** Forgot-password — CTA "Enviar código de verificación" anticipa implementación (mejor: "Enviar instrucciones")
- [ ] **[FP3]** Forgot-password — link "Volver al Inicio" con Title Case (debería ser oracional)
- [ ] **[CM3]** Check-mail — único CTA vuelve al login, no hay link a `/code-verification` (ruta huérfana del flujo real)
- [ ] **[RS2]** Reset-password — labels y placeholders en inglés ("Password", "Enter password", "Reseteo de Password")
- [ ] **[RS3]** Reset-password — strength indicator como un solo block sin escala de segmentos
- [ ] **[RS4]** Reset-password — campo "Confirmar contraseña" sin toggle show/hide
- [ ] **[CV2]** Code-verification — botón "Reenviar código" sin cooldown/timer
- [ ] **[CV3]** Code-verification — título muy largo, sin stepper de posición en el flujo

### 🟢 Baja prioridad (5)

- [ ] **[PL4]** Plans — breadcrumb "Inicio › Planes" redundante en página pública
- [ ] **[PR5]** Privacy-policy — `textAlign: justify` genera ríos en mobile
- [ ] **[CK4]** Cookies-policy — referencia a Internet Explorer (descontinuado 2022)
- [ ] **[TR2]** Terms — título de página siempre "Términos y Condiciones" (no refleja tab activo)
- [ ] **[UN4]** Unsubscribe — "contáctanos" es texto plano, no link mailto:

### Patrones sistémicos (recomendados — resuelven varios)

- [ ] **[P-PUB-1]** **Mezcla ES/EN en auth**: auditar y traducir a español todos los strings user-visible del flujo de auth (login, register, forgot, check-mail, reset, code-verification). Cubre LG2, CM1, RS2, FP1 parcial, y varios otros.
- [ ] **[P-PUB-2]** **Capitalización oracional en español**: reemplazar Title Case ("Volver al Inicio", "Enlaces a Terceros") por oracional ("Volver al inicio", "Enlaces a terceros"). Pasada única global.
- [ ] **[P-PUB-3]** **Estados fallback en rutas de flujo**: pantalla propia cuando `/reset-password` o `/code-verification` acceden sin state — no redirect silencioso. Cubre RS1 + CV1.
- [ ] **[P-PUB-4]** **TOC reusable en páginas legales**: componente `<LegalPageLayout>` con TOC lateral sticky (desktop) / colapsable (mobile) + IDs automáticos en cada `<h3>`. Cubre PR1, CK3, TR* parcial.
- [ ] **[P-PUB-5]** **Autocomplete attrs en forms auth**: pasada para agregar `autocomplete="username"` en login, `"email"` en forgot, `"new-password"` / `"current-password"` donde corresponda. Cubre LG4, FP2, RG1 parcial.
- [ ] **[P-PUB-6]** **Fechas de última actualización**: unificar formato y valor entre privacy, cookies, terms (ver PR3). Mover a un constant compartido.

---

## Issues por ruta (detalle)

> Los detalles completos de cada issue (file, viewport, descripción, propuesta) están en las secciones de agente producidas por el audit. Los incluyo referenciados aquí para que puedas saltar al issue marcado.

### `/` — Landing
Screenshots: `landing-{desktop,tablet,mobile}.png`
Issues: 🔴 [LD1] bloques vacíos · 🔴 [LD2] social proof dudosa · 🟡 [LD3] hex hardcoded · 🟡 [LD4] CTA único en hero · 🟡 [LD5] logos Cloudinary sin fallback

### `/plans` — Planes
Screenshots: `plans-{desktop,tablet,mobile}.png`
Issues: 🔴 [PL1] toggle anual sin descuento · 🟡 [PL2] Premium bloqueado sin lead capture · 🟡 [PL3] features wall-of-text mobile · 🟢 [PL4] breadcrumb redundante

### `/guides` — Guías
Screenshots: `guides-{desktop,tablet,mobile}.png`
Issues: 🟡 [GU1] header oculto · 🟡 [GU2] sin estado leído · 🟡 [GU3] Button anidado en CardActionArea · 🟡 [GU4] grid 1 col mobile + animación acumulada

### `/faq` — FAQ
Screenshots: `faq-{desktop,tablet,mobile}.png`
Issues: 🔴 [FQ1] sin búsqueda · 🟡 [FQ2] hex concatenado · 🟡 [FQ3] sin back-to-top · 🟡 [FQ4] ícono categoría oculto mobile

### `/privacy-policy` — Política de privacidad
Screenshots: `privacy-policy-{desktop,tablet,mobile}.png`
Issues: 🔴 [PR3] fecha inconsistente · 🟡 [PR1] sin TOC · 🟡 [PR2] Title Case · 🟡 [PR4] IMPORTANTE: bloque bold · 🟢 [PR5] justify ríos

### `/cookies-policy` — Política de cookies
Screenshots: `cookies-policy-{desktop,tablet,mobile}.png`
Issues: 🟡 [CK1] wall-of-text · 🟡 [CK2] ul nativo · 🟡 [CK3] sin TOC · 🟢 [CK4] IE desactualizado

### `/terms` — Términos
Screenshots: `terms-{desktop,tablet,mobile}.png`
Issues: 🟡 [TR1] tabs con fetch independiente · 🟡 [TR3] acordeón solo-uno · 🟢 [TR2] título no refleja tab

### `/unsubscribe` — Desuscripción
Screenshots: `unsubscribe-{desktop,tablet,mobile}.png`
Issues: 🔴 [UN1] pantalla vacía con error rojo · 🟡 [UN2] logo duplicado · 🟡 [UN3] sin categoría en éxito · 🟢 [UN4] mailto: no linkado

### `/login` — Login
Screenshots: `login-{desktop,tablet,mobile}.png`
Issues: 🔴 [LG1] Enter deshabilitado · 🟡 [LG2] "Password" mezcla idioma · 🟡 [LG3] título "Inicio" ambiguo · 🟡 [LG4] autocomplete email→username

### `/register` — Registro
Screenshots: `register-{desktop,tablet,mobile}.png`
Issues: 🔴 [RG1] sin InputLabel visible · 🟡 [RG2] título wrap mobile · 🟡 [RG3] texto legal ilegible

### `/forgot-password` — Olvidé contraseña
Screenshots: `forgot-password-{desktop,tablet,mobile}.png`
Issues: 🔴 [FP2] sin autocomplete · 🟡 [FP1] CTA revela impl · 🟡 [FP3] "Volver al Inicio"

### `/check-mail` — Revisá tu email
Screenshots: `check-mail-{desktop,tablet,mobile}.png`
Issues: 🔴 [CM1] CTA "Sign In" · 🔴 [CM2] sin email destinatario · 🟡 [CM3] ruta huérfana del flujo

### `/reset-password` — Restablecer contraseña
Screenshots: `reset-password-{desktop,tablet,mobile}.png`
> ⚠ Los screenshots muestran pantalla de registro por redirect silencioso (ver RS1).
Issues: 🔴 [RS1] redirect sin estado · 🟡 [RS2] labels en inglés · 🟡 [RS3] strength un solo bloque · 🟡 [RS4] confirm sin toggle show

### `/code-verification` — Verificación por código
Screenshots: `code-verification-{desktop,tablet,mobile}.png`
> ⚠ Los screenshots muestran pantalla de registro por redirect silencioso (ver CV1).
Issues: 🔴 [CV1] redirect sin estado · 🟡 [CV2] reenviar sin cooldown · 🟡 [CV3] título largo + sin stepper

---

## Siguiente paso

Revisá el reporte y marcá los `[x]` que querés implementar. Luego:

1. **Decidí estrategia de branch**: ¿aplicamos sobre la misma `ux/audit-2026-04-21` (queda todo junto), o creamos `ux/audit-public-2026-04-22` separada?
2. **Batching**: recomiendo 3 batches sistémicos que resuelven mucho de un saque:
   - Batch A: P-PUB-1 (ES/EN) + P-PUB-2 (capitalización) + P-PUB-5 (autocomplete) — 1 pasada de strings y attrs
   - Batch B: P-PUB-3 (estados fallback en recovery) + P-PUB-6 (fechas unificadas) — infraestructura de flujo
   - Batch C: P-PUB-4 (TOC legal) + issues específicos alta prioridad restantes

3. **Las 35 🟡 + 5 🟢** pueden entrar en un Batch D único de pulido.

---

*Reporte generado por `/ux-audit` — Pasada 1 (públicas + auth) · Screenshots en `screenshots/` (no versionados).*
