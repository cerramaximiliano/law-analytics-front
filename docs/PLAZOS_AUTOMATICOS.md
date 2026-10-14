# Plazos automáticos — componentes del front

Vencimientos sugeridos a partir de las cédulas del PJN (beta). **Documento único del feature:
`la-ads/docs/producto/plazos-automaticos.md`**; mapa del backend: `law-analytics-server/docs/PLAZOS_AUTOMATICOS.md`.
Estado al 2026-10-14 (etapa 1 de apertura: solo cuentas de prueba).

| Componente | Dónde se ve | Qué hace |
|---|---|---|
| `src/sections/apps/profiles/account/PlazosAutomaticosConfig.tsx` | Perfil → Integraciones → PJN, tarjeta "Vencimientos automáticos" | activa la función y guarda el CUIT del usuario (`GET/PUT /api/plazos-automaticos/config`) |
| `src/pages/apps/folders/details/components/PlazosParteCard.tsx` | carpeta → Información general, tarjeta "¿a quién representás?" (solo con la función activa y en carpetas PJN de CIV/CSS/CNT/COM) | P15: elige la parte que el usuario representa entre los intervinientes de la causa; "sugerida" marca la detectada sola por su CUIT entre los letrados. Al guardar, el backend pasa a evento los avisos vigentes que ahora son suyos (`GET/PUT /api/plazos-automaticos/carpetas/:folderId/parte`). Sin partes descargadas, muestra que se traen del PJN en los próximos días |
| `src/sections/apps/calendar/SugerenciaPlazoFeedback.tsx` | evento del calendario (`origen: 'plazos-automaticos'`, en `AddEventForm.tsx` y en `ActivityTables.tsx`) y aviso de la carpeta (`user: 'plazos-automaticos'`) | aviso de sugerencia + "¿es correcto?" (`POST /api/plazos-automaticos/feedback`); "no es correcto" archiva el evento |
| `src/api/plazosAutomaticos.ts` | — | cliente de los endpoints anteriores y `cuitValido` (módulo 11, igual que el backend) |

El copy de marketing del feature está en la rama `copy/plazos-automaticos` (sin mergear): se mergea al abrir la etapa 3.
Las partes de la carpeta para el usuario (sin relación con plazos) las muestra `IntervinientesPjnPanel` (ver
`docs/INFORME_RUTAS_Y_ESTADO_CONTACTS.md`).
