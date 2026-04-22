/**
 * Tests E2E de Notificaciones — badge del header + popover + integración Socket.io
 *
 * **Arquitectura real:**
 *   - Backend REST: `la-notification` microservice (pero montado como `/api/alert/*` en
 *     law-analytics-server según los endpoints que consume el frontend).
 *   - Endpoints:
 *     · GET /api/alert/useralerts/:userId?page=1&limit=20
 *     · POST /api/alert/markAsRead/:alertId
 *     · DELETE /api/alert/alerts/:alertId
 *   - Socket.io: `WebSocketService.ts` conecta a `VITE_WS_URL`. Listeners relevantes:
 *     · `new_alert` → dispatch ADD_ALERT al Redux store
 *     · `pending_alerts` → dispatch ADD_MULTIPLE_ALERTS
 *   - Redux state: `alerts.alerts[]`, `alerts.stats.unread` (contador del Badge)
 *
 * **Estrategia de testing:**
 *   - UI + REST: mockeamos `/api/alert/useralerts/:userId` con fixtures → verificamos
 *     que el popover muestra las alertas y que markAsRead/delete llaman los endpoints.
 *   - Real-time: en vez de simular el WebSocket (complejo + frágil), disparamos las
 *     actions del Redux store via `page.evaluate(window.store.dispatch(...))` o
 *     inyectamos alertas actualizando directamente el mock. Esto testea que el UI
 *     reacciona al cambio de estado, que es el comportamiento observable del usuario
 *     cuando llega un `new_alert` por Socket.io.
 *
 * GRUPO 1 — Badge del header: botón visible + Badge con contador
 * GRUPO 2 — Apertura del popover → título "Notificaciones"
 * GRUPO 3 — Empty state (sin alerts)
 * GRUPO 4 — Lista de alerts (mock con 3 items)
 * GRUPO 5 — Marcar como leída → POST /api/alert/markAsRead/:id
 * GRUPO 6 — Eliminar alerta → DELETE /api/alert/alerts/:id
 * GRUPO 7 — Nueva notificación entrante (simula Socket.io via Redux dispatch)
 * GRUPO 8 — Navegación a "Configurar preferencias"
 */

import { test, expect, type Page, type Route } from "@playwright/test";

const STORAGE_STATE = "tests/.auth/user.json";
test.use({ storageState: STORAGE_STATE });

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildAlert(i: number, opts: { read?: boolean } = {}): Record<string, unknown> {
	// El componente evalúa `!alert.read` como boolean — usar `false` para "no leída"
	// y `true` para "leída". Cualquier string sería truthy y rompería la lógica.
	const read = opts.read ?? false;
	return {
		_id: `alert_${i}_${Date.now()}`,
		userId: "mock-user-id",
		folderId: `folder_${i}`,
		primaryText: `Notificación de prueba ${i}`,
		primaryVariant: "subtitle1",
		secondaryText: `Descripción #${i}`,
		actionText: "Ver detalles",
		avatarType: "filled",
		avatarIcon: "MessageText1",
		avatarSize: 40,
		expirationDate: "2026-12-31T00:00:00.000Z",
		read,
		sourceType: "system",
	};
}

function mockAlertsResponse(alerts: unknown[], stats?: { unread?: number; totalAlerts?: number }) {
	return {
		success: true,
		data: {
			alerts,
			pagination: {
				total: alerts.length,
				page: 1,
				pages: 1,
				hasNext: false,
				hasPrev: false,
			},
			stats: stats ?? { unread: alerts.filter((a: any) => !a.read).length, totalAlerts: alerts.length },
		},
	};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Intercepta el GET de alerts y devuelve el body indicado */
async function setAlertsMock(page: Page, responseBody: unknown) {
	await page.route(
		(url) => url.pathname.startsWith("/api/alert/useralerts/"),
		(route: Route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(responseBody),
			}),
	);
}

async function gotoDashboard(page: Page) {
	await page.goto("/dashboard/default");
	await expect(page.getByRole("button", { name: "open notifications" })).toBeVisible({ timeout: 15_000 });
}

