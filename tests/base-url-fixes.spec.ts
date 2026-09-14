/**
 * Tests de regresión: bug "process.env.REACT_APP_BASE_URL" en Vite
 *
 * El proyecto migró de CRA a Vite pero quedaron 24 referencias a
 * process.env.REACT_APP_BASE_URL — undefined en Vite. La URL resultante
 * "undefined/api/..." iba contra el SPA mismo (puerto 3000 en dev,
 * lawanalytics.app en prod), nginx devolvía index.html (HTML, no JSON)
 * y la mayoría de los handlers fallaban silenciosamente.
 *
 * Cada test:
 *   1. Captura todas las requests durante una acción.
 *   2. Asserta que NINGUNA URL capturada contenga "undefined".
 *   3. Asserta que el endpoint esperado fue golpeado en localhost:5000.
 *
 * Para los tests que dependerían de data en DB, mockeamos las respuestas
 * del backend con page.route() — el objetivo es validar la URL del
 * request, no el comportamiento del backend.
 *
 * Si en el futuro alguien revierte el fix, estos tests fallan inmediatamente.
 */

import { test, expect, Page, Request, Route } from "@playwright/test";
import { loginViaForm, CREDENTIALS } from "./helpers/auth";

const API_BASE = "http://localhost:5000";
const SPA_BASE = "http://localhost:3000";

// ─── Helpers comunes ──────────────────────────────────────────────────────────

interface RequestTracker {
	urls: string[];
	stop: () => void;
}

/**
 * Registra todas las requests salientes a /api/, /cloudinary/, etc.
 * Llamar a stop() antes de las aserciones para no capturar requests posteriores.
 */
function trackApiRequests(page: Page): RequestTracker {
	const urls: string[] = [];
	const handler = (req: Request) => {
		const url = req.url();
		if (url.includes("/api/") || url.includes("/cloudinary/")) {
			urls.push(`${req.method()} ${url}`);
		}
	};
	page.on("request", handler);
	return {
		urls,
		stop: () => page.off("request", handler),
	};
}

/**
 * Falla el test si alguna URL capturada contiene "undefined" o pega contra
 * el SPA cuando debería ir al backend.
 */
function assertNoBrokenUrls(urls: string[]): void {
	const broken = urls.filter((entry) => {
		const url = entry.split(" ")[1] || "";
		if (url.includes("/undefined/")) return true;
		if (url.startsWith(`${SPA_BASE}/cloudinary/`)) return true;
		if (url.startsWith(`${SPA_BASE}/api/booking/public/`)) return true;
		return false;
	});
	expect(
		broken,
		`URLs rotas detectadas (van contra el SPA o contienen "undefined"):\n${broken.join("\n")}\n\nTodas las capturas:\n${urls.join("\n")}`,
	).toEqual([]);
}

/**
 * Asserta que al menos una request capturada matchee el fragmento dado.
 */
function assertHitEndpoint(urls: string[], fragment: string): void {
	const hit = urls.some((entry) => entry.includes(fragment));
	expect(hit, `Esperaba un request que matchee "${fragment}". Capturadas:\n${urls.join("\n") || "(ninguna)"}`).toBe(true);
}

/**
 * PNG transparente de 1x1 px (67 bytes) — fixture mínimo para tests de upload.
 */
const TINY_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

/**
 * Helper: mockear un endpoint del backend con una respuesta JSON 200.
 * Devuelve función para quitar el route.
 */
async function mockApi(page: Page, urlPattern: string | RegExp, body: unknown): Promise<() => Promise<void>> {
	await page.route(urlPattern, async (route: Route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(body),
		});
	});
	return async () => page.unroute(urlPattern);
}

// ─── Tests sin auth (flujos públicos) ─────────────────────────────────────────

