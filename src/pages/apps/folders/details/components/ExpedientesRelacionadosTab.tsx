/**
 * Pestaña "Expedientes relacionados" del detalle (2026-09-29): acumulación (la causa se acumuló a
 * otra, o se acumularon causas a ésta) y la tabla de expedientes vinculados del portal
 * (PjnVinculadosSection: incidentes con "Seguir", y en carpetas de incidente el acceso al
 * principal). Datos: GET /api/folders/:id/relaciones y /vinculados.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Link21 } from "iconsax-react";
import dayjs from "utils/dayjs-config";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { getRelacionesByFolder, type RelacionesData, type CarpetaRef } from "services/pjnRelacionesService";
import PjnVinculadosSection from "./PjnVinculadosSection";
import type { FolderData } from "types/folder";
import { dispatch } from "store";
import { addFolder } from "store/reducers/folder";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";

interface Props {
	folder: Pick<FolderData, "_id" | "pjn" | "causaId" | "causaType" | "folderFuero"> | null | undefined;
}

// Inverso de causaService.getCausaTypeByPjnCode (hub) para los fueros con acumulación registrada.
const PJN_CODE: Record<string, string> = { CausasCivil: "1", CausasSegSocial: "5", CausasTrabajo: "7", CausasComercial: "10" };

const fecha = (iso: string | null) => (iso ? dayjs.utc(iso).format("DD/MM/YYYY") : null);

export default function ExpedientesRelacionadosTab({ folder }: Props) {
	const navigate = useNavigate();
	const folderId = folder?._id;
	const [data, setData] = useState<RelacionesData | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!folderId || !folder?.pjn) return;
		let cancel = false;
		setLoading(true);
		getRelacionesByFolder(folderId)
			.then((r) => !cancel && setData(r))
			.catch(() => !cancel && setData(null))
			.finally(() => !cancel && setLoading(false));
		return () => {
			cancel = true;
		};
	}, [folderId, folder?.pjn]);

	const { getUserIdForResource, getTeamIdForResource, getRequestHeaders } = useTeam();
	const [siguiendo, setSiguiendo] = useState(false);
	const verCarpeta = (c: CarpetaRef) => navigate(`/apps/folders/details/${c.folderId}`);
	// "Seguir" la otra causa: alta normal de carpeta PJN (tope del plan + guard de duplicados).
	const seguirOtra = async (number: number, year: number) => {
		const pjnCode = folder?.causaType ? PJN_CODE[folder.causaType] : undefined;
		if (!pjnCode) return;
		setSiguiendo(true);
		const res: any = await dispatch(
			addFolder(
				{
					folderName: `Expediente ${number}/${year}`,
					materia: "Sin definir",
					orderStatus: "Sin definir",
					status: "Nueva",
					description: `Causa acumulada vinculada a esta carpeta`,
					folderFuero: folder?.folderFuero || undefined,
					pjnCode,
					pjn: true,
					source: "auto",
					expedientNumber: String(number),
					expedientYear: String(year),
					userId: getUserIdForResource(),
					...(getTeamIdForResource() ? { groupId: getTeamIdForResource() } : {}),
				} as any,
				{ headers: getRequestHeaders() },
			) as any,
		);
		setSiguiendo(false);
		dispatch(
			openSnackbar({
				open: true,
				message: res?.success
					? `Seguís el expte. ${number}/${year}. Lo verificamos en la próxima pasada.`
					: res?.message || "No se pudo seguir la causa.",
				variant: "alert",
				alert: { color: res?.success ? "success" : "error" },
				close: true,
			}),
		);
		if (res?.success && folderId)
			getRelacionesByFolder(folderId)
				.then(setData)
				.catch(() => undefined);
	};
	const ac = data?.acumulacion || null;
	const acumuladas = data?.acumuladas || [];

	return (
		<Box sx={{ p: { xs: 1, sm: 2 } }}>
			{loading && (
				<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
					<CircularProgress size={16} />
					<Typography variant="caption" color="text.secondary">
						Cargando…
					</Typography>
				</Stack>
			)}

			{(ac || acumuladas.length > 0) && (
				<Box sx={{ mb: 2 }}>
					<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
						<Link21 size={18} variant="Bold" color={BRAND_BLUE} />
						<Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>Acumulación</Typography>
					</Stack>
					{ac && (
						<Alert
							severity={ac.rol === "acumulada" ? "warning" : "info"}
							sx={{ mb: 1 }}
							action={
								ac.otra ? (
									ac.otra.carpeta ? (
										<Button color="inherit" size="small" onClick={() => verCarpeta(ac.otra!.carpeta!)}>
											Ver carpeta{ac.otra.carpeta.archived ? " (archivada)" : ""}
										</Button>
									) : (
										<Button
											color="inherit"
											size="small"
											disabled={siguiendo || !folder?.causaType}
											onClick={() => seguirOtra(ac.otra!.number, ac.otra!.year)}
										>
											{siguiendo ? <CircularProgress size={14} /> : `Seguir ${ac.otra.number}/${ac.otra.year}`}
										</Button>
									)
								) : undefined
							}
						>
							<Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>
								{ac.rol === "acumulada"
									? `Esta causa se acumuló ${ac.otra ? `al expte. ${ac.otra.number}/${ac.otra.year}` : "a otra causa"}${
											fecha(ac.fecha) ? ` el ${fecha(ac.fecha)}` : ""
									  }`
									: `Acumulación${ac.otra ? ` con el expte. ${ac.otra.number}/${ac.otra.year}` : ""}${
											fecha(ac.fecha) ? ` (${fecha(ac.fecha)})` : ""
									  }`}
							</Typography>
							<Typography variant="body2">
								{ac.rol === "acumulada"
									? "Las novedades siguen en esa causa. Esta carpeta conserva los movimientos hasta la acumulación."
									: ac.detalle || ""}
								{ac.resync && ac.resync.incorporados > 0
									? ` El portal reorganizó el historial: se incorporaron ${ac.resync.incorporados} y se retiraron ${ac.resync.retirados} actuaciones.`
									: ""}
							</Typography>
						</Alert>
					)}
					{acumuladas.map((a) => (
						<Alert
							key={`${a.number}/${a.year}/${a.incidente || ""}`}
							severity="info"
							sx={{ mb: 1 }}
							action={
								a.carpeta ? (
									<Button color="inherit" size="small" onClick={() => verCarpeta(a.carpeta!)}>
										Ver carpeta{a.carpeta.archived ? " (archivada)" : ""}
									</Button>
								) : undefined
							}
						>
							<Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>
								Se acumuló a esta causa: {a.number}/{a.year}
								{a.incidente ? `/${a.incidente}` : ""}
								{fecha(a.fecha) ? ` (${fecha(a.fecha)})` : ""}
							</Typography>
							<Typography variant="body2">Sus actuaciones se incorporan a esta causa con sus fechas originales.</Typography>
						</Alert>
					))}
				</Box>
			)}

			<PjnVinculadosSection folder={folder} />

			{!loading && data && !ac && acumuladas.length === 0 && !folder?.causaId && (
				<Typography variant="body2" color="text.secondary">
					Esta carpeta no tiene expedientes relacionados.
				</Typography>
			)}
		</Box>
	);
}
