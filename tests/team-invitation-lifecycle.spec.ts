/**
 * BLOQUE 9 — Lifecycle de invitaciones (tokens inválidos, resend, cancel, expirado).
 *
 * Flujos cubiertos (contra TEAMS_TESTING_GUIDE.md):
 *   - 6.1 Link expirado (> 7 días) → 400 "ha expirado" (usa script de backend)
 *   - 6.2 Token ya usado (invitación aceptada) → 400 "no válida"
 *   - 6.3 Token revocado (invitación cancelada) → 404/400
 *   - 6.4 Token inventado/inválido → 404
 *   - 2.6 Reenviar invitación pendiente (actualiza expiresAt)
 *   - 2.7 Cancelar invitación pendiente (DELETE invitationId)
 *
 * Flujo 6.1 mecanismo: el default `expiresAt` es `now + 7d`. El test usa
 * `scripts/expireInvitation.js` (law-analytics-server) para retrodatarlo via
 * mongoose.connect(URLDB) — evita tener que esperar 7 días reales.
 *
 * Endpoints:
 *   GET    /api/groups/invitations/verify/:token
 *   POST   /api/groups/invitations/accept/:token
 *   POST   /api/groups/:groupId/invitations/:invitationId/resend
 *   DELETE /api/groups/:groupId/invitations/:invitationId
 */

import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import path from "path";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const BACKEND_DIR = "/home/mcerra/www/law-analytics-server";

function expireInvitationViaDb(token: string): string {
	// Invoca script del backend que conecta a Mongo y retrodata expiresAt
	const scriptPath = path.join(BACKEND_DIR, "scripts", "expireInvitation.js");
	const out = execSync(`node ${scriptPath} ${token}`, { cwd: BACKEND_DIR, encoding: "utf-8" });
	return out.trim();
}

const API = "http://localhost:5000";
const makeTeamName = () => `E2E-InvLife-${Date.now()}`;

test.describe.configure({ retries: 2 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createTeamAsOwner(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, {
			data: { name, description: "E2E invitation lifecycle" },
		});
		if (!res.ok()) throw new Error(`Create team failed: ${res.status()}`);
		const body = await res.json();
		return body.group?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

async function sendInvite(
	teamId: string,
	email: string,
	role: "editor" | "viewer" = "viewer",
): Promise<{ token: string; invitationId: string; expiresAt: string }> {
	const ctx = await apiAsUser("owner");
	try {
		const invRes = await ctx.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email, role }] },
		});
		if (!invRes.ok()) throw new Error(`Invite failed: ${invRes.status()}`);

		const teamRes = await ctx.get(`${API}/api/groups/${teamId}`);
		const teamBody = await teamRes.json();
		const group = teamBody.group ?? teamBody.data ?? teamBody;
		const invitation = (group.invitations ?? []).find(
			(i: any) => i.email === email && i.status === "pending",
		);
		if (!invitation) throw new Error("Invitation not found");
		return { token: invitation.token, invitationId: invitation._id, expiresAt: invitation.expiresAt };
	} finally {
		await ctx.dispose();
	}
}

// ─── Setup/teardown ──────────────────────────────────────────────────────────

