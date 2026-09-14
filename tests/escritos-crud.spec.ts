/**
 * Tests E2E de Documentos / Escritos (rich-text) — /documentos/escritos
 *
 * Los "escritos" son documentos editables en un editor Tiptap, creados a partir
 * de modelos o en blanco. Se guardan en MongoDB como RichTextDocument.
 *
 * Backend (law-analytics-server):
 *   GET    /api/rich-text-documents          (listar)
 *   GET    /api/rich-text-documents/:id      (detalle)
 *   POST   /api/rich-text-documents          (crear)
 *   PATCH  /api/rich-text-documents/:id      (editar)
 *   DELETE /api/rich-text-documents/:id      (eliminar)
 *   GET    /api/rich-text-templates          (listar modelos)
 *
 * Plan limits: rich-text docs comparten el contador `postalDocuments` con los
 * documentos postales (ambos consumen el mismo slot del plan).
 *
 * data-testids agregados en producción:
 *   escritos-new-btn       → botón "Nuevo documento" en la lista
 *   escritos-new-postal    → item del menu "Modelo del Sistema"
 *   escritos-new-richtext  → item del menu "Mis Modelos"
 *   escritos-edit-btn      → botón Ver/Editar por fila (richtext)
 *   escritos-delete-btn    → botón Eliminar por fila
 *   picker-blank-btn       → "Continuar sin modelo" en TemplatePickerDialog
 *   picker-continue-btn    → "Crear documento" en TemplatePickerDialog
 *   editor-title-input     → input del título en el editor
 *   editor-title-text      → typography del título (modo display)
 *   editor-save-btn        → botón "Guardar"
 *
 * GRUPO 1 — Carga básica
 * GRUPO 2 — Estado vacío (mock GET)
 * GRUPO 3 — Menú "Nuevo documento" → 2 opciones
 * GRUPO 4 — TemplatePickerDialog + "Continuar sin modelo"
 * GRUPO 5 — Editor carga (nuevo) + campos
 * GRUPO 6 — Validaciones de Guardar (título vacío)
 * GRUPO 7 — Crear escrito real (POST + redirect + aparece en lista)
 * GRUPO 8 — Editar escrito existente (PATCH + snackbar)
 * GRUPO 9 — Eliminar escrito (DELETE + desaparece)
 * GRUPO 10 — Límite del plan (Capa 3 API + Capa 1 UI)
 *   Test A: llena via API hasta `limit` → POST extra → 4xx (Capa 3 backend)
 *   Test B: llena via API hasta `limit-1` → crea el último via UI (OK) →
 *           click "Nuevo documento" → LimitErrorModal (Capa 1)
 *
 * Escala por plan (BATCH=10 paralelo):
 *   | Plan      | limit | fillers Test B | batches | tiempo aprox |
 *   |-----------|-------|----------------|---------|--------------|
 *   | free      | 5     | 4              | 1       | <1s          |
 *   | standard  | 50    | ~49            | 5       | ~1s          |
 *   | premium   | 500   | ~499           | 50      | ~10s         |
 */

import { test, expect, request, type Page } from "@playwright/test";

const STORAGE_STATE = "tests/.auth/user.json";
test.use({ storageState: STORAGE_STATE });

