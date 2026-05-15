import { useState, useEffect, ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

// material-ui
import { useTheme, Theme, alpha } from "@mui/material/styles";
import { Box, Button, Chip, Container, Grid, Rating, Typography, Link, Tooltip, useMediaQuery } from "@mui/material";

// project imports
import SupportModal from "layout/MainLayout/Drawer/DrawerContent/SupportModal";

// third party
import { motion, AnimatePresence } from "framer-motion";
import { Profile2User, FolderOpen, Star1 } from "iconsax-react";

// project imports
import AnimateButton from "components/@extended/AnimateButton";
import PageBackground from "components/PageBackground";
import MockupFrame from "components/MockupFrame";
import { useLandingAnalytics } from "hooks/useLandingAnalytics";

// assets
import logoPJNacion from "assets/images/logos/logo_pj_nacion.png";
import logoPJBuenosAires from "assets/images/logos/logo_pj_buenos_aires.svg";

// Logos externos (Cloudinary)
const logoPJCABA = "https://res.cloudinary.com/dqyoeolib/image/upload/v1770081495/ChatGPT_Image_2_feb_2026_09_44_56_p.m._ymi66g.png";
const logoSECLO = "https://res.cloudinary.com/dqyoeolib/image/upload/q_auto/f_auto/v1776203385/seclo-removebg-preview_rxcvzm.png";

// ============================== TOKENS ============================== //
// El gradiente sobre "Estudio Jurídico" es el ÚNICO uso intencional de púrpura
// en el hero — se mantiene tal cual el diseño original.
const BRAND_BLUE = "#3A7BFF";
const BRAND_GRADIENT_TEXT = "linear-gradient(90deg, #3A7BFF, #8A5CFF, #3A7BFF) 0 0 / 400% 100%";
const LIVE_GREEN = "#22C55E";

// ============================== INTEGRACIONES ============================== //

type IntegrationStatus = "available" | "comingSoon";

interface Integration {
	key: string;
	shortName: string;
	fullName: string; // usar \n para forzar el salto de línea en desktop (whiteSpace: pre-line)
	tooltipTitle: string;
	status: IntegrationStatus;
	logoSrc: string;
	bgColor: string;
	hasBorder: boolean;
}

const INTEGRATIONS: Integration[] = [
	{
		key: "pjn",
		shortName: "PJN",
		fullName: "Poder Judicial\nde la Nación",
		tooltipTitle: "Poder Judicial de la Nación",
		status: "available",
		logoSrc: logoPJNacion,
		bgColor: "#232D4F",
		hasBorder: false,
	},
	{
		key: "mev",
		shortName: "MEV",
		fullName: "Poder Judicial de la\nProv. de Buenos Aires",
		tooltipTitle: "Poder Judicial de la Provincia de Buenos Aires (MEV)",
		status: "available",
		logoSrc: logoPJBuenosAires,
		bgColor: "#ffffff",
		hasBorder: true,
	},
	{
		key: "eje",
		shortName: "EJE",
		fullName: "Poder Judicial de la\nCiudad de Buenos Aires",
		tooltipTitle: "Poder Judicial de la Ciudad de Buenos Aires (EJE) - Próximamente",
		status: "comingSoon",
		logoSrc: logoPJCABA,
		bgColor: "#ffffff",
		hasBorder: true,
	},
	{
		key: "seclo",
		shortName: "SECLO",
		fullName: "SECLO",
		tooltipTitle: "SECLO - Próximamente",
		status: "comingSoon",
		logoSrc: logoSECLO,
		bgColor: "#ffffff",
		hasBorder: true,
	},
];

// ============================== MÉTRICAS MOBILE (TICKER) ============================== //
// En desktop (sm+) se muestran las 3 métricas en fila. En mobile se rota una sola
// con fade + desplazamiento vertical sutil cada ~3.2s para reducir densidad visual.

interface HeroMetric {
	key: string;
	value: string;
	label: string;
	renderIcon: (color: string) => JSX.Element;
}

const HERO_METRICS: HeroMetric[] = [
	{
		key: "rating",
		value: "4.7/5",
		label: "valoración",
		renderIcon: (color) => <Star1 size={18} variant="Bulk" color={color} />,
	},
	{
		key: "users",
		value: "500+",
		label: "usuarios",
		renderIcon: (color) => <Profile2User size={18} variant="Bulk" color={color} />,
	},
	{
		key: "cases",
		// TODO mock — validar valor real con datos de producción.
		value: "+10k",
		label: "causas",
		renderIcon: (color) => <FolderOpen size={18} variant="Bulk" color={color} />,
	},
];

const METRIC_ROTATION_MS = 3200;

const MetricsTicker = ({ iconColor }: { iconColor: string }) => {
	const [index, setIndex] = useState(0);
	useEffect(() => {
		const id = window.setInterval(() => {
			setIndex((i) => (i + 1) % HERO_METRICS.length);
		}, METRIC_ROTATION_MS);
		return () => window.clearInterval(id);
	}, []);

	const active = HERO_METRICS[index];

	return (
		// Altura fija para evitar saltos de layout al cambiar la métrica.
		<Box sx={{ height: 36, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
			<AnimatePresence mode="wait">
				<motion.div
					key={active.key}
					initial={{ opacity: 0, y: -4 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 4 }}
					transition={{ duration: 0.35, ease: "easeOut" }}
					style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
				>
					{active.renderIcon(iconColor)}
					<Box
						component="span"
						sx={{
							fontSize: "1.3rem",
							fontWeight: 600,
							lineHeight: 1.2,
							letterSpacing: "-0.02em",
							fontVariantNumeric: "tabular-nums",
						}}
					>
						{active.value}
					</Box>
					<Box component="span" sx={{ fontSize: "0.85rem", fontWeight: 400, color: "text.secondary", lineHeight: 1.2 }}>
						{active.label}
					</Box>
				</motion.div>
			</AnimatePresence>
		</Box>
	);
};

// ============================== METRIC VALUE (DESKTOP) ============================== //

const MetricValue = ({ children, label }: { children: ReactNode; label: string }) => (
	<Typography
		sx={{
			fontSize: { xs: "1.125rem", sm: "1.375rem", md: "1.625rem" },
			fontWeight: 600,
			lineHeight: 1.2,
			letterSpacing: "-0.015em",
			fontVariantNumeric: "tabular-nums",
		}}
	>
		{children}
		<Box
			component="span"
			sx={{
				fontSize: "75%",
				fontWeight: 400,
				ml: 0.5,
				color: "text.secondary",
			}}
		>
			{label}
		</Box>
	</Typography>
);

// ============================== LANDING - HEADER ============================== //

const HeaderPage = () => {
	const theme = useTheme();
	const { trackHeroCTA } = useLandingAnalytics();
	const [supportModalOpen, setSupportModalOpen] = useState(false);
	const isMobile = useMediaQuery((t: Theme) => t.breakpoints.down("sm"));
	const isDark = theme.palette.mode === "dark";

	return (
		<Box
			sx={{
				position: "relative",
				overflow: "hidden",
				// 100dvh en xs evita que la sección siguiente "asome" en mobiles altos (430x932,
				// 412x915, etc). dvh respeta la URL bar dinámica del navegador móvil.
				minHeight: { xs: "100dvh", sm: "100vh" },
				bgcolor: theme.palette.background.default,
				// Offset extra para el strip de descuento cuando está visible
				// (--discount-banner-h se setea en :root por DiscountBanner.tsx).
				pt: {
					xs: "calc(var(--discount-banner-h, 0px) + 88px)",
					sm: "calc(var(--discount-banner-h, 0px) + 80px)",
					md: "calc(var(--discount-banner-h, 0px) + 96px)",
					lg: "calc(var(--discount-banner-h, 0px) + 80px)",
					xl: "calc(var(--discount-banner-h, 0px) + 72px)",
				},
				pb: { xs: 5, sm: 5, md: 6, lg: 8, xl: 10 },
				display: "flex",
				flexDirection: "column",
			}}
		>
			<PageBackground variant="default" />

			{/* Atmosphere — blobs brand-blue (sin púrpura) sobre el PageBackground */}
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

			{/* Dot grid texture — neutral, fade radial hacia los bordes */}
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
				{/* Contenido principal centrado verticalmente */}
				{/* Centramos verticalmente: con 100dvh + alignItems center el bloque queda balanceado
				en mobiles altos (430x932, etc.) y el padding-top garantiza que el navbar no tape el título. */}
				<Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
					<Grid container alignItems="center" justifyContent="center" spacing={{ xs: 2, md: 4 }}>
						{/* Columna izquierda - Contenido textual */}
						<Grid item xs={12} md={6} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
							<Grid container spacing={{ xs: 1, sm: 1.5, md: 2.5, lg: 3 }} sx={{ textAlign: "center", maxWidth: { md: 580 } }}>
								<Grid item xs={12}>
									<motion.div
										initial={{ opacity: 0, translateY: 50 }}
										animate={{ opacity: 1, translateY: 0 }}
										transition={{
											type: "spring",
											stiffness: 150,
											damping: 30,
										}}
									>
										<Typography
											variant="h1"
											sx={{
												fontSize: { xs: "1.5rem", sm: "2.125rem", md: "2.5rem", lg: "3rem", xl: "3.75rem" },
												fontWeight: 600,
												lineHeight: 1.05,
												letterSpacing: "-0.03em",
												textWrap: "balance",
											}}
										>
											<span>Automatizá tu </span>
											<Box
												component="span"
												sx={{
													background: BRAND_GRADIENT_TEXT,
													color: "transparent",
													WebkitBackgroundClip: "text",
													backgroundClip: "text",
													animation: "move-bg 24s infinite linear",
													"@keyframes move-bg": {
														"100%": {
															backgroundPosition: "400% 0",
														},
													},
												}}
											>
												Estudio Jurídico
											</Box>
										</Typography>
									</motion.div>
								</Grid>
								<Grid item xs={12}>
									<motion.div
										initial={{ opacity: 0, translateY: 30 }}
										animate={{ opacity: 1, translateY: 0 }}
										transition={{
											type: "spring",
											stiffness: 150,
											damping: 30,
											delay: 0.2,
										}}
									>
										<Typography
											variant="h6"
											component="div"
											sx={{
												fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.0625rem", lg: "1.125rem", xl: "1.2rem" },
												fontWeight: 400,
												lineHeight: 1.45,
												letterSpacing: "-0.005em",
												color: "text.secondary",
												textWrap: "pretty",
												mb: { xs: 0, md: 1.5 },
											}}
										>
											Gestioná expedientes, cálculos, agenda y vencimientos desde una sola plataforma para abogados.
										</Typography>
									</motion.div>
								</Grid>

								{/* CTA - Botón y microtexto */}
								<Grid item xs={12}>
									<motion.div
										initial={{ opacity: 0, translateY: 30 }}
										animate={{ opacity: 1, translateY: 0 }}
										transition={{
											type: "spring",
											stiffness: 150,
											damping: 30,
											delay: 0.3,
										}}
									>
										<Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} justifyContent="center">
											<Grid item>
												<AnimateButton>
													<Button
														component={RouterLink}
														to="/register"
														size="large"
														color="primary"
														variant="contained"
														onClick={trackHeroCTA}
													>
														Probar Gratis
													</Button>
												</AnimateButton>
											</Grid>
										</Grid>
										<Typography
											variant="body2"
											sx={{
												mt: 0.75,
												fontSize: "0.8125rem",
												color: "#6E6E6E",
												letterSpacing: "0.02em",
											}}
										>
											Sin tarjeta · Registro en 1 minuto
										</Typography>
									</motion.div>
								</Grid>

								{/* Sección métricas — ticker rotativo (solo mobile) */}
								<Grid item xs={12} sx={{ display: { xs: "block", sm: "none" }, mt: -0.5 }}>
									<MetricsTicker iconColor={theme.palette.primary.main} />
								</Grid>

								{/* Mockup mobile - solo visible en xs y sm */}
								<Grid item xs={12} sx={{ display: { xs: "block", md: "none" } }}>
									<motion.div
										initial={{ opacity: 0, translateY: 30 }}
										animate={{ opacity: 1, translateY: 0 }}
										transition={{
											type: "spring",
											stiffness: 150,
											damping: 30,
											delay: 0.4,
										}}
									>
										<MockupFrame paperBg={theme.palette.background.paper} textColor={theme.palette.text.primary} compact />
									</motion.div>
								</Grid>
								<Grid item xs={12}>
									<motion.div
										initial={{ opacity: 0, translateY: 30 }}
										animate={{ opacity: 1, translateY: 0 }}
										transition={{
											type: "spring",
											stiffness: 150,
											damping: 30,
											delay: 0.5,
										}}
									>
										<Typography
											variant="caption"
											sx={{
												mt: { xs: 0, md: 1 },
												mb: { xs: 0, md: 0 },
												display: "block",
												color: theme.palette.text.secondary,
												fontSize: { xs: "0.65rem", sm: "0.7rem" },
											}}
										>
											Al continuar aceptás los{" "}
											<Link component={RouterLink} to="/terms" underline="hover" sx={{ color: theme.palette.primary.main }}>
												términos
											</Link>{" "}
											y la{" "}
											<Link component={RouterLink} to="/privacy-policy" underline="hover" sx={{ color: theme.palette.primary.main }}>
												política de privacidad
											</Link>
											.
										</Typography>
									</motion.div>
								</Grid>
								{/* Sección métricas — fila de 3 (desktop / tablet) */}
								<Grid item xs={12} sx={{ mt: { xs: 0.5, md: 1.5 }, display: { xs: "none", sm: "block" } }}>
									<motion.div
										initial={{ opacity: 0, translateY: 30 }}
										animate={{ opacity: 1, translateY: 0 }}
										transition={{
											type: "spring",
											stiffness: 150,
											damping: 30,
											delay: 0.6,
										}}
									>
										<Grid container spacing={{ xs: 1.5, sm: 1.5, md: 1.5 }} justifyContent="center" alignItems="flex-start" wrap="nowrap">
											<Grid item xs={4} sm="auto" sx={{ textAlign: "center" }}>
												<Rating name="read-only" value={4.5} size="small" readOnly />
												<MetricValue label="valoración">4.7/5</MetricValue>
											</Grid>
											<Grid item xs={4} sm="auto" sx={{ textAlign: "center" }}>
												<Profile2User size={18} variant="Bulk" color={theme.palette.primary.main} style={{ marginBottom: 2 }} />
												<MetricValue label="usuarios">500+</MetricValue>
											</Grid>
											{/* TODO mock — validar valor real con datos de producción */}
											<Grid item xs={4} sm="auto" sx={{ textAlign: "center" }}>
												<FolderOpen size={18} variant="Bulk" color={theme.palette.primary.main} style={{ marginBottom: 2 }} />
												<MetricValue label="causas">+10k</MetricValue>
											</Grid>
										</Grid>
									</motion.div>
								</Grid>
							</Grid>
						</Grid>

						{/* Columna derecha - Mockup framed (md+) */}
						<Grid item xs={12} md={6} sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", overflow: "visible" }}>
							<motion.div
								initial={{ opacity: 0, translateX: 50 }}
								animate={{ opacity: 1, translateX: 0 }}
								transition={{
									type: "spring",
									stiffness: 150,
									damping: 30,
									delay: 0.3,
								}}
								style={{ width: "100%" }}
							>
								<MockupFrame paperBg={theme.palette.background.paper} textColor={theme.palette.text.primary} />
							</motion.div>
						</Grid>

						{/* Sección de integraciones - ocupa todo el ancho */}
						<Grid item xs={12} sx={{ mt: { xs: 0, sm: 1, md: 1.5 } }}>
							<motion.div
								initial={{ opacity: 0, translateY: 30 }}
								animate={{ opacity: 1, translateY: 0 }}
								transition={{
									type: "spring",
									stiffness: 150,
									damping: 30,
									delay: 0.7,
								}}
							>
								<Box sx={{ textAlign: "center" }}>
									<Typography
										variant="body2"
										sx={{
											color: theme.palette.text.secondary,
											fontSize: "0.75rem",
											textTransform: "uppercase",
											letterSpacing: "0.1em",
											mb: 2,
										}}
									>
										Integrado con
									</Typography>
									<Grid container spacing={{ xs: 1, sm: 3 }} justifyContent="center" alignItems="flex-start">
										{INTEGRATIONS.map((integration) => {
											const isAvailable = integration.status === "available";
											const isDarkTile = !integration.hasBorder;
											const baseShadow = isDarkTile
												? "0 4px 14px rgba(35, 45, 79, 0.4), 0 2px 6px rgba(0, 0, 0, 0.15)"
												: "0 4px 14px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)";
											const hoverShadow = isDarkTile
												? "0 6px 20px rgba(35, 45, 79, 0.5), 0 4px 10px rgba(0, 0, 0, 0.2)"
												: "0 6px 20px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.12)";
											return (
												<Grid item xs={3} sm="auto" key={integration.key}>
													<Tooltip title={integration.tooltipTitle} arrow placement="top" disableHoverListener={!isMobile}>
														<Box
															sx={{
																display: "flex",
																flexDirection: "column",
																alignItems: "center",
																gap: { xs: 0.5, sm: 1 },
																width: { xs: "auto", sm: 130 },
																opacity: isAvailable ? 1 : 0.55,
															}}
														>
															<Box
																sx={{
																	position: "relative",
																	width: { xs: 40, sm: 64 },
																	height: { xs: 40, sm: 64 },
																	borderRadius: 2,
																	bgcolor: integration.bgColor,
																	border: integration.hasBorder ? "1px solid rgba(0, 0, 0, 0.1)" : "none",
																	boxShadow: baseShadow,
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "center",
																	p: 0.75,
																	filter: isAvailable ? "none" : "grayscale(40%)",
																	transition: "transform 0.2s ease, box-shadow 0.2s ease",
																	...(isAvailable && {
																		"&:hover": {
																			transform: "translateY(-2px)",
																			boxShadow: hoverShadow,
																		},
																	}),
																}}
															>
																<Box
																	component="img"
																	src={integration.logoSrc}
																	alt={integration.tooltipTitle}
																	sx={{
																		width: "100%",
																		height: "100%",
																		objectFit: "contain",
																	}}
																/>
																{/* Live pulse dot — sólo disponibles */}
																{isAvailable && (
																	<Box
																		aria-hidden
																		sx={{
																			position: "absolute",
																			top: { xs: -3, sm: -4 },
																			right: { xs: -3, sm: -4 },
																			width: { xs: 10, sm: 12 },
																			height: { xs: 10, sm: 12 },
																			borderRadius: "50%",
																			bgcolor: LIVE_GREEN,
																			border: `2px solid ${theme.palette.background.default}`,
																			zIndex: 3,
																			"&::after": {
																				content: '""',
																				position: "absolute",
																				inset: -1,
																				borderRadius: "50%",
																				bgcolor: LIVE_GREEN,
																				animation: "la-live-pulse 2.2s ease-out infinite",
																			},
																			"@keyframes la-live-pulse": {
																				"0%": { transform: "scale(0.9)", opacity: 0.55 },
																				"80%, 100%": { transform: "scale(2.4)", opacity: 0 },
																			},
																		}}
																	/>
																)}
															</Box>
															{/* Sigla en mobile */}
															<Typography
																variant="caption"
																sx={{
																	display: { xs: "block", sm: "none" },
																	color: theme.palette.text.primary,
																	fontWeight: isAvailable ? 700 : 500,
																	fontSize: "0.65rem",
																	textAlign: "center",
																	lineHeight: 1.3,
																	textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
																}}
															>
																{integration.shortName}
															</Typography>
															{/* Nombre completo en desktop */}
															<Typography
																variant="caption"
																sx={{
																	display: { xs: "none", sm: "block" },
																	color: isAvailable ? theme.palette.text.primary : theme.palette.text.secondary,
																	fontWeight: isAvailable ? 700 : 500,
																	fontSize: "0.8rem",
																	textAlign: "center",
																	lineHeight: 1.3,
																	textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
																	whiteSpace: "pre-line",
																}}
															>
																{integration.fullName}
															</Typography>
															{!isAvailable && (
																<Chip
																	label="Próximamente"
																	size="small"
																	sx={{
																		fontSize: { xs: "0.55rem", sm: "0.65rem" },
																		height: { xs: 16, sm: 20 },
																		bgcolor: theme.palette.primary.lighter,
																		color: theme.palette.primary.dark,
																		fontWeight: 600,
																	}}
																/>
															)}
														</Box>
													</Tooltip>
												</Grid>
											);
										})}
									</Grid>
									<Typography
										variant="body2"
										sx={{
											mt: { xs: 0.5, sm: 2.5 },
											color: "#6E6E6E",
											fontSize: "0.875rem",
											maxWidth: { xs: 300, sm: "none" },
											mx: "auto",
										}}
									>
										<Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
											Centralizá expedientes de PJN y MEV con novedades y movimientos actualizados.
										</Box>
										<Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
											Centralizá tus expedientes de PJN y MEV, con novedades y movimientos actualizados desde una sola plataforma.
										</Box>
									</Typography>
									<Typography
										variant="body2"
										sx={{
											mt: 1.5,
											color: theme.palette.primary.main,
											fontSize: "0.8rem",
											maxWidth: { xs: 300, sm: "none" },
											mx: "auto",
											fontStyle: "italic",
										}}
									>
										¿No está tu jurisdicción?{" "}
										<Link
											component="button"
											onClick={() => setSupportModalOpen(true)}
											sx={{
												color: theme.palette.primary.dark,
												fontWeight: 600,
												textDecoration: "underline",
												cursor: "pointer",
												border: "none",
												background: "none",
												font: "inherit",
												"&:hover": {
													color: theme.palette.primary.main,
												},
											}}
										>
											Pedinos
										</Link>{" "}
										una integración personalizada.
									</Typography>
								</Box>
							</motion.div>
						</Grid>
					</Grid>
				</Box>
			</Container>

			{/* Modal de soporte para solicitar nueva jurisdicción */}
			<SupportModal open={supportModalOpen} onClose={() => setSupportModalOpen(false)} defaultSubject="Solicitud de nueva jurisdicción" />
		</Box>
	);
};

export default HeaderPage;
