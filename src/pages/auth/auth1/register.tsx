import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGoogleLogin, CredentialResponse } from "@react-oauth/google";

// material-ui
import { useTheme, alpha, Theme } from "@mui/material/styles";
import { Alert, Box, Chip, Container, Grid, Stack, Typography, useMediaQuery } from "@mui/material";

// third party
import { motion } from "framer-motion";

// icons
import { MagicStar, TickCircle } from "iconsax-react";

// project-imports
import Logo from "components/logo";
import useAuth from "hooks/useAuth";
import AuthDivider from "sections/auth/AuthDivider";
import AuthWrapper from "sections/auth/AuthWrapper";
import MainCard from "components/MainCard";
import PageBackground from "components/PageBackground";
import MockupFrame from "components/MockupFrame";
import AuthRegister from "sections/auth/auth-forms/AuthRegister";
import CustomGoogleButton from "components/auth/CustomGoogleButton";
import { FeatureModalData } from "components/FeatureModal";
import { trackRegisterView, trackSignUp, trackGoogleSignupClick } from "utils/gtm";
import { env } from "utils/env";

// assets — logos de integraciones disponibles localmente
import logoPJNacion from "assets/images/logos/logo_pj_nacion.png";
import logoMEV from "assets/images/logos/logo_pj_buenos_aires.svg";
import logoGoogleCalendar from "assets/images/logos/logo_google_calendar.svg";

// Logo EJE (Expediente Judicial Electrónico CABA) — hosteado en Cloudinary, ya usado en Header.tsx
const LOGO_EJE = "https://res.cloudinary.com/dqyoeolib/image/upload/v1770081495/ChatGPT_Image_2_feb_2026_09_44_56_p.m._ymi66g.png";
// Logo Correo Argentino — misma URL usada en sections/apps/postal-tracking
const LOGO_CORREO_ARGENTINO = "https://res.cloudinary.com/dqyoeolib/image/upload/v1773403406/logo-correo_lxrcmr.png";

// Tokens — alineados con sections/landing/Header.tsx
const BRAND_BLUE = "#3A7BFF";
const BRAND_GRADIENT_TEXT = "linear-gradient(90deg, #3A7BFF, #8A5CFF, #3A7BFF) 0 0 / 400% 100%";
const LIVE_GREEN = "#22C55E";

const SPRING = { type: "spring" as const, stiffness: 150, damping: 30 };

// ============================== FEATURE CONTEXT PANEL ============================== //

type FeatureContent = (typeof FeatureModalData)[keyof typeof FeatureModalData];

// Labels cortos para el strip de "otras features" — más legibles que el
// `title` promocional largo del FeatureModalData. Si agregás un feature
// nuevo a FeatureModalData, agregalo acá también.
const FEATURE_SHORT_LABELS: Record<string, string> = {
	carpetas: "Expedientes",
	contactos: "Contactos",
	calendario: "Calendario",
	calculos: "Cálculos laborales",
	intereses: "Intereses",
	tareas: "Tareas",
	sistema_citas: "Sistema de citas",
	escritos: "Escritos con IA",
	postal_tracking: "Tracking postal",
};

// Integraciones por feature. Cuando hay logo disponible se renderiza como
// imagen 16-18px + nombre; cuando no, como chip text-only con dot.
// Features sin entrada acá no muestran el bloque "Integrado con".
//
// Cada logo declara su propio bgColor + hasBorder porque algunos logos son
// claros (necesitan fondo oscuro) y otros oscuros (necesitan fondo blanco
// con borde sutil). Mismo patrón que sections/landing/Header.tsx.
interface Integration {
	name: string;
	/** Texto opcional para el caption debajo del tile. Si no está, se usa `name`.
	 *  Útil para integraciones cuya sigla no es autoexplicativa (ej. BCRA, BNA, BP). */
	fullName?: string;
	logo?: string;
	/** Componente de iconsax-react a renderizar dentro del tile cuando no hay logo.
	 *  Si está, tiene precedencia sobre `logo` y sobre el fallback de texto. */
	iconComponent?: React.ElementType;
	bgColor?: string;
	hasBorder?: boolean;
}

