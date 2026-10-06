import { describe, expect, it } from "vitest";

import type { McpAccess } from "hooks/useMcpAccess";
import { normalizeAddAddonResponse, type PublicAddon } from "store/reducers/ApiService";
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

describe("deriveMcpAddonFallback", () => {
	it("pago sin add-on → elegible, status none, CTA activar", () => {
		const s = deriveMcpAddonFallback(input({}));
		expect(s.status).toBe("none");
		expect(s.eligibility).toMatchObject({ eligible: true, reason: null, currentPlan: "standard" });
		expect(s.price).toEqual({ amount: 10, currency: "usd", interval: "month" });
		expect(resolveMcpCta(s, true)).toBe("activate");
		expect(mcpUserState(s, true)).toBe("paid_no_addon");
	});

	it("plan gratuito → plan_too_low y CTA mejorar plan", () => {
		const s = deriveMcpAddonFallback(input({ subscription: { plan: "free", status: "active" }, access: access(false, "plan_too_low") }));
		expect(s.eligibility.reason).toBe("plan_too_low");
		expect(resolveMcpCta(s, true)).toBe("upgrade");
		expect(mcpUserState(s, true)).toBe("free");
	});

	it("add-on activo → connect; con cancelAtPeriodEnd → canceling con fecha", () => {
		const sub = {
			plan: "premium",
			status: "active",
			currentPeriodEnd: "2026-11-06T00:00:00.000Z",
			addons: [{ key: "mcp_access", status: "active" }],
		};
		const active = deriveMcpAddonFallback(input({ subscription: sub, access: access(true, "ok") }));
		expect(active.status).toBe("active");
		expect(active.nextChargeAt).toBe("2026-11-06T00:00:00.000Z");
		expect(active.access).toEqual({ allowed: true, via: "addon", reason: null });
		expect(resolveMcpCta(active, true)).toBe("connect");
		expect(mcpUserState(active, true)).toBe("has_addon");

		const canceling = deriveMcpAddonFallback(input({ subscription: { ...sub, cancelAtPeriodEnd: true }, access: access(true, "ok") }));
		expect(canceling.status).toBe("canceling");
		expect(canceling.cancelAt).toBe("2026-11-06T00:00:00.000Z");
	});

	it("suscripción past_due con add-on → past_due (sigue con acceso, gracia C-BILLING)", () => {
		const s = deriveMcpAddonFallback(
			input({
				subscription: { plan: "standard", status: "past_due", addons: [{ key: "mcp_access", status: "active" }] },
				access: access(true, "ok"),
			}),
		);
		expect(s.status).toBe("past_due");
		expect(resolveMcpCta(s, true)).toBe("connect");
	});

	it("suscripción unpaid → subscription_inactive y CTA actualizar pago", () => {
		const s = deriveMcpAddonFallback(
			input({ subscription: { plan: "standard", status: "unpaid" }, access: access(false, "subscription_inactive") }),
		);
		expect(s.eligibility.reason).toBe("subscription_inactive");
		expect(resolveMcpCta(s, true)).toBe("fix_payment");
	});

	it("grant beta con switches apagados → acceso por beta_grant, no se vende", () => {
		const s = deriveMcpAddonFallback(
			input({
				subscription: { plan: "free" },
				access: access(true, "manual_grant", provider({ publicEnabled: false })),
				publicIntegrationsOpen: false,
			}),
		);
		expect(s.publicOpen).toBe(false);
		expect(s.access.via).toBe("beta_grant");
		expect(resolveMcpCta(s, true)).toBe("connect");
	});

	it("beta cerrada sin grant (plan pago) → not_for_sale y motivo beta_grant_required", () => {
		const prov = provider({ available: false, reason: "beta_grant_required", publicEnabled: false });
		const s = deriveMcpAddonFallback(input({ access: access(false, "addon_missing", prov), publicIntegrationsOpen: false }));
		expect(s.eligibility.reason).toBe("not_for_sale");
		expect(s.access.reason).toBe("beta_grant_required");
		expect(resolveMcpCta(s, true)).toBe("beta_request");
	});

	it("miembro de equipo → team", () => {
		const s = deriveMcpAddonFallback(input({ isTeamMember: true }));
		expect(resolveMcpCta(s, true)).toBe("team");
	});

	it("sin /access usa el estado del add-on de la suscripción", () => {
		const s = deriveMcpAddonFallback(
			input({ access: null, subscription: { plan: "standard", status: "active", addons: [{ key: "mcp_access", status: "active" }] } }),
		);
		expect(s.access.allowed).toBe(true);
		expect(s.mcpUrl).toBe("https://mcp.lawanalytics.app/mcp");
	});
});

describe("resolveMcpCta", () => {
	it("anónimo → register; sin estado → unavailable", () => {
		expect(resolveMcpCta(null, false)).toBe("register");
		expect(resolveMcpCta(null, true)).toBe("unavailable");
		expect(mcpUserState(null, false)).toBe("anonymous");
	});
});

describe("normalizeMcpAddonStatus", () => {
	it("acepta { addon } o el objeto pelado y completa defaults", () => {
		const raw = {
			status: "active",
			price: { amount: 12.5, currency: "USD" },
			eligibility: { eligible: true },
			access: { allowed: true, via: "addon" },
			publicOpen: true,
			nextChargeAt: "2026-11-06T00:00:00Z",
		};
		const a = normalizeMcpAddonStatus({ success: true, addon: raw });
		const b = normalizeMcpAddonStatus(raw);
		expect(a).toEqual(b);
		expect(a).toMatchObject({
			status: "active",
			price: { amount: 12.5, currency: "usd", interval: "month" },
			cancelBehavior: "immediate",
			mcpUrl: "https://mcp.lawanalytics.app/mcp",
			eligibility: { eligible: true, reason: null, requiredPlans: ["standard", "pro", "premium"] },
		});
	});

	it("rechaza respuestas sin el shape mínimo (→ fallback)", () => {
		expect(normalizeMcpAddonStatus(null)).toBeNull();
		expect(normalizeMcpAddonStatus({ success: true })).toBeNull();
		expect(normalizeMcpAddonStatus({ status: "weird", eligibility: {} })).toBeNull();
		expect(normalizeMcpAddonStatus({ status: "none" })).toBeNull();
	});

	it("no elegible sin reason → plan_too_low", () => {
		expect(normalizeMcpAddonStatus({ status: "none", eligibility: { eligible: false } })?.eligibility.reason).toBe("plan_too_low");
	});
});

describe("normalizeAddAddonResponse", () => {
	it("detecta requires_action en sus variantes", () => {
		expect(normalizeAddAddonResponse({ success: true, requires_action: true, client_secret: "pi_x", publishable_key: "pk" })).toMatchObject(
			{
				success: false,
				code: "REQUIRES_ACTION",
				clientSecret: "pi_x",
				publishableKey: "pk",
			},
		);
		expect(normalizeAddAddonResponse({ status: "requires_action", hosted_invoice_url: "https://inv" })).toMatchObject({
			code: "REQUIRES_ACTION",
			hostedInvoiceUrl: "https://inv",
		});
	});

	it("respeta éxito y códigos de negocio", () => {
		expect(normalizeAddAddonResponse({ success: true, addon: { key: "mcp_access", status: "active" } }).success).toBe(true);
		expect(normalizeAddAddonResponse({ success: false, code: "CARD_DECLINED" }).code).toBe("CARD_DECLINED");
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
