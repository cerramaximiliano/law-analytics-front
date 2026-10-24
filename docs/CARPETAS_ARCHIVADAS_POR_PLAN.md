# Carpetas archivadas por el plan (2026-10-24)

Maqueta aprobada por el dueño (artefacto "Carpetas archivadas por el plan"). Contexto:
`la-ads/analysis/2026-10-24-conversion-scba-free.md`. Commit `3abea8d5`.

Cada aviso de movimiento de una causa archivada (`notifyArchivedFolders=true`) lleva a la carpeta; antes la vista no
explicaba por qué estaba archivada ni cómo resolverlo.

| Pieza | Archivo | Qué hace |
|---|---|---|
| Resumen | `services/archivedSummaryService.ts`, `hooks/useArchivedSummary.ts` | `GET /api/folders/archived-summary` del hub; si falla devuelve `null` y las vistas quedan como antes |
| Carpeta archivada | `sections/apps/folders/ArchivedFolderView.tsx` | Si `archivedReason` es del plan (`plan_limit`, `plan_downgrade`, `auto_archived_limit_exceeded`): conteo, plan recomendado, "Ver planes" y "Activar esta en lugar de otra". Archivada por el usuario: igual que antes |
| Intercambio | `sections/apps/folders/SwapArchivedFolderDialog.tsx` | Elegir una activa, archivarla y desarchivar la actual (dos llamadas; si la segunda falla, vuelve a activar la elegida) |
| Tope al desarchivar | `utils/unarchiveLimitSnackbar.tsx`, `store/reducers/folder.ts` (`unarchiveLimitDetails`) | "Tenés N de M causas activas…" + "Ver planes". Detecta `code: plan_limit_reached`, `unarchiveResult.exceeded` o el mensaje |
| Banner del listado | `sections/apps/folders/ArchivedByPlanBanner.tsx` (en `pages/apps/folders/folders.tsx`) | "N causas quedaron archivadas por el límite del plan…", con "Elegir cuáles ver" y "Ver planes". No en modo equipo |

Tracking: evento `upgrade_cta_click` (`utils/gtm.ts`) con `source` = `archived_folder` / `archived_banner` /
`archived_unarchive_error` y `destination: /suscripciones/tables`; el mismo valor va en `?source=`. Documentado en
`la-ads/docs/tracking-map.md` §3quinquies y `docs/gtm-setup.md`.
