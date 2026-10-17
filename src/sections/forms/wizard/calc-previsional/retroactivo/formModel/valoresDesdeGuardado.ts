import dayjs from "utils/dayjs-config";
import { RetroactivoInput } from "services/previsionalService";
import formInitialValues from "./formInitialValues";

// Reconstruye los valores del wizard a partir de un cálculo guardado para poder reabrirlo y editarlo.
// Los guardados desde el motor traen `variables.formulario` (todos los values de Formik); si falta,
// se arma lo que se pueda desde `variables.input` (lo que recibió el motor).

/** YYYY-MM-DD → DD/MM/YYYY (formato de los DateInputField del wizard). */
const aDDMMYYYY = (iso?: string | null) => {
	if (!iso) return "";
	const d = dayjs(iso.slice(0, 10), "YYYY-MM-DD", true);
	return d.isValid() ? d.format("DD/MM/YYYY") : "";
};

const oVacio = (v: unknown) => (v === null || v === undefined ? "" : v);

/** ¿El guardado tiene datos suficientes para reabrirse en el wizard? */
export function sePuedeReabrir(calc: any): boolean {
	const v = calc?.variables;
	return !!(v && (v.formulario || v.input));
}

/** Valores del wizard desde `variables.input` (guardados sin `formulario`). */
export function valoresDesdeInput(input: RetroactivoInput, datosExpediente?: any): Record<string, any> {
	const reajustes: { fecha: string; importe: number; descuentoPct?: number }[] = input.percibido?.reajustes?.length
		? input.percibido.reajustes
		: input.percibido?.reajuste
		? [input.percibido.reajuste]
		: [];
	const [primerReajuste, ...otrosReajustes] = reajustes;
	const bono = input.bono && input.bono !== "no" ? input.bono : null;

	return {
		...formInitialValues,
		reclamante: oVacio(datosExpediente?.reclamante),
		expedienteAdmin: oVacio(datosExpediente?.expedienteAdmin),
		prestacion: oVacio(datosExpediente?.prestacion),
		fechaAdquisicion: oVacio(datosExpediente?.fechaAdquisicion),
		fechaAlta: oVacio(datosExpediente?.fechaAlta),
		obraSocial: input.obraSocialPct ? "inssjyp_pami" : "",
		haberPagadoAnses: oVacio(input.percibido?.importe),
		haberPagadoAl: aDDMMYYYY(input.percibido?.fecha),
		pisoPercibido: input.percibido?.piso || "no",
		tieneReajuste: reajustes.length > 0,
		fechaAltaReajuste: aDDMMYYYY(primerReajuste?.fecha),
		importeReajuste: oVacio(primerReajuste?.importe),
		descuentoReajuste: oVacio(primerReajuste?.descuentoPct),
		reajustesAdicionales: otrosReajustes.map((r) => ({
			fecha: aDDMMYYYY(r.fecha),
			importe: oVacio(r.importe),
			descuentoPct: oVacio(r.descuentoPct),
		})),
		haberReclamado: oVacio(input.reclamado?.importe),
		haberReclamadoAl: aDDMMYYYY(input.reclamado?.fecha),
		criteriosMovilidad: input.reclamado?.criterios?.length
			? input.reclamado.criterios.map((c) => ({ indiceMovilidad: c.indiceMovilidad, fechaDesde: aDDMMYYYY(c.fechaDesde) }))
			: formInitialValues.criteriosMovilidad,
		pensionFecha: aDDMMYYYY(input.reclamado?.pension?.fecha),
		pensionPorcentaje: oVacio(input.reclamado?.pension?.porcentaje),
		fechaDesdeReclamado: aDDMMYYYY(input.desde),
		fechaHastaReclamado: aDDMMYYYY(input.hasta),
		fechaCierre: aDDMMYYYY(input.consolidacion),
		zonaAustral: !!input.zonaAustral,
		tipoTope: input.tope?.tipo || "no",
		topeEvaluacion: input.tope?.evaluacion || "cadaPeriodo",
		topePorcentaje: oVacio(input.tope?.porcentaje),
		topeDesde: aDDMMYYYY(input.tope?.desde),
		topeHasta: aDDMMYYYY(input.tope?.hasta),
		topeMaximoBadaro: !!input.tope?.maximoBadaro,
		topeMaximoBadaroDesde: aDDMMYYYY(input.tope?.maximoBadaro?.desde) || "01/01/2002",
		monedaHaberPagado: input.percibido?.moneda || "ARS",
		monedaReclamado: input.reclamado?.moneda || "ARS",
		sac: input.sac !== false,
		tasaInteresSentencia: input.tasa || "",
		pagosACuenta: (input.pagos || []).map((p) => ({ fecha: aDDMMYYYY(p.fecha), importe: p.importe, tipo: p.tipo || "administrativo" })),
		bono: bono ? (bono.percibido && bono.reclamado ? "ambos" : bono.reclamado ? "reclamado" : "percibido") : "no",
		bonoTratamiento: bono?.tratamiento || "decreto",
		capitalizarInteresImpago: input.capitalizarInteresImpago !== false,
		villanustre: !!input.villanustre?.salarios?.length,
		villanustrePorcentaje: input.villanustre?.porcentaje ?? 70,
		villanustrePauta: !!input.villanustre?.pautaSalarial,
		villanustreSalarios: (input.villanustre?.salarios || []).map((x) => ({ fecha: aDDMMYYYY(x.fecha), importe: x.importe })),
	};
}

/**
 * Valores iniciales del wizard para editar un cálculo guardado. Devuelve `null` si el guardado
 * es anterior al motor y no tiene ni `formulario` ni `input`.
 */
export function valoresDesdeCalculadora(calc: any): Record<string, any> | null {
	const v = calc?.variables;
	if (!v) return null;
	const base = v.formulario ? { ...formInitialValues, ...v.formulario } : v.input ? valoresDesdeInput(v.input, v.datosExpediente) : null;
	if (!base) return null;
	// La carpeta vinculada manda la del documento (puede haberse vinculado después desde Guardados)
	const folderId = calc.folderId || base.folderId || "";
	const folderName = calc.folderName || base.folderName || "";
	return {
		...base,
		folderId,
		folderName,
		// Si el guardado apuntaba a una carpeta que ya no existe, el marcador interno no debe
		// aparecer como titular: cae al reclamante del expediente o al nombre de la carpeta.
		reclamante:
			folderId && !base.reclamante
				? `__CAUSA_VINCULADA__${folderId}`
				: !folderId && typeof base.reclamante === "string" && base.reclamante.startsWith("__CAUSA_VINCULADA__")
				? calc.variables?.datosExpediente?.reclamante || folderName || ""
				: base.reclamante,
	};
}