const FEATURE_INTEGRATIONS: Record<string, Integration[]> = {
	carpetas: [
		// PJN: logo claro → fondo azul oscuro, sin border (mismo tratamiento que el Header)
		{ name: "PJN", logo: logoPJNacion, bgColor: "#232D4F", hasBorder: false },
		// EJE y MEV: logos sobre blanco con borde sutil
		{ name: "EJE", logo: LOGO_EJE, bgColor: "#FFFFFF", hasBorder: true },
		{ name: "MEV", logo: logoMEV, bgColor: "#FFFFFF", hasBorder: true },
	],
	calendario: [{ name: "Google Calendar", logo: logoGoogleCalendar, bgColor: "#FFFFFF", hasBorder: true }],
	sistema_citas: [{ name: "Google Calendar", logo: logoGoogleCalendar, bgColor: "#FFFFFF", hasBorder: true }],
	intereses: [
		{ name: "BCRA", fullName: "Banco Central" },
		{ name: "BNA", fullName: "Banco Nación" },
		{ name: "BP", fullName: "Banco Provincia" },
	],
	postal_tracking: [{ name: "Correo Argentino", logo: LOGO_CORREO_ARGENTINO, bgColor: "#FFFFFF", hasBorder: true }],
	// Asistente IA usa MagicStar (mismo ícono que la app en document-editor / AiChatPanel)
	escritos: [{ name: "Asistente IA", iconComponent: MagicStar }],
};

interface FeatureContextPanelProps {
	content: FeatureContent;
	currentFeatureKey: string;
	isDark: boolean;
	theme: Theme;
}

/**
 * Panel derecho contextual cuando el visitante llega a /register desde un
 * feature específico (`?feature=<key>`). Renderiza icono coloreado, título,
 * descripción y lista de beneficios — todo proveniente de FeatureModalData
 * para single source of truth de copy.
 */
