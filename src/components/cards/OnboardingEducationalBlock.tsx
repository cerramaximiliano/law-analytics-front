import React from "react";

// material-ui
import { Stack, Typography, Button, Box, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project import
import MainCard from "components/MainCard";
import { BRAND_BLUE, LIVE_GREEN, LIVE_PULSE_KEYFRAMES } from "themes/dashboardTokens";

// icons
import { Folder2, Add, Profile2User, Calculator, Calendar } from "iconsax-react";

// hooks
import { useNavigate } from "react-router-dom";

// types
import { ThemeMode } from "types/config";

// ==============================|| ONBOARDING EDUCATIONAL BLOCK ||============================== //
// Bloque hero del onboarding: ícono grande + "¿Qué es una carpeta?" + 3 feature
// tiles + CTA. Toda la composición monocromática BRAND_BLUE, con un único acento
// LIVE_GREEN (pulse en el ícono central) que comunica "el sistema está vivo".

const OnboardingEducationalBlock = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	// Adaptación dinámica a altura de viewport — dos niveles para que el
	// WelcomeBanner + este bloque entren above-the-fold en laptops 1080p y
	// se compacten más en pantallas más cortas (13"/14" sin barra de URL retraída).
	const isShortViewport = useMediaQuery("(max-height: 980px)");
	const isTightViewport = useMediaQuery("(max-height: 760px)");
	const navigate = useNavigate();

	const handleCreateFolder = () => {
		navigate("/apps/folders/list?onboarding=true");
	};

	const features = [
		{ icon: <Profile2User size={18} variant="Bulk" />, label: "Contactos", description: "Vinculá clientes y contrapartes" },
		{ icon: <Calculator size={18} variant="Bulk" />, label: "Cálculos", description: "Intereses, honorarios y más" },
		{ icon: <Calendar size={18} variant="Bulk" />, label: "Vencimientos", description: "Nunca pierdas una fecha importante" },
	];

	return (
		<MainCard
			border={false}
			sx={{
				minHeight: { xs: "auto", sm: isTightViewport ? 200 : isShortViewport ? 240 : 300 },
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
			}}
		>
			<Stack
				spacing={{
					xs: isTightViewport ? 1 : isShortViewport ? 1.5 : 2.5,
					sm: isTightViewport ? 1.25 : isShortViewport ? 1.75 : 3.5,
				}}
				alignItems="center"
				sx={{
					py: {
						xs: isTightViewport ? 1 : isShortViewport ? 1.25 : 2,
						sm: isTightViewport ? 1.25 : isShortViewport ? 1.5 : 3,
					},
				}}
			>
				{/* Hero icon — disco brand-blue con corner pulse verde, mismo lenguaje
				    que el empty state de Notification. En viewports cortos se compacta. */}
				<Box sx={{ position: "relative", display: "inline-flex" }}>
					<Box
						sx={{
							width: {
								xs: isTightViewport ? 44 : isShortViewport ? 52 : 64,
								sm: isTightViewport ? 50 : isShortViewport ? 60 : 80,
							},
							height: {
								xs: isTightViewport ? 44 : isShortViewport ? 52 : 64,
								sm: isTightViewport ? 50 : isShortViewport ? 60 : 80,
							},
							borderRadius: "50%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							background: `radial-gradient(circle at 35% 30%, ${alpha(BRAND_BLUE, isDark ? 0.34 : 0.24)} 0%, ${alpha(
								BRAND_BLUE,
								isDark ? 0.14 : 0.09,
							)} 70%)`,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.38 : 0.28)}`,
							color: BRAND_BLUE,
							boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.16)}`,
						}}
					>
						<Folder2 size={isTightViewport ? 22 : isShortViewport ? 26 : 32} variant="Bulk" />
					</Box>
					{/* Corner pulse — único acento verde, "señal de vida" */}
					<Box
						aria-hidden
						sx={{
							position: "absolute",
							bottom: 2,
							right: 2,
							width: 10,
							height: 10,
							borderRadius: "50%",
							bgcolor: LIVE_GREEN,
							border: `2px solid ${theme.palette.background.paper}`,
							zIndex: 3,
							"&::after": {
								content: '""',
								position: "absolute",
								inset: -1,
								borderRadius: "50%",
								bgcolor: LIVE_GREEN,
								animation: "la-live-pulse 2.4s ease-out infinite",
							},
							...LIVE_PULSE_KEYFRAMES,
						}}
					/>
				</Box>

				{/* Título y descripción — fontSize reducida progresivamente */}
				<Stack
					spacing={isTightViewport ? 0.25 : isShortViewport ? 0.5 : 1}
					alignItems="center"
					sx={{ maxWidth: 480, textAlign: "center", px: { xs: 1, sm: 0 } }}
				>
					<Typography
						sx={{
							fontSize: {
								xs: isTightViewport ? "1rem" : isShortViewport ? "1.1rem" : "1.25rem",
								sm: isTightViewport ? "1.125rem" : isShortViewport ? "1.25rem" : "1.5rem",
							},
							fontWeight: 600,
							letterSpacing: "-0.02em",
							lineHeight: 1.2,
							color: "text.primary",
							textWrap: "balance",
						}}
					>
						¿Qué es una carpeta?
					</Typography>
					<Typography
						sx={{
							fontSize: {
								xs: isTightViewport ? "0.78rem" : isShortViewport ? "0.82rem" : "0.875rem",
								sm: isTightViewport ? "0.82rem" : isShortViewport ? "0.875rem" : "1rem",
							},
							color: "text.secondary",
							lineHeight: 1.45,
							textWrap: "pretty",
						}}
					>
						Una carpeta representa un expediente, causa o cliente. Desde ahí gestionás toda la información relacionada.
					</Typography>
				</Stack>

				{/* Features — 3 tiles brand-tinted. Se ocultan en mobile y en viewports
				    cortos (ej. laptop 13"/14") para reducir altura total. */}
				{!isShortViewport && (
					<Stack
						direction={{ xs: "column", sm: "row" }}
						spacing={{ xs: 1, sm: 1.5 }}
						sx={{ width: "100%", justifyContent: "center", display: { xs: "none", sm: "flex" } }}
					>
					{features.map((feature) => (
						<Box
							key={feature.label}
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1.25,
								px: 1.5,
								py: 1.25,
								borderRadius: 1.5,
								bgcolor: theme.palette.background.paper,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
								minWidth: 175,
								transition: "border-color 0.2s ease",
								"&:hover": {
									borderColor: alpha(BRAND_BLUE, isDark ? 0.32 : 0.22),
								},
							}}
						>
							<Box
								sx={{
									width: 30,
									height: 30,
									borderRadius: 1,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
									color: BRAND_BLUE,
									flexShrink: 0,
								}}
							>
								{feature.icon}
							</Box>
							<Stack spacing={0}>
								<Typography
									variant="subtitle2"
									sx={{ color: "text.primary", letterSpacing: "-0.005em", lineHeight: 1.3 }}
								>
									{feature.label}
								</Typography>
								<Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "-0.005em" }}>
									{feature.description}
								</Typography>
							</Stack>
						</Box>
					))}
					</Stack>
				)}

				{/* CTA */}
				<Button
					variant="contained"
					startIcon={<Add size={18} />}
					onClick={handleCreateFolder}
					sx={{
						bgcolor: BRAND_BLUE,
						color: "#fff",
						textTransform: "none",
						fontWeight: 600,
						letterSpacing: "-0.005em",
						borderRadius: 1.25,
						fontSize: { xs: "0.82rem", sm: "0.9rem" },
						px: { xs: 1.75, sm: 2.5 },
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
					}}
				>
					Crear mi primera carpeta
				</Button>
			</Stack>
		</MainCard>
	);
};

export default OnboardingEducationalBlock;
