/**
 * Contrato del add-on "Conectores de IA" (`mcp_access`) entre el front y el hub.
 *
 * Fuente autoritativa: law-analytics-server `controllers/subscriptionController.js`
 * (`getAddonStatus`, `addAddon`, `removeAddon`) y `services/mcpAddonStatusService.js`
 * (branch `fix/mcp-addon-purchase`, con tests).
 *
 *   GET    /api/subscriptions/addons/mcp_access     → 200 { success: true, addon: HubMcpAddonStatus }
 *   POST   /api/subscriptions/addons/checkout       { addonKey, acceptedPolicyVersion? }
 *   DELETE /api/subscriptions/addons/mcp_access     (baja inmediata, crédito prorrateado)
 *
 * Mientras el GET no exista (404, el front puede salir antes que el hub) o falle,
 * `useMcpAddon` arma el mismo modelo con `/api/connected-apps/access` + la suscripción
 * del store + los addons públicos (ver `deriveMcpAddonFallback`).
 */

export const MCP_ADDON_KEY = "mcp_access" as const;

/** GET consolidado (respuesta cruda del hub). */
export const MCP_ADDON_STATUS_PATH = `/api/subscriptions/addons/${MCP_ADDON_KEY}`;

/** El hub no devuelve la URL del conector: es fija. */
export const DEFAULT_MCP_URL = "https://mcp.lawanalytics.app/mcp";

export type McpAddonBillingStatus =
	/** No contratado. */
	| "none"
	/** Contratado y al día. */
	| "active"
	/** Cobro fallido, Stripe reintenta: mantiene el acceso (C-BILLING) pero hay que actualizar el pago. */
	| "past_due"
	/** El cobro inicial no se completó. */
	| "incomplete"
	/** La suscripción se cancela al fin del período y el add-on se va con ella (`endsAt`). */
	| "canceling";

/** Por qué no puede contratarlo (null = puede). Los tres primeros son del hub; `team_member` lo agrega el front. */
export type McpAddonEligibilityReason = null | "paid_plan_required" | "subscription_inactive" | "subscription_canceling" | "team_member";

/** Por qué la venta está cerrada (switch C-TOGGLES). */
export type McpAddonAvailabilityReason = null | "not_public" | "maintenance" | "config_unavailable";

export interface McpAddonPrice {
	/** Monto mensual en unidades de la moneda (no centavos). */
	amount: number | null;
	/** ISO 4217 en minúscula: "usd", "ars". */
	currency: string;
	interval: "month" | "year" | string;
}

export interface McpAddonLegal {
	privacyVersion: string | null;
	privacyUrl: string;
	previouslyAcceptedVersion: string | null;
	/** true = el checkout exige `acceptedPolicyVersion === privacyVersion`. */
	acceptanceRequired: boolean;
}

/** Respuesta del hub (`addon` del GET). */
export interface HubMcpAddonStatus {
	key: string;
	displayName?: string;
	description?: string | null;
	price: { amount: number; currency: string; interval: string } | null;
	requiredPlans?: string[];
	status: McpAddonBillingStatus;
	plan: string;
	subscriptionStatus: string | null;
	eligible: boolean;
	eligibilityReason: Exclude<McpAddonEligibilityReason, "team_member">;
	publicAvailable: boolean;
	availabilityReason: McpAddonAvailabilityReason;
	maintenanceMessage: string | null;
	adminBypass: boolean;
	purchasable: boolean;
	canRemove: boolean;
	nextBillingDate: string | null;
	endsAt: string | null;
	hasManualGrant: boolean;
	legal: McpAddonLegal;
}

/**
 * Modelo que usa la UI: la respuesta del hub normalizada (o derivada en el fallback)
 * más `access` (acceso efectivo, derivado en el front) y `mcpUrl`.
 */
export interface McpAddonStatus {
	key: typeof MCP_ADDON_KEY;
	/** Precio; `amount: null` si Stripe no lo devolvió (el hub manda `price: null`). */
	price: McpAddonPrice;
	status: McpAddonBillingStatus;
	/** Plan actual: "free" | "standard" | "pro" | "premium". */
	plan: string;
	subscriptionStatus: string | null;
	eligible: boolean;
	eligibilityReason: McpAddonEligibilityReason;
	requiredPlans: string[];
	/** Venta abierta (algún switch de proveedor encendido y sin mantenimiento). false = beta cerrada. */
	publicAvailable: boolean;
	availabilityReason: McpAddonAvailabilityReason;
	maintenanceMessage: string | null;
	/** Admin de plataforma con la venta cerrada: puede comprar igual. */
	adminBypass: boolean;
	/** status none && elegible && (venta abierta || adminBypass) && con precio. */
	purchasable: boolean;
	canRemove: boolean;
	/** Próximo cobro (active / past_due). */
	nextBillingDate: string | null;
	/** Fecha en que se va (canceling). */
	endsAt: string | null;
	/** Grant beta manual (acceso sin pagar). */
	hasManualGrant: boolean;
	/** null en el fallback: se consulta /api/legal/versions al abrir el diálogo. */
	legal: McpAddonLegal | null;
	/** Acceso efectivo hoy (derivado en el front). */
	access: {
		allowed: boolean;
		via: "addon" | "beta_grant" | null;
		reason: string | null;
	};
	mcpUrl: string;
}
