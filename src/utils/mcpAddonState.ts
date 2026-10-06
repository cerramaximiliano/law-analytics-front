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
	type McpAddonAvailabilityReason,
	type McpAddonBillingStatus,
	type McpAddonCancellationSource,
	type McpAddonEligibilityReason,
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

/** Estados de Stripe en los que el hub vende el add-on (mcpAddonStatusService.SELLABLE_SUBSCRIPTION_STATUSES). */
const SELLABLE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const BILLING_STATUSES: McpAddonBillingStatus[] = ["none", "active", "past_due", "incomplete", "canceling"];
const ELIGIBILITY_REASONS = new Set(["paid_plan_required", "subscription_inactive", "subscription_canceling"]);
const AVAILABILITY_REASONS = new Set(["not_public", "maintenance", "config_unavailable"]);
/** Estados del add-on con acceso (past_due en gracia, canceling hasta endsAt). */
const ACCESS_STATUSES = new Set<McpAddonBillingStatus>(["active", "past_due", "canceling"]);

const PLAN_LABELS: Record<string, string> = { free: "Gratis", standard: "Estándar", pro: "Pro", premium: "Premium" };
export const planLabel = (plan: string | null | undefined): string => (plan ? PLAN_LABELS[plan] || plan : "Gratis");

const toIso = (d: unknown): string | null => {
	if (!d || (typeof d !== "string" && !(d instanceof Date))) return null;
	const date = d instanceof Date ? d : new Date(d);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/**
 * Acceso efectivo derivado del GET consolidado (que no lo trae): mismo criterio que el
 * consent — mantenimiento corta a todos; con la venta cerrada (beta) solo el grant;
 * abierta, el grant o un add-on con acceso.
 */
export function deriveAccess(a: {
	status: McpAddonBillingStatus;
	hasManualGrant: boolean;
	publicAvailable: boolean;
	availabilityReason: McpAddonAvailabilityReason;
}): McpAddonStatus["access"] {
	if (a.availabilityReason === "maintenance") return { allowed: false, via: null, reason: "maintenance" };
	if (a.hasManualGrant) return { allowed: true, via: "beta_grant", reason: null };
	if (!a.publicAvailable) return { allowed: false, via: null, reason: "beta_grant_required" };
	if (ACCESS_STATUSES.has(a.status)) return { allowed: true, via: "addon", reason: null };
	return { allowed: false, via: null, reason: a.status === "incomplete" ? "addon_status_invalid" : "addon_missing" };
}

// ───────────────────────── Normalización del GET consolidado ─────────────────────────

/** Valida y completa `{ success, addon }` del hub. null si no tiene el shape mínimo (→ fallback). */
export function normalizeMcpAddonStatus(raw: unknown, opts: { isTeamMember?: boolean } = {}): McpAddonStatus | null {
	if (!raw || typeof raw !== "object") return null;
	const body = raw as Record<string, any>;
	const a = (body.addon && typeof body.addon === "object" ? body.addon : body) as Record<string, any>;
	if (!BILLING_STATUSES.includes(a.status) || typeof a.eligible !== "boolean") return null;

	const price = a.price && typeof a.price === "object" && typeof a.price.amount === "number" ? a.price : null;
	const status = a.status as McpAddonBillingStatus;
	const publicAvailable = a.publicAvailable === true;
	const availabilityReason: McpAddonAvailabilityReason = AVAILABILITY_REASONS.has(a.availabilityReason) ? a.availabilityReason : null;
	const hasManualGrant = a.hasManualGrant === true;
	let eligibilityReason: McpAddonEligibilityReason = a.eligible
		? null
		: ELIGIBILITY_REASONS.has(a.eligibilityReason)
		? a.eligibilityReason
		: "paid_plan_required";
	// El add-on lo contrata el titular: un miembro de equipo no compra desde su cuenta.
	if (opts.isTeamMember && status === "none") eligibilityReason = "team_member";
	const legal = a.legal && typeof a.legal === "object" ? a.legal : null;
	// Hub previo a la baja programada: canceling solo podía venir de la suscripción.
	const cancellationSource: McpAddonCancellationSource =
		status !== "canceling" ? null : a.cancellationSource === "addon" ? "addon" : "subscription";

	return {
		key: MCP_ADDON_KEY,
		price: price
			? { amount: price.amount, currency: String(price.currency || "usd").toLowerCase(), interval: price.interval || "month" }
			: { amount: null, currency: "usd", interval: "month" },
		status,
		plan: typeof a.plan === "string" ? a.plan : "free",
		subscriptionStatus: typeof a.subscriptionStatus === "string" ? a.subscriptionStatus : null,
		eligible: eligibilityReason === null,
		eligibilityReason,
		requiredPlans: Array.isArray(a.requiredPlans) && a.requiredPlans.length ? a.requiredPlans : MCP_ADDON_REQUIRED_PLANS,
		publicAvailable,
		availabilityReason,
		maintenanceMessage: typeof a.maintenanceMessage === "string" && a.maintenanceMessage ? a.maintenanceMessage : null,
		adminBypass: a.adminBypass === true,
		purchasable: a.purchasable === true && eligibilityReason === null,
		canRemove: a.canRemove === true && status !== "canceling",
		canReactivate: status === "canceling" && cancellationSource === "addon" && a.canReactivate === true,
		cancellationSource,
		nextBillingDate: toIso(a.nextBillingDate),
		endsAt: toIso(a.endsAt),
		hasManualGrant,
		legal: legal
			? {
					privacyVersion: typeof legal.privacyVersion === "string" && legal.privacyVersion ? legal.privacyVersion : null,
					privacyUrl: typeof legal.privacyUrl === "string" && legal.privacyUrl ? legal.privacyUrl : "/privacy-policy#conectores-ia",
					previouslyAcceptedVersion: typeof legal.previouslyAcceptedVersion === "string" ? legal.previouslyAcceptedVersion : null,
					acceptanceRequired: legal.acceptanceRequired === true,
			  }
			: null,
		access: deriveAccess({ status, hasManualGrant, publicAvailable, availabilityReason }),
		mcpUrl: DEFAULT_MCP_URL,
	};
}

// ───────────────────────── Fallback (sin endpoint consolidado) ─────────────────────────

/** Subconjunto de la suscripción (`/api/subscriptions/current`) que usa el fallback. */
export interface SubscriptionLike {
	plan?: string | null;
	status?: string | null;
	accountStatus?: string | null;
	cancelAtPeriodEnd?: boolean | null;
	currentPeriodEnd?: string | Date | null;
	addons?: Array<{
		key?: string;
		status?: string;
		currentPeriodEnd?: string | Date | null;
		/** Baja programada del add-on (hub: addons[].cancelAtPeriodEnd / cancelAt). */
		cancelAtPeriodEnd?: boolean | null;
		cancelAt?: string | Date | null;
	}> | null;
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

/** Arma el modelo con los endpoints viejos, replicando las reglas de mcpAddonStatusService. */
export function deriveMcpAddonFallback(input: FallbackInput): McpAddonStatus {
	const { publicAddon, subscription, isTeamMember, access } = input;
	const plan = subscription?.plan || "free";
	const addon = (subscription?.addons || []).find((a) => a?.key === MCP_ADDON_KEY && a.status !== "canceled") || null;

	let status: McpAddonBillingStatus = "none";
	let cancellationSource: McpAddonCancellationSource = null;
	if (addon) {
		if (subscription?.cancelAtPeriodEnd) {
			status = "canceling";
			cancellationSource = "subscription";
		} else if (addon.cancelAtPeriodEnd) {
			status = "canceling";
			cancellationSource = "addon";
		} else if (addon.status === "past_due") status = "past_due";
		else if (addon.status === "incomplete") status = "incomplete";
		else status = "active";
	}

	const periodEnd = toIso(addon?.currentPeriodEnd) || toIso(subscription?.currentPeriodEnd);
	const endsAt =
		status !== "canceling"
			? null
			: cancellationSource === "addon"
			? toIso(addon?.cancelAt) || periodEnd
			: toIso(subscription?.currentPeriodEnd) || periodEnd;
	const maintenance = !!access && !!(access.providers.claude.reason === "maintenance" || access.providers.chatgpt.reason === "maintenance");
	const anyPublic = access ? access.providers.claude.publicEnabled || access.providers.chatgpt.publicEnabled : input.publicIntegrationsOpen;
	const availabilityReason: McpAddonAvailabilityReason = maintenance ? "maintenance" : anyPublic ? null : "not_public";
	const publicAvailable = availabilityReason === null;

	let eligibilityReason: McpAddonEligibilityReason = null;
	if (isTeamMember && status === "none") eligibilityReason = "team_member";
	else if (!MCP_ADDON_REQUIRED_PLANS.includes(plan)) eligibilityReason = "paid_plan_required";
	else if (subscription?.status && !SELLABLE_SUBSCRIPTION_STATUSES.has(subscription.status)) eligibilityReason = "subscription_inactive";
	else if (subscription?.cancelAtPeriodEnd) eligibilityReason = "subscription_canceling";

	const priceAmount = publicAddon?.priceMonthly ?? null;
	const hasManualGrant = access?.plan.reason === "manual_grant";
	const anyProvider = !!access && (access.providers.claude.available || access.providers.chatgpt.available);
	const accessInfo: McpAddonStatus["access"] = access
		? anyProvider && access.plan.allowed
			? { allowed: true, via: hasManualGrant ? "beta_grant" : "addon", reason: null }
			: {
					allowed: false,
					via: null,
					reason: !anyProvider ? access.providers.claude.reason || access.providers.chatgpt.reason : access.plan.reason,
			  }
		: deriveAccess({ status, hasManualGrant: false, publicAvailable, availabilityReason });

	return {
		key: MCP_ADDON_KEY,
		price: { amount: priceAmount, currency: publicAddon?.currency || "usd", interval: publicAddon?.interval || "month" },
		status,
		plan,
		subscriptionStatus: subscription?.status || null,
		eligible: eligibilityReason === null,
		eligibilityReason,
		requiredPlans: publicAddon?.requiredPlans?.length ? publicAddon.requiredPlans : MCP_ADDON_REQUIRED_PLANS,
		publicAvailable,
		availabilityReason,
		maintenanceMessage: maintenance ? access?.providers.claude.message || access?.providers.chatgpt.message || null : null,
		adminBypass: false,
		purchasable: status === "none" && eligibilityReason === null && publicAvailable && priceAmount !== null,
		canRemove: status !== "none" && status !== "canceling",
		canReactivate: cancellationSource === "addon",
		cancellationSource,
		nextBillingDate: status === "active" || status === "past_due" ? periodEnd : null,
		endsAt,
		hasManualGrant,
		legal: null,
		access: accessInfo,
		mcpUrl: access?.mcpUrl || DEFAULT_MCP_URL,
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
	/** Suscripción con pago pendiente / inactiva o add-on incompleto: actualizar el pago. */
	| "fix_payment"
	/** Suscripción programada para cancelarse: reactivarla antes de sumar el add-on. */
	| "reactivate"
	/** Miembro de equipo: lo contrata el titular. */
	| "team"
	/** Beta cerrada sin grant: pedir acceso. */
	| "beta_request"
	/** Mantenimiento, sin precio o todavía sin estado. */
	| "unavailable";

export function resolveMcpCta(state: McpAddonStatus | null, isLoggedIn: boolean): McpCtaKind {
	if (!isLoggedIn) return "register";
	if (!state) return "unavailable";
	if (state.access.allowed) return "connect";
	if (state.availabilityReason === "maintenance") return "unavailable";
	if (state.status !== "none") return state.status === "incomplete" || state.status === "past_due" ? "fix_payment" : "unavailable";
	switch (state.eligibilityReason) {
		case "team_member":
			return "team";
		case "paid_plan_required":
			return "upgrade";
		case "subscription_inactive":
			return "fix_payment";
		case "subscription_canceling":
			return "reactivate";
		default:
			if (!state.publicAvailable && !state.adminBypass) return "beta_request";
			return state.purchasable ? "activate" : "unavailable";
	}
}

/** Texto del botón principal por tipo de CTA. */
export const MCP_CTA_LABELS: Record<McpCtaKind, string> = {
	register: "Crear cuenta",
	upgrade: "Mejorar mi plan",
	activate: `Activar ${MCP_ADDON_NAME}`,
	connect: "Conectar mi asistente",
	fix_payment: "Actualizar el pago",
	reactivate: "Reactivar mi suscripción",
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
	if (state && MCP_ADDON_REQUIRED_PLANS.includes(state.plan)) return "paid_no_addon";
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
