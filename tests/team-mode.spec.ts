/**
 * Tests E2E de Team Mode — /apps/profiles/account/role
 *
 * **Contexto:**
 *   Teams es feature de plan pagado (standard o premium). Un user con plan free
 *   ve un mensaje de upgrade. Un user con plan standard/premium puede:
 *     - Crear un team (max 1 team por user)
 *     - Invitar miembros (5 en standard, 10 en premium)
 *     - Gestionar roles (owner/admin/editor/viewer)
 *     - Ser invitado a un team ajeno
 *
 * **Estrategia — cubrir user free + user pago con mocks:**
 *   En lugar de usar 2 usuarios reales (requeriría seed/admin API), mockeamos:
 *     - `GET /api/subscriptions/current` → controla `subscription.plan`
 *     - `GET /api/groups` → controla la lista de teams del user
 *   Esto permite testear TODOS los estados del lifecycle desde un único user real,
 *   consistente con el enfoque ya usado en subscriptions-crud.spec.ts.
 *
 * GRUPO 1 — Usuario FREE → alert de upgrade + navegación a /suscripciones/tables
 * GRUPO 2 — Usuario PREMIUM sin teams → vista "Crear tu Primer Equipo"
 * GRUPO 3 — Usuario PREMIUM con team activo (owner) → header + MembersTable + InviteForm
 * GRUPO 4 — Usuario invitado (miembro no-owner) → vista "Eres Miembro de un Equipo"
 */

import { test, expect, type Page, type Route } from "@playwright/test";
import fs from "fs";
import path from "path";

const STORAGE_STATE = "tests/.auth/user.json";
test.use({ storageState: STORAGE_STATE });

/** Lee userId del JWT guardado en storageState (no requiere navegación previa) */
function getUserIdFromStorage(): string {
	try {
		const raw = fs.readFileSync(path.join(__dirname, ".auth/user.json"), "utf-8");
		const entries: any[] = JSON.parse(raw)?.origins?.[0]?.localStorage ?? [];
		const token = entries.find((e) => e.name === "token")?.value ?? "";
		if (!token) return "";
		const payload = JSON.parse(Buffer.from(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
		return payload.id ?? payload._id ?? payload.userId ?? payload.sub ?? "";
	} catch {
		return "";
	}
}

const USER_ID = getUserIdFromStorage();

// ─── Fixtures de subscription ────────────────────────────────────────────────

const SUBSCRIPTION_FREE = {
	success: true,
	subscription: {
		_id: "sub_free",
		plan: "free",
		status: "active",
		cancelAtPeriodEnd: false,
		features: {},
		limitsWithDescriptions: [],
	},
};

const SUBSCRIPTION_PREMIUM = {
	success: true,
	subscription: {
		_id: "sub_premium",
		plan: "premium",
		status: "active",
		cancelAtPeriodEnd: false,
		features: { teams: true },
		featuresWithDescriptions: [{ name: "teams", enabled: true }],
		limitsWithDescriptions: [{ name: "teamMembers", limit: 10 }],
	},
};

const SUBSCRIPTION_STANDARD = {
	success: true,
	subscription: {
		_id: "sub_standard",
		plan: "standard",
		status: "active",
		cancelAtPeriodEnd: false,
		features: { teams: true },
		featuresWithDescriptions: [{ name: "teams", enabled: true }],
		limitsWithDescriptions: [{ name: "teamMembers", limit: 5 }],
	},
};

// ─── Fixtures de teams ───────────────────────────────────────────────────────

function buildTeamAsOwner(userId: string) {
	return {
		_id: "team_1",
		name: "Estudio Jurídico E2E",
		description: "Equipo de prueba",
		owner: userId,
		members: [
			// Solo el owner, sin miembros adicionales
		],
		createdAt: "2026-04-01T10:00:00.000Z",
		updatedAt: "2026-04-19T12:00:00.000Z",
	};
}

function buildTeamAsMember(userId: string, ownerId: string) {
	return {
		_id: "team_2",
		name: "Equipo Ajeno",
		description: "User es miembro, no owner",
		owner: ownerId, // otro user
		members: [
			{
				userId, // el campo clave es `userId` (ver TeamContext.getMemberUserId:141)
				role: "editor",
				joinedAt: "2026-04-15T10:00:00.000Z",
			},
		],
		createdAt: "2026-04-01T10:00:00.000Z",
		updatedAt: "2026-04-19T12:00:00.000Z",
	};
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function mockSubscription(page: Page, subscription: unknown) {
	await page.route(
		(url) => url.pathname === "/api/subscriptions/current",
		(route: Route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(subscription),
			}),
	);
}

async function mockTeams(page: Page, teams: unknown[]) {
	await page.route(
		(url) => url.pathname === "/api/groups",
		(route: Route) => {
			if (route.request().method() === "GET") {
				return route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ success: true, groups: teams }),
				});
			}
			return route.continue();
		},
	);
}

