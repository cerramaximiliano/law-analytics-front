// Actividad procesal propia (10/11/2026): último escrito, cédula o DEOX presentado con la
// credencial PJN del usuario en cada causa, para estimar caducidad de instancia.
//
// Los datos los escribe pjn-mis-causas; el hub los expone en:
//   GET /api/folders/actividad-propia/resumen  → tramos de las carpetas PJN activas
//   GET /api/folders/:id/actos-letrado         → historial de actos de la carpeta
// Los días se calculan al mostrar. Si el endpoint falla, las vistas no muestran nada (null).
import axios from "axios";
import { teamHeaders } from "api/teamHeaders";
import type { EstadoActoPropio, TipoActoPropio, UltimaActividadLetrado } from "types/folder";

const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5000";
const DIA_MS = 86400000;

export type TramoActividad = "hasta90" | "d91a180" | "d181a365" | "mas365" | "sinActos";

/** Estado de la lectura de la bandeja (hub: services/escritosPjnEstado.js). */
export interface SincronizacionEscritos {
	/** Hasta cuándo se leyeron los escritos de la bandeja. */
	ultimaLectura: string | null;
	/** "detenida": la credencial no está leyendo o la última lectura es vieja; los días pueden no reflejar lo presentado después. */
	estado: "ok" | "detenida";
	motivo: "credencial" | "atrasada" | null;
}

export interface EstadoEscritos {
	/** El usuario tiene credencial PJN con bandeja: sin ella no hay actos que leer. */
	habilitado: boolean;
	/** «Escritos presentados» activado en Integraciones → PJN. Apagado: no se muestran. */
	activo: boolean;
	sincronizacion: SincronizacionEscritos;
}

export interface ResumenActividadPropia extends EstadoEscritos {
	total: number;
	/** `sinActos`: sin días que contar (ninguna presentación figura todavía en el expediente). */
	tramos: Record<TramoActividad, number>;
	/** Carpetas con escritos sin proveer; aparte de los tramos (una carpeta con días contados puede tenerlos). */
	pendientes: number;
}

export interface ActoPropio {
	_id: string;
	tipo: TipoActoPropio;
	fecha: string;
	titulo: string | null;
	estado: EstadoActoPropio;
	valido: boolean;
	fechaGestion: string | null;
	numeroCedula: string | null;
	destinatarios: string[];
	/** `id`: _id en pjn-movements, para abrir el movimiento en el expediente. */
	movimiento: { fecha: string; tipo?: string; detalle?: string; id?: string | null } | null;
	/** Credencial con la que se presentó: etiqueta, abogado titular o «Cuenta PJN N». */
	presento: string | null;
}

export interface ActosPropiosCarpeta extends EstadoEscritos {
	resumen: UltimaActividadLetrado | null;
	actos: ActoPropio[];
	conteo: { escrito: number; cedula: number; deox: number; noCuentan: number };
	truncado: boolean;
	/** Presentaron con más de una credencial en esta causa: la tabla muestra quién. */
	variasCredenciales?: boolean;
}

export const fetchResumenActividadPropia = async (): Promise<ResumenActividadPropia | null> => {
	try {
		const { data } = await axios.get(`${baseUrl}/api/folders/actividad-propia/resumen`, { headers: teamHeaders() });
		return data?.success ? (data as ResumenActividadPropia) : null;
	} catch {
		return null;
	}
};

export const fetchActosPropiosCarpeta = async (folderId: string): Promise<ActosPropiosCarpeta | null> => {
	try {
		const { data } = await axios.get(`${baseUrl}/api/folders/${folderId}/actos-letrado`);
		return data?.success ? (data as ActosPropiosCarpeta) : null;
	} catch {
		return null;
	}
};

// ---- Cálculo y presentación (mismo criterio que el hub, folderActividadPropiaController) ----

export const diasDesde = (fecha?: string | null, ahora = Date.now()): number | null => {
	const t = fecha ? new Date(fecha).getTime() : NaN;
	return Number.isFinite(t) ? Math.max(0, Math.floor((ahora - t) / DIA_MS)) : null;
};

