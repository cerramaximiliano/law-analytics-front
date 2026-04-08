import { test as setup, expect, request } from "@playwright/test";
import path from "path";
import fs from "fs";

const authFile = path.join(__dirname, "../.auth/user.json");

// Leer .env manualmente ya que las variables VITE_* no se inyectan en el contexto Node de Playwright
function readEnvFile(): Record<string, string> {
	const envPath = path.join(__dirname, "../../.env");
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

// Este setup hace login directamente contra la API, inyecta el token en
// localStorage antes de que la app cargue, y guarda el estado de auth.
// Esto es más confiable que hacer click en el formulario de login.
setup("autenticar usuario", async ({ page }) => {
	// 1. Obtener el token directamente de la API
	const apiContext = await request.newContext();
	const loginResponse = await apiContext.post(`${BASE_URL}/api/auth/login`, {
		data: { email: EMAIL, password: PASSWORD },
	});

	expect(loginResponse.ok(), `Login API falló con status ${loginResponse.status()}`).toBeTruthy();

	const loginData = await loginResponse.json();
	const token: string = loginData.token;

	expect(token, "La API no devolvió un token").toBeTruthy();

	// 2. Inyectar el token en localStorage ANTES de que la app cargue
	// addInitScript corre antes que cualquier script de la página
	await page.addInitScript((t) => {
		localStorage.setItem("token", t);
	}, token);

	// 3. Navegar a la app — la app leerá el token y llamará a /api/auth/me
	await page.goto("/dashboard/default");

	// 4. Esperar a que la app se autentique y muestre el dashboard
	// (el AuthGuard redirige a /login si no está autenticado)
	await page.waitForURL("**/dashboard/**", { timeout: 30_000 });

	// 5. Verificar que el token sigue en localStorage
	const storedToken = await page.evaluate(() => localStorage.getItem("token"));
	expect(storedToken, "El token no está en localStorage").toBeTruthy();

	// 6. Guardar estado completo (localStorage + cookies) para todos los tests
	await page.context().storageState({ path: authFile });

	await apiContext.dispose();
});
