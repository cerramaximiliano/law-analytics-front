import { test, expect, Page } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Detecta overflow horizontal real en el DOM de elementos interactivos en las
 * rutas clave de la app. Regla: `scrollWidth > clientWidth + 2` (tolerancia
 * subpixel). Los casos con text-overflow: ellipsis se reportan aparte como
 * "potencialmente intencional".
 *
 * Salida: tests/ux-overflow-report.json (se reinicia al inicio de la suite).
 * Soft assertions: el test reporta pero no bloquea CI. Para enforcement,
 * cambiar expect.soft por expect.
 */

interface OverflowEntry {
	tag: string;
	text: string;
	selector: string;
	scrollWidth: number;
	clientWidth: number;
	overflow: number;
	hasEllipsis: boolean;
}

interface RouteResult {
	route: string;
	path: string;
	viewport: string;
	overflowing: OverflowEntry[];
	ellipsisButTruncated: OverflowEntry[];
}

const REPORT_DIR = path.resolve(__dirname, ".overflow-results");
const REPORT_FILE = path.resolve(__dirname, "ux-overflow-report.json");

// NOTA: limpiá `.overflow-results/` manualmente antes de correr la suite:
//   rm -rf tests/.overflow-results && npx playwright test --config=playwright.ux-overflow.config.ts
// El módulo no lo limpia porque Playwright recarga el módulo entre describes
// con diferente storageState, y el cleanup repetido pierde los resultados.
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

const PUBLIC_ROUTES = [
	{ path: "/", name: "landing" },
	{ path: "/plans", name: "plans" },
	{ path: "/faq", name: "faq" },
	{ path: "/login", name: "login" },
	{ path: "/register", name: "register" },
	{ path: "/forgot-password", name: "forgot-password" },
];

const AUTH_ROUTES = [
	{ path: "/dashboard/default", name: "dashboard" },
	{ path: "/apps/calendar", name: "calendar" },
	{ path: "/apps/folders/list", name: "folders" },
	{ path: "/apps/profiles/user/personal", name: "profile-personal" },
	{ path: "/apps/profiles/user/professional", name: "profile-professional" },
	{ path: "/apps/profiles/user/settings", name: "profile-settings" },
	{ path: "/apps/profiles/account/my-account", name: "account" },
	{ path: "/apps/profiles/account/pjn", name: "pjn-integration" },
	{ path: "/documentos/escritos", name: "escritos" },
	{ path: "/documentos/modelos", name: "modelos" },
	{ path: "/herramientas/seguimiento-postal", name: "postal" },
	{ path: "/suscripciones/tables", name: "suscripciones" },
	{ path: "/apps/calc", name: "calc-all" },
	{ path: "/apps/calc/labor", name: "calc-labor" },
	{ path: "/ayuda", name: "ayuda" },
];

const VIEWPORTS = [
	{ name: "desktop", width: 1440, height: 900 },
	{ name: "tablet", width: 820, height: 1180 },
	{ name: "mobile", width: 390, height: 844 },
];

const INTERACTIVE_SELECTORS = [
	".MuiButton-root",
	".MuiChip-root",
	".MuiTab-root",
	".MuiMenuItem-root",
	".MuiListItemText-primary",
	".MuiTableCell-root",
	"button",
	"a[role='button']",
	"h1, h2, h3, h4, h5, h6",
	".MuiTypography-subtitle1",
	".MuiTypography-subtitle2",
].join(", ");

async function collectOverflow(page: Page): Promise<{ over: OverflowEntry[]; ellipsis: OverflowEntry[] }> {
	return await page.evaluate((selector) => {
		const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
		const over: OverflowEntry[] = [];
		const ellipsis: OverflowEntry[] = [];
		for (const el of elements) {
			const text = (el.textContent || "").trim();
			if (!text) continue;
			if (el.scrollWidth <= el.clientWidth + 2) continue;
			const style = window.getComputedStyle(el);
			const hasEllipsis = style.textOverflow === "ellipsis" || style.overflow === "hidden";
			const entry: OverflowEntry = {
				tag: el.tagName.toLowerCase(),
				text: text.slice(0, 80),
				selector: el.className ? `.${el.className.split(" ")[0]}` : el.tagName.toLowerCase(),
				scrollWidth: el.scrollWidth,
				clientWidth: el.clientWidth,
				overflow: el.scrollWidth - el.clientWidth,
				hasEllipsis,
			};
			if (hasEllipsis) ellipsis.push(entry);
			else over.push(entry);
		}
		return { over, ellipsis };
	}, INTERACTIVE_SELECTORS);
}

function writeEntry(entry: RouteResult) {
	const filename = `${entry.route}-${entry.viewport}.json`;
	fs.writeFileSync(path.join(REPORT_DIR, filename), JSON.stringify(entry, null, 2));
}

/**
 * Genera el reporte agregado `ux-overflow-report.json`.
 *
 * Playwright re-carga el módulo entre describes con diferente storageState, lo
 * que rompe cualquier limpieza o agregación a nivel de módulo. Por eso:
 * - Cada test escribe su propio archivo en `.overflow-results/`
 * - La agregación final la hace el script `npm run test:ux-overflow` después
 *   (ver package.json), no un `test.afterAll`.
 */
test.afterAll(() => {
	// Best-effort aggregation por si se corre sin el npm script wrapper.
	try {
		const files = fs.readdirSync(REPORT_DIR).filter((f) => f.endsWith(".json"));
		const data = files.map((f) => JSON.parse(fs.readFileSync(path.join(REPORT_DIR, f), "utf-8")));
		fs.writeFileSync(REPORT_FILE, JSON.stringify(data, null, 2));
	} catch {
		// El script wrapper se encarga si esto falla.
	}
});

test.describe("Overflow detection — rutas públicas", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	for (const route of PUBLIC_ROUTES) {
		for (const vp of VIEWPORTS) {
			test(`${route.name} @ ${vp.name}`, async ({ page }) => {
				await page.setViewportSize({ width: vp.width, height: vp.height });
				let over: OverflowEntry[] = [];
				let ellipsis: OverflowEntry[] = [];
				try {
					await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
					await page.waitForTimeout(2500);
					const result = await collectOverflow(page);
					over = result.over;
					ellipsis = result.ellipsis;
				} finally {
					writeEntry({
						route: route.name,
						path: route.path,
						viewport: vp.name,
						overflowing: over,
						ellipsisButTruncated: ellipsis,
					});
				}
				expect.soft(over, `Overflow no-ellipsis en ${route.name} @ ${vp.name}`).toHaveLength(0);
			});
		}
	}
});

test.describe("Overflow detection — rutas autenticadas", () => {
	test.use({ storageState: "tests/.auth/user.json" });

	for (const route of AUTH_ROUTES) {
		for (const vp of VIEWPORTS) {
			test(`${route.name} @ ${vp.name}`, async ({ page }) => {
				await page.setViewportSize({ width: vp.width, height: vp.height });
				let over: OverflowEntry[] = [];
				let ellipsis: OverflowEntry[] = [];
				try {
					await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
					await page.waitForTimeout(2500);
					const result = await collectOverflow(page);
					over = result.over;
					ellipsis = result.ellipsis;
				} finally {
					writeEntry({
						route: route.name,
						path: route.path,
						viewport: vp.name,
						overflowing: over,
						ellipsisButTruncated: ellipsis,
					});
				}
				expect.soft(over, `Overflow no-ellipsis en ${route.name} @ ${vp.name}`).toHaveLength(0);
			});
		}
	}
});
