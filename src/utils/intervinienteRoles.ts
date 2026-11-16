// Agrupa los roles que informa el PJN para darles color e ícono. Desde la lectura por API del SCW
// (16/11/2026) llegan muchos más que ACTOR / DEMANDADO / TERCERO: testigos, peritos, mediadores,
// síndicos, ejecutantes, defensores oficiales, asesores de menores…

export type GrupoInterviniente = "actora" | "demandada" | "tercero" | "auxiliar" | "testigo" | "letrado" | "funcionario" | "otro";

export const grupoInterviniente = (tipo?: string | null): GrupoInterviniente => {
	const t = String(tipo || "")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toUpperCase()
		.trim();
	if (!t) return "otro";
	if (/DEFENSOR|ASESOR|TUTOR|CURADOR|MINISTERIO/.test(t)) return "funcionario";
	if (/^LETRADO/.test(t)) return "letrado";
	if (/^TESTIGO/.test(t)) return "testigo";
	if (/^(ACTOR|ACTORA|EJECUTANTE|PETICIONANTE|INCIDENTISTA|DENUNCIANTE|PRESENTANTE|CAUSANTE|HEREDERO)/.test(t)) return "actora";
	if (/^(DEMANDAD|EJECUTAD|FALLIDO|PRESUNTO FALLIDO|CIT(ADO)? EN GARANTIA)/.test(t)) return "demandada";
	if (/^(TERCER|ACREEDOR)/.test(t)) return "tercero";
	if (/PERITO|MEDIADOR|SINDICO|MARTILLERO|CONSULTOR|ADMINISTRADOR|INTERVENTOR|VEEDOR|DEPOSITARIO|ESCRIBANO/.test(t)) return "auxiliar";
	return "otro";
};

type ColorChip = "primary" | "secondary" | "success" | "error" | "warning" | "info" | "default";

export const colorGrupo: Record<GrupoInterviniente, ColorChip> = {
	actora: "success",
	demandada: "error",
	tercero: "warning",
	auxiliar: "info",
	testigo: "default",
	letrado: "primary",
	funcionario: "secondary",
	otro: "default",
};

export const iconoGrupo: Record<GrupoInterviniente, string> = {
	actora: "👤",
	demandada: "👥",
	tercero: "🔷",
	auxiliar: "🔍",
	testigo: "👁️",
	letrado: "⚖️",
	funcionario: "🏛️",
	otro: "👥",
};

/**
 * estadoIej del PJN: el SCW guarda el CUIT del letrado cuando constituyó domicilio electrónico y
 * "NO CONSTITUIDO" si no. Devuelve la etiqueta a mostrar y si está constituido.
 */
export const domicilioElectronico = (estadoIej?: string | null): { label: string; constituido: boolean } | null => {
	const v = String(estadoIej || "").trim();
	if (!v) return null;
	if (/^\d{11}$/.test(v.replace(/\D/g, "")) || v.toUpperCase() === "CONSTITUIDO") return { label: "Constituido", constituido: true };
	return { label: v.toUpperCase() === "NO CONSTITUIDO" ? "No constituido" : v, constituido: false };
};
