import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// material-ui
import {
	Box,
	Button,
	Paper,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from "@mui/material";

// project-imports
import IconButton from "components/@extended/IconButton";
import AlertCalculatorDelete from "pages/calculator/intereses/components/AlertCalculatorDelete";
import LinkCauseModal from "sections/forms/wizard/calc-laboral/components/linkCauseModal";
import { dispatch, useSelector } from "store";
import { clearSelectedCalculators, getCalculatorsByFilter } from "store/reducers/calculator";
import { fechaCalculo } from "utils/calculatorDate";
import {
	esHaberCajaGuardado,
	precargaRetroactivoDesdeHaberCaja,
	sePuedeReabrirHaberCaja,
	valoresDesdeCalculadora,
} from "sections/forms/wizard/calc-previsional/haber-caja/formModel/valoresDesdeGuardado";
import { etiquetaPrestacion, serieMensualHaberCajaGuardado, SerieMensualHaberCaja } from "services/haberCajaService";
import { enqueueSnackbar } from "notistack";
import { RUTA_RETROACTIVO } from "./HaberCajaResultado";

// assets
import { ArrowRight, Edit2, Link21, Trash } from "iconsax-react";

const pesos = (n: number | null | undefined) =>
	n === null || n === undefined || Number.isNaN(n) ? "-" : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
const mesLegible = (p?: string | null) => (p && /^\d{4}-\d{2}/.test(p) ? `${p.slice(5, 7)}/${p.slice(0, 4)}` : "-");

/** Ruta de la pantalla del haber de caja (el formulario lee `?edit=` y `?folder=`). */
export const RUTA_HABER_CAJA = "/apps/calc/previsional/haber-caja";

// ==============================|| HABER DE CAJA: CÁLCULOS GUARDADOS ||============================== //

export default function SavedHaberCaja() {
	const navigate = useNavigate();
	const userId = useSelector((state: any) => state.auth.user?._id || state.auth.user?.id);
	const { selectedCalculators, isLoader } = useSelector((state: any) => state.calculator);
	const [borrar, setBorrar] = useState<{ id: string; titulo: string } | null>(null);
	const [vincular, setVincular] = useState<string | null>(null);

	// Mismo listado que los guardados del retroactivo (cálculos previsionales del usuario); acá solo los haberes de caja
	useEffect(() => {
		if (userId) dispatch(getCalculatorsByFilter({ userId, type: "Calculado", classType: "previsional" }));
		return () => {
			dispatch(clearSelectedCalculators());
		};
	}, [userId]);

	const guardados = useMemo(
		() =>
			(selectedCalculators || [])
				.filter(esHaberCajaGuardado)
				.sort((a: any, b: any) => String(b.date || "").localeCompare(String(a.date || ""))),
		[selectedCalculators],
	);

	const reabrir = useCallback(
		(calc: any) => {
			const params = new URLSearchParams({ edit: calc._id });
			if (calc.folderId) params.set("folder", calc.folderId);
			navigate(`${RUTA_HABER_CAJA}?${params.toString()}`);
		},
		[navigate],
	);

	// Encadenar: los percibidos del retroactivo son la serie mensual de este haber de caja (el hub la recalcula con la
	// entrada guardada) y el retroactivo queda vinculado a este cálculo. Sin la serie, pasa solo el haber como haber pagado.
	const [armando, setArmando] = useState<string | null>(null);
	const usarEnRetroactivo = useCallback(
		async (calc: any) => {
			const values = valoresDesdeCalculadora(calc);
			const resultado = calc.variables?.resultado;
			if (!values || !resultado) return;
			setArmando(calc._id);
			let serie: SerieMensualHaberCaja | null = null;
			try {
				serie = await serieMensualHaberCajaGuardado(calc._id);
			} catch (e: any) {
				enqueueSnackbar(
					`No se pudo traer la serie mensual (${
						e?.response?.data?.mensaje || e?.message || "error del servidor"
					}): el retroactivo arranca solo con el haber de caja como haber pagado.`,
					{ variant: "warning" },
				);
			}
			setArmando(null);
			const precarga = precargaRetroactivoDesdeHaberCaja(resultado, values, calc._id, serie);
			navigate(RUTA_RETROACTIVO + (calc.folderId ? `?folder=${calc.folderId}` : ""), { state: { desdeHaberCaja: precarga } });
		},
		[navigate],
	);

	if (isLoader && !guardados.length) {
		return (
			<Stack spacing={1}>
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} variant="rounded" height={44} />
				))}
			</Stack>
		);
	}

	return (
		<>
			{guardados.length === 0 ? (
				<Box sx={{ py: 6, textAlign: "center" }}>
					<Typography color="text.secondary">Todavía no guardaste ningún haber de caja.</Typography>
				</Box>
			) : (
				<TableContainer component={Paper} variant="outlined">
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Fecha</TableCell>
								<TableCell>Titular / Carpeta</TableCell>
								<TableCell>Prestación</TableCell>
								<TableCell>FAD</TableCell>
								<TableCell align="right">Haber de caja</TableCell>
								<TableCell>Valuado en</TableCell>
								<TableCell align="center">Acciones</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{guardados.map((calc: any) => {
								const v = calc.variables || {};
								// la del selector (la anticipada llega al motor como jubilación con reducción)
								const prestacion = v.datosExpediente?.prestacion || (v.input?.anticipada ? "anticipada" : v.input?.prestacion);
								const titular = calc.user || v.datosExpediente?.reclamante || "este cálculo";
								const reabrible = sePuedeReabrirHaberCaja(calc);
								return (
									<TableRow key={calc._id} hover>
										<TableCell sx={{ whiteSpace: "nowrap" }}>{calc.date ? fechaCalculo(calc.date) : "-"}</TableCell>
										<TableCell>
											<Stack spacing={0.25} alignItems="flex-start">
												<Typography noWrap sx={{ maxWidth: 240 }}>
													{calc.user || v.datosExpediente?.reclamante || "-"}
												</Typography>
												{calc.folderName ? (
													<Typography noWrap variant="caption" color="text.secondary" sx={{ maxWidth: 240 }}>
														{calc.folderName}
													</Typography>
												) : (
													<Button
														variant="text"
														size="small"
														sx={{ p: 0, minWidth: 0, fontSize: "0.7rem", justifyContent: "flex-start" }}
														onClick={() => setVincular(calc._id)}
													>
														Vincular carpeta
													</Button>
												)}
											</Stack>
										</TableCell>
										<TableCell>
											{prestacion ? etiquetaPrestacion(prestacion) + (v.input?.pensionDerivada ? " · pensión derivada" : "") : "-"}
										</TableCell>
										<TableCell>{v.input?.fechas?.fad ? fechaCalculo(v.input.fechas.fad) : "-"}</TableCell>
										<TableCell align="right" sx={{ whiteSpace: "nowrap", fontWeight: 500 }}>
											{pesos(v.resultado?.haber ?? calc.amount)}
										</TableCell>
										<TableCell>{mesLegible(v.resultado?.mesValuacion)}</TableCell>
										<TableCell align="center">
											<Stack direction="row" spacing={0.5} justifyContent="center">
												<Tooltip title={reabrible ? "Editar y recalcular" : "Este cálculo no se puede reabrir"}>
													<span>
														<IconButton
															size="small"
															color="secondary"
															disabled={!reabrible}
															onClick={() => reabrir(calc)}
															aria-label={`Editar el haber de caja de ${titular}`}
														>
															<Edit2 size={18} />
														</IconButton>
													</span>
												</Tooltip>
												<Tooltip title="Usar en el retroactivo">
													<span>
														<IconButton
															size="small"
															color="secondary"
															disabled={!reabrible || !v.resultado || armando === calc._id}
															onClick={() => usarEnRetroactivo(calc)}
															aria-label={`Usar en el retroactivo el haber de caja de ${titular}`}
														>
															<ArrowRight size={18} />
														</IconButton>
													</span>
												</Tooltip>
												<Tooltip title="Vincular carpeta">
													<IconButton
														size="small"
														color="secondary"
														onClick={() => setVincular(calc._id)}
														aria-label={`Vincular a una carpeta el haber de caja de ${titular}`}
													>
														<Link21 size={18} />
													</IconButton>
												</Tooltip>
												<Tooltip title="Eliminar">
													<IconButton
														size="small"
														color="error"
														onClick={() => setBorrar({ id: calc._id, titulo: titular })}
														aria-label={`Eliminar el haber de caja de ${titular}`}
													>
														<Trash size={18} />
													</IconButton>
												</Tooltip>
											</Stack>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<AlertCalculatorDelete id={borrar?.id || ""} title={borrar?.titulo || ""} open={!!borrar} handleClose={() => setBorrar(null)} />
			<LinkCauseModal open={!!vincular} onClose={() => setVincular(null)} calculationId={vincular || ""} />
		</>
	);
}
