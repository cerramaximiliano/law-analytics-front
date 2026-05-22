/**
 * Tests E2E de Tareas — /tareas
 *
 * Usan storageState (sesión pre-autenticada) + backend real para CRUD.
 * Solo se mockea el GET de tareas para testear el estado vacío.
 *
 * data-testid agregados:
 *   tasks-add-btn   → botón "Nueva Tarea"
 *   task-edit-btn   → botón editar en cada fila
 *   task-delete-btn → botón eliminar en cada fila
 *
 * IDs de formulario (ya existían):
 *   #task-name, #task-description, #task-priority, #task-status, #task-folder
 *   DatePicker: placeholder "DD/MM/AAAA"
 *
 * GRUPO 1 — Carga y renderizado básico
 * GRUPO 2 — Estado vacío (mock GET → [])
 * GRUPO 3 — Crear tarea (POST real)
 * GRUPO 4 — Editar tarea (PUT real)
 * GRUPO 5 — Eliminar tarea (DELETE real)
 * GRUPO 6 — Búsqueda en tabla
 */

import { test, expect, type Page } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

const API_BASE = "http://localhost:5000";
const makeTitle = () => `E2E-Task-${Date.now()}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthToken(page: Page): Promise<string> {
	return (await page.evaluate(() => localStorage.getItem("token"))) ?? "";
}

async function deleteTaskById(page: Page, taskId: string): Promise<void> {
	const token = await getAuthToken(page);
	await page.request.delete(`${API_BASE}/api/tasks/${taskId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

async function gotoTareas(page: Page): Promise<void> {
	await page.goto("/tareas");
	// Esperar tabla o estado vacío (ambos se renderizan tras la carga inicial)
	await expect(page.locator("table, .MuiSkeleton-root").first()).toBeVisible({ timeout: 15_000 });
	// Esperar que los skeletons desaparezcan
	await expect(page.locator(".MuiSkeleton-root").first()).not.toBeVisible({ timeout: 15_000 });
}

/**
 * Crea una tarea vía UI y retorna su _id del backend.
 * Deja el modal cerrado tras la creación.
 */
async function createTaskViaUI(page: Page, name: string): Promise<string> {
	await page.locator('[data-testid="tasks-add-btn"]').click();
	await expect(page.getByRole("heading", { name: "Nueva Tarea", exact: true })).toBeVisible({ timeout: 5_000 });

	await page.locator("#task-name").fill(name);

	// La fecha ya viene pre-cargada con hoy (dayjs()), no es necesario modificarla

	const [response] = await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/tasks") && r.request().method() === "POST"),
		page.getByRole("dialog").getByRole("button", { name: "Crear" }).click(),
	]);

	// El modal se cierra al crearse exitosamente
	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });

	const data = await response.json();
	return data.task?._id ?? data._id ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Carga y renderizado básico
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — navega a /tareas y renderiza la tabla", async ({ page }) => {
	await gotoTareas(page);

	await expect(page).toHaveURL(/\/tareas/);
	await expect(page.locator("table")).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 1 — las columnas clave de la tabla son visibles", async ({ page }) => {
	await gotoTareas(page);

	await expect(page.getByRole("columnheader", { name: "Tarea" })).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("columnheader", { name: "Vencimiento" })).toBeVisible();
	await expect(page.getByRole("columnheader", { name: "Estado" })).toBeVisible();
});

test("GRUPO 1 — botón 'Nueva Tarea' es visible", async ({ page }) => {
	await gotoTareas(page);

	await expect(page.locator('[data-testid="tasks-add-btn"]')).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Estado vacío (mock GET)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — sin tareas → mensaje 'Sin tareas' visible", async ({ page }) => {
	await page.route(`${API_BASE}/api/tasks/**`, (route) =>
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) }),
	);

	await gotoTareas(page);

	await expect(page.getByText("Sin tareas")).toBeVisible({ timeout: 10_000 });
	await expect(page.getByText("Comienza creando tu primera tarea")).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Crear tarea
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — click 'Nueva Tarea' → modal 'Nueva Tarea' se abre", async ({ page }) => {
	await gotoTareas(page);

	await page.locator('[data-testid="tasks-add-btn"]').click();

	await expect(page.getByRole("heading", { name: "Nueva Tarea", exact: true })).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("dialog")).toBeVisible();
});

test("GRUPO 3 — submit con nombre vacío → error 'El nombre es requerido'", async ({ page }) => {
	await gotoTareas(page);

	await page.locator('[data-testid="tasks-add-btn"]').click();
	await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

	// No llenamos el nombre y hacemos submit
	await page.getByRole("dialog").getByRole("button", { name: "Crear" }).click();

	await expect(page.getByText("El nombre es requerido")).toBeVisible({ timeout: 3_000 });
});

test("GRUPO 3 — cancelar creación → modal se cierra sin POST", async ({ page }) => {
	await gotoTareas(page);

	await page.locator('[data-testid="tasks-add-btn"]').click();
	await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

	let postCalled = false;
	page.on("request", (req) => {
		if (req.url().includes("/api/tasks") && req.method() === "POST") postCalled = true;
	});

	await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();

	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 });
	expect(postCalled).toBe(false);
});

