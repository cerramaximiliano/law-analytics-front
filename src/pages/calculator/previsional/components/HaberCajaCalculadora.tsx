import React, { ClipboardEvent, useMemo, useRef, useState } from "react";

// material-ui
import {
	Alert,
	AlertTitle,
	Box,
	Button,
	CircularProgress,
	Divider,
	Grid,
	IconButton,
	InputAdornment,
	MenuItem,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";

// project-imports
import {
	calcularHaberCaja,
	HaberCajaInput,
	HaberCajaRespuesta,
	leerFilasPegadas,
	leerImporte,
	normalizarPeriodo,
	PrestacionHaberCaja,
	ProgramaHaberCaja,
	TiempoAMD,
} from "services/haberCajaService";
import useSubscription from "hooks/useSubscription";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";

// assets
import { Add, Calculator, Trash } from "iconsax-react";

// Misma feature paga que el retroactivo previsional: el hub responde 403 con upgradeRequired si el plan no la tiene
const FEATURE = "calculoPrevisional";
// El motor calcula para FAD desde la vigencia de la Ley 24.241
const INICIO_LEY_24241 = "1994-07";

// ---- estado del formulario ----

interface FilaRemuneracion {
	id: number;
	periodo: string;
	importe: string;
}
interface TiempoTexto {
	a: string;
	m: string;
	d: string;
}
interface Formulario {
	prestacion: PrestacionHaberCaja;
	programa: ProgramaHaberCaja;
	porcentajePension: string;
	fad: string;
	cese: string;
	solicitud: string;
	alta: string;
	antes: TiempoTexto;
	despues: TiempoTexto;
}
type Errores = Partial<Record<"fad" | "cese" | "solicitud" | "alta" | "porcentajePension" | "servicios" | "remuneraciones", string>>;

const TIEMPO_VACIO: TiempoTexto = { a: "", m: "", d: "" };
const FORMULARIO_INICIAL: Formulario = {
	prestacion: "jubilacion",
	programa: "ansesPrpa",
	porcentajePension: "",
	fad: "",
	cese: "",
	solicitud: "",
	alta: "",
	antes: { ...TIEMPO_VACIO },
	despues: { ...TIEMPO_VACIO },
};
const FILAS_INICIALES = 3;

// ---- formato ----

const pesos = (n: number | null | undefined) =>
	n === null || n === undefined || Number.isNaN(n)
		? "-"
		: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);
const numero = (n: number | null | undefined) =>
	n === null || n === undefined || Number.isNaN(n)
		? "-"
		: new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const mesLegible = (p?: string | null) => (p && /^\d{4}-\d{2}/.test(p) ? `${p.slice(5, 7)}/${p.slice(0, 4)}` : p || "-");

const entero = (t: string) => {
	const n = Number(String(t).trim());
	return Number.isInteger(n) && n >= 0 ? n : NaN;
};
/** Años, meses y días del formulario → { a, m, d }; null si hay un valor inválido. */
function tiempoDe(t: TiempoTexto): TiempoAMD | null {
	const a = t.a.trim() ? entero(t.a) : 0;
	const m = t.m.trim() ? entero(t.m) : 0;
	const d = t.d.trim() ? entero(t.d) : 0;
	if ([a, m, d].some(Number.isNaN) || m > 11 || d > 30) return null;
	return { a, m, d };
}
const tiempoVacio = (t: TiempoAMD | null) => !t || !(t.a || t.m || t.d);

// ==============================|| HABER DE CAJA: FORMULARIO Y RESULTADO ||============================== //

