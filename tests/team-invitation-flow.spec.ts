/**
 * BLOQUE 3 — Flujo multi-user de invitación y aceptación con usuarios reales.
 *
 * Escenario happy path: owner (plan standard) invita → invitee (plan free, SIN recursos)
 * acepta → se une al team con rol correcto.
 *
 * **Coordinación multi-user:**
 *   - Owner: `artista@mirtaaguilar.art` (standard) — crea + invita + elimina team
 *   - Invitee sin recursos: `soporte@lawanalytics.app` (free, 0 recursos) — acepta directamente
 *   - Invitees con recursos: `maximiliano@rumba-dev.com` (1 folder + 20 calcs) — flujo con migración
 *
 * **Modo del test:**
 *   Cada test arranca limpio (beforeEach elimina teams del owner y saca invitees de cualquier team).
 *   Creamos un BrowserContext por user y los cerramos al final.
 *
 * GRUPO 1 — Accept invitación (invitee sin recursos) — happy path
 * GRUPO 2 — Invitee con recursos → flujo 409 USER_HAS_RESOURCES
 * GRUPO 3 — Validación del token (valid vs invalid)
 * GRUPO 4 — Rol correcto tras accept
 */

import { test, expect, type BrowserContext } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";

const makeTeamName = () => `E2E-Invite-${Date.now()}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Crea un team como owner y devuelve { teamId, teamName } */
async function createTeamAsOwner(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, {
			data: { name, description: "E2E invitation test" },
		});
		if (!res.ok()) throw new Error(`Create team failed: ${res.status()} ${await res.text()}`);
		const body = await res.json();
		return body.group?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

/** Envía invitación y devuelve el token de la invitación creada */
async function sendInvitation(
	teamId: string,
	email: string,
	role: "admin" | "editor" | "viewer",
): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email, role }] },
		});
		if (!res.ok()) throw new Error(`Invitation failed: ${res.status()} ${await res.text()}`);

		// El token se guarda en group.invitations[]. Hacemos GET del team para obtenerlo.
		const teamRes = await ctx.get(`${API}/api/groups/${teamId}`);
		const body = await teamRes.json();
		const group = body.group ?? body.data ?? body;
		const invitation = group.invitations?.find((i: any) => i.email === email && i.status === "pending");
		if (!invitation?.token) throw new Error(`Token not found in invitations for ${email}`);
		return invitation.token;
	} finally {
		await ctx.dispose();
	}
}

/** Verifica estado de los miembros de un team (via owner API) */
async function getTeamMembers(teamId: string): Promise<Array<{ userId: string; email: string; role: string; status: string }>> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.get(`${API}/api/groups/${teamId}`);
		const body = await res.json();
		const group = body.group ?? body.data ?? body;
		return (group.members ?? []).map((m: any) => ({
			userId: typeof m.userId === "string" ? m.userId : (m.userId?._id ?? m.user?._id ?? m.user ?? ""),
			email: m.email ?? (typeof m.userId === "object" ? m.userId?.email : "") ?? "",
			role: m.role,
			status: m.status,
		}));
	} finally {
		await ctx.dispose();
	}
}

/** Helper: obtiene el userId de un user de test desde su storageState (JWT decodificado) */
function getUserIdFromStorage(role: "owner" | "memberAdmin" | "memberEditor" | "memberViewer" | "memberExtra"): string {
	const fs = require("fs");
	const path = require("path");
	const raw = JSON.parse(fs.readFileSync(path.join(__dirname, ".auth", `${role}.json`), "utf-8"));
	const token = raw?.origins?.[0]?.localStorage?.find((e: any) => e.name === "token")?.value ?? "";
	try {
		const payload = JSON.parse(Buffer.from(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
		return payload.id ?? payload._id ?? payload.userId ?? "";
	} catch {
		return "";
	}
}

// ─── Retries ─────────────────────────────────────────────────────────────────
//
// Flujos multi-user dependen de propagación DB + aceptación de invitación. Observamos
// 2 tests que pasan consistentemente en retry #1 (timing de cache/índices). Configuramos
// retries específicos para este archivo sin afectar al resto de la suite.
test.describe.configure({ retries: 2 });

// ─── Setup/teardown ──────────────────────────────────────────────────────────

test.beforeEach(async () => {
	// Cleanup total antes de cada test: owner sin teams + invitees abandonan cualquier team
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberViewer"); // soporte@lawanalytics.app
	await leaveAllTeams("memberEditor"); // maximiliano@rumba-dev.com
	// Pequeña pausa para que Mongo propague los cambios antes del próximo test
	await new Promise((resolve) => setTimeout(resolve, 500));
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberViewer");
	await leaveAllTeams("memberEditor");
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Accept invitación (invitee sin recursos) — happy path
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — owner invita soporte (sin recursos) + accept via UI → se une como viewer", async ({ browser }) => {
	test.setTimeout(90_000);

	// 1) Owner crea team + envía invitación a `soporte`
	const teamName = makeTeamName();
	const teamId = await createTeamAsOwner(teamName);
	const token = await sendInvitation(teamId, TEST_USERS.memberViewer.email, "viewer");
	expect(token).toBeTruthy();

	// 2) Context del invitee (soporte@lawanalytics.app) con su storageState
	const inviteeContext: BrowserContext = await browser.newContext({
		storageState: "tests/.auth/memberViewer.json",
	});
	const inviteePage = await inviteeContext.newPage();

	try {
		// 3) Navegar a la URL de aceptación
		await inviteePage.goto(`/teams/invitation/${token}`);

		// 4) La página valida el token y muestra info del team
		await expect(inviteePage.getByText(teamName)).toBeVisible({ timeout: 15_000 });

		// 5) Click en "Aceptar" (buscar por texto del botón)
		const acceptBtn = inviteePage.getByRole("button", { name: /Aceptar|Unirme|Unirse|Sí,? quiero/i }).first();
		await expect(acceptBtn).toBeVisible({ timeout: 10_000 });

		const [acceptResponse] = await Promise.all([
			inviteePage.waitForResponse(
				(r) => r.url().includes(`/api/groups/invitations/accept/${token}`) && r.request().method() === "POST",
				{ timeout: 15_000 },
			),
			acceptBtn.click(),
		]);
		expect(acceptResponse.ok()).toBe(true);

		// 6) Verificar en backend que soporte es ahora miembro del team con rol viewer
		const members = await getTeamMembers(teamId);
		const viewerUserId = getUserIdFromStorage("memberViewer");
		const newMember = members.find((m) => m.userId === viewerUserId);
		expect(newMember).toBeTruthy();
		expect(newMember!.role).toBe("viewer");
		expect(newMember!.status).toBe("active");
	} finally {
		await inviteeContext.close();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Invitee con recursos → flujo USER_HAS_RESOURCES
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — invitee con recursos recibe 409 USER_HAS_RESOURCES via API", async () => {
	test.setTimeout(60_000);

	// Precondición self-contained: asegurar que el editor tenga ≥1 recurso propio
	// (otros tests del suite limpian los recursos al terminar, por lo que no
	// podemos asumir estado residual).
	let personalFolderId = "";
	const editorPre = await apiAsUser("memberEditor");
	try {
		const createRes = await editorPre.post(`${API}/api/folders`, {
			headers: { "Content-Type": "application/json" },
			data: {
				folderName: `E2E-UserResourcesFixture-${Date.now()}`,
				status: "Nueva",
				materia: "Civil",
				orderStatus: "Actor",
			},
		});
		if (createRes.ok()) {
			const body = await createRes.json();
			personalFolderId = body.folder?._id ?? body.data?._id ?? "";
		}
	} finally {
		await editorPre.dispose();
	}

	const teamName = makeTeamName();
	const teamId = await createTeamAsOwner(teamName);
	const token = await sendInvitation(teamId, TEST_USERS.memberEditor.email, "editor");

	const ctx = await apiAsUser("memberEditor");
	try {
		const res = await ctx.post(`${API}/api/groups/invitations/accept/${token}`, {
			data: { skipResourceCheck: false },
		});
		expect(res.status()).toBe(409);
		const body = await res.json();
		expect(body.code).toBe("USER_HAS_RESOURCES");
		expect(body.resourceSummary).toBeTruthy();
	} finally {
		await ctx.dispose();
		// Cleanup: eliminar el folder creado como fixture
		if (personalFolderId) {
			const editorPost = await apiAsUser("memberEditor");
			await editorPost.delete(`${API}/api/folders/${personalFolderId}`).catch(() => {});
			await editorPost.dispose();
		}
	}
});

test("GRUPO 2 — invitee con recursos → UI muestra flujo de migración de recursos", async ({ browser }) => {
	test.setTimeout(90_000);

	const teamName = makeTeamName();
	const teamId = await createTeamAsOwner(teamName);
	const token = await sendInvitation(teamId, TEST_USERS.memberEditor.email, "editor");

	const inviteeContext = await browser.newContext({
		storageState: "tests/.auth/memberEditor.json",
	});
	const inviteePage = await inviteeContext.newPage();

	try {
		await inviteePage.goto(`/teams/invitation/${token}`);
		await expect(inviteePage.getByText(teamName)).toBeVisible({ timeout: 15_000 });

		// Click aceptar → dispara 409 → UI entra en flowState "handle-resources"
		const acceptBtn = inviteePage.getByRole("button", { name: /Aceptar|Unirme|Unirse|Sí,? quiero/i }).first();
		await acceptBtn.click();

		// La UI debe mostrar opciones de qué hacer con los recursos
		await expect(
			inviteePage.getByText(/recursos|folders|carpetas|calculadoras|migrar|eliminar/i).first(),
		).toBeVisible({ timeout: 10_000 });
	} finally {
		await inviteeContext.close();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Validación del token
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — token inválido → página muestra error", async ({ browser }) => {
	test.setTimeout(30_000);

	const inviteeContext = await browser.newContext({
		storageState: "tests/.auth/memberViewer.json",
	});
	const inviteePage = await inviteeContext.newPage();

	try {
		await inviteePage.goto(`/teams/invitation/token-invalido-12345`);
		// La página debe mostrar un estado de error (el texto exacto depende del UI)
		await expect(
			inviteePage.getByText(/inválid|expirad|no válid|no encontrad|error/i).first(),
		).toBeVisible({ timeout: 15_000 });
	} finally {
		await inviteeContext.close();
	}
});

test("GRUPO 3 — GET /invitations/verify/:token inválido → 404 o success:false", async () => {
	const ctx = await apiAsUser("memberViewer");
	try {
		const res = await ctx.get(`${API}/api/groups/invitations/verify/token-invalido-xyz`);
		// Backend puede responder 400/404 o 200 con success:false
		if (res.ok()) {
			const body = await res.json();
			expect(body.success).toBe(false);
		} else {
			expect(res.status()).toBeGreaterThanOrEqual(400);
		}
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Rol correcto tras accept + roles disponibles
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — invitar con rol 'admin' → miembro tiene rol admin tras accept", async () => {
	test.setTimeout(60_000);

	const teamName = makeTeamName();
	const teamId = await createTeamAsOwner(teamName);
	// Invitamos a `soporte` (sin recursos) como admin
	const token = await sendInvitation(teamId, TEST_USERS.memberViewer.email, "admin");

	// Aceptar via API
	const ctx = await apiAsUser("memberViewer");
	try {
		const res = await ctx.post(`${API}/api/groups/invitations/accept/${token}`, {
			data: { skipResourceCheck: false },
		});
		expect(res.ok()).toBe(true);
	} finally {
		await ctx.dispose();
	}

	const members = await getTeamMembers(teamId);
	const viewerUserId = getUserIdFromStorage("memberViewer");
	const newMember = members.find((m) => m.userId === viewerUserId);
	expect(newMember?.role).toBe("admin");
});

test("GRUPO 4 — invitar con rol 'editor' → miembro tiene rol editor", async () => {
	test.setTimeout(60_000);

	const teamName = makeTeamName();
	const teamId = await createTeamAsOwner(teamName);
	const token = await sendInvitation(teamId, TEST_USERS.memberViewer.email, "editor");

	const ctx = await apiAsUser("memberViewer");
	try {
		const res = await ctx.post(`${API}/api/groups/invitations/accept/${token}`, {
			data: { skipResourceCheck: false },
		});
		expect(res.ok()).toBe(true);
	} finally {
		await ctx.dispose();
	}

	const members = await getTeamMembers(teamId);
	const viewerUserId = getUserIdFromStorage("memberViewer");
	const newMember = members.find((m) => m.userId === viewerUserId);
	expect(newMember?.role).toBe("editor");
});
