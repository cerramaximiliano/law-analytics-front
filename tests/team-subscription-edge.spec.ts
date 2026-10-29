/**
 * BLOQUE 6 — Interacción Subscription + Team con la cuenta descartable `owner` (plan standard).
 *
 * Semántica vigente desde `db5a736` (6/10/2026, «downgrade solo programado»):
 *   - `POST /api/subscriptions/change-immediate` y `POST /api/subscriptions/schedule-change`
 *     sólo aceptan ids de planes pagos (`PAID_PLAN_PRODUCT_IDS`). Con `planId: "free"`
 *     responden 400 `INVALID_PLAN` antes de cualquier chequeo de equipo: ya no son la vía
 *     para bajar a free.
 *   - La baja a free pasa por `POST /api/subscriptions/cancel` (`downgradeToFreePlan` /
 *     `cancelSubscription` del servicio), que con un equipo activo del que el usuario es
 *     propietario responde 409 `TEAM_DOWNGRADE_BLOCKED`.
 *
 * **⚠️ Riesgo y mitigación:**
 * El happy path esperado es que el backend RECHACE (400 o 409). Si alguna de estas llamadas
 * respondiera 2xx con un equipo activo, es un bug crítico: se anota y se intenta revertir.
 * Las cuentas sembradas por `seedE2EAccounts.js` no tienen suscripción en Stripe
 * (`stripeSubscriptionId` vacío): `/cancel` falla antes de llegar al chequeo de equipo con
 * «No hay una suscripción activa para cancelar» → ese test se omite con el motivo.
 *
 * GRUPO 1 — change-immediate a free con team activo → 400 INVALID_PLAN (no es vía de downgrade)
 * GRUPO 2 — la subscription del owner sigue siendo "standard"
 * GRUPO 3 — schedule-change a free con team activo → 400 INVALID_PLAN
 * GRUPO 4 — /cancel con team activo → 409 TEAM_DOWNGRADE_BLOCKED (skip sin Stripe)
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams } from "./helpers/multi-user";

const API = process.env.E2E_API_URL || "http://localhost:5000";
const makeTeamName = () => `E2E-SubEdge-${Date.now()}`;

async function createTeamAsOwner(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, {
			data: { name, description: "E2E subscription edge" },
		});
		if (!res.ok()) throw new Error(`Create team failed: ${res.status()}`);
		const body = await res.json();
		return body.group?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

/** Garantiza que el owner tenga al menos un team activo (precondición de todos los grupos). */
async function ensureOwnerHasTeam(): Promise<void> {
	const listCtx = await apiAsUser("owner");
	let teamCount = 0;
	try {
		const teamsRes = await listCtx.get(`${API}/api/groups`);
		const body = await teamsRes.json();
		teamCount = body.groups?.length ?? 0;
	} finally {
		await listCtx.dispose();
	}
	if (teamCount === 0) {
		await createTeamAsOwner(makeTeamName());
	}
}

test.beforeAll(async () => {
	// Estado limpio
	await deleteAllOwnedTeams("owner");
	await new Promise((r) => setTimeout(r, 500));
});

test.afterAll(async () => {
	// Cleanup final
	await deleteAllOwnedTeams("owner");
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — change-immediate a free con team activo → 400 INVALID_PLAN
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — owner standard con team activo intenta change-immediate a free → 400 INVALID_PLAN", async () => {
	test.setTimeout(45_000);

	// 1) Crear team como owner (standard)
	const teamId = await createTeamAsOwner(makeTeamName());
	expect(teamId).toBeTruthy();

	// 2) Intentar downgrade a free por la vía inmediata → el backend la rechaza
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/subscriptions/change-immediate`, {
			data: { planId: "free" },
		});

		if (res.status() >= 400) {
			// Desde db5a736 el servicio sólo acepta planes pagos: 400 INVALID_PLAN.
			expect(res.status()).toBe(400);
			const body = await res.json();
			expect(body.success).toBe(false);
			expect(body.code).toBe("INVALID_PLAN");
		} else {
			// Inesperado: backend permitió downgrade → bug crítico
			test.info().annotations.push({
				type: "critical-backend-bug",
				description: `Backend permitió change-immediate a free con team activo. Status: ${res.status()}`,
			});
			await ctx.post(`${API}/api/subscriptions/cancel-downgrade`).catch(() => {});
			throw new Error("Backend permitió downgrade con team activo — violación de diseño TEAM_DOWNGRADE_BLOCKED");
		}
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Validación adicional: la subscription sigue siendo "standard"
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — subscription del owner sigue siendo 'standard' tras intento fallido", async () => {
	// Precondición: GRUPO 1 del archivo ejecutó un intento de downgrade.
	// Verificamos que el plan sigue siendo standard (no se perdió).
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.get(`${API}/api/subscriptions/current`);
		expect(res.ok()).toBe(true);
		const body = await res.json();
		const plan = body.subscription?.plan;
		expect(plan).toBe("standard");
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — schedule-change a free → 400 INVALID_PLAN
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — schedule-change a free con team activo → 400 INVALID_PLAN", async () => {
	test.setTimeout(30_000);
	await ensureOwnerHasTeam();

	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/subscriptions/schedule-change`, {
			data: { planId: "free" },
		});

		if (res.status() >= 400) {
			// Mismo filtro de planes pagos que change-immediate (db5a736).
			expect(res.status()).toBe(400);
			const body = await res.json();
			expect(body.code).toBe("INVALID_PLAN");
			expect(body.success).toBe(false);
		} else {
			// Inmediatamente revertimos el schedule
			await ctx.post(`${API}/api/subscriptions/cancel-downgrade`).catch(() => {});
			test.info().annotations.push({
				type: "critical-backend-bug",
				description: `schedule-change aceptó free con team activo (status ${res.status()}). Revertido.`,
			});
			throw new Error("Backend programó downgrade a free con team activo — violación de diseño TEAM_DOWNGRADE_BLOCKED");
		}
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — /cancel con team activo → 409 TEAM_DOWNGRADE_BLOCKED
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — /cancel con team activo → 409 TEAM_DOWNGRADE_BLOCKED", async () => {
	test.setTimeout(30_000);
	await ensureOwnerHasTeam();

	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/subscriptions/cancel`, { data: {} });
		const body = await res.json().catch(() => ({}));

		// Las cuentas sembradas no tienen suscripción en Stripe: el servicio corta antes del
		// chequeo de equipo. No es un fallo del producto; sin Stripe de prueba no se puede cubrir.
		const sinStripe = res.status() === 500 && /No hay una suscripción activa para cancelar/i.test(String(body.error ?? body.message ?? ""));
		test.skip(sinStripe, "La cuenta owner sembrada no tiene stripeSubscriptionId: /cancel no llega al chequeo de equipo");

		if (res.status() >= 400) {
			expect(res.status()).toBe(409);
			expect(body.success).toBe(false);
			expect(body.code).toBe("TEAM_DOWNGRADE_BLOCKED");
			expect(body.message).toMatch(/equipo/i);
		} else {
			test.info().annotations.push({
				type: "critical-backend-bug",
				description: `Backend aceptó /cancel con team activo. Status: ${res.status()}`,
			});
			throw new Error("Backend permitió cancelar la suscripción con team activo — violación de diseño TEAM_DOWNGRADE_BLOCKED");
		}
	} finally {
		await ctx.dispose();
	}
});
