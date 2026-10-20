/**
 * Tipo de proceso de una causa PJN (plazos automáticos, P21).
 *
 * Lo escribe el pipeline de plazos (tipo-proceso-worker) en
 * `judFolder.tipoProceso` de las carpetas PJN: ordinario, sumario (sumario y
 * sumarísimo son el mismo tipo) o especial (ejecuciones, sucesiones, amparos…:
 * trámites propios). Solo se muestra en carpetas PJN con el dato presente.
 */

export type TipoProcesoFolder = {
	tipo?: "ordinario" | "sumario" | "especial" | string | null;
	fuente?: string | null;
	fecha?: string | null;
	actualizadoAt?: string | null;
};

const ETIQUETAS: Record<string, string> = {
	ordinario: "Ordinario",
	sumario: "Sumario / sumarísimo",
	especial: "Proceso especial",
};

const ORIGEN: Record<string, string> = {
	expreso: "Declarado en una resolución",
	plazo_demanda: "Según el plazo del traslado de demanda",
	plazo_agravios: "Según el plazo del traslado de agravios",
	objeto: "Según el objeto de la causa",
	objeto_especial: "Según el objeto de la causa",
	norma: "Según la norma del fuero",
	usuario: "Indicado por un usuario",
	operador: "Revisado por nuestro equipo",
};

// Fueros con tipo de proceso (causaType del folder): civil, comercial, seguridad social, trabajo y federales CPCCN.
const CAUSAS_CON_TIPO = new Set([
	"CausasCivil",
	"CausasComercial",
	"CausasSegSocial",
	"CausasSegSoc",
	"CausasTrabajo",
	"CausasCCF",
	"CausasCAF",
	...["FBB", "FCB", "FCR", "FCT", "FGR", "FLP", "FMP", "FMZ", "FPA", "FPO", "FRE", "FRO", "FSA", "FSM", "FTU"].map((f) => `Causas${f}`),
]);

/** ¿La carpeta muestra el tipo de proceso? Solo carpetas PJN vinculadas a una causa de un fuero con tipo. */
export const aplicaTipoProceso = (
	folder: { pjn?: boolean; causaId?: string | null; causaType?: string | null } | null | undefined,
): boolean => !!(folder?.pjn && folder?.causaId && CAUSAS_CON_TIPO.has(folder?.causaType || ""));

export const OPCIONES_TIPO_PROCESO: { value: "ordinario" | "sumario" | "especial"; label: string }[] = [
	{ value: "ordinario", label: ETIQUETAS.ordinario },
	{ value: "sumario", label: ETIQUETAS.sumario },
	{ value: "especial", label: ETIQUETAS.especial },
];

/** Etiqueta para mostrar, o null si la carpeta no es PJN o no tiene el dato (la tarjeta dice "Sin determinar"). */
export const etiquetaTipoProceso = (
	folder: { pjn?: boolean; judFolder?: { tipoProceso?: TipoProcesoFolder | null } | null } | null | undefined,
): string | null => {
	const tipo = folder?.pjn ? folder?.judFolder?.tipoProceso?.tipo : null;
	return tipo ? ETIQUETAS[tipo] || null : null;
};

/** Texto secundario: de dónde sale el tipo. */
export const origenTipoProceso = (tp: TipoProcesoFolder | null | undefined): string | undefined =>
	(tp?.fuente && ORIGEN[tp.fuente]) || undefined;
