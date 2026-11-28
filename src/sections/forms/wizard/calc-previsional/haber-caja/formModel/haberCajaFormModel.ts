// Formulario del haber de caja (Formik): valores, valores iniciales y armado de la entrada del motor.
// Las fechas van en AAAA-MM-DD (campos de fecha) y los períodos se escriben MM/AAAA o AAAA-MM.
import {
	CatalogoHaberCaja,
	Excedente35,
	HaberCajaInput,
	leerImporte,
	monedaDelPeriodo,
	normalizarPeriodo,
	PrestacionHaberCaja,
	ProgramaHaberCaja,
	TiempoAMD,
} from "services/haberCajaService";

export const FORM_ID = "haberCajaForm";
/** Marcador del titular cuando el cálculo está vinculado a una carpeta (mismo que el retroactivo). */
export const CAUSA_VINCULADA = "__CAUSA_VINCULADA__";

export interface TiempoTexto {
	a: string;
	m: string;
	d: string;
}
export type ClaseServicio = "n" | "m" | "p";
export type TramoServicio = "antes" | "despues";

export interface FilaRemuneracionForm {
	id: number;
	periodo: string;
	/** Último mes del renglón, si abarca varios. */
	hasta: string;
	importe: string;
	/** Vacío = automática (la de curso legal del período); con valor, la que corrigió el usuario. */
	moneda: string;
}
export interface FilaAutonomoForm {
	id: number;
	desde: string;
	hasta: string;
	categoria: string;
	/** Visible y deshabilitado: el motor todavía no distingue la moratoria. */
	moratoria: boolean;
}

export interface HaberCajaValues {
	reclamante: string;
	folderId: string;
	folderName: string;
	prestacion: PrestacionHaberCaja;
	anticipada: boolean;
	anticipadaPorcentaje: number | string;
	porcentajePension: number | string;
	programa: ProgramaHaberCaja;
	fad: string;
	cese: string;
	solicitud: string;
	alta: string;
	acuerdo: string;
	/** Visible y deshabilitada: el motor todavía no la usa. */
	inicioPago: string;
	promedioDesde: string;
	promedioHasta: string;
	zonaAustral: boolean;
	reciprocidad: number | string;
	reciprocidadAlcance: "pbu" | "todas";
	servicios: Record<ClaseServicio, Record<TramoServicio, TiempoTexto>>;
	excedente35: "" | Excedente35;
	remuneraciones: FilaRemuneracionForm[];
	autonomos: FilaAutonomoForm[];
	/** Computar la categoría efectivamente aportada (sin la equiparación del Dec. 1361/80). */
	sinEquiparacion: boolean;
	mesActualizacion: "cesacion" | "acuerdo";
	topeArt9: boolean;
	topeArt14: boolean;
	divisorW: "" | "120" | "meses";
	aplicarMaximo: boolean;
	aplicarMinimo: boolean;
	/** Vínculo de la cadena previsional guardado con el cálculo (no se edita en la pantalla). */
	[clave: string]: any;
}

const TIEMPO_VACIO: TiempoTexto = { a: "", m: "", d: "" };
const tramoVacio = () => ({ antes: { ...TIEMPO_VACIO }, despues: { ...TIEMPO_VACIO } });
export const FILAS_INICIALES = 3;

let siguienteId = 1;
export const nuevaFilaRemuneracion = (periodo = "", importe = "", hasta = "", moneda = ""): FilaRemuneracionForm => ({
	id: siguienteId++,
	periodo,
	hasta,
	importe,
	moneda,
});
export const nuevaFilaAutonomo = (desde = "", hasta = "", categoria = ""): FilaAutonomoForm => ({
	id: siguienteId++,
	desde,
	hasta,
	categoria,
	moratoria: false,
});

export const valoresIniciales = (): HaberCajaValues => ({
	reclamante: "",
	folderId: "",
	folderName: "",
	prestacion: "jubilacion",
	anticipada: false,
	anticipadaPorcentaje: "",
	porcentajePension: "",
	programa: "ansesPrpa",
	fad: "",
	cese: "",
	solicitud: "",
	alta: "",
	acuerdo: "",
	inicioPago: "",
	promedioDesde: "",
	promedioHasta: "",
	zonaAustral: false,
	reciprocidad: "",
	reciprocidadAlcance: "pbu",
	servicios: { n: tramoVacio(), m: tramoVacio(), p: tramoVacio() },
	excedente35: "",
	remuneraciones: Array.from({ length: FILAS_INICIALES }, () => nuevaFilaRemuneracion()),
	autonomos: [],
	sinEquiparacion: false,
	mesActualizacion: "cesacion",
	topeArt9: true,
	topeArt14: true,
	divisorW: "",
	aplicarMaximo: true,
	aplicarMinimo: false,
});

// ---- lectura de los campos ----

const texto = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();
const entero = (t: string) => {
	const n = Number(texto(t));
	return Number.isInteger(n) && n >= 0 ? n : NaN;
};

/** Años, meses y días del formulario → { a, m, d }; null si hay un valor inválido (meses 0 a 11, días 0 a 30). */
export function tiempoDe(t: TiempoTexto | undefined): TiempoAMD | null {
	const a = texto(t?.a) ? entero(t!.a) : 0;
	const m = texto(t?.m) ? entero(t!.m) : 0;
	const d = texto(t?.d) ? entero(t!.d) : 0;
	if ([a, m, d].some(Number.isNaN) || a > 80 || m > 11 || d > 30) return null;
	return { a, m, d };
}
export const tiempoVacio = (t: TiempoAMD | null) => !t || !(t.a || t.m || t.d);

