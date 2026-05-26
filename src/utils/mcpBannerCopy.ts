/**
 * Copy compartido para los banners del conector MCP. Centralizar acá el
 * texto evita drift entre Technologies, /plans y /integraciones/claude-ai.
 *
 * La lógica decide qué AI mencionar (Claude.ai, ChatGPT, ambos) en función
 * de qué flags de IntegrationsConfig están enabled.
 */

import type { PublicIntegrations } from "store/reducers/ApiService";

export interface McpBannerCopy {
	/** Texto del título — "Conectá X a tu cuenta" */
	title: string;
	/** Subtítulo — describe lo que el user puede hacer */
	description: string;
	/** Lista de clientes AI activos para iconos/orden de mención */
	activeClients: ("claudeAi" | "chatGpt")[];
	/** "Claude.ai y ChatGPT" / "Claude.ai" / "ChatGPT" — para usar inline */
	clientsLabel: string;
}

const formatClientsList = (clients: ("claudeAi" | "chatGpt")[]): string => {
	const names = clients.map((c) => (c === "claudeAi" ? "Claude.ai" : "ChatGPT"));
	if (names.length === 0) return "asistentes IA";
	if (names.length === 1) return names[0];
	return names.join(" y ");
};

export function getMcpBannerCopy(integrations: PublicIntegrations): McpBannerCopy {
	const active: ("claudeAi" | "chatGpt")[] = [];
	if (integrations.claudeAi.enabled) active.push("claudeAi");
	if (integrations.chatGpt.enabled) active.push("chatGpt");

	const clientsLabel = formatClientsList(active);
	const verb = active.length === 2 ? "Conectá" : "Conectá";

	// Title se mantiene corto: no aclaramos en el title los dos clientes —
	// el detalle va al subtítulo para no hacer el banner gigante.
	const title = active.length === 0
		? "Nuevo · Conectá asistentes IA a tu cuenta"
		: active.length === 2
			? "Nuevo · Conectá Claude.ai y ChatGPT a tu cuenta"
			: `Nuevo · Conectá ${clientsLabel} a tu cuenta`;

	const aiSubject = active.length === 1 ? clientsLabel : "Claude o ChatGPT";

	const description =
		`Pediole a ${aiSubject} que busque tus expedientes, resuma movimientos o consulte ` +
		`jurisprudencia desde el chat. Conector MCP oficial — datos en tiempo real.`;

	void verb;

	return { title, description, activeClients: active, clientsLabel };
}

export type AiClient = "claudeAi" | "chatGpt";

export interface AiBannerCopy {
	clientKey: AiClient;
	/** Display name canónico: "Claude.ai" / "ChatGPT". */
	displayName: string;
	/** Título corto del banner. */
	title: string;
	/** Subtítulo descriptivo. */
	description: string;
	/** Destino del CTA del banner — link a la página de la integración. */
	to: string;
}

/**
 * Copy específico para banners/cards individuales por cliente AI. Cada AI
 * (Claude.ai, ChatGPT) tiene su propio banner separado con su logo y copy
 * — los dos se renderizan lado a lado cuando ambos están habilitados.
 *
 * Hoy ambos linkean a /integraciones/claude-ai porque es la única página
 * de detalle. Cuando exista /integraciones/chatgpt, actualizar `to` para
 * el caso chatGpt.
 */
export function getAiBannerCopy(client: AiClient): AiBannerCopy {
	if (client === "claudeAi") {
		return {
			clientKey: "claudeAi",
			displayName: "Claude.ai",
			title: "Conectá Claude.ai a tu cuenta",
			description:
				"Pediole a Claude que busque tus expedientes, resuma movimientos o consulte jurisprudencia desde el chat.",
			to: "/integraciones/claude-ai",
		};
	}
	return {
		clientKey: "chatGpt",
		displayName: "ChatGPT",
		title: "Conectá ChatGPT a tu cuenta",
		description:
			"Pediole a ChatGPT que busque tus expedientes, resuma movimientos o consulte jurisprudencia desde el chat.",
		// TODO: cambiar a /integraciones/chatgpt cuando exista la página dedicada.
		to: "/integraciones/claude-ai",
	};
}

/**
 * Formatea un precio mensual para mostrarlo en cards/banners.
 * Si no hay precio (Stripe no devolvió), retorna null para que el caller
 * decida si esconder la sección o mostrar "Próximamente".
 */
export function formatMonthlyPrice(amount: number | null, currency: string): string | null {
	if (amount == null) return null;
	const c = (currency || "usd").toLowerCase();
	// USD ($) y ARS ($) usan el mismo símbolo — para evitar ambigüedad mostramos USD/ARS sufijo.
	const symbol = c === "ars" ? "$" : "US$";
	const formatted = amount.toLocaleString("es-AR", {
		minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
		maximumFractionDigits: 2,
	});
	return `${symbol} ${formatted}/mes`;
}
