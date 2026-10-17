import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { RetroactivoInput, RetroactivoResultado } from "services/previsionalService";

// Planilla del retroactivo previsional (diferencias de haberes mes a mes con intereses).
// Página 1 (vertical): datos del reclamo, totales y avisos. Páginas siguientes (horizontal): tramos de pagos
// y detalle mes a mes, con la cabecera repetida en cada hoja.

export interface DatosPdfRetroactivo {
	titular?: string | null;
	expedienteAdmin?: string | null;
	/** Ya resuelta a texto legible ("Jubilación Ordinaria"). */
	prestacion?: string | null;
	carpeta?: string | null;
	/** indiceMovilidad → texto legible. */
	criteriosLabels?: Record<string, string>;
	/** Nombre legible de la tasa; se usa si el motor no mandó `tasa.descripcion`. */
	tasaLabel?: string | null;
	/** tipo de tope → texto legible. */
	topeLabels?: Record<string, string>;
	/** Fecha de emisión ya formateada (DD/MM/AAAA). */
	emitido: string;
}

interface Props {
	resultado: RetroactivoResultado;
	input: RetroactivoInput;
	datos: DatosPdfRetroactivo;
}

const money = (n: number | null | undefined) =>
	n === null || n === undefined || Number.isNaN(n)
		? "-"
		: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);
// En las tablas va sin el signo $ para que entren 12 columnas; el encabezado aclara que son pesos.
const importe = (n: number | null | undefined) =>
	n === null || n === undefined || Number.isNaN(n)
		? "-"
		: new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const importeOGuion = (n: number | null | undefined) => (n ? importe(n) : "-");
const numero = (n: number, d = 2) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: d }).format(n);
/** ISO (YYYY-MM-DD) o DD/MM/YYYY → DD/MM/AAAA. */
const fecha = (f?: string | null) => {
	if (!f) return "-";
	if (/^\d{4}-\d{2}-\d{2}/.test(f)) return `${f.slice(8, 10)}/${f.slice(5, 7)}/${f.slice(0, 4)}`;
	return f;
};
/** YYYY-MM → MM/AAAA. */
const mes = (p?: string | null) => (p && /^\d{4}-\d{2}/.test(p) ? `${p.slice(5, 7)}/${p.slice(0, 4)}` : p || "-");

const s = StyleSheet.create({
	page: { padding: 36, paddingBottom: 48, fontSize: 9.5, fontFamily: "Helvetica", color: "#1f2937" },
	pageLandscape: { padding: 36, paddingBottom: 48, fontSize: 7.5, fontFamily: "Helvetica", color: "#1f2937" },
	titulo: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 2 },
	sub: { fontSize: 9, color: "#4b5563", marginBottom: 10 },
	seccion: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4 },
	seccionTabla: { fontSize: 9.5, fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 4 },
	notaTabla: { fontSize: 7, color: "#6b7280", marginBottom: 4 },
	kv: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", paddingVertical: 3 },
	k: { flex: 1.3, color: "#4b5563", paddingRight: 6 },
	v: { flex: 2.7 },
	fila: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#d1d5db", paddingVertical: 2.5 },
	cab: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#6b7280",
		paddingVertical: 3,
		fontFamily: "Helvetica-Bold",
		backgroundColor: "#f3f4f6",
	},
	celda: { flex: 1, paddingRight: 3 },
	celdaPeriodo: { flex: 0.8, paddingRight: 3 },
	derecha: { flex: 1, textAlign: "right", paddingRight: 3 },
	totalFila: {
		flexDirection: "row",
		paddingVertical: 4,
		fontFamily: "Helvetica-Bold",
		borderTopWidth: 1,
		borderTopColor: "#111827",
		marginTop: 2,
	},
	totalConcepto: { flex: 2.4, paddingRight: 4 },
	totalMonto: { flex: 1, textAlign: "right" },
	filaMonto: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#d1d5db", paddingVertical: 3 },
	nota: { fontSize: 8.5, color: "#374151", marginTop: 2, lineHeight: 1.35 },
	pie: { position: "absolute", bottom: 22, left: 36, right: 36, fontSize: 7.5, color: "#6b7280", textAlign: "center" },
});