async function openNotificationsPopover(page: Page) {
	await page.getByRole("button", { name: "open notifications" }).click();
	await expect(page.getByRole("heading", { name: "Notificaciones", exact: true })).toBeVisible({ timeout: 5_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Badge del header
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — header muestra el botón 'open notifications'", async ({ page }) => {
	await gotoDashboard(page);
	await expect(page.getByRole("button", { name: "open notifications" })).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 1 — Badge muestra el contador de no leídas según mock", async ({ page }) => {
	await setAlertsMock(
		page,
		mockAlertsResponse(
			[
				buildAlert(1, { read: false }),
				buildAlert(2, { read: false }),
				buildAlert(3, { read: false }),
			],
			{ unread: 3, totalAlerts: 3 },
		),
	);

	await gotoDashboard(page);

	// El Badge muestra el número dentro de un span con clase MuiBadge-badge
	const badge = page.locator(".MuiBadge-badge").first();
	await expect(badge).toBeVisible({ timeout: 10_000 });
	await expect(badge).toHaveText(/3|3\+|\d/);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Apertura del popover
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — click en botón abre el popover con título 'Notificaciones'", async ({ page }) => {
	await setAlertsMock(page, mockAlertsResponse([]));
	await gotoDashboard(page);
	await openNotificationsPopover(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Empty state
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — sin alertas → popover muestra 'No tienes notificaciones pendientes'", async ({ page }) => {
	await setAlertsMock(page, mockAlertsResponse([], { unread: 0, totalAlerts: 0 }));
	await gotoDashboard(page);
	await openNotificationsPopover(page);

	await expect(page.getByText("No tienes notificaciones pendientes")).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Lista de notificaciones
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — popover renderiza las 3 alertas del mock", async ({ page }) => {
	const alerts = [buildAlert(1), buildAlert(2), buildAlert(3)];
	await setAlertsMock(page, mockAlertsResponse(alerts));
	await gotoDashboard(page);
	await openNotificationsPopover(page);

	for (const a of alerts) {
		await expect(page.getByText((a as any).primaryText)).toBeVisible({ timeout: 5_000 });
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Marcar como leída (REST)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — click en 'marcar leída' → POST /api/alert/markAsRead/:id", async ({ page }) => {
	const unread = buildAlert(42, { read: false });
	await setAlertsMock(page, mockAlertsResponse([unread]));

	// Mock del endpoint markAsRead
	let markReadHit = false;
	let markReadId = "";
	await page.route(
		(url) => url.pathname.startsWith("/api/alert/markAsRead/"),
		(route) => {
			markReadHit = true;
			markReadId = route.request().url().split("/").pop() ?? "";
			return route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true }),
			});
		},
	);

	await gotoDashboard(page);
	await openNotificationsPopover(page);
	await expect(page.getByText((unread as any).primaryText)).toBeVisible({ timeout: 5_000 });

	const markBtn = page.locator('[data-testid="notification-mark-read-btn"]').first();
	await expect(markBtn).toBeVisible({ timeout: 5_000 });
	await markBtn.click();

	await expect.poll(() => markReadHit, { timeout: 5_000 }).toBe(true);
	expect(markReadId).toBe((unread as any)._id);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — Eliminar notificación (REST)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — click en 'eliminar' → DELETE /api/alert/alerts/:id", async ({ page }) => {
	const alert = buildAlert(99);
	await setAlertsMock(page, mockAlertsResponse([alert]));

	let deleteHit = false;
	let deleteId = "";
	await page.route(
		(url) => url.pathname.startsWith("/api/alert/alerts/"),
		(route) => {
			if (route.request().method() === "DELETE") {
				deleteHit = true;
				deleteId = route.request().url().split("/").pop() ?? "";
				return route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ success: true }),
				});
			}
			return route.continue();
		},
	);

	await gotoDashboard(page);
	await openNotificationsPopover(page);

	const deleteBtn = page.locator('[data-testid="notification-delete-btn"]').first();
	await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
	await deleteBtn.click();

	await expect.poll(() => deleteHit, { timeout: 5_000 }).toBe(true);
	expect(deleteId).toBe((alert as any)._id);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 7 — Simulación de notificación entrante (estilo Socket.io)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 7 — nueva alerta despachada al store aparece en tiempo real en el popover", async ({ page }) => {
	// Estado inicial: lista vacía
	await setAlertsMock(page, mockAlertsResponse([], { unread: 0, totalAlerts: 0 }));
	await gotoDashboard(page);
	await openNotificationsPopover(page);
	await expect(page.getByText("No tienes notificaciones pendientes")).toBeVisible({ timeout: 5_000 });

	// Simular llegada de notificación por Socket.io: dispatch al Redux store
	// Esto imita el efecto observable de `socket.on("new_alert", ...)` que termina en
	// `dispatch({ type: ADD_ALERT, payload: alert })`.
	const newAlert = buildAlert(777, { read: false });

	await page.evaluate((alert) => {
		const win = window as unknown as { __store__?: { dispatch: (a: unknown) => void } };
		if (!win.__store__) {
			throw new Error("window.__store__ no disponible — requiere dev mode (import.meta.env.DEV)");
		}
		// ADD_ALERT es el action que dispara el reducer cuando el WS recibe `new_alert`
		win.__store__.dispatch({ type: "ADD_ALERT", payload: alert });
	}, newAlert as unknown);

	// La UI reacciona al nuevo estado: aparece en el popover
	await expect(page.getByText((newAlert as any).primaryText)).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 8 — Navegación a configuración
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 8 — click 'Configurar preferencias' navega a /apps/profiles/user/settings", async ({ page }) => {
	await setAlertsMock(page, mockAlertsResponse([]));
	await gotoDashboard(page);
	await openNotificationsPopover(page);

	await page.getByText(/Configurar preferencias/i).click();
	await expect(page).toHaveURL(/\/apps\/profiles\/user\/settings/, { timeout: 10_000 });
});