export const filaRemuneracionVacia = (f: FilaRemuneracionForm) => !texto(f.periodo) && !texto(f.importe) && !texto(f.hasta);
export const filaAutonomoVacia = (f: FilaAutonomoForm) => !texto(f.desde) && !texto(f.hasta) && !texto(f.categoria);

/** Número de un campo de porcentaje (NumberField guarda número; al reabrir puede venir texto). undefined si está vacío. */
export function porcentajeDe(v: unknown): number | undefined {
	if (v === "" || v === null || v === undefined) return undefined;
	const n = typeof v === "number" ? v : leerImporte(String(v));
	return n === null || !Number.isFinite(n) ? NaN : n;
}

/** Titular que se muestra y se guarda (la carpeta vinculada manda sobre el marcador interno). */
export const titularDe = (values: Pick<HaberCajaValues, "reclamante" | "folderName">) =>
	texto(values.reclamante).startsWith(CAUSA_VINCULADA) ? values.folderName || "" : texto(values.reclamante);

/**
 * Entrada del motor a partir de los valores ya validados del formulario. La moneda de cada fila es la que corrigió el
 * usuario o, si quedó en automática, la del período según el catálogo; sin catálogo va sin moneda y la pone el hub.
 */
export function armarEntradaHaberCaja(values: HaberCajaValues, catalogo?: CatalogoHaberCaja | null): HaberCajaInput {
	const servicios: HaberCajaInput["servicios"] = {};
	(["n", "m", "p"] as const).forEach((clase) => {
		const antes = tiempoDe(values.servicios?.[clase]?.antes);
		const despues = tiempoDe(values.servicios?.[clase]?.despues);
		if (tiempoVacio(antes) && tiempoVacio(despues)) return;
		servicios[clase] = { antes: antes || { a: 0, m: 0, d: 0 }, despues: despues || { a: 0, m: 0, d: 0 } };
	});

	const remuneraciones = (values.remuneraciones || [])
		.filter((f) => !filaRemuneracionVacia(f))
		.map((f) => {
			const periodo = normalizarPeriodo(f.periodo) as string;
			const hasta = texto(f.hasta) ? normalizarPeriodo(f.hasta) : null;
			const moneda = texto(f.moneda) || monedaDelPeriodo(catalogo, periodo)?.clave;
			return {
				periodo,
				importe: leerImporte(f.importe) as number,
				...(moneda ? { moneda } : {}),
				...(hasta && hasta > periodo ? { hasta } : {}),
			};
		})
		.sort((x, y) => x.periodo.localeCompare(y.periodo));

	const periodos = (values.autonomos || [])
		.filter((f) => !filaAutonomoVacia(f))
		.map((f) => ({
			desde: normalizarPeriodo(f.desde) as string,
			hasta: normalizarPeriodo(f.hasta) as string,
			categoria: texto(f.categoria),
		}))
		.sort((x, y) => x.desde.localeCompare(y.desde));

	const esPension = values.prestacion === "pension";
	const pctPension = porcentajeDe(values.porcentajePension);
	const pctAnticipada = porcentajeDe(values.anticipadaPorcentaje);
	const reciprocidad = porcentajeDe(values.reciprocidad);
	const promedioDesde = texto(values.promedioDesde) ? normalizarPeriodo(values.promedioDesde) : null;
	const promedioHasta = texto(values.promedioHasta) ? normalizarPeriodo(values.promedioHasta) : null;

	return {
		programa: values.programa,
		prestacion: values.prestacion,
		...(esPension && pctPension !== undefined ? { porcentajePension: pctPension } : {}),
		...(values.anticipada && !esPension ? { anticipada: pctAnticipada !== undefined ? { porcentaje: pctAnticipada } : true } : {}),
		fechas: {
			fad: values.fad,
			...(values.cese ? { cese: values.cese } : {}),
			...(values.solicitud ? { solicitud: values.solicitud } : {}),
			...(values.alta ? { alta: values.alta } : {}),
			...(values.acuerdo ? { acuerdo: values.acuerdo } : {}),
		},
		...(promedioDesde && promedioHasta ? { periodoPromedio: { desde: promedioDesde, hasta: promedioHasta } } : {}),
		servicios,
		remuneraciones,
		...(periodos.length ? { autonomo: { periodos, ...(values.sinEquiparacion ? { equivalencia: false } : {}) } } : {}),
		...(values.zonaAustral ? { zonaAustral: true } : {}),
		...(reciprocidad !== undefined ? { prorrataReciprocidad: reciprocidad, reciprocidadAlcance: values.reciprocidadAlcance || "pbu" } : {}),
		...(values.excedente35 ? { excedente35: values.excedente35 } : {}),
		...(values.mesActualizacion === "acuerdo" ? { mesActualizacion: "acuerdo" as const } : {}),
		...(values.topeArt9 === false ? { topeArt9: false } : {}),
		...(values.topeArt14 === false ? { topeArt14: false } : {}),
		...(values.divisorW === "120" ? { divisorW: 120 as const } : values.divisorW === "meses" ? { divisorW: "meses" as const } : {}),
		...(values.aplicarMaximo === false ? { aplicarMaximo: false } : {}),
		...(values.aplicarMinimo ? { aplicarMinimo: true } : {}),
	};
}
