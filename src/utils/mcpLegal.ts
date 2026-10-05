/**
 * Copy y helpers compartidos para la aceptación legal del conector MCP
 * (Etapa P — C-LEGAL-API). Lo usan el diálogo de compra del add-on en /plans
 * y la pantalla de consentimiento OAuth, para que ambos digan lo mismo.
 */

export { PRIVACY_CONNECTORS_URL, PRIVACY_CONNECTORS_ANCHOR } from "store/reducers/ApiService";

/**
 * Qué información puede consultar un asistente de IA conectado vía MCP.
 * Mantener alineado con las tools registradas en la-mcp-server.
 */
export const MCP_SHARED_DATA: string[] = [
	"carpetas",
	"movimientos",
	"tareas",
	"notas",
	"eventos",
	"calculadoras",
	"contactos",
	"modelos",
	"documentos",
	"seguimientos postales",
	"jurisprudencia",
];

/** "carpetas, movimientos, …, seguimientos postales y jurisprudencia" */
export const MCP_SHARED_DATA_TEXT = `${MCP_SHARED_DATA.slice(0, -1).join(", ")} y ${MCP_SHARED_DATA[MCP_SHARED_DATA.length - 1]}`;

export type AiProvider = "anthropic" | "openai" | "other";

/**
 * Deriva el proveedor del asistente a partir de los datos del cliente OAuth
 * (mismo criterio que el hub en C-TOGGLES: dominios claude/openai, luego nombre).
 */
export function deriveAiProvider(...hints: Array<string | null | undefined>): AiProvider {
	const text = hints.filter(Boolean).join(" ").toLowerCase();
	if (!text) return "other";
	if (/claude|anthropic/.test(text)) return "anthropic";
	if (/chatgpt|openai/.test(text)) return "openai";
	return "other";
}

/** Nombre del proveedor para usar inline en copy legal. */
export function aiProviderLabel(provider: AiProvider): string {
	if (provider === "anthropic") return "Anthropic";
	if (provider === "openai") return "OpenAI";
	return "el proveedor";
}
