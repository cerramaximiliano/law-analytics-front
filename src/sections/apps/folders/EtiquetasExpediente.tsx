import React, { useEffect, useState } from "react";
import axios from "axios";
import {
	Alert,
	Box,
	Button,
	Checkbox,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	ListItemText,
	Menu,
	MenuItem,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Add, Setting2, Tag, Trash } from "iconsax-react";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import useEtiquetasExpediente, { Etiqueta } from "hooks/useEtiquetasExpediente";

// ==============================|| ETIQUETAS DEL EXPEDIENTE ||============================== //
// Etiquetas que crea cada estudio («Haber reajustado», «Embargo»…) y pone en sus carpetas
// para después filtrar el listado. Nombre y color los elige el estudio.

const API = import.meta.env.VITE_BASE_URL;
const COLORES = ["#2e7d32", "#d32f2f", "#1565c0", "#ef6c00", "#6a1b9a", "#00838f", "#5d4037", "#455a64"];

const luminancia = (hex: string) => {
	const n = parseInt(hex.slice(1), 16);
	const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const EtiquetaChip = ({ etiqueta, onDelete }: { etiqueta: Etiqueta; onDelete?: () => void }) => (
	<Chip
		size="small"
		label={etiqueta.nombre}
		onDelete={onDelete}
		data-testid="etiqueta-chip"
		sx={{
			height: 22,
			maxWidth: 220,
			fontSize: "0.72rem",
			fontWeight: 600,
			bgcolor: etiqueta.color,
			color: luminancia(etiqueta.color) > 0.6 ? "#1b2533" : "#fff",
			"& .MuiChip-deleteIcon": { color: "inherit", opacity: 0.7, "&:hover": { color: "inherit", opacity: 1 } },
		}}
	/>
);

/** Etiquetas de una carpeta en una celda del listado. */
export const EtiquetasCell = ({ ids }: { ids?: string[] }) => {
	const { etiquetas } = useEtiquetasExpediente();
	const set = new Set((ids || []).map(String));
	const propias = etiquetas.filter((e) => set.has(String(e._id)));
	if (!propias.length) return null;
	return (
		<Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
			{propias.map((e) => (
				<EtiquetaChip key={e._id} etiqueta={e} />
			))}
		</Stack>
	);
};

// ── Administrar el catálogo ────────────────────────────────────────────────────

export const EtiquetasConfigDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
	const { etiquetas, guardar } = useEtiquetasExpediente();
	const [draft, setDraft] = useState<Etiqueta[]>([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			setDraft(etiquetas.map((e) => ({ ...e })));
			setError(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const cambiar = (i: number, patch: Partial<Etiqueta>) => setDraft((d) => d.map((e, j) => (j === i ? { ...e, ...patch } : e)));

	const onGuardar = async () => {
		setSaving(true);
		setError(null);
		try {
			await guardar(draft);
			dispatch(openSnackbar({ open: true, message: "Etiquetas guardadas.", variant: "alert", alert: { color: "success" }, close: true }));
			onClose();
		} catch (e: any) {
			setError(e?.response?.data?.message || "No se pudieron guardar las etiquetas.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ pb: 0.5 }}>Etiquetas del expediente</DialogTitle>
			<DialogContent>
				<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mb: 2 }}>
					Creá las etiquetas que usa tu estudio (por ejemplo «Haber reajustado» o «Embargo»). Después las ponés en cada carpeta y filtrás el
					listado por ellas. Valen para todo el equipo.
				</Typography>
				{error && (
					<Alert severity="error" sx={{ mb: 1.5 }}>
						{error}
					</Alert>
				)}
				<Stack spacing={1}>
					{draft.map((e, i) => (
						<Stack key={e._id || `nueva-${i}`} direction="row" spacing={1} alignItems="center" data-testid="etiqueta-config-fila">
							<Tooltip title="Color">
								<Box
									component="input"
									type="color"
									value={e.color}
									onChange={(ev: React.ChangeEvent<HTMLInputElement>) => cambiar(i, { color: ev.target.value })}
									aria-label={`Color de ${e.nombre || "etiqueta"}`}
									sx={{ width: 36, height: 36, p: 0, border: "none", bgcolor: "transparent", cursor: "pointer", flexShrink: 0 }}
								/>
							</Tooltip>
							<TextField
								size="small"
								label="Nombre"
								value={e.nombre}
								onChange={(ev) => cambiar(i, { nombre: ev.target.value.slice(0, 40) })}
								fullWidth
								autoFocus={!e._id && i === draft.length - 1}
							/>
							<Tooltip title="Quitar etiqueta. Se saca también de las carpetas que la tenían.">
								<IconButton size="small" onClick={() => setDraft((d) => d.filter((_, j) => j !== i))} aria-label="Quitar etiqueta">
									<Trash size={16} />
								</IconButton>
							</Tooltip>
						</Stack>
					))}
				</Stack>
				{draft.length === 0 && (
					<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", py: 1.5, textAlign: "center" }}>
						Todavía no hay etiquetas.
					</Typography>
				)}
				<Button
					size="small"
					startIcon={<Add size={16} />}
					onClick={() => setDraft((d) => [...d, { nombre: "", color: COLORES[d.length % COLORES.length] }])}
					disabled={draft.length >= 60}
					sx={{ mt: 1.5 }}
				>
					Agregar etiqueta
				</Button>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} disabled={saving} color="secondary">
					Cancelar
				</Button>
				<Button onClick={onGuardar} disabled={saving || draft.some((e) => !e.nombre.trim())} variant="contained">
					{saving ? "Guardando…" : "Guardar"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

// ── Etiquetas de una carpeta (detalle) ─────────────────────────────────────────

interface FolderEtiquetasProps {
	folderId: string;
	/** Ids de las etiquetas que tiene la carpeta. */
	value: string[];
	onChange: (ids: string[]) => void;
	/** Puede poner y quitar etiquetas (titular, administrador o editor). */
	canEdit: boolean;
}

export const FolderEtiquetas = ({ folderId, value, onChange, canEdit }: FolderEtiquetasProps) => {
	const { etiquetas, canConfig, loaded } = useEtiquetasExpediente();
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	const [configOpen, setConfigOpen] = useState(false);
	const [saving, setSaving] = useState(false);

	const set = new Set(value.map(String));
	const propias = etiquetas.filter((e) => set.has(String(e._id)));

	const guardar = async (ids: string[]) => {
		setSaving(true);
		try {
			const res = await axios.put(`${API}/api/folders/${folderId}/estados`, { estados: ids });
			onChange(res.data?.estados || ids);
		} catch (e: any) {
			dispatch(
				openSnackbar({
					open: true,
					message: e?.response?.data?.message || "No se pudieron guardar las etiquetas.",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			setSaving(false);
		}
	};
	const toggle = (id: string) => guardar(set.has(id) ? value.filter((x) => x !== id) : [...value, id]);

	// Sin catálogo y sin permiso para crearlo no hay nada que mostrar.
	if (!loaded || (etiquetas.length === 0 && !canConfig)) return null;

	return (
		<Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap data-testid="folder-etiquetas">
			<Typography
				sx={{ fontSize: "0.66rem", fontWeight: 600, color: "text.secondary", letterSpacing: "0.06em", textTransform: "uppercase" }}
			>
				Etiquetas
			</Typography>
			{propias.map((e) => (
				<EtiquetaChip key={e._id} etiqueta={e} onDelete={canEdit && !saving ? () => toggle(String(e._id)) : undefined} />
			))}
			{propias.length === 0 && <Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>Sin etiquetas</Typography>}
			{canEdit && (
				<Button
					size="small"
					startIcon={<Tag size={14} />}
					onClick={(e) => setAnchor(e.currentTarget)}
					disabled={saving}
					sx={{ height: 24, fontSize: "0.72rem", px: 1, textTransform: "none" }}
				>
					{etiquetas.length ? "Cambiar" : "Crear etiquetas"}
				</Button>
			)}
			<Menu
				anchorEl={anchor}
				open={!!anchor}
				onClose={() => setAnchor(null)}
				slotProps={{ paper: { sx: { maxHeight: 360, minWidth: 240 } } }}
			>
				{etiquetas.map((e) => (
					<MenuItem key={e._id} dense onClick={() => toggle(String(e._id))} disabled={saving}>
						<Checkbox size="small" checked={set.has(String(e._id))} sx={{ p: 0.5, mr: 0.5 }} />
						<Box
							sx={{
								width: 10,
								height: 10,
								borderRadius: "50%",
								bgcolor: e.color,
								mr: 1,
								border: (t) => `1px solid ${alpha(t.palette.text.primary, 0.2)}`,
							}}
						/>
						<ListItemText primary={e.nombre} primaryTypographyProps={{ fontSize: "0.82rem" }} />
					</MenuItem>
				))}
				{etiquetas.length === 0 && (
					<MenuItem dense disabled>
						<ListItemText primary="Todavía no hay etiquetas" primaryTypographyProps={{ fontSize: "0.82rem" }} />
					</MenuItem>
				)}
				{canConfig && (
					<MenuItem
						dense
						onClick={() => {
							setAnchor(null);
							setConfigOpen(true);
						}}
						sx={{ borderTop: (t) => `1px solid ${t.palette.divider}`, mt: 0.5 }}
					>
						<Setting2 size={15} style={{ marginRight: 8 }} />
						<ListItemText primary="Administrar etiquetas" primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 600 }} />
					</MenuItem>
				)}
			</Menu>
			<EtiquetasConfigDialog open={configOpen} onClose={() => setConfigOpen(false)} />
		</Stack>
	);
};
