import { useState } from "react";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	Typography,
	alpha,
	useTheme,
} from "@mui/material";
import { Warning2 } from "iconsax-react";
import { useDispatch } from "store";
import { useSnackbar } from "notistack";
import { unlinkFolderFromCausa } from "store/reducers/folder";
import { getFolderById } from "store/reducers/folder";

/**
 * Confirmación para desvincular una carpeta de su causa.
 *
 * Hasta 2026-08-26 la única salida para una carpeta vinculada al expediente
 * equivocado era borrarla, perdiendo tareas, notas, eventos, cálculos,
 * contactos y documentos. Acá se corta solo el vínculo.
 */

interface UnlinkFolderDialogProps {
	open: boolean;
	onClose: () => void;
	folderId: string;
	folderName?: string;
	/** Etiqueta del sistema del que se desvincula, para el copy. */
	origen: string;
}

const UnlinkFolderDialog = ({ open, onClose, folderId, folderName, origen }: UnlinkFolderDialogProps) => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const { enqueueSnackbar } = useSnackbar();
	const [loading, setLoading] = useState(false);

	const handleUnlink = async () => {
		setLoading(true);
		const result: any = await dispatch(unlinkFolderFromCausa(folderId));
		setLoading(false);

		enqueueSnackbar(result?.message || (result?.success ? "Carpeta desvinculada" : "No se pudo desvincular"), {
			variant: result?.success ? "success" : "error",
			anchorOrigin: { vertical: "bottom", horizontal: "right" },
			autoHideDuration: 5000,
		});

		if (result?.success) {
			dispatch(getFolderById(folderId, true));
			onClose();
		}
	};

	return (
		<Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
			<DialogTitle sx={{ fontSize: "1rem", fontWeight: 600 }}>Desvincular carpeta</DialogTitle>
			<DialogContent>
				<Stack spacing={1.5}>
					<Typography sx={{ fontSize: "0.85rem", color: "text.primary", lineHeight: 1.55 }}>
						{folderName ? <strong>{folderName}</strong> : "Esta carpeta"} va a dejar de sincronizarse con {origen}.
					</Typography>

					<Box
						sx={{
							p: 1.25,
							borderRadius: 1.25,
							bgcolor: alpha(theme.palette.success.main, theme.palette.mode === "dark" ? 0.1 : 0.06),
							border: `1px solid ${alpha(theme.palette.success.main, theme.palette.mode === "dark" ? 0.28 : 0.2)}`,
						}}
					>
						<Typography sx={{ fontSize: "0.8rem", color: "text.secondary", lineHeight: 1.5 }}>
							<Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
								No se borra nada.
							</Box>{" "}
							La carpeta conserva sus movimientos, tareas, notas, eventos, cálculos, contactos y documentos. Solo deja de recibir
							actualizaciones del portal.
						</Typography>
					</Box>

					<Stack direction="row" spacing={1} alignItems="flex-start">
						<Warning2 size={15} variant="Bulk" color={theme.palette.warning.main} style={{ marginTop: 2, flexShrink: 0 }} />
						<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1.5 }}>
							Después vas a poder volver a vincularla al expediente correcto desde la misma carpeta.
						</Typography>
					</Stack>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2.5 }}>
				<Button onClick={onClose} disabled={loading} color="inherit" size="small">
					Cancelar
				</Button>
				<Button onClick={handleUnlink} disabled={loading} variant="contained" color="warning" size="small">
					{loading ? "Desvinculando…" : "Desvincular"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default UnlinkFolderDialog;
