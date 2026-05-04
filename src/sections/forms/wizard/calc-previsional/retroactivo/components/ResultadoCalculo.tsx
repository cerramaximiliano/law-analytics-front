import React, { useEffect, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Typography,
} from "@mui/material";
import { InfoCircle } from "iconsax-react";
import axios from "axios";
import AnimateButton from "components/@extended/AnimateButton";
import dayjs from "utils/dayjs-config";

interface FilaHaber {
	fecha: string;
	movilidadGeneral: number | null;
	haberCaja: number;
	haberReclamado: number;
	sinDato: boolean;
	aplicaReajuste?: boolean;
	suplementoMovilidad?: number | null;
	prorateo?: number;
	diferenciaImporte?: number;
	diferenciaPorcentaje?: number;
	hac?: number;
	descObraSocial?: number;
}

interface CriterioMovilidad {
	indiceMovilidad: string;
	fechaDesde: string;
}

interface ResultadoCalculoProps {
	savedCalculator: any;
	calculoParams: {
		haberPagadoAnses: number;
		haberPagadoAl: string;
		haberReclamado: number;
		fechaDesdeReclamado: string;
		fechaHastaReclamado: string;
		tieneReajuste: boolean;
		fechaAltaReajuste: string;
		importeReajuste: number | null;
		criteriosMovilidad: CriterioMovilidad[];
	};
	onNuevoCalculo: () => void;
}

const formatCurrency = (value: number) =>
	new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(value);

const formatMovilidad = (value: number | null) => {
	if (value === null) return "—";
	const pct = (value - 1) * 100;
	const sign = pct >= 0 ? "+" : "";
	return `${sign}${pct.toFixed(2)}%`;
};

const formatMes = (fecha: string) => dayjs.utc(fecha).format("MMMM YYYY");

const ROWS_PER_PAGE_OPTIONS = [12, 24, 60];

