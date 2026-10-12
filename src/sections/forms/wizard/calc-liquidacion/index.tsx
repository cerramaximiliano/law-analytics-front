import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
	Alert,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	FormControlLabel,
	Grid,
	IconButton,
	MenuItem,
	Stack,
	Switch,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Add, Trash, Calculator as CalculatorIcon } from "iconsax-react";
import { enqueueSnackbar } from "notistack";

import { BRAND_BLUE } from "themes/dashboardTokens";
import dayjs from "utils/dayjs-config";
import { dispatch, useSelector } from "store";
import { getInterestRates } from "store/reducers/interestRates";
import InterestSegmentsManager, { InterestSegment, InterestRate } from "components/calculator/InterestSegmentsManager";
import { calcularLiquidacion, HonorarioInput, LiquidacionInput, LiquidacionResultado } from "services/liquidacionService";
import type { TramoTasaRequest } from "services/tasasCalculoService";
import LiquidacionResultados from "./LiquidacionResultados";

// Datos que llegan desde "Practicar liquidación" (laboral / intereses)
export interface LiquidacionPrefill {
	capital?: number;
	segments?: InterestSegment[];
	capitalizeInterest?: boolean;
	folderId?: string | null;
	folderName?: string | null;
	origen?: string;
}

type Pago = { fecha: string; monto: string; concepto: string };
type Otro = { concepto: string; monto: string };
type HonorarioForm = Omit<HonorarioInput, "porcentaje" | "baseManual" | "etapas"> & {
	porcentaje: string;
	baseManual: string;
	etapas: number;
};

const honorarioVacio = (): HonorarioForm => ({
	profesional: "",
	rol: "patrocinante",
	tipoProceso: "conocimiento",
	etapas: 3,
	allanamientoAntesDePrueba: false,
	ejecucion: "",
	posicion: "minimo",
	porcentaje: "",
	base: "liquidacion",
	baseManual: "",
	iva: false,
});

/** Tramos del gestor de intereses → formato del motor del hub. */
export function segmentosATramos(segments: InterestSegment[]): TramoTasaRequest[] {
	return segments
		.filter((s) => !s.isExtension)
		.map((s) =>
			s.interestType === "simple"
				? {
						desde: s.startDate,
						hasta: s.endDate,
						tipo: "simple" as const,
						tasaFija: Number(s.simpleRate),
						periodoTasa: s.ratePeriod || "annual",
						capitalizacion: s.capitalizationFrequency || "none",
				  }
				: {
						desde: s.startDate,
						hasta: s.endDate,
						tasa: s.rate,
						...(s.capitalizationFrequency && s.capitalizationFrequency !== "none" ? { capitalizacion: s.capitalizationFrequency } : {}),
						...(s.cerComparisonEnabled ? { comparativaCER: true } : {}),
				  },
		);
}

const num = (v: string) => {
	const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
	return Number.isFinite(n) ? n : 0;
};

