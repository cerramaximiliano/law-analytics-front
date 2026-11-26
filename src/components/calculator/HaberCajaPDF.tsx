import React from "react";
import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import logoLawAnalytics from "assets/images/large_logo_transparent.png";

// Planilla del haber de caja (haber inicial de la Ley 24.241 reconstruido desde la constancia de primeros pagos de ANSES).
// Mismo formato que la planilla del retroactivo previsional (PrevisionalRetroactivoPDF).
// Página 1: datos de la prestación, servicios, resultado por componente (con la comparación contra lo impreso, si se
// cargó) y reglas aplicadas. Páginas siguientes: detalle de remuneraciones por renglón, tal como los imprime ANSES, y
// detalle de aportes autónomos.
// Entrada y salida son las de `calcularHaberCaja` (law-analytics-server/services/haberCajaService.js).

type AMD = { a?: number; m?: number; d?: number };
type Tramo = { antes?: AMD; despues?: AMD };

export interface HaberCajaEntrada {
	prestacion?: string;
	porcentajePension?: number;
	fechas: { fad: string; cese?: string; solicitud?: string; inicialPago?: string; acuerdo?: string; alta?: string };
	periodoPromedio?: { desde: string; hasta: string } | null;
	servicios?: { n?: Tramo; m?: Tramo; p?: Tramo };
	remuneraciones?: { periodo: string; hasta?: string; meses?: number; importe: number; moneda?: string }[];
	autonomo?: { periodos?: { desde: string; hasta: string; categoria: string }[] };
}

export interface HaberCajaResultado {
	regimen: { codigo: string; descripcion: string };
	ancla: string;
	mesParametros?: string;
	W: number;
	R: number;
	PBU: number;
	pbuDetalle?: string;
	PC: number;
	PCsinTope?: number;
	topePC?: number;
	topeAplicado?: boolean;
	PAP: number;
	porcentajes?: { pc: number; pap: number };
	haberPuro: number;
	suplemento?: number;
	zonaAustral?: number;
	haber: number;
	haberMinimo?: number;
	haberMaximo?: number;
	haberConMinimo?: number;
	complementoMinimo?: number;
	anticipada?: { porcentaje: number; norma: string } | null;
	anios: { pbu: number; N1: number; N1computados?: number; N2: number };
	remuneraciones?: {
		filas: {
			periodo: string;
			importe: number;
			topeArt9: number | null;
			actualizada: number;
			topeArt14: number | null;
			topeSimultaneo: number | null;
		}[];
		suma: number;
		divisor: number | string;
		meses: number;
	} | null;
	rentas?: {
		mesTabla: string;
		filas: { desde: string; hasta: string; categoria: string; categoriaComputable?: string; meses: number; renta: number }[];
	} | null;
	reglas?: { id: string; nombre: string; norma: string; valor: unknown; apartaDeNorma?: boolean }[];
	avisos?: string[];
}

/** Lo impreso en la constancia (o en otro programa) para comparar. */
export interface HaberCajaImpreso {
	fuente?: string;
	sumatoria?: number;
	W?: number;
	R?: number;
	PBU?: number;
	PC?: number;
	PAP?: number;
	filas?: { desde: string; hasta: string; actualizada: number }[];
}

export interface DatosPdfHaberCaja {
	titular?: string | null;
	expedienteAdmin?: string | null;
	carpeta?: string | null;
	/** Fecha de emisión ya formateada (DD/MM/AAAA). */
	emitido: string;
}

interface Props {
	entrada: HaberCajaEntrada;
	resultado: HaberCajaResultado;
	datos: DatosPdfHaberCaja;
	impreso?: HaberCajaImpreso | null;
}

const money = (n: number | null | undefined) =>
	n === null || n === undefined || Number.isNaN(n)
		? "-"
		: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);
