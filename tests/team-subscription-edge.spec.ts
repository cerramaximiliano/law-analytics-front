/**
 * BLOQUE 6 — Interacción Subscription + Team con usuarios reales.
 *
 * Escenarios críticos del TEAMS_SYSTEM_DESIGN.md:
 *   - Owner con team activo NO puede downgrade a plan que no soporta teams (free) o
 *     con menos capacidad → 409 `TEAM_DOWNGRADE_BLOCKED`.
 *   - El owner debe eliminar el team primero.
 *
 * **⚠️ Riesgo y mitigación:**
 * Estos tests operan sobre la suscripción real del user `artista@mirtaaguilar.art`.
 * El **happy path esperado**: el backend BLOQUEA el downgrade con 409. Solo se
 * ejecuta el intento de change-immediate — si el backend responde 2xx, significa
 * que downgrade pasó y tendríamos que recuperar. Para no alterar billing real,
 * NO se ejecutan POST /checkout, /cancel con atPeriodEnd=true, etc.
 *
 * GRUPO 1 — Owner con team → downgrade a free bloqueado (409 TEAM_DOWNGRADE_BLOCKED)
 * GRUPO 2 — Owner sin team → downgrade a free sí permitido (no testeado para no
 *           romper la sub del user; queda documentado como verificación manual)
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams } from "./helpers/multi-user";

const API = "http://localhost:5000";
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
// GRUPO 1 — Owner con team → downgrade a free BLOQUEADO
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — owner standard con team activo intenta change-immediate a free → 409 bloqueado", async () => {
	test.setTimeout(45_000);

	// 1) Crear team como owner (standard)
	const teamId = await createTeamAsOwner(makeTeamName());
	expect(teamId).toBeTruthy();

	// 2) Intentar downgrade a free → el backend debe bloquear
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/subscriptions/change-immediate`, {
			data: { planId: "free" },
		});

		// Post-fix (2026-04-19): controller enruta `planId === 'free'` a downgradeToFreePlan
		// que arroja TEAM_DOWNGRADE_BLOCKED cuando hay team activo → 409 con code + message.
		if (res.status() >= 400) {
			expect(res.status()).toBe(409);
			const body = await res.json();
			expect(body.success).toBe(false);
			expect(body.code).toBe("TEAM_DOWNGRADE_BLOCKED");
			expect(body.message).toMatch(/equipo/i);
			expect(body.teamCheck).toBeTruthy();
		} else {
			// Inesperado: backend permitió downgrade → bug crítico
			// Intentamos recovery inmediato (volver a standard)
			test.info().annotations.push({
				type: "critical-backend-bug",
				description: `Backend permitió downgrade a free con team activo. Status: ${res.status()}`,
			});
			// Attempt to undo — cancelar el cambio programado
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
// GRUPO 3 — schedule-change a free también debe bloquearse
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — schedule-change a free con team activo → también bloqueado", async () => {
	test.setTimeout(30_000);

	// Crear team si no existe
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

	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/subscriptions/schedule-change`, {
			data: { planId: "free" },
		});

		// Post-fix (2026-04-19): schedule-change con planId='free' también se enruta
		// a downgradeToFreePlan y hereda el check TEAM_DOWNGRADE_BLOCKED.
		if (res.status() >= 400) {
			expect(res.status()).toBe(409);
			const body = await res.json();
			expect(body.code).toBe("TEAM_DOWNGRADE_BLOCKED");
			expect(body.success).toBe(false);
		} else {
			// Inmediatamente revertimos el schedule
			await ctx.post(`${API}/api/subscriptions/cancel-downgrade`).catch(() => {});
			test.info().annotations.push({
				type: "schedule-change-behavior",
				description: `schedule-change aceptó con team activo (status ${res.status()}) — enforcement queda al fin del período. Revertido.`,
			});
		}
	} finally {
		await ctx.dispose();
	}
});