const API = "http://localhost:5000";
const TITLE_PREFIX = "E2E-Escrito";
const makeTitle = () => `${TITLE_PREFIX}-${Date.now()}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function gotoEscritos(page: Page): Promise<void> {
	await page.goto("/documentos/escritos");
	await expect(page.locator('[data-testid="escritos-new-btn"]')).toBeVisible({ timeout: 15_000 });
}

async function openNewDocMenu(page: Page): Promise<void> {
	await page.locator('[data-testid="escritos-new-btn"]').click();
	await expect(page.locator('[data-testid="escritos-new-richtext"]')).toBeVisible({ timeout: 5_000 });
}

/**
 * Crea un escrito vía API para tests que requieren un recurso pre-existente.
 */
async function createRichTextDocViaAPI(title: string): Promise<string> {
	const ctx = await request.newContext({ storageState: STORAGE_STATE });
	try {
		const res = await ctx.post(`${API}/api/rich-text-documents`, {
			data: {
				title,
				content: { type: "doc", content: [{ type: "paragraph" }] },
				status: "draft",
			},
		});
		if (!res.ok()) return "";
		const body = await res.json();
		// Backend responde { success: true, document: {...} }
		return body.document?._id ?? body.data?._id ?? "";
	} finally {
		await ctx.dispose();
	}
}

async function deleteRichTextDocById(id: string): Promise<void> {
	if (!id) return;
	const ctx = await request.newContext({ storageState: STORAGE_STATE });
	try {
		await ctx.delete(`${API}/api/rich-text-documents/${id}`);
	} finally {
		await ctx.dispose();
	}
}

async function getPlanInfo(): Promise<{ limit: number; currentCount: number; hasReachedLimit: boolean }> {
	const ctx = await request.newContext({ storageState: STORAGE_STATE });
	try {
		const res = await ctx.get(`${API}/api/plan-configs/check-resource/postalDocuments`);
		const body = await res.json();
		const data = body.data ?? {};
		return {
			limit: Number(data.limit ?? 0),
			currentCount: Number(data.currentCount ?? 0),
			hasReachedLimit: Boolean(data.hasReachedLimit),
		};
	} finally {
		await ctx.dispose();
	}
}

async function createFillerDocs(count: number): Promise<string[]> {
	if (count <= 0) return [];
	const ids: string[] = [];
	const BATCH = 10;
	const ctx = await request.newContext({ storageState: STORAGE_STATE });
	try {
		for (let i = 0; i < count; i += BATCH) {
			const batchCount = Math.min(BATCH, count - i);
			const batchIds = await Promise.all(
				Array.from({ length: batchCount }, (_, j) =>
					ctx
						.post(`${API}/api/rich-text-documents`, {
							data: {
								title: `${TITLE_PREFIX}-filler-${Date.now()}-${i + j}`,
								content: { type: "doc", content: [{ type: "paragraph" }] },
								status: "draft",
							},
						})
						.then(async (res) => {
							if (!res.ok()) return "";
							const body = await res.json();
							return body.document?._id ?? body.data?._id ?? "";
						}),
				),
			);
			ids.push(...batchIds.filter(Boolean));
		}
	} finally {
		await ctx.dispose();
	}
	return ids;
}

async function deleteDocsByIds(ids: string[]): Promise<void> {
	if (!ids.length) return;
	const ctx = await request.newContext({ storageState: STORAGE_STATE });
	const BATCH = 10;
	try {
		for (let i = 0; i < ids.length; i += BATCH) {
			const batch = ids.slice(i, i + BATCH);
			await Promise.all(batch.map((id) => ctx.delete(`${API}/api/rich-text-documents/${id}`)));
		}
	} finally {
		await ctx.dispose();
	}
}

// ─── Limpieza previa ──────────────────────────────────────────────────────────
// Elimina rich-text documents con prefijo E2E-Escrito que queden de corridas previas.

test.beforeAll(async () => {
	const ctx = await request.newContext({ storageState: STORAGE_STATE });
	try {
		const res = await ctx.get(`${API}/api/rich-text-documents`, { params: { limit: 200 } });
		if (!res.ok()) return;
		const body = await res.json();
		// Backend responde { success: true, documents: [...], total }
		const items: Array<{ _id: string; title?: string }> = body.documents ?? body.data ?? [];
		const stale = items.filter((t) => (t.title ?? "").startsWith(TITLE_PREFIX));
		if (stale.length === 0) return;
		await Promise.all(stale.map((t) => ctx.delete(`${API}/api/rich-text-documents/${t._id}`)));
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Carga básica
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — navega a /documentos/escritos y renderiza la página", async ({ page }) => {
	await gotoEscritos(page);
	await expect(page).toHaveURL(/\/documentos\/escritos/);
	await expect(page.locator('[data-testid="escritos-new-btn"]')).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 1 — columnas clave de la tabla visibles", async ({ page }) => {
	await gotoEscritos(page);
	await expect(page.getByRole("columnheader", { name: /Título/i })).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("columnheader", { name: /Modelo/i }).first()).toBeVisible();
	await expect(page.getByRole("columnheader", { name: /Estado/i }).first()).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Estado vacío (mock GET)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — sin docs → empty state 'Todavía no creaste ningún documento'", async ({ page }) => {
	// Mockeamos ambos endpoints que lee el listado de escritos (rich-text + postal)
	// para forzar un estado vacío independientemente de los docs reales del user.
	// Esto valida el comportamiento visual de la UI sin tocar ni depender de DB real.
	const emptyResponse = { success: true, documents: [], total: 0, page: 1, limit: 15 };
	await page.route(/\/api\/(rich-text-documents|postal-documents)(\?|$)/, async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(emptyResponse),
		});
	});

	await gotoEscritos(page);
	await expect(page.getByText("Todavía no creaste ningún documento.")).toBeVisible({ timeout: 15_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Menú "Nuevo documento"
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — click 'Nuevo documento' abre menú con 2 opciones", async ({ page }) => {
	await gotoEscritos(page);
	await openNewDocMenu(page);

	await expect(page.locator('[data-testid="escritos-new-postal"]')).toBeVisible();
	await expect(page.locator('[data-testid="escritos-new-richtext"]')).toBeVisible();
	await expect(page.getByText("Modelo del Sistema")).toBeVisible();
	await expect(page.getByText("Mis Modelos")).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — TemplatePickerDialog
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — 'Mis Modelos' abre TemplatePickerDialog 'Elegir modelo'", async ({ page }) => {
	await gotoEscritos(page);
	await openNewDocMenu(page);
	await page.locator('[data-testid="escritos-new-richtext"]').click();

	await expect(page.getByRole("heading", { name: "Elegir modelo", exact: true })).toBeVisible({ timeout: 10_000 });
	await expect(page.locator('[data-testid="picker-blank-btn"]')).toBeVisible();
});

test("GRUPO 4 — 'Continuar sin modelo' navega a /documentos/escritos/nuevo", async ({ page }) => {
	await gotoEscritos(page);
	await openNewDocMenu(page);
	await page.locator('[data-testid="escritos-new-richtext"]').click();
	await expect(page.getByRole("heading", { name: "Elegir modelo", exact: true })).toBeVisible({ timeout: 10_000 });

	await page.locator('[data-testid="picker-blank-btn"]').click();
	await expect(page).toHaveURL(/\/documentos\/escritos\/nuevo/, { timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Editor (nuevo escrito)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — /escritos/nuevo carga el editor con título y botón Guardar", async ({ page }) => {
	await page.goto("/documentos/escritos/nuevo");
	await expect(page.locator('[data-testid="editor-save-btn"]')).toBeVisible({ timeout: 15_000 });
	// Título en modo display inicialmente (hay que click para editar)
	await expect(page.locator('[data-testid="editor-title-text"]')).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — Validaciones
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — guardar sin título → snackbar 'El título del documento es requerido'", async ({ page }) => {
	await page.goto("/documentos/escritos/nuevo");
	await expect(page.locator('[data-testid="editor-save-btn"]')).toBeVisible({ timeout: 15_000 });

	await page.locator('[data-testid="editor-save-btn"]').click();
	await expect(page.getByText("El título del documento es requerido.")).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 7 — Crear escrito real
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 7 — crear escrito vía UI → POST + redirect a lista + visible en tabla", async ({ page }) => {
	test.setTimeout(60_000);
	await page.goto("/documentos/escritos/nuevo");
	await expect(page.locator('[data-testid="editor-save-btn"]')).toBeVisible({ timeout: 15_000 });

	const title = makeTitle();
	// Entrar en modo edit del título: click en el Typography display
	await page.locator('[data-testid="editor-title-text"]').click();
	await page.locator('[data-testid="editor-title-input"]').fill(title);

	// Guardar — capturar POST
	const [response] = await Promise.all([
		page.waitForResponse((r) => r.url().endsWith("/api/rich-text-documents") && r.request().method() === "POST"),
		page.locator('[data-testid="editor-save-btn"]').click(),
	]);

	expect(response.ok()).toBe(true);
	const body = await response.json();
	// Backend responde { success, document } (no { data })
	const id = body.document?._id ?? body.data?._id ?? "";

	// Snackbar + redirect
	await expect(page.getByText("Documento guardado correctamente.")).toBeVisible({ timeout: 10_000 });
	await expect(page).toHaveURL(/\/documentos\/escritos$/, { timeout: 10_000 });
	await expect(page.getByRole("cell", { name: title })).toBeVisible({ timeout: 10_000 });

	// Cleanup
	await deleteRichTextDocById(id);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 8 — Editar escrito existente
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 8 — editar escrito existente → PATCH + snackbar 'actualizado'", async ({ page }) => {
	test.setTimeout(60_000);
	const title = makeTitle();
	const id = await createRichTextDocViaAPI(title);
	expect(id).toBeTruthy();

	try {
		await page.goto(`/documentos/escritos/${id}/editar`);
		await expect(page.locator('[data-testid="editor-save-btn"]')).toBeVisible({ timeout: 15_000 });

		// El título debe estar pre-cargado (visible en modo display)
		await expect(page.locator('[data-testid="editor-title-text"]')).toHaveText(title, { timeout: 5_000 });

		// Editar título
		await page.locator('[data-testid="editor-title-text"]').click();
		const newTitle = `${title}-edit`;
		await page.locator('[data-testid="editor-title-input"]').fill(newTitle);

		// Guardar → PATCH
		const [response] = await Promise.all([
			page.waitForResponse((r) => r.url().includes(`/api/rich-text-documents/${id}`) && r.request().method() === "PATCH"),
			page.locator('[data-testid="editor-save-btn"]').click(),
		]);

		expect(response.ok()).toBe(true);
		await expect(page.getByText("Documento actualizado.")).toBeVisible({ timeout: 10_000 });
		await expect(page).toHaveURL(/\/documentos\/escritos$/, { timeout: 10_000 });
	} finally {
		await deleteRichTextDocById(id);
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 9 — Eliminar escrito
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 9 — click 'Eliminar' → confirm dialog + DELETE + fila desaparece", async ({ page }) => {
	test.setTimeout(90_000);
	const title = makeTitle();
	const id = await createRichTextDocViaAPI(title);
	expect(id).toBeTruthy();

	try {
		await gotoEscritos(page);
		await page
			.waitForResponse((r) => r.url().includes("/api/rich-text-documents") && r.request().method() === "GET", {
				timeout: 10_000,
			})
			.catch(() => {});

		// El user de tests (free plan) puede tener docs residuales acumulados; usar el buscador
		// para filtrar por el título único garantiza que la row aparezca en la primera página.
		const searchBox = page.getByPlaceholder(/buscar|search/i).first();
		if (await searchBox.isVisible({ timeout: 2_000 }).catch(() => false)) {
			await searchBox.fill(title);
			await page.waitForTimeout(600); // debounce
		}

		const row = page.getByRole("row").filter({ hasText: title });
		await expect(row).toBeVisible({ timeout: 15_000 });

		// Desktop: las acciones están en un overflow menu (3-dots). El botón abre el menú
		// y el item "Eliminar" dispara el dialog. Mobile (cards) tiene el botón directo.
		const rowMenuBtn = row.locator('[data-testid="escritos-row-menu-btn"]');
		if (await rowMenuBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
			await rowMenuBtn.click();
			await page.getByRole("menuitem", { name: "Eliminar" }).click();
		} else {
			await row.locator('[data-testid="escritos-delete-btn"]').click();
		}
		await expect(page.getByRole("heading", { name: "Eliminar documento" })).toBeVisible({ timeout: 5_000 });

		await Promise.all([
			page.waitForResponse((r) => r.url().includes(`/api/rich-text-documents/${id}`) && r.request().method() === "DELETE"),
			page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click(),
		]);

		await expect(page.getByRole("row").filter({ hasText: title })).toHaveCount(0, { timeout: 5_000 });
	} catch (err) {
		// Cleanup defensivo si el test falló antes del delete
		await deleteRichTextDocById(id).catch(() => {});
		throw err;
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 10 — Límite del plan (Capa 3 API + Capa 1 UI)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 10 — backend rechaza creación al superar el límite del plan (Capa 3)", async ({ page }) => {
	test.setTimeout(300_000); // 5 min — premium puede necesitar crear ~500 fillers

	const { limit, currentCount } = await getPlanInfo();
	const gap = Math.max(0, limit - currentCount);
	const fillerIds = await createFillerDocs(gap);

	try {
		const ctx = await request.newContext({ storageState: STORAGE_STATE });
		try {
			const overRes = await ctx.post(`${API}/api/rich-text-documents`, {
				data: {
					title: `${TITLE_PREFIX}-overlimit-${Date.now()}`,
					content: { type: "doc", content: [{ type: "paragraph" }] },
					status: "draft",
				},
			});
			expect(overRes.status()).toBeGreaterThanOrEqual(400);
			const body = await overRes.json();
			expect(body.success).toBe(false);
		} finally {
			await ctx.dispose();
		}
	} finally {
		await deleteDocsByIds(fillerIds);
	}
	void page; // unused
});

test("GRUPO 10 — UI permite crear el último y bloquea el siguiente con LimitErrorModal (Capa 1)", async ({ page }) => {
	test.setTimeout(300_000); // 5 min — premium puede necesitar crear ~499 fillers

	const { limit, currentCount } = await getPlanInfo();
	// Llenar hasta (límite - 1) en paralelo → deja exactamente 1 slot libre para la UI
	const fillerIds = await createFillerDocs(Math.max(0, limit - currentCount - 1));

	try {
		// Crear el ÚLTIMO documento permitido vía UI — debe aceptarse
		await page.goto("/documentos/escritos/nuevo");
		await expect(page.locator('[data-testid="editor-save-btn"]')).toBeVisible({ timeout: 15_000 });

		const lastTitle = `${TITLE_PREFIX}-last-${Date.now()}`;
		await page.locator('[data-testid="editor-title-text"]').click();
		await page.locator('[data-testid="editor-title-input"]').fill(lastTitle);

		const [response] = await Promise.all([
			page.waitForResponse((r) => r.url().endsWith("/api/rich-text-documents") && r.request().method() === "POST"),
			page.locator('[data-testid="editor-save-btn"]').click(),
		]);

		expect(response.ok()).toBe(true);
		const body = await response.json();
		const lastId = body.document?._id ?? body.data?._id ?? "";
		if (lastId) fillerIds.push(lastId);

		await expect(page.getByText("Documento guardado correctamente.")).toBeVisible({ timeout: 10_000 });
		await expect(page).toHaveURL(/\/documentos\/escritos$/, { timeout: 10_000 });

		// Ahora estamos al límite. Intentar crear otro via UI → Capa 1 bloquea.
		await openNewDocMenu(page);
		await page.locator('[data-testid="escritos-new-richtext"]').click();

		// LimitErrorModal con "límite de documentos..."
		await expect(page.getByText(/límite de documentos/i)).toBeVisible({ timeout: 10_000 });
		await expect(page.getByRole("button", { name: /Suscribirme/i }).first()).toBeVisible({ timeout: 5_000 });

		// TemplatePickerDialog NO debe haberse abierto (Capa 1 bloqueó antes)
		await expect(page.getByRole("heading", { name: "Elegir modelo", exact: true })).not.toBeVisible({ timeout: 2_000 });
	} finally {
		await deleteDocsByIds(fillerIds);
	}
});
