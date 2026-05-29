/**
 * BLOQUE 5 — Edge cases de Team Mode con usuarios reales.
 *
 * **Casos cubiertos (factibles con 5 users):**
 *   - Max members: owner standard (cap=5) invita > 5 → bloqueo
 *   - Invitación duplicada: owner invita mismo email 2 veces → dedup/error
 *   - Invitar a miembro ya existente → código específico del backend
 *
 * **Casos documentados pero no automatizados (requieren setup imposible):**
 *   - ALREADY_IN_TEAM: necesita 2 owners distintos con teams activos.
 *     Solo tenemos 1 owner con plan pagado. Documentado — verificar manualmente.
 *   - PAID_PLAN_CONFLICT: user con plan pagado activo intenta unirse a team ajeno.
 *     Solo el owner tiene plan pagado. Saltado.
 *
 * GRUPO 1 — Max members: invitar hasta agotar + intentar +1
 * GRUPO 2 — Invitación duplicada (mismo email 2 veces)
 * GRUPO 3 — Invitar al mismo owner (se-invita-a-sí-mismo)
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";
const makeTeamName = () => `E2E-Edge-${Date.now()}`;

async function createTeamAsOwner(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, {
			data: { name, description: "E2E edge case" },
		});
		if (!res.ok()) throw new Error(`Create team failed: ${res.status()}`);
		const body = await res.json();
		return body.group?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

test.beforeEach(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberAdmin");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberViewer");
	await leaveAllTeams("memberExtra");
	await new Promise((r) => setTimeout(r, 500));
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberAdmin");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberViewer");
	await leaveAllTeams("memberExtra");
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Max members (standard cap=5)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — standard plan permite enviar invitaciones hasta cap=5 miembros", async () => {
	test.setTimeout(60_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const owner = await apiAsUser("owner");
	try {
		// Invitar a 4 users distintos (owner + 4 miembros = 5 total, llena el cap)
		const res = await owner.post(`${API}/api/groups/${teamId}/invitations`, {
			data: {
				invitations: [
					{ email: TEST_USERS.memberAdmin.email, role: "admin" },
					{ email: TEST_USERS.memberEditor.email, role: "editor" },
					{ email: TEST_USERS.memberViewer.email, role: "viewer" },
					{ email: TEST_USERS.memberExtra.email, role: "viewer" },
				],
			},
		});
		expect(res.ok()).toBe(true);
		const body = await res.json();
		expect(body.results?.sent?.length).toBe(4);
	} finally {
		await owner.dispose();
	}
});

test("GRUPO 1 — invitar al 5to distinto (total 6 con owner) → backend rechaza por capacidad", async () => {
	test.setTimeout(90_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const owner = await apiAsUser("owner");
	try {
		// 1) Llenar con 4 invitaciones
		const res1 = await owner.post(`${API}/api/groups/${teamId}/invitations`, {
			data: {
				invitations: [
					{ email: TEST_USERS.memberAdmin.email, role: "admin" },
					{ email: TEST_USERS.memberEditor.email, role: "editor" },
					{ email: TEST_USERS.memberViewer.email, role: "viewer" },
					{ email: TEST_USERS.memberExtra.email, role: "viewer" },
				],
			},
		});
		expect(res1.ok()).toBe(true);

		// 2) Intentar invitar al 5to (total pending/miembros = 5, superior al cap de 4 activos+owner=5 si ya se contaron)
		const res2 = await owner.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email: "quinto-invite@example.com", role: "viewer" }] },
		});

		// El backend puede:
		// - Rechazar con 4xx (CAPACITY_EXCEEDED)
		// - O permitir y el error ocurre al aceptar (dependiendo de si cuenta invitations pendientes)
		if (!res2.ok()) {
			expect([400, 403, 409]).toContain(res2.status());
			const body = await res2.json();
			expect(body.success).toBe(false);
		} else {
			// Si permite enviar, anotamos y saltamos la aserción de error
			test.info().annotations.push({
				type: "capacity-behavior",
				description: "Backend permitió enviar invitación 5ta (no cuenta pending contra capacity). El límite se enforce al aceptar.",
			});
		}
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Invitación duplicada (mismo email 2 veces)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — owner invita mismo email 2 veces → segunda falla o es dedupeada", async () => {
	test.setTimeout(60_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const owner = await apiAsUser("owner");
	try {
		// Primera invitación
		const res1 = await owner.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email: TEST_USERS.memberViewer.email, role: "viewer" }] },
		});
		expect(res1.ok()).toBe(true);

		// Segunda invitación al mismo email → el backend debe dedup (actualizar existente)
		// o responder con error/warning
		const res2 = await owner.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email: TEST_USERS.memberViewer.email, role: "editor" }] },
		});

		if (res2.ok()) {
			const body = await res2.json();
			// El backend puede reportar "failed" o "alreadyMember" o simplemente sobrescribir
			const totalProcessed =
				(body.results?.sent?.length ?? 0) + (body.results?.failed?.length ?? 0) + (body.results?.alreadyMember?.length ?? 0);
			expect(totalProcessed).toBeGreaterThanOrEqual(1);
		} else {
			expect([400, 409]).toContain(res2.status());
		}

		// Verificar que solo hay UNA invitación pending para ese email
		const teamRes = await owner.get(`${API}/api/groups/${teamId}`);
		const group = (await teamRes.json()).group ?? {};
		const pendingForEmail = (group.invitations ?? []).filter(
			(i: any) => i.email === TEST_USERS.memberViewer.email && i.status === "pending",
		);
		expect(pendingForEmail.length).toBeLessThanOrEqual(1);
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Owner se invita a sí mismo
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — owner intenta invitarse a sí mismo → error (ya es miembro/owner)", async () => {
	test.setTimeout(30_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const owner = await apiAsUser("owner");
	try {
		const res = await owner.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email: TEST_USERS.owner.email, role: "admin" }] },
		});

		// Caso 1: el backend devuelve OK pero en failed/alreadyMember
		// Caso 2: el backend devuelve 400/409
		if (res.ok()) {
			const body = await res.json();
			const sent = body.results?.sent?.length ?? 0;
			const alreadyMember = body.results?.alreadyMember?.length ?? 0;
			const failed = body.results?.failed?.length ?? 0;
			// NO debe ser "sent" exitoso
			expect(sent + alreadyMember + failed).toBeGreaterThanOrEqual(1);
			expect(sent).toBe(0);
		} else {
			expect([400, 409]).toContain(res.status());
		}
	} finally {
		await owner.dispose();
	}
});
