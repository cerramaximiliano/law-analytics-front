# Retroactivo previsional — front

El motor y las reglas de cálculo están documentados en `law-analytics-server/docs/PREVISIONAL_RETROACTIVO.md`. Acá,
dónde vive cada pieza del front (estado al 2026-10-17).

| Pieza | Archivo |
|---|---|
| Asistente (5 pasos) | `src/sections/forms/wizard/calc-previsional/retroactivo/{first..fifth}.tsx` |
| Paso 1–2: haberes, moneda del haber inicial (pesos, australes, pesos argentinos, pesos ley) | `first.tsx`, `second.tsx`; opciones en `MONEDAS_HABER` (`src/services/previsionalService.ts`) |
| Paso 2: percibidos cargados mes a mes (grilla, precarga con el percibido automático, pegar desde Excel, completitud; sin actualización automática) | `retroactivo/components/PercibidosMensuales.tsx`; `mesesDelPeriodo`, `mesesSinPercibido`, `seriePercibidoSugerida` en `src/services/previsionalService.ts`; test `src/services/previsionalPercibidoManual.test.ts` |
| Paso 2: piso del haber mínimo del percibido y del reclamado (automático desde el 2026-10-20: "mínimo" por defecto, "82 % SMVM" o "sin garantía"; el `"no"` de los guardados viejos vale como mínimo) | `second.tsx`; `PISOS_PERCIBIDO` y `pisoNormalizado` en `src/services/previsionalService.ts` (igual que `pisoDe()` del hub) |
| Paso 3: movilidad por tramos y patrones ("Badaro", "Sánchez y Badaro", Torelli, continuidad, Cortes) | `third.tsx` |
| Paso 4: tope art. 9 inc. 3, haber máximo movido por Badaro, tope Villanustre (porcentaje, salarios, pauta salarial) | `fourth.tsx` |
| Paso 5: tasa, bono, pagos a cuenta con tipo, capitalización del interés impago | `fifth.tsx` |
| Valores iniciales, modelo y validación | `formModel/{formInitialValues,previsionalFormModel,validationSchema}.ts` |
| Reabrir un guardado (desde `formulario` o `input`) | `formModel/valoresDesdeGuardado.ts` |
| Input del motor y tipos | `src/services/previsionalService.ts` (`armarInputRetroactivo`, `RetroactivoInput`, `FilaRetroactivo`) |
| Resultado, Guardar / Guardar cambios / Guardar como nuevo | `retroactivo/components/ResultadoCalculo.tsx` |
| Tabla mes a mes (columnas opcionales: quita tope, límite Villanustre, bono) | `src/components/calculator/TablaRetroactivo.tsx` |
| Liquidación por tramos (cuadro Detalle por corte) | `src/components/calculator/LiquidacionPorTramos.tsx`, `src/utils/previsionalTramos.ts` |
| PDF con logo, código de validación y QR | `src/components/calculator/PrevisionalRetroactivoPDF.tsx`, `src/utils/previsionalPdf.ts` |
| Guardados: editar, PDF, detalle, "Mantener actualizado", versiones | `src/pages/calculator/previsional/components/SavedPrevisional.tsx`, `src/utils/previsionalKeepUpdated.ts` |
| Página pública de validación | `src/pages/public/ValidarDocumento.tsx` (rutas `/validar` y `/validar/:codigo`) |

Los textos de los criterios del PDF (`CRITERIOS_MOVILIDAD_LABELS` en `utils/previsionalPdf.ts`) tienen que coincidir
con `CRITERIOS_MOVILIDAD` del hub: si se agrega un criterio en el motor, agregarlo en `third.tsx` y en esa tabla.
