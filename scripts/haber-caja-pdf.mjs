#!/usr/bin/env node
/**
 * Planilla PDF del haber de caja sin pasar por la app: compila `src/components/calculator/HaberCajaPDF.tsx` con esbuild y
 * la renderiza en node con @react-pdf/renderer.
 *
 *   node scripts/haber-caja-pdf.mjs <entrada.json> <resultado.json> <salida.pdf> [--titular="..."] [--programa=ansesPrpa]
 *
 * - entrada.json: el contrato de `calcularHaberCaja` (fixture de law-analytics-server/tests/previsional/fixtures-hc/...).
 *   Si trae `esperado`, se imprime como columna "Impreso" con la diferencia.
 * - resultado.json: la salida de `node scripts/previsional/haberCajaDesdePrpa.js <entrada> --programa=<p> --json` del hub
 *   ({ <programa>: salida }); se toma el perfil de `--programa` o el primero.
 */
import { build } from "esbuild";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const [rutaEntrada, rutaResultado, rutaSalida] = args.filter((a) => !a.startsWith("--"));
const opt = (k) => (args.find((a) => a.startsWith(`--${k}=`)) || "").slice(k.length + 3) || null;
if (!rutaEntrada || !rutaResultado || !rutaSalida) {
	console.error("Uso: node scripts/haber-caja-pdf.mjs <entrada.json> <resultado.json> <salida.pdf> [--titular=...] [--programa=...]");
	process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hc-pdf-"));
const entry = path.join(tmp, "entry.jsx");
fs.writeFileSync(
	entry,
	`import React from "react";
import { renderToFile } from "@react-pdf/renderer";
import HaberCajaPDF from "components/calculator/HaberCajaPDF";
export const render = (props, salida) => renderToFile(React.createElement(HaberCajaPDF, props), salida);
`,
);
const bundle = path.join(tmp, "bundle.mjs");
await build({
	entryPoints: [entry],
	bundle: true,
	platform: "node",
	format: "esm",
	outfile: bundle,
	jsx: "automatic",
	loader: { ".png": "dataurl", ".tsx": "tsx", ".ts": "ts" },
	nodePaths: [path.join(raiz, "src"), path.join(raiz, "node_modules")],
	external: ["@react-pdf/renderer", "react"],
	logLevel: "error",
});
// los externos se resuelven desde el node_modules del front
fs.symlinkSync(path.join(raiz, "node_modules"), path.join(tmp, "node_modules"));

const { esperado, ...entrada } = JSON.parse(fs.readFileSync(rutaEntrada, "utf8"));
const salidas = JSON.parse(fs.readFileSync(rutaResultado, "utf8"));
const resultado = salidas[opt("programa") || Object.keys(salidas)[0]];
const hoy = new Date();
const emitido = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`;
const { render } = await import(pathToFileURL(bundle).href);
await render(
	{
		entrada,
		resultado,
		datos: { titular: opt("titular"), emitido },
		impreso: esperado ? { fuente: "constancia de ANSES", ...esperado } : null,
	},
	path.resolve(rutaSalida),
);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`PDF: ${path.resolve(rutaSalida)}`);
