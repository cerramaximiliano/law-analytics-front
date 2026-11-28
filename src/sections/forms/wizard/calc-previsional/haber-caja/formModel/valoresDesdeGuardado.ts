// Haber de caja guardado: reabrirlo en el formulario y llevarlo al retroactivo como haber percibido.
import dayjs from "utils/dayjs-config";
import { HaberCajaInput, HaberCajaResultado, TiempoAMD } from "services/haberCajaService";
import {
	CAUSA_VINCULADA,
	HaberCajaValues,
	nuevaFilaAutonomo,
	nuevaFilaRemuneracion,
	TiempoTexto,
	titularDe,
	valoresIniciales,
} from "./haberCajaFormModel";

export const SUBCLASE_HABER_CAJA = "haberCaja";

/** ¿El cálculo guardado es un haber de caja? */
export const esHaberCajaGuardado = (calc: any): boolean => calc?.classType === "previsional" && calc?.subClassType === SUBCLASE_HABER_CAJA;

/** ¿El guardado tiene datos suficientes para reabrirse? */
export function sePuedeReabrirHaberCaja(calc: any): boolean {
	const v = calc?.variables;
	return esHaberCajaGuardado(calc) && !!(v && (v.formulario || v.input));
}

const aTexto = (t?: TiempoAMD | number | null): TiempoTexto => {
	if (typeof t === "number") return { a: String(Math.floor(t / 12) || ""), m: String(t % 12 || ""), d: "" };
	return { a: t?.a ? String(t.a) : "", m: t?.m ? String(t.m) : "", d: t?.d ? String(t.d) : "" };
};
const importeTexto = (n: number) => String(n).replace(".", ",");

/** Valores del formulario desde la entrada del motor (guardados sin `formulario`). */
export function valoresDesdeInput(input: HaberCajaInput, datosExpediente?: any): HaberCajaValues {
	const base = valoresIniciales();
	const anticipada = input.anticipada;
	return {
		...base,
		reclamante: datosExpediente?.reclamante || "",
		prestacion: input.prestacion || "jubilacion",
		anticipada: !!anticipada,
		anticipadaPorcentaje: anticipada && typeof anticipada === "object" ? anticipada.porcentaje : "",
		porcentajePension: input.porcentajePension ?? "",
		programa: input.programa || "ansesPrpa",
		fad: input.fechas?.fad || "",
		cese: input.fechas?.cese || "",
		solicitud: input.fechas?.solicitud || "",
		alta: input.fechas?.alta || "",
		acuerdo: input.fechas?.acuerdo || "",
		promedioDesde: input.periodoPromedio?.desde || "",
		promedioHasta: input.periodoPromedio?.hasta || "",
		zonaAustral: !!input.zonaAustral,
		reciprocidad: input.prorrataReciprocidad ?? "",
		reciprocidadAlcance: input.reciprocidadAlcance || "pbu",
		servicios: {
			n: { antes: aTexto(input.servicios?.n?.antes), despues: aTexto(input.servicios?.n?.despues) },
			m: { antes: aTexto(input.servicios?.m?.antes), despues: aTexto(input.servicios?.m?.despues) },
			p: { antes: aTexto(input.servicios?.p?.antes), despues: aTexto(input.servicios?.p?.despues) },
		},
		excedente35: input.excedente35 || "",
		remuneraciones: (input.remuneraciones || []).map((r) =>
			nuevaFilaRemuneracion(r.periodo, importeTexto(r.importe), r.hasta || "", r.monedaAutomatica ? "" : r.moneda || ""),
		),
		autonomos: (input.autonomo?.periodos || []).map((p) => nuevaFilaAutonomo(p.desde, p.hasta, p.categoria)),
		sinEquiparacion: input.autonomo?.equivalencia === false,
		mesActualizacion: input.mesActualizacion === "acuerdo" ? "acuerdo" : "cesacion",
		topeArt9: input.topeArt9 !== false,
		topeArt14: input.topeArt14 !== false,
		divisorW: input.divisorW === 120 ? "120" : input.divisorW === "meses" ? "meses" : "",
		aplicarMaximo: input.aplicarMaximo !== false,
		aplicarMinimo: !!input.aplicarMinimo,
	};
}

