import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { PUBLIC_ROUTES } from "./routes-public";
import { VIEWPORTS } from "./routes";

const REPORT_DIR = process.env.UX_AUDIT_DIR ?? path.resolve(__dirname, "../../ux-reports/current-public");
const SCREENSHOT_DIR = path.join(REPORT_DIR, "screenshots");
const FAILURES_LOG = path.join(REPORT_DIR, "capture-failures.json");

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function logFailure(route: string, viewport: string, error: string) {
	let failures: unknown[] = [];
	if (fs.existsSync(FAILURES_LOG)) {
		try {
			failures = JSON.parse(fs.readFileSync(FAILURES_LOG, "utf-8"));
		} catch {
			failures = [];
		}
	}
	failures.push({ route, viewport, error, ts: new Date().toISOString() });
	fs.writeFileSync(FAILURES_LOG, JSON.stringify(failures, null, 2));
}

for (const route of PUBLIC_ROUTES) {
	for (const vp of VIEWPORTS) {
		test(`${route.name} — ${vp.name}`, async ({ page }) => {
			try {
				await page.setViewportSize({ width: vp.width, height: vp.height });
				await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
				await page.waitForTimeout(3500);
				const filename = path.join(SCREENSHOT_DIR, `${route.name}-${vp.name}.png`);
				await page.screenshot({ path: filename, fullPage: true, animations: "disabled", timeout: 30_000 });
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				logFailure(route.name, vp.name, message);
			}
		});
	}
}