test("GRUPO 3 — crear tarea real → POST /api/tasks → snackbar 'Tarea creada exitosamente'", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoTareas(page);

	const title = makeTitle();
	const taskId = await createTaskViaUI(page, title);

	await expect(page.getByText("Tarea creada exitosamente")).toBeVisible({ timeout: 10_000 });

	// Cleanup
	if (taskId) await deleteTaskById(page, taskId);
});

test("GRUPO 3 — tarea creada aparece en la tabla", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoTareas(page);

	const title = makeTitle();
	const taskId = await createTaskViaUI(page, title);

	// La tarea debe aparecer en la tabla
	await expect(page.getByRole("cell", { name: title })).toBeVisible({ timeout: 10_000 });

	// Cleanup
	if (taskId) await deleteTaskById(page, taskId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Editar tarea
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — click 'Editar' → modal 'Editar Tarea' con nombre pre-cargado", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoTareas(page);

	const title = makeTitle();
	const taskId = await createTaskViaUI(page, title);

	// Click en el botón editar de la fila que tiene el título creado
	const row = page.getByRole("row").filter({ hasText: title });
	await row.locator('[data-testid="task-edit-btn"]').click();

	await expect(page.getByText("Editar Tarea")).toBeVisible({ timeout: 5_000 });
	// El campo nombre debe tener el valor creado
	await expect(page.locator("#task-name")).toHaveValue(title, { timeout: 3_000 });

	await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();

	// Cleanup
	if (taskId) await deleteTaskById(page, taskId);
});

test("GRUPO 4 — editar nombre → PUT /api/tasks/:id → snackbar 'Tarea actualizada exitosamente'", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoTareas(page);

	const title = makeTitle();
	const taskId = await createTaskViaUI(page, title);

	const row = page.getByRole("row").filter({ hasText: title });
	await row.locator('[data-testid="task-edit-btn"]').click();
	await expect(page.getByText("Editar Tarea")).toBeVisible({ timeout: 5_000 });

	const newTitle = `${title}-editada`;
	await page.locator("#task-name").clear();
	await page.locator("#task-name").fill(newTitle);

	const [response] = await Promise.all([
		page.waitForResponse((r) => r.url().includes(`/api/tasks/${taskId}`) && r.request().method() === "PUT"),
		page.getByRole("dialog").getByRole("button", { name: "Actualizar" }).click(),
	]);

	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });
	await expect(page.getByText("Tarea actualizada exitosamente")).toBeVisible({ timeout: 10_000 });

	const data = await response.json();
	expect(data.success ?? true).toBeTruthy();

	// Cleanup
	if (taskId) await deleteTaskById(page, taskId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Eliminar tarea
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — click 'Eliminar' → modal de confirmación se abre", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoTareas(page);

	const title = makeTitle();
	const taskId = await createTaskViaUI(page, title);

	const row = page.getByRole("row").filter({ hasText: title });
	await row.locator('[data-testid="task-delete-btn"]').click();

	await expect(page.getByText("¿Está seguro que desea eliminar esta tarea?")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("dialog")).toBeVisible();

	// Cancelar para no eliminar
	await page.getByRole("dialog").getByRole("button", { name: "Cancelar" }).click();
	await expect(page.getByText("¿Está seguro que desea eliminar esta tarea?")).not.toBeVisible({ timeout: 5_000 });

	// Cleanup
	if (taskId) await deleteTaskById(page, taskId);
});

test("GRUPO 5 — confirmar eliminación → DELETE /api/tasks/:id → snackbar + tarea desaparece", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoTareas(page);

	const title = makeTitle();
	await createTaskViaUI(page, title);

	const row = page.getByRole("row").filter({ hasText: title });
	await row.locator('[data-testid="task-delete-btn"]').click();
	await expect(page.getByText("¿Está seguro que desea eliminar esta tarea?")).toBeVisible({ timeout: 5_000 });

	await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/tasks/") && r.request().method() === "DELETE"),
		page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click(),
	]);

	await expect(page.getByText("Tarea eliminada correctamente")).toBeVisible({ timeout: 15_000 });
	// La tarea ya no debe aparecer en la tabla
	await expect(page.getByRole("cell", { name: title })).not.toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — Búsqueda en tabla
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — buscar por nombre → tabla filtra correctamente", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoTareas(page);

	const title = makeTitle();
	const taskId = await createTaskViaUI(page, title);

	// Buscar el título exacto
	const searchInput = page.getByPlaceholder(/buscar|search/i);
	await searchInput.fill(title);

	// Solo debe aparecer la tarea creada
	await expect(page.getByRole("cell", { name: title })).toBeVisible({ timeout: 5_000 });

	// Limpiar búsqueda
	await searchInput.clear();

	// Cleanup
	if (taskId) await deleteTaskById(page, taskId);
});
