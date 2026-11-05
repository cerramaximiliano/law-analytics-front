// Radicación de una carpeta: juzgado de origen y ubicación actual (Cámara, Corte).
// Equipos / reparto por juzgado (5/11/2026): el dato viaja en judFolder y no se mostraba.
// Funciones puras, sin React, para el listado, el CSV y los filtros.

/** «Juz. 7 · Sec. 1» a partir del juzgado de origen; vacío si no hay número. */
export const radicacionOrigen = (f: any): string => {
	const c = String(f?.judFolder?.courtNumber || "").trim();
	const sec = String(f?.judFolder?.secretaryNumber || "").trim();
	if (!c) return "";
	return `Juz. ${c}${sec ? ` · Sec. ${sec}` : ""}`;
};

export type UbicacionKind = "Juzgado" | "Cámara" | "Corte" | "Otro" | "";

/** Dónde está hoy el expediente, según el texto de la dependencia. */
export const ubicacionActual = (f: any): UbicacionKind => {
	const t = String(f?.judFolder?.currentLocation?.text || f?.judFolder?.descriptionJudFolder || "").toUpperCase();
	if (!t) return "";
	if (t.includes("CORTE SUPREMA")) return "Corte";
	if (t.startsWith("CAMARA") || t.startsWith("CÁMARA")) return "Cámara";
	if (t.startsWith("JUZGADO")) return "Juzgado";
	return "Otro";
};

/** Línea secundaria de la columna Radicación: solo cuando la ubicación actual no es el juzgado de origen. */
export const ubicacionDetalle = (f: any): string => {
	const kind = ubicacionActual(f);
	if (kind === "Cámara") {
		const sala = String(f?.judFolder?.salaNumber || "").trim();
		return sala ? `Cámara · Sala ${sala}` : "Cámara";
	}
	if (kind === "Corte") return "Corte Suprema";
	if (kind === "Otro") {
		const t = String(f?.judFolder?.currentLocation?.text || f?.judFolder?.descriptionJudFolder || "");
		return t.length > 42 ? `${t.slice(0, 40)}…` : t;
	}
	return "";
};

/** Clave del filtro por juzgado: fuero + número (el mismo número existe en varios fueros). */
export const juzgadoKey = (f: any): string => {
	const c = String(f?.judFolder?.courtNumber || "").trim();
	return c ? `${f?.folderFuero || ""}|${c}` : "";
};
