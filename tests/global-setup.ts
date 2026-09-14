import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const authFile = path.join(__dirname, ".auth/user.json");

// Leer .env manualmente ya que las variables VITE_* no se inyectan en el contexto Node de Playwright
function readEnvFile(): Record<string, string> {
	const envPath = path.join(__dirname, "../.env");
	if (!fs.existsSync(envPath)) return {};
	return Object.fromEntries(
		fs
			.readFileSync(envPath, "utf-8")
			.split("\n")
			.filter((line) => line.includes("=") && !line.startsWith("#"))
			.map((line) => {
				const [key, ...rest] = line.split("=");
				return [key.trim(), rest.join("=").trim()];
			}),
	);
}

const env = readEnvFile();
const BASE_URL = env.VITE_BASE_URL || "http://localhost:5000";
const EMAIL = env.VITE_DEV_EMAIL || "";
const PASSWORD = env.VITE_DEV_PASSWORD || "";

/**
 * Autenticación via API directa usando page.request (comparte cookies con la página).
 *
 * IMPORTANTE: No usar request.newContext() — ese contexto es aislado y las cookies
 * de la respuesta de login no se comparten con la página. page.request sí lo hace,
 * por lo que el backend puede setear cookies httpOnly que la página enviará al
 * llamar a /api/auth/me durante el init() del AuthProvider.
 */
setup("autenticar usuario", async ({ page }) => {
	// 1. Navegar a cualquier ruta para inicializar el contexto del browser
	//    (necesario para que las cookies del dominio correcto se apliquen)
	await page.goto("/login");

	// 2. Llamar login via page.request — comparte el contexto de cookies con la página
	const loginResponse = await page.request.post(`${BASE_URL}/api/auth/login`, {
		data: { email: EMAIL, password: PASSWORD },
	});

	expect(loginResponse.ok(), `Login API falló con status ${loginResponse.status()}`).toBeTruthy();

	const loginData = await loginResponse.json();
	const token: string = loginData.token;

	expect(token, "La API no devolvió un token").toBeTruthy();

	// 3. Inyectar el token en localStorage ANTES de navegar al dashboard
	await page.evaluate((t) => {
		localStorage.setItem("token", t);
	}, token);

	// 4. Navegar al dashboard — la app llamará /api/auth/me con las cookies
	//    seteadas por el login (compartidas via page.request)
	await page.goto("/dashboard/default");

	// 5. Esperar un selector que solo exista cuando el usuario ESTÁ autenticado
	//    (no la URL, que React Router setea antes del check async de auth)
	await expect(page.getByRole("navigation")).toBeVisible({ timeout: 30_000 });
	await expect(page).toHaveURL(/\/dashboard\//, { timeout: 5_000 });

	// 6. Verificar que el token sigue en localStorage
	const storedToken = await page.evaluate(() => localStorage.getItem("token"));
	// El token puede haber sido migrado a cookies por secureStorage, permitir ambos
	const cookieToken = await page.evaluate(() => document.cookie.includes("auth_token"));
	expect(storedToken || cookieToken, "No hay token ni en localStorage ni en cookies").toBeTruthy();

	// 7. Guardar estado completo (localStorage + cookies) para todos los tests
	await page.context().storageState({ path: authFile });
});
