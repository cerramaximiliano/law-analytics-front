// sections/apps/teams/TeamReglasLogCard.tsx
// «Historial de asignaciones automáticas» en Mi equipo (14/11/2026, hub docs/REPARTO_POR_UBICACION_DINAMICO.md §8.4):
// una fila por carpeta y evento de las dos reglas (alta de causas nuevas y ubicación actual), con filtros, paginado y
// CSV. Solo propietario y administradores (el hub responde 403 al resto; la tarjeta no se muestra).
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
	Alert,
	Box,
	Button,
	Chip,
	Link,
	MenuItem,
	Paper,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TablePagination,
	TableRow,
	TextField,
	Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DocumentDownload, Clock } from "iconsax-react";

import { useDispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { juzgadoLabel } from "utils/folderDistribute";
import { getTeamAssignees, resolveAssignees } from "utils/teamAssignees";
import { buildCsv, downloadCsv, reportFilename } from "utils/teamReports";
import { apiError, getReglasLog, ReglaLogItem, ReglaLogQuery, ReglaLogResponse } from "utils/responsablesReglasApi";
import { stackedTableSx, wrapOnMobileSx } from "./stackedTableSx";

const KIND_LABEL: Record<string, string> = {
	juzgado: "1ª instancia",
	camara: "Cámara",
	corte: "Corte Suprema",
	"tribunal-oral": "Tribunal Oral",
	archivo: "Archivo General",
	otro: "Otra dependencia",
};
const kindLabel = (k: string | null) => (k ? KIND_LABEL[k] || k : "—");
const fmt = (iso: string) =>
	new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const TIPO_LABEL: Record<string, string> = {
	alta: "Causa nueva",
	cambio: "Cambio de instancia",
	restauracion: "Restauración",
	omitida: "Sin cambios",
};
const MOTIVO_LABEL: Record<string, string> = {
	nueva: "causa nueva sin tildar «asignar también las causas nuevas»",
	con_responsable: "ya tenía responsable propio",
};

/** Qué pasó, en una línea. */
function queFue(it: ReglaLogItem): string {
	if (it.regla === "alta") return `Causa nueva · ${it.clave ? juzgadoLabel(it.clave) : "Las demás"}`;
	const paso = it.de ? `${kindLabel(it.de)} → ${kindLabel(it.a)}` : `En ${kindLabel(it.a)}`;
	if (it.tipo === "omitida") return `${paso} · sin cambios (${MOTIVO_LABEL[it.motivo || ""] || it.motivo})`;
	if (it.tipo === "restauracion") return `${paso} · vuelve a quien la tenía`;
	return paso;
}

const EMPTY: ReglaLogQuery = { regla: "", tipo: "", responsable: "", desde: "", hasta: "", q: "" };

export default function TeamReglasLogCard() {
	const dispatch = useDispatch();
	const { activeTeam, isAdmin } = useTeam();
	const groupId = activeTeam?._id;
	const assignees = useMemo(() => getTeamAssignees(activeTeam, { includeInvitations: true }), [activeTeam]);
	const names = useCallback(
		(ids: string[]) =>
			ids.length
				? resolveAssignees(ids, assignees)
						.map((a) => a.name)
						.join(", ")
				: "Nadie",
		[assignees],
	);

	const [filters, setFilters] = useState<ReglaLogQuery>(EMPTY);
	const [q, setQ] = useState("");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(25);
	const [data, setData] = useState<ReglaLogResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [exporting, setExporting] = useState(false);

	// Búsqueda por carátula con una pausa corta.
	useEffect(() => {
		const t = setTimeout(() => {
			setFilters((f) => (f.q === q ? f : { ...f, q }));
			setPage(0);
		}, 350);
		return () => clearTimeout(t);
	}, [q]);

	const load = useCallback(async () => {
		if (!groupId || !isAdmin) return;
		setLoading(true);
		setLoadError(null);
		try {
			setData(await getReglasLog(groupId, { ...filters, page: page + 1, limit: rowsPerPage }));
		} catch (e) {
			setLoadError(apiError(e, "No se pudo cargar el historial"));
		} finally {
			setLoading(false);
		}
	}, [groupId, isAdmin, filters, page, rowsPerPage]);

	useEffect(() => {
		load();
	}, [load]);

	if (!activeTeam || !isAdmin) return null;

	const setFilter = (p: Partial<ReglaLogQuery>) => {
		setFilters((f) => ({ ...f, ...p }));
		setPage(0);
	};

	const handleCsv = async () => {
		if (!groupId) return;
		setExporting(true);
		try {
			const all: ReglaLogItem[] = [];
			for (let p = 1; p <= 20; p++) {
				const r = await getReglasLog(groupId, { ...filters, page: p, limit: 1000 });
				all.push(...r.items);
				if (all.length >= r.total || !r.items.length) break;
			}
			const csv = buildCsv(
				["Fecha", "Carpeta", "Regla", "Qué pasó", "Antes", "Después", "Entran", "Salen", "Origen"],
				all.map((it) => [
					fmt(it.at),
					it.folderName,
					it.regla === "alta" ? "Causas nuevas" : "Ubicación actual",
					queFue(it),
					names(it.antes),
					names(it.despues),
					it.entran.length ? names(it.entran) : "",
					it.salen.length ? names(it.salen) : "",
					it.origen === "cron" ? "Automática" : it.origen === "manual" ? "Aplicar ahora" : "Asistente",
				]),
			);
			downloadCsv(csv, reportFilename("historial-asignaciones-automaticas", activeTeam?.name, "csv"));
		} catch (e) {
			dispatch(
				openSnackbar({
					open: true,
					message: apiError(e, "No se pudo exportar el historial"),
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			setExporting(false);
		}
	};

	const sum = data?.summary;
	const chips = sum
		? [
				{ label: "Causas nuevas asignadas", n: sum.alta.alta || 0 },
				{ label: "Cambios de instancia", n: sum.ubicacion.cambio || 0 },
				{ label: "Restauraciones", n: sum.ubicacion.restauracion || 0 },
				{ label: "Sin cambios", n: sum.ubicacion.omitida || 0 },
		  ]
		: [];

	return (
		<Paper
			variant="outlined"
			sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, borderColor: alpha(BRAND_BLUE, 0.14) }}
			data-testid="team-reglas-log-card"
		>
			<Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} spacing={1} sx={{ mb: 0.5 }}>
				<Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
					<Clock size={18} />
					<Typography variant="subtitle2" fontWeight={600}>
						Historial de asignaciones automáticas
					</Typography>
				</Stack>
				<Button
					size="small"
					variant="outlined"
					color="secondary"
					startIcon={<DocumentDownload size={16} />}
					onClick={handleCsv}
					disabled={exporting || !data?.total}
					sx={{ textTransform: "none" }}
				>
					{exporting ? "Exportando…" : "Descargar CSV"}
				</Button>
			</Stack>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
				Cada carpeta que tocaron las reglas para las causas nuevas y por ubicación actual: cuándo, qué pasó y quién quedó a cargo.
			</Typography>

			<Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mb: 1.5 }} useFlexGap flexWrap="wrap">
				<TextField size="small" label="Carátula" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 180, flex: 1 }} />
				<TextField
					select
					size="small"
					label="Regla"
					value={filters.regla}
					onChange={(e) => setFilter({ regla: e.target.value as ReglaLogQuery["regla"] })}
					sx={{ minWidth: 160 }}
				>
					<MenuItem value="">Las dos</MenuItem>
					<MenuItem value="alta">Causas nuevas</MenuItem>
					<MenuItem value="ubicacion">Ubicación actual</MenuItem>
				</TextField>
				<TextField
					select
					size="small"
					label="Qué pasó"
					value={filters.tipo}
					onChange={(e) => setFilter({ tipo: e.target.value as ReglaLogQuery["tipo"] })}
					sx={{ minWidth: 170 }}
				>
					<MenuItem value="">Todo</MenuItem>
					{Object.entries(TIPO_LABEL).map(([k, l]) => (
						<MenuItem key={k} value={k}>
							{l}
						</MenuItem>
					))}
				</TextField>
				<TextField
					select
					size="small"
					label="Responsable"
					value={filters.responsable}
					onChange={(e) => setFilter({ responsable: e.target.value })}
					sx={{ minWidth: 180 }}
				>
					<MenuItem value="">Todos</MenuItem>
					{assignees.map((a) => (
						<MenuItem key={a.id} value={a.id}>
							{a.name}
						</MenuItem>
					))}
				</TextField>
				<TextField
					size="small"
					type="date"
					label="Desde"
					value={filters.desde}
					onChange={(e) => setFilter({ desde: e.target.value })}
					InputLabelProps={{ shrink: true }}
				/>
				<TextField
					size="small"
					type="date"
					label="Hasta"
					value={filters.hasta}
					onChange={(e) => setFilter({ hasta: e.target.value })}
					InputLabelProps={{ shrink: true }}
				/>
			</Stack>

			{chips.length > 0 && (
				<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
					{chips.map((c) => (
						<Chip key={c.label} size="small" variant="outlined" label={`${c.label}: ${c.n}`} />
					))}
				</Stack>
			)}

			{loading && !data ? (
				<Skeleton variant="rounded" height={120} />
			) : loadError ? (
				<Alert
					severity="error"
					action={
						<Button color="inherit" size="small" onClick={load}>
							Reintentar
						</Button>
					}
				>
					{loadError}
				</Alert>
			) : !data || data.total === 0 ? (
				<Alert severity="info" variant="outlined">
					Todavía no hay asignaciones automáticas
					{filters.regla || filters.tipo || filters.responsable || filters.q || filters.desde || filters.hasta ? " con estos filtros" : ""}.
				</Alert>
			) : (
				<Box sx={{ opacity: loading ? 0.6 : 1 }}>
					<Table size="small" sx={stackedTableSx}>
						<TableHead>
							<TableRow>
								<TableCell sx={{ width: { sm: 140 } }}>Fecha</TableCell>
								<TableCell>Carpeta</TableCell>
								<TableCell>Qué pasó</TableCell>
								<TableCell>Antes → después</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{data.items.map((it) => (
								<TableRow key={it._id}>
									<TableCell data-label="Fecha">
										<Typography variant="body2">{fmt(it.at)}</Typography>
										<Typography variant="caption" color="text.secondary">
											{it.origen === "cron" ? "Automática" : it.origen === "manual" ? "Aplicar ahora" : "Asistente"}
										</Typography>
									</TableCell>
									<TableCell data-label="Carpeta">
										<Link component={RouterLink} to={`/apps/folders/details/${it.folderId}`} underline="hover" sx={wrapOnMobileSx}>
											{it.folderName || "Sin carátula"}
										</Link>
										<Typography variant="caption" color="text.secondary" component="div">
											{it.regla === "alta" ? "Regla para las causas nuevas" : "Regla por ubicación actual"}
										</Typography>
									</TableCell>
									<TableCell data-label="Qué pasó">
										<Typography variant="body2">{queFue(it)}</Typography>
									</TableCell>
									<TableCell data-label="Antes → después">
										<Typography variant="body2" sx={wrapOnMobileSx}>
											{it.tipo === "omitida" ? names(it.antes) : `${names(it.antes)} → ${names(it.despues)}`}
										</Typography>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<TablePagination
						component="div"
						count={data.total}
						page={page}
						onPageChange={(_e, p) => setPage(p)}
						rowsPerPage={rowsPerPage}
						onRowsPerPageChange={(e) => {
							setRowsPerPage(parseInt(e.target.value, 10));
							setPage(0);
						}}
						rowsPerPageOptions={[10, 25, 50, 100]}
						labelRowsPerPage="Filas"
						labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
					/>
				</Box>
			)}
		</Paper>
	);
}