export default function ResultadoCalculo({ savedCalculator, calculoParams, onNuevoCalculo }: ResultadoCalculoProps) {
	const [filas, setFilas] = useState<FilaHaber[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(12);

	useEffect(() => {
		const fetchCalculo = async () => {
			try {
				setIsLoading(true);
				setError(null);
				const response = await axios.post(
					`${import.meta.env.VITE_BASE_URL}/api/previsional-calculadores/calcular`,
					{
						haberPagadoAnses: calculoParams.haberPagadoAnses,
						haberPagadoAl: calculoParams.haberPagadoAl,
						haberReclamado: calculoParams.haberReclamado,
						fechaDesdeReclamado: calculoParams.fechaDesdeReclamado,
						fechaHastaReclamado: calculoParams.fechaHastaReclamado,
						tieneReajuste: calculoParams.tieneReajuste,
						fechaAltaReajuste: calculoParams.fechaAltaReajuste,
						importeReajuste: calculoParams.importeReajuste,
						criteriosMovilidad: calculoParams.criteriosMovilidad,
					},
					{ withCredentials: true },
				);
				if (response.data.success) {
					setFilas(response.data.filas);
				} else {
					setError(response.data.message || "Error al calcular");
				}
			} catch (err: any) {
				setError(err?.response?.data?.message || "Error al conectar con el servidor");
			} finally {
				setIsLoading(false);
			}
		};

		fetchCalculo();
	}, [calculoParams]);

	const sinDatoCount = filas.filter((f) => f.sinDato).length;
	const filasPaginadas = filas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	return (
		<Box>
			{/* Header */}
			<Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
				<Box>
					<Typography variant="h4" gutterBottom>
						Haber de Caja — Resultado
					</Typography>
					{savedCalculator?.user && (
						<Typography variant="body2" color="text.secondary">
							Titular: <strong>{savedCalculator.user}</strong>
						</Typography>
					)}
				</Box>
				<AnimateButton>
					<Button variant="outlined" size="small" onClick={onNuevoCalculo}>
						Nuevo cálculo
					</Button>
				</AnimateButton>
			</Stack>

			{/* Parámetros de referencia */}
			<Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 3, gap: 1 }}>
				<Chip label={`Haber ANSES: ${formatCurrency(calculoParams.haberPagadoAnses)}`} variant="outlined" size="small" />
				<Chip label={`Haber reclamado: ${formatCurrency(calculoParams.haberReclamado)}`} variant="outlined" size="small" />
				<Chip label={`Pagado al: ${calculoParams.haberPagadoAl}`} variant="outlined" size="small" />
				<Chip label={`Reclamado: ${calculoParams.fechaDesdeReclamado} → ${calculoParams.fechaHastaReclamado}`} variant="outlined" size="small" />
				{!isLoading && <Chip label={`${filas.length} períodos`} color="primary" size="small" />}
			</Stack>

			{sinDatoCount > 0 && !isLoading && (
				<Alert severity="warning" icon={<InfoCircle size={18} />} sx={{ mb: 2 }}>
					{sinDatoCount} {sinDatoCount === 1 ? "período no tiene" : "períodos no tienen"} datos de movilidad registrados. El haber se mantiene igual en esos meses.
				</Alert>
			)}

			{isLoading ? (
				<Stack alignItems="center" justifyContent="center" sx={{ py: 8 }} spacing={2}>
					<CircularProgress />
					<Typography variant="body2" color="text.secondary">
						Calculando haberes…
					</Typography>
				</Stack>
			) : error ? (
				<Alert severity="error">{error}</Alert>
			) : filas.length === 0 ? (
				<Alert severity="info">No hay períodos para calcular con los parámetros ingresados.</Alert>
			) : (
				<Paper variant="outlined">
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell sx={{ fontWeight: 600 }}>Período</TableCell>
									<TableCell align="right" sx={{ fontWeight: 600 }}>
										Movilidad aplicada
									</TableCell>
									<TableCell align="right" sx={{ fontWeight: 600 }}>
										Haber de caja
									</TableCell>
									<TableCell align="right" sx={{ fontWeight: 600 }}>
										Haber reclamado
									</TableCell>
									<TableCell align="right" sx={{ fontWeight: 600 }}>
										Diferencia
									</TableCell>
									<TableCell align="right" sx={{ fontWeight: 600 }}>
										HAC
									</TableCell>
									<TableCell align="right" sx={{ fontWeight: 600 }}>
										Desc. O.S.
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{filasPaginadas.map((fila, idx) => (
									<TableRow
										key={fila.fecha}
										sx={{
											bgcolor: fila.sinDato ? "warning.lighter" : idx % 2 === 0 ? "transparent" : "action.hover",
										}}
									>
										<TableCell sx={{ textTransform: "capitalize" }}>
											<Stack direction="row" spacing={0.5} alignItems="center">
												<span>{formatMes(fila.fecha)}</span>
												{fila.aplicaReajuste && <Chip label="Reajuste" size="small" color="info" variant="outlined" />}
											</Stack>
										</TableCell>
										<TableCell align="right">
											{fila.sinDato ? (
												<Chip label="Sin dato" size="small" color="warning" variant="outlined" />
											) : (
												<Typography
													variant="body2"
													color={fila.movilidadGeneral !== null && fila.movilidadGeneral >= 1 ? "success.main" : "error.main"}
												>
													{formatMovilidad(fila.movilidadGeneral)}
												</Typography>
											)}
										</TableCell>
										<TableCell align="right">
											<Typography variant="body2" fontWeight={500}>
												{formatCurrency(fila.haberCaja)}
											</Typography>
										</TableCell>
										<TableCell align="right">
											<Typography variant="body2" fontWeight={500}>
												{formatCurrency(fila.haberReclamado)}
											</Typography>
										</TableCell>
										<TableCell align="right">
											<Typography variant="body2" fontWeight={500}>
												{formatCurrency(fila.diferenciaImporte ?? 0)}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{(fila.diferenciaPorcentaje ?? 0).toFixed(2)}%
											</Typography>
										</TableCell>
										<TableCell align="right">
											<Typography variant="body2" color={fila.hac ? "text.primary" : "text.disabled"}>
												{fila.hac ? formatCurrency(fila.hac) : "—"}
											</Typography>
										</TableCell>
										<TableCell align="right">
											<Typography variant="body2" color="error.main">
												{fila.descObraSocial ? `−${formatCurrency(fila.descObraSocial)}` : "—"}
											</Typography>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
					<TablePagination
						component="div"
						count={filas.length}
						page={page}
						onPageChange={(_, newPage) => setPage(newPage)}
						rowsPerPage={rowsPerPage}
						onRowsPerPageChange={(e) => {
							setRowsPerPage(parseInt(e.target.value, 10));
							setPage(0);
						}}
						rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
						labelRowsPerPage="Filas por página:"
						labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
					/>
				</Paper>
			)}
		</Box>
	);
}
