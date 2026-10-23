// Entrada de servidor del pre-renderizado de /funciones (2026-10-23).
//
// La usa scripts/prerender-funciones.mjs después del build: dibuja el encabezado con los
// mismos componentes y el mismo tema que la app, con un cache de Emotion propio (clave
// "pre"; en el servidor StyledEngineProvider no arma el suyo) para que el cliente no tome
// ni pise esos estilos: van en línea dentro del div y se van con él. El HTML va a build/funciones.html
// dentro de <div id="prerender">, que la página quita al montar (pages/funciones.tsx).
// Motivo: el LCP de /funciones era un párrafo que esperaba 4,1 s al JavaScript
// (la-ads/analysis/2026-10-23-primera-causa-medicion-y-siguiente-iteracion.md §10).

import { renderToString } from "react-dom/server";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

import ThemeCustomization from "themes";
import { ThemeMode } from "types/config";
import FuncionesHero from "sections/funciones/FuncionesHero";

const noop = () => {};

export function render(): string {
	const cache = createCache({ key: "pre" });
	return renderToString(
		<CacheProvider value={cache}>
			<ThemeCustomization forceMode={ThemeMode.LIGHT}>
				<FuncionesHero onEmpezar={noop} onVerFunciones={noop} />
			</ThemeCustomization>
		</CacheProvider>,
	);
}
