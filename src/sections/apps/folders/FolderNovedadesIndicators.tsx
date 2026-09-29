/**
 * Indicadores de la lista de carpetas (2026-09-29):
 *  - RelacionesIcon: ⛓ con tooltip (acumulación, acumuladas, incidentes); ámbar si la causa se
 *    acumuló a otra, azul si tiene relaciones. Clic → pestaña "Expedientes relacionados".
 *  - SinVerCount: "N sin ver" (movimientos vistos por primera vez desde la última visita a
 *    Actividad, todas las jurisdicciones); lo calcula el hub en el listado. Plan free: solo cuenta
 *    lo que ve (últimos 5); `ocultos` va al tooltip como upgrade ("+" en el texto, candado si 0).
 */
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { Link21, Lock1 } from "iconsax-react";
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

export function SinVerCount({ count, ocultos }: { count?: number; ocultos?: number }) {
	const n = count && count > 0 ? count : 0;
	const extra = ocultos && ocultos > 0 ? ocultos : 0;
	if (!n && !extra) return null;
	const mov = (k: number) => `${k} ${k === 1 ? "movimiento nuevo" : "movimientos nuevos"}`;
	const upsell = extra ? `${mov(extra)} ${n ? "más, " : ""}${extra === 1 ? "disponible" : "disponibles"} en el plan Standard` : "";
	// Plan free sin nada visible: se muestra lo oculto atenuado (no promete lo que no puede abrir).
	if (!n) {
		return (
			<Tooltip title={upsell}>
				<Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, ml: 0.75, whiteSpace: "nowrap" }}>
					<Lock1 size={11} variant="Bold" color="currentColor" />
					<Typography component="span" variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
						{extra > 99 ? "99+" : extra} {extra === 1 ? "nuevo" : "nuevos"}
					</Typography>
				</Box>
			</Tooltip>
		);
	}
	const texto = n > 99 ? "99+" : String(n);
	const titulo = `${mov(n)} desde tu última visita a Actividad${extra ? `. Y ${upsell}` : ""}`;
	return (
		<Tooltip title={titulo}>
			<Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, ml: 0.75, whiteSpace: "nowrap" }}>
				<Box component="span" sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
				<Typography component="span" variant="caption" sx={{ color: BRAND_BLUE, fontWeight: 600 }}>
					{texto} sin ver{extra ? " +" : ""}
				</Typography>
			</Box>
		</Tooltip>
	);
}
