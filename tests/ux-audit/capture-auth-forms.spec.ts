import { test } from "@playwright/test";
import fs from "fs";
import path from "path";
import { VIEWPORTS } from "./routes";

/**
 * Capturas complementarias para rutas del flujo de recuperación que dependen de
 * state efímero (location.state / sessionStorage). Sin state válido, los
 * componentes muestran la pantalla de fallback (RS1 / CV1). Este spec inyecta
 * state mínimo vía sessionStorage para capturar el form real — útil para el
 * compare visual.
 */

const REPORT_DIR = process.env.UX_AUDIT_DIR ?? path.resolve(__dirname, "../../ux-reports/current-public");
const SCREENSHOT_DIR = path.join(REPORT_DIR, "screenshots");

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

interface FormVariantRoute {
	name: string;
	path: string;
}

const FORM_VARIANT_ROUTES: FormVariantRoute[] = [
	{ name: "reset-password-form", path: "/reset-password" },
	{ name: "code-verification-form", path: "/code-verification" },
];

const MOCK_STATE = {
	email: "usuario@lawanalytics.app",
	code: "123456",
	verified: true,
	in_progress: true,
};

for (const route of FORM_VARIANT_ROUTES) {
	for (const vp of VIEWPORTS) {
		test(`${route.name} — ${vp.name}`, async ({ page }) => {
			await page.setViewportSize({ width: vp.width, height: vp.height });

			// Inyectar state ANTES de la primera navegación a una ruta protegida.
			// Usamos una ruta neutral para inicializar el contexto de origin.
			await page.goto("/login", { waitUntil: "domcontentloaded" });
			await page.evaluate((state) => {
				sessionStorage.setItem("reset_email", JSON.stringify(state.email));
				sessionStorage.setItem("reset_code", JSON.stringify(state.code));
				sessionStorage.setItem("reset_verified", JSON.stringify(state.verified));
				sessionStorage.setItem("reset_in_progress", JSON.stringify(state.in_progress));
			}, MOCK_STATE);

			await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
			await page.waitForTimeout(3500);

			const filename = path.join(SCREENSHOT_DIR, `${route.name}-${vp.name}.png`);
			await page.screenshot({ path: filename, fullPage: true, animations: "disabled", timeout: 30_000 });
		});
	}
}
