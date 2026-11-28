import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// material-ui
import {
	Alert,
	AlertTitle,
	Box,
	Button,
	Divider,
	Grid,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material";

// third-party
import { enqueueSnackbar } from "notistack";

// project-imports
import dayjs from "utils/dayjs-config";
import { dispatch, useSelector } from "store";
import { addCalculator, updateCalculator } from "store/reducers/calculator";
import { useTeam } from "contexts/TeamContext";
import useSubscription from "hooks/useSubscription";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import {
	etiquetaPrestacion,
	HaberCajaInput,
	HaberCajaRespuesta,
	normalizarPeriodo,
	serieMensualHaberCaja,
	SerieMensualHaberCaja,
} from "services/haberCajaService";
import { descargarPdfHaberCaja } from "utils/haberCajaPdf";
import { HaberCajaValues, titularDe } from "sections/forms/wizard/calc-previsional/haber-caja/formModel/haberCajaFormModel";
import {
	precargaRetroactivoDesdeHaberCaja,
	SUBCLASE_HABER_CAJA,
} from "sections/forms/wizard/calc-previsional/haber-caja/formModel/valoresDesdeGuardado";

// assets
import { ArrowRight, DocumentDownload, Save2 } from "iconsax-react";

/** Haber de caja guardado que se está editando (ver `?edit=` en la página). */
export interface HaberCajaEnEdicion {
	id: string;
	fecha?: string;
	titular?: string;
}

interface Props {
	respuesta: HaberCajaRespuesta;
	/** Entrada que armó la pantalla (respaldo si el hub no devuelve la suya). */
	input: HaberCajaInput;
	/** Valores del formulario con los que se calculó. */
	values: HaberCajaValues;
	enEdicion?: HaberCajaEnEdicion | null;
	onGuardado?: (modo: "actualizado" | "nuevo") => void;
}

const pesos = (n: number | null | undefined) =>
	n === null || n === undefined || Number.isNaN(n)
		? "-"
		: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);
const numero = (n: number | null | undefined) =>
	n === null || n === undefined || Number.isNaN(n)
		? "-"
		: new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const mesLegible = (p?: string | null) => (p && /^\d{4}-\d{2}/.test(p) ? `${p.slice(5, 7)}/${p.slice(0, 4)}` : p || "-");
const mensajeDeError = (e: any, respaldo: string) => e?.response?.data?.mensaje || e?.mensaje || e?.message || respaldo;

/** Ruta de la calculadora de retroactivo; la precarga viaja en el `state` de la navegación. */
export const RUTA_RETROACTIVO = "/apps/calc/previsional";

