/**
 * Diálogo «Re-sincronizar» de la cuenta PJN (2/11/2026, la-ads §2.2).
 *
 * Antes de hacer nada muestra qué va a pasar: las carpetas eliminadas que se pueden traer de vuelta (casilla
 * opcional, apagada por defecto), las causas que ya no figuran en el portal (solo informativo: siguen en
 * Law||Analytics y se actualizan mientras sean públicas), el cupo y la última sincronización.
 */
import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControlLabel,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";
import { Refresh2 } from "iconsax-react";
import type { PjnResyncPreview } from "api/pjnCredentials";

interface Props {
	open: boolean;
	loading: boolean;
	submitting: boolean;
	preview: PjnResyncPreview | null;
	error?: string | null;
	onClose: () => void;
	onConfirm: (restoreFolderIds: string[]) => void;
}

const fecha = (v?: string | null) =>
	v ? new Date(v).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : null;

const PjnResyncDialog = ({ open, loading, submitting, preview, error, onClose, onConfirm }: Props) => {
	const [restaurar, setRestaurar] = useState(false);
	const [elegidas, setElegidas] = useState<Set<string>>(new Set());

	// Cada vez que se abre arranca con la casilla apagada y todas las eliminadas preseleccionadas (para cuando se enciende)
	useEffect(() => {
		if (!open) return;
		setRestaurar(false);
		setElegidas(new Set((preview?.trashed.folders || []).map((f) => f._id)));
	}, [open, preview]);

	const eliminadas = preview?.trashed.folders || [];
	const bajas = preview?.removed.folders || [];
	const seleccionadas = useMemo(() => (restaurar ? eliminadas.filter((f) => elegidas.has(f._id)) : []), [restaurar, eliminadas, elegidas]);
	const cupo = preview?.quota.remaining;
	const activasARestaurar = seleccionadas.filter((f) => !f.archived).length;
	const sinCupo = typeof cupo === "number" && activasARestaurar > cupo;

	const toggle = (id: string) =>
		setElegidas((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	return (
		<Dialog open={open} onClose={() => !submitting && onClose()} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "1rem" }}>
				<Refresh2 size={20} /> Re-sincronizar con el Poder Judicial
			</DialogTitle>
			<DialogContent dividers>
				{loading && (
					<Stack alignItems="center" sx={{ py: 3 }}>
						<CircularProgress size={28} />
					</Stack>
				)}
				{!loading && error && <Alert severity="error">{error}</Alert>}
				{!loading && preview && (
					<Stack spacing={2}>
						<Typography variant="body2" color="text.secondary">
							Se vuelve a leer la lista completa de tu cuenta del portal y se agregan las causas que todavía no están en Law||Analytics. Si
							superan el cupo del plan, quedan archivadas.
							{preview.lastSync && <> Última sincronización: {fecha(preview.lastSync)}.</>}
						</Typography>

						{preview.syncInProgress && <Alert severity="warning">Ya hay una sincronización en curso. Esperá a que termine.</Alert>}

						{eliminadas.length > 0 && (
							<Box>
								<FormControlLabel
									control={
										<Checkbox checked={restaurar} onChange={(e) => setRestaurar(e.target.checked)} data-testid="pjn-resync-restore" />
									}
									label={
										<Typography variant="body2">
											Traer de vuelta{" "}
											{eliminadas.length === 1 ? "la carpeta que eliminaste" : `las ${eliminadas.length} carpetas que eliminaste`} (con sus
											tareas, eventos y notas)
										</Typography>
									}
								/>
								<List dense disablePadding sx={{ maxHeight: 180, overflowY: "auto", pl: 1 }}>
									{eliminadas.map((f) => (
										<ListItem key={f._id} disablePadding sx={{ opacity: restaurar ? 1 : 0.55 }}>
											<ListItemIcon sx={{ minWidth: 32 }}>
												<Checkbox
													edge="start"
													size="small"
													disabled={!restaurar}
													checked={restaurar && elegidas.has(f._id)}
													onChange={() => toggle(f._id)}
												/>
											</ListItemIcon>
											<ListItemText
												primaryTypographyProps={{ variant: "body2", noWrap: true }}
												secondaryTypographyProps={{ variant: "caption" }}
												primary={f.folderName}
												secondary={[
													f.expediente,
													f.deletedAt ? `eliminada el ${fecha(f.deletedAt)}` : null,
													f.archived ? "archivada" : null,
												]
													.filter(Boolean)
													.join(" · ")}
											/>
										</ListItem>
									))}
								</List>
								{sinCupo && (
									<Alert severity="info" sx={{ mt: 1 }}>
										Tu plan tiene lugar para {cupo} {cupo === 1 ? "carpeta activa más" : "carpetas activas más"}: las que no entren vuelven
										archivadas y podés desarchivarlas cuando quieras.
									</Alert>
								)}
							</Box>
						)}

						{bajas.length > 0 && (
							<>
								<Divider />
								<Box>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										{bajas.length === 1 ? "1 causa ya no figura" : `${bajas.length} causas ya no figuran`} en tu cuenta del portal
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Siguen en Law||Analytics y se actualizan mientras sean públicas. No se tocan.
									</Typography>
									<List dense disablePadding sx={{ maxHeight: 120, overflowY: "auto", pl: 1 }}>
										{bajas.map((f) => (
											<ListItem key={f._id} disablePadding>
												<ListItemText
													primaryTypographyProps={{ variant: "body2", noWrap: true }}
													secondaryTypographyProps={{ variant: "caption" }}
													primary={f.folderName}
													secondary={[f.expediente, f.listRemovedAt ? `desde el ${fecha(f.listRemovedAt)}` : null]
														.filter(Boolean)
														.join(" · ")}
												/>
											</ListItem>
										))}
									</List>
								</Box>
							</>
						)}
					</Stack>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 1.5 }}>
				<Button onClick={onClose} disabled={submitting} color="inherit">
					Cancelar
				</Button>
				<Button
					variant="contained"
					onClick={() => onConfirm(seleccionadas.map((f) => f._id))}
					disabled={loading || submitting || !preview || preview.syncInProgress || !!error}
					startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <Refresh2 size={16} />}
					data-testid="pjn-resync-confirm"
				>
					{seleccionadas.length ? `Re-sincronizar y traer ${seleccionadas.length}` : "Re-sincronizar"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default PjnResyncDialog;
