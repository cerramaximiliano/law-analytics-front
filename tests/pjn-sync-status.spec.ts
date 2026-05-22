/**
 * Tests del componente PjnSyncStatus dentro de la pestaña Actividad del detalle de carpeta.
 *
 * PjnSyncStatus se renderiza en ActivityTables cuando:
 *   - movementsData.pjnAccess === true (la carpeta tiene acceso PJN)
 *   - scrapingProgress es falsy (no hay scraping en curso)
 *
 * Los movimientos se cargan desde:
 *   - GET http://localhost:5000/api/movements/folder/:folderId
 *
 * Casos de prueba:
 *   - Sin causaLastSyncDate → "Pendiente de primera sincronización PJN"
 *   - Con causaLastSyncDate  → "Última actualización PJN: DD/MM/YYYY HH:mm"
 *
 * GRUPO 1 — Estado pendiente (sin fecha de sincronización)
 * GRUPO 2 — Estado sincronizado (con fecha de sincronización)
 */

import { test, expect } from "@playwright/test";
import dayjs from "dayjs";

test.use({ storageState: "tests/.auth/user.json" });

const VITE_BASE = "http://localhost:5000";
const FOLDER_ID = "pjn-folder-test-456";

const FOLDER_DETAIL_WILDCARD = `${VITE_BASE}/api/folders/**`;
const CONTACTS_API = `${VITE_BASE}/api/contacts/**`;
const MOVEMENTS_API = `${VITE_BASE}/api/movements/**`;
const NOTIFICATIONS_API = `${VITE_BASE}/api/notifications/**`;
const EVENTS_API = `${VITE_BASE}/api/events/**`;
const ACTIVITIES_API = `${VITE_BASE}/api/activities/**`;
const STATS_API = `${VITE_BASE}/api/stats/**`;
const POSTAL_DOCS_API = "**/api/postal-documents**";
const RICHTEXT_DOCS_API = "**/api/rich-text-documents**";

const MOCK_PJN_FOLDER = {
	_id: FOLDER_ID,
	folderName: "Carpeta PJN Playwright",
	status: "Activa",
	materia: "Civil",
	source: "pjn",
	pjn: "123456/2024",
	mev: null,
	eje: null,
};

const FOLDER_OK = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({ success: true, folder: MOCK_PJN_FOLDER }),
};

const EMPTY_DOCS = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({ success: true, documents: [], total: 0 }),
};

const EMPTY_LIST = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({ success: true, contacts: [], data: [], folders: [], groups: [] }),
};

/**
 * Construye la respuesta mock del endpoint de movimientos.
 * El reducer usa el formato paginado (data.pjnAccess) cuando page/limit están presentes.
 * ActivityTables llama con { page: 1, limit: 10 } → isPaginated=true → espera response.data.data.pjnAccess.
 */
function buildMovementsResponse(causaLastSyncDate?: string | null) {
	return {
		status: 200,
		contentType: "application/json",
		body: JSON.stringify({
			success: true,
			data: {
				movements: [],
				pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
				totalWithLinks: 0,
				documentsBeforeThisPage: 0,
				documentsInThisPage: 0,
				pjnAccess: true,
				scrapingProgress: null,
				causaLastSyncDate: causaLastSyncDate ?? null,
			},
		}),
	};
}

/** Configura los interceptores comunes del detalle de carpeta */
async function setupInterceptors(page: any, movementsResponse: any) {
	await page.route(FOLDER_DETAIL_WILDCARD, (route: any) => {
		const url = route.request().url();
		if (url.includes(FOLDER_ID)) {
			return route.fulfill(FOLDER_OK);
		}
		return route.fulfill(EMPTY_LIST);
	});
	await page.route(CONTACTS_API, (route: any) => route.fulfill(EMPTY_LIST));
	await page.route(MOVEMENTS_API, (route: any) => route.fulfill(movementsResponse));
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
	await page.route(POSTAL_DOCS_API, (route: any) => route.fulfill(EMPTY_DOCS));
	await page.route(RICHTEXT_DOCS_API, (route: any) => route.fulfill(EMPTY_DOCS));
}

/** Navega al detalle de la carpeta PJN mock */
async function navigateToFolderDetail(page: any) {
	await page.goto(`/apps/folders/details/${FOLDER_ID}`);
	// Usar .first() porque el nombre de la carpeta aparece en múltiples elementos (breadcrumb, h2, FolderDataCompact)
	await expect(page.getByText("Carpeta PJN Playwright").first()).toBeVisible({ timeout: 15_000 });
}

/** Hace click en la pestaña "Actividad" (índice 1) */
async function clickActividadTab(page: any) {
	const actividadTab = page.getByRole("tab", { name: /actividad/i });
	await expect(actividadTab).toBeVisible({ timeout: 10_000 });
	await actividadTab.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Estado pendiente (sin fecha de sincronización)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 1 — PjnSyncStatus: pendiente de primera sincronización", () => {
	test.beforeEach(async ({ page }) => {
		await setupInterceptors(page, buildMovementsResponse(null));
		await navigateToFolderDetail(page);
		await clickActividadTab(page);
	});

	test("muestra 'Pendiente de primera sincronización PJN' cuando no hay fecha", async ({ page }) => {
		await expect(page.getByText("Pendiente de primera sincronización PJN")).toBeVisible({ timeout: 10_000 });
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Estado sincronizado (con fecha de sincronización)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 2 — PjnSyncStatus: última actualización con fecha", () => {
	const SYNC_DATE = "2024-03-15T14:30:00.000Z";
	const EXPECTED_DATE = dayjs(SYNC_DATE).format("DD/MM/YYYY HH:mm"); // "15/03/2024 14:30"

	test.beforeEach(async ({ page }) => {
		await setupInterceptors(page, buildMovementsResponse(SYNC_DATE));
		await navigateToFolderDetail(page);
		await clickActividadTab(page);
	});

	test("muestra 'Última actualización PJN' con la fecha formateada", async ({ page }) => {
		// El componente renderiza: "Última actualización PJN: DD/MM/YYYY HH:mm"
		await expect(page.getByText(/Última actualización PJN/i)).toBeVisible({ timeout: 10_000 });
	});

	test("muestra la fecha y hora correctamente formateadas", async ({ page }) => {
		await expect(page.getByText(`Última actualización PJN: ${EXPECTED_DATE}`).first()).toBeVisible({
			timeout: 10_000,
		});
	});
});
