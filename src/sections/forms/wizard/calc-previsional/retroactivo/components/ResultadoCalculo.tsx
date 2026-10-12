import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
	Alert,
	Box,
	Button,
	Collapse,
	Grid,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import { ArrowDown2, ArrowUp2, Save2 } from "iconsax-react";
import { enqueueSnackbar } from "notistack";
import dayjs from "utils/dayjs-config";
import { dispatch, useSelector } from "store";
import { addCalculator } from "store/reducers/calculator";
import { useTeam } from "contexts/TeamContext";
import { RetroactivoInput, RetroactivoResultado } from "services/previsionalService";

interface ResultadoCalculoProps {
	resultado: RetroactivoResultado;
	input: RetroactivoInput;
	values: any;
	onModificar: () => void;
	onNuevoCalculo: () => void;
}

const money = (v: number | null | undefined) =>
	v === null || v === undefined
		? "—"
		: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(v);
const fecha = (f?: string) => (f ? dayjs(f).format("DD/MM/YYYY") : "—");
const mes = (p: string) => dayjs(`${p}-01`).format("MM/YYYY");
const num = { whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" } as const;

const ResultadoCalculo = ({ resultado: r, input, values, onModificar, onNuevoCalculo }: ResultadoCalculoProps) => {
	const navigate = useNavigate();
	const user = useSelector((state: any) => state.auth.user);
	const { getRequestHeaders } = useTeam();
	const [verDetalle, setVerDetalle] = useState(false);
	const [guardando, setGuardando] = useState(false);
	const [guardado, setGuardado] = useState(false);

	const conTope = r.filas.some((f) => f.quitaTope);
	const conBono = r.filas.some((f) => f.bonoPercibido || f.bonoReclamado);
	const bonoAparte = conBono && r.bono?.tratamiento !== "integrado";
	const reclamante = values.reclamante?.startsWith("__CAUSA_VINCULADA__") ? values.folderName || "" : values.reclamante;

	// formato de `calculationResult` que leen el listado de cálculos, el PDF y las variables calculo.*
	const calculationResult = useMemo(
		() => ({
			reclamo: [
				{ key: "Haber percibido", value: `${money(input.percibido.importe)} al ${fecha(input.percibido.fecha)}` },
				{ key: "Haber reclamado", value: `${money(input.reclamado.importe)} al ${fecha(input.reclamado.fecha)}` },
				{
					key: "Período de diferencias",
					value: `${fecha(r.desde)} – ${fecha(r.filas[r.filas.length - 1] && `${r.filas[r.filas.length - 1].periodo}-01`)}`,
				},
				{ key: "Fecha de cierre", value: fecha(r.consolidacion) },
				...(r.bono && (r.bono.percibido || r.bono.reclamado)
					? [
							{
								key: "Bono previsional",
								value: `sobre el haber ${[r.bono.percibido && "percibido", r.bono.reclamado && "reclamado"]
									.filter(Boolean)
									.join(" y el ")}, ${r.bono.tratamiento === "integrado" ? "integrado a la diferencia" : "aparte, sin SAC ni obra social"}`,
							},
					  ]
					: []),
			],
			indemnizacion: [
				{ key: "Capital (diferencias netas)", value: r.totales.capital },
				{ key: "Intereses", value: r.totales.intereses },
				...(r.totales.pagado ? [{ key: "Pagos a cuenta", value: -r.totales.pagado }] : []),
				{ key: "Saldo", value: r.totales.saldo },
			],
			liquidacion: [],
			multas: [],
			otros: [{ key: "Haber reajustado al cierre", value: r.haberReajustado.reclamado }],
			intereses: [{ key: `Tasa: ${r.tasa.descripcion || r.tasa.tipo}`, value: r.totales.intereses }],
		}),
		[r, input],
	);

	const guardar = async () => {
		const userId = user?._id || user?.id;
		if (!userId) return enqueueSnackbar("No se encontró el usuario", { variant: "error" });
		setGuardando(true);
		const res: any = await dispatch(
			addCalculator(
				{
					userId,
					date: dayjs().format("YYYY-MM-DD"),
					type: "Calculado",
					classType: "previsional",
					subClassType: "retroactivo",
					amount: r.totales.saldo,
					capital: r.totales.capital,
					interest: r.totales.intereses,
					user: reclamante || user?.name || "Usuario",
					...(values.folderId ? { folderId: values.folderId, folderName: values.folderName } : {}),
					variables: {
						calculationResult,
						input,
						resultado: { ...r, filas: r.filas },
						datosExpediente: {
							reclamante: reclamante || null,
							expedienteAdmin: values.expedienteAdmin || null,
							prestacion: values.prestacion || null,
							fechaAdquisicion: values.fechaAdquisicion || null,
							fechaAlta: values.fechaAlta || null,
						},
						formulario: values,
					},
				} as any,
				{ headers: getRequestHeaders() },
			),
		);
		setGuardando(false);
		if (res?.success) {
			setGuardado(true);
			enqueueSnackbar("Cálculo guardado", { variant: "success" });
		} else enqueueSnackbar(res?.error || "No se pudo guardar el cálculo", { variant: "error" });
	};

	const Tarjeta = ({ titulo, monto, fuerte }: { titulo: string; monto: number; fuerte?: boolean }) => (
		<Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
			<Typography variant="caption" color="text.secondary">
				{titulo}
			</Typography>
			<Typography variant={fuerte ? "h4" : "h5"} sx={num}>
				{money(monto)}
			</Typography>
		</Paper>
	);

	return (
		<Box>
			<Typography variant="h5" gutterBottom>
				Retroactivo previsional
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				Diferencias del {fecha(r.desde)} con intereses al {fecha(r.consolidacion)} ({r.tasa.descripcion || r.tasa.tipo}).
			</Typography>

			<Grid container spacing={2} sx={{ mb: 2 }}>
				<Grid item xs={12} sm={6} md={3}>
					<Tarjeta titulo="Capital" monto={r.totales.capital} />
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Tarjeta titulo="Intereses" monto={r.totales.intereses} />
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Tarjeta titulo="Pagos a cuenta" monto={r.totales.pagado} />
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Tarjeta titulo="Saldo" monto={r.totales.saldo} fuerte />
				</Grid>
			</Grid>

			<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
				<Typography variant="body2">
					Haber reajustado al cierre ({mes(r.haberReajustado.periodo)}): <strong>{money(r.haberReajustado.reclamado)}</strong> · haber
					percibido: {money(r.haberReajustado.percibido)}
				</Typography>
			</Paper>

			{r.tramos.length > 0 && (
				<TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Tramo hasta</TableCell>
								<TableCell align="right">Capital del tramo</TableCell>
								<TableCell align="right">Intereses del tramo</TableCell>
								<TableCell align="right">Intereses sobre saldo</TableCell>
								<TableCell align="right">Pago</TableCell>
								<TableCell align="right">Saldo de capital</TableCell>
								<TableCell align="right">Intereses impagos</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{r.tramos.map((t, i) => (
								<TableRow key={i}>
									<TableCell>{fecha(t.hasta)}</TableCell>
									<TableCell align="right" sx={num}>
										{money(t.capitalTramo)}
									</TableCell>
									<TableCell align="right" sx={num}>
										{money(t.interesTramo)}
									</TableCell>
									<TableCell align="right" sx={num}>
										{money(t.interesSobreSaldo)}
									</TableCell>
									<TableCell align="right" sx={num}>
										{t.pago ? money(t.pago) : "—"}
									</TableCell>
									<TableCell align="right" sx={num}>
										{t.saldoCapital !== undefined ? money(t.saldoCapital) : "—"}
									</TableCell>
									<TableCell align="right" sx={num}>
										{t.saldoInteres ? money(t.saldoInteres) : "—"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{r.avisos.length > 0 && (
				<Alert severity="info" sx={{ mb: 2 }}>
					{r.avisos.map((a, i) => (
						<div key={i}>{a}</div>
					))}
				</Alert>
			)}

			<Button
				size="small"
				onClick={() => setVerDetalle((v) => !v)}
				endIcon={verDetalle ? <ArrowUp2 size={14} /> : <ArrowDown2 size={14} />}
				sx={{ textTransform: "none", mb: 1 }}
			>
				{verDetalle ? "Ocultar" : "Ver"} el detalle mes a mes ({r.filas.length} meses)
			</Button>
			<Collapse in={verDetalle}>
				<TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520, mb: 2 }}>
					<Table size="small" stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell>Mes</TableCell>
								<TableCell align="right">Percibido</TableCell>
								<TableCell align="right">Reclamado</TableCell>
								<TableCell align="right">Diferencia</TableCell>
								{conTope && <TableCell align="right">Quita tope</TableCell>}
								{conBono && <TableCell align="right">Bono percibido</TableCell>}
								{conBono && <TableCell align="right">Bono reclamado</TableCell>}
								<TableCell align="right">SAC</TableCell>
								<TableCell align="right">Obra social</TableCell>
								{bonoAparte && <TableCell align="right">Diferencia de bono</TableCell>}
								<TableCell align="right">Capital</TableCell>
								<TableCell align="right">Interés</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{r.filas.map((f) => (
								<TableRow key={f.periodo} hover>
									<TableCell>{mes(f.periodo)}</TableCell>
									<TableCell align="right" sx={num}>
										{money(f.percibido)}
									</TableCell>
									<TableCell align="right" sx={num}>
										{money(f.reclamado)}
									</TableCell>
									<TableCell align="right" sx={num}>
										{money(f.diferencia)}
									</TableCell>
									{conTope && (
										<TableCell align="right" sx={num}>
											{f.quitaTope ? money(f.quitaTope) : "—"}
										</TableCell>
									)}
									{conBono && (
										<TableCell align="right" sx={num}>
											{f.bonoPercibido ? money(f.bonoPercibido) : "—"}
										</TableCell>
									)}
									{conBono && (
										<TableCell align="right" sx={num}>
											{f.bonoReclamado ? money(f.bonoReclamado) : "—"}
										</TableCell>
									)}
									<TableCell align="right" sx={num}>
										{f.sac ? money(f.sac) : "—"}
									</TableCell>
									<TableCell align="right" sx={num}>
										{money(f.obraSocial)}
									</TableCell>
									{bonoAparte && (
										<TableCell align="right" sx={num}>
											{f.diferenciaBono ? money(f.diferenciaBono) : "—"}
										</TableCell>
									)}
									<TableCell align="right" sx={num}>
										{money(f.capital)}
									</TableCell>
									<TableCell align="right" sx={num}>
										{money(f.interes)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</Collapse>

			<Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
				<Button size="small" onClick={onNuevoCalculo} sx={{ textTransform: "none" }}>
					Nuevo cálculo
				</Button>
				<Button size="small" variant="outlined" onClick={onModificar} sx={{ textTransform: "none" }}>
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
									capital: r.totales.saldo,
									segments: [],
									folderId: values.folderId || null,
									folderName: values.folderName || null,
									origen: "previsional",
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
					startIcon={<Save2 size={16} />}
					onClick={guardar}
					sx={{ textTransform: "none" }}
				>
					{guardado ? "Guardado" : "Guardar"}
				</Button>
			</Stack>
		</Box>
	);
};

export default ResultadoCalculo;