export const tramoDe = (dias: number | null): TramoActividad => {
	if (dias === null) return "sinActos";
	if (dias <= 90) return "hasta90";
	if (dias <= 180) return "d91a180";
	if (dias <= 365) return "d181a365";
	return "mas365";
};

export const TRAMOS: { key: TramoActividad; label: string; corto: string; color: string; bg: string; fg: string }[] = [
	{ key: "hasta90", label: "Hasta 90 días", corto: "Hasta 90 d", color: "#3fae4a", bg: "#e3f4e4", fg: "#23692f" },
	{ key: "d91a180", label: "91 a 180 días", corto: "91 a 180 d", color: "#e3b505", bg: "#fff4c2", fg: "#6b5200" },
	{ key: "d181a365", label: "181 a 365 días", corto: "181 a 365 d", color: "#e8760c", bg: "#ffe9d6", fg: "#9a4a07" },
	{ key: "mas365", label: "Más de 365 días", corto: "Más de 365 d", color: "#c4302b", bg: "#fde2e1", fg: "#a3201a" },
];

export const tramoInfo = (key: TramoActividad) => TRAMOS.find((t) => t.key === key);

export const TIPO_ACTO_LABEL: Record<TipoActoPropio, string> = { escrito: "Escrito", cedula: "Cédula", deox: "DEOX" };

export const ESTADO_ACTO_LABEL: Record<EstadoActoPropio, string> = {
	presentado: "Presentado, sin proveer",
	gestionado: "Proveído",
	en_expediente: "En expediente",
	enviado: "Enviado",
	no_agregado: "No agregado por el juzgado",
};

/** Filtro del listado de carpetas por actividad propia. */
export type FiltroActividadPropia = "all" | TramoActividad | "mas90" | "mas180" | "pendientes";

export const FILTROS_ACTIVIDAD: FiltroActividadPropia[] = [
	"all",
	"hasta90",
	"d91a180",
	"d181a365",
	"mas365",
	"mas90",
	"mas180",
	"pendientes",
	"sinActos",
];

/** Valor de ?actividadPropia= o del filtro guardado; `sinConfirmar` (anterior al 19/11) es ahora parte de `sinActos`. */
export const filtroActividadDe = (v: string | null | undefined): FiltroActividadPropia | null =>
	v === "sinConfirmar" ? "sinActos" : FILTROS_ACTIVIDAD.includes(v as FiltroActividadPropia) ? (v as FiltroActividadPropia) : null;

export const cumpleFiltroActividad = (filtro: FiltroActividadPropia, ult?: UltimaActividadLetrado | null): boolean => {
	if (filtro === "all") return true;
	const dias = diasDesde(ult?.fecha);
	switch (filtro) {
		case "mas90":
			return dias !== null && dias > 90;
		case "mas180":
			return dias !== null && dias > 180;
		case "pendientes":
			return (ult?.pendientes || 0) > 0;
		default:
			return tramoDe(dias) === filtro;
	}
};

/** Fecha corta de la última lectura de la bandeja (dd/mm/aaaa). */
export const fechaLectura = (iso?: string | null): string | null =>
	iso ? new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null;

/** Texto del aviso de datos congelados, o null si la lectura está al día. */
export const avisoEscritosDetenidos = (s?: SincronizacionEscritos | null): string | null => {
	if (!s || s.estado !== "detenida") return null;
	const al = fechaLectura(s.ultimaLectura);
	const motivo = s.motivo === "credencial" ? "la credencial PJN no está sincronizando" : "la lectura de la bandeja está atrasada";
	return al ? `Datos al ${al}: ${motivo}` : `Sin lectura reciente: ${motivo}`;
};

/** Ámbar legible sobre fondo claro y oscuro: el `warning` del tema es amarillo y no se lee como texto. */
export const AMBAR_TEXTO = { light: "#B45309", dark: "#FBBF24" };
