"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var test_1 = require("@playwright/test");
exports["default"] = (0, test_1.defineConfig)({
    testDir: "./tests/visual",
    snapshotDir: "./tests/snapshots",
    // Falla si hay diferencias visuales mayores al 0.2% de los píxeles
    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.002,
            threshold: 0.2,
            animations: "disabled"
        }
    },
    // No correr tests en paralelo para evitar interferencias visuales
    fullyParallel: false,
    workers: 1,
    // Reintentos para evitar flakiness por animaciones
    retries: 1,
    reporter: [["html", { outputFolder: "tests/playwright-report", open: "never" }], ["line"]],
    use: {
        baseURL: "http://localhost:3000",
        // Viewport fijo para screenshots consistentes
        viewport: { width: 1440, height: 900 },
        // Capturar screenshot solo en fallos
        screenshot: "only-on-failure",
        // Deshabilitar animaciones CSS para snapshots estables
        reducedMotion: "reduce",
        // Ignorar errores HTTPS en local
        ignoreHTTPSErrors: true,
        // Timeout por acción
        actionTimeout: 10000,
        navigationTimeout: 30000
    },
    projects: [
        // Proyecto de setup: hace login y guarda el auth state
        {
            name: "setup",
            testMatch: "**/global-setup.ts"
        },
        // Tests visuales — dependen del setup de auth
        {
            name: "visual",
            use: __assign(__assign({}, test_1.devices["Desktop Chrome"]), { storageState: "tests/.auth/user.json" }),
            dependencies: ["setup"]
        },
        // Tests visuales de páginas públicas (sin auth)
        {
            name: "visual-public",
            use: __assign({}, test_1.devices["Desktop Chrome"])
        },
    ],
    // Inicia el dev server automáticamente si no está corriendo
    webServer: {
        command: "npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60000
    }
});
