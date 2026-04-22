/**
 * Tests E2E de Contactos — /apps/customer/customer-list
 *
 * Todos los tests usan storageState (sesión pre-autenticada) + backend real.
 * Sin mocks de suscripción ni de plan-configs: los límites se verifican contra
 * el backend real para reflejar el comportamiento exacto de producción.
 *
 * beforeAll: limpia contactos E2E previos y archiva reales hasta dejar ≤ 4 activos,
 * garantizando espacio para los tests CRUD sin interferir con el límite (10 en plan free).
 *
 * GRUPO 2 — Estado vacío: único mock aceptable (simula UI con 0 contactos, difícil
 * de lograr con backend real sin borrar todos los datos del usuario).
 *
 * GRUPO 8 — Límite del plan: rellena hasta el límite real vía API antes de navegar,
 * verifica el comportamiento real de Capa 1 (Redux) y Capa 2 (AddCustomer).
 * Para planes con límites altos (50-100) esta estrategia sería costosa en tiempo;
 * en ese caso habría que archivar hasta dejar 1 slot libre en lugar de crear hasta el tope.
 *
 * data-testid usados:
 *   contacts-add-btn   → botón "Agregar Contacto"
 *   contact-edit-btn   → botón editar en cada fila
 *   contact-delete-btn → botón eliminar en cada fila
 *
 * GRUPO 1 — Carga y renderizado básico
 * GRUPO 2 — Estado vacío (mock GET → { contacts: [] })
 * GRUPO 3 — Crear contacto (POST real)
 * GRUPO 4 — Editar contacto (PUT real)
 * GRUPO 5 — Eliminar contacto (DELETE real)
 * GRUPO 6 — Búsqueda en tabla
 * GRUPO 7 — Archivar y desarchivar contacto
 * GRUPO 8 — Límite del plan: LimitErrorModal real
 */

import { test, expect, type Page, request } from "@playwright/test";
import * as fs from "fs";

test.use({ storageState: "tests/.auth/user.json" });

const API_BASE = "http://localhost:5000";
const makeName = () => `E2EContact-${Date.now()}`;

// ─── Helpers de token (Node context, para beforeAll y GRUPO 8) ────────────────

function readTokenFromStorage(): string {
	try {
		const raw = fs.readFileSync("tests/.auth/user.json", "utf8");
		const entries: any[] = JSON.parse(raw)?.origins?.[0]?.localStorage ?? [];
		return entries.find((e) => e.name === "token")?.value ?? "";
	} catch {
		return "";
	}
}

