/**
 * BLOQUE 7 — Conflictos al aceptar invitaciones (ALREADY_IN_TEAM + PAID_PLAN_CONFLICT).
 *
 * Requiere un segundo owner con plan pagado activo:
 *   - owner (artista@mirtaaguilar.art) → standard, owner principal
 *   - ownerSecondary (juancamino713@gmail.com) → standard, segundo owner
 *   - memberExtra (cerramaximiliano@protonmail.com) → free, miembro
 *
 * Validaciones backend (groupController.js:1160-1267):
 *   1. `checkUserAlreadyInTeam` corre antes que `findUserSubscription`.
 *      → si invitee ya es miembro/owner de otro team, retorna 409 ALREADY_IN_TEAM.
 *   2. si plan !== "free" y status === "active" → 409 PAID_PLAN_CONFLICT.
 *
 * GRUPO 1 — ALREADY_IN_TEAM: memberExtra miembro de teamA (ownerSecondary).
 *            owner envía invitación a teamB → accept devuelve 409 ALREADY_IN_TEAM.
 * GRUPO 2 — PAID_PLAN_CONFLICT: owner invita ownerSecondary (plan standard active) →
 *            accept devuelve 409 PAID_PLAN_CONFLICT.
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";
const makeTeamName = (prefix: string) => `E2E-${prefix}-${Date.now()}`;

async function createTeam(role: "owner" | "ownerSecondary", name: string): Promise<string> {
	const ctx = await apiAsUser(role);
	try {
		const res = await ctx.post(`${API}/api/groups`, {
			data: { name, description: "E2E invitation conflicts" },
		});
		if (!res.ok()) throw new Error(`Create team failed for ${role}: ${res.status()} ${await res.text()}`);
		const body = await res.json();
		return body.group?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

async function sendInvitation(
	ownerRole: "owner" | "ownerSecondary",
	teamId: string,
	email: string,
	role: "admin" | "editor" | "viewer",
): Promise<string> {
	const ctx = await apiAsUser(ownerRole);
	try {
		const invRes = await ctx.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email, role }] },
		});
		if (!invRes.ok()) throw new Error(`Send invitation failed: ${invRes.status()} ${await invRes.text()}`);

		// Obtener token de la invitación recién creada
		const teamRes = await ctx.get(`${API}/api/groups/${teamId}`);
		const teamBody = await teamRes.json();
		const group = teamBody.group ?? teamBody.data ?? teamBody;
		const invitation = (group.invitations ?? []).find(
			(i: any) => i.email === email && i.status === "pending",
		);
		if (!invitation?.token) throw new Error(`Token not found for ${email}`);
		return invitation.token;
	} finally {
		await ctx.dispose();
	}
}

async function acceptInvitation(
	inviteeRole: "memberExtra" | "ownerSecondary",
	token: string,
): Promise<{ status: number; body: any }> {
	const ctx = await apiAsUser(inviteeRole);
	try {
		const res = await ctx.post(`${API}/api/groups/invitations/accept/${token}`, {
			data: { skipResourceCheck: true },
		});
		const body = await res.json().catch(() => ({}));
		return { status: res.status(), body };
	} finally {
		await ctx.dispose();
	}
}

// ─── Setup/teardown ──────────────────────────────────────────────────────────

test.beforeEach(async () => {
	// Limpieza total: ambos owners sin teams + invitees fuera de cualquier team
	await deleteAllOwnedTeams("owner");
	await deleteAllOwnedTeams("ownerSecondary");
	await leaveAllTeams("memberExtra");
	await leaveAllTeams("ownerSecondary");
	await new Promise((r) => setTimeout(r, 600));
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
	await deleteAllOwnedTeams("ownerSecondary");
	await leaveAllTeams("memberExtra");
	await leaveAllTeams("ownerSecondary");
});

// Multi-user + DB propagation → permitimos reintentos locales
test.describe.configure({ retries: 2 });

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — ALREADY_IN_TEAM
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — memberExtra ya en teamA; acepta invitación de teamB → 409 ALREADY_IN_TEAM", async () => {
	test.setTimeout(60_000);

	// Setup: ownerSecondary crea teamA, invita memberExtra, memberExtra acepta.
	const teamA = await createTeam("ownerSecondary", makeTeamName("TeamA"));
	const tokenA = await sendInvitation("ownerSecondary", teamA, TEST_USERS.memberExtra.email, "viewer");
	const acceptA = await acceptInvitation("memberExtra", tokenA);
	expect(acceptA.status).toBeLessThan(400);

	// Ahora owner crea teamB e invita al mismo memberExtra.
	const teamB = await createTeam("owner", makeTeamName("TeamB"));
	const tokenB = await sendInvitation("owner", teamB, TEST_USERS.memberExtra.email, "viewer");

	// memberExtra intenta aceptar teamB → debe fallar con 409 ALREADY_IN_TEAM
	const acceptB = await acceptInvitation("memberExtra", tokenB);

	expect(acceptB.status).toBe(409);
	expect(acceptB.body.code).toBe("ALREADY_IN_TEAM");
	expect(acceptB.body.success).toBe(false);
	expect(acceptB.body.currentTeam?.name).toBeTruthy();
	expect(acceptB.body.message).toMatch(/equipo/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — PAID_PLAN_CONFLICT
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — owner invita ownerSecondary (plan standard active) → accept devuelve 409 PAID_PLAN_CONFLICT", async () => {
	test.setTimeout(60_000);

	// Precondición: ownerSecondary sin teams (para no disparar ALREADY_IN_TEAM antes de PAID_PLAN_CONFLICT)
	// Doble cleanup explícito + espera a propagación de Mongo.
	await deleteAllOwnedTeams("ownerSecondary");
	await leaveAllTeams("ownerSecondary");
	await new Promise((r) => setTimeout(r, 1000));

	// Verificar estado: ownerSecondary no debe tener teams al inicio del test
	const secondary = await apiAsUser("ownerSecondary");
	try {
		const listRes = await secondary.get(`${API}/api/groups`);
		const listBody = await listRes.json();
		expect(listBody.groups?.length ?? 0).toBe(0);
	} finally {
		await secondary.dispose();
	}

	// owner crea team e invita ownerSecondary
	const teamId = await createTeam("owner", makeTeamName("PaidConflict"));
	const token = await sendInvitation("owner", teamId, TEST_USERS.ownerSecondary.email, "editor");

	// ownerSecondary intenta aceptar → debe fallar con 409 PAID_PLAN_CONFLICT
	const result = await acceptInvitation("ownerSecondary", token);

	expect(result.status).toBe(409);
	expect(result.body.code).toBe("PAID_PLAN_CONFLICT");
	expect(result.body.success).toBe(false);
	expect(result.body.currentPlan).toBe("standard");
	expect(result.body.message).toMatch(/plan de pago activo/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Orden de validación: ALREADY_IN_TEAM tiene prioridad sobre PAID_PLAN_CONFLICT
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — ownerSecondary owner de su propio team; owner lo invita → 409 ALREADY_IN_TEAM (no PAID_PLAN_CONFLICT)", async () => {
	test.setTimeout(60_000);

	// ownerSecondary crea team propio (queda como owner de ese team)
	const teamOwnedBySecondary = await createTeam("ownerSecondary", makeTeamName("SecondaryOwnTeam"));
	expect(teamOwnedBySecondary).toBeTruthy();

	// owner crea teamB e invita ownerSecondary
	const teamB = await createTeam("owner", makeTeamName("TeamB"));
	const token = await sendInvitation("owner", teamB, TEST_USERS.ownerSecondary.email, "editor");

	// ownerSecondary intenta aceptar → ALREADY_IN_TEAM (owner de otro team) tiene prioridad
	const result = await acceptInvitation("ownerSecondary", token);

	expect(result.status).toBe(409);
	// Verificación de orden: ALREADY_IN_TEAM corre antes que PAID_PLAN_CONFLICT en groupController
	expect(result.body.code).toBe("ALREADY_IN_TEAM");
	expect(result.body.currentRole).toBe("owner");
});
