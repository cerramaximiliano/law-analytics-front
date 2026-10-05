import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import { Button } from "@mui/material";

import ExpedienteExportDialog from "sections/apps/folders/ExpedienteExportDialog";
import { getExpedienteExport } from "services/expedienteExportService";
import {
	isExportDialogOpen,
	listTrackedExports,
	onOpenExpedienteExport,
	openExpedienteExport,
	untrackExport,
} from "utils/expedienteExportTracker";

/**
 * Descarga del expediente PJN: modal único de la app + aviso de finalización.
 *
 * - Monta el ExpedienteExportDialog y lo abre cuando cualquier vista llama a
 *   openExpedienteExport() (menú del listado, botón del detalle, este aviso).
 * - Mientras haya descargas en curso registradas (expedienteExportTracker),
 *   consulta su estado y avisa con un snackbar cuando terminan, desde
 *   cualquier ruta. Sin esto el usuario que cerró el modal tenía que volver
 *   a abrirlo para enterarse.
 *
 * Solo consulta si hay algo registrado y no hay un modal abierto para esa
 * carpeta (ahí el progreso ya está a la vista).
 */
const POLL_MS = 8000;

const GlobalExpedienteExportListener = () => {
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();
	const [folder, setFolder] = useState<{ id: string; name: string } | null>(null);

	useEffect(() => onOpenExpedienteExport(setFolder), []);

	useEffect(() => {
		let cancelled = false;
		let running = false;

		const tick = async () => {
			if (running) return;
			running = true;
			try {
				for (const entry of listTrackedExports()) {
					if (cancelled || isExportDialogOpen(entry.folderId)) continue;
					let job;
					try {
						const res = await getExpedienteExport(entry.folderId);
						job = res.job ?? null;
					} catch (_err) {
						// Sin sesión, sin permiso o carpeta borrada: se deja de seguir.
						untrackExport(entry.folderId);
						continue;
					}
					if (cancelled) return;
					if (job && (job.status === "queued" || job.status === "processing")) continue;
					// Terminó (o ya no existe). Si el modal lo vio primero, ya no está registrado.
					const stillTracked = listTrackedExports().some((e) => e.folderId === entry.folderId);
					untrackExport(entry.folderId);
					if (!stillTracked || !job || isExportDialogOpen(entry.folderId)) continue;

					const name = entry.folderName ? ` de ${entry.folderName}` : "";
					if (job.status === "completed") {
						enqueueSnackbar(`El expediente${name} está listo para descargar.`, {
							variant: "success",
							anchorOrigin: { vertical: "bottom", horizontal: "right" },
							autoHideDuration: 15000,
							action: (key) => (
								<Button
									size="small"
									onClick={() => {
										closeSnackbar(key);
										openExpedienteExport(entry.folderId, entry.folderName);
									}}
									sx={{ color: "inherit", textTransform: "none", fontWeight: 600 }}
								>
									Descargar
								</Button>
							),
						});
					} else if (job.status === "failed") {
						enqueueSnackbar(`No se pudo generar el expediente${name}. Intentá de nuevo.`, {
							variant: "error",
							anchorOrigin: { vertical: "bottom", horizontal: "right" },
							autoHideDuration: 10000,
						});
					}
				}
			} finally {
				running = false;
			}
		};

		const interval = setInterval(tick, POLL_MS);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [enqueueSnackbar, closeSnackbar]);

	return (
		<ExpedienteExportDialog
			open={Boolean(folder)}
			onClose={() => setFolder(null)}
			folderId={folder?.id ?? null}
			folderName={folder?.name}
		/>
	);
};

export default GlobalExpedienteExportListener;
