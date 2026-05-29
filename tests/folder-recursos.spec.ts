/**
 * Tests de la pestaña Recursos (FolderDocumentsTab) dentro del detalle de carpeta.
 *
 * La pestaña "Recursos" está en el índice 3 del componente Details y contiene
 * FolderDocumentsTab, que muestra documentos vinculados a la carpeta (postales
 * y rich-text). Se carga vía dos endpoints:
 *   - GET /api/postal-documents?folderId=:id
 *   - GET /api/rich-text-documents?folderId=:id
 *
 * La carpeta en sí se carga desde:
 *   - GET http://localhost:5000/api/folders/:id
 *
 * El estado vacío muestra "Sin documentos vinculados" y un botón "Nuevo documento".
 * Con documentos muestra una tabla con columnas "Tipo", "Título".
 *
 * GRUPO 1 — Navegación hasta la pestaña Recursos
 * GRUPO 2 — Estado vacío (sin documentos vinculados)
 * GRUPO 3 — Con documentos: tabla y columnas
 */

import { test, expect } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

const VITE_BASE = "http://localhost:5000";
const FOLDER_ID = "test-folder-abc-123";

/** Carpeta mock usada para todas las pruebas */
const MOCK_FOLDER = {
	_id: FOLDER_ID,
	folderName: "Test Carpeta Playwright",
	status: "Activa",
	materia: "Civil",
	source: "manual",
	pjn: null,
	mev: null,
	eje: null,
};

const FOLDER_DETAIL_API = `${VITE_BASE}/api/folders/${FOLDER_ID}`;
const FOLDER_DETAIL_WILDCARD = `${VITE_BASE}/api/folders/**`;
const CONTACTS_API = `${VITE_BASE}/api/contacts/**`;
const MOVEMENTS_API = `${VITE_BASE}/api/movements/**`;
const NOTIFICATIONS_API = `${VITE_BASE}/api/notifications/**`;
const EVENTS_API = `${VITE_BASE}/api/events/**`;
const ACTIVITIES_API = `${VITE_BASE}/api/activities/**`;
const STATS_API = `${VITE_BASE}/api/stats/**`;

/** Los reducers de postal y rich-text usan URLs relativas → interceptar en origen del frontend */
const POSTAL_DOCS_API = "**/api/postal-documents**";
const RICHTEXT_DOCS_API = "**/api/rich-text-documents**";

const FOLDER_OK = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({ success: true, folder: MOCK_FOLDER }),
};

const EMPTY_DOCS = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({ success: true, documents: [], total: 0 }),
};

const EMPTY_LIST = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({ success: true, contacts: [], data: [], folders: [] }),
};

/** Documentos mock: un postal + un rich-text */
const WITH_DOCS_POSTAL = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({
		success: true,
		documents: [
			{
				_id: "postal-doc-001",
				title: "Telegrama de prueba",
				templateCategory: "Telegrama",
				templateName: "Telegrama",
				status: "draft",
				createdAt: "2024-03-01T10:00:00.000Z",
				documentUrl: "https://example.com/doc.pdf",
			},
		],
		total: 1,
	}),
};

const WITH_DOCS_RICHTEXT = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({
		success: true,
		documents: [
			{
				_id: "richtext-doc-001",
				title: "Escrito de demanda",
				templateCategory: "Demanda",
				status: "final",
				createdAt: "2024-03-02T10:00:00.000Z",
			},
		],
		total: 1,
	}),
};

/** Navega al detalle de la carpeta de prueba y aguarda que cargue */
async function navigateToFolderDetail(page: any) {
	await page.goto(`/apps/folders/details/${FOLDER_ID}`);
	// Esperar que aparezca el nombre de la carpeta — usar .first() porque aparece en múltiples lugares (breadcrumb, h2, FolderDataCompact)
	await expect(page.getByText("Test Carpeta Playwright").first()).toBeVisible({ timeout: 15_000 });
}

