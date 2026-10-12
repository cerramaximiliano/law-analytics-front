import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { LiquidacionResultado } from "services/liquidacionService";

// Planilla de liquidación para acompañar el escrito de "practica liquidación".
// Pendiente: revisión del formato por un abogado (backlog la-ads ítem 7, D3).

const money = (n: number | null | undefined) =>
	n === null || n === undefined
		? ""
		: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);
const fecha = (f: string) => (f ? f.slice(8, 10) + "/" + f.slice(5, 7) + "/" + f.slice(0, 4) : "");
const numero = (n: number, d = 2) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: d }).format(n);

const s = StyleSheet.create({
	page: { padding: 36, fontSize: 9.5, fontFamily: "Helvetica", color: "#1f2937" },
	titulo: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 2 },
	sub: { fontSize: 9, color: "#4b5563", marginBottom: 12 },
	seccion: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4 },
	fila: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#d1d5db", paddingVertical: 3 },
	cab: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#6b7280", paddingVertical: 3, fontFamily: "Helvetica-Bold" },
	celda: { flex: 1, paddingRight: 4 },
	celdaAncha: { flex: 2.4, paddingRight: 4 },
	derecha: { flex: 1, textAlign: "right" },
	total: {
		flexDirection: "row",
		paddingVertical: 4,
		fontFamily: "Helvetica-Bold",
		borderTopWidth: 1,
		borderTopColor: "#111827",
		marginTop: 2,
	},
	nota: { fontSize: 8, color: "#4b5563", marginTop: 2 },
	pie: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 7.5, color: "#6b7280", textAlign: "center" },
});

const FilaMonto = ({ concepto, monto, negrita }: { concepto: string; monto: number; negrita?: boolean }) => (
	<View style={negrita ? s.total : s.fila}>
		<Text style={s.celdaAncha}>{concepto}</Text>
		<Text style={s.derecha}>{money(monto)}</Text>
	</View>
);

interface Props {
	resultado: LiquidacionResultado;
	tasasLabels?: Record<string, string>;
	titulo?: string;
	caratula?: string | null;
}

const LiquidacionPDF = ({ resultado: r, tasasLabels = {}, titulo = "Liquidación", caratula }: Props) => (
	<Document title={titulo}>
		<Page size="A4" style={s.page}>
			<Text style={s.titulo}>{titulo}</Text>
			<Text style={s.sub}>
				{caratula ? `${caratula} · ` : ""}Fecha de corte: {fecha(r.fechaCorte)}
			</Text>

			<Text style={s.seccion}>Intereses</Text>
			<View style={s.cab}>
				<Text style={s.celda}>Desde</Text>
				<Text style={s.celda}>Hasta</Text>
				<Text style={s.celdaAncha}>Tasa</Text>
				<Text style={s.derecha}>Capital</Text>
				<Text style={s.derecha}>Intereses</Text>
			</View>
			{r.credito.tramos.map((t: any, i: number) => (
				<View style={s.fila} key={i}>
					<Text style={s.celda}>{fecha(t.desde)}</Text>
					<Text style={s.celda}>{fecha(t.hasta)}</Text>
					<Text style={s.celdaAncha}>
						{t.tipo === "simple" ? `Tasa fija ${numero(t.tasaFija)} %` : tasasLabels[t.tasa] || t.tasa}
						{t.capitalizacion && t.capitalizacion !== "none" ? " (capitalización anual)" : ""}
					</Text>
					<Text style={s.derecha}>{money(t.capital)}</Text>
					<Text style={s.derecha}>{money(t.interesEfectivo)}</Text>
				</View>
			))}

			{r.credito.pagos.length > 0 && (
				<>
					<Text style={s.seccion}>Pagos a cuenta</Text>
					<View style={s.cab}>
						<Text style={s.celda}>Fecha</Text>
						<Text style={s.celdaAncha}>Concepto</Text>
						<Text style={s.derecha}>A intereses</Text>
						<Text style={s.derecha}>A capital</Text>
					</View>
					{r.credito.pagos.map((p, i) => (
						<View style={s.fila} key={i}>
							<Text style={s.celda}>{fecha(p.fecha)}</Text>
							<Text style={s.celdaAncha}>{p.concepto || "Pago a cuenta"}</Text>
							<Text style={s.derecha}>{money(p.aIntereses)}</Text>
							<Text style={s.derecha}>{money(p.aCapital)}</Text>
						</View>
					))}
				</>
			)}

			<Text style={s.seccion}>Crédito</Text>
			<FilaMonto concepto="Capital" monto={r.credito.capitalOriginal} />
			<FilaMonto concepto="Intereses" monto={r.credito.interesesDevengados} />
			{r.credito.totalPagado > 0 && <FilaMonto concepto="Pagos a cuenta" monto={-r.credito.totalPagado} />}
			<FilaMonto concepto="Saldo del crédito" monto={r.totales.credito} negrita />

			{r.honorarios.length > 0 && (
				<>
					<Text style={s.seccion}>Honorarios</Text>
					{r.honorarios.map((h, i) => (
						<View key={i}>
							<FilaMonto
								concepto={`${h.profesional ? h.profesional + " — " : ""}${numero(h.unidades)} ${h.unidad} (${numero(
									h.porcentaje,
								)} % de ${money(h.base)})`}
								monto={h.honorario}
							/>
							{h.iva > 0 && <FilaMonto concepto={`IVA ${h.ivaAlicuota} %`} monto={h.iva} />}
							<Text style={s.nota}>
								{h.norma}, UMA {money(h.valorUnidad)}
								{h.unidadNorma ? ` (${h.unidadNorma})` : ""}
								{h.piso && h.piso.aplicado ? " · piso del art. 21" : ""}
								{h.minimo && h.minimo.aplicado ? ` · mínimo de ${h.minimo.unidades} UMA` : ""}
								{h.ajustes.length ? " · " + h.ajustes.map((a) => a.motivo).join("; ") : ""}
							</Text>
						</View>
					))}
				</>
			)}

			{r.tasaJusticia && (
				<>
					<Text style={s.seccion}>Tasa de justicia</Text>
					<FilaMonto
						concepto={`${numero(r.tasaJusticia.alicuota)} % sobre ${money(r.tasaJusticia.base)} (${r.tasaJusticia.norma})`}
						monto={r.tasaJusticia.bruto}
					/>
					{r.tasaJusticia.yaAbonada > 0 && <FilaMonto concepto="Ya abonada" monto={-r.tasaJusticia.yaAbonada} />}
				</>
			)}

			{r.otros.length > 0 && (
				<>
					<Text style={s.seccion}>Otros conceptos</Text>
					{r.otros.map((o, i) => (
						<FilaMonto key={i} concepto={o.concepto} monto={o.monto} />
					))}
				</>
			)}

			<Text style={s.seccion}>Total</Text>
			<FilaMonto concepto="Total de la liquidación" monto={r.totales.general} negrita />

			{r.avisos.length > 0 && (
				<>
					<Text style={s.seccion}>Observaciones</Text>
					{r.avisos.map((a, i) => (
						<Text key={i} style={s.nota}>
							• {a}
						</Text>
					))}
				</>
			)}

			<Text style={s.pie} fixed>
				Planilla generada con Law||Analytics. Verificá las tasas y criterios con lo dispuesto en la sentencia.
			</Text>
		</Page>
	</Document>
);

export default LiquidacionPDF;