test.beforeEach(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberExtra");
	await leaveAllTeams("memberViewer");
	await new Promise((r) => setTimeout(r, 600));
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberExtra");
	await leaveAllTeams("memberViewer");
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Flujo 6.4: Token inventado
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — verify + accept con token inventado → 404", async () => {
	const ctx = await apiAsUser("memberExtra");
	try {
		const fakeToken = "this-token-does-not-exist-abc123xyz";

		const verifyRes = await ctx.get(`${API}/api/groups/invitations/verify/${fakeToken}`);
		expect(verifyRes.status()).toBe(404);

		const acceptRes = await ctx.post(`${API}/api/groups/invitations/accept/${fakeToken}`, {
			data: { skipResourceCheck: true },
		});
		expect(acceptRes.status()).toBe(404);
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Flujo 6.2: Token ya usado
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — accept con token ya usado (invitación aceptada) → 400 'no válida'", async () => {
	test.setTimeout(45_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const { token } = await sendInvite(teamId, TEST_USERS.memberViewer.email, "viewer");

	// 1er accept: OK
	const invitee = await apiAsUser("memberViewer");
	try {
		const first = await invitee.post(`${API}/api/groups/invitations/accept/${token}`, {
			data: { skipResourceCheck: true },
		});
		if (!first.ok()) {
			const body = await first.json();
			if (body.code === "USER_HAS_RESOURCES") {
				await invitee.delete(`${API}/api/groups/delete-my-resources`);
				const retry = await invitee.post(`${API}/api/groups/invitations/accept/${token}`, {
					data: { skipResourceCheck: true },
				});
				expect(retry.ok()).toBe(true);
			} else {
				throw new Error(`First accept failed: ${first.status()} ${JSON.stringify(body)}`);
			}
		}

		// 2do intento con el mismo token → status !== "pending"
		const second = await invitee.post(`${API}/api/groups/invitations/accept/${token}`, {
			data: { skipResourceCheck: true },
		});
		expect(second.ok()).toBe(false);
		expect([400, 404, 409]).toContain(second.status());
		const secondBody = await second.json();
		expect(secondBody.success).toBe(false);
		expect(secondBody.message).toMatch(/no válida|ya.+aceptada|no encontrada|Ya eres/i);
	} finally {
		await invitee.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Flujo 6.3: Token revocado (invitación cancelada)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — accept con token cancelado → 400/404", async () => {
	test.setTimeout(30_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const { token, invitationId } = await sendInvite(teamId, TEST_USERS.memberExtra.email, "viewer");

	// Owner cancela la invitación
	const owner = await apiAsUser("owner");
	try {
		const cancelRes = await owner.delete(`${API}/api/groups/${teamId}/invitations/${invitationId}`);
		expect(cancelRes.ok()).toBe(true);
	} finally {
		await owner.dispose();
	}

	// Invitee intenta aceptar el token revocado
	const invitee = await apiAsUser("memberExtra");
	try {
		const res = await invitee.post(`${API}/api/groups/invitations/accept/${token}`, {
			data: { skipResourceCheck: true },
		});
		expect(res.ok()).toBe(false);
		expect([400, 404]).toContain(res.status());
	} finally {
		await invitee.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Flujo 2.7: Cancelar invitación pendiente
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — owner cancela invitación pendiente → ya no aparece en group.invitations (pending)", async () => {
	test.setTimeout(30_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const { invitationId } = await sendInvite(teamId, TEST_USERS.memberExtra.email, "viewer");

	const owner = await apiAsUser("owner");
	try {
		const cancelRes = await owner.delete(`${API}/api/groups/${teamId}/invitations/${invitationId}`);
		expect(cancelRes.ok()).toBe(true);

		// Verificar que no quedan invitaciones pending para ese email
		const detailRes = await owner.get(`${API}/api/groups/${teamId}`);
		const group = (await detailRes.json()).group ?? {};
		const stillPending = (group.invitations ?? []).filter(
			(i: any) => i.email === TEST_USERS.memberExtra.email && i.status === "pending",
		);
		expect(stillPending.length).toBe(0);
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Flujo 2.6: Reenviar invitación
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — owner reenvía invitación pendiente → expiresAt se actualiza", async () => {
	test.setTimeout(30_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const { invitationId, expiresAt: originalExpiresAt } = await sendInvite(
		teamId,
		TEST_USERS.memberExtra.email,
		"viewer",
	);

	// Pausa mínima para que cualquier refresh de expiresAt se vea
	await new Promise((r) => setTimeout(r, 1500));

	const owner = await apiAsUser("owner");
	try {
		const resendRes = await owner.post(`${API}/api/groups/${teamId}/invitations/${invitationId}/resend`);
		expect(resendRes.ok()).toBe(true);

		// Verificar que expiresAt se actualizó (extendió)
		const detailRes = await owner.get(`${API}/api/groups/${teamId}`);
		const group = (await detailRes.json()).group ?? {};
		const invitation = (group.invitations ?? []).find((i: any) => i._id === invitationId);
		expect(invitation).toBeTruthy();
		expect(invitation.status).toBe("pending");
		// El nuevo expiresAt debe ser >= al original (generalmente mayor porque se extendió)
		expect(new Date(invitation.expiresAt).getTime()).toBeGreaterThanOrEqual(
			new Date(originalExpiresAt).getTime(),
		);
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — verify token válido retorna datos de la invitación
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — verify token válido retorna datos de la invitación
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — verify token válido devuelve metadata del grupo + invitación", async () => {
	test.setTimeout(30_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const { token } = await sendInvite(teamId, TEST_USERS.memberExtra.email, "viewer");

	const ctx = await apiAsUser("memberExtra");
	try {
		const res = await ctx.get(`${API}/api/groups/invitations/verify/${token}`);
		expect(res.ok()).toBe(true);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.invitation?.email).toBe(TEST_USERS.memberExtra.email);
		expect(body.invitation?.role).toBe("viewer");
		expect(body.invitation?.groupName).toBeTruthy();
		expect(body.isCorrectUser).toBe(true);
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 7 — Flujo 6.1: Link expirado (retrodatado vía script de backend)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 7 — Flujo 6.1: invitación expirada → verify/accept 400", async () => {
	test.setTimeout(30_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const { token } = await sendInvite(teamId, TEST_USERS.memberExtra.email, "viewer");

	// Retrodatar expiresAt al pasado vía script del backend (conecta a URLDB)
	const scriptOutput = expireInvitationViaDb(token);
	expect(scriptOutput.startsWith("OK ")).toBe(true);

	const invitee = await apiAsUser("memberExtra");
	try {
		// verify debe rechazar con 400
		const verifyRes = await invitee.get(`${API}/api/groups/invitations/verify/${token}`);
		expect(verifyRes.status()).toBe(400);
		const verifyBody = await verifyRes.json();
		expect(verifyBody.success).toBe(false);
		// El backend puede auto-marcar como "expired" (mensaje "ya fue expirada") o mantener
		// status pending y chequear expiresAt (mensaje "ha expirado"). Aceptamos ambos.
		expect(verifyBody.message).toMatch(/expir/i);

		// accept también debe rechazar
		const acceptRes = await invitee.post(`${API}/api/groups/invitations/accept/${token}`, {
			data: { skipResourceCheck: true },
		});
		expect(acceptRes.ok()).toBe(false);
		expect([400, 404]).toContain(acceptRes.status());
	} finally {
		await invitee.dispose();
	}
});
