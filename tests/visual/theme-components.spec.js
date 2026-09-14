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
// Tests enfocados en componentes del tema MUI.
// El objetivo es detectar regresiones en overrides globales como Input, Select, Button, etc.
// Este es el test más importante para detectar el tipo de regresión que ocurrió
// (inputs reduciéndose de tamaño por un cambio en themes/overrides/).
test_1.test.describe("Componentes MUI — inputs y formularios", function () {
	// Usamos la página de login como contexto público rico en form elements
	test_1.test.use({ storageState: { cookies: [], origins: [] } });
	test_1.test.beforeEach(function (_a) {
		var page = _a.page;
		return __awaiter(void 0, void 0, void 0, function () {
			return __generator(this, function (_b) {
				switch (_b.label) {
					case 0:
						return [4 /*yield*/, page.goto("/auth/login")];
					case 1:
						_b.sent();
						return [4 /*yield*/, (0, test_1.expect)(page.locator("#email-login")).toBeVisible()];
					case 2:
						_b.sent();
						return [2 /*return*/];
				}
			});
		});
	});
	(0, test_1.test)("OutlinedInput — altura y padding", function (_a) {
		var page = _a.page;
		return __awaiter(void 0, void 0, void 0, function () {
			var input;
			return __generator(this, function (_b) {
				switch (_b.label) {
					case 0:
						input = page.locator(".MuiOutlinedInput-root").first();
						return [4 /*yield*/, (0, test_1.expect)(input).toHaveScreenshot("mui-outlined-input.png")];
					case 1:
						_b.sent();
						return [2 /*return*/];
				}
			});
		});
	});
	(0, test_1.test)("InputLabel — tamaño y posición", function (_a) {
		var page = _a.page;
		return __awaiter(void 0, void 0, void 0, function () {
			var label;
			return __generator(this, function (_b) {
				switch (_b.label) {
					case 0:
						label = page.locator(".MuiInputLabel-root").first();
						return [4 /*yield*/, (0, test_1.expect)(label).toHaveScreenshot("mui-input-label.png")];
					case 1:
						_b.sent();
						return [2 /*return*/];
				}
			});
		});
	});
	(0, test_1.test)("Button contained — tamaño y estilo", function (_a) {
		var page = _a.page;
		return __awaiter(void 0, void 0, void 0, function () {
			var btn;
			return __generator(this, function (_b) {
				switch (_b.label) {
					case 0:
						btn = page.locator(".MuiButton-contained").first();
						return [4 /*yield*/, (0, test_1.expect)(btn).toHaveScreenshot("mui-button-contained.png")];
					case 1:
						_b.sent();
						return [2 /*return*/];
				}
			});
		});
	});
});
test_1.test.describe("Componentes MUI — páginas autenticadas", function () {
	test_1.test.beforeEach(function (_a) {
		var page = _a.page;
		return __awaiter(void 0, void 0, void 0, function () {
			return __generator(this, function (_b) {
				switch (_b.label) {
					case 0:
						return [4 /*yield*/, page.goto("/documentos/escritos")];
					case 1:
						_b.sent();
						return [4 /*yield*/, page.waitForLoadState("networkidle")];
					case 2:
						_b.sent();
						return [2 /*return*/];
				}
			});
		});
	});
	(0, test_1.test)("Select — tamaño y estilo", function (_a) {
		var page = _a.page;
		return __awaiter(void 0, void 0, void 0, function () {
			var select;
			return __generator(this, function (_b) {
				switch (_b.label) {
					case 0:
						select = page.locator(".MuiSelect-root").first();
						return [4 /*yield*/, select.isVisible()];
					case 1:
						if (!_b.sent()) return [3 /*break*/, 3];
						return [4 /*yield*/, (0, test_1.expect)(select).toHaveScreenshot("mui-select.png")];
					case 2:
						_b.sent();
						_b.label = 3;
					case 3:
						return [2 /*return*/];
				}
			});
		});
	});
	(0, test_1.test)("inputs en la página de escritos", function (_a) {
		var page = _a.page;
		return __awaiter(void 0, void 0, void 0, function () {
			var inputs, count;
			return __generator(this, function (_b) {
				switch (_b.label) {
					case 0:
						inputs = page.locator(".MuiOutlinedInput-root");
						return [4 /*yield*/, inputs.count()];
					case 1:
						count = _b.sent();
						if (!(count > 0)) return [3 /*break*/, 3];
						return [4 /*yield*/, (0, test_1.expect)(inputs.first()).toHaveScreenshot("escritos-input-first.png")];
					case 2:
						_b.sent();
						_b.label = 3;
					case 3:
						return [2 /*return*/];
				}
			});
		});
	});
});
