#!/usr/bin/env node
/**
 * Agrega los archivos individuales de `tests/.overflow-results/` en un reporte
 * consolidado `tests/ux-overflow-report.json` e imprime un resumen.
 *
 * Se corre automáticamente como parte de `npm run test:ux-overflow`.
 */
const fs = require("fs");
const path = require("path");

const REPORT_DIR = path.resolve(__dirname, "..", "tests", ".overflow-results");
const REPORT_FILE = path.resolve(__dirname, "..", "tests", "ux-overflow-report.json");

if (!fs.existsSync(REPORT_DIR)) {
	console.log("No se encontró tests/.overflow-results/ — el test no se ejecutó completamente.");
	process.exit(0);
}

const files = fs.readdirSync(REPORT_DIR).filter((f) => f.endsWith(".json"));
const data = files.map((f) => JSON.parse(fs.readFileSync(path.join(REPORT_DIR, f), "utf-8")));
fs.writeFileSync(REPORT_FILE, JSON.stringify(data, null, 2));

const bugs = data.filter((r) => r.overflowing.length > 0);
const ellipsis = data.filter((r) => r.ellipsisButTruncated.length > 0);

console.log(`\n📊 Reporte de overflow — ${data.length} rutas × viewports analizados`);
console.log(`   Guardado en: ${path.relative(process.cwd(), REPORT_FILE)}\n`);

if (bugs.length === 0) {
	console.log("✅ Sin overflow no intencional detectado");
} else {
	console.log(`⚠️  ${bugs.length} combinaciones con overflow:\n`);
	for (const r of bugs) {
		console.log(`  ${r.route} @ ${r.viewport} (${r.path})`);
		for (const el of r.overflowing) {
			console.log(`    [${el.tag}] "${el.text.slice(0, 60)}" +${el.overflow}px`);
		}
		console.log();
	}
}

if (ellipsis.length > 0) {
	console.log(`\nℹ️  ${ellipsis.length} combinaciones con text-overflow: ellipsis (probablemente intencional).`);
}

process.exit(bugs.length > 0 ? 1 : 0);
