import { test, expect, Page } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Tests complementarios a ux-overflow.spec.ts. Detecta dos patrones de layout
 * que NO se ven con `scrollWidth > clientWidth` del elemento individual:
 *
 * 1. ViewportOverflow — elementos visibles cuyo bounding rect se extiende más
 *    allá del borde derecho del viewport (rect.right > vw + 2). Captura cosas
 *    como botones secondary de MainCard que no wrappean en mobile.
 *
 * 2. WrappedFlexNoGap — contenedores flex con flex-wrap: wrap donde dos líneas
 *    de hijos (chips, buttons, etc.) quedan "pegadas" sin row-gap ni spacing.
 *    Captura el caso clásico de Stack de chips que al envolver en mobile se
 *    superponen sin respiro visual.
 *
 * Salida: tests/ux-layout-report.json (agregado por scripts/aggregate-layout-report.js)
 */

interface ViewportOverflowEntry {
	tag: string;
	text: string;
	selector: string;
	rect: { top: number; left: number; right: number; bottom: number; width: number; height: number };
	overflowPx: number;
	viewportWidth: number;
}

interface WrappedGapEntry {
	containerTag: string;
	containerSelector: string;
	lineCount: number;
	minRowGap: number;
	sampleChildren: { tag: string; text: string }[];
}

interface RouteResult {
	route: string;
	path: string;
	viewport: string;
	viewportOverflows: ViewportOverflowEntry[];
	wrappedNoGap: WrappedGapEntry[];
}

const REPORT_DIR = path.resolve(__dirname, ".layout-results");
const REPORT_FILE = path.resolve(__dirname, "ux-layout-report.json");

if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

const PUBLIC_ROUTES = [
	{ path: "/", name: "landing" },
	{ path: "/plans", name: "plans" },
	{ path: "/faq", name: "faq" },
	{ path: "/login", name: "login" },
	{ path: "/register", name: "register" },
];

