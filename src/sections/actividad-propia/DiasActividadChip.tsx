import { Box, alpha, useTheme } from "@mui/material";
import { diasDesde, tramoDe, tramoInfo } from "services/actividadPropiaService";

/** Días desde el último acto propio, con el color de su tramo (≤90, 91–180, 181–365, >365). */
const DiasActividadChip = ({ fecha, size = "small" }: { fecha?: string | null; size?: "small" | "medium" }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const dias = diasDesde(fecha);
	const t = tramoInfo(tramoDe(dias));
	const color = t?.color ?? theme.palette.text.secondary;
	return (
		<Box
			component="span"
			sx={{
				display: "inline-block",
				minWidth: size === "small" ? 48 : 60,
				textAlign: "center",
				px: 1,
				py: size === "small" ? 0.25 : 0.5,
				borderRadius: 2,
				fontSize: size === "small" ? "0.72rem" : "0.8rem",
				fontWeight: 600,
				fontVariantNumeric: "tabular-nums",
				bgcolor: t ? alpha(color, isDark ? 0.22 : 0.14) : alpha(theme.palette.text.secondary, 0.1),
				color: t ? (isDark ? color : t.fg) : "text.secondary",
				whiteSpace: "nowrap",
			}}
		>
			{dias === null ? "—" : `${dias} d`}
		</Box>
	);
};

export default DiasActividadChip;
