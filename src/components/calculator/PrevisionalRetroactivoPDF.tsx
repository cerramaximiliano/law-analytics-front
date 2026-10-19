import React from "react";
import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import logoLawAnalytics from "assets/images/large_logo_transparent.png";
import type { FilaRetroactivo, RetroactivoInput, RetroactivoResultado } from "services/previsionalService";
import { descripcionPercibidoManual, importeHaber } from "services/previsionalService";
import { armarBloquesTramos, labelTipoPago, TramoBloque } from "utils/previsionalTramos";

// Planilla del retroactivo previsional (diferencias de haberes mes a mes con intereses).
// Página 1 (vertical): datos del reclamo, totales (o saldos a la fecha de cierre si hay pagos) y avisos.
// Páginas siguientes (horizontal): sin pagos, el detalle mes a mes con la cabecera repetida en cada hoja; con
// pagos, una hoja por tramo (tabla mensual cortada en el mes del pago + cuadro "Detalle", como lo presentan
// los liquidadores) y un anexo con los pagos ingresados y el remanente del último pago.
// Si el hub emitió un código de validación, la página 1 lleva el QR hacia lawanalytics.app/validar/<código> y el pie
// de todas las hojas repite el código.

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

export interface ValidacionPdf {
	codigo: string;
	url: string;
	/** QR de `url` como data URI PNG. */
	qr: string;
	/** Fecha y hora de emisión ya formateadas (DD/MM/AAAA HH:mm). */
	emitidoEn: string;
}

interface Props {
	resultado: RetroactivoResultado;
	input: RetroactivoInput;
	datos: DatosPdfRetroactivo;
	validacion?: ValidacionPdf | null;
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
	logo: { width: 110, marginBottom: 10 },
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
	tituloTramo: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 2 },
	detalle: { marginTop: 10, width: "62%" },
	detalleTitulo: { fontSize: 8.5, fontFamily: "Helvetica-Bold", marginBottom: 3 },
	detalleCab: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#6b7280",
		paddingVertical: 3,
		fontFamily: "Helvetica-Bold",
		backgroundColor: "#f3f4f6",
	},
	detalleFila: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#d1d5db", paddingVertical: 3 },
	detalleSaldo: {
		flexDirection: "row",
		paddingVertical: 4,
		fontFamily: "Helvetica-Bold",
		borderTopWidth: 1,
		borderTopColor: "#111827",
		backgroundColor: "#f3f4f6",
	},
	detalleConcepto: { flex: 2.6, paddingRight: 4 },
	detalleMonto: { flex: 1, textAlign: "right", paddingRight: 3 },
	negativo: { color: "#b91c1c" },
	saldosCab: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#6b7280",
		paddingVertical: 3,
		fontFamily: "Helvetica-Bold",
		backgroundColor: "#f3f4f6",
		fontSize: 8.5,
	},
	saldosFila: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#d1d5db" },
	saldosCelda: { flex: 1, textAlign: "right", paddingRight: 3 },
	saldosFuerte: { flex: 1.15, textAlign: "right", paddingRight: 3, fontFamily: "Helvetica-Bold" },
	validacion: {
		flexDirection: "row",
		marginTop: 12,
		padding: 8,
		borderWidth: 0.75,
		borderColor: "#9ca3af",
		borderRadius: 3,
	},
	validacionQr: { width: 80, height: 80, marginRight: 10 },
	validacionTexto: { flex: 1, justifyContent: "center" },
	validacionTitulo: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 3 },
	validacionCodigo: { fontSize: 15, fontFamily: "Courier-Bold", letterSpacing: 1, marginBottom: 3 },
	validacionDato: { fontSize: 8.5, color: "#374151", marginBottom: 1.5 },
	validacionNota: { fontSize: 8, color: "#4b5563", marginTop: 3, lineHeight: 1.3 },
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

