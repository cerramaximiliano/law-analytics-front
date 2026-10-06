/**
 * Lógica pura del add-on "Conectores de IA" (mcp_access): normaliza la respuesta
 * del GET consolidado, arma el mismo estado desde los endpoints viejos cuando el
 * consolidado no existe, y decide qué CTA corresponde en cada pantalla.
 *
 * Sin React ni red: lo testea utils/mcpAddonState.test.ts.
 */

import type { McpAccess } from "hooks/useMcpAccess";
import type { PublicAddon } from "store/reducers/ApiService";
import {
	DEFAULT_MCP_URL,
	MCP_ADDON_KEY,
	type McpAddonBillingStatus,
	type McpAddonIneligibleReason,
	type McpAddonStatus,
} from "types/mcpAddon";

export const MCP_ADDON_NAME = "Conectores de IA";
/** Ancla de la tarjeta del add-on en /plans (`/plans#conectores-ia`). */
export const MCP_ADDON_ANCHOR = "conectores-ia";
export const MCP_ADDON_PLANS_URL = `/plans#${MCP_ADDON_ANCHOR}`;
export const MCP_ADDON_REQUIRED_PLANS = ["standard", "pro", "premium"];

/** Lo que el add-on permite, en una línea por punto (tarjetas y diálogo). */
export const MCP_ADDON_BENEFITS: string[] = [
	"Consultá tus carpetas, movimientos y documentos desde el chat",
	"Agenda, tareas, calculadoras y contactos de tu cuenta y tus equipos",
	"Búsqueda de jurisprudencia con acceso al texto de los fallos",
	"Solo lectura: el asistente no puede crear, modificar ni borrar nada",
];

const BLOCKING_SUBSCRIPTION_STATUSES = new Set(["unpaid", "canceled", "incomplete", "incomplete_expired", "paused"]);
const BILLING_STATUSES: McpAddonBillingStatus[] = ["none", "active", "past_due", "canceling"];

const PLAN_LABELS: Record<string, string> = { free: "Gratis", standard: "Estándar", pro: "Pro", premium: "Premium" };
export const planLabel = (plan: string | null | undefined): string => (plan ? PLAN_LABELS[plan] || plan : "Gratis");

// ───────────────────────── Fallback (sin endpoint consolidado) ─────────────────────────

/** Subconjunto de la suscripción (`/api/subscriptions/current`) que usa el fallback. */
export interface SubscriptionLike {
	plan?: string | null;
	status?: string | null;
	accountStatus?: string | null;
	cancelAtPeriodEnd?: boolean | null;
	currentPeriodEnd?: string | Date | null;
	addons?: Array<{ key?: string; status?: string; currentPeriodEnd?: string | Date | null }> | null;
}

export interface FallbackInput {
	publicAddon: PublicAddon | null;
	/** Suscripción PROPIA del usuario (no la heredada del equipo). */
	subscription: SubscriptionLike | null;
	/** Miembro (no titular) de un equipo. */
	isTeamMember: boolean;
	/** `/api/connected-apps/access` — null si no respondió. */
	access: McpAccess | null;
	/** Switches públicos (IntegrationsConfig) por si `access` no respondió. */
	publicIntegrationsOpen: boolean;
}

