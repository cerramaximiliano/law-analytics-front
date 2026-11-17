// Colores que un estudio puede elegir para sus etiquetas y categorías de anotación.
// Lista cerrada (espejo de PALETA en law-analytics-server/services/seguimientoService.js): cada
// color tiene definido cómo se ve en modo claro y en modo oscuro, en lugar de adivinarlo.
// Un color guardado antes que no esté en la lista se sigue mostrando, pero no se puede volver a elegir.

export interface ColorPaleta {
	nombre: string;
	hex: string; // lo que se guarda y se ve en modo claro
	oscuro: string; // cómo se dibuja en modo oscuro
}

export const PALETA: ColorPaleta[] = [
	{ nombre: "Negro", hex: "#1b2533", oscuro: "#dfe4ec" },
	{ nombre: "Gris", hex: "#8a94a6", oscuro: "#aab2c0" },
	{ nombre: "Rojo", hex: "#d32f2f", oscuro: "#ef5350" },
	{ nombre: "Naranja", hex: "#ef6c00", oscuro: "#ffa726" },
	{ nombre: "Ámbar", hex: "#c98a00", oscuro: "#ffca28" },
	{ nombre: "Verde", hex: "#2e7d32", oscuro: "#66bb6a" },
	{ nombre: "Turquesa", hex: "#00838f", oscuro: "#4dd0e1" },
	{ nombre: "Azul", hex: "#1565c0", oscuro: "#64b5f6" },
	{ nombre: "Violeta", hex: "#6a1b9a", oscuro: "#ba68c8" },
	{ nombre: "Rosa", hex: "#c2185b", oscuro: "#f06292" },
];

export const luminancia = (hex: string) => {
	const n = parseInt(hex.slice(1), 16);
	const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** El color con que se dibuja en el tema actual. Fuera de la paleta: un oscuro pasa a gris claro en modo oscuro. */
export const colorVisible = (hex: string, isDark: boolean) => {
	if (!isDark) return hex;
	const enPaleta = PALETA.find((c) => c.hex === String(hex).toLowerCase());
	if (enPaleta) return enPaleta.oscuro;
	return luminancia(hex) < 0.3 ? "#dfe4ec" : hex;
};

/** Color del texto que va encima de un relleno de ese color. */
export const textoSobre = (hex: string) => (luminancia(hex) > 0.6 ? "#1b2533" : "#ffffff");
