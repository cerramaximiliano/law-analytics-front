// Radicación de una carpeta (juzgado de origen y Sala de Cámara) y ubicación actual (dónde está hoy y qué instancia es).
// Equipos / reparto por juzgado (5/11/2026): el dato viaja en judFolder y no se mostraba.
// Funciones puras, sin React, para el listado, el CSV y los filtros.

const salaDe = (f: any): string => String(f?.judFolder?.salaNumber || "").trim();

/**
 * Radicación en primera instancia: «Juz. 7 · Sec. 1» a partir del juzgado de origen. Cuando el «número» es un nombre
 * (MEV/SCBA: «Juzgado Civil y Comercial N° 5 - Lomas de Zamora») va tal cual, sin el prefijo «Juz.» redundante
 * (10/11/2026). Sin juzgado pero con Sala (recurso directo, que empieza en la Cámara): la Sala va en esta línea.
 */
export const radicacionOrigen = (f: any): string => {
	const c = String(f?.judFolder?.courtNumber || "").trim();
	const sec = String(f?.judFolder?.secretaryNumber || "").trim();
	if (!c) return salaDe(f) ? `Cámara · Sala ${salaDe(f)}` : "";
	const juzgado = /^\d+$/.test(c) ? `Juz. ${c}` : c;
	return `${juzgado}${sec ? ` · Sec. ${sec}` : ""}`;
};

/**
 * Radicación en segunda instancia: la Sala de la Cámara que intervino («Cámara · Sala 3»). Es un dato de la
 * radicación, no de dónde está hoy: se conserva aunque la causa haya vuelto al juzgado. Nunca la Corte (13/11/2026).
 * Vacía si no hubo Sala o si ya ocupa la primera línea (sin juzgado).
 */
export const radicacionSegunda = (f: any): string => {
	const c = String(f?.judFolder?.courtNumber || "").trim();
	return c && salaDe(f) ? `Cámara · Sala ${salaDe(f)}` : "";
};

export type UbicacionKind = "Juzgado" | "Cámara" | "Corte" | "Tribunal oral" | "Archivo" | "Otro" | "";

// Empiezan con el nombre de la cámara y son de primera instancia: sus mesas de entradas de primera instancia y el
// archivo de un juzgado listado bajo la cámara. Misma excepción que el hub (`services/folderUbicacion.js`).
const PRIMERA_INSTANCIA_EN_CAMARA = /^C[AÁ]MARA\b.*(\b(1RA|1ERA|PRIMERA)\.?\s+INSTANCIA\b|\s-\s+JUZGADO\b)/;
// El Archivo General del Poder Judicial depende de la Corte, pero una causa archivada ahí no está ante la Corte; tampoco
// en Jurisprudencia, la Ujiería o el Cuerpo Médico Forense (13/11/2026). Mismas reglas que el hub y el worker.
const ARCHIVO_GENERAL = /\bARCHIVO (GENERAL|CENTRAL)\b/;
const CORTE_OFICINA = /CORTE SUPREMA.*\b(JURISPRUDENCIA|UJIER[IÍ]A|CUERPO M[EÉ]DICO FORENSE|BIBLIOTECA|ESTAD[IÍ]STICA)\b/;

const KIND_DE_INSTANCIA: Record<string, UbicacionKind> = {
	juzgado: "Juzgado",
	camara: "Cámara",
	corte: "Corte",
	"tribunal-oral": "Tribunal oral",
	archivo: "Archivo",
	otro: "Otro",
};

/** Texto de la dependencia donde está hoy el expediente. */
export const ubicacionTexto = (f: any): string =>
	String(f?.judFolder?.currentLocation?.text || f?.judFolder?.descriptionJudFolder || "").trim();

/**
 * Dónde está hoy el expediente. Manda `currentLocation.instancia` (la escribe el worker de Mis Causas con el catálogo
 * de oficinas); sin ella (carpetas viejas, otras jurisdicciones), el texto de la dependencia.
 */
export const ubicacionActual = (f: any): UbicacionKind => {
	const inst = KIND_DE_INSTANCIA[String(f?.judFolder?.currentLocation?.instancia || "")];
	if (inst) return inst;
	const t = ubicacionTexto(f).toUpperCase();
	if (!t) return "";
	if (ARCHIVO_GENERAL.test(t)) return "Archivo";
	if (CORTE_OFICINA.test(t)) return "Otro";
	if (t.includes("CORTE SUPREMA")) return "Corte";
	if (PRIMERA_INSTANCIA_EN_CAMARA.test(t)) return "Juzgado";
	if (t.startsWith("CAMARA") || t.startsWith("CÁMARA")) return "Cámara";
	if (t.startsWith("JUZGADO")) return "Juzgado";
	if (t.startsWith("TRIBUNAL ORAL")) return "Tribunal oral";
	return "Otro";
};

/**
 * Primera línea de «Ubicación actual»: la instancia procesal. Con el grado del worker (PJN): «1ª instancia»,
 * «2ª instancia», «Recurso directo · 1ª instancia» (empezó en la Cámara), «Cámara» si el grado no se pudo determinar.
 * Sin grado (otras jurisdicciones, carpetas viejas): el tipo de dependencia.
 */
