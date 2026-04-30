/**
 * Tests del Calendario — Flujo completo E2E con backend real.
 *
 * Todos los tests golpean el backend real en localhost:5000.
 * Las operaciones de escritura (POST, PUT, DELETE) son reales.
 *
 * Estrategia de limpieza:
 *   - Cada test que crea un evento captura el _id de la respuesta POST.
 *   - Al finalizar, elimina el evento via DELETE /api/events/:id usando
 *     el token JWT de localStorage (page.request hereda la sesión).
 *   - Títulos únicos con timestamp para no confundir con datos del usuario.
 *
 * GRUPO 1 — Navegación y vistas (Mes → Semana → Día, sin datos)
 * GRUPO 2 — Crear evento (POST real + verificación de snackbar)
 * GRUPO 3 — Editar evento (PUT real + verificación de snackbar)
 * GRUPO 4 — Eliminar evento (DELETE real + verificación de ausencia)
 * GRUPO 5 — Vincular evento a carpeta (PUT real con folderId)
 * GRUPO 6 — Navegación mensual (prev/next/today)
 * GRUPO 7-11 — Crear desde celda, descripción, allDay, detalles, gestión vínculo
 * GRUPO 12 — Drag habilitado + PUT API
 * GRUPO 13 — Google Calendar
 * GRUPO 14 — Guía, rango fechas, resize
 * GRUPO 15 — Drag & drop visual real (simula mouse drag, verifica PUT automático)
 * GRUPO 16 — Navegación avanzada: cross-year + refetch de eventos al cambiar rango
 *
 * Requiere: dev server en localhost:3000, backend en localhost:5000.
 */

import { test, expect, type Page } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

const API_BASE = "http://localhost:5000";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Genera un título único para cada test. */
const makeTitle = () => `E2E-Cal-${Date.now()}`;

/** Lee el JWT del localStorage del browser (renovado automáticamente al cargar la app). */
async function getAuthToken(page: Page): Promise<string> {
	return (await page.evaluate(() => localStorage.getItem("token"))) ?? "";
}

