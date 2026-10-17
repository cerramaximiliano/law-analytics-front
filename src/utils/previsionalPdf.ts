import { createElement, ComponentProps, ReactElement } from "react";
import { pdf, Document } from "@react-pdf/renderer";
import { enqueueSnackbar } from "notistack";
import dayjs from "dayjs";
import PrevisionalRetroactivoPDF from "components/calculator/PrevisionalRetroactivoPDF";
import type { RetroactivoInput, RetroactivoResultado } from "services/previsionalService";

// Descarga del PDF del retroactivo previsional, desde el resultado del cálculo y desde los cálculos guardados.

/** Mismos textos que CRITERIOS_MOVILIDAD del motor del hub (law-analytics-server/services/previsionalService.js). */
export const CRITERIOS_MOVILIDAD_LABELS: Record<string, string> = {
	aumentos_generales_anses: "Aumentos generales ANSES por movilidad",
	aumentos_porcentuales: "Aumentos generales ANSES, solo el porcentaje (sin sumas fijas)",
	sin_movilidad: "Sin movilidad",
	badaro_isal: "Índice de salarios INDEC (Badaro), anual hasta 12/2006",
	recomposicion_ley_27426: "Recomposición ley 27.426 - Torelli (salto único)",
	ley_27426_diferido_6_meses: "Continuidad ley 27.426 (IPC + RIPTE)",
	aumento_mar_2021_sem2_2020: "Aumento de marzo 2021 por el segundo semestre 2020 (Cortes)",
	ipc_trimestral_retrasado_3m: "IPC trimestral con 3 meses de atraso (Cortes)",
};

export const TOPE_LABELS: Record<string, string> = {
	si: "Tope del art. 9 ley 24.463",
	actis_caporale_menor_15: '"Actis Caporale": se aplica si la quita es menor al 15 % del haber',
	actis_caporale_menor_15_sino_descuenta: '"Actis Caporale": se aplica si la quita es menor al 15 %, si no se descuenta el 15 %',
};

export const PRESTACION_LABELS: Record<string, string> = {
	jubilacion_ordinaria: "Jubilación Ordinaria",
	pension_derivada: "Pensión derivada",
};

export interface DatosDescargaRetroactivo {
	titular?: string | null;
	expedienteAdmin?: string | null;
	/** Código del formulario ("jubilacion_ordinaria") o texto ya legible. */
	prestacion?: string | null;
	carpeta?: string | null;
	/** Sobrescribe o completa los textos por defecto de los criterios de movilidad. */
	criteriosLabels?: Record<string, string>;
	tasaLabel?: string | null;
}

export interface DescargarPdfRetroactivoParams {
	resultado: RetroactivoResultado;
	input: RetroactivoInput;
	datos: DatosDescargaRetroactivo;
	nombreArchivo?: string;
}

/** "Pérez, Juan José" → "perez-juan-jose" (ASCII, máximo 40 caracteres). */
export const slug = (texto?: string | null) =>
	(texto || "")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 40)
		.replace(/-+$/, "");

/** Un guardado sirve para el PDF si trae el detalle mes a mes y el input del motor. */
export const tieneDetalleParaPdf = (variables: any) =>
	Array.isArray(variables?.resultado?.filas) && variables.resultado.filas.length > 0 && !!variables?.input?.percibido;

export const nombreArchivoRetroactivo = (titular: string | null | undefined, cierre: string | undefined) => {
	const t = slug(titular);
	const c = cierre && /^\d{4}-\d{2}-\d{2}/.test(cierre) ? cierre.slice(0, 10) : dayjs().format("YYYY-MM-DD");
	return `retroactivo${t ? `-${t}` : ""}-${c}.pdf`;
};

/** Renderiza el PDF y dispara la descarga. Devuelve true si se descargó; muestra un snackbar si falla. */
export async function descargarPdfRetroactivo({ resultado, input, datos, nombreArchivo }: DescargarPdfRetroactivoParams): Promise<boolean> {
	if (!resultado?.filas?.length || !input?.percibido) {
		enqueueSnackbar("Este cálculo no tiene el detalle necesario para generar el PDF", { variant: "warning" });
		return false;
	}
	try {
		const blob = await pdf(
			createElement(PrevisionalRetroactivoPDF, {
				resultado,
				input,
				datos: {
					titular: datos.titular || null,
					expedienteAdmin: datos.expedienteAdmin || null,
					prestacion: datos.prestacion ? PRESTACION_LABELS[datos.prestacion] || datos.prestacion : null,
					carpeta: datos.carpeta || null,
					criteriosLabels: { ...CRITERIOS_MOVILIDAD_LABELS, ...(datos.criteriosLabels || {}) },
					topeLabels: TOPE_LABELS,
					tasaLabel: datos.tasaLabel || null,
					emitido: dayjs().format("DD/MM/YYYY"),
				},
			}) as unknown as ReactElement<ComponentProps<typeof Document>>,
		).toBlob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = nombreArchivo || nombreArchivoRetroactivo(datos.titular, resultado.consolidacion);
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
		return true;
	} catch (e) {
		console.error("No se pudo generar el PDF del retroactivo", e);
		enqueueSnackbar("No se pudo generar el PDF. Probá de nuevo en unos segundos.", { variant: "error" });
		return false;
	}
}
