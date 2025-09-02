// Optimización de carga de fuentes

export const preloadFonts = () => {
	// Preconectar a Google Fonts
	const preconnect = document.createElement("link");
	preconnect.rel = "preconnect";
	preconnect.href = "https://fonts.googleapis.com";
	document.head.appendChild(preconnect);

	const preconnectGstatic = document.createElement("link");
	preconnectGstatic.rel = "preconnect";
	preconnectGstatic.href = "https://fonts.gstatic.com";
	preconnectGstatic.crossOrigin = "anonymous";
	document.head.appendChild(preconnectGstatic);

	// Precargar fuente crítica
	const preloadFont = document.createElement("link");
	preloadFont.rel = "preload";
	preloadFont.as = "font";
	preloadFont.type = "font/woff2";
	preloadFont.href = "/assets/fonts/inter/Inter-Regular.woff2";
	preloadFont.crossOrigin = "anonymous";
	document.head.appendChild(preloadFont);
};

// Font-display: swap para evitar FOIT
export const fontDisplaySwap = `
	@font-face {
		font-family: 'Inter';
		font-display: swap;
		src: url('/assets/fonts/inter/Inter-Regular.woff2') format('woff2');
	}
`;