const PrevisionalRetroactivoPDF = ({ resultado: r, input, datos, validacion }: Props) => {
	const filas = r.filas || [];
	const ultimoPeriodo = filas.length ? filas[filas.length - 1].periodo : r.haberReajustado?.periodo;
	const conTope = filas.some((f) => f.quitaTope);
	const conBono = filas.some((f) => f.bonoPercibido || f.bonoReclamado);
	const bonoAparte = conBono && r.bono?.tratamiento !== "integrado";
	const conVillanustre = filas.some((f) => f.limiteVillanustre);
	const villanustre = r.villanustre || input.villanustre || null;
	const bloques = armarBloquesTramos(r);
	const conPagos = bloques.tramos.length > 0;
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
	const notaCapital = `Importes en pesos. Capital = diferencia${conTope ? " menos la quita por tope" : ""}${
		conVillanustre ? " menos lo que excede el límite Villanustre (* el haber computado es el límite; (P) con pauta salarial)" : ""
	}${bonoAparte ? " más la diferencia de bono" : ""} + SAC - obra social.`;

	const Pie = () => (
		<Text
			style={s.pie}
			fixed
			render={({ pageNumber, totalPages }) =>
				`Generado con Law||Analytics · lawanalytics.app · ${datos.emitido}${
					validacion ? ` · Código de validación ${validacion.codigo}` : ""
				} · Página ${pageNumber} de ${totalPages}`
			}
		/>
	);

	const CabeceraMensual = () => (
		<View style={s.cab} fixed>
			<Text style={s.celdaPeriodo}>Período</Text>
			<Text style={s.derecha}>Percibido</Text>
			<Text style={s.derecha}>Reclamado</Text>
			<Text style={s.derecha}>Diferencia</Text>
			{conTope && <Text style={s.derecha}>Quita tope</Text>}
			{conVillanustre && <Text style={s.derecha}>Límite Villanustre</Text>}
			{conBono && <Text style={s.derecha}>Bono percibido</Text>}
			{conBono && <Text style={s.derecha}>Bono reclamado</Text>}
			<Text style={s.derecha}>SAC</Text>
			<Text style={s.derecha}>Obra social</Text>
			{bonoAparte && <Text style={s.derecha}>Dif. de bono</Text>}
			<Text style={s.derecha}>Capital</Text>
			<Text style={s.derecha}>Interés</Text>
		</View>
	);

	const FilaMensual = ({ f }: { f: FilaRetroactivo }) => (
		<View style={s.fila} wrap={false}>
			<Text style={s.celdaPeriodo}>{mes(f.periodo)}</Text>
			<Text style={s.derecha}>{importe(f.percibido)}</Text>
			<Text style={s.derecha}>{importe(f.reclamado)}</Text>
			<Text style={s.derecha}>{importe(f.diferencia)}</Text>
			{conTope && <Text style={s.derecha}>{importeOGuion(f.quitaTope)}</Text>}
			{conVillanustre && (
				<Text style={s.derecha}>
					{f.limiteVillanustre ? `${f.quitaVillanustre ? "* " : ""}${importe(f.limiteVillanustre)}${f.pautaSalarial ? " (P)" : ""}` : "-"}
				</Text>
			)}
			{conBono && <Text style={s.derecha}>{importeOGuion(f.bonoPercibido)}</Text>}
			{conBono && <Text style={s.derecha}>{importeOGuion(f.bonoReclamado)}</Text>}
			<Text style={s.derecha}>{importeOGuion(f.sac)}</Text>
			<Text style={s.derecha}>{importeOGuion(f.obraSocial)}</Text>
			{bonoAparte && <Text style={s.derecha}>{importeOGuion(f.diferenciaBono)}</Text>}
			<Text style={s.derecha}>{importe(f.capital)}</Text>
			<Text style={s.derecha}>{importe(f.interes)}</Text>
		</View>
	);

	const FilaSuma = ({ label, capital, interes }: { label: string; capital: number; interes: number }) => (
		<View style={s.totalFila} wrap={false}>
			<Text style={s.celdaPeriodo}>{label}</Text>
			<Text style={s.derecha} />
			<Text style={s.derecha} />
			<Text style={s.derecha} />
			{conTope && <Text style={s.derecha} />}
			{conVillanustre && <Text style={s.derecha} />}
			{conBono && <Text style={s.derecha} />}
			{conBono && <Text style={s.derecha} />}
			<Text style={s.derecha} />
			<Text style={s.derecha} />
			{bonoAparte && <Text style={s.derecha} />}
			<Text style={s.derecha}>{importe(capital)}</Text>
			<Text style={s.derecha}>{importe(interes)}</Text>
		</View>
	);

	// Cuadro "Detalle" del tramo: no se parte entre hojas
	const CuadroDetalle = ({ tramo }: { tramo: TramoBloque }) => (
		<View style={s.detalle} wrap={false}>
			<Text style={s.detalleTitulo}>Detalle del tramo {tramo.indice + 1}</Text>
			<View style={s.detalleCab}>
				<Text style={s.detalleConcepto}>Concepto</Text>
				<Text style={s.detalleMonto}>Capital</Text>
				<Text style={s.detalleMonto}>Intereses</Text>
				<Text style={s.detalleMonto}>Total</Text>
			</View>
			{tramo.detalle.map((d) => (
				<View key={d.label} style={[d.negrita ? s.detalleSaldo : s.detalleFila, d.negativo ? s.negativo : {}]}>
					<Text style={s.detalleConcepto}>{d.label}</Text>
					<Text style={s.detalleMonto}>{d.capital === null ? "-" : money(d.capital)}</Text>
					<Text style={s.detalleMonto}>{money(d.intereses)}</Text>
					<Text style={s.detalleMonto}>{money(d.total)}</Text>
				</View>
			))}
		</View>
	);

	return (
		<Document title={tituloDoc} author="Law||Analytics">
			<Page size="A4" style={s.page}>
				<Image src={logoLawAnalytics} style={s.logo} />
				<Text style={s.titulo}>Retroactivo previsional</Text>
				{datos.titular ? <Text style={{ fontSize: 11, marginBottom: 2 }}>{datos.titular}</Text> : null}
				<Text style={s.sub}>
					{encabezado ? `${encabezado} · ` : ""}Emitido el {datos.emitido}
				</Text>

				<Text style={s.seccion}>Datos del reclamo</Text>
				<KV
					k="Haber percibido"
					v={
						descripcionPercibidoManual(input.percibido) ||
						`${importeHaber(input.percibido, money)} al ${fecha(input.percibido.fecha)}${
							input.percibido.piso && PISOS[input.percibido.piso] ? ` (${PISOS[input.percibido.piso]})` : ""
						}`
					}
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
				<KV k="Haber reclamado" v={`${importeHaber(input.reclamado, money)} al ${fecha(input.reclamado.fecha)}`} />
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
							tope.maximoBadaro ? `haber máximo movido con la movilidad del fallo Badaro desde el ${fecha(tope.maximoBadaro.desde)}` : null,
						]
							.filter(Boolean)
							.join(", ")}
					/>
				)}
				{villanustre && (
					<KV
						k="Tope Villanustre"
						v={`el haber computado no supera el ${numero(villanustre.porcentaje)} % del salario de actividad${
							villanustre.pautaSalarial ? "; meses sin salario cargado por la pauta salarial objetiva (Circular 70/14)" : ""
						}. Salarios: ${villanustre.salarios.map((x) => `${importe(x.importe)} desde el ${fecha(x.fecha)}`).join("; ")}`}
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
				{(r.pagos || []).length > 0 && (
					<KV
						k="Pagos a cuenta"
						v={r.pagos.map((p) => `${money(p.importe)} el ${fecha(p.fecha)} (${labelTipoPago(p.tipo).toLowerCase()})`).join("; ")}
					/>
				)}

				{conPagos ? (
					<>
						<Text style={s.seccion}>Saldos a la fecha de cierre</Text>
						<View wrap={false}>
							<View style={s.saldosCab}>
								<Text style={s.saldosCelda}>Capital</Text>
								<Text style={s.saldosCelda}>Intereses</Text>
								<Text style={s.saldosCelda}>Total</Text>
								<Text style={s.saldosCelda}>Pagado</Text>
								<Text style={s.saldosFuerte}>Saldo al {fecha(r.consolidacion)}</Text>
							</View>
							<View style={s.saldosFila}>
								<Text style={s.saldosCelda}>{money(r.totales.capital)}</Text>
								<Text style={s.saldosCelda}>{money(r.totales.intereses)}</Text>
								<Text style={s.saldosCelda}>{money(r.totales.total)}</Text>
								<Text style={s.saldosCelda}>{money(-r.totales.pagado)}</Text>
								<Text style={s.saldosFuerte}>{money(r.totales.saldo)}</Text>
							</View>
						</View>
						<Text style={s.nota}>
							Capital: diferencias de haberes del período. Intereses: los de cada mes hasta el corte de su tramo más los devengados por el
							saldo impago después de cada pago. La liquidación por tramos de las hojas siguientes llega a este saldo.
						</Text>
					</>
				) : (
					<>
						<Text style={s.seccion}>Totales</Text>
						<FilaMonto concepto="Capital (diferencias netas)" monto={r.totales.capital} />
						<FilaMonto concepto={`Intereses al ${fecha(r.consolidacion)}`} monto={r.totales.intereses} />
						<FilaMonto concepto="Saldo" monto={r.totales.saldo} negrita />
					</>
				)}
				<Text style={s.nota}>
					Haber reajustado al cierre ({mes(r.haberReajustado.periodo)}): {money(r.haberReajustado.reclamado)} · haber percibido:{" "}
					{money(r.haberReajustado.percibido)}.
				</Text>
				{validacion && (
					<View style={s.validacion} wrap={false}>
						<Image src={validacion.qr} style={s.validacionQr} />
						<View style={s.validacionTexto}>
							<Text style={s.validacionTitulo}>Validación del documento</Text>
							<Text style={s.validacionCodigo}>{validacion.codigo}</Text>
							<Text style={s.validacionDato}>{validacion.url}</Text>
							<Text style={s.validacionDato}>Emitido el {validacion.emitidoEn}</Text>
							<Text style={s.validacionNota}>
								Escaneá el código o ingresá en lawanalytics.app/validar para comprobar que los totales de este documento coinciden con los
								emitidos por Law||Analytics.
							</Text>
						</View>
					</View>
				)}

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

			{conPagos ? (
				<>
					{bloques.tramos.map((t) => {
						const pago = t.corte.pago;
						const sumaCapitalTramo = t.filas.reduce((acc, f) => acc + (f.capital || 0), 0);
						const sumaInteresTramo = t.filas.reduce((acc, f) => acc + (f.interes || 0), 0);
						return (
							<Page key={t.indice} size="A4" orientation="landscape" style={s.pageLandscape}>
								<Text style={s.tituloTramo}>
									Tramo {t.indice + 1} · {mes(t.desde)} a {mes(t.hasta.slice(0, 7))}
									{pago ? ` · corte por pago del ${fecha(pago.fecha)}` : ` · hasta el cierre del ${fecha(t.hasta)}`}
								</Text>
								<Text style={s.notaTabla}>
									{notaCapital} Interés de cada mes calculado hasta el {fecha(t.hasta)} ({tasaTexto}).
								</Text>
								{t.filas.length > 0 ? (
									<>
										<CabeceraMensual />
										{t.filas.map((f) => (
											<FilaMensual key={f.periodo} f={f} />
										))}
										<FilaSuma label="Suma del tramo" capital={sumaCapitalTramo} interes={sumaInteresTramo} />
									</>
								) : (
									<Text style={s.notaTabla}>Sin diferencias mensuales en este tramo.</Text>
								)}
								<CuadroDetalle tramo={t} />
								<Pie />
							</Page>
						);
					})}

					<Page size="A4" orientation="landscape" style={s.pageLandscape}>
						<Text style={s.tituloTramo}>Pagos ingresados a la liquidación</Text>
						<Text style={s.notaTabla}>
							Cada pago cancela primero los intereses devengados hasta su fecha y el resto se imputa a capital. El saldo que queda sigue
							devengando intereses hasta el pago siguiente o la fecha de cierre.
						</Text>
						<View style={s.cab}>
							<Text style={s.celda}>Fecha</Text>
							<Text style={[s.celda, { flex: 2 }]}>Tipo</Text>
							<Text style={s.derecha}>Importe</Text>
							<Text style={s.derecha}>Imputado a intereses</Text>
							<Text style={s.derecha}>Imputado a capital</Text>
							<Text style={s.derecha}>Saldo luego del pago</Text>
						</View>
						{bloques.pagos.map((p, i) => (
							<View style={s.fila} key={`${p.fecha}-${i}`} wrap={false}>
								<Text style={s.celda}>{fecha(p.fecha)}</Text>
								<Text style={[s.celda, { flex: 2 }]}>{p.label}</Text>
								<Text style={s.derecha}>{money(p.importe)}</Text>
								<Text style={s.derecha}>{money(p.imputadoInteres)}</Text>
								<Text style={s.derecha}>{money(p.imputadoCapital)}</Text>
								<Text style={s.derecha}>{money(p.saldoLuego)}</Text>
							</View>
						))}
						{bloques.remanente && (
							<Text style={[s.nota, { fontSize: 8 }]}>
								Remanente del último pago actualizado al {fecha(bloques.remanente.hasta)}: {money(bloques.remanente.saldoLuego)} + intereses
								sobre ese saldo {money(bloques.remanente.interesesPosteriores)} = {money(bloques.remanente.actualizado)}.
							</Text>
						)}
						<Pie />
					</Page>
				</>
			) : (
				<Page size="A4" orientation="landscape" style={s.pageLandscape}>
					<Text style={s.seccionTabla}>Detalle mes a mes ({filas.length} meses)</Text>
					<Text style={s.notaTabla}>
						{notaCapital} Interés calculado desde cada mes hasta el {fecha(r.consolidacion)} ({tasaTexto}).
					</Text>
					<CabeceraMensual />
					{filas.map((f) => (
						<FilaMensual key={f.periodo} f={f} />
					))}
					<FilaSuma label="Totales" capital={sumaCapital} interes={sumaInteres} />
					<Pie />
				</Page>
			)}
		</Document>
	);
};

export default PrevisionalRetroactivoPDF;
