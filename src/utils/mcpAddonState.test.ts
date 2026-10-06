import { describe, expect, it } from "vitest";

import type { McpAccess } from "hooks/useMcpAccess";
import type { PublicAddon } from "store/reducers/ApiService";
import { deriveMcpAddonFallback, mcpUserState, normalizeMcpAddonStatus, resolveMcpCta, type FallbackInput } from "./mcpAddonState";
import { getUpgradeReasonCopy } from "./mcpUpgradeReasons";

const publicAddon: PublicAddon = {
	key: "mcp_access",
	displayName: "MCP",
	description: "",
	priceMonthly: 10,
	currency: "usd",
	interval: "month",
	available: true,
	requiredPlans: ["standard", "pro", "premium"],
	requiresIntegrationsAny: ["claudeAi", "chatGpt"],
};

const provider = (over: Partial<McpAccess["providers"]["claude"]> = {}) => ({
	available: true,
	reason: null,
	message: null,
	publicEnabled: true,
	...over,
});

const access = (planAllowed: boolean, planReason: string | null, prov = provider()): McpAccess => ({
	mcpUrl: "https://mcp.lawanalytics.app/mcp",
	providers: { claude: prov, chatgpt: prov },
	plan: { allowed: planAllowed, reason: planReason, upgradeUrl: "/plans" },
});

const input = (over: Partial<FallbackInput>): FallbackInput => ({
	publicAddon,
	subscription: { plan: "standard", status: "active", addons: [] },
	isTeamMember: false,
	access: access(false, "addon_missing"),
	publicIntegrationsOpen: true,
	...over,
});

/** Respuesta real del hub (`getAddonStatusForUser`, branch fix/mcp-addon-purchase). */
const hub = (over: Record<string, unknown> = {}) => ({
	success: true,
	addon: {
		key: "mcp_access",
		displayName: "Conector de IA",
		description: null,
		price: { amount: 10, currency: "usd", interval: "month" },
		requiredPlans: ["standard", "premium"],
		status: "none",
		plan: "standard",
		subscriptionStatus: "active",
		eligible: true,
		eligibilityReason: null,
		publicAvailable: true,
		availabilityReason: null,
		maintenanceMessage: null,
		adminBypass: false,
		purchasable: true,
		canRemove: false,
		nextBillingDate: null,
		endsAt: null,
		hasManualGrant: false,
		legal: {
			privacyVersion: "2026-10",
			privacyUrl: "/privacy-policy#conectores-ia",
			previouslyAcceptedVersion: null,
			acceptanceRequired: true,
		},
		...over,
	},
});