const KV = ({ k, v }: { k: string; v: React.ReactNode }) => (
	<View style={s.kv} wrap={false}>
		<Text style={s.k}>{k}</Text>
		<Text style={s.v}>{v}</Text>
	</View>
);

const FilaMonto = ({ concepto, monto, negrita }: { concepto: string; monto: number; negrita?: boolean }) => (
	<View style={negrita ? s.totalFila : s.filaMonto} wrap={false}>
		<Text style={s.totalConcepto}>{concepto}</Text>
		<Text style={s.totalMonto}>{money(monto)}</Text>
	</View>
);

const PISOS: Record<string, string> = {
	minimo: "cobra al menos el haber mínimo",
	minimo82: "cobra al menos el haber mínimo y el suplemento al 82 % del SMVM (ley 27.426)",
};

const EVALUACION_TOPE: Record<string, string> = {
	cadaPeriodo: "evaluado en cada período",
	haberActual: "porcentaje de quita a la fecha de cierre aplicado a todo el período",
};

const PrevisionalRetroactivoPDF = ({ resultado: r, input, datos }: Props) => {
	const filas = r.filas || [];
	const ultimoPeriodo = filas.length ? filas[filas.length - 1].periodo : r.haberReajustado?.periodo;
	const conTope = filas.some((f) => f.quitaTope);
	const conBono = filas.some((f) => f.bonoPercibido || f.bonoReclamado);
	const bonoAparte = conBono && r.bono?.tratamiento !== "integrado";
	const conPagos = (r.pagos || []).length > 0;
	const sumaCapital = filas.reduce((acc, f) => acc + (f.capital || 0), 0);
	const sumaInteres = filas.reduce((acc, f) => acc + (f.interes || 0), 0);
	const tasaTexto = r.tasa?.descripcion || datos.tasaLabel || r.tasa?.tipo || "-";
	const criterios = input.reclamado?.criterios || [];
	const reajustes = input.percibido?.reajustes || (input.percibido?.reajuste ? [input.percibido.reajuste] : []);
	const tope = input.tope && input.tope.tipo && input.tope.tipo !== "no" ? input.tope : null;
	const pension = input.reclamado?.pension;
	const bono = r.bono && (r.bono.percibido || r.bono.reclamado) ? r.bono : null;
	const encabezado = [datos.expedienteAdmin && `Expediente ${datos.expedienteAdmin}`, datos.prestacion, datos.carpeta]
		.filter(Boolean)
		.join(" · ");
	const tituloDoc = datos.titular ? `Retroactivo previsional - ${datos.titular}` : "Retroactivo previsional";

	const Pie = () => (
		<Text
			style={s.pie}
			fixed
			render={({ pageNumber, totalPages }) =>
				`Generado con Law||Analytics · lawanalytics.app · ${datos.emitido} · Página ${pageNumber} de ${totalPages}`
			}
		/>
	);

	return (
		<Document title={tituloDoc} author="Law||Analytics">
			<Page size="A4" style={s.page}>
				<Text style={s.titulo}>Retroactivo previsional</Text>
				{datos.titular ? <Text style={{ fontSize: 11, marginBottom: 2 }}>{datos.titular}</Text> : null}
				<Text style={s.sub}>
					{encabezado ? `${encabezado} · ` : ""}Emitido el {datos.emitido}
				</Text>

				<Text style={s.seccion}>Datos del reclamo</Text>
				<KV
					k="Haber percibido"
					v={`${money(input.percibido.importe)} al ${fecha(input.percibido.fecha)}${
						input.percibido.piso && PISOS[input.percibido.piso] ? ` (${PISOS[input.percibido.piso]})` : ""
					}`}
				/>
				{reajustes.length > 0 && (
					<KV
						k="Reajustes administrativos"
						v={reajustes
							.map(
								(rj) =>
									`${money(rj.importe)} desde el ${fecha(rj.fecha)}${
										(rj as any).descuentoPct ? ` (descuento ${numero((rj as any).descuentoPct)} %)` : ""
									}`,
							)
							.join("; ")}
					/>
				)}
				<KV k="Haber reclamado" v={`${money(input.reclamado.importe)} al ${fecha(input.reclamado.fecha)}`} />
				{pension && <KV k="Pensión derivada" v={`${numero(pension.porcentaje)} % del haber desde el ${fecha(pension.fecha)}`} />}
				{input.zonaAustral && <KV k="Zona austral" v="Sí (suma fija de los aumentos por 1,4)" />}
				<KV k="Período de diferencias" v={`${fecha(r.desde)} - ${mes(ultimoPeriodo)}`} />
				<KV k="Fecha de cierre" v={fecha(r.consolidacion)} />
				<KV k="Tasa de interés" v={tasaTexto} />
				{criterios.length > 0 && (
					<KV
						k="Criterios de movilidad"
						v={criterios
							.map((c) => `${(datos.criteriosLabels || {})[c.indiceMovilidad] || c.indiceMovilidad} desde el ${fecha(c.fechaDesde)}`)
							.join("; ")}
					/>
				)}
				{tope && (
					<KV
						k="Tope (art. 9 ley 24.463)"
						v={[
							(datos.topeLabels || {})[tope.tipo] || tope.tipo,
							tope.evaluacion && EVALUACION_TOPE[tope.evaluacion],
							tope.porcentaje ? `quita del ${numero(tope.porcentaje)} %` : null,
							tope.desde || tope.hasta ? `del ${fecha(tope.desde)} al ${fecha(tope.hasta)}` : null,
						]
							.filter(Boolean)
							.join(", ")}
					/>
				)}
				<KV k="SAC" v={input.sac === false ? "No se liquida" : "Se liquida sobre las diferencias"} />
				<KV k="Obra social" v={input.obraSocialPct ? `Descuento INSSJyP (PAMI) del ${numero(input.obraSocialPct)} %` : "Sin descuento"} />
				{bono && (
					<KV
						k="Bono previsional"
						v={`Sobre el haber ${[bono.percibido && "percibido", bono.reclamado && "reclamado"].filter(Boolean).join(" y el ")}, ${
							bono.tratamiento === "integrado" ? "integrado a la diferencia (con SAC y obra social)" : "aparte, sin SAC ni obra social"
						}`}
					/>
				)}
				{conPagos && <KV k="Pagos a cuenta" v={r.pagos.map((p) => `${money(p.importe)} el ${fecha(p.fecha)}`).join("; ")} />}

				<Text style={s.seccion}>Totales</Text>
				<FilaMonto concepto="Capital (diferencias netas)" monto={r.totales.capital} />
				<FilaMonto concepto={`Intereses al ${fecha(r.consolidacion)}`} monto={r.totales.intereses} />
				{r.totales.pagado ? <FilaMonto concepto="Pagos a cuenta" monto={-r.totales.pagado} /> : null}
				<FilaMonto concepto="Saldo" monto={r.totales.saldo} negrita />
				<Text style={s.nota}>
					Haber reajustado al cierre ({mes(r.haberReajustado.periodo)}): {money(r.haberReajustado.reclamado)} · haber percibido:{" "}
					{money(r.haberReajustado.percibido)}.
				</Text>

				{r.avisos && r.avisos.length > 0 && (
					<>
						<Text style={s.seccion}>Avisos del cálculo</Text>
						{r.avisos.map((a, i) => (
							<Text key={i} style={s.nota}>
								• {a}
							</Text>
						))}
					</>
				)}

				<Pie />
			</Page>

			<Page size="A4" orientation="landscape" style={s.pageLandscape}>
				{conPagos && r.tramos && r.tramos.length > 0 && (
					<View>
						<Text style={s.seccionTabla}>Tramos e imputación de pagos</Text>
						<Text style={s.notaTabla}>
							Importes en pesos. Cada pago cancela primero los intereses devengados y el resto se imputa a capital.
						</Text>
						<View style={s.cab} fixed>
							<Text style={s.celda}>Hasta</Text>
							<Text style={s.derecha}>Capital del tramo</Text>
							<Text style={s.derecha}>Intereses del tramo</Text>
							<Text style={s.derecha}>Intereses sobre saldo</Text>
							<Text style={s.derecha}>Pago</Text>
							<Text style={s.derecha}>Imputado a intereses</Text>
							<Text style={s.derecha}>Imputado a capital</Text>
							<Text style={s.derecha}>Saldo de capital</Text>
							<Text style={s.derecha}>Intereses impagos</Text>
						</View>
						{r.tramos.map((t, i) => (
							<View style={s.fila} key={i} wrap={false}>
								<Text style={s.celda}>{fecha(t.hasta)}</Text>
								<Text style={s.derecha}>{importe(t.capitalTramo)}</Text>
								<Text style={s.derecha}>{importe(t.interesTramo)}</Text>
								<Text style={s.derecha}>{importeOGuion(t.interesSobreSaldo)}</Text>
								<Text style={s.derecha}>{importeOGuion(t.pago)}</Text>
								<Text style={s.derecha}>{importeOGuion(t.imputadoInteres)}</Text>
								<Text style={s.derecha}>{importeOGuion(t.imputadoCapital)}</Text>
								<Text style={s.derecha}>{t.saldoCapital !== undefined ? importe(t.saldoCapital) : "-"}</Text>
								<Text style={s.derecha}>{importeOGuion(t.saldoInteres)}</Text>
							</View>
						))}
					</View>
				)}

				<Text style={s.seccionTabla}>Detalle mes a mes ({filas.length} meses)</Text>
				<Text style={s.notaTabla}>
					Importes en pesos. Capital = diferencia{conTope ? " menos la quita por tope" : ""}
					{bonoAparte ? " más la diferencia de bono" : ""} + SAC - obra social. Interés calculado desde cada mes hasta el{" "}
					{fecha(r.consolidacion)} ({tasaTexto}).
				</Text>
				<View style={s.cab} fixed>
					<Text style={s.celdaPeriodo}>Período</Text>
					<Text style={s.derecha}>Percibido</Text>
					<Text style={s.derecha}>Reclamado</Text>
					<Text style={s.derecha}>Diferencia</Text>
					{conTope && <Text style={s.derecha}>Quita tope</Text>}
					{conBono && <Text style={s.derecha}>Bono percibido</Text>}
					{conBono && <Text style={s.derecha}>Bono reclamado</Text>}
					<Text style={s.derecha}>SAC</Text>
					<Text style={s.derecha}>Obra social</Text>
					{bonoAparte && <Text style={s.derecha}>Dif. de bono</Text>}
					<Text style={s.derecha}>Capital</Text>
					<Text style={s.derecha}>Interés</Text>
				</View>
				{filas.map((f) => (
					<View style={s.fila} key={f.periodo} wrap={false}>
						<Text style={s.celdaPeriodo}>{mes(f.periodo)}</Text>
						<Text style={s.derecha}>{importe(f.percibido)}</Text>
						<Text style={s.derecha}>{importe(f.reclamado)}</Text>
						<Text style={s.derecha}>{importe(f.diferencia)}</Text>
						{conTope && <Text style={s.derecha}>{importeOGuion(f.quitaTope)}</Text>}
						{conBono && <Text style={s.derecha}>{importeOGuion(f.bonoPercibido)}</Text>}
						{conBono && <Text style={s.derecha}>{importeOGuion(f.bonoReclamado)}</Text>}
						<Text style={s.derecha}>{importeOGuion(f.sac)}</Text>
						<Text style={s.derecha}>{importeOGuion(f.obraSocial)}</Text>
						{bonoAparte && <Text style={s.derecha}>{importeOGuion(f.diferenciaBono)}</Text>}
						<Text style={s.derecha}>{importe(f.capital)}</Text>
						<Text style={s.derecha}>{importe(f.interes)}</Text>
					</View>
				))}
				<View style={s.totalFila} wrap={false}>
					<Text style={s.celdaPeriodo}>Totales</Text>
					<Text style={s.derecha} />
					<Text style={s.derecha} />
					<Text style={s.derecha} />
					{conTope && <Text style={s.derecha} />}
					{conBono && <Text style={s.derecha} />}
					{conBono && <Text style={s.derecha} />}
					<Text style={s.derecha} />
					<Text style={s.derecha} />
					{bonoAparte && <Text style={s.derecha} />}
					<Text style={s.derecha}>{importe(sumaCapital)}</Text>
					<Text style={s.derecha}>{importe(sumaInteres)}</Text>
				</View>

				<Pie />
			</Page>
		</Document>
	);
};

export default PrevisionalRetroactivoPDF;
