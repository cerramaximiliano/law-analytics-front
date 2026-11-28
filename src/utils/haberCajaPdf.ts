import { createElement, ComponentProps, ReactElement } from "react";
import { pdf, Document } from "@react-pdf/renderer";
import { enqueueSnackbar } from "notistack";
import dayjs from "dayjs";
import HaberCajaPDF, {
	DatosPdfHaberCaja,
	HaberCajaEntrada,
	HaberCajaResultado,
	SeriePdfHaberCaja,
} from "components/calculator/HaberCajaPDF";
import { slug } from "utils/previsionalPdf";

// Descarga de la planilla del haber de caja en PDF, desde el resultado del cálculo (mismo mecanismo que el retroactivo).

export interface DescargarPdfHaberCajaParams {
	/** Entrada con la que corrió el motor (la que devuelve el hub, con la moneda de cada fila). */
	entrada: HaberCajaEntrada;
	resultado: HaberCajaResultado;
	datos: Omit<DatosPdfHaberCaja, "emitido">;
	/** Serie mensual del haber, si el usuario la generó: va como anexo «Movilidad del haber mensual». */
	serie?: SeriePdfHaberCaja | null;
	nombreArchivo?: string;
}

export const nombreArchivoHaberCaja = (titular: string | null | undefined, fad: string | undefined) => {
	const t = slug(titular);
	const f = fad && /^\d{4}-\d{2}-\d{2}/.test(fad) ? fad.slice(0, 10) : dayjs().format("YYYY-MM-DD");
	return `haber-de-caja${t ? `-${t}` : ""}-${f}.pdf`;
};

/** Renderiza el PDF y dispara la descarga. Devuelve true si se descargó; muestra un snackbar si falla. */
export async function descargarPdfHaberCaja({
	entrada,
	resultado,
	datos,
	serie,
	nombreArchivo,
}: DescargarPdfHaberCajaParams): Promise<boolean> {
	if (!resultado || !entrada?.fechas?.fad) {
		enqueueSnackbar("Este cálculo no tiene el detalle necesario para generar el PDF", { variant: "warning" });
		return false;
	}
	try {
		const blob = await pdf(
			createElement(HaberCajaPDF, {
				entrada,
				resultado,
				serie: serie?.filas?.length ? serie : null,
				datos: { ...datos, emitido: dayjs().format("DD/MM/YYYY") },
			}) as unknown as ReactElement<ComponentProps<typeof Document>>,
		).toBlob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = nombreArchivo || nombreArchivoHaberCaja(datos.titular, entrada.fechas.fad);
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
		return true;
	} catch (e) {
		console.error("No se pudo generar el PDF del haber de caja", e);
		enqueueSnackbar("No se pudo generar el PDF. Probá de nuevo en unos segundos.", { variant: "error" });
		return false;
	}
}
