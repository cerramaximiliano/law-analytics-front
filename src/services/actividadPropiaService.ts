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

export interface ResumenActividadPropia {
	/** El usuario tiene credencial PJN con bandeja: sin ella no hay actos que leer. */
	habilitado: boolean;
	total: number;
	/** `sinActos`: ninguna presentación con la credencial. `sinConfirmar`: hay presentaciones, ninguna figura todavía en el expediente. */
	tramos: Record<TramoActividad, number> & { sinConfirmar?: number };
	pendientes: number;
	proximas: { _id: string; folderName: string; dias: number; fecha: string; tipo: TipoActoPropio }[];
	proximasTotal: number;
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
	movimiento: { fecha: string; tipo?: string; detalle?: string } | null;
}

export interface ActosPropiosCarpeta {
	habilitado: boolean;
	resumen: UltimaActividadLetrado | null;
	actos: ActoPropio[];
	conteo: { escrito: number; cedula: number; deox: number; noCuentan: number };
	truncado: boolean;
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
export type FiltroActividadPropia = "all" | TramoActividad | "mas90" | "mas180" | "pendientes" | "sinConfirmar";

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
		case "sinConfirmar":
			return dias === null && !!ult?.ultimoSinConfirmar;
		case "sinActos":
			return dias === null && !ult?.ultimoSinConfirmar;
		default:
			return tramoDe(dias) === filtro;
	}
};

/** Ámbar legible sobre fondo claro y oscuro: el `warning` del tema es amarillo y no se lee como texto. */
export const AMBAR_TEXTO = { light: "#B45309", dark: "#FBBF24" };
