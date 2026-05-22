"use strict";
var __awaiter =
	(this && this.__awaiter) ||
	function (thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P
				? value
				: new P(function (resolve) {
						resolve(value);
				  });
		}
		return new (P || (P = Promise))(function (resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
var __generator =
	(this && this.__generator) ||
	function (thisArg, body) {
		var _ = {
				label: 0,
				sent: function () {
					if (t[0] & 1) throw t[1];
					return t[1];
				},
				trys: [],
				ops: [],
			},
			f,
			y,
			t,
			g;
		return (
			(g = { next: verb(0), throw: verb(1), return: verb(2) }),
			typeof Symbol === "function" &&
				(g[Symbol.iterator] = function () {
					return this;
				}),
			g
		);
		function verb(n) {
			return function (v) {
				return step([n, v]);
			};
		}
		function step(op) {
			if (f) throw new TypeError("Generator is already executing.");
			while ((g && ((g = 0), op[0] && (_ = 0)), _))
				try {
					if (
						((f = 1),
						y &&
							(t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) &&
							!(t = t.call(y, op[1])).done)
					)
						return t;
					if (((y = 0), t)) op = [op[0] & 2, t.value];
					switch (op[0]) {
						case 0:
						case 1:
							t = op;
							break;
						case 4:
							_.label++;
							return { value: op[1], done: false };
						case 5:
							_.label++;
							y = op[1];
							op = [0];
							continue;
						case 7:
							op = _.ops.pop();
							_.trys.pop();
							continue;
						default:
							if (!((t = _.trys), (t = t.length > 0 && t[t.length - 1])) && (op[0] === 6 || op[0] === 2)) {
								_ = 0;
								continue;
							}
							if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
								_.label = op[1];
								break;
							}
							if (op[0] === 6 && _.label < t[1]) {
								_.label = t[1];
								t = op;
								break;
							}
							if (t && _.label < t[2]) {
								_.label = t[2];
								_.ops.push(op);
								break;
							}
							if (t[2]) _.ops.pop();
							_.trys.pop();
							continue;
					}
					op = body.call(thisArg, _);
				} catch (e) {
					op = [6, e];
					y = 0;
				} finally {
					f = t = 0;
				}
			if (op[0] & 5) throw op[1];
			return { value: op[0] ? op[1] : void 0, done: true };
		}
	};
exports.__esModule = true;
var test_1 = require("@playwright/test");
var path_1 = require("path");
var fs_1 = require("fs");
var authFile = path_1["default"].join(__dirname, "../.auth/user.json");
// Leer .env manualmente ya que las variables VITE_* no se inyectan en el contexto Node de Playwright
function readEnvFile() {
	var envPath = path_1["default"].join(__dirname, "../../.env");
	if (!fs_1["default"].existsSync(envPath)) return {};
	return Object.fromEntries(
		fs_1["default"]
			.readFileSync(envPath, "utf-8")
			.split("\n")
			.filter(function (line) {
				return line.includes("=") && !line.startsWith("#");
			})
			.map(function (line) {
				var _a = line.split("="),
					key = _a[0],
					rest = _a.slice(1);
				return [key.trim(), rest.join("=").trim()];
			}),
	);
}
var env = readEnvFile();
var BASE_URL = env.VITE_BASE_URL || "http://localhost:5000";
var EMAIL = env.VITE_DEV_EMAIL || "";
var PASSWORD = env.VITE_DEV_PASSWORD || "";
/**
 * Autenticación via API directa usando page.request (comparte cookies con la página).
 *
 * IMPORTANTE: No usar request.newContext() — ese contexto es aislado y las cookies
 * de la respuesta de login no se comparten con la página. page.request sí lo hace,
 * por lo que el backend puede setear cookies httpOnly que la página enviará al
 * llamar a /api/auth/me durante el init() del AuthProvider.
 */
(0, test_1.test)("autenticar usuario", function (_a) {
	var page = _a.page;
	return __awaiter(void 0, void 0, void 0, function () {
		var loginResponse, loginData, token, storedToken, cookieToken;
		return __generator(this, function (_b) {
			switch (_b.label) {
				case 0:
					// 1. Navegar a cualquier ruta para inicializar el contexto del browser
					return [4 /*yield*/, page.goto("/login")];
				case 1:
					// 1. Navegar a cualquier ruta para inicializar el contexto del browser
					_b.sent();
					return [
						4 /*yield*/,
						page.request.post("".concat(BASE_URL, "/api/auth/login"), {
							data: { email: EMAIL, password: PASSWORD },
						}),
					];
				case 2:
					loginResponse = _b.sent();
					(0, test_1.expect)(loginResponse.ok(), "Login API fall\u00F3 con status ".concat(loginResponse.status())).toBeTruthy();
					return [4 /*yield*/, loginResponse.json()];
				case 3:
					loginData = _b.sent();
					token = loginData.token;
					(0, test_1.expect)(token, "La API no devolvió un token").toBeTruthy();
					// 3. Inyectar el token en localStorage ANTES de navegar al dashboard
					return [
						4 /*yield*/,
						page.evaluate(function (t) {
							localStorage.setItem("token", t);
						}, token),
					];
				case 4:
					// 3. Inyectar el token en localStorage ANTES de navegar al dashboard
					_b.sent();
					// 4. Navegar al dashboard — la app llamará /api/auth/me con las cookies
					//    seteadas por el login (compartidas via page.request)
					return [4 /*yield*/, page.goto("/dashboard/default")];
				case 5:
					// 4. Navegar al dashboard — la app llamará /api/auth/me con las cookies
					//    seteadas por el login (compartidas via page.request)
					_b.sent();
					// 5. Esperar un selector que solo exista cuando el usuario ESTÁ autenticado
					return [4 /*yield*/, (0, test_1.expect)(page.getByRole("navigation")).toBeVisible({ timeout: 30000 })];
				case 6:
					// 5. Esperar un selector que solo exista cuando el usuario ESTÁ autenticado
					_b.sent();
					return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/\/dashboard\//, { timeout: 5000 })];
				case 7:
					_b.sent();
					return [
						4 /*yield*/,
						page.evaluate(function () {
							return localStorage.getItem("token");
						}),
					];
				case 8:
					storedToken = _b.sent();
					return [
						4 /*yield*/,
						page.evaluate(function () {
							return document.cookie.includes("auth_token");
						}),
					];
				case 9:
					cookieToken = _b.sent();
					(0, test_1.expect)(storedToken || cookieToken, "No hay token ni en localStorage ni en cookies").toBeTruthy();
					// 7. Guardar estado completo (localStorage + cookies) para todos los tests
					return [4 /*yield*/, page.context().storageState({ path: authFile })];
				case 10:
					// 7. Guardar estado completo (localStorage + cookies) para todos los tests
					_b.sent();
					return [2 /*return*/];
			}
		});
	});
});
