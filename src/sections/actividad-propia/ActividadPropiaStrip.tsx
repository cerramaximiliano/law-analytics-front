import { useMemo } from "react";
import { Box, ButtonBase, Stack, Typography, alpha, useTheme } from "@mui/material";
import { BRAND_BLUE } from "themes/dashboardTokens";
import AyudaActosPjn, { NOMBRE_ACTOS_PJN } from "sections/actividad-propia/AyudaActosPjn";
import type { FolderData } from "types/folder";
import { TRAMOS, diasDesde, tramoDe, type FiltroActividadPropia, type TramoActividad } from "services/actividadPropiaService";

interface Props {
	folders: FolderData[];
	value: FiltroActividadPropia;
	onChange: (v: FiltroActividadPropia) => void;
}

/**
 * Franja de tramos del listado de carpetas (10/11/2026): carpetas PJN activas según los días desde el
 * último acto propio. Cada tramo filtra la tabla; tocar el activo lo quita. Solo se muestra si alguna
 * carpeta tiene actos (es decir, si el usuario tiene credencial con bandeja).
 */
const ActividadPropiaStrip = ({ folders, value, onChange }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const { conteo, pendientes, hayDatos } = useMemo(() => {
		const c: Record<TramoActividad, number> = { hasta90: 0, d91a180: 0, d181a365: 0, mas365: 0, sinActos: 0 };
		let p = 0;
		let datos = false;
		for (const f of folders) {
			if (!f.pjn || f.archived) continue;
			const ult = f.ultimaActividadLetrado;
			if (ult?.fecha) datos = true;
			c[tramoDe(diasDesde(ult?.fecha))] += 1;
			if ((ult?.pendientes || 0) > 0) p += 1;
		}
		return { conteo: c, pendientes: p, hayDatos: datos };
	}, [folders]);

	if (!hayDatos) return null;

	const tiles: { key: FiltroActividadPropia; label: string; n: number; color: string }[] = [
		...TRAMOS.map((t) => ({ key: t.key as FiltroActividadPropia, label: t.label, n: conteo[t.key], color: t.color })),
		{ key: "pendientes", label: "Escritos sin proveer", n: pendientes, color: BRAND_BLUE },
	];

	return (
		<Box
			sx={{
				mb: 1.5,
				p: 1.5,
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				bgcolor: "background.paper",
			}}
		>
			<Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap" useFlexGap mb={1}>
				<Stack direction="row" spacing={0.5} alignItems="center">
					<Typography sx={{ fontSize: "0.82rem", fontWeight: 600, letterSpacing: "-0.005em" }}>{NOMBRE_ACTOS_PJN}</Typography>
					<AyudaActosPjn />
				</Stack>
				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
					Causas PJN activas según los días desde el último escrito, cédula o DEOX presentado con la credencial. Tocá un tramo para filtrar.
				</Typography>
			</Stack>
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" },
					gap: 1,
				}}
			>
				{tiles.map((t) => {
					const activo = value === t.key;
					return (
						<ButtonBase
							key={t.key}
							onClick={() => onChange(activo ? "all" : t.key)}
							aria-pressed={activo}
							sx={{
								justifyContent: "flex-start",
								textAlign: "left",
								borderRadius: 1,
								px: 1.25,
								py: 1,
								border: `1px solid ${activo ? BRAND_BLUE : alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
								bgcolor: activo ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.06) : "transparent",
								transition: "all 150ms ease",
								"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.04) },
							}}
						>
							<Stack spacing={0.25}>
								<Stack direction="row" spacing={0.75} alignItems="center">
									<Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: t.color, flexShrink: 0 }} />
									<Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{t.label}</Typography>
								</Stack>
								<Typography sx={{ fontSize: "1.15rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{t.n}</Typography>
							</Stack>
						</ButtonBase>
					);
				})}
			</Box>
			{conteo.sinActos > 0 && (
				<ButtonBase
					onClick={() => onChange(value === "sinActos" ? "all" : "sinActos")}
					aria-pressed={value === "sinActos"}
					sx={{ mt: 1, px: 0.5, py: 0.25, borderRadius: 0.75, justifyContent: "flex-start", textAlign: "left" }}
				>
					<Typography sx={{ fontSize: "0.72rem", color: value === "sinActos" ? BRAND_BLUE : "text.secondary" }}>
						{conteo.sinActos === 1
							? "1 causa sin actos de esta credencial (puede llevarla otro letrado)."
							: `${conteo.sinActos} causas sin actos de esta credencial (pueden llevarlas otros letrados).`}{" "}
						<Box component="span" sx={{ color: BRAND_BLUE, fontWeight: 500 }}>
							{value === "sinActos" ? "Quitar filtro" : "Ver cuáles"}
						</Box>
					</Typography>
				</ButtonBase>
			)}
		</Box>
	);
};

export default ActividadPropiaStrip;