const importe = (n: number | null | undefined, dec = 2) =>
	n === null || n === undefined || Number.isNaN(n)
		? "-"
		: new Intl.NumberFormat("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
const fecha = (f?: string | null) => (f && /^\d{4}-\d{2}-\d{2}/.test(f) ? `${f.slice(8, 10)}/${f.slice(5, 7)}/${f.slice(0, 4)}` : f || "-");
const mes = (p?: string | null) => (p && /^\d{4}-\d{2}/.test(p) ? `${p.slice(5, 7)}/${p.slice(0, 4)}` : p || "-");
const amd = (t?: AMD) => (t && (t.a || t.m || t.d) ? `${t.a || 0} a ${t.m || 0} m ${t.d || 0} d` : "-");
const mesesEntre = (desde: string, hasta: string) =>
	(Number(hasta.slice(0, 4)) - Number(desde.slice(0, 4))) * 12 + Number(hasta.slice(5, 7)) - Number(desde.slice(5, 7)) + 1;
const difPct = (motor: number, impreso?: number) =>
	impreso === undefined || impreso === null
		? "-"
		: impreso === 0
		? motor
			? "-"
			: "0,0000 %"
		: `${importe(Math.abs(motor / impreso - 1) * 100, 4)} %`;

const PRESTACIONES: Record<string, string> = { jubilacion: "Jubilación ordinaria (Ley 24.241)", pension: "Pensión (Ley 24.241)" };
const MONEDAS: Record<string, string> = {
	PESOS: "Pesos",
	AUSTR: "Australes",
	"$ ARG": "Pesos argentinos",
	pesos: "Pesos",
	australes: "Australes",
	pesosArgentinos: "Pesos argentinos",
	pesosLey18188: "Pesos ley 18.188",
	pesosMonedaNacional: "Moneda nacional",
};

const VALORES_REGLA: Record<string, string> = {
	empleador: "Por empleador",
	mes: "Por mes",
	meses: "Meses con remuneración (hasta 120)",
	periodo: "Período impreso por ANSES",
	ultimos120: "Últimos 120 meses",
	todas: "Todas las filas",
	promedioIndice: "Promedio del índice del renglón",
	partesIguales: "Partes iguales",
	proporcional: "Proporcional",
	solicitud: "Fecha de solicitud",
	alta: "Fecha de alta",
	cesacion: "Mes de la cesación",
	acuerdo: "Mes del acuerdo",
	mesSiguiente: "Mes siguiente a la cesación",
	"420": "420 meses",
};
const valorRegla = (v: unknown) => (v === true ? "Sí" : v === false ? "No" : VALORES_REGLA[String(v)] || String(v));

const s = StyleSheet.create({
	page: { padding: 36, paddingBottom: 48, fontSize: 9.5, fontFamily: "Helvetica", color: "#1f2937" },
	pageTabla: { padding: 36, paddingBottom: 48, fontSize: 8, fontFamily: "Helvetica", color: "#1f2937" },
	logo: { width: 110, marginBottom: 10 },
	titulo: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 2 },
	sub: { fontSize: 9, color: "#4b5563", marginBottom: 10 },
	seccion: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4 },
	seccionTabla: { fontSize: 9.5, fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 4 },
	notaTabla: { fontSize: 7, color: "#6b7280", marginBottom: 4, lineHeight: 1.3 },
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
	totalFila: {
		flexDirection: "row",
		paddingVertical: 4,
		fontFamily: "Helvetica-Bold",
		borderTopWidth: 1,
		borderTopColor: "#111827",
		marginTop: 2,
	},
	celda: { flex: 1, paddingRight: 3 },
	celdaAncha: { flex: 2.2, paddingRight: 3 },
	derecha: { flex: 1, textAlign: "right", paddingRight: 3 },
	centro: { flex: 0.6, textAlign: "center", paddingRight: 3 },
	ok: { color: "#047857" },
	mal: { color: "#b91c1c" },
	nota: { fontSize: 8.5, color: "#374151", marginTop: 2, lineHeight: 1.35 },
	pie: { position: "absolute", bottom: 22, left: 36, right: 36, fontSize: 7.5, color: "#6b7280", textAlign: "center" },
});

const KV = ({ k, v }: { k: string; v: React.ReactNode }) => (
	<View style={s.kv} wrap={false}>
		<Text style={s.k}>{k}</Text>
		<Text style={s.v}>{v}</Text>
	</View>
);

const TOLERANCIA = 1e-4; // 0,01 %, criterio de cierre del motor