export default function HaberCajaResultado({ respuesta, input, values, enEdicion, onGuardado }: Props) {
	const navigate = useNavigate();
	const user = useSelector((state: any) => state.auth.user);
	const { getRequestHeaders } = useTeam();
	const { subscription } = useSubscription();
	const [guardando, setGuardando] = useState<"nuevo" | "cambios" | null>(null);
	const [guardadoId, setGuardadoId] = useState<string | null>(null);
	const [limite, setLimite] = useState<{ message: string; limitInfo?: any } | null>(null);
	// Serie mensual: el haber evolucionado mes a mes (anexo «Movilidad del haber mensual»); la genera el usuario con su rango
	const [serie, setSerie] = useState<SerieMensualHaberCaja | null>(null);
	const [serieDesde, setSerieDesde] = useState("");
	const [serieHasta, setSerieHasta] = useState("");
	const [cargandoSerie, setCargandoSerie] = useState(false);
	const [errorSerie, setErrorSerie] = useState<string | null>(null);
	const [descargando, setDescargando] = useState(false);
	const [yendoAlRetroactivo, setYendoAlRetroactivo] = useState(false);

	const r = respuesta.resultado;
	const titular = titularDe(values);
	const filas = r.remuneraciones?.filas || [];
	const rentas = r.rentas?.filas || [];
	const entradaDelMotor = respuesta.entrada || input;
	const prestacion = values.prestacion === "jubilacion" && values.anticipada ? "anticipada" : values.prestacion;
	const nombrePrestacion = etiquetaPrestacion(prestacion) + (r.pensionDerivada ? " · pensión derivada" : "");
	const hayTopes = filas.some((f) => f.topeArt9 !== null || f.topeArt14 !== null || f.topeSimultaneo !== null);
	const haySimultaneos = filas.some((f) => f.topeSimultaneo !== null && f.topeSimultaneo !== undefined);

	// formato de `calculationResult` que leen el listado general de cálculos y las variables calculo.*
	const calculationResult = useMemo(
		() => ({
			reclamo: [
				{ key: "Prestación", value: nombrePrestacion },
				{ key: "Adquisición del derecho", value: values.fad ? dayjs(values.fad).format("DD/MM/YYYY") : "-" },
				{ key: "Haber valuado en", value: mesLegible(r.mesValuacion) },
			],
			indemnizacion: [
				...(r.retiroInvalidez
					? [
							{
								key: `Prestación de referencia (${r.retiroInvalidez.pctReferencia} % del ingreso base)`,
								value: r.retiroInvalidez.prestacionReferencia,
							},
					  ]
					: [
							{ key: "PBU", value: r.PBU },
							{ key: "PC", value: r.PC },
							{ key: "PAP", value: r.PAP },
					  ]),
				...(r.suplemento ? [{ key: "Suplemento por movilidad", value: r.suplemento }] : []),
				...(r.zonaAustral ? [{ key: "Zona austral", value: r.zonaAustral }] : []),
				{ key: "Haber de caja", value: r.haber },
				...(r.pensionDerivada
					? [
							{
								key: `Pensión derivada (${r.pensionDerivada.porcentaje} %) a ${mesLegible(r.pensionDerivada.mes)}`,
								value: r.pensionDerivada.haberConMinimo,
							},
					  ]
					: []),
			],
			liquidacion: [],
			multas: [],
			otros: [
				{ key: "Promedio de remuneraciones (W)", value: r.W },
				...(r.R ? [{ key: "Promedio de rentas de autónomos (R)", value: r.R }] : []),
			],
			intereses: [],
		}),
		[r, nombrePrestacion, values.fad],
	);

	const armarVariables = () => ({
		calculationResult,
		// la entrada tal como la recibió el motor (con la moneda de cada fila) y su resultado completo
		input: entradaDelMotor,
		resultado: r,
		// la serie mensual, si el usuario la generó (el retroactivo encadenado guarda además los percibidos que tomó de ella)
		...(serie ? { serieMensual: serie } : {}),
		datosVersion: respuesta.datosVersion,
		programa: respuesta.programa,
		datosExpediente: {
			reclamante: titular || null,
			prestacion,
			fechaAdquisicion: values.fad || null,
			fechaAlta: values.alta || null,
		},
		formulario: values,
	});

	const comunes = () => ({
		amount: r.haber,
		capital: r.haber,
		interest: 0,
		user: titular || user?.name || "Usuario",
		variables: armarVariables(),
	});

	const guardar = async () => {
		const userId = user?._id || user?.id;
		if (!userId) return enqueueSnackbar("No se encontró el usuario", { variant: "error" });
		setGuardando("nuevo");
		const res: any = await dispatch(
			addCalculator(
				{
					userId,
					date: dayjs().format("YYYY-MM-DD"),
					type: "Calculado",
					classType: "previsional",
					subClassType: SUBCLASE_HABER_CAJA,
					// primer eslabón de la cadena haber de caja → haber de reajuste → retroactivo
					cadenaPrevisional: {},
					...comunes(),
					...(values.folderId ? { folderId: values.folderId, folderName: values.folderName } : {}),
				} as any,
				{ headers: getRequestHeaders() },
			),
		);
		setGuardando(null);
		if (res?.success) {
			setGuardadoId(res.calculator?._id || null);
			enqueueSnackbar(enEdicion ? "Guardado como nuevo cálculo" : "Haber de caja guardado", { variant: "success" });
			if (enEdicion) onGuardado?.("nuevo");
		} else if (res?.status === 403 && res?.limitInfo) {
			// Límite de cálculos del plan: el hub lo rechaza en el POST
			setLimite({ message: res.error || "Alcanzaste el límite de cálculos de tu plan.", limitInfo: res.limitInfo });
		} else enqueueSnackbar(res?.error || "No se pudo guardar el cálculo", { variant: "error" });
	};

	const guardarCambios = async () => {
		if (!enEdicion) return;
		setGuardando("cambios");
		const res: any = await dispatch(
			updateCalculator(enEdicion.id, {
				...comunes(),
				folderId: values.folderId || null,
				folderName: values.folderId ? values.folderName || null : null,
			} as any),
		);
		setGuardando(null);
		if (res?.success) {
			setGuardadoId(enEdicion.id);
			enqueueSnackbar("Haber de caja actualizado", { variant: "success" });
			onGuardado?.("actualizado");
		} else enqueueSnackbar(res?.error || "No se pudieron guardar los cambios", { variant: "error" });
	};

	const rangoSerie = () => {
		const desde = serieDesde.trim() ? normalizarPeriodo(serieDesde) : null;
		const hasta = serieHasta.trim() ? normalizarPeriodo(serieHasta) : null;
		if ((serieDesde.trim() && !desde) || (serieHasta.trim() && !hasta)) return "Escribí los meses como MM/AAAA";
		if (desde && hasta && hasta < desde) return "El hasta es anterior al desde";
		return { ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) };
	};
	const generarSerie = async () => {
		const rango = rangoSerie();
		if (typeof rango === "string") return setErrorSerie(rango);
		setErrorSerie(null);
		setCargandoSerie(true);
		try {
			setSerie(await serieMensualHaberCaja(entradaDelMotor, rango));
		} catch (e: any) {
			setErrorSerie(mensajeDeError(e, "No se pudo generar la serie mensual"));
		} finally {
			setCargandoSerie(false);
		}
	};

	const descargarPdf = async () => {
		setDescargando(true);
		await descargarPdfHaberCaja({
			entrada: entradaDelMotor as any,
			resultado: r as any,
			serie,
			datos: { titular: titular || null, carpeta: values.folderId ? values.folderName || null : null },
		});
		setDescargando(false);
	};

	// Encadenar con el retroactivo: los percibidos del retroactivo son la serie mensual del haber de caja (desde el primer
	// haber hasta el último mes con datos; el desde y el hasta del reclamo se eligen allá). Si el haber de caja está
	// guardado, el retroactivo queda vinculado a él. Si la serie no se puede traer, pasa solo el haber, como haber pagado.
	const idVinculable = guardadoId;
	const irAlRetroactivo = async () => {
		setYendoAlRetroactivo(true);
		let completa: SerieMensualHaberCaja | null = null;
		try {
			completa = await serieMensualHaberCaja(entradaDelMotor);
		} catch (e: any) {
			enqueueSnackbar(
				`No se pudo traer la serie mensual (${mensajeDeError(
					e,
					"error del servidor",
				)}): el retroactivo arranca solo con el haber de caja como haber pagado.`,
				{ variant: "warning" },
			);
		}
		setYendoAlRetroactivo(false);
		const precarga = precargaRetroactivoDesdeHaberCaja(r, values, idVinculable, completa);
		navigate(RUTA_RETROACTIVO + (values.folderId ? `?folder=${values.folderId}` : ""), { state: { desdeHaberCaja: precarga } });
	};

	const tarjetasInvalidez: [string, number, string | null][] = r.retiroInvalidez
		? [
				[
					"Ingreso base",
					r.retiroInvalidez.ingresoBase,
					r.remuneraciones ? `Suma ${numero(r.remuneraciones.suma)} ÷ ${r.remuneraciones.divisor}` : null,
				],
				[
					"Prestación de referencia",
					r.retiroInvalidez.prestacionReferencia,
					`${numero(r.retiroInvalidez.pctReferencia)} % del ingreso base (${r.retiroInvalidez.norma})`,
				],
		  ]
		: [];
	const tarjetasHaber: [string, number, string | null][] = [
		[
			"Promedio de remuneraciones (W)",
			r.W,
			r.remuneraciones ? `Suma ${numero(r.remuneraciones.suma)} ÷ ${r.remuneraciones.divisor}` : null,
		],
		...(r.R
			? ([
					[
						"Promedio de rentas de autónomos (R)",
						r.R,
						r.rentas ? `Rentas a ${mesLegible(r.rentas.mesTabla)} · ${r.rentas.meses} meses` : null,
					],
			  ] as [string, number, string | null][])
			: []),
		[
			"PBU",
			r.PBU,
			r.edadAvanzada
				? `${r.edadAvanzada.pbuPct} % de la PBU (edad avanzada)`
				: [r.pbuDetalle, r.anios && r.anios.pbu > 30 ? `${Math.min(r.anios.pbu - 30, 15)} años excedentes de 30` : null]
						.filter(Boolean)
						.join(" · ") || null,
		],
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
	];
	const tarjetas = r.retiroInvalidez ? tarjetasInvalidez : tarjetasHaber;
	const serieConUnico = !!serie?.filas.some((f) => f.haberBase);

	return (
		<Box>
			<Divider sx={{ mb: 3 }} />
			<LimitErrorModal
				open={!!limite}
				onClose={() => setLimite(null)}
				message={limite?.message || ""}
				limitInfo={limite?.limitInfo}
				featureInfo={{ feature: "Cálculos guardados", plan: subscription?.plan || "free", availableIn: ["standard", "pro", "premium"] }}
				upgradeRequired={true}
			/>
			<Typography variant="h5" sx={{ mb: 0.5 }}>
				Resultado
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				{r.regimen?.descripcion ? `${r.regimen.descripcion}. ` : ""}
				{nombrePrestacion}. Remuneraciones actualizadas a {mesLegible(r.ancla)}. Haber valuado en {mesLegible(r.mesValuacion)}.
				{r.anticipada ? ` Prestación anticipada al ${r.anticipada.porcentaje} %.` : ""}
			</Typography>

			<Grid container spacing={2}>
				{tarjetas.map(([titulo, valor, detalle]) => (
					<Grid item xs={12} sm={6} md={tarjetas.length > 4 ? 2.4 : 3} key={titulo}>
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
								{!!r.zonaAustral && (
									<Typography variant="body2" color="text.secondary">
										Incluye bonificación por zona austral: {pesos(r.zonaAustral)}
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
				{r.pensionDerivada && (
					<Grid item xs={12}>
						<Paper variant="outlined" sx={{ p: 2 }}>
							<Typography variant="caption" color="text.secondary">
								Pensión derivada · {numero(r.pensionDerivada.porcentaje)} % del haber del causante desde {mesLegible(r.pensionDerivada.mes)}{" "}
								({r.pensionDerivada.norma})
							</Typography>
							<Typography variant="body1" sx={{ mt: 0.5 }}>
								PBU {pesos(r.pensionDerivada.PBU)} · PC {pesos(r.pensionDerivada.PC)} · PAP {pesos(r.pensionDerivada.PAP)} · Haber{" "}
								<strong>{pesos(r.pensionDerivada.haberConMinimo)}</strong>
								{r.pensionDerivada.complementoMinimo
									? ` (con el complemento al haber mínimo: ${pesos(r.pensionDerivada.complementoMinimo)})`
									: ""}
							</Typography>
						</Paper>
					</Grid>
				)}
				{r.alAcuerdo && (
					<Grid item xs={12}>
						<Paper variant="outlined" sx={{ p: 2 }}>
							<Typography variant="caption" color="text.secondary">
								Al mes de acuerdo · {mesLegible(r.alAcuerdo.mes)} (lo que imprime la constancia de ANSES)
							</Typography>
							<Typography variant="body1" sx={{ mt: 0.5 }}>
								PBU {pesos(r.alAcuerdo.PBU)} · PC {pesos(r.alAcuerdo.PC)} · PAP {pesos(r.alAcuerdo.PAP)} · Haber{" "}
								<strong>{pesos(r.alAcuerdo.haber)}</strong>
							</Typography>
						</Paper>
					</Grid>
				)}
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

			{/* Guardar y encadenar */}
			<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="flex-end" alignItems={{ sm: "center" }} sx={{ mt: 2 }}>
				{!idVinculable && (
					<Typography variant="caption" color="text.secondary" sx={{ mr: "auto" }}>
						Guardá el haber de caja para que el retroactivo quede vinculado a él.
					</Typography>
				)}
				{enEdicion && (
					<Button variant="contained" startIcon={<Save2 size={18} />} onClick={guardarCambios} disabled={!!guardando}>
						{guardando === "cambios" ? "Guardando…" : "Guardar cambios"}
					</Button>
				)}
				<Button
					variant={enEdicion ? "outlined" : "contained"}
					startIcon={<Save2 size={18} />}
					onClick={guardar}
					disabled={!!guardando || (!enEdicion && !!guardadoId)}
				>
					{guardando === "nuevo" ? "Guardando…" : enEdicion ? "Guardar como nuevo" : guardadoId ? "Guardado" : "Guardar"}
				</Button>
				<Button
					variant="outlined"
					color="secondary"
					startIcon={<DocumentDownload size={18} />}
					onClick={descargarPdf}
					disabled={descargando}
					sx={{ textTransform: "none" }}
				>
					{descargando ? "Generando PDF…" : "Descargar PDF"}
				</Button>
				<Button
					variant="outlined"
					color="secondary"
					endIcon={<ArrowRight size={18} />}
					onClick={irAlRetroactivo}
					disabled={!!guardando || yendoAlRetroactivo}
				>
					{yendoAlRetroactivo ? "Armando la serie…" : "Usar en el retroactivo"}
				</Button>
			</Stack>

			{/* Serie mensual: el haber evolucionado mes a mes (lo que el retroactivo toma como haber percibido de cada mes) */}
			<Box sx={{ mt: 3 }}>
				<Typography variant="h5" sx={{ mb: 0.5 }}>
					Serie mensual del haber
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
					El haber de caja evolucionado mes a mes con todas las movilidades desde el primer haber. Cada mensual es el haber percibido de ese
					mes: «Usar en el retroactivo» lleva la serie completa y allá elegís desde y hasta cuándo se reclama.
				</Typography>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-start" }}>
					<TextField
						size="small"
						label="Desde"
						placeholder={mesLegible(r.mesParametros || r.mesValuacion)}
						value={serieDesde}
						onChange={(e) => setSerieDesde(e.target.value)}
						InputLabelProps={{ shrink: true }}
						inputProps={{ "aria-label": "Serie mensual desde" }}
						helperText="MM/AAAA. Vacío: el primer haber"
					/>
					<TextField
						size="small"
						label="Hasta"
						placeholder="Último mes"
						value={serieHasta}
						onChange={(e) => setSerieHasta(e.target.value)}
						InputLabelProps={{ shrink: true }}
						inputProps={{ "aria-label": "Serie mensual hasta" }}
						helperText="MM/AAAA. Vacío: el último mes con datos"
					/>
					<Button variant="outlined" onClick={generarSerie} disabled={cargandoSerie} sx={{ textTransform: "none", mt: { sm: 0.25 } }}>
						{cargandoSerie ? "Generando…" : serie ? "Volver a generar" : "Generar la serie mensual"}
					</Button>
				</Stack>
				{errorSerie && (
					<Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setErrorSerie(null)}>
						{errorSerie}
					</Alert>
				)}
				{serie && (
					<Box sx={{ mt: 1.5 }}>
						{serie.avisos?.length > 0 && (
							<Alert severity="info" sx={{ mb: 1.5 }}>
								{serie.avisos.map((a, i) => (
									<div key={i}>{a}</div>
								))}
							</Alert>
						)}
						<TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
							<Table size="small" stickyHeader aria-label="Serie mensual del haber">
								<TableHead>
									<TableRow>
										<TableCell>Mes</TableCell>
										{serieConUnico ? (
											<TableCell align="right">Haber</TableCell>
										) : (
											<>
												<TableCell align="right">PBU</TableCell>
												<TableCell align="right">PC</TableCell>
												<TableCell align="right">PAP</TableCell>
											</>
										)}
										<TableCell align="right">Suplementos</TableCell>
										<TableCell align="right">Haber puro</TableCell>
										<TableCell align="right">Tope máximo</TableCell>
										<TableCell align="right">Compl. mínimo</TableCell>
										<TableCell align="right">Haber al pago</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{serie.filas.map((f) => (
										<TableRow key={f.mes} hover title={f.cambio || undefined}>
											<TableCell sx={{ whiteSpace: "nowrap" }}>
												{mesLegible(f.mes)}
												{f.pensionDerivada ? " · pensión" : ""}
											</TableCell>
											{serieConUnico ? (
												<TableCell align="right">{numero(f.haberBase)}</TableCell>
											) : (
												<>
													<TableCell align="right">{numero(f.PBU)}</TableCell>
													<TableCell align="right">{numero(f.PC)}</TableCell>
													<TableCell align="right">{numero(f.PAP)}</TableCell>
												</>
											)}
											<TableCell align="right">{numero((f.suplemento || 0) + (f.sumaFija || 0))}</TableCell>
											<TableCell align="right">{numero(f.haberPuro)}</TableCell>
											<TableCell align="right">{f.descuentoMaximo ? numero(-f.descuentoMaximo) : "-"}</TableCell>
											<TableCell align="right">{f.complementoMinimo ? numero(f.complementoMinimo) : "-"}</TableCell>
											<TableCell align="right">
												<strong>{numero(f.haberAlPago)}</strong>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
						<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
							{serie.filas.length} {serie.filas.length === 1 ? "mes" : "meses"}, de {mesLegible(serie.desde)} a {mesLegible(serie.hasta)}.
							Haber al pago: bruto del mes con el máximo y el mínimo aplicados, sin el descuento de obra social (lo calcula el retroactivo).
							{serie.minimo82
								? " El mínimo incluye la garantía del 82 % del salario mínimo (Ley 27.426), por los 30 años de servicios."
								: ""}
							{" La serie se guarda con el cálculo y sale en el PDF."}
						</Typography>
					</Box>
				)}
			</Box>

			{rentas.length > 0 && (
				<Box sx={{ mt: 3 }}>
					<Typography variant="h5" sx={{ mb: 1.5 }}>
						Rentas de autónomos
					</Typography>
					<TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell>Desde</TableCell>
									<TableCell>Hasta</TableCell>
									<TableCell>Categoría</TableCell>
									<TableCell>Se computa como</TableCell>
									<TableCell align="right">Meses</TableCell>
									<TableCell align="right">Renta</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{rentas.map((f, i) => (
									<TableRow key={`${f.desde}-${i}`} hover>
										<TableCell>{mesLegible(f.desde)}</TableCell>
										<TableCell>{mesLegible(f.hasta)}</TableCell>
										<TableCell>{f.categoria}</TableCell>
										<TableCell>{f.categoriaComputable || "-"}</TableCell>
										<TableCell align="right">{f.meses}</TableCell>
										<TableCell align="right">{numero(f.renta)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</Box>
			)}

			{filas.length > 0 && (
				<Box sx={{ mt: 3 }}>
					<Typography variant="h5" sx={{ mb: 1.5 }}>
						Remuneraciones actualizadas
					</Typography>
					<TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 480 }}>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell>Período</TableCell>
									<TableCell align="right">Importe en pesos</TableCell>
									{hayTopes && <TableCell align="right">Tope art. 9</TableCell>}
									<TableCell align="right">Actualizada</TableCell>
									{hayTopes && <TableCell align="right">Tope art. 14</TableCell>}
									{haySimultaneos && <TableCell align="right">Tope simultáneos</TableCell>}
								</TableRow>
							</TableHead>
							<TableBody>
								{filas.map((f, i) => (
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
	);
}
