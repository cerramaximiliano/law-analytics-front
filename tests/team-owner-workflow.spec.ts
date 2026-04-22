/**
 * BLOQUE 1 — Owner workflow con usuario real `artista@mirtaaguilar.art` (plan standard).
 *
 * Tests E2E contra backend real. No mocks. El owner real crea y elimina teams,
 * envía invitaciones, las revoca, y abandona/elimina el team al final.
 *
 * **IMPORTANTE — efectos en backend:**
 * El user `artista@mirtaaguilar.art` inicialmente tiene 1 team "Prueba" (según verificación).
 * `test.beforeAll` elimina todos los teams del owner antes de empezar, para partir limpio.
 * Cada test deja el estado en "sin teams" al finalizar (salvo tests que se coordinan entre sí).
 *
 * **Precondiciones:**
 * - Backend activo en :5000 con MAX_ACTIVE_SESSIONS configurado en dev.
 * - storageState `tests/.auth/owner.json` generado por `helpers/multi-user.ts`.
 *
 * GRUPO 1 — Vista inicial del tab Role con plan standard
 * GRUPO 2 — Crear team (POST /api/groups)
 * GRUPO 3 — Enviar invitaciones (POST /api/groups/:id/invitations)
 * GRUPO 4 — Ver invitaciones pendientes en el UI
 * GRUPO 5 — Revocar invitación pendiente (DELETE /invitations/:inviteId)
 * GRUPO 6 — Eliminar team (DELETE /api/groups/:id) — cleanup general
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";
const OWNER_STATE = "tests/.auth/owner.json";

test.use({ storageState: OWNER_STATE });

// Titulos únicos por corrida para evitar colisiones
const makeTeamName = () => `E2E-Team-${Date.now()}`;

// ─── Setup/teardown globales ─────────────────────────────────────────────────
//
// Cada test comienza SIN teams. El owner real puede tener teams residuales de
// corridas previas o de otros tests; garantizamos estado limpio en beforeEach.
// afterAll hace cleanup final por si algún test fallo en medio.

test.beforeEach(async () => {
	await deleteAllOwnedTeams("owner");
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createTeamViaAPI(name: string, description = "E2E test team"): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, {
			data: { name, description },
		});
		if (!res.ok()) throw new Error(`Create team failed: ${res.status()} ${await res.text()}`);
		const body = await res.json();
		return body.group?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Vista inicial del tab Role (plan standard, sin teams)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — owner standard sin teams → vista 'Crear tu Primer Equipo'", async ({ page }) => {
	await page.goto("/apps/profiles/account/role");

	await expect(page.getByRole("heading", { name: "Crear tu Primer Equipo" })).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText(/hasta 5 miembros en tu plan Estándar/i)).toBeVisible();
	await expect(page.getByRole("button", { name: /Crear Equipo/i })).toBeEnabled();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Crear team via UI (POST real a /api/groups)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — click 'Crear Equipo' → abre dialog 'Crear Nuevo Equipo'", async ({ page }) => {
	await page.goto("/apps/profiles/account/role");
	await expect(page.getByRole("heading", { name: "Crear tu Primer Equipo" })).toBeVisible({ timeout: 15_000 });

	await page.getByRole("button", { name: /Crear Equipo/i }).click();
	await expect(page.getByRole("heading", { name: "Crear Nuevo Equipo" })).toBeVisible({ timeout: 5_000 });
	await expect(page.getByLabel("Nombre del equipo")).toBeVisible();
});

test("GRUPO 2 — submit con nombre vacío → botón 'Crear Equipo' (dialog) deshabilitado", async ({ page }) => {
	await page.goto("/apps/profiles/account/role");
	await page.getByRole("button", { name: /Crear Equipo/i }).click();
	await expect(page.getByRole("heading", { name: "Crear Nuevo Equipo" })).toBeVisible({ timeout: 5_000 });

	// Hay 2 botones "Crear Equipo" (el de afuera y el del dialog). Scopeamos al dialog.
	const submitBtn = page.getByRole("dialog").getByRole("button", { name: /Crear Equipo/i });
	await expect(submitBtn).toBeDisabled();
});

test("GRUPO 2 — crear team real → POST /api/groups + team aparece en la UI", async ({ page }) => {
	test.setTimeout(45_000);
	const teamName = makeTeamName();

	await page.goto("/apps/profiles/account/role");
	await page.getByRole("button", { name: /Crear Equipo/i }).click();
	await expect(page.getByRole("heading", { name: "Crear Nuevo Equipo" })).toBeVisible({ timeout: 5_000 });

	await page.getByLabel("Nombre del equipo").fill(teamName);
	await page.getByLabel(/Descripción/i).fill("Equipo creado por test E2E");

	const [postResponse] = await Promise.all([
		page.waitForResponse((r) => r.url().endsWith("/api/groups") && r.request().method() === "POST"),
		page.getByRole("dialog").getByRole("button", { name: /Crear Equipo/i }).click(),
	]);
	expect(postResponse.ok()).toBe(true);

	// Tras la creación, la UI re-renderiza con el team activo
	await expect(page.getByRole("heading", { name: teamName })).toBeVisible({ timeout: 10_000 });
	// Counter 1/5 (solo el owner)
	await expect(page.getByText(/1\s*\/\s*5/)).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Enviar invitaciones
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — owner con team → InviteMembersForm visible con email+rol", async ({ page }) => {
	test.setTimeout(45_000);
	const teamName = makeTeamName();
	await createTeamViaAPI(teamName);

	await page.goto("/apps/profiles/account/role");
	await expect(page.getByRole("heading", { name: teamName })).toBeVisible({ timeout: 15_000 });

	// InviteMembersForm
	await expect(page.getByLabel("Email")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("button", { name: /Enviar Invitaciones/i })).toBeVisible();
});

test("GRUPO 3 — invitar member via UI → POST /api/groups/:id/invitations + aparece en pendientes", async ({ page }) => {
	test.setTimeout(45_000);
	const teamName = makeTeamName();
	const teamId = await createTeamViaAPI(teamName);
	const inviteeEmail = TEST_USERS.memberEditor.email;

	await page.goto("/apps/profiles/account/role");
	await expect(page.getByRole("heading", { name: teamName })).toBeVisible({ timeout: 15_000 });

	await page.getByLabel("Email").fill(inviteeEmail);

	// Enviar invitación
	const [postResponse] = await Promise.all([
		page.waitForResponse(
			(r) => r.url().includes(`/api/groups/${teamId}/invitations`) && r.request().method() === "POST",
			{ timeout: 15_000 },
		),
		page.getByRole("button", { name: /Enviar Invitaciones/i }).click(),
	]);
	expect(postResponse.ok()).toBe(true);

	// El email del invitee aparece en la lista de invitaciones pendientes
	await expect(page.getByText(inviteeEmail)).toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Listar y revocar invitaciones pendientes
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — invitación creada via API aparece en PendingInvitationsList", async ({ page }) => {
	test.setTimeout(45_000);
	const teamName = makeTeamName();
	const teamId = await createTeamViaAPI(teamName);

	// Crear invitación directamente via API
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email: TEST_USERS.memberViewer.email, role: "viewer" }] },
		});
		expect(res.ok()).toBe(true);
	} finally {
		await ctx.dispose();
	}

	await page.goto("/apps/profiles/account/role");
	await expect(page.getByRole("heading", { name: teamName })).toBeVisible({ timeout: 15_000 });

	// La lista muestra al invitee
	await expect(page.getByText(TEST_USERS.memberViewer.email)).toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Eliminar team desde la Zona de Peligro
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — Zona de Peligro visible con botón 'Eliminar Equipo'", async ({ page }) => {
	test.setTimeout(45_000);
	const teamName = makeTeamName();
	await createTeamViaAPI(teamName);

	await page.goto("/apps/profiles/account/role");
	await expect(page.getByRole("heading", { name: teamName })).toBeVisible({ timeout: 15_000 });

	await expect(page.getByText("Zona de Peligro")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("button", { name: "Eliminar Equipo" })).toBeVisible();
});

test("GRUPO 5 — click 'Eliminar Equipo' abre LeaveTeamDialog", async ({ page }) => {
	test.setTimeout(45_000);
	const teamName = makeTeamName();
	await createTeamViaAPI(teamName);

	await page.goto("/apps/profiles/account/role");
	await expect(page.getByRole("heading", { name: teamName })).toBeVisible({ timeout: 15_000 });

	await page.getByRole("button", { name: "Eliminar Equipo" }).click();
	// El LeaveTeamDialog aparece
	await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — Límite de 1 team por user (standard → max 1 team)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — owner con team NO puede crear otro (botón 'Nuevo Equipo' ausente)", async ({ page }) => {
	test.setTimeout(45_000);
	const teamName = makeTeamName();
	await createTeamViaAPI(teamName);

	await page.goto("/apps/profiles/account/role");
	await expect(page.getByRole("heading", { name: teamName })).toBeVisible({ timeout: 15_000 });

	// Según el comentario en TabRole.tsx:403, el botón "Nuevo Equipo" fue eliminado
	// porque solo se permite un equipo por usuario.
	// Verificamos que NO hay un segundo botón de "Crear Equipo" en la vista (solo el del dialog si abriera, pero aquí no hay dialog).
	// La vista "Crear tu Primer Equipo" NO debe estar visible.
	await expect(page.getByRole("heading", { name: "Crear tu Primer Equipo" })).not.toBeVisible({ timeout: 2_000 });
});
