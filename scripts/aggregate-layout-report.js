#!/usr/bin/env node
/**
 * Agrega los archivos individuales de `tests/.layout-results/` en un reporte
 * consolidado `tests/ux-layout-report.json` e imprime un resumen.
 *
 * Se corre automáticamente como parte de `npm run test:ux-layout`.
 */
const fs = require("fs");
const path = require("path");

const REPORT_DIR = path.resolve(__dirname, "..", "tests", ".layout-results");
const REPORT_FILE = path.resolve(__dirname, "..", "tests", "ux-layout-report.json");

if (!fs.existsSync(REPORT_DIR)) {
	console.log("No se encontró tests/.layout-results/ — el test no se ejecutó completamente.");
	process.exit(0);
}

const files = fs.readdirSync(REPORT_DIR).filter((f) => f.endsWith(".json"));
const data = files.map((f) => JSON.parse(fs.readFileSync(path.join(REPORT_DIR, f), "utf-8")));
fs.writeFileSync(REPORT_FILE, JSON.stringify(data, null, 2));

const viewportBugs = data.filter((r) => r.viewportOverflows.length > 0);
const wrapBugs = data.filter((r) => r.wrappedNoGap.length > 0);

console.log(`\n📐 Reporte de layout — ${data.length} rutas × viewports analizados`);
console.log(`   Guardado en: ${path.relative(process.cwd(), REPORT_FILE)}\n`);

if (viewportBugs.length === 0) {
	console.log("✅ Sin viewport overflows detectados");
} else {
	console.log(`⚠️  ${viewportBugs.length} combinaciones con elementos fuera del viewport:\n`);
	for (const r of viewportBugs) {
		console.log(`  ${r.route} @ ${r.viewport} (${r.path})`);
		for (const el of r.viewportOverflows) {
			console.log(`    [${el.tag}] "${el.text.slice(0, 60)}" sale +${el.overflowPx}px del viewport (${el.viewportWidth}px)`);
		}
		console.log();
	}
}

if (wrapBugs.length === 0) {
	console.log("✅ Sin flex wrap pegado detectado");
} else {
	console.log(`\n⚠️  ${wrapBugs.length} combinaciones con flex wrap sin row-gap:\n`);
	for (const r of wrapBugs) {
		console.log(`  ${r.route} @ ${r.viewport} (${r.path})`);
		for (const w of r.wrappedNoGap) {
			const kids = w.sampleChildren.map((c) => `"${c.text.slice(0, 20)}"`).join(", ");
			console.log(`    <${w.containerTag}${w.containerSelector}> — ${w.lineCount} líneas, gap ${w.minRowGap}px · ${kids}`);
		}
		console.log();
	}
}

process.exit(viewportBugs.length + wrapBugs.length > 0 ? 1 : 0);
