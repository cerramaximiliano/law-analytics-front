/**
 * Expedientes vinculados (incidentes) de una carpeta PJN principal.
 *
 * Fuente: GET /api/folders/:id/vinculados — filas de la pestaña "Vinculados" del portal
 * público que pjn-workers captura al verificar el principal (parte 2 del servicio de
 * incidentes, 2026-09-29). Cada fila trae su estado para este usuario: seguida (tiene
 * carpeta → link), reservada (solo con credencial), retirada (ya no figura) o disponible
 * (la acción "Seguir" llega en la parte 3).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Box,
	Chip,
	CircularProgress,
	Link,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Hierarchy } from "iconsax-react";
import dayjs from "utils/dayjs-config";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";
import { getPjnVinculadosByFolder } from "services/pjnVinculadosService";
import type { PjnVinculadoRow, PjnVinculadosResponse, PjnVinculadoState } from "types/pjnVinculados";
import type { FolderData } from "types/folder";

interface Props {
	folder: Pick<FolderData, "_id" | "pjn" | "causaId"> | null | undefined;
}

const STATE_META: Record<PjnVinculadoState, { label: string; color: string; tooltip: string }> = {
	seguida: { label: "Seguida", color: LIVE_GREEN, tooltip: "Ya tenés una carpeta de este incidente." },
	reservada: {
		label: "Reservado",
		color: STALE_AMBER,
		tooltip: "El tribunal reservó este incidente: solo puede verlo quien lo tenga asignado en su credencial PJN.",
	},
	retirada: { label: "Ya no figura", color: "#9e9e9e", tooltip: "Dejó de aparecer en la pestaña Vinculados del portal." },
	disponible: { label: "Disponible", color: BRAND_BLUE, tooltip: "Figura en el portal. Pronto vas a poder seguirlo desde acá." },
};

const fecha = (iso: string | null) => (iso ? dayjs(iso).format("DD/MM/YYYY") : "—");

export default function PjnVinculadosSection({ folder }: Props) {
	const theme = useTheme();
	const navigate = useNavigate();
	const folderId = folder?._id;
	const aplica = !!folder && folder.pjn === true && !!folder.causaId;
	const [data, setData] = useState<PjnVinculadosResponse["data"] | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!aplica || !folderId) return;
		let cancel = false;
		setLoading(true);
		setError(null);
		getPjnVinculadosByFolder(folderId)
			.then((r) => {
				if (!cancel) setData(r.data);
			})
			.catch(() => {
				if (!cancel) setError("No se pudieron cargar los expedientes vinculados.");
			})
			.finally(() => {
				if (!cancel) setLoading(false);
			});
		return () => {
			cancel = true;
		};
	}, [aplica, folderId]);

	// Carpetas sin causa PJN, de incidentes o de fueros sin pestaña: la sección no se muestra.
	if (!aplica) return null;
	if (
		data &&
		(data.reason === "es_incidente" ||
			data.reason === "sin_causa_pjn" ||
			data.reason === "fuero_sin_vinculados" ||
			data.reason === "causa_no_encontrada")
	)
		return null;

	const rows: PjnVinculadoRow[] = data?.vinculados ?? [];
	const visibles = rows.filter((r) => r.state !== "retirada");
	const retiradas = rows.length - visibles.length;
	const meta = data?.meta ?? null;

	return (
		<Box
			sx={{
				mt: 2,
				p: 2,
				borderRadius: 1.5,
				border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
				bgcolor: theme.palette.background.paper,
			}}
		>
			<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
				<Hierarchy size={18} variant="Bulk" color={BRAND_BLUE} />
				<Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
					Expedientes vinculados{meta && rows.length ? ` (${visibles.length})` : ""}
				</Typography>
				{meta?.capturedAt && (
					<Typography variant="caption" color="text.secondary">
						según el portal al {fecha(meta.capturedAt)}
						{meta.total !== null && meta.total > rows.length ? ` · ${meta.total} declarados` : ""}
						{retiradas ? ` · ${retiradas} ya no figura${retiradas > 1 ? "n" : ""}` : ""}
					</Typography>
				)}
			</Stack>

			{loading && (
				<Stack direction="row" spacing={1} alignItems="center">
					<CircularProgress size={16} />
					<Typography variant="caption" color="text.secondary">
						Cargando…
					</Typography>
				</Stack>
			)}
			{!loading && error && (
				<Typography variant="body2" color="error">
					{error}
				</Typography>
			)}
			{!loading && !error && data && !meta && (
				<Typography variant="body2" color="text.secondary">
					Todavía no leímos la pestaña Vinculados de este expediente. Se completa en la próxima verificación.
				</Typography>
			)}
			{!loading && !error && meta && rows.length === 0 && (
				<Typography variant="body2" color="text.secondary">
					{meta.portalMsg ? "El expediente no tiene vinculados visibles en el portal." : "Sin expedientes vinculados."}
				</Typography>
			)}
			{!loading && !error && rows.length > 0 && (
				<Box sx={{ overflowX: "auto" }}>
					<Table size="small" sx={{ minWidth: 640 }}>
						<TableHead>
							<TableRow>
								<TableCell sx={{ whiteSpace: "nowrap" }}>Incidente</TableCell>
								<TableCell>Carátula</TableCell>
								<TableCell>Dependencia</TableCell>
								<TableCell>Situación</TableCell>
								<TableCell sx={{ whiteSpace: "nowrap" }}>Últ. act.</TableCell>
								<TableCell>Estado</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.map((r) => {
								const m = STATE_META[r.state];
								const atenuada = r.state === "retirada";
								return (
									<TableRow key={r.incidente} sx={{ opacity: atenuada ? 0.55 : 1 }}>
										<TableCell sx={{ whiteSpace: "nowrap", fontFamily: "monospace" }}>
											<Tooltip title={r.expediente || ""}>
												<span>/{r.incidente}</span>
											</Tooltip>
										</TableCell>
										<TableCell sx={{ maxWidth: 420 }}>
											<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
												{r.caratula || "—"}
											</Typography>
										</TableCell>
										<TableCell sx={{ fontSize: "0.78rem" }}>{r.dependencia || "—"}</TableCell>
										<TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{r.situacion || "—"}</TableCell>
										<TableCell sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{fecha(r.ultAct)}</TableCell>
										<TableCell sx={{ whiteSpace: "nowrap" }}>
											<Stack direction="row" spacing={1} alignItems="center">
												<Tooltip title={m.tooltip}>
													<Chip
														size="small"
														label={m.label}
														sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, color: m.color, bgcolor: alpha(m.color, 0.12) }}
													/>
												</Tooltip>
												{r.state === "seguida" && r.folderId && (
													<Link
														component="button"
														variant="caption"
														onClick={() => navigate(`/apps/folders/details/${r.folderId}`)}
														sx={{ fontWeight: 600 }}
													>
														{r.folderArchived ? "Ver carpeta (archivada)" : "Ver carpeta"}
													</Link>
												)}
											</Stack>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</Box>
			)}
		</Box>
	);
}
