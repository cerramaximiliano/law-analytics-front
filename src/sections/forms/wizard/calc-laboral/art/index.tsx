import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Alert,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Collapse,
	FormControlLabel,
	Grid,
	MenuItem,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material";
import { Calculator as CalculatorIcon, Save2 } from "iconsax-react";
import { enqueueSnackbar } from "notistack";

import { BRAND_BLUE } from "themes/dashboardTokens";
import dayjs from "utils/dayjs-config";
import { dispatch, useSelector } from "store";
import { addCalculator } from "store/reducers/calculator";
import { useTeam } from "contexts/TeamContext";
import {
	ARTInput,
	ARTResultado,
	calcularART,
	ContingenciaART,
	CRITERIOS_ACTUALIZACION_ART,
	CriterioActualizacionART,
	RemuneracionART,
} from "services/artService";

// Indemnización por riesgos del trabajo (ley 24.557, 26.773 y 27.348). El cálculo es del hub
// (services/artService.js); acá se cargan los datos y se muestra el detalle.

const money = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n);
const numero = (n: number, d = 2) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: d }).format(n);
const fecha = (f: string) => dayjs.utc(f).format("DD/MM/YYYY");
const mesTexto = (p: string) => dayjs.utc(`${p}-01`).format("MM/YYYY");

type FilaRemuneracion = { periodo: string; sac: boolean; monto: string };

/** 12 meses anteriores al de la PMI, con el SAC después de junio y de diciembre. */
function mesesPrevios(fechaPMI: string): FilaRemuneracion[] {
	const pmi = dayjs.utc(fechaPMI);
	if (!pmi.isValid()) return [];
	const filas: FilaRemuneracion[] = [];
	for (let i = 12; i >= 1; i--) {
		const p = pmi.startOf("month").subtract(i, "month");
		filas.push({ periodo: p.format("YYYY-MM"), sac: false, monto: "" });
		if (p.month() === 5 || p.month() === 11) filas.push({ periodo: p.format("YYYY-MM"), sac: true, monto: "" });
	}
	return filas;
}

interface Props {
	folder?: { _id: string; folderName?: string } | null;
}