function decodeUserId(token: string): string {
	try {
		const payload = JSON.parse(Buffer.from(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
		return payload.id ?? payload._id ?? payload.userId ?? payload.sub ?? "";
	} catch {
		return "";
	}
}

// ─── Limpieza previa ──────────────────────────────────────────────────────────
//
// Objetivo: dejar ≤ 4 contactos activos antes de la suite para que los tests
// CRUD (que crean y eliminan de a 1) nunca alcancen el límite del plan free (10).

test.beforeAll(async () => {
	const token = readTokenFromStorage();
	const userId = decodeUserId(token);
	if (!token || !userId) return;

	const ctx = await request.newContext();
	try {
		const res = await ctx.get(`${API_BASE}/api/contacts/user/${userId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok()) return;

		const data = await res.json();
		const contacts: any[] = data.contacts ?? [];

		// 1. Eliminar contactos E2E de corridas anteriores
		const e2eContacts = contacts.filter(
			(c: any) => String(c.name ?? "").startsWith("E2EContact") || String(c.name ?? "").startsWith("E2EFiller") || c.lastName === "E2EApellido",
		);
		for (const c of e2eContacts) {
			await ctx.delete(`${API_BASE}/api/contacts/${c._id}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
		}

		// 2. Si quedan > 4 contactos reales, archivar los más viejos hasta llegar a 4
		const real = contacts.filter((c: any) => !e2eContacts.includes(c));
		if (real.length > 4) {
			const toArchive = real.slice(0, real.length - 4).map((c: any) => c._id);
			await ctx.post(`${API_BASE}/api/subscriptions/archive-items?userId=${userId}`, {
				headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
				data: { resourceType: "contacts", itemIds: toArchive },
			});
		}
	} catch {
		// best-effort
	} finally {
		await ctx.dispose();
	}
});

// ─── Helpers de página ────────────────────────────────────────────────────────

async function getAuthToken(page: Page): Promise<string> {
	return (await page.evaluate(() => localStorage.getItem("token"))) ?? "";
}

async function getUserId(page: Page): Promise<string> {
	return (await page.evaluate(() => {
		const token = localStorage.getItem("token") ?? "";
		try {
			const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
			return payload.id ?? payload._id ?? payload.userId ?? payload.sub ?? "";
		} catch {
			return "";
		}
	})) ?? "";
}

async function deleteContactById(page: Page, contactId: string): Promise<void> {
	const token = await getAuthToken(page);
	await page.request.delete(`${API_BASE}/api/contacts/${contactId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

/**
 * Consulta el límite del plan y el conteo actual de contactos activos.
 * Usa el endpoint real para que el test sea agnóstico al plan del usuario.
 */
async function getPlanInfo(token: string): Promise<{ limit: number; currentCount: number }> {
	const ctx = await request.newContext();
	try {
		const res = await ctx.get(`${API_BASE}/api/plan-configs/check-resource/contacts`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const json = await res.json();
		return {
			limit: json.data?.limit ?? 10,
			currentCount: json.data?.currentCount ?? 0,
		};
	} finally {
		await ctx.dispose();
	}
}

/** Crea N contactos E2E vía API y retorna sus IDs. */
async function createFillerContacts(token: string, userId: string, count: number): Promise<string[]> {
	if (count <= 0) return [];
	const ctx = await request.newContext();
	const ids: string[] = [];
	try {
		for (let i = 0; i < count; i++) {
			const res = await ctx.post(`${API_BASE}/api/contacts/create`, {
				headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
				data: { name: `E2EFiller-${i}-${Date.now()}`, lastName: "E2EApellido", type: "Humana", role: "Cliente", state: "Buenos Aires", city: "La Plata", userId },
			});
			const id = (await res.json()).contact?._id ?? "";
			if (id) ids.push(id);
		}
	} finally {
		await ctx.dispose();
	}
	return ids;
}

/** Archiva los contactos indicados — usado como cleanup en tests de límite. */
async function archiveContactsByIds(page: Page, userId: string, ids: string[]): Promise<void> {
	if (!ids.length) return;
	const token = await getAuthToken(page);
	await page.request.post(`${API_BASE}/api/subscriptions/archive-items?userId=${userId}`, {
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		data: { resourceType: "contacts", itemIds: ids },
	});
}

async function gotoContactos(page: Page): Promise<void> {
	await page.goto("/apps/customer/customer-list");
	await expect(page.locator("table, .MuiSkeleton-root").first()).toBeVisible({ timeout: 15_000 });
	await expect(page.locator(".MuiSkeleton-root").first()).not.toBeVisible({ timeout: 15_000 });
}

/**
 * Crea un contacto vía UI (formulario de 4 pasos) y retorna su _id.
 * Requiere que la cuenta esté por debajo del límite del plan.
 */
async function createContactViaUI(page: Page, firstName: string, lastName: string): Promise<string> {
	await page.locator('[data-testid="contacts-add-btn"]').click();
	await expect(page.getByRole("heading", { name: "Agregar Nuevo Contacto", exact: true })).toBeVisible({ timeout: 10_000 });

	// Paso 1: Tipo y Categoría
	await page.locator(".MuiSelect-select").filter({ hasText: /Seleccione un tipo/ }).click();
	await page.getByRole("option", { name: "Humana" }).click();
	await page.locator(".MuiSelect-select").filter({ hasText: /Seleccione una categoría/ }).click();
	await page.getByRole("option", { name: "Cliente" }).click();
	await page.getByRole("button", { name: "Siguiente" }).click();

	// Paso 2: Datos Personales
	await expect(page.locator("text=Paso 2 de 4")).toBeVisible({ timeout: 5_000 });
	await page.locator("#name").fill(firstName);
	await page.locator("#lastName").fill(lastName);
	await page.getByRole("button", { name: "Siguiente" }).click();

	// Paso 3: Datos de Contacto
	await expect(page.locator("text=Paso 3 de 4")).toBeVisible({ timeout: 5_000 });
	await page.locator(".MuiSelect-select").filter({ hasText: /Seleccione una provincia/ }).click();
	await page.getByRole("option", { name: "Buenos Aires" }).click();
	await page.locator("#city").fill("La Plata");
	await page.getByRole("button", { name: "Siguiente" }).click();

	// Paso 4: Información Adicional
	await expect(page.locator("text=Paso 4 de 4")).toBeVisible({ timeout: 5_000 });

	const [response] = await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/contacts/create") && r.request().method() === "POST"),
		page.getByRole("button", { name: "Crear" }).click(),
	]);

	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15_000 });
	const data = await response.json();
	return data.contact?._id ?? data._id ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Carga y renderizado básico
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — navega a /apps/customer/customer-list y renderiza la tabla", async ({ page }) => {
	await gotoContactos(page);

	await expect(page).toHaveURL(/customer-list/);
	await expect(page.locator("table")).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 1 — columna 'Nombre' y botón 'Agregar Contacto' son visibles", async ({ page }) => {
	await gotoContactos(page);

	await expect(page.getByRole("columnheader", { name: "Nombre" })).toBeVisible({ timeout: 5_000 });
	await expect(page.locator('[data-testid="contacts-add-btn"]')).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Estado vacío (mock GET)
// Mock aceptable: simula UI con 0 contactos sin tener que borrar datos reales.
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — sin contactos → mensaje de estado vacío visible", async ({ page }) => {
	await page.route(`${API_BASE}/api/contacts/**`, (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ contacts: [], archivedByFolderCount: 0 }),
		}),
	);

	await gotoContactos(page);

	await expect(page.getByText(/No hay contactos creados/)).toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Crear contacto
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — click 'Agregar Contacto' → modal 'Agregar Nuevo Contacto' se abre", async ({ page }) => {
	await gotoContactos(page);

	await page.locator('[data-testid="contacts-add-btn"]').click();

	await expect(page.getByRole("heading", { name: "Agregar Nuevo Contacto", exact: true })).toBeVisible({ timeout: 10_000 });
	await expect(page.getByRole("dialog")).toBeVisible();
});

test("GRUPO 3 — submit paso 1 sin tipo → error 'El tipo es requerido'", async ({ page }) => {
	await gotoContactos(page);

	await page.locator('[data-testid="contacts-add-btn"]').click();
	await expect(page.getByRole("heading", { name: "Agregar Nuevo Contacto", exact: true })).toBeVisible({ timeout: 10_000 });

	await page.getByRole("button", { name: "Siguiente" }).click();

	await expect(page.getByText("El tipo es requerido")).toBeVisible({ timeout: 3_000 });
});

test("GRUPO 3 — cancelar creación → modal se cierra sin POST", async ({ page }) => {
	await gotoContactos(page);

	await page.locator('[data-testid="contacts-add-btn"]').click();
	await expect(page.getByRole("heading", { name: "Agregar Nuevo Contacto", exact: true })).toBeVisible({ timeout: 10_000 });

	let postCalled = false;
	page.on("request", (req) => {
		if (req.url().includes("/api/contacts/create") && req.method() === "POST") postCalled = true;
	});

	await page.getByRole("button", { name: "Cancelar" }).click();

	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 });
	expect(postCalled).toBe(false);
});

test("GRUPO 3 — crear contacto real → POST /api/contacts/create → snackbar 'Éxito al agregar'", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoContactos(page);

	const firstName = makeName();
	const contactId = await createContactViaUI(page, firstName, "E2EApellido");

	await expect(page.getByText("Éxito al agregar el contacto")).toBeVisible({ timeout: 10_000 });

	if (contactId) await deleteContactById(page, contactId);
});

test("GRUPO 3 — contacto creado aparece en la tabla", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoContactos(page);

	const firstName = makeName();
	const contactId = await createContactViaUI(page, firstName, "E2EApellido");

	await expect(page.getByRole("cell", { name: new RegExp(firstName) })).toBeVisible({ timeout: 10_000 });

	if (contactId) await deleteContactById(page, contactId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Editar contacto
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — click 'Editar' → modal 'Editar Contacto' con nombre pre-cargado", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoContactos(page);

	const firstName = makeName();
	const contactId = await createContactViaUI(page, firstName, "E2EApellido");

	const row = page.getByRole("row").filter({ hasText: firstName });
	await row.locator('[data-testid="contact-edit-btn"]').click();

	await expect(page.getByRole("heading", { name: "Editar Contacto", exact: true })).toBeVisible({ timeout: 5_000 });

	// Avanzar al paso con nombre para verificar que está pre-cargado
	await page.getByRole("button", { name: "Siguiente" }).click();
	await expect(page.locator("#name")).toHaveValue(firstName, { timeout: 3_000 });

	await page.getByRole("button", { name: "Cancelar" }).click();

	if (contactId) await deleteContactById(page, contactId);
});

test("GRUPO 4 — editar nombre → PUT /api/contacts/:id → snackbar 'Éxito al editar'", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoContactos(page);

	const firstName = makeName();
	const contactId = await createContactViaUI(page, firstName, "E2EApellido");

	const row = page.getByRole("row").filter({ hasText: firstName });
	await row.locator('[data-testid="contact-edit-btn"]').click();
	await expect(page.getByRole("heading", { name: "Editar Contacto", exact: true })).toBeVisible({ timeout: 5_000 });

	await page.getByRole("button", { name: "Siguiente" }).click();
	await expect(page.locator("text=Paso 2 de 4")).toBeVisible({ timeout: 5_000 });

	const newFirstName = `${firstName}-edit`;
	await page.locator("#name").clear();
	await page.locator("#name").fill(newFirstName);

	await page.getByRole("button", { name: "Siguiente" }).click();
	await expect(page.locator("text=Paso 3 de 4")).toBeVisible({ timeout: 5_000 });
	await page.getByRole("button", { name: "Siguiente" }).click();
	await expect(page.locator("text=Paso 4 de 4")).toBeVisible({ timeout: 5_000 });

	const [response] = await Promise.all([
		page.waitForResponse((r) => r.url().includes(`/api/contacts/${contactId}`) && r.request().method() === "PUT"),
		page.getByRole("button", { name: "Guardar" }).click(),
	]);

	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });
	await expect(page.getByText("Éxito al editar el contacto")).toBeVisible({ timeout: 10_000 });

	const data = await response.json();
	expect(data.success ?? true).toBeTruthy();

	if (contactId) await deleteContactById(page, contactId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Eliminar contacto
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — click 'Eliminar' → modal de confirmación se abre", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoContactos(page);

	const firstName = makeName();
	const contactId = await createContactViaUI(page, firstName, "E2EApellido");

	const row = page.getByRole("row").filter({ hasText: firstName });
	await row.locator('[data-testid="contact-delete-btn"]').click();

	await expect(page.getByText("¿Estás seguro que deseas eliminarlo?")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("dialog")).toBeVisible();

	await page.getByRole("button", { name: "Cancelar" }).click();
	await expect(page.getByText("¿Estás seguro que deseas eliminarlo?")).not.toBeVisible({ timeout: 5_000 });

	if (contactId) await deleteContactById(page, contactId);
});

test("GRUPO 5 — confirmar eliminación → DELETE /api/contacts/:id → contacto desaparece", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoContactos(page);

	const firstName = makeName();
	await createContactViaUI(page, firstName, "E2EApellido");

	const row = page.getByRole("row").filter({ hasText: firstName });
	await row.locator('[data-testid="contact-delete-btn"]').click();
	await expect(page.getByText("¿Estás seguro que deseas eliminarlo?")).toBeVisible({ timeout: 5_000 });

	await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/contacts/") && r.request().method() === "DELETE"),
		page.getByRole("button", { name: "Eliminar" }).click(),
	]);

	await expect(page.getByRole("cell", { name: new RegExp(firstName) })).not.toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — Búsqueda en tabla
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — buscar por nombre → tabla filtra correctamente", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoContactos(page);

	const firstName = makeName();
	const contactId = await createContactViaUI(page, firstName, "E2EApellido");

	const searchInput = page.getByPlaceholder(/Buscar en \d+ registros/);
	await searchInput.fill(firstName);

	await expect(page.getByRole("cell", { name: new RegExp(firstName) })).toBeVisible({ timeout: 5_000 });

	await searchInput.clear();

	if (contactId) await deleteContactById(page, contactId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 7 — Archivar y desarchivar contacto
//
// Test de archivar: flujo completo por UI (crea via formulario, archiva via checkbox+botón).
// Test de desarchivar: setup via API (crear+archivar) para aislar la acción que se testea
//   (la UI de desarchivado), evitando duplicar el flujo de creación ya cubierto en GRUPO 3.
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 7 — archivar contacto via UI → snackbar '1 contacto archivado correctamente'", async ({ page }) => {
	test.setTimeout(90_000);
	// Flujo completo UI: crea el contacto via formulario y lo archiva con checkbox + botón
	await gotoContactos(page);

	const firstName = makeName();
	const contactId = await createContactViaUI(page, firstName, "E2EApellido");

	const row = page.getByRole("row").filter({ hasText: firstName });
	await row.locator('input[type="checkbox"]').click();

	await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/subscriptions/archive-items") && r.request().method() === "POST"),
		page.getByRole("button", { name: /Archivar/ }).click(),
	]);

	await expect(page.getByText("1 contacto archivado correctamente")).toBeVisible({ timeout: 10_000 });
	await expect(page.getByRole("cell", { name: new RegExp(firstName) })).not.toBeVisible({ timeout: 5_000 });

	if (contactId) await deleteContactById(page, contactId);
});

test("GRUPO 7 — ver archivados → modal 'Ver Archivados' se abre", async ({ page }) => {
	await gotoContactos(page);

	await page.getByRole("button", { name: "Ver Archivados" }).click();

	await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
	await expect(page.locator("text=Archivados").first()).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 7 — desarchivar contacto via UI → snackbar '1 contacto desarchivado correctamente'", async ({ page }) => {
	test.setTimeout(90_000);

	// Setup vía API: crear y archivar directamente para aislar la UI de desarchivado.
	// La acción testeada (selección en modal + botón Desarchivar) sí es via UI.
	const token = readTokenFromStorage();
	const userId = decodeUserId(token);
	const firstName = makeName();

	const ctx = await request.newContext();
	const createRes = await ctx.post(`${API_BASE}/api/contacts/create`, {
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		data: { name: firstName, lastName: "E2EApellido", type: "Humana", role: "Cliente", state: "Buenos Aires", city: "La Plata", userId },
	});
	const contactId = (await createRes.json()).contact?._id ?? "";

	await ctx.post(`${API_BASE}/api/subscriptions/archive-items?userId=${userId}`, {
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		data: { resourceType: "contacts", itemIds: [contactId] },
	});
	await ctx.dispose();

	await gotoContactos(page);

	// Acción via UI: abrir modal → seleccionar fila → click Desarchivar
	await page.getByRole("button", { name: "Ver Archivados" }).click();
	await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

	await expect(page.getByRole("dialog").getByText(firstName)).toBeVisible({ timeout: 10_000 });
	await page.getByRole("dialog").getByText(firstName).first().click();

	await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/subscriptions/unarchive-items") && r.request().method() === "POST"),
		page.getByRole("dialog").getByRole("button", { name: /Desarchivar/i }).click(),
	]);

	await expect(page.getByText(/contacto desarchivado correctamente/)).toBeVisible({ timeout: 10_000 });

	if (contactId) await deleteContactById(page, contactId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 8 — Límite del plan
//
// El límite se obtiene dinámicamente desde /api/plan-configs/check-resource/contacts
// para que los tests sean agnósticos al plan del usuario (free, pro, etc.).
//
// Estrategia para plan free (límite bajo ≤ 20):
//   Rellenar hasta el límite vía API, luego intentar superar via API y via UI.
//
// Estrategia para planes altos (límite > 20, a implementar):
//   Archivar hasta dejar 1 slot libre, luego crear 1 para llegar al límite.
//   Evita crear decenas de contactos en cada corrida del test.
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 8 — backend rechaza creación al superar el límite del plan", async ({ page }) => {
	test.setTimeout(120_000);

	const token = readTokenFromStorage();
	const userId = decodeUserId(token);
	const { limit, currentCount } = await getPlanInfo(token);

	// Rellenar hasta el límite exacto
	const fillerIds = await createFillerContacts(token, userId, Math.max(0, limit - currentCount));

	// Intentar crear uno más (superando el límite) → el backend debe rechazarlo
	const ctx = await request.newContext();
	const overRes = await ctx.post(`${API_BASE}/api/contacts/create`, {
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		data: { name: `E2EOver-${Date.now()}`, lastName: "E2EApellido", type: "Humana", role: "Cliente", state: "Buenos Aires", city: "La Plata", userId },
	});
	const overData = await overRes.json();
	await ctx.dispose();

	// El servidor debe devolver error (4xx) o success: false con mensaje de restricción
	expect(overRes.status()).toBeGreaterThanOrEqual(400);
	expect(overData.success).toBe(false);

	// Cleanup
	await gotoContactos(page);
	await archiveContactsByIds(page, userId, fillerIds);
});

test("GRUPO 8 — UI muestra LimitErrorModal al superar el límite (Capa 1 Redux + Capa 2 AddCustomer)", async ({ page }) => {
	test.setTimeout(180_000);

	const token = readTokenFromStorage();
	const userId = decodeUserId(token);
	const { limit, currentCount } = await getPlanInfo(token);

	// Rellenar hasta (límite - 1) via API → deja 1 slot libre
	const fillerIds = await createFillerContacts(token, userId, Math.max(0, limit - currentCount - 1));

	await gotoContactos(page);

	// Crear el último contacto permitido VIA UI — verifica que el sistema lo acepta
	const firstName = makeName();
	const lastId = await createContactViaUI(page, firstName, "E2EApellido");
	if (lastId) fillerIds.push(lastId);
	await expect(page.getByText("Éxito al agregar el contacto")).toBeVisible({ timeout: 10_000 });

	// Recargar para que Redux refleje el conteo actualizado (= límite)
	await gotoContactos(page);

	// Intentar crear otro → Capa 1 (Redux) bloquea antes de abrir AddCustomer
	await page.locator('[data-testid="contacts-add-btn"]').click();
	await expect(page.getByText(/límite de contactos/i)).toBeVisible({ timeout: 10_000 });
	await expect(page.getByRole("button", { name: /Suscribirme/i }).first()).toBeVisible({ timeout: 5_000 });

	// Cleanup
	await archiveContactsByIds(page, userId, fillerIds);
});