const Seccion = ({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: React.ReactNode }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box sx={{ border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.14)}`, borderRadius: 1.5, p: { xs: 1.5, sm: 2 }, mb: 2 }}>
			<Typography sx={{ fontWeight: 600, fontSize: "0.95rem", mb: ayuda ? 0.25 : 1.5 }}>{titulo}</Typography>
			{ayuda && (
				<Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
					{ayuda}
				</Typography>
			)}
			{children}
		</Box>
	);
};

const LiquidacionWizard = ({ prefill: prefillProp }: { prefill?: LiquidacionPrefill }) => {
	const location = useLocation();
	const prefill: LiquidacionPrefill = prefillProp || (location.state as any)?.liquidacion || {};
	const user = useSelector((state: any) => state.auth.user);
	const { rates: tasasOpciones, isInitialized } = useSelector((state: any) => state.interestRates);

	const [capital, setCapital] = useState<string>(prefill.capital ? String(prefill.capital) : "");
	const [segments, setSegments] = useState<InterestSegment[]>(prefill.segments || []);
	const [capitalizar, setCapitalizar] = useState<boolean>(!!prefill.capitalizeInterest);
	const ultimoHasta = segments.length ? dayjs(segments[segments.length - 1].endDate, "DD/MM/YYYY") : null;
	const [fechaCorte, setFechaCorte] = useState<string>((ultimoHasta && ultimoHasta.isValid() ? ultimoHasta : dayjs()).format("YYYY-MM-DD"));
	const [pagos, setPagos] = useState<Pago[]>([]);
	const [imputacion, setImputacion] = useState<"interesesPrimero" | "capitalPrimero">("interesesPrimero");
	const [honorarios, setHonorarios] = useState<HonorarioForm[]>([]);
	const [tasaJ, setTasaJ] = useState({
		aplicar: false,
		alicuota: "3",
		base: "liquidacion" as "liquidacion" | "capital" | "manual",
		baseManual: "",
		yaAbonada: "",
	});
	const [otros, setOtros] = useState<Otro[]>([]);
	const [descripcion, setDescripcion] = useState<string>(prefill.folderName || "");
	const [calculando, setCalculando] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [resultado, setResultado] = useState<{ r: LiquidacionResultado; input: LiquidacionInput } | null>(null);

	useEffect(() => {
		const id = user?._id || user?.id;
		if (id && !isInitialized) dispatch(getInterestRates(id));
	}, [user, isInitialized]);

	const availableRates: InterestRate[] = useMemo(() => (tasasOpciones || []).map((t: any) => ({ ...t })), [tasasOpciones]);
	const capitalNum = num(capital);

	const armarInput = (): LiquidacionInput => ({
		fechaCorte,
		capital: capitalNum,
		tramos: segmentosATramos(segments),
		capitalizarEntreTramos: capitalizar,
		pagos: pagos
			.filter((p) => p.fecha && num(p.monto) > 0)
			.map((p) => ({ fecha: p.fecha, monto: num(p.monto), concepto: p.concepto || undefined })),
		imputacionPagos: imputacion,
		honorarios: honorarios.map((h) => ({
			profesional: h.profesional || undefined,
			rol: h.rol,
			tipoProceso: h.tipoProceso,
			etapas: h.etapas,
			allanamientoAntesDePrueba: h.allanamientoAntesDePrueba,
			...(h.ejecucion ? { ejecucion: h.ejecucion } : {}),
			...(h.porcentaje ? { porcentaje: num(h.porcentaje) } : { posicion: h.posicion }),
			base: h.base,
			...(h.base === "manual" ? { baseManual: num(h.baseManual) } : {}),
			iva: h.iva,
		})),
		tasaJusticia: tasaJ.aplicar
			? {
					aplicar: true,
					alicuota: num(tasaJ.alicuota),
					base: tasaJ.base,
					...(tasaJ.base === "manual" ? { baseManual: num(tasaJ.baseManual) } : {}),
					...(tasaJ.yaAbonada ? { yaAbonada: num(tasaJ.yaAbonada) } : {}),
			  }
			: { aplicar: false },
		otros: otros.filter((o) => num(o.monto)).map((o) => ({ concepto: o.concepto || "Otro", monto: num(o.monto) })),
	});

	const calcular = async () => {
		setError(null);
		if (!(capitalNum > 0)) return setError("Ingresá el capital.");
		if (!fechaCorte) return setError("Ingresá la fecha de corte.");
		setCalculando(true);
		try {
			const input = armarInput();
			const r = await calcularLiquidacion(input);
			setResultado({ r, input });
		} catch (e: any) {
			const msg = e?.response?.data?.mensaje || e?.message || "No se pudo calcular la liquidación";
			setError(msg);
			enqueueSnackbar(msg, { variant: "error" });
		} finally {
			setCalculando(false);
		}
	};

	if (resultado) {
		return (
			<LiquidacionResultados
				resultado={resultado.r}
				input={resultado.input}
				segments={segments}
				folderId={prefill.folderId || null}
				folderName={prefill.folderName || null}
				descripcion={descripcion}
				onVolver={() => setResultado(null)}
			/>
		);
	}

	const setHon = (i: number, cambios: Partial<HonorarioForm>) =>
		setHonorarios((hs) => hs.map((h, j) => (j === i ? { ...h, ...cambios } : h)));

	return (
		<Box>
			{prefill.origen && (
				<Alert severity="info" sx={{ mb: 2 }}>
					Datos traídos del cálculo {prefill.origen}. Revisalos antes de calcular.
				</Alert>
			)}

			<Seccion titulo="Datos de la liquidación">
				<Grid container spacing={1.5}>
					<Grid item xs={12} sm={4}>
						<TextField
							label="Capital"
							size="small"
							fullWidth
							value={capital}
							onChange={(e) => setCapital(e.target.value)}
							placeholder="1000000,00"
						/>
					</Grid>
					<Grid item xs={12} sm={4}>
						<TextField
							label="Fecha de corte"
							type="date"
							size="small"
							fullWidth
							value={fechaCorte}
							onChange={(e) => setFechaCorte(e.target.value)}
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12} sm={4}>
						<TextField label="Descripción" size="small" fullWidth value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
					</Grid>
				</Grid>
			</Seccion>

			<Seccion
				titulo="Intereses"
				ayuda="Los tramos no pueden pasar la fecha de corte. Si hay pagos a cuenta, el cálculo corta los tramos en cada pago."
			>
				<InterestSegmentsManager
					capital={capitalNum}
					segments={segments}
					onSegmentsChange={setSegments}
					availableRates={availableRates}
					disabled={capitalNum <= 0}
					capitalizeInterest={capitalizar}
					onCapitalizeChange={setCapitalizar}
				/>
			</Seccion>

			<Seccion
				titulo="Pagos a cuenta"
				ayuda="Se imputan a la deuda del día del pago. Por defecto, primero a intereses y después a capital (art. 903 CCyC)."
			>
				{pagos.map((p, i) => (
					<Grid container spacing={1} key={i} sx={{ mb: 1 }} alignItems="center">
						<Grid item xs={12} sm={3}>
							<TextField
								type="date"
								size="small"
								fullWidth
								label="Fecha"
								value={p.fecha}
								InputLabelProps={{ shrink: true }}
								onChange={(e) => setPagos((ps) => ps.map((x, j) => (j === i ? { ...x, fecha: e.target.value } : x)))}
							/>
						</Grid>
						<Grid item xs={12} sm={3}>
							<TextField
								size="small"
								fullWidth
								label="Monto"
								value={p.monto}
								onChange={(e) => setPagos((ps) => ps.map((x, j) => (j === i ? { ...x, monto: e.target.value } : x)))}
							/>
						</Grid>
						<Grid item xs={10} sm={5}>
							<TextField
								size="small"
								fullWidth
								label="Concepto"
								value={p.concepto}
								onChange={(e) => setPagos((ps) => ps.map((x, j) => (j === i ? { ...x, concepto: e.target.value } : x)))}
							/>
						</Grid>
						<Grid item xs={2} sm={1}>
							<IconButton color="error" onClick={() => setPagos((ps) => ps.filter((_, j) => j !== i))} aria-label="Quitar pago">
								<Trash size={18} />
							</IconButton>
						</Grid>
					</Grid>
				))}
				<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
					<Button
						size="small"
						startIcon={<Add size={16} />}
						onClick={() => setPagos((ps) => [...ps, { fecha: "", monto: "", concepto: "" }])}
					>
						Agregar pago
					</Button>
					{pagos.length > 0 && (
						<TextField
							select
							size="small"
							label="Imputación"
							value={imputacion}
							onChange={(e) => setImputacion(e.target.value as any)}
							sx={{ minWidth: 240 }}
						>
							<MenuItem value="interesesPrimero">Primero intereses (art. 903 CCyC)</MenuItem>
							<MenuItem value="capitalPrimero">Primero capital</MenuItem>
						</TextField>
					)}
				</Stack>
			</Seccion>

			<Seccion
				titulo="Honorarios"
				ayuda="Escala del art. 21 de la ley 27.423 (PJN) con la UMA vigente a la fecha de corte. La base es capital más intereses (arts. 22 y 24)."
			>
				{honorarios.map((h, i) => (
					<Box key={i} sx={{ borderTop: i ? 1 : 0, borderColor: "divider", pt: i ? 1.5 : 0, mb: 1.5 }}>
						<Grid container spacing={1} alignItems="center">
							<Grid item xs={12} sm={4}>
								<TextField
									size="small"
									fullWidth
									label="Profesional (opcional)"
									value={h.profesional}
									onChange={(e) => setHon(i, { profesional: e.target.value })}
								/>
							</Grid>
							<Grid item xs={6} sm={3}>
								<TextField
									select
									size="small"
									fullWidth
									label="Rol"
									value={h.rol}
									onChange={(e) => setHon(i, { rol: e.target.value as any })}
								>
									<MenuItem value="patrocinante">Letrado patrocinante</MenuItem>
									<MenuItem value="apoderadoSinPatrocinio">Apoderado sin patrocinio</MenuItem>
									<MenuItem value="procurador">Procurador (40 %)</MenuItem>
									<MenuItem value="auxiliar">Perito / auxiliar (5 %–10 %)</MenuItem>
								</TextField>
							</Grid>
							<Grid item xs={6} sm={3}>
								<TextField
									select
									size="small"
									fullWidth
									label="Proceso"
									value={h.tipoProceso}
									onChange={(e) => setHon(i, { tipoProceso: e.target.value as any })}
								>
									<MenuItem value="conocimiento">Conocimiento (mín. 10 UMA)</MenuItem>
									<MenuItem value="ejecutivo">Ejecutivo (mín. 6 UMA)</MenuItem>
									<MenuItem value="mediacion">Mediación (mín. 2 UMA)</MenuItem>
								</TextField>
							</Grid>
							<Grid item xs={12} sm={2} sx={{ textAlign: "right" }}>
								<Tooltip title="Quitar">
									<IconButton
										color="error"
										onClick={() => setHonorarios((hs) => hs.filter((_, j) => j !== i))}
										aria-label="Quitar honorarios"
									>
										<Trash size={18} />
									</IconButton>
								</Tooltip>
							</Grid>
							<Grid item xs={6} sm={3}>
								<TextField
									select
									size="small"
									fullWidth
									label="Porcentaje del tramo"
									value={h.posicion}
									disabled={!!h.porcentaje}
									onChange={(e) => setHon(i, { posicion: e.target.value as any })}
								>
									<MenuItem value="minimo">Mínimo</MenuItem>
									<MenuItem value="medio">Medio</MenuItem>
									<MenuItem value="maximo">Máximo</MenuItem>
								</TextField>
							</Grid>
							<Grid item xs={6} sm={2}>
								<TextField
									size="small"
									fullWidth
									label="% exacto"
									value={h.porcentaje}
									onChange={(e) => setHon(i, { porcentaje: e.target.value })}
									placeholder="opcional"
								/>
							</Grid>
							<Grid item xs={6} sm={2}>
								<TextField
									select
									size="small"
									fullWidth
									label="Etapas"
									value={h.etapas}
									onChange={(e) => setHon(i, { etapas: Number(e.target.value) })}
								>
									<MenuItem value={1}>1 de 3</MenuItem>
									<MenuItem value={2}>2 de 3</MenuItem>
									<MenuItem value={3}>3 de 3</MenuItem>
								</TextField>
							</Grid>
							<Grid item xs={6} sm={3}>
								<TextField
									select
									size="small"
									fullWidth
									label="Base"
									value={h.base}
									onChange={(e) => setHon(i, { base: e.target.value as any })}
								>
									<MenuItem value="liquidacion">Capital + intereses</MenuItem>
									<MenuItem value="saldo">Saldo después de pagos</MenuItem>
									<MenuItem value="manual">Otro monto</MenuItem>
								</TextField>
							</Grid>
							{h.base === "manual" && (
								<Grid item xs={12} sm={2}>
									<TextField
										size="small"
										fullWidth
										label="Monto base"
										value={h.baseManual}
										onChange={(e) => setHon(i, { baseManual: e.target.value })}
									/>
								</Grid>
							)}
							<Grid item xs={12} sm={4}>
								<TextField
									select
									size="small"
									fullWidth
									label="Ejecución de sentencia"
									value={h.ejecucion}
									onChange={(e) => setHon(i, { ejecucion: e.target.value as any })}
								>
									<MenuItem value="">No</MenuItem>
									<MenuItem value="sentencia">Sí, mitad de la escala (art. 41)</MenuItem>
									<MenuItem value="sentenciaSinExcepciones">Sí, sin excepciones (−10 %)</MenuItem>
								</TextField>
							</Grid>
							<Grid item xs={12} sm={8}>
								<Stack direction="row" spacing={2} flexWrap="wrap">
									<FormControlLabel
										control={
											<Checkbox
												size="small"
												checked={!!h.allanamientoAntesDePrueba}
												onChange={(e) => setHon(i, { allanamientoAntesDePrueba: e.target.checked })}
											/>
										}
										label={<Typography variant="body2">Allanamiento o transacción antes de prueba (50 %)</Typography>}
									/>
									<FormControlLabel
										control={<Checkbox size="small" checked={!!h.iva} onChange={(e) => setHon(i, { iva: e.target.checked })} />}
										label={<Typography variant="body2">Sumar IVA 21 %</Typography>}
									/>
								</Stack>
							</Grid>
						</Grid>
					</Box>
				))}
				<Button size="small" startIcon={<Add size={16} />} onClick={() => setHonorarios((hs) => [...hs, honorarioVacio()])}>
					Agregar honorarios
				</Button>
			</Seccion>

			<Seccion titulo="Tasa de justicia" ayuda="Tributo (ley 23.898 en el fuero nacional). No devenga intereses ni lleva IVA.">
				<FormControlLabel
					control={<Switch checked={tasaJ.aplicar} onChange={(e) => setTasaJ({ ...tasaJ, aplicar: e.target.checked })} />}
					label="Incluir tasa de justicia"
				/>
				{tasaJ.aplicar && (
					<Grid container spacing={1} sx={{ mt: 0.5 }}>
						<Grid item xs={6} sm={2}>
							<TextField
								size="small"
								fullWidth
								label="Alícuota %"
								value={tasaJ.alicuota}
								onChange={(e) => setTasaJ({ ...tasaJ, alicuota: e.target.value })}
							/>
						</Grid>
						<Grid item xs={6} sm={3}>
							<TextField
								select
								size="small"
								fullWidth
								label="Base"
								value={tasaJ.base}
								onChange={(e) => setTasaJ({ ...tasaJ, base: e.target.value as any })}
							>
								<MenuItem value="liquidacion">Capital + intereses</MenuItem>
								<MenuItem value="capital">Capital</MenuItem>
								<MenuItem value="manual">Otro monto</MenuItem>
							</TextField>
						</Grid>
						{tasaJ.base === "manual" && (
							<Grid item xs={6} sm={3}>
								<TextField
									size="small"
									fullWidth
									label="Monto base"
									value={tasaJ.baseManual}
									onChange={(e) => setTasaJ({ ...tasaJ, baseManual: e.target.value })}
								/>
							</Grid>
						)}
						<Grid item xs={6} sm={3}>
							<TextField
								size="small"
								fullWidth
								label="Ya abonada"
								value={tasaJ.yaAbonada}
								onChange={(e) => setTasaJ({ ...tasaJ, yaAbonada: e.target.value })}
							/>
						</Grid>
					</Grid>
				)}
			</Seccion>

			<Seccion titulo="Otros conceptos" ayuda="Gastos, costas u otros importes que se suman al total.">
				{otros.map((o, i) => (
					<Grid container spacing={1} key={i} sx={{ mb: 1 }} alignItems="center">
						<Grid item xs={7} sm={7}>
							<TextField
								size="small"
								fullWidth
								label="Concepto"
								value={o.concepto}
								onChange={(e) => setOtros((os) => os.map((x, j) => (j === i ? { ...x, concepto: e.target.value } : x)))}
							/>
						</Grid>
						<Grid item xs={3} sm={4}>
							<TextField
								size="small"
								fullWidth
								label="Monto"
								value={o.monto}
								onChange={(e) => setOtros((os) => os.map((x, j) => (j === i ? { ...x, monto: e.target.value } : x)))}
							/>
						</Grid>
						<Grid item xs={2} sm={1}>
							<IconButton color="error" onClick={() => setOtros((os) => os.filter((_, j) => j !== i))} aria-label="Quitar concepto">
								<Trash size={18} />
							</IconButton>
						</Grid>
					</Grid>
				))}
				<Button size="small" startIcon={<Add size={16} />} onClick={() => setOtros((os) => [...os, { concepto: "", monto: "" }])}>
					Agregar concepto
				</Button>
			</Seccion>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}
			<Stack direction="row" justifyContent="flex-end">
				<Button
					variant="contained"
					onClick={calcular}
					disabled={calculando}
					startIcon={calculando ? <CircularProgress size={16} color="inherit" /> : <CalculatorIcon size={16} />}
					sx={{ bgcolor: BRAND_BLUE, textTransform: "none", fontWeight: 600 }}
				>
					Calcular liquidación
				</Button>
			</Stack>
		</Box>
	);
};

export default LiquidacionWizard;
