/**
 * Tests E2E de Búsqueda Global (header Ctrl+K search).
 *
 * **Arquitectura:**
 *   - Header: `src/layout/MainLayout/Header/HeaderContent/Search.tsx` — input con
 *     placeholder "Ctrl + K" (id="header-search"). Click o Ctrl+K → `dispatch(openSearch())`.
 *   - Modal: `src/components/search/SearchModal.tsx` — Dialog con:
 *     · Input autofocus (placeholder "Buscar causas, contactos, cálculos, tareas...")
 *     · Lista agrupada por tipo (folder, contact, calculator, task, event)
 *     · Navegación con ↑/↓ + Enter
 *     · Empty state "No se encontraron resultados para {query}"
 *   - Reducer: `src/store/reducers/search.ts` (slice "search")
 *     · Actions: `search/openSearch`, `search/setQuery`, `search/setResults`, `search/closeSearch`
 *   - Estrategia de búsqueda: híbrida (local-first + server fallback)
 *     · GET /api/search para server-side fallback
 *
 * **Estrategia de tests:**
 *   Usamos `window.__store__` (expuesto en dev) para dispatchar directamente
 *   `search/setResults` con fixtures controlados. Esto evita:
 *     1. Depender de que el user real tenga datos específicos
 *     2. Testear el debounce de 300ms (testeable pero flaky)
 *     3. Mockear múltiples endpoints (folders, contacts, calcs, tasks, events)
 *
 *   Testamos el **comportamiento observable**: dado cierto estado Redux,
 *   verificamos que el UI renderiza y navega correctamente.
 *
 * GRUPO 1 — Apertura/cierre del modal (click, Ctrl+K, Esc)
 * GRUPO 2 — Resultados agrupados por tipo (5 tipos)
 * GRUPO 3 — Empty state (query sin resultados)
 * GRUPO 4 — Click en resultado navega a la ruta correspondiente
 */

import { test, expect, type Page } from "@playwright/test";

const STORAGE_STATE = "tests/.auth/user.json";
test.use({ storageState: STORAGE_STATE });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function gotoDashboard(page: Page) {
	await page.goto("/dashboard/default");
	await expect(page.locator("#header-search")).toBeVisible({ timeout: 15_000 });
}

async function openSearchModal(page: Page) {
	// Bloquear el endpoint de search para evitar que el debounce sobrescriba nuestro mock
	await page.route(
		(url) => url.pathname === "/api/search",
		(route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, results: [] }) }),
	);
	// Click directo en el input del header dispara openSearch()
	await page.locator("#header-search").click();
	await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByPlaceholder("Buscar causas, contactos, cálculos, tareas...")).toBeVisible({ timeout: 3_000 });
}

/**
 * Llena el input local del modal (trigger localQuery) + dispatch directo de setResults.
 * El modal requiere `localQuery truthy` AND `results.length > 0` para renderizar (línea 339).
 *
 * Orden importante:
 *   1) Fill input → activa localQuery (state React local)
 *   2) Wait 400ms → pasa el debounce de 300ms, dispara performGlobalSearch (mockeado vacío)
 *   3) Dispatch setResults → sobrescribe con nuestros fixtures
 */
async function setSearchResults(page: Page, query: string, results: unknown[]) {
	const input = page.getByPlaceholder("Buscar causas, contactos, cálculos, tareas...");
	await input.fill(query);
	// Dejar pasar el debounce (300ms) + el fetch mockeado vacío
	await page.waitForTimeout(400);
	await page.evaluate(
		({ q, r }) => {
			const win = window as unknown as { __store__?: { dispatch: (a: unknown) => void } };
			if (!win.__store__) throw new Error("window.__store__ requiere dev mode");
			win.__store__.dispatch({ type: "search/setQuery", payload: q });
			win.__store__.dispatch({ type: "search/setResults", payload: r });
		},
		{ q: query, r: results },
	);
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FOLDER_RESULT = {
	id: "folder_1",
	type: "folder",
	title: "Causa Rodríguez vs Gomez",
	subtitle: "Civil",
	description: "Estado: Nueva",
};

const CONTACT_RESULT = {
	id: "contact_1",
	type: "contact",
	title: "Juan Pérez",
	subtitle: "juan@example.com",
};

const CALCULATOR_RESULT = {
	id: "calc_1",
	type: "calculator",
	title: "Laudo 2024",
	subtitle: "Laboral",
};

const TASK_RESULT = {
	id: "task_1",
	type: "task",
	title: "Redactar demanda",
	subtitle: "Pendiente",
};

const EVENT_RESULT = {
	id: "event_1",
	type: "event",
	title: "Audiencia conciliación",
	subtitle: "14/05/2026 10:00",
};

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Apertura/cierre del modal
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — header muestra input de búsqueda con placeholder 'Ctrl + K'", async ({ page }) => {
	await gotoDashboard(page);
	const input = page.locator("#header-search");
	await expect(input).toBeVisible({ timeout: 5_000 });
	await expect(input).toHaveAttribute("placeholder", /Ctrl \+ K/i);
});

test("GRUPO 1 — click en input abre el SearchModal", async ({ page }) => {
	await gotoDashboard(page);
	await openSearchModal(page);
});

