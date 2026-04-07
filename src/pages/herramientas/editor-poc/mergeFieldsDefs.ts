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

const VAR_COLOR:    GroupColor = { bg: "#f1f5f9", color: "#1f2937", border: "#7f8fa6" };
const BLOQUE_COLOR: GroupColor = { bg: "#d0d9e6", color: "#1e293b", border: "#4a6380" };

export const GROUP_COLORS: Record<string, GroupColor> = {
	expediente: VAR_COLOR,
	actor:      VAR_COLOR,
	demandado:  VAR_COLOR,
	letrado:    VAR_COLOR,
	fecha:      VAR_COLOR,
	calculo:    VAR_COLOR,
	movimiento: VAR_COLOR,
	bloque:     BLOQUE_COLOR,
};

/** Devuelve los colores del grupo a partir de una key de merge field (ej: "expediente.numero") */
export function getGroupColorByKey(key: string): GroupColor {
	const prefix = key.split(".")[0];
	// Backward compat: cliente → actor, contraparte → demandado
	const normalized = prefix === "cliente" ? "actor" : prefix === "contraparte" ? "demandado" : prefix;
	return GROUP_COLORS[normalized] ?? { bg: "#f5f5f5", color: "#333", border: "#ccc" };
}

export const MERGE_FIELD_GROUPS: MergeFieldGroup[] = [
	{
		id: "bloque",
		title: "📦 Bloques",
		fields: [
			{ key: "bloque.encabezado_judicial", label: "Encabezado judicial" },
			{ key: "bloque.actor_completo", label: "Actor completo" },
			{ key: "bloque.demandado_completo", label: "Demandado completo" },
		],
	},
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
		id: "actor",
		title: "Actor",
		fields: [
			{ key: "actor.nombre_completo", label: "Nombre completo / Razón social del actor" },
			{ key: "actor.nombre", label: "Nombre del actor" },
			{ key: "actor.apellido", label: "Apellido del actor" },
			{ key: "actor.razon_social", label: "Razón social del actor" },
			{ key: "actor.dni", label: "DNI del actor" },
			{ key: "actor.cuit", label: "CUIT/CUIL del actor" },
			{ key: "actor.domicilio", label: "Domicilio del actor" },
			{ key: "actor.email", label: "Email del actor" },
			{ key: "actor.telefono", label: "Teléfono del actor" },
		],
	},
	{
		id: "demandado",
		title: "Demandado",
		fields: [
			{ key: "demandado.nombre_completo", label: "Nombre completo / Razón social del demandado" },
			{ key: "demandado.nombre", label: "Nombre del demandado" },
			{ key: "demandado.apellido", label: "Apellido del demandado" },
			{ key: "demandado.razon_social", label: "Razón social del demandado" },
			{ key: "demandado.dni", label: "DNI del demandado" },
			{ key: "demandado.cuit", label: "CUIT/CUIL del demandado" },
			{ key: "demandado.domicilio", label: "Domicilio del demandado" },
			{ key: "demandado.email", label: "Email del demandado" },
			{ key: "demandado.telefono", label: "Teléfono del demandado" },
			{ key: "demandado.representante", label: "Representante legal del demandado" },
		],
	},
	{
		id: "letrado",
		title: "Letrado",
		fields: [
			{ key: "letrado.nombre_completo", label: "Nombre y apellido del letrado" },
			{ key: "letrado.colegio", label: "Colegio de abogados" },
			{ key: "letrado.matricula", label: "Matrícula del letrado" },
			{ key: "letrado.domicilio_constituido", label: "Domicilio físico constituido" },
			{ key: "letrado.domicilio_electronico", label: "Domicilio electrónico" },
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
