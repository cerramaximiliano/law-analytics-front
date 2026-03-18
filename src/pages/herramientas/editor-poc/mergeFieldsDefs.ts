export interface MergeFieldDef {
	key: string;
	label: string;
}

export interface MergeFieldGroup {
	id: string;
	title: string;
	fields: MergeFieldDef[];
}

export interface GroupColor {
	bg: string;
	color: string;
	border: string;
}

export const GROUP_COLORS: Record<string, GroupColor> = {
	expediente:  { bg: "#f0fdf4", color: "#166534", border: "#86efac" },
	cliente:     { bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" },
	contraparte: { bg: "#fff7ed", color: "#9a3412", border: "#fdba74" },
	letrado:     { bg: "#faf5ff", color: "#6b21a8", border: "#c4b5fd" },
	fecha:       { bg: "#f0fdfa", color: "#0f766e", border: "#5eead4" },
	calculo:     { bg: "#fefce8", color: "#854d0e", border: "#fde047" },
	movimiento:  { bg: "#f0f9ff", color: "#0369a1", border: "#7dd3fc" },
};

/** Devuelve los colores del grupo a partir de una key de merge field (ej: "expediente.numero") */
export function getGroupColorByKey(key: string): GroupColor {
	const prefix = key.split(".")[0];
	return GROUP_COLORS[prefix] ?? { bg: "#f5f5f5", color: "#333", border: "#ccc" };
}

export const MERGE_FIELD_GROUPS: MergeFieldGroup[] = [
	{
		id: "expediente",
		title: "Expediente",
		fields: [
			{ key: "expediente.numero", label: "Número de expediente" },
			{ key: "expediente.caratula", label: "Carátula del expediente" },
			{ key: "expediente.juzgado", label: "Número de juzgado" },
			{ key: "expediente.fuero", label: "Fuero / estado" },
			{ key: "expediente.secretaria", label: "Número de secretaría" },
			{ key: "expediente.jurisdiccion", label: "Jurisdicción" },
		],
	},
	{
		id: "cliente",
		title: "Cliente",
		fields: [
			{ key: "cliente.nombre", label: "Nombre del cliente" },
			{ key: "cliente.apellido", label: "Apellido del cliente" },
			{ key: "cliente.nombre_completo", label: "Nombre y apellido del cliente" },
			{ key: "cliente.dni", label: "DNI del cliente" },
			{ key: "cliente.cuit", label: "CUIT del cliente" },
			{ key: "cliente.domicilio", label: "Domicilio del cliente" },
			{ key: "cliente.email", label: "Email del cliente" },
			{ key: "cliente.telefono", label: "Teléfono del cliente" },
		],
	},
	{
		id: "contraparte",
		title: "Contraparte",
		fields: [
			{ key: "contraparte.nombre", label: "Nombre / Razón social" },
			{ key: "contraparte.dni", label: "DNI / CUIT de la contraparte" },
			{ key: "contraparte.domicilio", label: "Domicilio de la contraparte" },
			{ key: "contraparte.representante", label: "Representante legal" },
		],
	},
	{
		id: "letrado",
		title: "Letrado",
		fields: [
			{ key: "letrado.nombre_completo", label: "Nombre y apellido del letrado" },
			{ key: "letrado.colegio", label: "Colegio de abogados" },
			{ key: "letrado.matricula", label: "Matrícula del letrado" },
			{ key: "letrado.domicilio_constituido", label: "Domicilio constituido" },
			{ key: "letrado.email", label: "Email del letrado" },
		],
	},
	{
		id: "fecha",
		title: "Fechas",
		fields: [
			{ key: "fecha.hoy", label: "Fecha de hoy" },
			{ key: "fecha.hoy_largo", label: "Fecha de hoy (escrita)" },
		],
	},
	{
		id: "movimiento",
		title: "Movimiento",
		fields: [
			{ key: "movimiento.fecha", label: "Fecha del movimiento" },
			{ key: "movimiento.tipo", label: "Tipo de movimiento" },
			{ key: "movimiento.titulo", label: "Título del movimiento" },
			{ key: "movimiento.descripcion", label: "Descripción del movimiento" },
		],
	},
	{
		id: "calculo",
		title: "Cálculo",
		fields: [
			{ key: "calculo.monto_total", label: "Monto total del cálculo" },
			{ key: "calculo.capital", label: "Capital del cálculo" },
			{ key: "calculo.interes", label: "Intereses del cálculo" },
			{ key: "calculo.descripcion", label: "Descripción del cálculo" },
			{ key: "calculo.fecha", label: "Fecha del cálculo" },
			{ key: "calculo.tipo", label: "Tipo de cálculo" },
			{ key: "calculo.fecha_inicio_relacion", label: "Inicio de relación laboral" },
			{ key: "calculo.fecha_fin_relacion", label: "Fin de relación laboral" },
			{ key: "calculo.fecha_inicio_intereses", label: "Fecha inicio de intereses" },
			{ key: "calculo.fecha_fin_intereses", label: "Fecha fin de intereses" },
			{ key: "calculo.tasa", label: "Tasa de interés aplicada" },
		],
	},
];
