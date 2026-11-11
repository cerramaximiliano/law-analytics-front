// Radicación de una carpeta: juzgado de origen y ubicación actual (Cámara, Corte).
// Equipos / reparto por juzgado (5/11/2026): el dato viaja en judFolder y no se mostraba.
// Funciones puras, sin React, para el listado, el CSV y los filtros.

/**
 * «Juz. 7 · Sec. 1» a partir del juzgado de origen; vacío si no hay dato. Cuando el «número»
 * es un nombre (MEV/SCBA: «Juzgado Civil y Comercial N° 5 - Lomas de Zamora») va tal cual,
 * sin el prefijo «Juz.» redundante (10/11/2026).
 */
export const radicacionOrigen = (f: any): string => {
	const c = String(f?.judFolder?.courtNumber || "").trim();
	const sec = String(f?.judFolder?.secretaryNumber || "").trim();
	if (!c) return "";
	const juzgado = /^\d+$/.test(c) ? `Juz. ${c}` : c;
	return `${juzgado}${sec ? ` · Sec. ${sec}` : ""}`;
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

/** Conteo por instancia que devuelve el hub (`facets.ubicaciones`): kind + sala (solo en Cámara). */
export interface UbicacionFacet {
	kind: string;
	sala: string;
	count: number;
}

export interface UbicacionOption {
	value: string;
	label: string;
	count: number;
}

const UBICACION_LABEL: Record<string, string> = { camara: "Cámara", corte: "Corte Suprema", juzgado: "Juzgado", otro: "Otra dependencia" };
const UBICACION_ORDER: Record<string, number> = { camara: 1, corte: 2, juzgado: 3, otro: 4 };

/**
 * Opciones del filtro por instancia actual (11/11/2026, pedido de Silvia): Cámara por sala
 * (numérica), Cámara sin sala, Corte, Juzgado, otra. Valor = lo que entiende el hub en `?ubicacion=`.
 */
export const ubicacionOptions = (facets: UbicacionFacet[]): UbicacionOption[] => {
	const salaNum = (s: string) => (/^\d+$/.test(s) ? Number(s) : Number.MAX_SAFE_INTEGER);
	return facets
		.filter((f) => UBICACION_LABEL[f.kind])
		.map((f) => {
			const sala = f.kind === "camara" ? String(f.sala || "").trim() : "";
			return {
				value: sala ? `camara:${sala}` : f.kind,
				label: sala ? `Cámara · Sala ${sala}` : UBICACION_LABEL[f.kind],
				count: f.count,
				_k: UBICACION_ORDER[f.kind],
				_s: sala ? salaNum(sala) : Number.MAX_SAFE_INTEGER,
			};
		})
		.sort((a, b) => a._k - b._k || a._s - b._s || a.label.localeCompare(b.label, "es"))
		.map(({ value, label, count }) => ({ value, label, count }));
};

/** Clave del filtro por juzgado: fuero + número (el mismo número existe en varios fueros). */
export const juzgadoKey = (f: any): string => {
	const c = String(f?.judFolder?.courtNumber || "").trim();
	return c ? `${f?.folderFuero || ""}|${c}` : "";
};

export interface JuzgadoOption {
	value: string;
	label: string;
	count: number;
}

/**
 * Opciones del selector de juzgado a partir de conteos por (fuero, número): valor = `juzgadoKey`,
 * etiqueta «7 · Seguridad Social» (o el nombre recortado cuando el "número" es texto, MEV/SCBA),
 * ordenadas por fuero y número. Las usan el listado (conteo en memoria) y el modal de archivadas
 * (conteo del hub, `facets.juzgados`), 6/11/2026.
 */
export const juzgadoOptions = (entries: { fuero: string; court: string; count: number }[]): JuzgadoOption[] => {
	const num = (v: string) => (/^\d+$/.test(v) ? parseInt(v, 10) : Number.POSITIVE_INFINITY);
	return entries
		.filter((e) => String(e.court || "").trim())
		.map((e) => {
			const fuero = e.fuero || "";
			const court = String(e.court).trim();
			const esNumero = /^\d+$/.test(court);
			const corto = court.length > 44 ? `${court.slice(0, 42)}…` : court;
			const label = esNumero ? (fuero ? `${court} · ${fuero}` : `Juzgado ${court}`) : corto;
			return { value: `${fuero}|${court}`, label, count: e.count, fuero, court };
		})
		.sort((a, b) => a.fuero.localeCompare(b.fuero, "es") || num(a.court) - num(b.court) || a.court.localeCompare(b.court))
		.map(({ value, label, count }) => ({ value, label, count }));
};

/** Conteo por juzgado de una lista de carpetas en memoria, listo para `juzgadoOptions`. */
export const juzgadoCounts = (folders: any[]): { fuero: string; court: string; count: number }[] => {
	const map = new Map<string, { fuero: string; court: string; count: number }>();
	folders.forEach((f) => {
		const k = juzgadoKey(f);
		if (!k) return;
		const cur = map.get(k);
		if (cur) cur.count++;
		else map.set(k, { fuero: f?.folderFuero || "", court: String(f?.judFolder?.courtNumber).trim(), count: 1 });
	});
	return Array.from(map.values());
};