test("GRUPO 1 — Ctrl+K abre el SearchModal", async ({ page }) => {
	await gotoDashboard(page);
	// El modal debería NO estar visible inicialmente
	await expect(page.getByPlaceholder("Buscar causas, contactos, cálculos, tareas...")).not.toBeVisible({ timeout: 2_000 });

	await page.keyboard.press("Control+K");
	await expect(page.getByPlaceholder("Buscar causas, contactos, cálculos, tareas...")).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 1 — Escape cierra el SearchModal", async ({ page }) => {
	await gotoDashboard(page);
	await openSearchModal(page);

	await page.keyboard.press("Escape");
	await expect(page.getByPlaceholder("Buscar causas, contactos, cálculos, tareas...")).not.toBeVisible({ timeout: 5_000 });
});

test("GRUPO 1 — footer muestra chips de keyboard shortcuts", async ({ page }) => {
	await gotoDashboard(page);
	await openSearchModal(page);

	// Los 3 chips de shortcuts visibles en el footer
	await expect(page.getByText("↑↓ Navegar")).toBeVisible({ timeout: 3_000 });
	await expect(page.getByText("↵ Seleccionar")).toBeVisible();
	await expect(page.getByText("ESC Cerrar")).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Resultados agrupados por tipo
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — resultados agrupados muestran labels por tipo", async ({ page }) => {
	await gotoDashboard(page);
	await openSearchModal(page);

	await setSearchResults(page, "test", [FOLDER_RESULT, CONTACT_RESULT, CALCULATOR_RESULT, TASK_RESULT, EVENT_RESULT]);

	// Cada grupo muestra su label en el header con formato "{Type}s ({count})"
	await expect(page.getByText("Causas (1)")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByText("Contactos (1)")).toBeVisible();
	await expect(page.getByText("Cálculos (1)")).toBeVisible();
	await expect(page.getByText("Tareas (1)")).toBeVisible();
	await expect(page.getByText("Eventos (1)")).toBeVisible();

	// Cada resultado renderiza su title
	await expect(page.getByText("Causa Rodríguez vs Gomez")).toBeVisible();
	await expect(page.getByText("Juan Pérez")).toBeVisible();
	await expect(page.getByText("Laudo 2024")).toBeVisible();
	await expect(page.getByText("Redactar demanda")).toBeVisible();
	await expect(page.getByText("Audiencia conciliación")).toBeVisible();
});

test("GRUPO 2 — múltiples folders se muestran bajo el mismo grupo 'Causa'", async ({ page }) => {
	await gotoDashboard(page);
	await openSearchModal(page);

	const folders = Array.from({ length: 4 }, (_, i) => ({
		id: `folder_${i}`,
		type: "folder",
		title: `Causa ${i}`,
		subtitle: "Civil",
	}));

	await setSearchResults(page, "causa", folders);

	for (const f of folders) {
		await expect(page.getByText(f.title as string)).toBeVisible({ timeout: 5_000 });
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Empty state
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — query sin resultados → mensaje 'No se encontraron resultados para {query}'", async ({ page }) => {
	await gotoDashboard(page);
	await openSearchModal(page);

	// Input requiere localQuery (estado React local) — escribir en el input
	await page.getByPlaceholder("Buscar causas, contactos, cálculos, tareas...").fill("qwerty-no-match-xyz");

	// Force results vacío (si el backend responde rápido con array vacío)
	await setSearchResults(page, "qwerty-no-match-xyz", []);

	await expect(page.getByText(/No se encontraron .*para "qwerty-no-match-xyz"/i)).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Click en resultado navega a la ruta correcta
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — click en resultado tipo folder navega a /apps/folders/details/:id", async ({ page }) => {
	await gotoDashboard(page);
	await openSearchModal(page);

	await setSearchResults(page, "test", [FOLDER_RESULT]);
	await page.getByText("Causa Rodríguez vs Gomez").click();

	await expect(page).toHaveURL(/\/apps\/folders\/details\/folder_1/, { timeout: 10_000 });
});

test("GRUPO 4 — click en resultado tipo contact navega a /apps/customer", async ({ page }) => {
	await gotoDashboard(page);
	await openSearchModal(page);

	await setSearchResults(page, "test", [CONTACT_RESULT]);
	await page.getByText("Juan Pérez").click();

	// El handleResultClick navega al detalle del contacto (URL exacta depende de la app)
	await expect(page).toHaveURL(/\/apps\/customer|\/contacts/, { timeout: 10_000 });
});

test("GRUPO 4 — click en resultado tipo task navega a /tareas?task=:id", async ({ page }) => {
	await gotoDashboard(page);
	await openSearchModal(page);

	await setSearchResults(page, "test", [TASK_RESULT]);
	await page.getByText("Redactar demanda").click();

	await expect(page).toHaveURL(/\/tareas\?task=task_1/, { timeout: 10_000 });
});

test("GRUPO 4 — click en resultado tipo event navega a /apps/calendar?event=:id", async ({ page }) => {
	await gotoDashboard(page);
	await openSearchModal(page);

	await setSearchResults(page, "test", [EVENT_RESULT]);
	await page.getByText("Audiencia conciliación").click();

	await expect(page).toHaveURL(/\/apps\/calendar\?event=event_1/, { timeout: 10_000 });
});