test.describe("URL fixes — flujos públicos (sin login)", () => {
	test("AuthCodeVerification: 'Reenviar código' apunta a localhost:5000/api/auth/...", async ({ page }) => {
		await page.goto("/auth/forgot-password");
		await page.fill("#email-forgot", CREDENTIALS.email).catch(async () => {
			await page.getByLabel(/email/i).fill(CREDENTIALS.email);
		});
		const tracker = trackApiRequests(page);

		await page
			.getByRole("button", { name: /enviar|continuar|recuperar/i })
			.first()
			.click();

		await page.waitForURL(/code-verification/i, { timeout: 15_000 }).catch(() => {});

		const resendBtn = page.getByRole("button", { name: /reenviar.*código/i });
		if (await resendBtn.isVisible().catch(() => false)) {
			await resendBtn.click();
			await page.waitForTimeout(1500);
		}

		tracker.stop();
		assertNoBrokenUrls(tracker.urls);
		assertHitEndpoint(tracker.urls, `${API_BASE}/api/auth/`);
	});

	test("Booking público listado (/booking): availability/list apunta a localhost:5000", async ({ page }) => {
		// Mockeamos el endpoint para no depender de DB
		await mockApi(page, `${API_BASE}/api/booking/public/availability/list`, []);
		const tracker = trackApiRequests(page);

		await page.goto("/booking");
		await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
		tracker.stop();

		assertNoBrokenUrls(tracker.urls);
		assertHitEndpoint(tracker.urls, `${API_BASE}/api/booking/public/availability/list`);
	});

	test("Booking público con slug (/booking/:slug): availability/:slug apunta a localhost:5000", async ({ page }) => {
		const slug = "test-slug-e2e";
		const mockedAvailability = {
			isActive: true,
			ownerName: "Test",
			availableDays: [],
			meetingDuration: 30,
			minBookingTime: 24,
			maxBookingTime: 720,
		};
		await mockApi(page, `${API_BASE}/api/booking/public/availability/${slug}`, mockedAvailability);
		const tracker = trackApiRequests(page);

		await page.goto(`/booking/${slug}`);
		await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
		tracker.stop();

		assertNoBrokenUrls(tracker.urls);
		assertHitEndpoint(tracker.urls, `${API_BASE}/api/booking/public/availability/${slug}`);
	});

	test("manage-booking: GET booking por token apunta a localhost:5000", async ({ page }) => {
		const token = "fake-token-e2e";
		await mockApi(page, `${API_BASE}/api/booking/public/bookings/${token}`, {
			_id: "abc",
			status: "confirmed",
			email: "test@test.com",
			date: "2026-12-31",
			startTime: "10:00",
			endTime: "10:30",
		});
		const tracker = trackApiRequests(page);

		await page.goto(`/manage-booking/${token}`);
		await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
		// Si la pantalla carga el token desde URL params y no auto-fetch, intentamos buscarlo.
		const searchBtn = page.getByRole("button", { name: /buscar|consultar/i });
		if (await searchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			await searchBtn.click();
			await page.waitForTimeout(1500);
		}
		tracker.stop();

		assertNoBrokenUrls(tracker.urls);
		assertHitEndpoint(tracker.urls, `${API_BASE}/api/booking/public/bookings/${token}`);
	});
});

// ─── Tests con auth ───────────────────────────────────────────────────────────

