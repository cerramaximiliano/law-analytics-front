import React from "react";

// material-ui
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project-imports
import MainCard from "components/MainCard";
import { BRAND_BLUE } from "themes/dashboardTokens";

// icons
import { Add, ArrowRight } from "iconsax-react";

// types
import { ThemeMode } from "types/config";

// hooks
import { useNavigate } from "react-router-dom";

interface WelcomeBannerProps {
	userName?: string;
}

// ==============================|| DASHBOARD - WELCOME BANNER ||============================== //
// Billboard horizontal compacto con greeting personalizado + CTA dual (planes +
// nueva carpeta). Poca altura para no robar foco a las cards de KPIs de abajo.
// El onboarding de usuarios nuevos lo resuelve OnboardingChecklist; la variante
// hero de este banner quedó sin uso y se eliminó (O9, 2026-09-12).

const WelcomeBanner = ({ userName }: WelcomeBannerProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	const navigate = useNavigate();

	const handleCreateFolder = () => navigate("/apps/folders/list?onboarding=true");
	const handleViewPlans = () => navigate("/suscripciones/tables");

	// Estilos compartidos del container — atmósfera brand-blue, border + shadow tintados.
	const containerSx = {
		position: "relative" as const,
		overflow: "hidden",
		bgcolor: theme.palette.background.paper,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
		boxShadow: `0 4px 18px ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)}`,
		p: 0,
	};

	// Botón primario BRAND_BLUE con shadow tintada — patrón landing CTA.
	// Padding y fontSize responsive: chico en mobile, grande en desktop.
	const primaryButtonSx = {
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		textTransform: "none",
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		fontSize: { xs: "0.82rem", sm: "0.9rem" },
		px: { xs: 1.75, sm: 2.25 },
		py: { xs: 0.75, sm: 1 },
		whiteSpace: "nowrap",
		boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, 0.28)}`,
		transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
		"&:hover": {
			bgcolor: alpha(BRAND_BLUE, 0.92),
			boxShadow: `0 12px 26px ${alpha(BRAND_BLUE, 0.36)}`,
			transform: "translateY(-1px)",
		},
		"&:active": { transform: "translateY(0)" },
	};

	return (
		<MainCard border={false} sx={containerSx}>
			{/* Atmósfera — blob brand-blue sutil + dot grid */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: "-60%",
					right: "-10%",
					width: { xs: 240, md: 360 },
					height: { xs: 240, md: 360 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.11)} 0%, transparent 65%)`,
					filter: "blur(60px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					inset: 0,
					backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, isDark ? 0.07 : 0.05)} 1px, transparent 1px)`,
					backgroundSize: "24px 24px",
					maskImage: "radial-gradient(ellipse 50% 100% at 90% 50%, #000 0%, transparent 70%)",
					WebkitMaskImage: "radial-gradient(ellipse 50% 100% at 90% 50%, #000 0%, transparent 70%)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			<Stack
				direction={{ xs: "column", md: "row" }}
				alignItems={{ xs: "flex-start", md: "center" }}
				justifyContent="space-between"
				spacing={{ xs: 2, md: 3 }}
				sx={{
					px: { xs: 2.5, sm: 3 },
					py: { xs: 2.5, sm: 2.75 },
					position: "relative",
					zIndex: 1,
				}}
			>
				<Box sx={{ maxWidth: 540 }}>
					<Typography
						sx={{
							fontSize: { xs: "1.15rem", sm: "1.375rem" },
							fontWeight: 600,
							letterSpacing: "-0.02em",
							lineHeight: 1.2,
							color: "text.primary",
							mb: 0.5,
						}}
					>
						{userName ? `Hola, ${userName}` : "Hola"}
					</Typography>
					<Typography
						sx={{
							fontSize: { xs: "0.85rem", sm: "0.9rem" },
							color: "text.secondary",
							lineHeight: 1.5,
							textWrap: "pretty",
						}}
					>
						Acá tenés el resumen de actividad y los próximos vencimientos.
					</Typography>
				</Box>

				<Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
					<Button
						variant="text"
						onClick={handleViewPlans}
						endIcon={<ArrowRight size={14} />}
						sx={{
							color: BRAND_BLUE,
							fontWeight: 600,
							fontSize: "0.85rem",
							textTransform: "none",
							letterSpacing: "-0.005em",
							px: 1.5,
							"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.06) },
						}}
					>
						Ver planes
					</Button>
					<Button variant="contained" onClick={handleCreateFolder} startIcon={<Add size={18} />} sx={primaryButtonSx}>
						Nueva carpeta
					</Button>
				</Stack>
			</Stack>
		</MainCard>
	);
};

export default WelcomeBanner;
