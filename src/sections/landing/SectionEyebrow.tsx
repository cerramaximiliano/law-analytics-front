// material-ui
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// ============================== TOKENS ============================== //
// Mismo brand-blue usado en el resto del landing — pill tintada con borde sutil.
const BRAND_BLUE = "#3A7BFF";

// ============================== SECTION EYEBROW ============================== //
// Pill chip uppercase tracked usado arriba del h2 de cada sección del landing.
// Formato: `02 — FUNCIONALIDADES`. El número es opcional; si se pasa, va con
// tabular-nums + opacidad menor para diferenciarlo tipográficamente del label.

interface SectionEyebrowProps {
	number?: string;
	label: string;
	align?: "center" | "left";
	mb?: number;
}

const SectionEyebrow = ({ number, label, align = "center", mb = 2 }: SectionEyebrowProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: align === "center" ? "center" : "flex-start",
				mb,
			}}
		>
			<Box
				sx={{
					display: "inline-flex",
					alignItems: "center",
					px: 1.25,
					py: 0.4,
					borderRadius: 1,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
				}}
			>
				<Typography
					component="span"
					sx={{
						fontSize: "0.68rem",
						fontWeight: 600,
						letterSpacing: "0.14em",
						color: BRAND_BLUE,
						lineHeight: 1.2,
						textTransform: "uppercase",
						fontVariantNumeric: "tabular-nums",
						display: "inline-flex",
						alignItems: "baseline",
						gap: 0.5,
					}}
				>
					{number && (
						<>
							<Box component="span" sx={{ opacity: 0.65 }}>
								{number}
							</Box>
							<Box component="span" sx={{ opacity: 0.5 }}>
								—
							</Box>
						</>
					)}
					<Box component="span">{label}</Box>
				</Typography>
			</Box>
		</Box>
	);
};

export default SectionEyebrow;