/** Abre la pestaña "Recursos" (índice 3) */
async function clickRecursosTab(page: any) {
	const recursosTab = page.getByRole("tab", { name: /recursos/i });
	await expect(recursosTab).toBeVisible({ timeout: 10_000 });
	await recursosTab.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup común: intercepta todas las APIs necesarias para cargar el detalle
// ─────────────────────────────────────────────────────────────────────────────

async function setupFolderInterceptors(page: any, postalResp: any, richtextResp: any) {
	await page.route(FOLDER_DETAIL_WILDCARD, (route: any) => {
		const url = route.request().url();
		if (url.includes(FOLDER_ID)) {
			return route.fulfill(FOLDER_OK);
		}
		return route.fulfill(EMPTY_LIST);
	});
	await page.route(CONTACTS_API, (route: any) => route.fulfill(EMPTY_LIST));
	await page.route(MOVEMENTS_API, (route: any) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, movements: [], total: 0, pjnAccess: false }),
		}),
	);
	await page.route(NOTIFICATIONS_API, (route: any) =>
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) }),
	);
	await page.route(EVENTS_API, (route: any) =>
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) }),
	);
	await page.route(ACTIVITIES_API, (route: any) =>
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) }),
	);
	await page.route(STATS_API, (route: any) =>
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: {} }) }),
	);
	await page.route(POSTAL_DOCS_API, (route: any) => route.fulfill(postalResp));
	await page.route(RICHTEXT_DOCS_API, (route: any) => route.fulfill(richtextResp));
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Navegación a la pestaña Recursos
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 1 — FolderRecursosTab: navegación y apertura de pestaña", () => {
	test.beforeEach(async ({ page }) => {
		await setupFolderInterceptors(page, EMPTY_DOCS, EMPTY_DOCS);
	});

	test("pestaña Recursos es visible en el detalle de carpeta", async ({ page }) => {
		await navigateToFolderDetail(page);

		const recursosTab = page.getByRole("tab", { name: /recursos/i });
		await expect(recursosTab).toBeVisible({ timeout: 10_000 });
	});

	test("hacer click en Recursos activa la pestaña correcta", async ({ page }) => {
		await navigateToFolderDetail(page);
		await clickRecursosTab(page);

		// La pestaña activa tiene aria-selected=true
		const recursosTab = page.getByRole("tab", { name: /recursos/i });
		await expect(recursosTab).toHaveAttribute("aria-selected", "true", { timeout: 5_000 });
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Estado vacío (sin documentos)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 2 — FolderRecursosTab: estado vacío", () => {
	test.beforeEach(async ({ page }) => {
		await setupFolderInterceptors(page, EMPTY_DOCS, EMPTY_DOCS);
	});

	test("muestra 'Sin documentos vinculados' cuando no hay documentos", async ({ page }) => {
		await navigateToFolderDetail(page);
		await clickRecursosTab(page);

		await expect(page.getByText("Sin documentos vinculados")).toBeVisible({ timeout: 10_000 });
	});

	test("muestra botón 'Nuevo documento' en estado vacío", async ({ page }) => {
		await navigateToFolderDetail(page);
		await clickRecursosTab(page);

		await expect(page.getByRole("button", { name: /nuevo documento/i })).toBeVisible({ timeout: 8_000 });
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Con documentos: tabla y columnas
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 3 — FolderRecursosTab: tabla con documentos", () => {
	test.beforeEach(async ({ page }) => {
		await setupFolderInterceptors(page, WITH_DOCS_POSTAL, WITH_DOCS_RICHTEXT);
	});

	test("muestra columnas 'Tipo' y 'Título' en la tabla", async ({ page }) => {
		await navigateToFolderDetail(page);
		await clickRecursosTab(page);

		await expect(page.getByRole("columnheader", { name: "Tipo" })).toBeVisible({ timeout: 10_000 });
		await expect(page.getByRole("columnheader", { name: "Título" })).toBeVisible({ timeout: 5_000 });
	});

	test("muestra el documento postal en la tabla", async ({ page }) => {
		await navigateToFolderDetail(page);
		await clickRecursosTab(page);

		// El título del documento postal debe aparecer en una celda
		await expect(page.getByText("Telegrama de prueba")).toBeVisible({ timeout: 10_000 });
	});

	test("muestra el documento rich-text en la tabla", async ({ page }) => {
		await navigateToFolderDetail(page);
		await clickRecursosTab(page);

		await expect(page.getByText("Escrito de demanda")).toBeVisible({ timeout: 10_000 });
	});
});