const FeatureContextPanel: React.FC<FeatureContextPanelProps> = ({ content, currentFeatureKey, isDark, theme }) => {
	const IconComponent = content.iconComponent;
	const accent = theme.palette[content.colorKey].main;

	// Otras features incluidas en la cuenta — mostrar todas excepto la actual
	// para señalar que el plan no se limita al feature que trajo al visitante.
	// Mención discreta: solo icono + label corto, sin decoración de chip.
	const otherFeatures = Object.entries(FeatureModalData).filter(([key]) => key !== currentFeatureKey);

	// Integraciones del feature actual (opcional — algunos features no tienen).
	const integrations = FEATURE_INTEGRATIONS[currentFeatureKey] || [];

	return (
		<Stack spacing={3} sx={{ maxWidth: 480, mx: "auto" }}>
			<Chip
				label="500+ abogados ya lo usan"
				size="small"
				sx={{
					alignSelf: "flex-start",
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
					color: theme.palette.primary.dark,
					fontWeight: 600,
					fontSize: "0.72rem",
					letterSpacing: "0.02em",
					height: 26,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
				}}
			/>

			<Stack direction="row" spacing={2} alignItems="center">
				<Box
					sx={{
						flexShrink: 0,
						width: 52,
						height: 52,
						borderRadius: 1.5,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(accent, isDark ? 0.18 : 0.12),
						color: accent,
					}}
				>
					<IconComponent size={26} variant="Bulk" color="currentColor" />
				</Box>
				<Typography
					component="h2"
					sx={{
						fontSize: { xs: "1.625rem", md: "2rem" },
						fontWeight: 600,
						lineHeight: 1.15,
						letterSpacing: "-0.025em",
						textWrap: "balance",
						color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
					}}
				>
					{content.title}
				</Typography>
			</Stack>

			<Typography
				sx={{
					fontSize: "1rem",
					lineHeight: 1.55,
					letterSpacing: "-0.005em",
					color: theme.palette.text.secondary,
					textWrap: "pretty",
				}}
			>
				{content.description}
			</Typography>

			<Stack spacing={1.25} sx={{ pt: 0.5 }}>
				{content.benefits.map((benefit, i) => (
					<Stack key={i} direction="row" spacing={1.25} alignItems="flex-start">
						<Box sx={{ flexShrink: 0, mt: "2px", lineHeight: 0 }}>
							<TickCircle size={18} variant="Bulk" color={LIVE_GREEN} />
						</Box>
						<Typography
							sx={{
								fontSize: "0.92rem",
								lineHeight: 1.5,
								color: isDark ? theme.palette.grey[200] : theme.palette.grey[800],
							}}
						>
							{benefit}
						</Typography>
					</Stack>
				))}
			</Stack>

			{integrations.length > 0 && (
				<Box sx={{ pt: 1.5 }}>
					<Box
						sx={{
							height: 1,
							bgcolor: alpha(theme.palette.divider, 0.6),
							mb: 2,
						}}
					/>
					<Typography
						sx={{
							fontSize: "0.68rem",
							fontWeight: 600,
							letterSpacing: "0.14em",
							textTransform: "uppercase",
							color: theme.palette.text.secondary,
							mb: 1.75,
						}}
					>
						Integrado con
					</Typography>
					{/* Tiles cuadrados verticales — mismo patrón que sections/landing/Header.tsx
					    (logo dentro de un tile coloreado + sigla debajo). Sombra tintada según
					    si el tile es claro u oscuro para mantener consistencia tonal. */}
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 1.5, sm: 2.25 } }}>
						{integrations.map((integration) => {
							const isDarkTile = integration.hasBorder === false;
							const tileBgColor = integration.bgColor || "#FFFFFF";
							const tileShadow = isDarkTile
								? "0 4px 14px rgba(35, 45, 79, 0.32), 0 2px 6px rgba(0, 0, 0, 0.12)"
								: "0 4px 14px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06)";
							return (
								<Stack
									key={integration.name}
									alignItems="center"
									spacing={0.875}
									sx={{ width: 64 }}
								>
									<Box
										sx={{
											width: 52,
											height: 52,
											borderRadius: 1.5,
											bgcolor: tileBgColor,
											border: integration.hasBorder !== false ? `1px solid ${alpha("#000000", 0.1)}` : "none",
											boxShadow: tileShadow,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											p: integration.logo ? 0.75 : 0.5,
										}}
									>
										{integration.logo ? (
											<Box
												component="img"
												src={integration.logo}
												alt={`Logo ${integration.name}`}
												sx={{
													width: "100%",
													height: "100%",
													objectFit: "contain",
													display: "block",
												}}
											/>
										) : integration.iconComponent ? (
											/* Tile con icon de iconsax — para integraciones simbólicas
											   sin logo de marca (ej. Asistente IA con MagicStar). */
											<integration.iconComponent size={26} variant="Bulk" color={BRAND_BLUE} />
										) : (
											/* Tile sin logo ni icon — sigla centrada en BRAND_BLUE. */
											<Typography
												sx={{
													fontSize: integration.name.length > 4 ? "0.7rem" : "0.82rem",
													fontWeight: 700,
													letterSpacing: "-0.01em",
													color: BRAND_BLUE,
													textAlign: "center",
													lineHeight: 1.1,
												}}
											>
												{integration.name}
											</Typography>
										)}
									</Box>
									<Typography
										sx={{
											fontSize: "0.7rem",
											fontWeight: 600,
											letterSpacing: "-0.005em",
											color: theme.palette.text.secondary,
											textAlign: "center",
											lineHeight: 1.25,
										}}
									>
										{integration.fullName || integration.name}
									</Typography>
								</Stack>
							);
						})}
					</Box>
				</Box>
			)}

			{otherFeatures.length > 0 && (
				<Box sx={{ pt: 1.5 }}>
					<Box
						sx={{
							height: 1,
							bgcolor: alpha(theme.palette.divider, 0.6),
							mb: 2,
						}}
					/>
					<Typography
						sx={{
							fontSize: "0.68rem",
							fontWeight: 600,
							letterSpacing: "0.14em",
							textTransform: "uppercase",
							color: theme.palette.text.secondary,
							mb: 1.5,
						}}
					>
						Tu cuenta también incluye
					</Typography>
					<Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 2, rowGap: 1 }}>
						{otherFeatures.map(([key, data]) => {
							const OtherIcon = data.iconComponent;
							const label = FEATURE_SHORT_LABELS[key] || key;
							return (
								<Stack
									key={key}
									direction="row"
									alignItems="center"
									spacing={0.625}
									sx={{
										color: theme.palette.text.secondary,
										transition: "color 0.2s ease",
										"&:hover": {
											color: isDark ? theme.palette.grey[100] : theme.palette.grey[800],
										},
									}}
								>
									<OtherIcon size={14} variant="Bulk" color="currentColor" />
									<Typography
										sx={{
											fontSize: "0.82rem",
											lineHeight: 1.4,
											color: "inherit",
										}}
									>
										{label}
									</Typography>
								</Stack>
							);
						})}
					</Box>
				</Box>
			)}
		</Stack>
	);
};