async function gotoTeamsTab(page: Page) {
	await page.goto("/apps/profiles/account/role");
	// Esperar a que cargue — skeleton tiene width fijo, heading visible cuando carga
	await expect(page.locator("text=/Gestión de Equipos|Crear tu Primer Equipo|Eres Miembro|Miembros del Equipo/i").first()).toBeVisible({
		timeout: 15_000,
	});
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Usuario FREE
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — user FREE → muestra 'Gestión de Equipos' + alert de upgrade", async ({ page }) => {
	await mockSubscription(page, SUBSCRIPTION_FREE);
	await mockTeams(page, []);

	await gotoTeamsTab(page);

	await expect(page.getByRole("heading", { name: "Gestión de Equipos" })).toBeVisible({ timeout: 10_000 });
	await expect(page.getByText(/Tu plan actual \(Gratuito\) no incluye la gestión de equipos/i)).toBeVisible();
	await expect(page.getByText(/Actualiza a un plan Estándar o Premium/i)).toBeVisible();
});

test("GRUPO 1 — user FREE → botón 'Ver Planes Disponibles' navega a /suscripciones/tables", async ({ page }) => {
	await mockSubscription(page, SUBSCRIPTION_FREE);
	await mockTeams(page, []);

	await gotoTeamsTab(page);

	const upgradeBtn = page.getByRole("button", { name: "Ver Planes Disponibles" });
	await expect(upgradeBtn).toBeVisible({ timeout: 10_000 });
	await upgradeBtn.click();

	await expect(page).toHaveURL(/\/suscripciones\/tables/, { timeout: 10_000 });
});

