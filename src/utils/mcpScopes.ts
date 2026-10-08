/**
 * Scopes OAuth del conector MCP y sus textos (Etapa F — escritura).
 *
 * `mcp:write` llega solo por step-up (ESCRITURA.md §2.1/§2.2, F-D10): la primera
 * conexión pide `mcp:access` y la escritura se pide cuando hace falta.
 *
 * Mantener sincronizado con la allowlist de scopes del hub (routes/oauthRoutes.js).
 */

export const MCP_ACCESS_SCOPE = "mcp:access";
export const MCP_WRITE_SCOPE = "mcp:write";

/**
 * Recursos que el asistente puede crear y modificar HOY. F1 = agenda, notas y
 * contactos; F2 suma "escritos desde modelos", F3 "carpetas" y "seguimientos
 * postales" (F-D1). Sumarlos acá cuando se habiliten: los textos del consent y de
 * la tarjeta de apps conectadas se arman con esta lista.
 */
export const MCP_WRITE_RESOURCES: readonly string[] = ["tareas", "eventos", "notas", "contactos"];

/** "a, b, c y d" */
export function joinSpanishList(items: readonly string[]): string {
	if (items.length <= 1) return items.join("");
	return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

export const MCP_WRITE_RESOURCES_TEXT = joinSpanishList(MCP_WRITE_RESOURCES);

/** Textos largos para la pantalla de consent. Para scopes desconocidos cae al ID. */
export const CONSENT_SCOPE_LABELS: Record<string, string> = {
	openid: "Saber tu identidad básica (email, nombre)",
	offline_access: "Mantener la sesión activa entre conversaciones (sin pedirte autorización cada vez)",
	[MCP_ACCESS_SCOPE]:
		"Consultar la información de tu cuenta (carpetas, movimientos, agenda, contactos, cálculos, documentos y jurisprudencia)",
	// F-D2 (sin borrar) + F-D6 (sin archivar).
	[MCP_WRITE_SCOPE]: `Crear y modificar ${MCP_WRITE_RESOURCES_TEXT} (no puede borrar ni archivar)`,
};

/** Etiquetas cortas para los chips de la tarjeta de apps conectadas. */
export const CHIP_SCOPE_LABELS: Record<string, string> = {
	openid: "Identidad",
	offline_access: "Sesión persistente",
	[MCP_ACCESS_SCOPE]: "Consultar datos de tu cuenta",
	[MCP_WRITE_SCOPE]: "Crear y modificar",
};

export const describeConsentScope = (scope: string): string => CONSENT_SCOPE_LABELS[scope] || scope;
export const describeScopeChip = (scope: string): string => CHIP_SCOPE_LABELS[scope] || scope;

export const includesWriteScope = (scopes: readonly string[] | null | undefined): boolean =>
	Array.isArray(scopes) && scopes.includes(MCP_WRITE_SCOPE);
