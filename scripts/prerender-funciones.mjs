// Pre-renderizado de /funciones (2026-10-23). Correr DESPUÉS de `vite build`:
//   node scripts/prerender-funciones.mjs [dirDelBuild]   (por defecto build/)
//
// Compila src/prerender/funciones.tsx para Node, dibuja el encabezado y escribe
// <dir>/funciones.html: el index.html del build con ese HTML en <div id="prerender">
// antes de #root. nginx lo sirve en /funciones exacto; la página lo quita al montar.
// Con ?jur= (variantes del interior) un script en línea lo quita antes del primer
// dibujado y la página se ve como antes; sin ?jur=, el mismo script hace que los
// botones respondan mientras carga React. Si algo falla, no escribe nada y /funciones
// sigue saliendo del index.html de siempre.

import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

const outDir = resolve(process.argv[2] || "build");
const tmp = resolve("node_modules/.prerender");

try {
	await build({
		configFile: false,
		logLevel: "warn",
		mode: "production",
		plugins: [react(), tsconfigPaths()],
		build: {
			ssr: "src/prerender/funciones.tsx",
			outDir: tmp,
			emptyOutDir: true,
			rollupOptions: { output: { format: "esm", entryFileNames: "funciones.mjs" } },
		},
		ssr: { noExternal: true },
	});
	const { render } = await import(pathToFileURL(`${tmp}/funciones.mjs`).href);
	const hero = render();
	if (!hero || hero.length < 1000) throw new Error(`HTML demasiado corto (${hero?.length})`);

	const index = readFileSync(`${outDir}/index.html`, "utf8");

	// Fuente: Inter se declara con font-display: swap. El HTML pre-renderizado se pintaba con la
	// de respaldo y al llegar Inter el texto cambiaba de tamaño: el encabezado saltaba (CLS) y el
	// párrafo de React contaba como un LCP nuevo, más grande. Para el pre-render se declara la
	// misma fuente (mismo archivo, ya precargado: una sola descarga) con font-display: block, así
	// el texto espera a Inter y se pinta una sola vez. La app sigue con su declaración de siempre.
	const inter = index.match(/href="(\/assets\/Inter-roman-latin[^"]+\.woff2)"/);
	let heroFinal = hero;
	if (inter) {
		heroFinal =
			`<style>@font-face{font-family:"Inter pre";font-weight:100 900;font-style:normal;font-display:block;src:url(${inter[1]}) format("woff2")}</style>` +
			hero.replaceAll("font-family:Inter var", 'font-family:"Inter pre",Inter var');
	} else {
		console.warn("⚠ Sin precarga de Inter en index.html: el pre-render usa la fuente de la app (puede saltar al cargar)");
	}
	const ancla = '<div id="root"></div>';
	if (!index.includes(ancla)) throw new Error('index.html sin <div id="root"></div>');
	// Script en línea después del div: con ?jur= lo quita antes del primer dibujado; si no,
	// hace que los dos botones respondan mientras React carga (antes de montar no tienen
	// manejador). "Empezar gratis" lleva al registro con todos los parámetros de la URL (UTM,
	// gclid) para que la atribución se capture allá; "Ver las funciones" baja a la lista.
	const guion =
		"<script>(function(){var p=document.getElementById(\"prerender\");if(!p)return;" +
		// ?jur=: variantes del interior, se ve la página de siempre.
		"if(/[?&]jur=/.test(location.search)){p.remove();return}" +
		// Visible recién con Inter cargada (máx. 3 s): mientras está oculto, el cambio de métricas
		// de la fuente de respaldo a Inter no se ve ni cuenta como CLS.
		"var v=function(){p.style.visibility=\"\"},f=document.fonts;if(f&&f.load){f.load('400 1em \"Inter pre\"').then(v,v);setTimeout(v,3000)}else v();" +
		// Botones mientras carga React: al registro con todos los parámetros, o bajar a la lista.
		"document.addEventListener(\"click\",function c(e){var q,b,h;if(!document.getElementById(\"prerender\")){document.removeEventListener(\"click\",c);return}" +
		"b=e.target.closest&&e.target.closest(\"#prerender button\");if(!b)return;" +
		"if(/Empezar/.test(b.textContent)){q=new URLSearchParams(location.search);if(!q.get(\"source\"))q.set(\"source\",\"funciones\");" +
		"(window.dataLayer=window.dataLayer||[]).push({event:\"cta_click_funciones\",cta_location:\"hero_prerender\",source:q.get(\"source\")});location.href=\"/register?\"+q.toString()}" +
		"else{h=p.querySelector(\"header\");h&&window.scrollTo({top:h.offsetHeight,behavior:\"smooth\"})}})})()</script>";
	const html = index.replace(ancla, `<div id="prerender" style="visibility:hidden">${heroFinal}</div>${guion}${ancla}`);
	writeFileSync(`${outDir}/funciones.html`, html);
	console.log(`✓ funciones.html: ${(hero.length / 1024).toFixed(1)} KB de encabezado pre-renderizado`);
} catch (err) {
	console.error(`✗ Pre-renderizado de /funciones omitido: ${err.message}`);
	process.exitCode = 0; // nunca frena el deploy
} finally {
	rmSync(tmp, { recursive: true, force: true });
}