describe("normalizeMcpAddonStatus (contrato real del hub)", () => {
	it("pago sin add-on → purchasable, CTA activar, legal y mcpUrl fija", () => {
		const s = normalizeMcpAddonStatus(hub())!;
		expect(s).toMatchObject({
			status: "none",
			plan: "standard",
			eligible: true,
			purchasable: true,
			price: { amount: 10, currency: "usd", interval: "month" },
			legal: { privacyVersion: "2026-10", acceptanceRequired: true },
			mcpUrl: "https://mcp.lawanalytics.app/mcp",
			access: { allowed: false, via: null, reason: "addon_missing" },
		});
		expect(resolveMcpCta(s, true)).toBe("activate");
		expect(mcpUserState(s, true)).toBe("paid_no_addon");
	});

	it("acepta el objeto sin envoltorio", () => {
		expect(normalizeMcpAddonStatus(hub().addon)).toEqual(normalizeMcpAddonStatus(hub()));
	});

	it("activo → acceso por add-on y próximo cobro", () => {
		const s = normalizeMcpAddonStatus(
			hub({ status: "active", purchasable: false, canRemove: true, nextBillingDate: "2026-11-06T12:00:00.000Z" }),
		)!;
		expect(s.access).toEqual({ allowed: true, via: "addon", reason: null });
		expect(s.nextBillingDate).toBe("2026-11-06T12:00:00.000Z");
		expect(s.canRemove).toBe(true);
		expect(resolveMcpCta(s, true)).toBe("connect");
		expect(mcpUserState(s, true)).toBe("has_addon");
	});

	it("canceling conserva el acceso hasta endsAt; incomplete pide actualizar el pago", () => {
		const canceling = normalizeMcpAddonStatus(
			hub({ status: "canceling", endsAt: "2026-11-06T12:00:00Z", eligible: false, eligibilityReason: "subscription_canceling" }),
		)!;
		expect(canceling.endsAt).toBe("2026-11-06T12:00:00.000Z");
		expect(resolveMcpCta(canceling, true)).toBe("connect");
		const incomplete = normalizeMcpAddonStatus(hub({ status: "incomplete", purchasable: false }))!;
		expect(incomplete.access.allowed).toBe(false);
		expect(resolveMcpCta(incomplete, true)).toBe("fix_payment");
	});

	it("baja programada del add-on → canceling reactivable, sin quitar, con acceso hasta endsAt", () => {
		const s = normalizeMcpAddonStatus(
			hub({
				status: "canceling",
				purchasable: false,
				canRemove: false,
				canReactivate: true,
				cancellationSource: "addon",
				endsAt: "2026-11-06T12:00:00Z",
			}),
		)!;
		expect(s).toMatchObject({
			status: "canceling",
			cancellationSource: "addon",
			canReactivate: true,
			canRemove: false,
			endsAt: "2026-11-06T12:00:00.000Z",
			access: { allowed: true, via: "addon", reason: null },
		});
		expect(resolveMcpCta(s, true)).toBe("connect");
		expect(mcpUserState(s, true)).toBe("has_addon");
	});

	it("canceling por la suscripción (o hub viejo sin cancellationSource) → no reactivable desde el add-on", () => {
		const bySub = normalizeMcpAddonStatus(hub({ status: "canceling", cancellationSource: "subscription", canReactivate: false }))!;
		expect(bySub).toMatchObject({ cancellationSource: "subscription", canReactivate: false });
		const legacy = normalizeMcpAddonStatus(hub({ status: "canceling", canReactivate: true }))!;
		expect(legacy).toMatchObject({ cancellationSource: "subscription", canReactivate: false });
		const active = normalizeMcpAddonStatus(hub({ status: "active", canReactivate: true, cancellationSource: "addon" }))!;
		expect(active).toMatchObject({ cancellationSource: null, canReactivate: false });
	});

	it("motivos de elegibilidad → CTA", () => {
		const cta = (eligibilityReason: string, plan = "standard") =>
			resolveMcpCta(normalizeMcpAddonStatus(hub({ eligible: false, eligibilityReason, plan, purchasable: false }))!, true);
		expect(cta("paid_plan_required", "free")).toBe("upgrade");
		expect(cta("subscription_inactive")).toBe("fix_payment");
		expect(cta("subscription_canceling")).toBe("reactivate");
	});

	it("venta cerrada: beta_request sin grant, connect con grant, activar con adminBypass", () => {
		const closed = { publicAvailable: false, availabilityReason: "not_public", purchasable: false };
		expect(resolveMcpCta(normalizeMcpAddonStatus(hub(closed))!, true)).toBe("beta_request");
		const grant = normalizeMcpAddonStatus(hub({ ...closed, hasManualGrant: true, plan: "free" }))!;
		expect(grant.access).toEqual({ allowed: true, via: "beta_grant", reason: null });
		expect(resolveMcpCta(grant, true)).toBe("connect");
		expect(resolveMcpCta(normalizeMcpAddonStatus(hub({ ...closed, adminBypass: true, purchasable: true }))!, true)).toBe("activate");
	});

	it("mantenimiento corta a todos (también con grant)", () => {
		const s = normalizeMcpAddonStatus(
			hub({
				publicAvailable: false,
				availabilityReason: "maintenance",
				maintenanceMessage: "Volvemos 18 h",
				hasManualGrant: true,
				purchasable: false,
			}),
		)!;
		expect(s.access.allowed).toBe(false);
		expect(s.maintenanceMessage).toBe("Volvemos 18 h");
		expect(resolveMcpCta(s, true)).toBe("unavailable");
	});

	it("sin precio → no se ofrece la compra", () => {
		const s = normalizeMcpAddonStatus(hub({ price: null, purchasable: false }))!;
		expect(s.price.amount).toBeNull();
		expect(resolveMcpCta(s, true)).toBe("unavailable");
	});

	it("miembro de equipo sin add-on → team", () => {
		const s = normalizeMcpAddonStatus(hub(), { isTeamMember: true })!;
		expect(s.eligibilityReason).toBe("team_member");
		expect(s.purchasable).toBe(false);
		expect(resolveMcpCta(s, true)).toBe("team");
	});

	it("rechaza respuestas sin el shape mínimo (→ fallback)", () => {
		expect(normalizeMcpAddonStatus(null)).toBeNull();
		expect(normalizeMcpAddonStatus({ success: true })).toBeNull();
		expect(normalizeMcpAddonStatus({ status: "weird", eligible: true })).toBeNull();
		expect(normalizeMcpAddonStatus({ status: "none" })).toBeNull();
	});
});