test.describe("URL fixes — flujos con login", () => {
	test.beforeEach(async ({ page }) => {
		await loginViaForm(page);
	});

	test("SupportModal: enviar consulta apunta a localhost:5000/api/support-contacts", async ({ page }) => {
		await page.goto("/dashboard/default");

		const isNavCardVisible = await page
			.getByText("¿Necesita ayuda?")
			.isVisible()
			.catch(() => false);
		if (!isNavCardVisible) {
			await page
				.getByRole("button", { name: /open drawer/i })
				.click()
				.catch(() => {});
		}
		await page.getByRole("button", { name: "Soporte", exact: true }).click();
		await expect(page.getByRole("dialog")).toBeVisible({ timeout: 8_000 });

		await page.getByLabel(/tipo de consulta/i).click();
		await page.getByRole("option", { name: /consulta general/i }).click();
		await page.getByLabel(/describe tu consulta/i).fill("Test E2E — verificación de URL base");

		const tracker = trackApiRequests(page);
		await page.getByRole("button", { name: "Enviar consulta", exact: true }).click();
		await page.waitForTimeout(2500);
		tracker.stop();

		assertNoBrokenUrls(tracker.urls);
		assertHitEndpoint(tracker.urls, `${API_BASE}/api/support-contacts`);
	});

	test("Calc Laboral - tasas/listado apunta a localhost:5000 al cargar wizard", async ({ page }) => {
		const tracker = trackApiRequests(page);

		await page.goto("/apps/calc/labor");
		await page.getByText(/liquidación por despido sin causa/i).click({ timeout: 10_000 });
		await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
		await page.waitForTimeout(2000);
		tracker.stop();

		assertNoBrokenUrls(tracker.urls);
	});

	test("ProfileTabs: upload-avatar apunta a localhost:5000/cloudinary/upload-avatar", async ({ page }) => {
		// Mockeamos cloudinary para no consumir cuota real
		await mockApi(page, `${API_BASE}/cloudinary/upload-avatar`, {
			url: "https://res.cloudinary.com/test/image/upload/v1/test.png",
		});

		await page.goto("/apps/profiles/user/personal");
		await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

		const tracker = trackApiRequests(page);

		// El input de archivo del avatar suele ser oculto. Lo seteamos directo.
		const fileInput = page.locator('input[type="file"]').first();
		await fileInput.setInputFiles({
			name: "avatar.png",
			mimeType: "image/png",
			buffer: TINY_PNG,
		});
		await page.waitForTimeout(2500); // dejar que la request salga
		tracker.stop();

		assertNoBrokenUrls(tracker.urls);
		assertHitEndpoint(tracker.urls, `${API_BASE}/cloudinary/upload-avatar`);
	});

	test.skip("TabPersonal: upload-avatar — componente huérfano sin uso actual", async () => {
		// El componente sections/apps/profiles/account/TabPersonal.tsx no es
		// importado en ninguna parte del codebase (la pantalla
		// /apps/profiles/account/personal usa otra implementación). El fix está
		// aplicado preventivamente. Cuando se reincorpore el componente,
		// eliminar este .skip y reactivar el test idéntico al de ProfileTabs.
	});

	test("Reservations admin: cargar listado apunta a localhost:5000/api/booking/...", async ({ page }) => {
		// Mockeamos los endpoints que usa la página al cargar
		await mockApi(page, `${API_BASE}/api/booking/availability`, []);
		await mockApi(page, `${API_BASE}/api/booking/bookings`, []);

		const tracker = trackApiRequests(page);
		await page.goto("/apps/calendar/reservations");
		await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
		tracker.stop();

		assertNoBrokenUrls(tracker.urls);
		// Al menos uno de los dos endpoints debe haberse llamado al cargar la página
		const hitAvailability = tracker.urls.some((u) => u.includes(`${API_BASE}/api/booking/availability`));
		const hitBookings = tracker.urls.some((u) => u.includes(`${API_BASE}/api/booking/bookings`));
		expect(
			hitAvailability || hitBookings,
			`Esperaba al menos uno de /api/booking/availability o /api/booking/bookings.\nCapturadas:\n${tracker.urls.join("\n")}`,
		).toBe(true);
	});

	test("Availability admin: cargar listado apunta a localhost:5000/api/booking/availability", async ({ page }) => {
		await mockApi(page, `${API_BASE}/api/booking/availability`, []);

		const tracker = trackApiRequests(page);
		await page.goto("/apps/calendar/availability");
		await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
		tracker.stop();

		assertNoBrokenUrls(tracker.urls);
		assertHitEndpoint(tracker.urls, `${API_BASE}/api/booking/availability`);
	});
});

// ─── Tests pendientes de auto-test (UI compleja o componente sin uso) ─────────

test.describe("URL fixes — pendientes de testing manual", () => {
	test.skip("SubscriptionInfo: usage-stats — componente sin uso actual", async () => {
		// El componente SubscriptionInfo no se monta en ninguna página activa
		// (grep no encontró imports de <SubscriptionInfo>). Cuando se reincorpore,
		// eliminar este .skip y verificar manualmente.
	});

	test.skip("Juzgados autocomplete: requiere abrir detalle de carpeta", async () => {
		// El JuzgadoAutocomplete vive en pages/apps/folders/details/components/
		// FolderJudData* y solo se renderiza al editar los datos judiciales de
		// una carpeta existente. Manual:
		//   1. /apps/folders/folders → click en una carpeta
		//   2. Ir a "Datos Judiciales" → editar
		//   3. Tipear en el autocomplete
		//   4. Network: GET http://localhost:5000/api/juzgados/search?... → 200
	});

	test.skip("CustomerViewFixed: requiere modal de contacto con folders vinculados", async () => {
		// El modal solo dispara /api/folders/batch como fallback secundario,
		// y requiere un contacto con folderIds para llegar a esa branch.
		// Manual:
		//   1. Crear/abrir un contacto con causas vinculadas
		//   2. Network: POST http://localhost:5000/api/folders/batch → 200
	});

	test.skip("CalculationDetailsView: requiere cálculo guardado", async () => {
		// Manual:
		//   1. /apps/calc/... → click "Ver detalle" en un cálculo guardado
		//   2. "Enviar por email" → completar destinatario → enviar
		//   3. Network: POST http://localhost:5000/api/email/send-email → 200
	});
});