/** Valores iniciales para editar un haber de caja guardado; null si no se puede reabrir. */
export function valoresDesdeCalculadora(calc: any): HaberCajaValues | null {
	if (!sePuedeReabrirHaberCaja(calc)) return null;
	const v = calc.variables;
	const inicial = valoresIniciales();
	const base: HaberCajaValues = v.formulario
		? {
				...inicial,
				...v.formulario,
				servicios: { ...inicial.servicios, ...(v.formulario.servicios || {}) },
				// ids nuevos: los guardados pueden chocar con los de esta sesión
				remuneraciones: (v.formulario.remuneraciones || []).map((f: any) => nuevaFilaRemuneracion(f.periodo, f.importe, f.hasta, f.moneda)),
				autonomos: (v.formulario.autonomos || []).map((f: any) => nuevaFilaAutonomo(f.desde, f.hasta, f.categoria)),
		  }
		: valoresDesdeInput(v.input, v.datosExpediente);
	if (!base.remuneraciones.length) base.remuneraciones = inicial.remuneraciones;
	// La carpeta vinculada manda la del documento (puede haberse vinculado después desde Guardados)
	const folderId = calc.folderId || "";
	const folderName = calc.folderId ? calc.folderName || base.folderName || "" : "";
	const titularGuardado = typeof base.reclamante === "string" && !base.reclamante.startsWith(CAUSA_VINCULADA) ? base.reclamante : "";
	return {
		...base,
		folderId,
		folderName,
		reclamante: folderId ? `${CAUSA_VINCULADA}${folderId}` : titularGuardado || v.datosExpediente?.reclamante || calc.user || "",
	};
}

// ---- cadena previsional: haber de caja → (haber de reajuste) → retroactivo ----

/** Origen del haber con que arranca un retroactivo; viaja en los valores del wizard (`cadenaOrigen`) y se guarda con él. */
export interface OrigenCadena {
	etapa: "haberCaja" | "haberReajuste";
	/** Cálculo guardado del que sale el haber; null si el haber de caja no se guardó (no queda vínculo). */
	calculatorId: string | null;
	/** Mes del haber (AAAA-MM) y sus componentes, para el haber de reajuste que se intercalará. */
	mes: string;
	haber: number;
	componentes: { PBU: number; PC: number; PAP: number };
}

export interface PrecargaRetroactivo {
	origen: OrigenCadena;
	/** Valores del wizard del retroactivo que se precargan. */
	valores: Record<string, any>;
}

const PRESTACION_RETROACTIVO: Record<string, string> = { jubilacion: "jubilacion_ordinaria" };

/**
 * Precarga del retroactivo desde un haber de caja calculado: el haber de caja es el reflejo de lo que liquida ANSES, así
 * que entra como «Haber pagado ANSES». Con fecha de acuerdo se toma el mensual de ese mes (lo que imprime la constancia);
 * si no, el haber al mes de valuación.
 */
export function precargaRetroactivoDesdeHaberCaja(
	resultado: HaberCajaResultado,
	values: HaberCajaValues,
	calculatorId: string | null,
): PrecargaRetroactivo {
	const a = resultado.alAcuerdo;
	const mes = a ? a.mes : resultado.mesValuacion;
	const haber = a ? a.haber : resultado.haber;
	const componentes = a ? { PBU: a.PBU, PC: a.PC, PAP: a.PAP } : { PBU: resultado.PBU, PC: resultado.PC, PAP: resultado.PAP };
	const fecha = (iso: string, formato: string) =>
		iso && dayjs(iso, "YYYY-MM-DD", true).isValid() ? dayjs(iso, "YYYY-MM-DD").format(formato) : "";
	const vinculada = !!values.folderId;
	return {
		origen: { etapa: "haberCaja", calculatorId, mes, haber, componentes },
		valores: {
			reclamante: vinculada ? `${CAUSA_VINCULADA}${values.folderId}` : titularDe(values),
			folderId: values.folderId || "",
			folderName: vinculada ? values.folderName || "" : "",
			prestacion: PRESTACION_RETROACTIVO[values.prestacion] || "",
			fechaAdquisicion: fecha(values.fad, "DD/MM/YYYY"),
			fechaAlta: fecha(values.alta, "MM/YYYY"),
			haberPagadoAnses: haber,
			haberPagadoAl: fecha(`${mes}-01`, "DD/MM/YYYY"),
			monedaHaberPagado: "ARS",
			zonaAustral: !!values.zonaAustral,
		},
	};
}
