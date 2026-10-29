/**
 * Contexto de equipo para los thunks (escritos, seguimiento postal): se lee el equipo
 * activo del store (mismo criterio que tasks.ts) para no esperar a que los equipos se
 * inicialicen antes de pedir datos personales. Sin equipo activo, las llamadas quedan
 * idénticas a las de siempre (sin cabecera ni ruta de grupo).
 */

/** Id del equipo activo, o null. Acepta `getState` opcional por si el thunk se llama sin él. */
export const activeTeamIdOf = (getState?: () => any): string | null => getState?.()?.teams?.activeTeam?._id ?? null;

/** Cabecera X-Group-Id para las altas en modo equipo; `undefined` deja la llamada como antes. */
export const teamHeadersOf = (teamId: string | null): Record<string, string> | undefined => (teamId ? { "X-Group-Id": teamId } : undefined);