export const ubicacionInstancia = (f: any): string => {
	const kind = ubicacionActual(f);
	const cl = f?.judFolder?.currentLocation || {};
	if (kind === "Corte") return "Corte Suprema";
	if (kind === "Archivo") return "Archivo General";
	if (kind === "Tribunal oral") return "Tribunal Oral";
	if (kind === "Otro") return "Otra dependencia";
	if (kind === "Juzgado") return cl.grado === "primera" ? "1ª instancia" : "Juzgado";
	if (kind === "Cámara") {
		if (cl.recursoDirecto) return "Recurso directo · 1ª instancia";
		if (cl.grado === "segunda") return "2ª instancia";
		return "Cámara";
	}
	return "";
};

/** Exportación: «2ª instancia · CAMARA FEDERAL … SALA 3». */
export const ubicacionResumen = (f: any): string => [ubicacionInstancia(f), ubicacionTexto(f)].filter(Boolean).join(" · ");

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

// Mismas palabras que la columna «Ubicación actual» (13/11/2026): el filtro es dónde está hoy, no por dónde pasó.
const UBICACION_LABEL: Record<string, string> = {
	juzgado: "1ª instancia (Juzgado)",
	camara: "2ª instancia (Cámara)",
	corte: "Corte Suprema",
	"tribunal-oral": "Tribunal Oral",
	archivo: "Archivo General",
	otro: "Otra dependencia",
};
const UBICACION_ORDER: Record<string, number> = { juzgado: 1, camara: 2, corte: 3, "tribunal-oral": 4, archivo: 5, otro: 6 };

/**
 * Opciones del filtro «Ubicación actual» de las archivadas (11/11/2026; 13/11/2026 sin partir por sala: la sala es de
 * la radicación y va en `radicacionOptions`). Valor = lo que entiende el hub en `?ubicacion=`. Si el hub viejo todavía
 * manda salas, se suman en una sola Cámara.
 */
export const ubicacionOptions = (facets: UbicacionFacet[]): UbicacionOption[] => {
	const porKind = new Map<string, number>();
	facets.filter((f) => UBICACION_LABEL[f.kind]).forEach((f) => porKind.set(f.kind, (porKind.get(f.kind) || 0) + f.count));
	return Array.from(porKind.entries())
		.sort((a, b) => UBICACION_ORDER[a[0]] - UBICACION_ORDER[b[0]])
		.map(([kind, count]) => ({ value: kind, label: UBICACION_LABEL[kind], count }));
};

export interface RadicacionOption {
	/** `j:<fuero>|<número>` (juzgado) o `s:<fuero>|<sala>` (sala de Cámara). */
	value: string;
	label: string;
	count: number;
	grupo: "juzgado" | "sala";
}

/**
 * Opciones del filtro «Radicación» de las archivadas (13/11/2026): juzgados y salas de Cámara por las que pasó la
 * causa, con el conteo del hub (`facets.juzgados` y `facets.salas`). Una causa del Juzgado 29 que pasó por la Sala D
 * está en las dos opciones. Juzgados por fuero y número; salas numéricas primero, después las de letra.
 */
export const radicacionOptions = (
	juzgados: { fuero: string; court: string; count: number }[],
	salas: { fuero: string; sala: string; count: number }[],
): RadicacionOption[] => {
	const num = (v: string) => (/^\d+$/.test(v) ? parseInt(v, 10) : Number.POSITIVE_INFINITY);
	const conFuero = (base: string, fuero: string) => (fuero ? `${base} · ${fuero}` : base);
	const js = juzgadoOptions(juzgados).map((o) => {
		const [fuero, court] = [o.value.slice(0, o.value.indexOf("|")), o.value.slice(o.value.indexOf("|") + 1)];
		const label = /^\d+$/.test(court) ? conFuero(`Juzgado ${court}`, fuero) : o.label;
		return { value: `j:${o.value}`, label, count: o.count, grupo: "juzgado" as const };
	});
	const ss = salas
		.filter((s) => String(s.sala || "").trim())
		.map((s) => ({ ...s, sala: String(s.sala).trim(), fuero: s.fuero || "" }))
		.sort((a, b) => a.fuero.localeCompare(b.fuero, "es") || num(a.sala) - num(b.sala) || a.sala.localeCompare(b.sala, "es"))
		.map((s) => ({ value: `s:${s.fuero}|${s.sala}`, label: conFuero(`Sala ${s.sala}`, s.fuero), count: s.count, grupo: "sala" as const }));
	return [...js, ...ss];
};

/** Parámetros del hub para un valor de `radicacionOptions` (`juzgado` o `sala`). */
export const radicacionParams = (value: string): { juzgado: string; sala: string } => ({
	juzgado: value.startsWith("j:") ? value.slice(2) : "",
	sala: value.startsWith("s:") ? value.slice(2) : "",
});

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