const AUTH_ROUTES = [
	{ path: "/dashboard/default", name: "dashboard" },
	{ path: "/apps/calendar", name: "calendar" },
	{ path: "/apps/folders/list", name: "folders" },
	{ path: "/apps/profiles/user/personal", name: "profile-personal" },
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

async function analyzeLayout(page: Page): Promise<{ viewportOverflows: ViewportOverflowEntry[]; wrappedNoGap: WrappedGapEntry[] }> {
	return await page.evaluate(() => {
		const viewportWidth = window.innerWidth;

		// ── Detection 1: elementos cuyo rect se extiende más allá del viewport ──
		const INTERACTIVE = "button, a[role='button'], .MuiButton-root, .MuiChip-root, .MuiFab-root, .MuiIconButton-root";
		const interactiveEls = Array.from(document.querySelectorAll<HTMLElement>(INTERACTIVE));
		const viewportOverflows: ViewportOverflowEntry[] = [];

		for (const el of interactiveEls) {
			const rect = el.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) continue; // hidden/not rendered
			const style = window.getComputedStyle(el);
			if (style.visibility === "hidden" || style.display === "none") continue;
			if (style.position === "fixed" || style.position === "sticky") continue;

			// Ignorar si un ancestor tiene overflow-x: auto/scroll (scroll intencional)
			let intentionalScroll = false;
			let parent: HTMLElement | null = el.parentElement;
			while (parent && parent !== document.body) {
				const pStyle = window.getComputedStyle(parent);
				if (pStyle.overflowX === "auto" || pStyle.overflowX === "scroll") {
					intentionalScroll = true;
					break;
				}
				parent = parent.parentElement;
			}
			if (intentionalScroll) continue;

			if (rect.right > viewportWidth + 2) {
				const text = (el.textContent || "").trim().slice(0, 80);
				viewportOverflows.push({
					tag: el.tagName.toLowerCase(),
					text,
					selector: el.className ? `.${el.className.split(" ")[0]}` : el.tagName.toLowerCase(),
					rect: {
						top: Math.round(rect.top),
						left: Math.round(rect.left),
						right: Math.round(rect.right),
						bottom: Math.round(rect.bottom),
						width: Math.round(rect.width),
						height: Math.round(rect.height),
					},
					overflowPx: Math.round(rect.right - viewportWidth),
					viewportWidth,
				});
			}
		}

		// ── Detection 2: flex containers con wrap cuyas líneas se tocan sin row-gap ──
		// Excluir MuiGrid-root porque MUI Grid usa margins negativas intencionalmente
		// (gutter pattern). Y excluir contenedores cuya clase NO sugiere layout de chips/buttons.
		const flexContainers = Array.from(document.querySelectorAll<HTMLElement>("*")).filter((el) => {
			const s = window.getComputedStyle(el);
			if (s.display !== "flex" || s.flexWrap !== "wrap") return false;
			// Filtrar MuiGrid (usa negative margins intencionalmente)
			if (el.classList.contains("MuiGrid-root") || el.classList.contains("MuiGrid-container")) return false;
			// Solo analizar si hay al menos 1 elemento interactivo (chip/button) entre los children
			const hasInteractive = Array.from(el.children).some((c) => {
				if (!(c instanceof HTMLElement)) return false;
				return c.matches(".MuiChip-root, .MuiButton-root, .MuiIconButton-root, button, a[role='button']");
			});
			return hasInteractive;
		});
		const wrappedNoGap: WrappedGapEntry[] = [];

		for (const container of flexContainers) {
			const children = Array.from(container.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
			if (children.length < 2) continue;

			// Agrupar children por "línea" (mismo top ± 2px)
			const rects = children.map((c) => ({ el: c, rect: c.getBoundingClientRect() })).filter((x) => x.rect.width > 0 && x.rect.height > 0);
			if (rects.length < 2) continue;

			const lines: { top: number; bottom: number; items: typeof rects }[] = [];
			for (const r of rects) {
				const line = lines.find((l) => Math.abs(l.top - r.rect.top) < 3);
				if (line) {
					line.bottom = Math.max(line.bottom, r.rect.bottom);
					line.items.push(r);
				} else {
					lines.push({ top: r.rect.top, bottom: r.rect.bottom, items: [r] });
				}
			}

			if (lines.length < 2) continue; // solo 1 línea = no está wrappeando

			// Ordenar líneas por top
			lines.sort((a, b) => a.top - b.top);
			let minRowGap = Infinity;
			for (let i = 0; i < lines.length - 1; i++) {
				const gap = lines[i + 1].top - lines[i].bottom;
				minRowGap = Math.min(minRowGap, gap);
			}

			// Si las líneas están separadas por menos de 3px, es bug (sin spacing visual)
			if (minRowGap < 3) {
				wrappedNoGap.push({
					containerTag: container.tagName.toLowerCase(),
					containerSelector: container.className ? `.${container.className.split(" ")[0]}` : container.tagName.toLowerCase(),
					lineCount: lines.length,
					minRowGap: Math.round(minRowGap),
					sampleChildren: rects.slice(0, 4).map((r) => ({
						tag: r.el.tagName.toLowerCase(),
						text: (r.el.textContent || "").trim().slice(0, 40),
					})),
				});
			}
		}

		return { viewportOverflows, wrappedNoGap };
	});
}

function writeEntry(entry: RouteResult) {
	const filename = `${entry.route}-${entry.viewport}.json`;
	fs.writeFileSync(path.join(REPORT_DIR, filename), JSON.stringify(entry, null, 2));
}

test.afterAll(() => {
	try {
		const files = fs.readdirSync(REPORT_DIR).filter((f) => f.endsWith(".json"));
		const data = files.map((f) => JSON.parse(fs.readFileSync(path.join(REPORT_DIR, f), "utf-8")));
		fs.writeFileSync(REPORT_FILE, JSON.stringify(data, null, 2));
	} catch {
		/* aggregate script se encarga si falla */
	}
});

test.describe("Layout detection — rutas públicas", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	for (const route of PUBLIC_ROUTES) {
		for (const vp of VIEWPORTS) {
			test(`${route.name} @ ${vp.name}`, async ({ page }) => {
				await page.setViewportSize({ width: vp.width, height: vp.height });
				let viewportOverflows: ViewportOverflowEntry[] = [];
				let wrappedNoGap: WrappedGapEntry[] = [];
				try {
					await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
					await page.waitForTimeout(2500);
					const result = await analyzeLayout(page);
					viewportOverflows = result.viewportOverflows;
					wrappedNoGap = result.wrappedNoGap;
				} finally {
					writeEntry({ route: route.name, path: route.path, viewport: vp.name, viewportOverflows, wrappedNoGap });
				}
				expect.soft(viewportOverflows, `Viewport overflow en ${route.name} @ ${vp.name}`).toHaveLength(0);
				expect.soft(wrappedNoGap, `Flex wrap sin gap en ${route.name} @ ${vp.name}`).toHaveLength(0);
			});
		}
	}
});

test.describe("Layout detection — rutas autenticadas", () => {
	test.use({ storageState: "tests/.auth/user.json" });

	for (const route of AUTH_ROUTES) {
		for (const vp of VIEWPORTS) {
			test(`${route.name} @ ${vp.name}`, async ({ page }) => {
				await page.setViewportSize({ width: vp.width, height: vp.height });
				let viewportOverflows: ViewportOverflowEntry[] = [];
				let wrappedNoGap: WrappedGapEntry[] = [];
				try {
					await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
					await page.waitForTimeout(2500);
					const result = await analyzeLayout(page);
					viewportOverflows = result.viewportOverflows;
					wrappedNoGap = result.wrappedNoGap;
				} finally {
					writeEntry({ route: route.name, path: route.path, viewport: vp.name, viewportOverflows, wrappedNoGap });
				}
				expect.soft(viewportOverflows, `Viewport overflow en ${route.name} @ ${vp.name}`).toHaveLength(0);
				expect.soft(wrappedNoGap, `Flex wrap sin gap en ${route.name} @ ${vp.name}`).toHaveLength(0);
			});
		}
	}
});