const toIso = (d: string | Date | null | undefined): string | null => {
	if (!d) return null;
	const date = d instanceof Date ? d : new Date(d);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export function deriveMcpAddonFallback(input: FallbackInput): McpAddonStatus {
	const { publicAddon, subscription, isTeamMember, access } = input;
	const plan = subscription?.plan || "free";
	const addon = (subscription?.addons || []).find((a) => a?.key === MCP_ADDON_KEY) || null;

	let status: McpAddonBillingStatus = "none";
	if (addon?.status === "active") {
		status = subscription?.cancelAtPeriodEnd ? "canceling" : subscription?.status === "past_due" ? "past_due" : "active";
	} else if (addon?.status === "past_due" || addon?.status === "incomplete") {
		status = "past_due";
	}

	const periodEnd = toIso(addon?.currentPeriodEnd) || toIso(subscription?.currentPeriodEnd);
	const publicOpen = access
		? access.providers.claude.publicEnabled || access.providers.chatgpt.publicEnabled
		: input.publicIntegrationsOpen;

	const planReason = access?.plan.reason || null;
	let reason: McpAddonIneligibleReason = null;
	if (isTeamMember) reason = "team_member";
	else if (!MCP_ADDON_REQUIRED_PLANS.includes(plan)) reason = "plan_too_low";
	else if (planReason === "account_suspended" || subscription?.accountStatus === "suspended") reason = "account_suspended";
	else if (planReason === "subscription_inactive" || BLOCKING_SUBSCRIPTION_STATUSES.has(subscription?.status || ""))
		reason = "subscription_inactive";
	else if (status === "none" && (!publicOpen || (publicAddon !== null && !publicAddon.available))) reason = "not_for_sale";

	const anyProvider = !!access && (access.providers.claude.available || access.providers.chatgpt.available);
	const allowed = access ? anyProvider && access.plan.allowed : status !== "none";
	const via: McpAddonStatus["access"]["via"] = !allowed ? null : planReason === "manual_grant" ? "beta_grant" : "addon";
	const providerReason = access && !anyProvider ? access.providers.claude.reason || access.providers.chatgpt.reason : null;

	return {
		key: MCP_ADDON_KEY,
		price: {
			amount: publicAddon?.priceMonthly ?? null,
			currency: publicAddon?.currency || "usd",
			interval: publicAddon?.interval || "month",
		},
		status,
		nextChargeAt: status === "active" || status === "past_due" ? periodEnd : null,
		cancelAt: status === "canceling" ? periodEnd : null,
		// El hub hoy borra el item de Stripe en el momento (subscriptionItems.del con prorrateo).
		cancelBehavior: "immediate",
		eligibility: {
			eligible: reason === null,
			reason,
			requiredPlans: publicAddon?.requiredPlans?.length ? publicAddon.requiredPlans : MCP_ADDON_REQUIRED_PLANS,
			currentPlan: subscription ? plan : null,
		},
		publicOpen,
		access: { allowed, via, reason: allowed ? null : providerReason || planReason },
		mcpUrl: access?.mcpUrl || DEFAULT_MCP_URL,
	};
}

// ───────────────────────── Normalización del endpoint consolidado ─────────────────────────

/** Valida y completa la respuesta del GET consolidado. null si no tiene el shape mínimo (→ fallback). */
export function normalizeMcpAddonStatus(raw: unknown): McpAddonStatus | null {
	if (!raw || typeof raw !== "object") return null;
	const body = raw as Record<string, any>;
	const a = (body.addon && typeof body.addon === "object" ? body.addon : body) as Record<string, any>;
	if (!BILLING_STATUSES.includes(a.status) || !a.eligibility || typeof a.eligibility !== "object") return null;

	const price = a.price && typeof a.price === "object" ? a.price : {};
	const eligibility = a.eligibility;
	const access = a.access && typeof a.access === "object" ? a.access : {};
	return {
		key: MCP_ADDON_KEY,
		price: {
			amount: typeof price.amount === "number" ? price.amount : null,
			currency: typeof price.currency === "string" ? price.currency.toLowerCase() : "usd",
			interval: typeof price.interval === "string" ? price.interval : "month",
		},
		status: a.status,
		nextChargeAt: toIso(a.nextChargeAt),
		cancelAt: toIso(a.cancelAt),
		cancelBehavior: a.cancelBehavior === "period_end" ? "period_end" : "immediate",
		eligibility: {
			eligible: eligibility.eligible === true,
			reason: eligibility.eligible === true ? null : eligibility.reason || "plan_too_low",
			requiredPlans: Array.isArray(eligibility.requiredPlans) ? eligibility.requiredPlans : MCP_ADDON_REQUIRED_PLANS,
			currentPlan: typeof eligibility.currentPlan === "string" ? eligibility.currentPlan : null,
		},
		publicOpen: a.publicOpen === true,
		access: {
			allowed: access.allowed === true,
			via: access.via === "addon" || access.via === "beta_grant" ? access.via : null,
			reason: typeof access.reason === "string" ? access.reason : null,
		},
		mcpUrl: typeof a.mcpUrl === "string" && a.mcpUrl ? a.mcpUrl : DEFAULT_MCP_URL,
	};
}

// ───────────────────────── CTA ─────────────────────────

export type McpCtaKind =
	/** Sin sesión: crear cuenta / iniciar sesión. */
	| "register"
	/** Plan gratuito: mejorar plan. */
	| "upgrade"
	/** Puede contratarlo: abrir el diálogo de alta. */
	| "activate"
	/** Ya tiene acceso (add-on o grant beta): ir a la guía de conexión. */
	| "connect"
	/** Suscripción impaga o cuenta suspendida: actualizar el pago. */
	| "fix_payment"
	/** Miembro de equipo: lo contrata el titular. */
	| "team"
	/** Beta cerrada sin grant: pedir acceso. */
	| "beta_request"
	/** Tiene el add-on pero hoy no puede usarlo (mantenimiento) o todavía no sabemos el estado. */
	| "unavailable";

export function resolveMcpCta(state: McpAddonStatus | null, isLoggedIn: boolean): McpCtaKind {
	if (!isLoggedIn) return "register";
	if (!state) return "unavailable";
	if (state.access.allowed) return "connect";
	switch (state.eligibility.reason) {
		case "subscription_inactive":
		case "account_suspended":
			return "fix_payment";
		case "team_member":
			return "team";
		case "plan_too_low":
		case "no_subscription":
			return "upgrade";
		case "not_for_sale":
			return "beta_request";
		default:
			return state.status === "none" ? "activate" : "unavailable";
	}
}

/** Texto del botón principal por tipo de CTA. */
export const MCP_CTA_LABELS: Record<McpCtaKind, string> = {
	register: "Crear cuenta",
	upgrade: "Mejorar mi plan",
	activate: `Activar ${MCP_ADDON_NAME}`,
	connect: "Conectar mi asistente",
	fix_payment: "Actualizar el pago",
	team: "Lo activa el titular del equipo",
	beta_request: "Solicitar acceso beta",
	unavailable: "Ver estado",
};

/**
 * `user_state` del evento `mcp_plans_cta_click` (la-ads tracking-map): anonymous | free | paid_no_addon | has_addon.
 * Se mantienen exactamente esos cuatro valores para no romper el mapa de GTM.
 */
export function mcpUserState(state: McpAddonStatus | null, isLoggedIn: boolean): "anonymous" | "free" | "paid_no_addon" | "has_addon" {
	if (!isLoggedIn) return "anonymous";
	if (state && (state.status !== "none" || state.access.allowed)) return "has_addon";
	if (state && MCP_ADDON_REQUIRED_PLANS.includes(state.eligibility.currentPlan || "")) return "paid_no_addon";
	return "free";
}

/** "6 de noviembre" / "6 de noviembre de 2027" si no es este año. */
export function formatAddonDate(iso: string | null): string | null {
	if (!iso) return null;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return null;
	const sameYear = d.getFullYear() === new Date().getFullYear();
	return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", ...(sameYear ? {} : { year: "numeric" }) });
}