const HaberCajaPDF = ({ entrada, resultado: r, datos, impreso }: Props) => {
	const f = entrada.fechas || ({} as HaberCajaEntrada["fechas"]);
	const serv = entrada.servicios || {};
	const filasMes = r.remuneraciones?.filas || [];
	const renglones = (entrada.remuneraciones || []).map((x) => {
		const hasta = x.hasta || (x.meses && x.meses > 1 ? null : x.periodo);
		const meses = x.meses || (hasta ? mesesEntre(x.periodo, hasta) : 1);
		const fin =
			hasta ||
			filasMes
				.filter((m) => m.periodo >= x.periodo)
				.slice(0, meses)
				.pop()?.periodo ||
			x.periodo;
		const delRenglon = filasMes.filter((m) => m.periodo >= x.periodo && m.periodo <= fin);
		const actualizada = delRenglon.reduce((a, m) => a + (m.actualizada || 0), 0);
		const topes = [
			delRenglon.some((m) => m.topeArt9 !== null) && "art. 9",
			delRenglon.some((m) => m.topeArt14 !== null) && "art. 14",
			delRenglon.some((m) => m.topeSimultaneo !== null) && "simult.",
		].filter(Boolean);
		const imp = impreso?.filas?.find((i) => i.desde === x.periodo);
		return {
			desde: x.periodo,
			hasta: fin,
			meses,
			moneda: x.moneda,
			original: x.importe,
			actualizada,
			topes: topes.join(", "),
			impreso: imp?.actualizada,
		};
	});
	const conImpresoFilas = renglones.some((x) => x.impreso !== undefined);
	const sumaImpresaFilas = renglones.reduce((a, x) => a + (x.impreso || 0), 0);
	const fuente = impreso?.fuente || "constancia de ANSES";
	const encabezado = [datos.expedienteAdmin && `Expediente ${datos.expedienteAdmin}`, datos.carpeta].filter(Boolean).join(" · ");
	const tituloDoc = datos.titular ? `Haber de caja - ${datos.titular}` : "Haber de caja";

	const componentes: { k: keyof HaberCajaImpreso; label: string; motor: number }[] = [
		{ k: "sumatoria", label: "Sumatoria de remuneraciones actualizadas", motor: r.remuneraciones?.suma || 0 },
		{ k: "W", label: "Promedio de remuneraciones (W)", motor: r.W },
		{ k: "R", label: "Promedio de rentas de autónomo (R)", motor: r.R },
		{ k: "PBU", label: "Prestación Básica Universal (PBU)", motor: r.PBU },
		{ k: "PC", label: "Prestación Compensatoria (PC)", motor: r.PC },
		{ k: "PAP", label: "Prestación Adicional por Permanencia (PAP)", motor: r.PAP },
	];

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
				<Image src={logoLawAnalytics} style={s.logo} />
				<Text style={s.titulo}>Haber de caja</Text>
				{datos.titular ? <Text style={{ fontSize: 11, marginBottom: 2 }}>{datos.titular}</Text> : null}
				<Text style={s.sub}>
					{encabezado ? `${encabezado} · ` : ""}Haber inicial de la Ley 24.241 reconstruido desde la constancia de primeros pagos · Emitido
					el {datos.emitido}
				</Text>

				<Text style={s.seccion}>Datos de la prestación</Text>
				<KV
					k="Prestación"
					v={`${PRESTACIONES[entrada.prestacion || "jubilacion"] || entrada.prestacion}${
						entrada.prestacion === "pension" && entrada.porcentajePension ? ` (${entrada.porcentajePension} %)` : ""
					}${r.anticipada ? ` · anticipada al ${r.anticipada.porcentaje} % (${r.anticipada.norma})` : ""}`}
				/>
				<KV k="Adquisición del derecho (FAD)" v={fecha(f.fad)} />
				<KV k="Cese / cierre de cómputo" v={fecha(f.cese)} />
				<KV k="Solicitud" v={fecha(f.solicitud)} />
				{f.inicialPago ? <KV k="Fecha inicial de pago" v={fecha(f.inicialPago)} /> : null}
				{f.acuerdo ? <KV k="Acuerdo" v={fecha(f.acuerdo)} /> : null}
				<KV k="Alta al mensual" v={fecha(f.alta)} />
				<KV k="Índice de actualización" v={r.regimen.descripcion} />
				<KV k="Remuneraciones actualizadas a" v={`${mes(r.ancla)} (parámetros al ${mes(r.mesParametros || r.ancla)})`} />
				{entrada.periodoPromedio ? (
					<KV k="Período del promedio" v={`${mes(entrada.periodoPromedio.desde)} a ${mes(entrada.periodoPromedio.hasta)}`} />
				) : null}

				<Text style={s.seccion}>Servicios computados</Text>
				<View style={s.cab}>
					<Text style={s.celdaAncha}>Tipo</Text>
					<Text style={s.derecha}>Antes del 7/1994</Text>
					<Text style={s.derecha}>Después del 7/1994</Text>
				</View>
				{[
					["Relación de dependencia", serv.n],
					["Aportes autónomos", serv.m],
					["Aportes simultáneos", serv.p],
				].map(([label, t]) => (
					<View style={s.fila} key={label as string}>
						<Text style={s.celdaAncha}>{label as string}</Text>
						<Text style={s.derecha}>{amd((t as Tramo | undefined)?.antes)}</Text>
						<Text style={s.derecha}>{amd((t as Tramo | undefined)?.despues)}</Text>
					</View>
				))}
				<Text style={s.nota}>
					Años computados: PBU {r.anios.pbu} · PC {r.anios.N1}
					{r.anios.N1computados !== undefined && r.anios.N1computados !== r.anios.N1 ? ` (computados ${r.anios.N1computados})` : ""} · PAP{" "}
					{r.anios.N2}
				</Text>

				<Text style={s.seccion}>Resultado</Text>
				<View style={s.cab}>
					<Text style={s.celdaAncha}>Componente</Text>
					<Text style={s.derecha}>Calculado</Text>
					{impreso ? <Text style={s.derecha}>Impreso</Text> : null}
					{impreso ? <Text style={s.derecha}>Diferencia</Text> : null}
				</View>
				{componentes.map((c) => {
					const imp = impreso ? (impreso[c.k] as number | undefined) : undefined;
					const cierra = imp !== undefined && (imp === 0 ? !c.motor : Math.abs(c.motor / imp - 1) <= TOLERANCIA);
					return (
						<View style={s.fila} key={c.k} wrap={false}>
							<Text style={s.celdaAncha}>{c.label}</Text>
							<Text style={s.derecha}>{importe(c.motor)}</Text>
							{impreso ? <Text style={s.derecha}>{importe(imp)}</Text> : null}
							{impreso ? <Text style={[s.derecha, imp === undefined ? {} : cierra ? s.ok : s.mal]}>{difPct(c.motor, imp)}</Text> : null}
						</View>
					);
				})}
				<View style={s.totalFila} wrap={false}>
					<Text style={s.celdaAncha}>
						Haber (PBU + PC + PAP{r.suplemento ? " + suplemento" : ""}
						{r.zonaAustral ? " + zona austral" : ""})
					</Text>
					<Text style={s.derecha}>{importe(r.haber)}</Text>
					{impreso ? (
						<Text style={s.derecha}>
							{impreso.PBU !== undefined ? importe((impreso.PBU || 0) + (impreso.PC || 0) + (impreso.PAP || 0)) : "-"}
						</Text>
					) : null}
					{impreso ? <Text style={s.derecha} /> : null}
				</View>
				<Text style={s.nota}>
					W: {r.remuneraciones?.meses || 0} meses, divisor {r.remuneraciones?.divisor || "-"}. PC: {r.porcentajes?.pc ?? 1.5} % ×{" "}
					{r.anios.N1} años
					{r.topeAplicado ? ` (con el tope del art. 26: ${money(r.topePC)}; sin tope ${money(r.PCsinTope)})` : ""}. PAP:{" "}
					{r.porcentajes?.pap ?? 1.5} % × {r.anios.N2} años. {r.pbuDetalle ? `${r.pbuDetalle}. ` : ""}
					Haber mínimo {money(r.haberMinimo)} y máximo {money(r.haberMaximo)} al {mes(r.mesParametros || r.ancla)}
					{r.complementoMinimo ? `; con el complemento al mínimo, ${money(r.haberConMinimo)}` : ""}.
					{impreso ? ` Comparado con la ${fuente}; cierra si la diferencia es de hasta 0,01 %.` : ""}
				</Text>

				{(r.avisos || []).length > 0 && (
					<>
						<Text style={s.seccion}>Avisos</Text>
						{(r.avisos || []).map((a, i) => (
							<Text key={i} style={s.nota}>
								• {a}
							</Text>
						))}
					</>
				)}
				<Pie />
			</Page>

			{renglones.length > 0 && (
				<Page size="A4" style={s.pageTabla}>
					<Text style={s.seccionTabla}>Detalle de remuneraciones</Text>
					<Text style={s.notaTabla}>
						Renglones como los imprime ANSES. Los de varios meses se reparten con el promedio del índice. Importe actualizado a{" "}
						{mes(r.ancla)} con {r.regimen.descripcion}; topes aplicados cuando se superan.
					</Text>
					<View style={s.cab} fixed>
						<Text style={s.celda}>Desde</Text>
						<Text style={s.celda}>Hasta</Text>
						<Text style={s.centro}>Meses</Text>
						<Text style={s.celda}>Moneda</Text>
						<Text style={[s.derecha, { flex: 1.5 }]}>Importe original</Text>
						<Text style={[s.derecha, { flex: 1.3 }]}>Actualizado</Text>
						{conImpresoFilas ? <Text style={[s.derecha, { flex: 1.3 }]}>Impreso</Text> : null}
						<Text style={[s.celda, { paddingLeft: 8 }]}>Topes</Text>
					</View>
					{renglones.map((x) => {
						const cierra = x.impreso !== undefined && Math.abs(x.actualizada / x.impreso - 1) <= TOLERANCIA;
						return (
							<View style={s.fila} key={x.desde} wrap={false}>
								<Text style={s.celda}>{mes(x.desde)}</Text>
								<Text style={s.celda}>{mes(x.hasta)}</Text>
								<Text style={s.centro}>{x.meses}</Text>
								<Text style={s.celda}>{MONEDAS[x.moneda || ""] || x.moneda || "-"}</Text>
								<Text style={[s.derecha, { flex: 1.5 }]}>{importe(x.original)}</Text>
								<Text style={[s.derecha, { flex: 1.3 }]}>{importe(x.actualizada)}</Text>
								{conImpresoFilas ? (
									<Text style={[s.derecha, { flex: 1.3 }, x.impreso === undefined ? {} : cierra ? s.ok : s.mal]}>{importe(x.impreso)}</Text>
								) : null}
								<Text style={[s.celda, { paddingLeft: 8 }]}>{x.topes || "-"}</Text>
							</View>
						);
					})}
					<View style={s.totalFila} wrap={false}>
						<Text style={s.celda}>Total</Text>
						<Text style={s.celda} />
						<Text style={s.centro}>{r.remuneraciones?.meses}</Text>
						<Text style={s.celda} />
						<Text style={[s.derecha, { flex: 1.5 }]} />
						<Text style={[s.derecha, { flex: 1.3 }]}>{importe(r.remuneraciones?.suma)}</Text>
						{conImpresoFilas ? <Text style={[s.derecha, { flex: 1.3 }]}>{importe(sumaImpresaFilas)}</Text> : null}
						<Text style={s.celda} />
					</View>
					<Text style={s.nota}>
						W = {importe(r.remuneraciones?.suma)} / {r.remuneraciones?.divisor} = {importe(r.W)}
					</Text>

					{(r.rentas?.filas || []).length > 0 && (
						<View wrap={false}>
							<Text style={[s.seccionTabla, { marginTop: 14 }]}>Detalle de aportes autónomos</Text>
							<Text style={s.notaTabla}>Renta de la categoría computable con la tabla de {mes(r.rentas?.mesTabla)}.</Text>
							<View style={s.cab}>
								<Text style={s.celda}>Desde</Text>
								<Text style={s.celda}>Hasta</Text>
								<Text style={s.celda}>Categoría</Text>
								<Text style={s.centro}>Meses</Text>
								<Text style={s.derecha}>Renta</Text>
								<Text style={s.derecha}>Subtotal</Text>
							</View>
							{(r.rentas?.filas || []).map((x) => (
								<View style={s.fila} key={x.desde}>
									<Text style={s.celda}>{mes(x.desde)}</Text>
									<Text style={s.celda}>{mes(x.hasta)}</Text>
									<Text style={s.celda}>
										{x.categoria}
										{x.categoriaComputable && x.categoriaComputable !== x.categoria ? ` → ${x.categoriaComputable}` : ""}
									</Text>
									<Text style={s.centro}>{x.meses}</Text>
									<Text style={s.derecha}>{importe(x.renta)}</Text>
									<Text style={s.derecha}>{importe(x.renta * x.meses)}</Text>
								</View>
							))}
							<View style={s.totalFila}>
								<Text style={s.celda}>Total</Text>
								<Text style={s.celda} />
								<Text style={s.celda} />
								<Text style={s.centro}>{(r.rentas?.filas || []).reduce((a, x) => a + x.meses, 0)}</Text>
								<Text style={s.derecha} />
								<Text style={s.derecha}>{importe((r.rentas?.filas || []).reduce((a, x) => a + x.renta * x.meses, 0))}</Text>
							</View>
							<Text style={s.nota}>R = {importe(r.R)}</Text>
						</View>
					)}
					{(r.reglas || []).length > 0 && (
						<>
							<Text style={[s.seccionTabla, { marginTop: 14 }]}>Reglas aplicadas</Text>
							<Text style={s.notaTabla}>Cada regla con su norma. «Opción» marca un valor que se aparta de la norma.</Text>
							{(r.reglas || []).map((g) => (
								<View style={s.fila} key={g.id} wrap={false}>
									<Text style={[s.celdaAncha, { flex: 2 }]}>{g.nombre}</Text>
									<Text style={[s.celdaAncha, { flex: 2.2, color: "#4b5563" }]}>{g.norma}</Text>
									<Text style={[s.celda, { flex: 0.9 }, g.apartaDeNorma ? s.mal : {}]}>
										{valorRegla(g.valor)}
										{g.apartaDeNorma ? " (opción)" : ""}
									</Text>
								</View>
							))}
						</>
					)}
					<Pie />
				</Page>
			)}
		</Document>
	);
};

export default HaberCajaPDF;