const ARTWizard = ({ folder }: Props) => {
	const navigate = useNavigate();
	const user = useSelector((state: any) => state.auth.user);
	const { getRequestHeaders } = useTeam();

	const [fechaPMI, setFechaPMI] = useState("");
	const [edad, setEdad] = useState("");
	const [contingencia, setContingencia] = useState<ContingenciaART>("incapacidad");
	const [porcentaje, setPorcentaje] = useState("");
	const [inItinere, setInItinere] = useState(false);
	const [filas, setFilas] = useState<FilaRemuneracion[]>([]);
	const [montoParaTodos, setMontoParaTodos] = useState("");
	const [fechaLiquidacion, setFechaLiquidacion] = useState(dayjs().format("YYYY-MM-DD"));
	const [criterio, setCriterio] = useState<CriterioActualizacionART>("ripte");

	const [calculando, setCalculando] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [resultado, setResultado] = useState<ARTResultado | null>(null);
	const [input, setInput] = useState<ARTInput | null>(null);
	const [verDetalleIBM, setVerDetalleIBM] = useState(false);
	const [guardando, setGuardando] = useState(false);
	const [guardado, setGuardado] = useState(false);

	const cambiarFechaPMI = (f: string) => {
		setFechaPMI(f);
		// conservar lo cargado si el período coincide
		const anteriores = new Map(filas.map((r) => [`${r.periodo}${r.sac ? "S" : ""}`, r.monto]));
		setFilas(mesesPrevios(f).map((r) => ({ ...r, monto: anteriores.get(`${r.periodo}${r.sac ? "S" : ""}`) || "" })));
	};

	const aplicarATodos = () => {
		const m = Number(montoParaTodos);
		if (!(m > 0)) return;
		setFilas(filas.map((r) => ({ ...r, monto: String(r.sac ? Math.round((m / 2) * 100) / 100 : m) })));
	};

	const sumaCargada = useMemo(() => filas.reduce((s, r) => s + (Number(r.monto) || 0), 0), [filas]);

	const calcular = async () => {
		setError(null);
		if (!fechaPMI) return setError("Ingresá la fecha de la primera manifestación invalidante.");
		if (!(Number(edad) > 0)) return setError("Ingresá la edad a la fecha de la PMI.");
		if (contingencia === "incapacidad" && !(Number(porcentaje) > 0 && Number(porcentaje) <= 100))
			return setError("Ingresá el porcentaje de incapacidad (entre 0 y 100).");
		const remuneraciones: RemuneracionART[] = filas
			.filter((r) => Number(r.monto) > 0)
			.map((r) => ({ periodo: r.periodo, monto: Number(r.monto), ...(r.sac ? { sac: true } : {}) }));
		if (!remuneraciones.some((r) => !r.sac)) return setError("Cargá al menos una remuneración mensual.");
		const datos: ARTInput = {
			fechaPMI,
			edad: Math.floor(Number(edad)),
			porcentaje: contingencia === "incapacidad" ? Number(porcentaje) : 100,
			contingencia,
			inItinere,
			remuneraciones,
			fechaLiquidacion: fechaLiquidacion || undefined,
			criterioActualizacion: criterio,
		};
		setCalculando(true);
		try {
			const r = await calcularART(datos);
			setResultado(r);
			setInput(datos);
			setGuardado(false);
		} catch (e: any) {
			setError(e?.response?.data?.mensaje || e?.mensaje || "No se pudo calcular la indemnización.");
		} finally {
			setCalculando(false);
		}
	};

	const itemsGuardados = (r: ARTResultado) => {
		const reclamo = [
			...(folder?.folderName ? [{ key: "caratula", value: folder.folderName }] : []),
			{ key: "Régimen", value: r.regimen },
			{ key: "Fecha de la PMI", value: fecha(r.fechaPMI) },
			{ key: "Edad a la PMI", value: `${r.edad} años` },
			{
				key: "Contingencia",
				value:
					r.contingencia === "incapacidad"
						? `Incapacidad ${numero(r.porcentaje)} %`
						: r.contingencia === "muerte"
						? "Muerte"
						: "Gran invalidez",
			},
			...(r.inItinere ? [{ key: "Accidente", value: "In itinere" }] : []),
		];
		const indemnizacion = [
			{ key: "Ingreso base mensual (art. 12)", value: r.ingresoBase.valor },
			{ key: `Indemnización ${r.articulo}${r.pisoAplicado ? " (piso)" : ""}`, value: r.indemnizacion },
			...(r.compensacion ? [{ key: `Compensación art. 11.4.${r.compensacion.inciso}`, value: r.compensacion.monto }] : []),
			...(r.adicional.procede ? [{ key: "Adicional art. 3 ley 26.773", value: r.adicional.monto }] : []),
			{ key: "Capital a la PMI", value: r.capital },
		];
		const intereses = r.actualizacion
			? [
					{
						key: `Actualización: ${r.actualizacion.descripcion}`,
						value: `${fecha(r.actualizacion.desde)} – ${fecha(r.actualizacion.hasta)}`,
					},
					{ key: "Monto de la actualización", value: r.actualizacion.monto },
					{ key: "Total actualizado", value: r.total },
			  ]
			: [];
		return { reclamo, indemnizacion, liquidacion: [], multas: [], otros: [], intereses };
	};

	const guardar = async () => {
		if (!resultado || !input) return;
		const userId = user?._id || user?.id;
		if (!userId) return enqueueSnackbar("No se encontró el usuario", { variant: "error" });
		setGuardando(true);
		const res: any = await dispatch(
			addCalculator(
				{
					userId,
					date: dayjs().format("YYYY-MM-DD"),
					type: "Calculado",
					classType: "laboral",
					subClassType: "art",
					amount: resultado.total,
					capital: resultado.capital,
					interest: resultado.actualizacion ? resultado.actualizacion.monto : 0,
					user: user?.name || user?.email || "Usuario",
					...(folder?._id ? { folderId: folder._id, folderName: folder.folderName } : {}),
					variables: { calculationResult: itemsGuardados(resultado), input, resultado },
				} as any,
				{ headers: getRequestHeaders() },
			),
		);
		setGuardando(false);
		if (res?.success) {
			setGuardado(true);
			enqueueSnackbar("Cálculo guardado", { variant: "success" });
		} else {
			enqueueSnackbar(res?.error || "No se pudo guardar el cálculo", { variant: "error" });
		}
	};

	const Fila = ({ concepto, monto, fuerte, detalle }: { concepto: string; monto: number; fuerte?: boolean; detalle?: string }) => (
		<TableRow>
			<TableCell sx={{ fontWeight: fuerte ? 700 : 400 }}>
				{concepto}
				{detalle && (
					<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
						{detalle}
					</Typography>
				)}
			</TableCell>
			<TableCell align="right" sx={{ fontWeight: fuerte ? 700 : 400, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
				{money(monto)}
			</TableCell>
		</TableRow>
	);

	if (resultado) {
		const r = resultado;
		return (
			<Box>
				<Stack
					direction={{ xs: "column", sm: "row" }}
					justifyContent="space-between"
					alignItems={{ sm: "center" }}
					spacing={1}
					sx={{ mb: 2 }}
				>
					<Box>
						<Typography sx={{ fontWeight: 600, fontSize: "1.05rem" }}>Indemnización por riesgos del trabajo</Typography>
						<Typography variant="caption" color="text.secondary">
							{r.regimen} · PMI {fecha(r.fechaPMI)} · {r.edad} años
							{r.montosNorma ? ` · pisos y compensaciones: ${r.montosNorma.norma}` : ""}
						</Typography>
					</Box>
					<Stack direction="row" spacing={1}>
						<Button size="small" onClick={() => setResultado(null)} sx={{ textTransform: "none" }}>
							Modificar
						</Button>
						<Button
							size="small"
							variant="outlined"
							sx={{ textTransform: "none" }}
							onClick={() =>
								navigate("/apps/calc/liquidacion", {
									state: {
										liquidacion: {
											capital: r.total,
											segments: [],
											folderId: folder?._id || null,
											folderName: folder?.folderName || null,
											origen: "art",
										},
									},
								})
							}
						>
							Practicar liquidación
						</Button>
						<Button
							size="small"
							variant="contained"
							disabled={guardando || guardado}
							startIcon={guardando ? <CircularProgress size={14} color="inherit" /> : <Save2 size={16} />}
							onClick={guardar}
							sx={{ bgcolor: BRAND_BLUE, textTransform: "none" }}
						>
							{guardado ? "Guardado" : "Guardar"}
						</Button>
					</Stack>
				</Stack>

				{r.avisos.map((a, i) => (
					<Alert severity="warning" key={i} sx={{ mb: 1 }}>
						{a}
					</Alert>
				))}

				<Table size="small">
					<TableBody>
						<Fila
							concepto="Ingreso base mensual (art. 12 ley 24.557)"
							monto={r.ingresoBase.valor}
							detalle={
								r.ingresoBase.metodo === "ley27348"
									? `Promedio de ${r.ingresoBase.meses} meses actualizados por RIPTE al ${mesTexto(
											r.ingresoBase.periodoDestino || "",
									  )} (ley 27.348)`
									: `Suma de remuneraciones / ${r.ingresoBase.dias} días × 30,4 (texto anterior a la ley 27.348)`
							}
						/>
						<TableRow>
							<TableCell colSpan={2} sx={{ py: 0 }}>
								<Button size="small" onClick={() => setVerDetalleIBM(!verDetalleIBM)} sx={{ textTransform: "none", px: 0 }}>
									{verDetalleIBM ? "Ocultar" : "Ver"} remuneraciones
								</Button>
								<Collapse in={verDetalleIBM}>
									<Table size="small" sx={{ mb: 1 }}>
										<TableHead>
											<TableRow>
												<TableCell>Período</TableCell>
												<TableCell align="right">Remuneración</TableCell>
												{r.ingresoBase.metodo === "ley27348" && <TableCell align="right">Coeficiente RIPTE</TableCell>}
												{r.ingresoBase.metodo === "ley27348" && <TableCell align="right">Actualizada</TableCell>}
											</TableRow>
										</TableHead>
										<TableBody>
											{r.ingresoBase.detalle.map((d, i) => (
												<TableRow key={i}>
													<TableCell>
														{d.sac
															? `SAC ${d.periodo.slice(5, 7) <= "06" ? "1.º" : "2.º"} sem. ${d.periodo.slice(0, 4)}`
															: mesTexto(d.periodo)}
													</TableCell>
													<TableCell align="right">{money(d.monto)}</TableCell>
													{r.ingresoBase.metodo === "ley27348" && <TableCell align="right">{numero(d.coeficiente || 0, 6)}</TableCell>}
													{r.ingresoBase.metodo === "ley27348" && <TableCell align="right">{money(d.actualizado || 0)}</TableCell>}
												</TableRow>
											))}
										</TableBody>
									</Table>
								</Collapse>
							</TableCell>
						</TableRow>
						<Fila
							concepto={`Indemnización ${r.articulo}`}
							monto={r.indemnizacion}
							detalle={[
								`Fórmula: 53 × ingreso base${r.articulo.startsWith("art. 14") ? ` × ${numero(r.porcentaje)} %` : ""} × 65/${
									r.edad
								} = ${money(r.formula)}`,
								r.piso !== null ? `piso ${money(r.piso)}${r.pisoAplicado ? " (aplicado)" : ""}` : "",
							]
								.filter(Boolean)
								.join(" · ")}
						/>
						{r.compensacion && (
							<Fila concepto={`Compensación adicional art. 11 ap. 4 inc. ${r.compensacion.inciso})`} monto={r.compensacion.monto} />
						)}
						{r.adicional.procede && (
							<Fila
								concepto="Adicional art. 3 ley 26.773 (20 %)"
								monto={r.adicional.monto}
								detalle={r.adicional.pisoAplicado ? `piso ${money(r.adicional.piso || 0)} (aplicado)` : undefined}
							/>
						)}
						<Fila concepto="Capital a la fecha de la PMI" monto={r.capital} fuerte />
						{r.actualizacion && (
							<Fila
								concepto="Actualización art. 12 inc. 2"
								monto={r.actualizacion.monto}
								detalle={`${r.actualizacion.descripcion} · ${fecha(r.actualizacion.desde)} – ${fecha(r.actualizacion.hasta)} · ${numero(
									r.actualizacion.factor * 100,
									4,
								)} %`}
							/>
						)}
						<Fila concepto={r.actualizacion ? `Total al ${fecha(r.actualizacion.hasta)}` : "Total"} monto={r.total} fuerte />
					</TableBody>
				</Table>
				<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
					Desde la mora (art. 12 inc. 3) seguí con "Practicar liquidación" para sumar intereses y honorarios. Verificá los criterios con la
					sentencia antes de presentar.
				</Typography>
			</Box>
		);
	}

	return (
		<Stack spacing={2.5}>
			{error && <Alert severity="error">{error}</Alert>}
			<Grid container spacing={2}>
				<Grid item xs={12} sm={6} md={3}>
					<TextField
						fullWidth
						size="small"
						type="date"
						label="Primera manifestación invalidante"
						InputLabelProps={{ shrink: true }}
						value={fechaPMI}
						onChange={(e) => cambiarFechaPMI(e.target.value)}
						helperText="Desde el 26/10/2012 (ley 26.773)"
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<TextField
						fullWidth
						size="small"
						type="number"
						label="Edad a la PMI"
						value={edad}
						onChange={(e) => setEdad(e.target.value)}
						helperText="Años cumplidos"
					/>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<TextField
						fullWidth
						size="small"
						select
						label="Contingencia"
						value={contingencia}
						onChange={(e) => setContingencia(e.target.value as ContingenciaART)}
					>
						<MenuItem value="incapacidad">Incapacidad permanente</MenuItem>
						<MenuItem value="granInvalidez">Gran invalidez</MenuItem>
						<MenuItem value="muerte">Muerte</MenuItem>
					</TextField>
				</Grid>
				{contingencia === "incapacidad" && (
					<Grid item xs={12} sm={6} md={3}>
						<TextField
							fullWidth
							size="small"
							type="number"
							label="Incapacidad (%)"
							value={porcentaje}
							onChange={(e) => setPorcentaje(e.target.value)}
							helperText="66 % o más: incapacidad total"
						/>
					</Grid>
				)}
				<Grid item xs={12}>
					<FormControlLabel
						control={<Checkbox checked={inItinere} onChange={(e) => setInItinere(e.target.checked)} />}
						label="Accidente in itinere (sin el adicional del 20 % del art. 3 de la ley 26.773)"
					/>
				</Grid>
			</Grid>

			<Box>
				<Typography sx={{ fontWeight: 600, mb: 0.5 }}>Remuneraciones del año anterior a la PMI</Typography>
				<Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
					Remuneraciones sujetas a aportes, con los SAC. Si trabajó menos de un año, dejá vacíos los meses sin prestación.
				</Typography>
				{!filas.length ? (
					<Alert severity="info">Ingresá la fecha de la PMI para cargar los meses.</Alert>
				) : (
					<>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
							<TextField
								size="small"
								type="number"
								label="Mismo monto en todos los meses"
								value={montoParaTodos}
								onChange={(e) => setMontoParaTodos(e.target.value)}
							/>
							<Button size="small" variant="outlined" onClick={aplicarATodos} sx={{ textTransform: "none" }}>
								Aplicar (SAC = la mitad)
							</Button>
						</Stack>
						<Grid container spacing={1.5}>
							{filas.map((r, i) => (
								<Grid item xs={6} sm={4} md={2} key={`${r.periodo}${r.sac ? "S" : ""}`}>
									<TextField
										fullWidth
										size="small"
										type="number"
										label={r.sac ? `SAC ${r.periodo.slice(5, 7) === "06" ? "jun." : "dic."} ${r.periodo.slice(0, 4)}` : mesTexto(r.periodo)}
										value={r.monto}
										onChange={(e) => setFilas(filas.map((f, j) => (j === i ? { ...f, monto: e.target.value } : f)))}
									/>
								</Grid>
							))}
						</Grid>
						<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
							Total cargado: {money(sumaCargada)}
						</Typography>
					</>
				)}
			</Box>

			<Grid container spacing={2}>
				<Grid item xs={12} sm={4}>
					<TextField
						fullWidth
						size="small"
						type="date"
						label="Liquidar al"
						InputLabelProps={{ shrink: true }}
						value={fechaLiquidacion}
						onChange={(e) => setFechaLiquidacion(e.target.value)}
						helperText="Art. 12 inc. 2: de la PMI a esta fecha"
					/>
				</Grid>
				<Grid item xs={12} sm={8}>
					<TextField
						fullWidth
						size="small"
						select
						label="Actualización del ingreso base (art. 12 inc. 2)"
						value={criterio}
						onChange={(e) => setCriterio(e.target.value as CriterioActualizacionART)}
					>
						{CRITERIOS_ACTUALIZACION_ART.map((c) => (
							<MenuItem key={c.value} value={c.value}>
								{c.label}
							</MenuItem>
						))}
					</TextField>
				</Grid>
			</Grid>

			<Stack direction="row" justifyContent="flex-end">
				<Button
					variant="contained"
					onClick={calcular}
					disabled={calculando}
					startIcon={calculando ? <CircularProgress size={16} color="inherit" /> : <CalculatorIcon size={18} />}
					sx={{ bgcolor: BRAND_BLUE, textTransform: "none" }}
				>
					Calcular
				</Button>
			</Stack>
		</Stack>
	);
};

export default ARTWizard;
