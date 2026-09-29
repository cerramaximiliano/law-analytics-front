/**
 * Indicadores de la lista de carpetas (2026-09-29):
 *  - RelacionesIcon: ⛓ con tooltip (acumulación, acumuladas, incidentes); ámbar si la causa se
 *    acumuló a otra, azul si tiene relaciones. Clic → pestaña "Expedientes relacionados".
 *  - SinVerCount: "N sin ver" (movimientos PJN vistos por primera vez desde la última visita a
 *    Actividad); lo calcula el hub en el listado.
 */
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Link21 } from "iconsax-react";
import { BRAND_BLUE, STALE_AMBER } from "themes/dashboardTokens";
import type { FolderData } from "types/folder";

type Relaciones = NonNullable<FolderData["relaciones"]>;

export function RelacionesIcon({ relaciones, onClick }: { relaciones?: Relaciones | null; onClick?: () => void }) {
	if (!relaciones) return null;
	const color = relaciones.tipo === "acumulada" ? STALE_AMBER : BRAND_BLUE;
	return (
		<Tooltip title={`${relaciones.texto} · Ver expedientes relacionados`}>
			<IconButton
				size="small"
				aria-label="Expedientes relacionados"
				onClick={(e) => {
					e.stopPropagation();
					onClick?.();
				}}
				sx={{ padding: 0.5, flexShrink: 0 }}
			>
				<Link21 size={16} variant="Bold" color={color} />
			</IconButton>
		</Tooltip>
	);
}

export function SinVerCount({ count }: { count?: number }) {
	if (!count || count <= 0) return null;
	const texto = count > 99 ? "99+" : String(count);
	return (
		<Tooltip title={`${count} ${count === 1 ? "movimiento nuevo" : "movimientos nuevos"} desde tu última visita a Actividad`}>
			<Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, ml: 0.75, whiteSpace: "nowrap" }}>
				<Box component="span" sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
				<Typography component="span" variant="caption" sx={{ color: BRAND_BLUE, fontWeight: 600 }}>
					{texto} sin ver
				</Typography>
			</Box>
		</Tooltip>
	);
}
