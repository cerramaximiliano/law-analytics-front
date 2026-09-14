import { useCallback, useEffect, useState } from "react";

// material-ui
import {
	Box,
	Chip,
	CircularProgress,
	Collapse,
	Grid,
	IconButton,
	Link,
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
import MainCard from "components/MainCard";
import { BRAND_BLUE } from "themes/dashboardTokens";

// icons
import { ArrowDown2, ArrowRight2, DollarCircle, ExportSquare } from "iconsax-react";

// api
import {
	getResumenArancelario,
	getSerieArancelaria,
	ResumenJurisdiccion,
	ValorHistorico,
} from "utils/valoresArancelariosService";

// ─── Helpers ────────────────────────────────────────────────────────────────

const pesos = (n: number) =>
	"$" + Number(n).toLocaleString("es-AR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });

const fecha = (iso?: string) =>
	iso ? new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

// Nombre legible de la jurisdicción a partir del ámbito.
const AMBITOS: Record<string, string> = {
	PJN: "Poder Judicial de la Nación",
	CABA: "Ciudad de Buenos Aires",
	PBA: "Provincia de Buenos Aires",
	CBA: "Córdoba",
	SFE: "Santa Fe",
	CHU: "Chubut",
	SAL: "Salta",
	NQN: "Neuquén",
	RN: "Río Negro",
	MZA: "Mendoza — honorarios",
	"MZA-CUANTIA": "Mendoza — competencia por cuantía",
};
const nombreJurisdiccion = (a: string) => AMBITOS[a] || a;

// ─── Fila expandible ──────────────────────────────────────────────────────────

const FilaValor = ({ fila }: { fila: ResumenJurisdiccion }) => {
	const [abierta, setAbierta] = useState(false);
	const [serie, setSerie] = useState<ValorHistorico[]>([]);
	const [cargando, setCargando] = useState(false);

	const toggle = useCallback(async () => {
		const nueva = !abierta;
		setAbierta(nueva);
		if (nueva && serie.length === 0) {
			try {
				setCargando(true);
				setSerie(await getSerieArancelaria(fila.unidad, fila.ambito));
			} catch {
				/* el histórico es secundario; si falla, se muestra vacío */
			} finally {
				setCargando(false);
			}
		}
	}, [abierta, serie.length, fila.unidad, fila.ambito]);

	return (
		<>
			<TableRow hover sx={{ "& > td": { borderBottom: abierta ? "none" : undefined } }}>
				<TableCell padding="checkbox">
					<IconButton size="small" onClick={toggle}>
						{abierta ? <ArrowDown2 size={16} /> : <ArrowRight2 size={16} />}
					</IconButton>
				</TableCell>
				<TableCell>
					<Stack direction="row" spacing={1} alignItems="center">
						<Chip label={fila.unidad} size="small" sx={{ bgcolor: BRAND_BLUE, color: "#fff", fontWeight: 600 }} />
						<Typography variant="subtitle1">{nombreJurisdiccion(fila.ambito)}</Typography>
					</Stack>
					{fila.leyMarco && (
						<Typography variant="caption" color="text.secondary">
							{fila.leyMarco}
						</Typography>
					)}
				</TableCell>
				<TableCell align="right">
					<Typography variant="h5" sx={{ color: BRAND_BLUE }}>
						{fila.vigente ? pesos(fila.vigente.valor) : "—"}
					</Typography>
				</TableCell>
				<TableCell>{fila.vigente?.periodo ?? "—"}</TableCell>
				<TableCell>{fecha(fila.vigente?.vigenciaDesde)}</TableCell>
				<TableCell align="center">
					{fila.fuente && (
						<Tooltip title="Ver la fuente oficial">
							<IconButton size="small" component={Link} href={fila.fuente} target="_blank" rel="noopener">
								<ExportSquare size={16} />
							</IconButton>
						</Tooltip>
					)}
				</TableCell>
			</TableRow>
			<TableRow>
				<TableCell sx={{ py: 0, borderBottom: abierta ? undefined : "none" }} colSpan={6}>
					<Collapse in={abierta} timeout="auto" unmountOnExit>
						<Box sx={{ my: 2, mx: 1 }}>
							{cargando ? (
								<Stack alignItems="center" sx={{ py: 3 }}>
									<CircularProgress size={22} />
								</Stack>
							) : (
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell>Período</TableCell>
											<TableCell align="right">Valor</TableCell>
											<TableCell>Vigente desde</TableCell>
											<TableCell>Norma</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{serie.map((v) => (
											<TableRow key={v._id} hover>
												<TableCell>{v.periodo}</TableCell>
												<TableCell align="right">{pesos(v.valor)}</TableCell>
												<TableCell>{fecha(v.vigenciaDesde)}</TableCell>
												<TableCell>
													<Typography variant="caption">{v.norma ?? "—"}</Typography>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</Box>
					</Collapse>
				</TableCell>
			</TableRow>
		</>
	);
};

// ─── Página ───────────────────────────────────────────────────────────────────

const Tabla = ({ filas }: { filas: ResumenJurisdiccion[] }) => (
	<TableContainer sx={{ overflowX: "auto" }}>
		<Table>
			<TableHead>
				<TableRow>
					<TableCell padding="checkbox" />
					<TableCell>Unidad / Jurisdicción</TableCell>
					<TableCell align="right">Valor vigente</TableCell>
					<TableCell>Período</TableCell>
					<TableCell>Vigente desde</TableCell>
					<TableCell align="center">Fuente</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{filas.map((f) => (
					<FilaValor key={`${f.unidad}-${f.ambito}`} fila={f} />
				))}
			</TableBody>
		</Table>
	</TableContainer>
);

const ValoresArancelarios = () => {
	const [filas, setFilas] = useState<ResumenJurisdiccion[]>([]);
	const [cargando, setCargando] = useState(false);
	const [error, setError] = useState(false);

	const cargar = useCallback(async () => {
		try {
			setCargando(true);
			setError(false);
			setFilas(await getResumenArancelario());
		} catch {
			setError(true);
		} finally {
			setCargando(false);
		}
	}, []);

	useEffect(() => {
		cargar();
	}, [cargar]);

	// UMA (nacional/CABA) arriba; el resto (JUS/IUS provinciales) abajo.
	const uma = filas.filter((f) => f.unidad === "UMA");
	const provinciales = filas.filter((f) => f.unidad !== "UMA");

	return (
		<Grid container spacing={2.5}>
			<Grid item xs={12}>
				<MainCard
					title={
						<Stack direction="row" spacing={1} alignItems="center">
							<DollarCircle size={22} />
							<Typography variant="h3">Valores arancelarios</Typography>
						</Stack>
					}
				>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
						Valores vigentes de UMA, JUS e IUS por jurisdicción — las unidades que se usan para regular honorarios de abogados. Se
						actualizan automáticamente desde las fuentes oficiales. Tocá una fila para ver el histórico.
					</Typography>

					{cargando ? (
						<Stack alignItems="center" sx={{ py: 6 }}>
							<CircularProgress />
						</Stack>
					) : error ? (
						<Typography variant="body2" color="error" sx={{ py: 4 }} align="center">
							No se pudieron cargar los valores. Probá de nuevo en un momento.
						</Typography>
					) : (
						<Stack spacing={3}>
							{uma.length > 0 && (
								<Box>
									<Typography variant="h5" sx={{ mb: 1 }}>
										UMA — Unidad de Medida Arancelaria
									</Typography>
									<Tabla filas={uma} />
								</Box>
							)}
							{provinciales.length > 0 && (
								<Box>
									<Typography variant="h5" sx={{ mb: 1 }}>
										JUS / IUS provinciales
									</Typography>
									<Tabla filas={provinciales} />
								</Box>
							)}
						</Stack>
					)}
				</MainCard>
			</Grid>
		</Grid>
	);
};

export default ValoresArancelarios;
