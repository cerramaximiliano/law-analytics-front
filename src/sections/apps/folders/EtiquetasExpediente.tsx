import React, { useState } from "react";
import axios from "axios";
import { Box, Button, Checkbox, Chip, ListItemText, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Setting2, Tag } from "iconsax-react";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import useEtiquetasExpediente, { Etiqueta } from "hooks/useEtiquetasExpediente";
import EtiquetasYTiposDialog, { TipoAnotacion } from "sections/apps/folders/EtiquetasYTiposDialog";

// ==============================|| ETIQUETAS DEL EXPEDIENTE ||============================== //
// Etiquetas que crea cada estudio («Haber reajustado», «Embargo»…) y pone en sus carpetas
// para después filtrar el listado. Nombre y color los elige el estudio.

const API = import.meta.env.VITE_BASE_URL;

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

// ── Etiquetas de una carpeta (detalle) ─────────────────────────────────────────

interface FolderEtiquetasProps {
	folderId: string;
	/** Ids de las etiquetas que tiene la carpeta. */
	value: string[];
	onChange: (ids: string[]) => void;
	/** Puede poner y quitar etiquetas (titular, administrador o editor). */
	canEdit: boolean;
	/** Se guardó la configuración central (etiquetas y tipos). */
	onConfigSaved?: (cfg: { tipos: TipoAnotacion[]; etiquetas: Etiqueta[] }) => void;
}

export const FolderEtiquetas = ({ folderId, value, onChange, canEdit, onConfigSaved }: FolderEtiquetasProps) => {
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
						<ListItemText primary="Etiquetas y categorías" primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 600 }} />
					</MenuItem>
				)}
			</Menu>
			<EtiquetasYTiposDialog open={configOpen} onClose={() => setConfigOpen(false)} onSaved={onConfigSaved} />
		</Stack>
	);
};