export default function HaberCajaCalculadora() {
	const [form, setForm] = useState<Formulario>(FORMULARIO_INICIAL);
	const siguienteId = useRef(FILAS_INICIALES);
	const [filas, setFilas] = useState<FilaRemuneracion[]>(() =>
		Array.from({ length: FILAS_INICIALES }, (_, i) => ({ id: i, periodo: "", importe: "" })),
	);
	const [errores, setErrores] = useState<Errores>({});
	const [avisoPegado, setAvisoPegado] = useState<string | null>(null);
	const [cargando, setCargando] = useState(false);
	const [errorCalculo, setErrorCalculo] = useState<string | null>(null);
	const [respuesta, setRespuesta] = useState<HaberCajaRespuesta | null>(null);
	const [mejorarPlan, setMejorarPlan] = useState(false);
	const { subscription, hasFeatureLocal } = useSubscription();
	// Sin suscripción cargada todavía no se bloquea: decide el hub
	const sinAcceso = !!subscription && !hasFeatureLocal(FEATURE);

	const esPension = form.prestacion === "pension";
	const filasCargadas = useMemo(() => filas.filter((f) => f.periodo.trim() || f.importe.trim()), [filas]);

	const cambiar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
		setForm((prev) => ({ ...prev, [campo]: valor }));
		setErrores((prev) => ({ ...prev, [campo]: undefined }));
	};
	const cambiarTiempo = (tramo: "antes" | "despues", campo: keyof TiempoTexto, valor: string) => {
		setForm((prev) => ({ ...prev, [tramo]: { ...prev[tramo], [campo]: valor.replace(/\D/g, "") } }));
		setErrores((prev) => ({ ...prev, servicios: undefined }));
	};

	// ---- grilla de remuneraciones ----

	const nuevaFila = (periodo = "", importe = ""): FilaRemuneracion => ({ id: siguienteId.current++, periodo, importe });
	const agregarFila = () => setFilas((prev) => [...prev, nuevaFila()]);
	const quitarFila = (id: number) => setFilas((prev) => (prev.length > 1 ? prev.filter((f) => f.id !== id) : [nuevaFila()]));
	const cambiarFila = (id: number, campo: "periodo" | "importe", valor: string) => {
		setFilas((prev) => prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)));
		setErrores((prev) => ({ ...prev, remuneraciones: undefined }));
	};
	const vaciarFilas = () => {
		setFilas([nuevaFila()]);
		setAvisoPegado(null);
	};

	// Pegado desde una planilla: si el texto trae varias celdas (tabulaciones o saltos de línea) se convierte en filas;
	// si es un valor suelto se deja que el campo lo pegue como siempre.
	const pegar = (e: ClipboardEvent<HTMLDivElement>) => {
		const texto = e.clipboardData.getData("text/plain");
		if (!/[\t\n]/.test(texto.trim())) return;
		e.preventDefault();
		const { filas: pegadas, descartadas } = leerFilasPegadas(texto);
		if (!pegadas.length) {
			setAvisoPegado("No se pudo leer ninguna fila de lo pegado. Se esperan dos columnas: período (MM/AAAA o AAAA-MM) e importe.");
			return;
		}
		setFilas((prev) => [
			...prev.filter((f) => f.periodo.trim() || f.importe.trim()),
			...pegadas.map((f) => nuevaFila(f.periodo, f.importe)),
		]);
		setErrores((prev) => ({ ...prev, remuneraciones: undefined }));
		setAvisoPegado(
			`Se pegaron ${pegadas.length} ${pegadas.length === 1 ? "fila" : "filas"}` +
				(descartadas
					? ` (${descartadas} ${descartadas === 1 ? "línea descartada" : "líneas descartadas"} por no tener período e importe).`
					: "."),
		);
	};

	// ---- validación y armado de la entrada del motor ----

	function armarEntrada(): { input: HaberCajaInput | null; errores: Errores } {
		const err: Errores = {};
		if (!form.fad) err.fad = "Requerida";
		else if (form.fad.slice(0, 7) < INICIO_LEY_24241) err.fad = "El haber de caja se calcula para FAD desde 7/1994 (Ley 24.241)";
		if (!form.cese && !esPension) err.cese = "Requerida";
		if (!form.solicitud) err.solicitud = "Requerida";
		if (!form.alta) err.alta = "Requerida";

		let porcentajePension: number | undefined;
		if (esPension && form.porcentajePension.trim()) {
			const p = leerImporte(form.porcentajePension);
			if (p === null || p <= 0 || p > 100) err.porcentajePension = "Entre 0 y 100";
			else porcentajePension = p;
		}

		const antes = tiempoDe(form.antes);
		const despues = tiempoDe(form.despues);
		if (!antes || !despues) err.servicios = "Años, meses (0 a 11) y días (0 a 30) en números enteros.";
		else if (tiempoVacio(antes) && tiempoVacio(despues)) err.servicios = "Cargá los servicios en relación de dependencia.";

		const remuneraciones: HaberCajaInput["remuneraciones"] = [];
		const vistos = new Set<string>();
		let invalidas = 0;
		let repetido: string | null = null;
		for (const f of filasCargadas) {
			const periodo = normalizarPeriodo(f.periodo);
			const importe = leerImporte(f.importe);
			if (!periodo || importe === null || importe < 0) {
				invalidas++;
				continue;
			}
			if (vistos.has(periodo)) repetido = repetido || periodo;
			vistos.add(periodo);
			remuneraciones.push({ periodo, importe });
		}
		if (!filasCargadas.length) err.remuneraciones = "Cargá al menos una remuneración.";
		else if (invalidas)
			err.remuneraciones = `${invalidas} ${
				invalidas === 1 ? "fila tiene" : "filas tienen"
			} el período o el importe inválido (período AAAA-MM o MM/AAAA).`;
		else if (repetido) err.remuneraciones = `El período ${mesLegible(repetido)} está repetido.`;

		if (Object.keys(err).length || !antes || !despues) return { input: null, errores: err };
		remuneraciones.sort((x, y) => x.periodo.localeCompare(y.periodo));
		return {
			input: {
				programa: form.programa,
				prestacion: form.prestacion,
				...(porcentajePension !== undefined ? { porcentajePension } : {}),
				fechas: {
					fad: form.fad,
					...(form.cese ? { cese: form.cese } : {}),
					solicitud: form.solicitud,
					alta: form.alta,
				},
				servicios: { n: { antes, despues } },
				remuneraciones,
				// Pendiente: aportes autónomos (`autonomo.periodos` y `servicios.m`)
			},
			errores: err,
		};
	}

	async function calcular() {
		const { input, errores: err } = armarEntrada();
		setErrores(err);
		if (!input) return;
		if (sinAcceso) {
			setMejorarPlan(true);
			return;
		}
		setCargando(true);
		setErrorCalculo(null);
		try {
			const r = await calcularHaberCaja(input);
			if (!r?.resultado) throw new Error("El servidor no devolvió el resultado del cálculo");
			setRespuesta(r);
		} catch (error: any) {
			if (error?.response?.status === 403 && error?.response?.data?.upgradeRequired) {
				setMejorarPlan(true);
				return;
			}
			setRespuesta(null);
			setErrorCalculo(error?.response?.data?.mensaje || error?.mensaje || error?.message || "No se pudo calcular el haber de caja");
		} finally {
			setCargando(false);
		}
	}

	const limpiar = () => {
		setForm(FORMULARIO_INICIAL);
		setFilas(Array.from({ length: FILAS_INICIALES }, () => nuevaFila()));
		setErrores({});
		setAvisoPegado(null);
		setErrorCalculo(null);
		setRespuesta(null);
	};

	// ---- piezas de la vista ----

	const campoFecha = (campo: "fad" | "cese" | "solicitud" | "alta", etiqueta: string, ayuda?: string) => (
		<Grid item xs={12} sm={6} md={3}>
			<TextField
				fullWidth
				type="date"
				label={etiqueta}
				value={form[campo]}
				onChange={(e) => cambiar(campo, e.target.value)}
				InputLabelProps={{ shrink: true }}
				error={!!errores[campo]}
				helperText={errores[campo] || ayuda || " "}
			/>
		</Grid>
	);

	const camposTiempo = (tramo: "antes" | "despues", titulo: string) => (
		<Grid item xs={12} md={6}>
			<Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
				{titulo}
			</Typography>
			<Stack direction="row" spacing={1.5}>
				{(
					[
						["a", "Años"],
						["m", "Meses"],
						["d", "Días"],
					] as const
				).map(([campo, etiqueta]) => (
					<TextField
						key={campo}
						fullWidth
						label={etiqueta}
						value={form[tramo][campo]}
						onChange={(e) => cambiarTiempo(tramo, campo, e.target.value)}
						inputProps={{ inputMode: "numeric", maxLength: 2 }}
						error={!!errores.servicios}
					/>
				))}
			</Stack>
		</Grid>
	);

	const r = respuesta?.resultado;
	const filasResultado = r?.remuneraciones?.filas || [];
	const hayTopes = filasResultado.some((f) => f.topeArt9 !== null || f.topeArt14 !== null || f.topeSimultaneo !== null);
	const haySimultaneos = filasResultado.some((f) => f.topeSimultaneo !== null && f.topeSimultaneo !== undefined);

	return (
		<Stack spacing={3}>
			<Typography variant="body2" color="text.secondary">
				Haber inicial de la Ley 24.241 (PBU + PC + PAP) tal como lo liquida ANSES, a partir de las fechas, los servicios y las
				remuneraciones de la constancia de primeros pagos. FAD desde 7/1994.
			</Typography>

			{sinAcceso && (
				<Alert severity="info">
					El cálculo del haber de caja está disponible en los planes Estándar, Pro y Premium. Podés cargar los datos; para calcular, mejorá
					tu plan.
				</Alert>
			)}
			<LimitErrorModal
				open={mejorarPlan}
				onClose={() => setMejorarPlan(false)}
				message="Para calcular el haber de caja necesitás un plan pago."
				featureInfo={{ feature: "Haber de caja", plan: subscription?.plan || "free", availableIn: ["standard", "pro", "premium"] }}
				upgradeRequired={true}
			/>

			{/* Prestación y fechas */}
			<Box>
				<Typography variant="h5" sx={{ mb: 2 }}>
					Prestación y fechas
				</Typography>
				<Grid container spacing={2}>
					<Grid item xs={12} sm={6} md={3}>
						<TextField
							select
							fullWidth
							label="Prestación"
							value={form.prestacion}
							onChange={(e) => cambiar("prestacion", e.target.value as PrestacionHaberCaja)}
							helperText=" "
						>
							<MenuItem value="jubilacion">Jubilación</MenuItem>
							<MenuItem value="pension">Pensión directa</MenuItem>
						</TextField>
					</Grid>
					{esPension && (
						<Grid item xs={12} sm={6} md={3}>
							<TextField
								fullWidth
								label="Porcentaje de la pensión"
								value={form.porcentajePension}
								onChange={(e) => cambiar("porcentajePension", e.target.value)}
								InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
								inputProps={{ inputMode: "decimal" }}
								error={!!errores.porcentajePension}
								helperText={errores.porcentajePension || "Opcional (p. ej. 70). Vacío: haber del causante."}
							/>
						</Grid>
					)}
					<Grid item xs={12} sm={6} md={3}>
						<TextField
							select
							fullWidth
							label="Criterio de cálculo"
							value={form.programa}
							onChange={(e) => cambiar("programa", e.target.value as ProgramaHaberCaja)}
							helperText="Convenciones de redondeo y de topes"
						>
							<MenuItem value="ansesPrpa">ANSES (primeros pagos)</MenuItem>
							<MenuItem value="bluecorp">BlueCorp</MenuItem>
						</TextField>
					</Grid>
				</Grid>
				<Grid container spacing={2} sx={{ mt: 0 }}>
					{campoFecha("fad", esPension ? "Fecha de fallecimiento (FAD)" : "Adquisición del derecho (FAD)")}
					{campoFecha("cese", "Cese", esPension ? "Opcional en la pensión directa" : undefined)}
					{campoFecha("solicitud", "Solicitud")}
					{campoFecha("alta", "Alta")}
				</Grid>
			</Box>

			<Divider />

			{/* Servicios */}
			<Box>
				<Typography variant="h5" sx={{ mb: 2 }}>
					Servicios en relación de dependencia
				</Typography>
				<Grid container spacing={2}>
					{camposTiempo("antes", "Hasta el 6/1994 (para la PC)")}
					{camposTiempo("despues", "Desde el 7/1994 (para la PAP)")}
				</Grid>
				{errores.servicios && (
					<Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
						{errores.servicios}
					</Typography>
				)}
				{/* Lugar previsto para los servicios y aportes autónomos (pendiente) */}
				<Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
					Servicios y aportes autónomos (categorías por período): todavía no se cargan en esta pantalla. El cálculo toma solo la relación de
					dependencia.
				</Alert>
			</Box>

			<Divider />

			{/* Remuneraciones */}
			<Box>
				<Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" sx={{ mb: 1, gap: 1 }}>
					<Typography variant="h5">Remuneraciones</Typography>
					<Stack direction="row" spacing={1}>
						<Button size="small" color="secondary" onClick={vaciarFilas} disabled={!filasCargadas.length}>
							Vaciar
						</Button>
						<Button size="small" variant="outlined" startIcon={<Add size={16} />} onClick={agregarFila}>
							Agregar fila
						</Button>
					</Stack>
				</Stack>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
					Una fila por mes, en pesos. Podés copiar dos columnas de una planilla (período e importe) y pegarlas sobre la grilla.
				</Typography>
				{avisoPegado && (
					<Alert severity="info" onClose={() => setAvisoPegado(null)} sx={{ mb: 1.5 }}>
						{avisoPegado}
					</Alert>
				)}
				<TableContainer
					component={Paper}
					variant="outlined"
					onPaste={pegar}
					sx={{ maxHeight: 420, borderColor: errores.remuneraciones ? "error.main" : undefined }}
				>
					<Table size="small" stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell sx={{ width: 56 }}>#</TableCell>
								<TableCell>Período</TableCell>
								<TableCell>Importe</TableCell>
								<TableCell sx={{ width: 56 }} />
							</TableRow>
						</TableHead>
						<TableBody>
							{filas.map((f, i) => {
								const periodoMal = !!f.periodo.trim() && !normalizarPeriodo(f.periodo);
								const importeMal = !!f.importe.trim() && leerImporte(f.importe) === null;
								return (
									<TableRow key={f.id}>
										<TableCell sx={{ color: "text.secondary" }}>{i + 1}</TableCell>
										<TableCell>
											<TextField
												fullWidth
												size="small"
												placeholder="AAAA-MM"
												value={f.periodo}
												onChange={(e) => cambiarFila(f.id, "periodo", e.target.value)}
												onBlur={() => {
													const p = normalizarPeriodo(f.periodo);
													if (p && p !== f.periodo) cambiarFila(f.id, "periodo", p);
												}}
												error={periodoMal}
												inputProps={{ "aria-label": `Período de la fila ${i + 1}` }}
											/>
										</TableCell>
										<TableCell>
											<TextField
												fullWidth
												size="small"
												placeholder="0,00"
												value={f.importe}
												onChange={(e) => cambiarFila(f.id, "importe", e.target.value)}
												error={importeMal}
												InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
												inputProps={{ inputMode: "decimal", "aria-label": `Importe de la fila ${i + 1}` }}
											/>
										</TableCell>
										<TableCell align="right">
											<Tooltip title="Quitar fila">
												<IconButton size="small" color="error" onClick={() => quitarFila(f.id)} aria-label={`Quitar la fila ${i + 1}`}>
													<Trash size={16} />
												</IconButton>
											</Tooltip>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
				<Typography variant="caption" color={errores.remuneraciones ? "error" : "text.secondary"} sx={{ display: "block", mt: 1 }}>
					{errores.remuneraciones ||
						`${filasCargadas.length} ${filasCargadas.length === 1 ? "remuneración cargada" : "remuneraciones cargadas"}`}
				</Typography>
			</Box>

			{/* Acciones */}
			<Stack direction="row" spacing={1.5} justifyContent="flex-end">
				<Button color="secondary" onClick={limpiar} disabled={cargando}>
					Limpiar
				</Button>
				<Button
					variant="contained"
					onClick={calcular}
					disabled={cargando}
					startIcon={cargando ? <CircularProgress size={16} color="inherit" /> : <Calculator size={18} />}
				>
					{cargando ? "Calculando…" : "Calcular"}
				</Button>
			</Stack>

			{errorCalculo && (
				<Alert severity="error" onClose={() => setErrorCalculo(null)}>
					<AlertTitle>No se pudo calcular</AlertTitle>
					{errorCalculo}
				</Alert>
			)}

			{/* Resultado */}
			{r && respuesta && (
				<Box sx={{ opacity: cargando ? 0.5 : 1, transition: "opacity 0.2s" }}>
					<Divider sx={{ mb: 3 }} />
					<Typography variant="h5" sx={{ mb: 0.5 }}>
						Resultado
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						{r.regimen?.descripcion ? `${r.regimen.descripcion}. ` : ""}
						Remuneraciones actualizadas a {mesLegible(r.ancla)}. Haber valuado en {mesLegible(r.mesValuacion)}.
					</Typography>

					<Grid container spacing={2}>
						{(
							[
								[
									"Promedio de remuneraciones (W)",
									r.W,
									r.remuneraciones ? `Suma ${numero(r.remuneraciones.suma)} ÷ ${r.remuneraciones.divisor}` : null,
								],
								["PBU", r.PBU, r.pbuDetalle || null],
								[
									"PC",
									r.PC,
									r.topeAplicado
										? `Con el tope del art. 26 (sin tope: ${pesos(r.PCsinTope)})`
										: r.anios
										? `${numero(r.anios.N1computados ?? r.anios.N1)} años`
										: null,
								],
								["PAP", r.PAP, r.anios ? `${numero(r.anios.N2)} años` : null],
							] as [string, number, string | null][]
						).map(([titulo, valor, detalle]) => (
							<Grid item xs={12} sm={6} md={3} key={titulo}>
								<Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
									<Typography variant="caption" color="text.secondary">
										{titulo}
									</Typography>
									<Typography variant="h4" sx={{ mt: 0.5 }}>
										{pesos(valor)}
									</Typography>
									{detalle && (
										<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
											{detalle}
										</Typography>
									)}
								</Paper>
							</Grid>
						))}
						<Grid item xs={12}>
							<Paper variant="outlined" sx={{ p: 2, borderColor: "primary.main", bgcolor: "primary.lighter" }}>
								<Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
									<Box>
										<Typography variant="caption" color="text.secondary">
											Haber de caja · {mesLegible(r.mesValuacion)}
										</Typography>
										<Typography variant="h3">{pesos(r.haber)}</Typography>
									</Box>
									<Box sx={{ textAlign: { sm: "right" } }}>
										{!!r.suplemento && (
											<Typography variant="body2" color="text.secondary">
												Incluye suplemento por movilidad: {pesos(r.suplemento)}
											</Typography>
										)}
										{!!r.descuentoMaximo && (
											<Typography variant="body2" color="text.secondary">
												Topeado al haber máximo ({pesos(r.haberMaximo)})
											</Typography>
										)}
										{!!r.complementoMinimo && (
											<Typography variant="body2" color="text.secondary">
												Con el complemento al haber mínimo: {pesos(r.haberConMinimo)}
											</Typography>
										)}
									</Box>
								</Stack>
							</Paper>
						</Grid>
					</Grid>

					{r.avisos?.length > 0 && (
						<Alert severity="warning" sx={{ mt: 2 }}>
							<AlertTitle>Avisos del cálculo</AlertTitle>
							<Box component="ul" sx={{ m: 0, pl: 2.5 }}>
								{r.avisos.map((a, i) => (
									<li key={i}>{a}</li>
								))}
							</Box>
						</Alert>
					)}

					{filasResultado.length > 0 && (
						<Box sx={{ mt: 3 }}>
							<Typography variant="h5" sx={{ mb: 1.5 }}>
								Remuneraciones actualizadas
							</Typography>
							<TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 480 }}>
								<Table size="small" stickyHeader>
									<TableHead>
										<TableRow>
											<TableCell>Período</TableCell>
											<TableCell align="right">Importe</TableCell>
											{hayTopes && <TableCell align="right">Tope art. 9</TableCell>}
											<TableCell align="right">Actualizada</TableCell>
											{hayTopes && <TableCell align="right">Tope art. 14</TableCell>}
											{haySimultaneos && <TableCell align="right">Tope simultáneos</TableCell>}
										</TableRow>
									</TableHead>
									<TableBody>
										{filasResultado.map((f, i) => (
											<TableRow key={`${f.periodo}-${i}`} hover>
												<TableCell>{mesLegible(f.periodo)}</TableCell>
												<TableCell align="right">{numero(f.importe)}</TableCell>
												{hayTopes && <TableCell align="right">{numero(f.topeArt9)}</TableCell>}
												<TableCell align="right">{numero(f.actualizada)}</TableCell>
												{hayTopes && <TableCell align="right">{numero(f.topeArt14)}</TableCell>}
												{haySimultaneos && <TableCell align="right">{numero(f.topeSimultaneo)}</TableCell>}
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						</Box>
					)}

					<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
						Criterio: {respuesta.programa === "bluecorp" ? "BlueCorp" : "ANSES (primeros pagos)"} · Datos previsionales versión{" "}
						{respuesta.datosVersion}
					</Typography>
				</Box>
			)}
		</Stack>
	);
}