describe("deriveMcpAddonFallback (hub sin el GET consolidado)", () => {
	it("pago sin add-on → elegible y comprable, sin legal (se consulta aparte)", () => {
		const s = deriveMcpAddonFallback(input({}));
		expect(s).toMatchObject({ status: "none", eligible: true, purchasable: true, legal: null, plan: "standard" });
		expect(resolveMcpCta(s, true)).toBe("activate");
	});

	it("plan gratuito → paid_plan_required", () => {
		const s = deriveMcpAddonFallback(input({ subscription: { plan: "free", status: "active" }, access: access(false, "plan_too_low") }));
		expect(s.eligibilityReason).toBe("paid_plan_required");
		expect(resolveMcpCta(s, true)).toBe("upgrade");
		expect(mcpUserState(s, true)).toBe("free");
	});

	it("add-on activo y suscripción cancelándose → canceling con endsAt", () => {
		const sub = {
			plan: "premium",
			status: "active",
			currentPeriodEnd: "2026-11-06T12:00:00.000Z",
			addons: [{ key: "mcp_access", status: "active" }],
		};
		const active = deriveMcpAddonFallback(input({ subscription: sub, access: access(true, "ok") }));
		expect(active).toMatchObject({ status: "active", nextBillingDate: "2026-11-06T12:00:00.000Z", canRemove: true });
		expect(resolveMcpCta(active, true)).toBe("connect");
		const canceling = deriveMcpAddonFallback(input({ subscription: { ...sub, cancelAtPeriodEnd: true }, access: access(true, "ok") }));
		expect(canceling).toMatchObject({
			status: "canceling",
			endsAt: "2026-11-06T12:00:00.000Z",
			canRemove: false,
			cancellationSource: "subscription",
			canReactivate: false,
		});
	});

	it("baja programada del add-on (addons[].cancelAtPeriodEnd) → canceling reactivable con endsAt = cancelAt", () => {
		const s = deriveMcpAddonFallback(
			input({
				subscription: {
					plan: "standard",
					status: "active",
					currentPeriodEnd: "2026-11-06T12:00:00.000Z",
					addons: [{ key: "mcp_access", status: "active", cancelAtPeriodEnd: true, cancelAt: "2026-11-07T00:00:00.000Z" }],
				},
				access: access(true, "ok"),
			}),
		);
		expect(s).toMatchObject({
			status: "canceling",
			cancellationSource: "addon",
			canReactivate: true,
			canRemove: false,
			nextBillingDate: null,
			endsAt: "2026-11-07T00:00:00.000Z",
		});
		expect(resolveMcpCta(s, true)).toBe("connect");
	});

	it("suscripción past_due → no se vende (subscription_inactive), como el hub", () => {
		const s = deriveMcpAddonFallback(input({ subscription: { plan: "standard", status: "past_due" } }));
		expect(s.eligibilityReason).toBe("subscription_inactive");
		expect(resolveMcpCta(s, true)).toBe("fix_payment");
	});

	it("grant beta con switches apagados → acceso beta, venta cerrada", () => {
		const s = deriveMcpAddonFallback(
			input({
				subscription: { plan: "free" },
				access: access(true, "manual_grant", provider({ publicEnabled: false })),
				publicIntegrationsOpen: false,
			}),
		);
		expect(s).toMatchObject({ publicAvailable: false, availabilityReason: "not_public", hasManualGrant: true });
		expect(s.access.via).toBe("beta_grant");
		expect(resolveMcpCta(s, true)).toBe("connect");
	});

	it("beta cerrada sin grant → beta_request", () => {
		const prov = provider({ available: false, reason: "beta_grant_required", publicEnabled: false });
		const s = deriveMcpAddonFallback(input({ access: access(false, "addon_missing", prov), publicIntegrationsOpen: false }));
		expect(s.purchasable).toBe(false);
		expect(resolveMcpCta(s, true)).toBe("beta_request");
	});

	it("miembro de equipo → team", () => {
		expect(resolveMcpCta(deriveMcpAddonFallback(input({ isTeamMember: true })), true)).toBe("team");
	});
});

describe("resolveMcpCta", () => {
	it("anónimo → register; sin estado → unavailable", () => {
		expect(resolveMcpCta(null, false)).toBe("register");
		expect(resolveMcpCta(null, true)).toBe("unavailable");
		expect(mcpUserState(null, false)).toBe("anonymous");
	});
});

describe("getUpgradeReasonCopy", () => {
	it("tiene copy específico para cada reason real", () => {
		const reasons = [
			"plan_too_low",
			"no_subscription",
			"addon_missing",
			"addon_past_due",
			"addon_status_invalid",
			"subscription_inactive",
			"account_suspended",
			"user_inactive",
			"beta_grant_required",
			"maintenance",
		];
		const generic = getUpgradeReasonCopy("algo_raro", null).title;
		for (const r of reasons) expect(getUpgradeReasonCopy(r, "standard").title).not.toBe(generic);
	});

	it("addon_missing activa el add-on en el lugar; subscription_inactive va al pago con el status", () => {
		expect(getUpgradeReasonCopy("addon_missing", "standard").action).toEqual({ kind: "activate_addon" });
		const inactive = getUpgradeReasonCopy("subscription_inactive", "standard", "unpaid");
		expect(inactive.action).toEqual({ kind: "billing" });
		expect(inactive.body).toContain("impaga");
	});

	it("con grant beta no muestra 'manual_grant' como plan", () => {
		expect(getUpgradeReasonCopy("plan_too_low", "manual_grant").body).toContain("Gratis");
	});
});