const Register = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isMobile = useMediaQuery((t: Theme) => t.breakpoints.down("md"));
	const { loginWithGoogle } = useAuth();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const location = useLocation();

	const isMaintenanceMode = env.MAINTENANCE_MODE === "true";

	const params = new URLSearchParams(location.search);
	const source = params.get("source") || undefined;
	const feature = params.get("feature") || undefined;

	// Contenido contextual del panel derecho según el feature del query string.
	// Reusa FeatureModalData (single source of truth para copy/icono/colorKey de
	// cada feature). Si no hay feature o no matchea, el panel cae al fallback
	// genérico — Chip + MockupFrame + caption neutral.
	const featureContent = feature ? FeatureModalData[feature] : null;

	useEffect(() => {
		trackRegisterView(source, feature);
	}, [source, feature]);

	const handleGoogleSuccess = async (tokenResponse: any) => {
		setIsLoading(true);
		try {
			const credentialResponse: CredentialResponse = {
				clientId: tokenResponse.clientId || "",
				credential: tokenResponse.access_token,
				select_by: "user",
			};

			const result = await loginWithGoogle(credentialResponse);
			if (result.isNewUser) {
				trackSignUp("google", source, feature);
			}
		} catch (error) {
			setError("Error al autenticar con Google. Por favor, intentá nuevamente.");
		} finally {
			setIsLoading(false);
		}
	};

	const googleLogin = useGoogleLogin({
		onSuccess: handleGoogleSuccess,
		onError: () => {
			setError("Error al iniciar sesión con Google. Intentá nuevamente.");
			setIsLoading(false);
		},
		flow: "implicit",
	});

	const handleGoogleClick = () => {
		trackGoogleSignupClick(source, feature);
		googleLogin();
	};

	if (isMaintenanceMode) {
		return (
			<AuthWrapper>
				<Grid container spacing={3}>
					<Grid item xs={12} sx={{ textAlign: "center" }}>
						<Logo to="/" />
					</Grid>
					<Grid item xs={12}>
						<Alert severity="info" sx={{ mt: 3 }}>
							<Typography variant="h5" sx={{ mb: 1 }}>
								Sitio en mantenimiento
							</Typography>
							<Typography variant="body1">
								Estamos realizando mejoras en nuestro sistema. Por favor, volvé a intentarlo más tarde.
							</Typography>
						</Alert>
					</Grid>
				</Grid>
			</AuthWrapper>
		);
	}

	const benefits = ["Estados y movimientos automáticos", "Alertas de vencimientos", "Centralizá agenda y cálculos"];

	return (
		<Box
			sx={{
				position: "relative",
				overflow: "hidden",
				minHeight: { xs: "100dvh", sm: "100vh" },
				bgcolor: theme.palette.background.default,
				pt: { xs: 6, sm: 7, md: 8 },
				pb: { xs: 5, sm: 6, md: 8 },
				display: "flex",
				flexDirection: "column",
			}}
		>
			<PageBackground variant="default" />

			{/* Atmosphere — blobs brand-blue (mismo lenguaje que el hero del landing) */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: { xs: "-8%", md: "-12%" },
					right: { xs: "-20%", md: "-10%" },
					width: { xs: 380, md: 620 },
					height: { xs: 380, md: 620 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.13)} 0%, transparent 62%)`,
					filter: "blur(60px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					bottom: { xs: "-15%", md: "-18%" },
					left: { xs: "-25%", md: "-12%" },
					width: { xs: 420, md: 720 },
					height: { xs: 420, md: 720 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.1 : 0.07)} 0%, transparent 62%)`,
					filter: "blur(80px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			{/* Dot grid — fade radial hacia los bordes */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					inset: 0,
					backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, isDark ? 0.06 : 0.045)} 1px, transparent 1px)`,
					backgroundSize: "26px 26px",
					maskImage: "radial-gradient(ellipse 70% 60% at center, #000 0%, transparent 75%)",
					WebkitMaskImage: "radial-gradient(ellipse 70% 60% at center, #000 0%, transparent 75%)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			<Container sx={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1, px: { xs: 2, sm: 3 } }}>
				<Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
					<Grid container alignItems="center" justifyContent="center" spacing={{ xs: 3, md: 6 }}>
						<Grid item xs={12} md={6} sx={{ display: "flex", justifyContent: "center" }}>
							<motion.div
								initial={{ opacity: 0, translateY: 30 }}
								animate={{ opacity: 1, translateY: 0 }}
								transition={SPRING}
								style={{ width: "100%", maxWidth: 460 }}
							>
								<MainCard
									sx={{
										width: "100%",
										boxShadow: `0 30px 60px ${alpha("#0F172A", isDark ? 0.35 : 0.12)}, 0 12px 28px ${alpha(
											"#0F172A",
											isDark ? 0.25 : 0.08,
										)}`,
										border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
									}}
									content={false}
								>
									<Box sx={{ p: { xs: 3, sm: 3.5, md: 4 } }}>
										<Stack spacing={2.5}>
											<Box sx={{ textAlign: "center" }}>
												<Logo to="/" />
											</Box>

											<motion.div
												initial={{ opacity: 0, translateY: 16 }}
												animate={{ opacity: 1, translateY: 0 }}
												transition={{ ...SPRING, delay: 0.1 }}
											>
												<Stack spacing={0.75}>
													<Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
														<Typography
															variant="h3"
															sx={{
																fontSize: { xs: "1.5rem", sm: "1.625rem", md: "1.75rem" },
																fontWeight: 600,
																lineHeight: 1.1,
																letterSpacing: "-0.02em",
																textWrap: "balance",
															}}
														>
															Empezá{" "}
															<Box
																component="span"
																sx={{
																	background: BRAND_GRADIENT_TEXT,
																	color: "transparent",
																	WebkitBackgroundClip: "text",
																	backgroundClip: "text",
																	animation: "move-bg-register 24s infinite linear",
																	"@keyframes move-bg-register": {
																		"100%": { backgroundPosition: "400% 0" },
																	},
																}}
															>
																gratis
															</Box>
														</Typography>
														<Typography
															component={Link}
															to="/login"
															variant="body2"
															sx={{
																textDecoration: "none",
																color: theme.palette.primary.main,
																whiteSpace: "nowrap",
																fontWeight: 500,
															}}
														>
															¿Ya tenés cuenta?
														</Typography>
													</Stack>
													<Typography
														variant="body2"
														color="text.secondary"
														sx={{ fontSize: "0.875rem", letterSpacing: "-0.005em", textWrap: "pretty" }}
													>
														Configuración inicial en menos de 2 minutos.
													</Typography>
												</Stack>
											</motion.div>

											<motion.div
												initial={{ opacity: 0, translateY: 16 }}
												animate={{ opacity: 1, translateY: 0 }}
												transition={{ ...SPRING, delay: 0.2 }}
											>
												<Stack spacing={0.625}>
													{benefits.map((label) => (
														<Stack key={label} direction="row" alignItems="center" spacing={0.875}>
															<TickCircle size={14} variant="Bold" color={LIVE_GREEN} />
															<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.78rem" }}>
																{label}
															</Typography>
														</Stack>
													))}
												</Stack>
											</motion.div>

											{error && (
												<Alert severity="error" sx={{ py: 0.5 }}>
													{error}
												</Alert>
											)}

											<motion.div
												initial={{ opacity: 0, translateY: 16 }}
												animate={{ opacity: 1, translateY: 0 }}
												transition={{ ...SPRING, delay: 0.3 }}
											>
												<CustomGoogleButton
													onClick={handleGoogleClick}
													disabled={isLoading}
													showLoader={isLoading}
													text="Registrate con Google"
													fullWidth
													sx={{ py: 1.5 }}
												/>
											</motion.div>

											<motion.div
												initial={{ opacity: 0, translateY: 16 }}
												animate={{ opacity: 1, translateY: 0 }}
												transition={{ ...SPRING, delay: 0.35 }}
											>
												<Stack spacing={1.25} alignItems="center" sx={{ mt: -0.5 }}>
													<Stack direction="row" spacing={1.25} justifyContent="center" alignItems="center" flexWrap="wrap">
														<Stack direction="row" alignItems="center" spacing={0.4}>
															<TickCircle size={11} variant="Bold" color={LIVE_GREEN} />
															<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
																Sin tarjeta
															</Typography>
														</Stack>
														<Stack direction="row" alignItems="center" spacing={0.4}>
															<TickCircle size={11} variant="Bold" color={LIVE_GREEN} />
															<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
																Acceso inmediato
															</Typography>
														</Stack>
														<Stack direction="row" alignItems="center" spacing={0.4}>
															<TickCircle size={11} variant="Bold" color={LIVE_GREEN} />
															<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
																Cancelá cuando quieras
															</Typography>
														</Stack>
													</Stack>
													<Typography
														variant="caption"
														color="text.secondary"
														sx={{ textAlign: "center", fontSize: "0.65rem", lineHeight: 1.6, opacity: 0.7 }}
													>
														Al continuar aceptás los{" "}
														<Typography
															component={Link}
															to="/terms"
															target="_blank"
															rel="noopener noreferrer"
															variant="caption"
															sx={{ fontSize: "0.65rem", color: theme.palette.primary.main, textDecoration: "none" }}
														>
															términos
														</Typography>{" "}
														y la{" "}
														<Typography
															component={Link}
															to="/privacy-policy"
															target="_blank"
															rel="noopener noreferrer"
															variant="caption"
															sx={{ fontSize: "0.65rem", color: theme.palette.primary.main, textDecoration: "none" }}
														>
															política de privacidad
														</Typography>
														.
													</Typography>
												</Stack>
											</motion.div>

											<AuthDivider>
												<Typography variant="caption" color="text.secondary" sx={{ opacity: 0.6, fontSize: "0.7rem" }}>
													o usá tu email
												</Typography>
											</AuthDivider>

											<motion.div
												initial={{ opacity: 0, translateY: 16 }}
												animate={{ opacity: 1, translateY: 0 }}
												transition={{ ...SPRING, delay: 0.4 }}
											>
												<AuthRegister source={source} feature={feature} />
											</motion.div>
										</Stack>
									</Box>
								</MainCard>
							</motion.div>
						</Grid>

						{!isMobile && (
							<Grid item xs={12} md={6} sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", overflow: "visible" }}>
								<motion.div
									initial={{ opacity: 0, translateX: 50 }}
									animate={{ opacity: 1, translateX: 0 }}
									transition={{ ...SPRING, delay: 0.25 }}
									style={{ width: "100%" }}
								>
									{featureContent && feature ? (
										<FeatureContextPanel content={featureContent} currentFeatureKey={feature} isDark={isDark} theme={theme} />
									) : (
										<Stack spacing={3} alignItems="center" sx={{ textAlign: "center" }}>
											<Chip
												label="500+ abogados ya lo usan"
												size="small"
												sx={{
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
													color: theme.palette.primary.dark,
													fontWeight: 600,
													fontSize: "0.72rem",
													letterSpacing: "0.02em",
													height: 26,
													border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
												}}
											/>
											<Box sx={{ width: "100%", maxWidth: 520 }}>
												<MockupFrame showSecondaryCopy={false} />
											</Box>
											<Typography
												variant="body2"
												sx={{
													color: theme.palette.text.secondary,
													fontSize: "0.875rem",
													maxWidth: 420,
													textWrap: "pretty",
												}}
											>
												Centralizá expedientes de PJN, MEV y EJE con novedades y movimientos automáticos.
											</Typography>
										</Stack>
									)}
								</motion.div>
							</Grid>
						)}
					</Grid>
				</Box>
			</Container>
		</Box>
	);
};

export default Register;