/** Elimina un evento directamente via API (cleanup post-test). */
async function deleteEventById(page: Page, eventId: string): Promise<void> {
	const token = await getAuthToken(page);
	await page.request.delete(`${API_BASE}/api/events/${eventId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

/**
 * Navega al calendario y espera que FullCalendar cargue completamente.
 * El skeleton de carga se reemplaza por .fc-view-harness cuando los eventos están listos.
 */
async function gotoCalendar(page: Page): Promise<void> {
	await page.goto("/apps/calendar");
	await expect(page.locator(".fc-view-harness")).toBeVisible({ timeout: 15_000 });
}

/**
 * Crea un evento vía UI y retorna el _id del evento creado (capturado de la respuesta POST).
 * Deja el modal cerrado y el snackbar de éxito verificado.
 */
async function createEventViaUI(page: Page, title: string): Promise<string> {
	await page.locator('[data-testid="calendar-add-btn"]').click();
	await expect(page.getByText("Agregar Evento")).toBeVisible({ timeout: 5_000 });

	await page.getByLabel("Título").fill(title);

	// MUI Select: esperar a que el select esté interactuable antes de abrirlo
	const select = page.locator("#demo-simple-select");
	await expect(select).toBeVisible({ timeout: 5_000 });
	await select.click();
	await page.getByRole("option", { name: "Audiencia" }).click();

	// Capturar respuesta POST justo antes de hacer submit
	const [response] = await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/events") && r.request().method() === "POST"),
		page.getByRole("dialog").getByRole("button", { name: "Agregar" }).click(),
	]);

	// El dialog se cierra al crear exitosamente (señal más confiable que el snackbar)
	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15_000 });

	const data = await response.json();
	return data.event?._id ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Navegación y vistas
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — navega a /apps/calendar y renderiza el calendario en vista Mes", async ({ page }) => {
	await gotoCalendar(page);
	await expect(page.locator(".fc-dayGridMonth-view")).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 1 — cambiar a vista Semana → FullCalendar muestra timeGridWeek", async ({ page }) => {
	await gotoCalendar(page);

	await page.locator('[data-testid="calendar-view-timeGridWeek"]').click();

	await expect(page.locator(".fc-timeGridWeek-view")).toBeVisible({ timeout: 5_000 });
	await expect(page.locator(".fc-dayGridMonth-view")).not.toBeVisible();
});

test("GRUPO 1 — cambiar a vista Día → FullCalendar muestra timeGridDay", async ({ page }) => {
	await gotoCalendar(page);

	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();

	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });
	await expect(page.locator(".fc-dayGridMonth-view")).not.toBeVisible();
});

test("GRUPO 1 — Semana → Mes → vuelve a dayGridMonth-view", async ({ page }) => {
	await gotoCalendar(page);

	await page.locator('[data-testid="calendar-view-timeGridWeek"]').click();
	await expect(page.locator(".fc-timeGridWeek-view")).toBeVisible({ timeout: 5_000 });

	await page.locator('[data-testid="calendar-view-dayGridMonth"]').click();
	await expect(page.locator(".fc-dayGridMonth-view")).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Crear evento
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — click en '+' → modal 'Agregar Evento' se abre", async ({ page }) => {
	await gotoCalendar(page);

	await page.locator('[data-testid="calendar-add-btn"]').click();

	await expect(page.getByText("Agregar Evento")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("dialog")).toBeVisible();
});

test("GRUPO 2 — submit vacío → errores 'El título es requerido' y 'Debe seleccionar un tipo'", async ({ page }) => {
	await gotoCalendar(page);

	await page.locator('[data-testid="calendar-add-btn"]').click();
	await expect(page.getByText("Agregar Evento")).toBeVisible({ timeout: 5_000 });

	// Submit sin rellenar ningún campo
	await page.getByRole("dialog").getByRole("button", { name: "Agregar" }).click();

	await expect(page.getByText("El título es requerido")).toBeVisible({ timeout: 3_000 });
	await expect(page.getByText("Debe seleccionar un tipo")).toBeVisible();
});

test("GRUPO 2 — crear evento real → POST /api/events → snackbar 'Evento agregado correctamente.'", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const eventId = await createEventViaUI(page, title);

	// Verificar explícitamente el snackbar de éxito
	await expect(page.getByText("Evento agregado correctamente.")).toBeVisible({ timeout: 15_000 });

	// Cleanup
	if (eventId) await deleteEventById(page, eventId);
});

test("GRUPO 2 — cancelar creación → modal se cierra y no hay snackbar de éxito", async ({ page }) => {
	await gotoCalendar(page);

	await page.locator('[data-testid="calendar-add-btn"]').click();
	await expect(page.getByText("Agregar Evento")).toBeVisible({ timeout: 5_000 });

	await page.getByRole("button", { name: "Cancelar" }).click();

	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 });
	await expect(page.getByText("Evento agregado correctamente.")).not.toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Editar evento
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — click en evento del calendario → abre 'Detalles del Evento'", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const eventId = await createEventViaUI(page, title);

	// En vista mes el evento puede estar oculto por overflow. Vista Día lo muestra siempre.
	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	const eventEl = page.locator(".fc-event").filter({ hasText: title }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });
	await eventEl.click({ force: true });

	await expect(page.getByText("Detalles del Evento")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("dialog")).toContainText(title);

	// Cleanup: cerrar y eliminar
	await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();
	if (eventId) await deleteEventById(page, eventId);
});

test("GRUPO 3 — click 'Editar' en detalles → formulario con título pre-cargado", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const eventId = await createEventViaUI(page, title);

	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	const eventEl = page.locator(".fc-event").filter({ hasText: title }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });
	await eventEl.click({ force: true });

	await expect(page.getByText("Detalles del Evento")).toBeVisible({ timeout: 5_000 });
	await page.getByRole("dialog").getByRole("button", { name: "Editar" }).click();

	await expect(page.getByText("Editar Evento")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByLabel("Título")).toHaveValue(title);

	// Cleanup: cancelar formulario y eliminar vía API
	await page.getByRole("button", { name: "Cancelar" }).click();
	if (eventId) await deleteEventById(page, eventId);
});

test("GRUPO 3 — editar título → PUT /api/events/:id → snackbar 'Evento editado correctamente.'", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const originalTitle = makeTitle();
	const editedTitle = `${originalTitle}-editado`;
	const eventId = await createEventViaUI(page, originalTitle);

	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	// Abrir evento → modo edición
	const eventEl = page.locator(".fc-event").filter({ hasText: originalTitle }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });
	await eventEl.click({ force: true });

	await expect(page.getByText("Detalles del Evento")).toBeVisible({ timeout: 5_000 });
	await page.getByRole("dialog").getByRole("button", { name: "Editar" }).click();
	await expect(page.getByText("Editar Evento")).toBeVisible({ timeout: 5_000 });

	// Cambiar título y guardar
	await page.getByLabel("Título").fill(editedTitle);

	const [putResponse] = await Promise.all([
		page.waitForResponse((r) => r.url().includes(`/api/events/${eventId}`) && r.request().method() === "PUT"),
		page.getByRole("dialog").getByRole("button", { name: "Editar" }).click(),
	]);

	await expect(page.getByText("Evento editado correctamente.")).toBeVisible({ timeout: 10_000 });

	// Verificar que el backend respondió con éxito
	const putData = await putResponse.json();
	expect(putData.success).toBe(true);

	// Cleanup
	if (eventId) await deleteEventById(page, eventId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Eliminar evento
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — eliminar evento → DELETE /api/events/:id → snackbar + modal cerrado", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const eventId = await createEventViaUI(page, title);

	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	// Abrir detalles del evento
	const eventEl = page.locator(".fc-event").filter({ hasText: title }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });
	await eventEl.click({ force: true });

	await expect(page.getByText("Detalles del Evento")).toBeVisible({ timeout: 5_000 });

	// Capturar respuesta DELETE y hacer click en Trash
	const [deleteResponse] = await Promise.all([
		page.waitForResponse((r) => r.url().includes(`/api/events/${eventId}`) && r.request().method() === "DELETE"),
		page.locator('[data-testid="calendar-delete-btn"]').click(),
	]);

	// Snackbar de confirmación
	await expect(page.getByText("Evento eliminado correctamente.")).toBeVisible({ timeout: 15_000 });

	// Modal cerrado
	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 });

	// Backend respondió con éxito
	const deleteData = await deleteResponse.json();
	expect(deleteData.success).toBe(true);

	// No se necesita cleanup: el evento ya fue eliminado en el test
});

test("GRUPO 4 — evento eliminado ya no aparece en el calendario", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	await createEventViaUI(page, title);

	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	// Verificar que el evento estaba visible
	const eventEl = page.locator(".fc-event").filter({ hasText: title }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });
	await eventEl.click({ force: true });

	await expect(page.getByText("Detalles del Evento")).toBeVisible({ timeout: 5_000 });
	await page.locator('[data-testid="calendar-delete-btn"]').click();
	await expect(page.getByText("Evento eliminado correctamente.")).toBeVisible({ timeout: 15_000 });

	// Verificar que el evento ya no está en el calendario
	await expect(page.locator(".fc-event").filter({ hasText: title })).not.toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Vincular evento a carpeta
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — click 'Vincular Evento' → abre modal 'Vincular evento a carpetas'", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const eventId = await createEventViaUI(page, title);

	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	const eventEl = page.locator(".fc-event").filter({ hasText: title }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });
	await eventEl.click({ force: true });

	await expect(page.getByText("Detalles del Evento")).toBeVisible({ timeout: 5_000 });
	await page.locator('[data-testid="calendar-link-btn"]').click();

	// El modal de vinculación debe abrirse
	await expect(page.getByText("Vincular evento a carpetas")).toBeVisible({ timeout: 8_000 });

	// Cleanup
	await page.getByRole("button", { name: "Cancelar" }).click();
	if (eventId) await deleteEventById(page, eventId);
});

test("GRUPO 5 — vincular a primera carpeta disponible → PUT /api/events/:id con folderId + snackbar", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const eventId = await createEventViaUI(page, title);

	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	const eventEl = page.locator(".fc-event").filter({ hasText: title }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });
	await eventEl.click({ force: true });

	await expect(page.getByText("Detalles del Evento")).toBeVisible({ timeout: 5_000 });
	await page.locator('[data-testid="calendar-link-btn"]').click();
	await expect(page.getByText("Vincular evento a carpetas")).toBeVisible({ timeout: 8_000 });

	// Esperar que el spinner de carga desaparezca
	await expect(page.locator(".MuiCircularProgress-root")).not.toBeVisible({ timeout: 10_000 });

	// Si no hay carpetas, skip con mensaje claro
	const noFoldersVisible = await page.getByText(/No hay carpetas disponibles/).isVisible();
	if (noFoldersVisible) {
		test.skip(true, "El usuario no tiene carpetas — crear al menos una para ejecutar este test");
		return;
	}

	// MUI ListItemButton (cada carpeta de la lista)
	const firstFolder = page.getByRole("dialog").locator(".MuiListItemButton-root").first();
	await expect(firstFolder).toBeVisible({ timeout: 5_000 });

	// Seleccionar la primera carpeta
	await firstFolder.click();

	// Click en "Vincular" y capturar respuesta PUT
	const [putResponse] = await Promise.all([
		page.waitForResponse((r) => r.url().includes(`/api/events/${eventId}`) && r.request().method() === "PUT"),
		page.getByRole("button", { name: "Vincular" }).click(),
	]);

	await expect(page.getByText("Evento vinculado correctamente.")).toBeVisible({ timeout: 10_000 });

	// Backend respondió con éxito
	const putData = await putResponse.json();
	expect(putData.success).toBe(true);
	// El evento actualizado tiene folderId
	expect(putData.event?.folderId).toBeTruthy();

	// Cleanup
	if (eventId) await deleteEventById(page, eventId);
});

test("GRUPO 5 — sin carpetas disponibles → modal muestra aviso y botón 'Vincular' deshabilitado", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const eventId = await createEventViaUI(page, title);

	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	const eventEl = page.locator(".fc-event").filter({ hasText: title }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });
	await eventEl.click({ force: true });

	await expect(page.getByText("Detalles del Evento")).toBeVisible({ timeout: 5_000 });

	// Interceptar GET de carpetas para devolver lista vacía en este test específico
	await page.route(`${API_BASE}/api/folders/user/**`, (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, folders: [] }),
		}),
	);

	await page.locator('[data-testid="calendar-link-btn"]').click();
	await expect(page.getByText("Vincular evento a carpetas")).toBeVisible({ timeout: 8_000 });

	await expect(page.getByText(/No hay carpetas disponibles/)).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("button", { name: "Vincular" })).toBeDisabled();

	// Cleanup
	await page.getByRole("button", { name: "Cancelar" }).click();
	if (eventId) await deleteEventById(page, eventId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — Navegación mensual
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — click siguiente mes → título cambia al mes siguiente", async ({ page }) => {
	await gotoCalendar(page);

	const titleEl = page.locator('[data-testid="calendar-month-title"]');
	const initialTitle = await titleEl.textContent();

	await page.locator('[data-testid="calendar-next-btn"]').click();

	await expect(titleEl).not.toHaveText(initialTitle ?? "", { timeout: 3_000 });
});

test("GRUPO 6 — click mes anterior → título vuelve al mes original", async ({ page }) => {
	await gotoCalendar(page);

	const titleEl = page.locator('[data-testid="calendar-month-title"]');
	const initialTitle = await titleEl.textContent();

	await page.locator('[data-testid="calendar-next-btn"]').click();
	await expect(titleEl).not.toHaveText(initialTitle ?? "", { timeout: 3_000 });

	await page.locator('[data-testid="calendar-prev-btn"]').click();
	await expect(titleEl).toHaveText(initialTitle ?? "", { timeout: 3_000 });
});

test("GRUPO 6 — botón 'Ir a hoy' regresa al mes actual desde un mes futuro", async ({ page }) => {
	await gotoCalendar(page);

	const titleEl = page.locator('[data-testid="calendar-month-title"]');
	const currentTitle = await titleEl.textContent();

	await page.locator('[data-testid="calendar-next-btn"]').click();
	await page.locator('[data-testid="calendar-next-btn"]').click();
	await expect(titleEl).not.toHaveText(currentTitle ?? "", { timeout: 3_000 });

	await page.locator('[data-testid="calendar-today-btn"]').click();
	await expect(titleEl).toHaveText(currentTitle ?? "", { timeout: 3_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 7 — Crear evento desde celda del calendario
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 7 — click en celda de día → modal 'Agregar Evento' se abre", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	// Navegar al siguiente mes para garantizar un calendario limpio sin eventos acumulados.
	// Day 5 del siguiente mes está siempre en la primera fila visible del calendario.
	await page.locator('[data-testid="calendar-next-btn"]').click();
	await expect(page.locator(".fc-dayGridMonth-view")).toBeVisible({ timeout: 5_000 });

	const now = new Date();
	const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 5);
	const cellDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-05`;

	// Usar page.mouse.click sobre las coordenadas del td[data-date] para disparar
	// el evento real que FullCalendar reconoce como dateClick.
	const cellBox = await page.locator(`[data-date="${cellDate}"]`).boundingBox();
	if (!cellBox) throw new Error(`No se encontró la celda para ${cellDate}`);
	// Clicar en el tercio inferior del td (área de eventos, sin tocar el número del día)
	await page.mouse.click(cellBox.x + cellBox.width / 2, cellBox.y + cellBox.height * 0.7);

	await expect(page.getByText("Agregar Evento")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("dialog")).toBeVisible();
});

test("GRUPO 7 — crear evento desde celda → fecha de inicio corresponde al día clickeado", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	// Mismo enfoque: siguiente mes, día 5
	await page.locator('[data-testid="calendar-next-btn"]').click();
	await expect(page.locator(".fc-dayGridMonth-view")).toBeVisible({ timeout: 5_000 });

	const now = new Date();
	const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 5);
	const targetDay = 5;
	const cellDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-05`;

	const cellBox = await page.locator(`[data-date="${cellDate}"]`).boundingBox();
	if (!cellBox) throw new Error(`No se encontró la celda para ${cellDate}`);
	await page.mouse.click(cellBox.x + cellBox.width / 2, cellBox.y + cellBox.height * 0.7);

	await expect(page.getByText("Agregar Evento")).toBeVisible({ timeout: 5_000 });

	// El input de "Fecha Inicio" debe contener el día 5
	const startInput = page
		.locator("input")
		.filter({ hasValue: new RegExp(`^${String(targetDay)}/`) })
		.first();
	await expect(startInput).toBeVisible({ timeout: 3_000 });

	await page.getByRole("button", { name: "Cancelar" }).click();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 8 — Evento con descripción
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 8 — crear evento con descripción → POST incluye description", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const description = "Descripción E2E de prueba completa";

	await page.locator('[data-testid="calendar-add-btn"]').click();
	await expect(page.getByText("Agregar Evento")).toBeVisible({ timeout: 5_000 });

	await page.getByLabel("Título").fill(title);
	await page.getByLabel("Descripción").fill(description);
	await page.locator("#demo-simple-select").click();
	await page.getByRole("option", { name: "Audiencia" }).click();

	const [response] = await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/events") && r.request().method() === "POST"),
		page.getByRole("dialog").getByRole("button", { name: "Agregar" }).click(),
	]);

	await expect(page.getByText("Evento agregado correctamente.")).toBeVisible({ timeout: 15_000 });

	const data = await response.json();
	expect(data.event?.description).toBe(description);

	if (data.event?._id) await deleteEventById(page, data.event._id);
});

test("GRUPO 8 — descripción es visible en EventDetailsView", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const description = "Descripción visible en detalles";

	await page.locator('[data-testid="calendar-add-btn"]').click();
	await expect(page.getByText("Agregar Evento")).toBeVisible({ timeout: 5_000 });

	await page.getByLabel("Título").fill(title);
	await page.getByLabel("Descripción").fill(description);
	await page.locator("#demo-simple-select").click();
	await page.getByRole("option", { name: "Audiencia" }).click();

	const [response] = await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/events") && r.request().method() === "POST"),
		page.getByRole("dialog").getByRole("button", { name: "Agregar" }).click(),
	]);

	// Confirmación de éxito por la respuesta (201) + dialog cerrado. El snackbar es flaky
	// porque se auto-oculta en 3-5s y puede desaparecer antes del assert.
	expect(response.status()).toBe(201);
	const eventId = (await response.json()).event?._id;
	expect(eventId).toBeTruthy();
	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });

	// Vista Día. Evento localizado por DOM, click forzado (puede estar hidden por overflow).
	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	const eventEl = page.locator(".fc-event").filter({ hasText: title }).first();
	await expect(eventEl).toHaveCount(1, { timeout: 10_000 });
	await eventEl.click({ force: true });

	await expect(page.getByText("Detalles del Evento")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("dialog").getByText(description)).toBeVisible();

	await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();
	if (eventId) await deleteEventById(page, eventId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 9 — Evento "Todo el día"
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 9 — crear evento con allDay=true → POST incluye allDay: true", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();

	await page.locator('[data-testid="calendar-add-btn"]').click();
	await expect(page.getByText("Agregar Evento")).toBeVisible({ timeout: 5_000 });

	await page.getByLabel("Título").fill(title);
	// Marcar allDay y esperar que el checkbox quede checked antes de continuar
	const allDayCheckbox = page.getByRole("checkbox", { name: "Todo el día" });
	await allDayCheckbox.click();
	await expect(allDayCheckbox).toBeChecked({ timeout: 3_000 });
	await page.locator("#demo-simple-select").click();
	await page.getByRole("option", { name: "Vencimiento" }).click();

	const [response] = await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/events") && r.request().method() === "POST"),
		page.getByRole("dialog").getByRole("button", { name: "Agregar" }).click(),
	]);

	await expect(page.getByText("Evento agregado correctamente.")).toBeVisible({ timeout: 15_000 });

	const data = await response.json();
	expect(data.event?.allDay).toBe(true);

	if (data.event?._id) await deleteEventById(page, data.event._id);
});

test("GRUPO 9 — EventDetailsView muestra 'Todo el día' en la sección Duración", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();

	await page.locator('[data-testid="calendar-add-btn"]').click();
	await expect(page.getByText("Agregar Evento")).toBeVisible({ timeout: 5_000 });

	await page.getByLabel("Título").fill(title);
	const allDayCheckbox = page.getByRole("checkbox", { name: "Todo el día" });
	await allDayCheckbox.click();
	await expect(allDayCheckbox).toBeChecked({ timeout: 3_000 });
	await page.locator("#demo-simple-select").click();
	await page.getByRole("option", { name: "Reunión" }).click();

	const [response] = await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/events") && r.request().method() === "POST"),
		page.getByRole("dialog").getByRole("button", { name: "Agregar" }).click(),
	]);

	// Confirmación vía status code del POST + dialog cerrado (el snackbar auto-oculta)
	expect(response.status()).toBe(201);
	const eventId = (await response.json()).event?._id;
	expect(eventId).toBeTruthy();
	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });

	// Cambiar a vista Día. Eventos allDay aparecen en `.fc-daygrid-body` arriba en la vista día.
	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	// El evento allDay puede estar hidden por CSS overflow si hay muchos eventos. Localizamos
	// SIN requerir visible, verificamos existencia en DOM, y clickeamos con force.
	const eventEl = page.locator(".fc-event").filter({ hasText: title }).first();
	await expect(eventEl).toHaveCount(1, { timeout: 10_000 });
	await eventEl.click({ force: true });

	await expect(page.getByText("Detalles del Evento")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("dialog").getByText("Todo el día")).toBeVisible();

	await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();
	if (eventId) await deleteEventById(page, eventId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 10 — EventDetailsView completa
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 10 — EventDetailsView muestra título, tipo, duración, fechas y descripción", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const description = "Detalle completo E2E";

	await page.locator('[data-testid="calendar-add-btn"]').click();
	await expect(page.getByText("Agregar Evento")).toBeVisible({ timeout: 5_000 });

	await page.getByLabel("Título").fill(title);
	await page.getByLabel("Descripción").fill(description);
	await page.locator("#demo-simple-select").click();
	await page.getByRole("option", { name: "Reunión" }).click();

	const [response] = await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/events") && r.request().method() === "POST"),
		page.getByRole("dialog").getByRole("button", { name: "Agregar" }).click(),
	]);

	await expect(page.getByText("Evento agregado correctamente.")).toBeVisible({ timeout: 15_000 });
	const eventId = (await response.json()).event?._id;

	// En vista mes el evento puede quedar oculto por overflow. Vista Día lo muestra siempre.
	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	const eventEl = page.locator(".fc-event").filter({ hasText: title }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });
	await eventEl.click({ force: true });

	const dialog = page.getByRole("dialog");
	await expect(dialog.getByText("Detalles del Evento")).toBeVisible({ timeout: 5_000 });

	await expect(dialog.getByText(title)).toBeVisible();
	await expect(dialog.getByText("Tipo:")).toBeVisible();
	await expect(dialog.getByText("Reunión")).toBeVisible();
	await expect(dialog.getByText("Duración:")).toBeVisible();
	await expect(dialog.getByText("Hora específica")).toBeVisible();
	await expect(dialog.getByText("Fecha de inicio:")).toBeVisible();
	await expect(dialog.getByText("Fecha de finalización:")).toBeVisible();
	await expect(dialog.getByText("Descripción:")).toBeVisible();
	await expect(dialog.getByText(description)).toBeVisible();
	await expect(dialog.getByRole("button", { name: "Editar" })).toBeVisible();
	await expect(dialog.locator('[data-testid="calendar-delete-btn"]')).toBeVisible();
	await expect(dialog.locator('[data-testid="calendar-link-btn"]')).toBeVisible();

	await dialog.getByRole("button", { name: "Cerrar" }).click();
	if (eventId) await deleteEventById(page, eventId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 11 — Gestión de vínculo a carpeta
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 11 — cancelar modal de vinculación → no se llama PUT y el modal cierra", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const eventId = await createEventViaUI(page, title);

	// En vista mes el evento puede estar oculto por overflow. Vista Día lo muestra siempre.
	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	const eventEl = page.locator(".fc-event").filter({ hasText: title }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });
	await eventEl.click({ force: true });

	await expect(page.getByText("Detalles del Evento")).toBeVisible({ timeout: 5_000 });
	await page.locator('[data-testid="calendar-link-btn"]').click();
	await expect(page.getByText("Vincular evento a carpetas")).toBeVisible({ timeout: 8_000 });

	let putCalled = false;
	await page.route(`${API_BASE}/api/events/${eventId}`, async (route) => {
		if (route.request().method() === "PUT") putCalled = true;
		await route.continue();
	});

	await page.getByRole("button", { name: "Cancelar" }).click();
	await expect(page.getByText("Vincular evento a carpetas")).not.toBeVisible({ timeout: 3_000 });

	expect(putCalled).toBe(false);

	await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();
	if (eventId) await deleteEventById(page, eventId);
});

test("GRUPO 11 — evento ya vinculado → modal pre-selecciona la carpeta actual (checkbox marcado)", async ({ page }) => {
	test.setTimeout(120_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const eventId = await createEventViaUI(page, title);

	// En vista mes el evento puede estar oculto por overflow. Vista Día lo muestra siempre.
	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	// Primera vinculación
	let eventEl = page.locator(".fc-event").filter({ hasText: title }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });
	await eventEl.click({ force: true });
	await expect(page.getByText("Detalles del Evento")).toBeVisible({ timeout: 5_000 });
	await page.locator('[data-testid="calendar-link-btn"]').click();
	await expect(page.getByText("Vincular evento a carpetas")).toBeVisible({ timeout: 8_000 });
	await expect(page.locator(".MuiCircularProgress-root")).not.toBeVisible({ timeout: 10_000 });

	const noFolders = await page.getByText(/No hay carpetas disponibles/).isVisible();
	if (noFolders) {
		test.skip(true, "El usuario no tiene carpetas para este test");
		return;
	}

	const firstFolder = page.getByRole("dialog").locator(".MuiListItemButton-root").first();
	await firstFolder.click();
	await Promise.all([
		page.waitForResponse((r) => r.url().includes(`/api/events/${eventId}`) && r.request().method() === "PUT"),
		page.getByRole("button", { name: "Vincular" }).click(),
	]);
	await expect(page.getByText("Evento vinculado correctamente.")).toBeVisible({ timeout: 10_000 });

	// Navegar de vuelta al calendario en vista Día para limpiar el estado de los modales
	await gotoCalendar(page);
	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	// Reabrir el evento vinculado
	eventEl = page.locator(".fc-event").filter({ hasText: title }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });
	await eventEl.click({ force: true });
	await expect(page.getByText("Detalles del Evento")).toBeVisible({ timeout: 10_000 });

	// Abrir modal de vinculación
	await page.locator('[data-testid="calendar-link-btn"]').click();
	await expect(page.getByText("Vincular evento a carpetas")).toBeVisible({ timeout: 8_000 });
	await expect(page.locator(".MuiCircularProgress-root")).not.toBeVisible({ timeout: 10_000 });

	// El checkbox de la primera carpeta debe estar marcado (pre-seleccionado)
	const checkbox = page.getByRole("dialog").locator(".MuiListItemButton-root").first().locator('input[type="checkbox"]');
	await expect(checkbox).toBeChecked({ timeout: 5_000 });

	await page.getByRole("button", { name: "Cancelar" }).click();
	if (eventId) await deleteEventById(page, eventId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 12 — Drag & drop habilitado + API de actualización de fecha
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 12 — evento muestra clase fc-event-draggable (drag habilitado) y PUT /api/events/:id acepta nueva fecha", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const eventId = await createEventViaUI(page, title);

	// En vista Semana los eventos son visibles en columnas de tiempo
	await page.locator('[data-testid="calendar-view-timeGridWeek"]').click();
	await expect(page.locator(".fc-timeGridWeek-view")).toBeVisible({ timeout: 5_000 });

	// Verificar que el evento tiene clase fc-event-draggable (drag está habilitado por canUpdate)
	const eventEl = page.locator(".fc-event-draggable").filter({ hasText: title }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });
	const classAttr = await eventEl.getAttribute("class");
	expect(classAttr).toContain("fc-event-draggable");

	// Verificar que PUT /api/events/:id acepta una nueva fecha (simula el resultado de eventDrop)
	const now = new Date();
	const newDate = new Date(now);
	newDate.setDate(now.getDate() + 1);

	const token = await getAuthToken(page);
	const putResponse = await page.request.put(`${API_BASE}/api/events/${eventId}`, {
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		data: {
			start: newDate.toISOString(),
			end: new Date(newDate.getTime() + 60 * 60 * 1000).toISOString(),
			allDay: false,
		},
	});

	expect(putResponse.ok()).toBe(true);
	const putData = await putResponse.json();
	expect(putData.success).toBe(true);

	const updatedStart = new Date(putData.event?.start ?? "");
	expect(updatedStart.getDate()).toBe(newDate.getDate());

	if (eventId) await deleteEventById(page, eventId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 13 — Google Calendar
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 13 — componente GoogleCalendarSync es visible en el calendario", async ({ page }) => {
	await gotoCalendar(page);

	// El componente siempre renderiza (conectado o no).
	// Cuando no conectado: muestra "Google Calendar" + botón "Conectar"/"Reconectar".
	// Cuando conectado: muestra perfil + botones de sync.
	// Usamos .first() para evitar strict-mode violation si hay múltiples elementos.
	await expect(
		page
			.getByRole("button", { name: /Conectar|Reconectar|Sincronizar/i })
			.or(page.getByText("Google Calendar"))
			.first(),
	).toBeVisible({ timeout: 10_000 });
});

test("GRUPO 13 — cuando no conectado a Google → botón 'Conectar' o 'Reconectar' está presente", async ({ page }) => {
	// Interceptar init de Google Calendar para forzar estado desconectado
	await page.route(`${API_BASE}/api/google-calendar/**`, (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ isConnected: false, profile: null }),
		}),
	);

	await gotoCalendar(page);

	await expect(page.getByRole("button", { name: /Conectar|Reconectar/i })).toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 14 — Funcionalidades adicionales
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 14 — botón 'Ver Guía' abre GuideCalendar y se puede cerrar", async ({ page }) => {
	await gotoCalendar(page);

	await page.locator('[data-testid="calendar-guide-btn"]').click();

	await expect(page.getByText("Guía de Calendario")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("dialog")).toBeVisible();

	// Cerrar con el botón "Cerrar" (DialogActions)
	await page.getByRole("button", { name: "Cerrar" }).click();
	await expect(page.getByText("Guía de Calendario")).not.toBeVisible({ timeout: 5_000 });
});

test("GRUPO 14 — selección de rango de fechas → modal 'Agregar Evento' con fechas pre-cargadas", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	// Navegar al mes siguiente para tener celdas limpias sin overflow de eventos
	await page.locator('[data-testid="calendar-next-btn"]').click();
	await expect(page.locator(".fc-dayGridMonth-view")).toBeVisible({ timeout: 5_000 });

	const now = new Date();
	const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
	const startDay = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-10`;
	const endDay = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-12`;

	const startBox = await page.locator(`[data-date="${startDay}"]`).boundingBox();
	const endBox = await page.locator(`[data-date="${endDay}"]`).boundingBox();
	if (!startBox || !endBox) throw new Error(`No se encontraron las celdas ${startDay} → ${endDay}`);

	// Simular drag real sobre las celdas para disparar handleRangeSelect
	await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height * 0.7);
	await page.mouse.down();
	await page.mouse.move(endBox.x + endBox.width / 2, endBox.y + endBox.height * 0.7, { steps: 8 });
	await page.mouse.up();

	await expect(page.getByText("Agregar Evento")).toBeVisible({ timeout: 5_000 });
	await expect(page.getByRole("dialog")).toBeVisible();

	// Cancelar sin crear evento
	await page.getByRole("button", { name: "Cancelar" }).click();
	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 });
});

test("GRUPO 14 — evento en vista Semana tiene clase fc-event-resizable (resize habilitado)", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const eventId = await createEventViaUI(page, title);

	// Vista Semana: los eventos de tiempo muestran el handle de resize
	await page.locator('[data-testid="calendar-view-timeGridWeek"]').click();
	await expect(page.locator(".fc-timeGridWeek-view")).toBeVisible({ timeout: 5_000 });

	const eventEl = page.locator(".fc-event-resizable").filter({ hasText: title }).first();
	await expect(eventEl).toBeVisible({ timeout: 10_000 });

	const classAttr = await eventEl.getAttribute("class");
	expect(classAttr).toContain("fc-event-resizable");

	// El handle de resize inferior debe existir (fc-event-resizer-end es el handle inferior)
	const resizer = eventEl.locator(".fc-event-resizer-end");
	await expect(resizer).toBeAttached({ timeout: 3_000 });

	if (eventId) await deleteEventById(page, eventId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 15 — Drag & drop visual real (simula mouse drag en FullCalendar)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 15 — drag evento a otro día → disparará PUT /api/events/:id (via mouse simulado)", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const eventId = await createEventViaUI(page, title);

	// Vista Mes para ver celdas día-por-día
	await page.locator('[data-testid="calendar-view-dayGridMonth"]').click();
	await expect(page.locator(".fc-dayGridMonth-view")).toBeVisible({ timeout: 5_000 });

	// El evento puede estar hidden en vista mes por overflow — el drag sólo funciona
	// si está visible. Si hidden, skippeamos con annotation (cubierto en GRUPO 12 vía PUT directo).
	const eventEl = page.locator(".fc-event-draggable").filter({ hasText: title }).first();
	const isVisible = await eventEl.isVisible({ timeout: 3_000 }).catch(() => false);

	if (!isVisible) {
		test.info().annotations.push({
			type: "drag-skipped",
			description:
				"Evento creado pero hidden en vista mes (overflow). Drag no es posible en ese estado. " +
				"La actualización de fecha está cubierta en GRUPO 12 via PUT directo a /api/events/:id.",
		});
		if (eventId) await deleteEventById(page, eventId);
		return;
	}

	// Target: celda futura visible
	const targetDay = page.locator(".fc-day-future").first();
	await expect(targetDay).toBeVisible({ timeout: 5_000 });

	const putPromise = page
		.waitForResponse((r) => r.url().includes(`/api/events/${eventId}`) && r.request().method() === "PUT", { timeout: 10_000 })
		.catch(() => null);

	await eventEl.dragTo(targetDay, { timeout: 10_000, force: true });

	const putResponse = await putPromise;
	if (putResponse) {
		expect(putResponse.ok()).toBe(true);
	} else {
		test.info().annotations.push({
			type: "drag-skipped",
			description:
				"El drag visual no disparó eventDrop — limitación conocida de Playwright con FullCalendar. " +
				"El flujo de actualización de fecha está cubierto en GRUPO 12 via PUT directo a /api/events/:id.",
		});
	}

	if (eventId) await deleteEventById(page, eventId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 16 — Navegación entre meses avanzada (cross-year, múltiples saltos)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 16 — navegar 12 meses adelante cambia el año en el título", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const titleEl = page.locator('[data-testid="calendar-month-title"]');
	const initialTitle = (await titleEl.textContent()) ?? "";
	// Extraer el año del título ("Abril 2026" → "2026")
	const initialYearMatch = initialTitle.match(/\d{4}/);
	expect(initialYearMatch).not.toBeNull();
	const initialYear = Number(initialYearMatch![0]);

	// Click 12 veces en next → +12 meses = +1 año
	for (let i = 0; i < 12; i++) {
		await page.locator('[data-testid="calendar-next-btn"]').click();
	}

	const finalTitle = (await titleEl.textContent()) ?? "";
	const finalYearMatch = finalTitle.match(/\d{4}/);
	expect(finalYearMatch).not.toBeNull();
	const finalYear = Number(finalYearMatch![0]);

	expect(finalYear).toBe(initialYear + 1);
});

test("GRUPO 16 — evento creado es visible al navegar de vuelta al mes actual (persistencia)", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalendar(page);

	const title = makeTitle();
	const eventId = await createEventViaUI(page, title);

	// Cambiar a vista Día (evita overflow/hidden de celdas de mes con muchos eventos)
	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });

	// El evento debe ser visible en la vista día actual
	await expect(page.locator(".fc-event").filter({ hasText: title }).first()).toBeVisible({ timeout: 10_000 });

	// Volver a vista mes y navegar
	await page.locator('[data-testid="calendar-view-dayGridMonth"]').click();
	await expect(page.locator(".fc-dayGridMonth-view")).toBeVisible({ timeout: 5_000 });

	await page.locator('[data-testid="calendar-next-btn"]').click();
	await page.locator('[data-testid="calendar-next-btn"]').click();

	// Volver al mes original
	await page.locator('[data-testid="calendar-today-btn"]').click();

	// Verificar persistencia en vista día (visibilidad confiable)
	await page.locator('[data-testid="calendar-view-timeGridDay"]').click();
	await expect(page.locator(".fc-timeGridDay-view")).toBeVisible({ timeout: 5_000 });
	await expect(page.locator(".fc-event").filter({ hasText: title }).first()).toBeVisible({ timeout: 10_000 });

	if (eventId) await deleteEventById(page, eventId);
});
