import React from "react";

// material-ui
import { Box, Button, Link, Stack, Tooltip, Typography } from "@mui/material";
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
	showOnboarding?: boolean;
	userName?: string;
	onDismiss?: () => void;
	sessionCount?: number;
	maxSessions?: number;
}

// ==============================|| DASHBOARD - WELCOME BANNER ||============================== //
// Dos variantes según `showOnboarding`:
// - onboarding (usuarios nuevos sin carpetas): hero grande con eyebrow, h2 y CTA
//   primario "Crear primera carpeta". Lo más visible del dashboard al loguearse.
// - default (usuarios con recursos): billboard horizontal compacto con greeting
//   personalizado + CTA dual (planes + nueva carpeta). Mucho menos altura para
//   no robar foco a las cards de KPIs que vienen debajo.

const WelcomeBanner = ({ showOnboarding = false, userName, onDismiss }: WelcomeBannerProps) => {
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
	const primaryButtonSx = {
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		textTransform: "none",
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		px: 2.25,
		boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, 0.28)}`,
		transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
		"&:hover": {
			bgcolor: alpha(BRAND_BLUE, 0.92),
			boxShadow: `0 12px 26px ${alpha(BRAND_BLUE, 0.36)}`,
			transform: "translateY(-1px)",
		},
		"&:active": { transform: "translateY(0)" },
	};

	// ============================== ONBOARDING (nuevo) ==============================
	if (showOnboarding) {
		return (
			<MainCard border={false} sx={containerSx}>
				{/* Atmósfera — blob brand-blue arriba derecha + dot grid */}
				<Box
					aria-hidden
					sx={{
						position: "absolute",
						top: "-40%",
						right: "-15%",
						width: { xs: 320, md: 460 },
						height: { xs: 320, md: 460 },
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.13)} 0%, transparent 65%)`,
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
						backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, isDark ? 0.08 : 0.06)} 1px, transparent 1px)`,
						backgroundSize: "26px 26px",
						maskImage: "radial-gradient(ellipse 60% 80% at 80% 30%, #000 0%, transparent 75%)",
						WebkitMaskImage: "radial-gradient(ellipse 60% 80% at 80% 30%, #000 0%, transparent 75%)",
						pointerEvents: "none",
						zIndex: 0,
					}}
				/>

				<Stack
					spacing={{ xs: 1.75, sm: 2.25 }}
					sx={{
						px: { xs: 2.5, sm: 4 },
						py: { xs: 3, sm: 4 },
						position: "relative",
						zIndex: 1,
						maxWidth: { md: 620 },
					}}
				>
					{/* Eyebrow chip — patrón SectionEyebrow del landing */}
					<Box
						sx={{
							display: "inline-flex",
							alignSelf: "flex-start",
							alignItems: "center",
							px: 1.25,
							py: 0.4,
							borderRadius: 1,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
						}}
					>
						<Typography
							sx={{
								fontSize: "0.68rem",
								fontWeight: 600,
								letterSpacing: "0.14em",
								textTransform: "uppercase",
								color: BRAND_BLUE,
							}}
						>
							Empezá acá
						</Typography>
					</Box>

					<Typography
						variant="h2"
						sx={{
							fontSize: { xs: "1.5rem", sm: "1.875rem", md: "2.125rem" },
							fontWeight: 600,
							letterSpacing: "-0.025em",
							lineHeight: 1.15,
							color: "text.primary",
							textWrap: "balance",
						}}
					>
						{userName ? `Bienvenido, ${userName}` : "Bienvenido a Law·Analytics"}
					</Typography>

					<Typography
						sx={{
							fontSize: { xs: "0.9rem", sm: "1rem" },
							color: "text.secondary",
							lineHeight: 1.55,
							maxWidth: 540,
							textWrap: "pretty",
						}}
					>
						Empezá creando tu primera carpeta. Es el corazón de Law·Analytics: desde ahí gestionás documentos, cálculos y vencimientos.
					</Typography>

					<Box sx={{ pt: 0.5 }}>
						<Button variant="contained" onClick={handleCreateFolder} startIcon={<Add />} size="large" sx={primaryButtonSx}>
							Crear mi primera carpeta
						</Button>
					</Box>

					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							opacity: 0.75,
							display: { xs: "none", sm: "block" },
							mt: -0.5,
						}}
					>
						Organizá un expediente en menos de 1 minuto
					</Typography>
				</Stack>

				{/* Dismiss link */}
				{onDismiss && (
					<Box sx={{ position: "absolute", bottom: 10, right: 16, zIndex: 3 }}>
						<Tooltip title="Podés volver a ver esta guía desde Ayuda" placement="top" arrow>
							<Link
								component="button"
								variant="caption"
								onClick={onDismiss}
								sx={{
									color: alpha(theme.palette.text.primary, 0.45),
									textDecoration: "none",
									cursor: "pointer",
									fontSize: "0.7rem",
									border: "none",
									background: "none",
									transition: "color 0.2s ease",
									"&:hover": {
										color: theme.palette.text.primary,
										textDecoration: "underline",
										textUnderlineOffset: "2px",
									},
								}}
							>
								No mostrar esta guía nuevamente
							</Link>
						</Tooltip>
					</Box>
				)}
			</MainCard>
		);
	}

	// ============================== DEFAULT (con recursos) ==============================
	// Billboard horizontal compacto. La altura baja deliberadamente — las KPI cards
	// de abajo son el foco visual, este banner es contexto + acceso rápido.
	return (
		<MainCard border={false} sx={containerSx}>
			{/* Atmósfera — más sutil que en el hero onboarding (banner más bajo) */}
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