test("GRUPO 1 — user FREE → NO muestra botón 'Crear Equipo' ni MembersTable", async ({ page }) => {
	await mockSubscription(page, SUBSCRIPTION_FREE);
	await mockTeams(page, []);

	await gotoTeamsTab(page);
	await expect(page.getByRole("heading", { name: "Gestión de Equipos" })).toBeVisible({ timeout: 10_000 });

	await expect(page.getByRole("button", { name: /Crear Equipo/i })).not.toBeVisible({ timeout: 2_000 });
	await expect(page.getByText("Miembros del Equipo")).not.toBeVisible({ timeout: 2_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Usuario PREMIUM sin teams
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — user PREMIUM sin teams → 'Crear tu Primer Equipo' + botón Crear", async ({ page }) => {
	await mockSubscription(page, SUBSCRIPTION_PREMIUM);
	await mockTeams(page, []);

	await gotoTeamsTab(page);

	await expect(page.getByRole("heading", { name: "Crear tu Primer Equipo" })).toBeVisible({ timeout: 10_000 });
	// Mensaje con el límite del plan premium
	await expect(page.getByText(/hasta 10 miembros en tu plan Premium/i)).toBeVisible();

	const createBtn = page.getByRole("button", { name: /Crear Equipo/i });
	await expect(createBtn).toBeVisible();
	await expect(createBtn).toBeEnabled();
});

test("GRUPO 2 — user STANDARD → muestra '5 miembros en tu plan Estándar'", async ({ page }) => {
	await mockSubscription(page, SUBSCRIPTION_STANDARD);
	await mockTeams(page, []);

	await gotoTeamsTab(page);

	await expect(page.getByRole("heading", { name: "Crear tu Primer Equipo" })).toBeVisible({ timeout: 10_000 });
	await expect(page.getByText(/hasta 5 miembros en tu plan Estándar/i)).toBeVisible();
});

test("GRUPO 2 — click 'Crear Equipo' abre CreateTeamDialog", async ({ page }) => {
	await mockSubscription(page, SUBSCRIPTION_PREMIUM);
	await mockTeams(page, []);

	await gotoTeamsTab(page);
	await page.getByRole("button", { name: /Crear Equipo/i }).click();

	// Dialog con input de nombre
	await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Usuario PREMIUM con team (owner)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — user PREMIUM + team → muestra nombre del team + counter de miembros", async ({ page }) => {
	await mockSubscription(page, SUBSCRIPTION_PREMIUM);
	await mockTeams(page, [buildTeamAsOwner(USER_ID)]);

	await gotoTeamsTab(page);

	// Header con el nombre del team (h5 del card, no el TeamSelector compacto del layout)
	await expect(page.getByRole("heading", { name: "Estudio Jurídico E2E" })).toBeVisible({ timeout: 10_000 });
	// Counter N/maxMembers (1/10 — solo el owner)
	await expect(page.getByText(/1\s*\/\s*10/)).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 3 — user PREMIUM + team (owner) → MembersTable + InviteMembersForm visibles", async ({ page }) => {
	await mockSubscription(page, SUBSCRIPTION_PREMIUM);
	await mockTeams(page, [buildTeamAsOwner(USER_ID)]);

	await gotoTeamsTab(page);

	await expect(page.getByText("Miembros del Equipo")).toBeVisible({ timeout: 10_000 });
	// El InviteMembersForm aparece solo para admin/owner — verificamos que hay algún input de email
	await expect(page.getByRole("textbox").first()).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 3 — user PREMIUM + team (owner) → botón 'Eliminar Equipo' en zona de peligro", async ({ page }) => {
	await mockSubscription(page, SUBSCRIPTION_PREMIUM);
	await mockTeams(page, [buildTeamAsOwner(USER_ID)]);

	await gotoTeamsTab(page);

	await expect(page.getByText("Zona de Peligro")).toBeVisible({ timeout: 10_000 });
	await expect(page.getByRole("button", { name: "Eliminar Equipo" })).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Usuario invitado (miembro no-owner)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — user invitado a team ajeno → vista 'Eres Miembro de un Equipo'", async ({ page }) => {
	// Un user con plan free PUEDE ser miembro de un team de otro (no necesita plan pagado)
	await mockSubscription(page, SUBSCRIPTION_FREE);
	await mockTeams(page, [buildTeamAsMember(USER_ID, "owner_ajeno_id")]);

	await gotoTeamsTab(page);

	await expect(page.getByRole("heading", { name: "Eres Miembro de un Equipo" })).toBeVisible({ timeout: 10_000 });
	// Nombre del team (h6 del card, no el TeamSelector del layout global)
	await expect(page.getByRole("heading", { name: "Equipo Ajeno" })).toBeVisible();
	await expect(page.getByText(/rol de Editor/i)).toBeVisible();
});

test("GRUPO 4 — user invitado → botón 'Abandonar Equipo' visible", async ({ page }) => {
	await mockSubscription(page, SUBSCRIPTION_FREE);
	await mockTeams(page, [buildTeamAsMember(USER_ID, "owner_ajeno_id")]);

	await gotoTeamsTab(page);

	await expect(page.getByRole("button", { name: /Abandonar Equipo/i }).first()).toBeVisible({ timeout: 10_000 });
});
