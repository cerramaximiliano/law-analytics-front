/**
 * Contrato del add-on "Conectores de IA" (`mcp_access`) entre el front y el hub.
 *
 * ENDPOINT CONSOLIDADO (lo expone law-analytics-server; ver MCP_ADDON_STATUS_PATH):
 *
 *   GET /api/subscriptions/addons/mcp_access/status   (cookie de sesión)
 *   200 → { success: true, addon: McpAddonStatus }      // también se acepta McpAddonStatus "pelado"
 *
 * Mientras el endpoint no exista (404) o falle, `useMcpAddon` arma el mismo shape
 * con lo que ya hay: addons públicos (precio), la suscripción del store
 * (`/api/subscriptions/current`) y `/api/connected-apps/access` (plan check +
 * switches + grant beta). Ver `deriveMcpAddonFallback` en utils/mcpAddonState.ts.
 *
 * Alta / baja (ya existen en el hub):
 *   POST   /api/subscriptions/addons/checkout  { addonKey, acceptedPolicyVersion? }
 *   DELETE /api/subscriptions/addons/mcp_access
 * Ver `AddAddonResult` / `RemoveAddonResult` en store/reducers/ApiService.ts para las
 * respuestas que el front entiende (incluido `requires_action` para SCA).
 */

export const MCP_ADDON_KEY = "mcp_access" as const;

/** Estado de facturación del add-on, visto por el usuario. */
export type McpAddonBillingStatus =
	/** No lo tiene (nunca lo agregó o ya se quitó). */
	| "none"
	/** Activo y al día. */
	| "active"
	/** Stripe está reintentando el cobro: sigue funcionando (gracia, C-BILLING) pero hay que actualizar el pago. */
	| "past_due"
	/** Sigue activo hasta `cancelAt`; después se quita solo. */
	| "canceling";

/** Por qué el usuario NO puede contratar el add-on (null = puede). Alineado con `featureAccessService.Reason`. */
export type McpAddonIneligibleReason =
	| null
	/** Plan gratuito (o sin plan pago): hay que mejorar el plan primero. */
	| "plan_too_low"
	| "no_subscription"
	/** Suscripción de Stripe en unpaid/canceled/incomplete…: hay que regularizar el pago. */
	| "subscription_inactive"
	/** Cuenta suspendida por falta de pago (dunning). */
	| "account_suspended"
	/** Miembro de un equipo: el add-on lo contrata el titular de la suscripción. */
	| "team_member"
	/** El add-on no se vende todavía (beta cerrada). */
	| "not_for_sale";

export interface McpAddonPrice {
	/** Monto mensual en unidades de la moneda (no centavos). null si Stripe no lo devolvió. */
	amount: number | null;
	/** ISO 4217 en minúscula: "usd", "ars". */
	currency: string;
	interval: "month" | "year" | string;
}

export interface McpAddonStatus {
	key: typeof MCP_ADDON_KEY;
	price: McpAddonPrice;
	status: McpAddonBillingStatus;
	/** Próximo cobro del add-on (fin del período actual). ISO o null. */
	nextChargeAt: string | null;
	/** Con status "canceling": fecha en que se quita. ISO o null. */
	cancelAt: string | null;
	/** Cómo se comporta la baja hoy: "immediate" (se quita en el momento, prorrateo) o "period_end". */
	cancelBehavior: "immediate" | "period_end";
	eligibility: {
		eligible: boolean;
		reason: McpAddonIneligibleReason;
		/** Planes que permiten contratarlo, p. ej. ["standard","pro","premium"]. */
		requiredPlans: string[];
		/** Plan actual del usuario ("free" | "standard" | "pro" | "premium"). */
		currentPlan: string | null;
	};
	/** La integración está abierta al público (algún switch de proveedor encendido). false = beta cerrada. */
	publicOpen: boolean;
	/** Acceso efectivo hoy (lo que respondería el consent OAuth). */
	access: {
		allowed: boolean;
		/** "addon" = por plan + add-on; "beta_grant" = grant manual; null = sin acceso. */
		via: "addon" | "beta_grant" | null;
		/** Motivo de featureAccessService cuando no hay acceso (plan_too_low, addon_missing, subscription_inactive…). */
		reason: string | null;
	};
	/** URL del conector para pegar en Claude.ai / ChatGPT. */
	mcpUrl: string;
}

/** Path del GET consolidado. Centralizado acá para cambiarlo en un solo lugar si el hub lo publica en otra ruta. */
export const MCP_ADDON_STATUS_PATH = `/api/subscriptions/addons/${MCP_ADDON_KEY}/status`;

export const DEFAULT_MCP_URL = "https://mcp.lawanalytics.app/mcp";
