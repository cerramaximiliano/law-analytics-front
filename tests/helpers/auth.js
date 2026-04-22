"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.waitForUnauthorizedModal = exports.interceptAuthMeWith401 = exports.interceptApiWith401 = exports.loginViaModal = exports.loginViaForm = exports.fillLoginForm = exports.API_BASE = exports.CREDENTIALS = void 0;
exports.CREDENTIALS = {
    email: process.env.TEST_EMAIL || "maximilian@rumba-dev.com",
    password: process.env.TEST_PASSWORD || "12345678"
};
exports.API_BASE = "http://localhost:5000";
// ─── Helpers de formulario ────────────────────────────────────────────────────
/**
 * Rellena y envía el formulario de login que YA está visible en pantalla.
 * NO navega — preserva el location.state.from que el AuthGuard haya seteado.
 */
function fillLoginForm(page) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.waitForSelector("#email-login", { state: "visible", timeout: 15000 })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.fill("#email-login", exports.CREDENTIALS.email)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.fill("#password-login", exports.CREDENTIALS.password)];
                case 3:
                    _a.sent();
                    // El botón de la página de login dice "Iniciar sesión"
                    return [4 /*yield*/, page.getByRole("button", { name: "Iniciar sesión", exact: true }).click()];
                case 4:
                    // El botón de la página de login dice "Iniciar sesión"
                    _a.sent();
                    return [4 /*yield*/, page.waitForURL(function (url) { return !url.pathname.includes("/login"); }, { timeout: 20000 })];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.fillLoginForm = fillLoginForm;
/**
 * Navega a /login y hace login desde cero.
 * USAR SOLO cuando queremos partir sin from-state (ej: primer login del test).
 */
function loginViaForm(page) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.goto("/login")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fillLoginForm(page)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.loginViaForm = loginViaForm;
/**
 * Hace login dentro del UnauthorizedModal (botón "Iniciar Sesión").
 * Usa exact:true para no matchear el botón de Google.
 */
function loginViaModal(page) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, waitForUnauthorizedModal(page)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.fill("#email-login", exports.CREDENTIALS.email)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.fill("#password-login", exports.CREDENTIALS.password)];
                case 3:
                    _a.sent();
                    // exact:true distingue "Iniciar Sesión" de "Google Iniciar sesión con"
                    return [4 /*yield*/, page.getByRole("dialog").getByRole("button", { name: "Iniciar Sesión", exact: true }).click()];
                case 4:
                    // exact:true distingue "Iniciar Sesión" de "Google Iniciar sesión con"
                    _a.sent();
                    // Esperar que el modal desaparezca
                    return [4 /*yield*/, page.waitForSelector("text=Sesión Expirada", { state: "hidden", timeout: 15000 })];
                case 5:
                    // Esperar que el modal desaparezca
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.loginViaModal = loginViaModal;
// ─── Interceptors de red ──────────────────────────────────────────────────────
/**
 * Intercepta TODOS los endpoints de la API excepto los de auth,
 * devolviendo 401. Simula que el token de sesión expiró en el servidor.
 * Retorna una función para quitar el intercept.
 */
function interceptApiWith401(page) {
    return __awaiter(this, void 0, void 0, function () {
        var AUTH_PATHS;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    AUTH_PATHS = [
                        "/api/auth/login",
                        "/api/auth/google",
                        "/api/auth/logout",
                        "/api/auth/me",
                    ];
                    return [4 /*yield*/, page.route("".concat(exports.API_BASE, "/api/**"), function (route) { return __awaiter(_this, void 0, void 0, function () {
                            var url, isAuthEndpoint;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        url = route.request().url();
                                        isAuthEndpoint = AUTH_PATHS.some(function (p) { return url.includes(p); });
                                        if (!isAuthEndpoint) return [3 /*break*/, 2];
                                        return [4 /*yield*/, route["continue"]()];
                                    case 1:
                                        _a.sent();
                                        return [3 /*break*/, 4];
                                    case 2: return [4 /*yield*/, route.fulfill({
                                            status: 401,
                                            contentType: "application/json",
                                            body: JSON.stringify({ message: "Sesión expirada", success: false })
                                        })];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, page.unroute("".concat(exports.API_BASE, "/api/**"))];
                        }); }); }];
            }
        });
    });
}
exports.interceptApiWith401 = interceptApiWith401;
/**
 * Intercepta SOLO /api/auth/me para devolver 401.
 * Simula que el usuario recarga la página con cookie expirada:
 * init() falla → LOGOUT → AuthGuard redirige a /login con from=ruta_original.
 */
function interceptAuthMeWith401(page) {
    return __awaiter(this, void 0, void 0, function () {
        var target;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    target = "".concat(exports.API_BASE, "/api/auth/me");
                    return [4 /*yield*/, page.route(target, function (route) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, route.fulfill({
                                            status: 401,
                                            contentType: "application/json",
                                            body: JSON.stringify({ message: "Token expirado", success: false })
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, page.unroute(target)];
                        }); }); }];
            }
        });
    });
}
exports.interceptAuthMeWith401 = interceptAuthMeWith401;
// ─── Helpers de espera ────────────────────────────────────────────────────────
function waitForUnauthorizedModal(page) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.waitForSelector("text=Sesión Expirada", { state: "visible", timeout: 15000 })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.waitForUnauthorizedModal = waitForUnauthorizedModal;
