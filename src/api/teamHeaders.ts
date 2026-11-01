import { store } from "store";
import { activeTeamIdOf, teamHeadersOf } from "store/reducers/teamScope";

/**
 * Cabecera `X-Group-Id` del equipo activo para los clientes de credenciales de portal (PJN, SCBA,
 * MEV), 2/11/2026: así el hub resuelve la credencial del equipo (la del owner) y aplica la regla
 * «solo owner y admin gestionan». Sin equipo activo devuelve {} y la llamada queda como siempre.
 */
export const teamHeaders = (): Record<string, string> => teamHeadersOf(activeTeamIdOf(store.getState)) ?? {};
