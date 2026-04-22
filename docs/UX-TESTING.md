# UX Testing Infrastructure

Documentación completa del sistema de auditoría y testing de UX/UI en law-analytics-front.

**Última actualización:** 2026-04-22

---

## Tabla de contenidos

1. [Visión general](#visión-general)
2. [Auditorías con agentes IA](#auditorías-con-agentes-ia)
3. [Tests automatizados](#tests-automatizados)
    - [Overflow detection](#overflow-detection)
    - [Layout detection](#layout-detection)
4. [Cómo correr los tests](#cómo-correr-los-tests)
5. [Cómo extender](#cómo-extender)
6. [Interpretación de resultados](#interpretación-de-resultados)
7. [CI integration](#ci-integration)
8. [Estructura de archivos](#estructura-de-archivos)

---

## Visión general

La app tiene **tres capas complementarias** de testing UX, cada una detecta un tipo distinto de problema:

| Capa | Detecta | Tiempo | Uso típico |
|---|---|---|---|
| **Auditorías con agents** | Issues conceptuales (consistencia, jerarquía, copy, i18n, accesibilidad semántica, flujos rotos) | 10-30 min | Al hacer un sweep manual del producto |
| **Overflow detection** (`test:ux-overflow`) | `scrollWidth > clientWidth` en elementos interactivos — texto desbordado dentro del propio elemento | ~4 min | En CI, y como guardrail contra regresiones |
| **Layout detection** (`test:ux-layout`) | Elementos fuera del viewport (`rect.right > innerWidth`) + flex-wrap sin row-gap (líneas pegadas) | ~3.5 min | En CI, y después de cambios de layout |

Son complementarias. **Ninguna por sí sola captura todo el espectro** — cada una tiene fortalezas distintas.

---

## Auditorías con agentes IA

Tres auditorías históricas quedaron documentadas en `ux-reports/`:

| Audit | Rutas | Issues | Estado | Report |
|---|---|---|---|---|
| Inicial (5 rutas logueadas) | 5 | 36 + 5 sistémicos | ✅ Implementado | `ux-reports/2026-04-21-2127/audit.md` |
| Pasada 1 (públicas + auth) | 14 | 53 | ✅ Implementado | `ux-reports/2026-04-22-public/audit.md` |
| Pasada 2 (app auth top-level) | 26 | 93 | ✅ Implementado | `ux-reports/2026-04-22-app/audit.md` |
| **Total** | **45** | **182** | **✅ Todos cerrados** | |

Cada audit tiene:
- `audit.md` — reporte con issues marcables por prioridad + patrones sistémicos
- `screenshots/` (gitignored) — capturas "antes" por viewport
- `after-final/screenshots/` o `after-batchN/screenshots/` (gitignored) — capturas "después"
- `compare.html` — viewer visual interactivo con toggle desktop/tablet/mobile

### Cómo correr una nueva auditoría

1. **Prepará la ruta list** en `tests/ux-audit/`:
    - `routes.ts` — rutas logueadas estándar
    - `routes-public.ts` — públicas + auth (sin login)
    - `routes-app.ts` — rutas de la app

2. **Capturá screenshots** con la config correspondiente:

    ```bash
    # Públicas (sin auth)
    UX_AUDIT_DIR="$(pwd)/ux-reports/YYYY-MM-DD-public" \
      npx playwright test --config=playwright.ux-audit-public.config.ts

    # App autenticada
    UX_AUDIT_DIR="$(pwd)/ux-reports/YYYY-MM-DD-app" \
      npx playwright test --config=playwright.ux-audit-app.config.ts

    # Audit inicial (5 rutas)
    UX_AUDIT_DIR="$(pwd)/ux-reports/YYYY-MM-DD-XXXX" \
      npx playwright test --config=playwright.ux-audit.config.ts
    ```

3. **Invocá agentes** sobre cada ruta con las heurísticas documentadas en `audit.md` de audits anteriores.

4. **Generá compare.html** (seguí los existentes en `ux-reports/` como template).

### Heurísticas usadas en los audits

- **Consistency**: typography variants vs inline fontSize, `theme.palette` vs hex, button hierarchy (una primary por vista), icon library (`iconsax-react`), spacing (`theme.spacing()` / 8px multiples).
- **Layout**: jerarquía clara (titles vs body), whitespace coherente, alineación.
- **Responsive**: scroll horizontal mobile, tablas que colapsan, tablet usando espacio, touch targets ≥ 44×44px.
- **A11y**: WCAG AA contraste (≥4.5:1), labels visibles (no solo placeholder), hover/focus distinguibles.
- **Feedback**: loading skeletons, empty states útiles, form errors inline, disabled states explicados.

---

## Tests automatizados

### Overflow detection

**Qué detecta:** elementos interactivos cuyo contenido de texto excede el ancho disponible (`scrollWidth > clientWidth + 2`). Captura:

- Botones con texto que no cabe en su caja.
- Chips/Tabs con label más largo que el contenedor.
- MenuItems con texto truncado sin ellipsis intencional.

Distingue entre:
- **`overflowing[]`** — bugs reales (sin `text-overflow: ellipsis`)
- **`ellipsisButTruncated[]`** — con ellipsis intencional (puede ser OK o UX issue)

**Selectores escaneados:**

```
.MuiButton-root, .MuiChip-root, .MuiTab-root, .MuiMenuItem-root,
.MuiListItemText-primary, .MuiTableCell-root, button, a[role='button'],
h1-h6, .MuiTypography-subtitle1, .MuiTypography-subtitle2
```

**Archivos:**
- `tests/ux-overflow.spec.ts` — el test
- `playwright.ux-overflow.config.ts` — config Playwright
- `scripts/aggregate-overflow-report.js` — agrega resultados individuales
- `tests/.overflow-results/` (gitignored) — archivos por test
- `tests/ux-overflow-report.json` (gitignored) — reporte agregado

### Layout detection

**Qué detecta (2 patrones):**

**Patrón 1 — ViewportOverflow:** elementos interactivos cuyo bounding rect se sale del viewport (`rect.right > innerWidth + 2`). Captura cosas como botones secondary de MainCard que no wrappean en mobile.

**Patrón 2 — WrappedFlexNoGap:** contenedores flex con `flex-wrap: wrap` donde 2+ líneas de hijos quedan "pegadas" (distancia vertical < 3px). Captura Stacks de chips que al envolver en mobile se superponen sin respiro visual.

**Filtros para evitar falsos positivos:**

- Ignora elementos con `position: fixed|sticky` (FABs, headers pegajosos)
- Ignora elementos dentro de ancestors con `overflow-x: auto|scroll` (tablas con scroll horizontal deliberado)
- Ignora contenedores `MuiGrid-root` / `MuiGrid-container` (MUI Grid usa negative margins para gutter — rompería el análisis)
- Solo analiza contenedores con al menos 1 chip/button entre sus hijos (filtra layouts estructurales)

**Archivos:**
- `tests/ux-layout.spec.ts` — el test
- `playwright.ux-layout.config.ts` — config Playwright
- `scripts/aggregate-layout-report.js` — agrega resultados individuales
- `tests/.layout-results/` (gitignored) — archivos por test
- `tests/ux-layout-report.json` (gitignored) — reporte agregado

---

## Cómo correr los tests

### Pre-requisitos

1. **Dev server corriendo** en `localhost:3000`:
    ```bash
    npm run start
    ```

2. **Auth state** generado (si no existe, se crea automáticamente con el global-setup). Requiere `VITE_DEV_EMAIL` y `VITE_DEV_PASSWORD` en `.env`.

### Comandos

**Overflow detection:**
```bash
npm run test:ux-overflow
```

Output:
- Tiempo: ~4 min
- Exit code 0 si todo OK, 1 si hay bugs
- Reporte: `tests/ux-overflow-report.json`
- Resumen en consola con la lista de bugs

**Layout detection:**
```bash
npm run test:ux-layout
```

Output:
- Tiempo: ~3.5 min
- Exit code 0 si todo OK, 1 si hay bugs
- Reporte: `tests/ux-layout-report.json`
- Resumen en consola con:
    - Lista de viewport overflows (elementos fuera del viewport con cuántos px se salen)
    - Lista de wrapped flex sin gap (contenedor, cantidad de líneas, gap medido)

**Ambos juntos:**
```bash
npm run test:ux-overflow && npm run test:ux-layout
```

**Captura visual (compare.html):**
```bash
# Para cada audit folder, correr su config correspondiente. Ver sección
# "Auditorías con agentes IA" arriba.
```

---

## Cómo extender

### Agregar una nueva ruta al test

Editá el array de rutas al inicio del spec:

**`tests/ux-overflow.spec.ts`** o **`tests/ux-layout.spec.ts`**:

```typescript
const PUBLIC_ROUTES = [
  { path: "/", name: "landing" },
  { path: "/nueva-ruta", name: "nueva-ruta" }, // ← agregar acá
  // ...
];

const AUTH_ROUTES = [
  { path: "/dashboard/default", name: "dashboard" },
  { path: "/apps/nueva-ruta", name: "nueva-ruta-auth" }, // ← o acá
  // ...
];
```

### Agregar un nuevo selector al overflow test

Editá `INTERACTIVE_SELECTORS` en `tests/ux-overflow.spec.ts`:

```typescript
const INTERACTIVE_SELECTORS = [
  ".MuiButton-root",
  ".MuiChip-root",
  // ... existentes
  ".MiNuevaClase",  // ← agregar acá
].join(", ");
```

### Agregar un nuevo patrón de detección de layout

En `tests/ux-layout.spec.ts`, dentro de `analyzeLayout`, agregá un nuevo loop/función que recolecte lo que querés detectar, y extendé la interface `RouteResult` con el nuevo campo. Después actualizá `scripts/aggregate-layout-report.js` para mostrar el nuevo campo en el resumen.

### Cambiar de soft a hard assertion (para que el CI falle)

Reemplazá `expect.soft` por `expect` en el spec correspondiente. Actualmente son soft para que el CI no se rompa por issues conocidos — pero el exit code del aggregate script ya devuelve 1 si hay bugs, así que con eso alcanza para CI.

---

## Interpretación de resultados

### Estructura del reporte (ambos tests)

El reporte JSON es un array de objetos `RouteResult`:

**Overflow:**
```json
[
  {
    "route": "modelos",
    "path": "/documentos/modelos",
    "viewport": "mobile",
    "overflowing": [
      {
        "tag": "button",
        "text": "Solicitar modelo",
        "selector": ".MuiButton-root",
        "scrollWidth": 157,
        "clientWidth": 152,
        "overflow": 5,
        "hasEllipsis": false
      }
    ],
    "ellipsisButTruncated": []
  }
]
```

**Layout:**
```json
[
  {
    "route": "postal",
    "path": "/herramientas/seguimiento-postal",
    "viewport": "mobile",
    "viewportOverflows": [
      {
        "tag": "button",
        "text": "Nuevo seguimiento",
        "selector": ".MuiButton-root",
        "rect": { "top": 89, "left": 265, "right": 435, "bottom": 120, "width": 170, "height": 31 },
        "overflowPx": 45,
        "viewportWidth": 390
      }
    ],
    "wrappedNoGap": [
      {
        "containerTag": "div",
        "containerSelector": ".MuiStack-root",
        "lineCount": 2,
        "minRowGap": 0,
        "sampleChildren": [
          { "tag": "div", "text": "Completado" },
          { "tag": "div", "text": "INTENTO DE ENTREGA" }
        ]
      }
    ]
  }
]
```

### Qué hacer con un bug detectado

1. **Reproducí** manualmente en browser (los datos del reporte te dicen route + viewport exactos).
2. **Inspeccioná** con DevTools el elemento reportado (usar el selector + text).
3. **Fix típico según patrón:**
    - **Overflow (scrollWidth)**: reducir texto, agregar `text-overflow: ellipsis`, o hacer el contenedor responsivo.
    - **Viewport overflow (rect)**: hacer el elemento responsivo en mobile (usar `IconButton` en lugar de `Button`, o `flex-wrap`, o `width: 100%`).
    - **Wrapped flex sin gap**: agregar `useFlexGap + rowGap={1}` al Stack (o `gap={1}` al Box flex).
4. **Re-corré el test** para confirmar.

### Falsos positivos conocidos

- Si un elemento está INTENCIONALMENTE fuera del viewport (ej: tooltip anchor, menu flotante), podés agregarle un `data-attribute` como `data-viewport-ignore="true"` y filtrarlo en el test.
- Si un Stack con chips está intencionalmente pegado (unlikely pero posible), el filtro de "tiene al menos 1 chip/button" puede revisarse.

---

## CI integration

Para correr ambos tests en CI, agregá a tu pipeline:

```yaml
# GitHub Actions example
- name: UX overflow test
  run: npm run test:ux-overflow

- name: UX layout test
  run: npm run test:ux-layout
```

Los dos tests hacen `exit 1` si encuentran bugs (gracias al aggregate script). El CI va a fallar en PRs que introduzcan regresiones visuales del tipo que estos tests detectan.

**Recomendación:** ejecutar los tests como **warn** primero (no-blocking) durante unas semanas, hasta confirmar que no hay false positives. Después pasar a **error** (blocking).

Para modo warn, cambiar el npm script a:

```json
"test:ux-overflow:warn": "npm run test:ux-overflow || true"
```

---

## Estructura de archivos

```
law-analytics-front/
├── docs/
│   └── UX-TESTING.md                          # ← este archivo
├── playwright.ux-audit.config.ts              # config audit inicial (5 rutas)
├── playwright.ux-audit-public.config.ts       # config audit públicas + auth
├── playwright.ux-audit-app.config.ts          # config audit app auth
├── playwright.ux-overflow.config.ts           # config test overflow
├── playwright.ux-layout.config.ts             # config test layout
├── scripts/
│   ├── aggregate-overflow-report.js           # aggregator overflow
│   └── aggregate-layout-report.js             # aggregator layout
├── tests/
│   ├── ux-audit/                              # infrastructure de audits
│   │   ├── routes.ts                          # 8 rutas del audit inicial
│   │   ├── routes-public.ts                   # 14 rutas públicas + auth
│   │   ├── routes-app.ts                      # 26 rutas app
│   │   ├── capture.spec.ts                    # captura para audit inicial
│   │   ├── capture-public.spec.ts             # captura públicas
│   │   ├── capture-app.spec.ts                # captura app
│   │   └── capture-auth-forms.spec.ts         # captura form variants con state inyectado
│   ├── ux-overflow.spec.ts                    # test overflow
│   ├── ux-layout.spec.ts                      # test layout
│   ├── .overflow-results/                     # (gitignored) resultados por test
│   ├── .layout-results/                       # (gitignored) resultados por test
│   ├── ux-overflow-report.json                # (gitignored) reporte agregado
│   └── ux-layout-report.json                  # (gitignored) reporte agregado
└── ux-reports/
    ├── 2026-04-21-2127/                       # audit inicial
    │   ├── audit.md
    │   ├── compare.html
    │   ├── screenshots/                       # (gitignored)
    │   └── after-final/screenshots/           # (gitignored)
    ├── 2026-04-22-public/                     # pasada 1
    │   ├── audit.md
    │   ├── compare.html
    │   ├── screenshots/                       # (gitignored)
    │   └── after-final/screenshots/           # (gitignored)
    └── 2026-04-22-app/                        # pasada 2
        ├── audit.md
        ├── compare.html
        ├── screenshots/                       # (gitignored)
        └── after-final/screenshots/           # (gitignored)
```

---

## npm scripts disponibles

```bash
# Tests UX automatizados
npm run test:ux-overflow        # detecta scrollWidth > clientWidth (text overflow)
npm run test:ux-layout          # detecta viewport overflow + flex wrap sin gap

# Otros tests Playwright (no UX)
npm run test:visual             # visual regression con snapshots
npm run test:e2e                # e2e completo (incluye password-recovery, teams, etc.)
npm run test:e2e:ui             # e2e en modo UI interactivo
npm run test:e2e:headed         # e2e viendo el browser
```

---

## Próximos pasos (roadmap sugerido)

Mejoras que complementarían la cobertura actual:

1. **Accesibilidad automática** — integrar `@axe-core/playwright` para detectar:
    - Contraste WCAG AA
    - ARIA attributes faltantes
    - Heading hierarchy incorrecta
    - Landmarks faltantes

2. **Visual regression con baseline** — `playwright.visual.config.ts` ya existe; expandirlo con snapshots de las 45 rutas para que cualquier cambio visual quede detectado automáticamente.

3. **Lighthouse CI** — scores de performance + best practices + SEO en CI.

4. **Detección de spacing inconsistente** — un tercer test que analice padding/margin entre secciones similares y reporte outliers.

5. **Chromatic / Percy** (servicio externo, pago) — visual regression como servicio con UI para review de diffs.

---

## Referencias

- [Playwright documentation](https://playwright.dev/)
- [MUI theming](https://mui.com/material-ui/customization/theming/)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- Audits históricos: `ux-reports/*/audit.md`

---

*Si agregás un nuevo test UX o extendés uno existente, actualizá este documento.*
