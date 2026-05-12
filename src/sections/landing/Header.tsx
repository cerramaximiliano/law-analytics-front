import { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";

// material-ui
import { useTheme, Theme } from "@mui/material/styles";
import { Box, Button, Chip, Container, Grid, Rating, Typography, Link, Tooltip, useMediaQuery } from "@mui/material";

// project imports
import SupportModal from "layout/MainLayout/Drawer/DrawerContent/SupportModal";

// third party
import { motion, AnimatePresence } from "framer-motion";
import { Profile2User, FolderOpen, Star1 } from "iconsax-react";

// project imports
import AnimateButton from "components/@extended/AnimateButton";
import PageBackground from "components/PageBackground";
import { useLandingAnalytics } from "hooks/useLandingAnalytics";

// assets
import dashboardImage from "assets/images/dashboard.png";
import logoPJNacion from "assets/images/logos/logo_pj_nacion.png";
import logoPJBuenosAires from "assets/images/logos/logo_pj_buenos_aires.svg";

// Logos externos (Cloudinary)
const logoPJCABA = "https://res.cloudinary.com/dqyoeolib/image/upload/v1770081495/ChatGPT_Image_2_feb_2026_09_44_56_p.m._ymi66g.png";
const logoSECLO = "https://res.cloudinary.com/dqyoeolib/image/upload/q_auto/f_auto/v1776203385/seclo-removebg-preview_rxcvzm.png";

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

// ============================== SECCIÓN MÉTRICAS ============================== //
// En desktop (sm+) se muestran las 3 métricas en fila. En mobile se rota una sola
// con fade + desplazamiento vertical sutil cada ~2.8s para reducir densidad visual.

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
					<Box component="span" sx={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1.2 }}>
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

// ==============================|| LANDING - HeaderPage ||============================== //

const HeaderPage = () => {
	const theme = useTheme();
	const { trackHeroCTA } = useLandingAnalytics();
	const [supportModalOpen, setSupportModalOpen] = useState(false);
	const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

	return (
		<Box
			sx={{
				position: "relative",
				overflow: "hidden",
				// 100dvh en xs evita que la sección siguiente "asome" en mobiles altos (430x932,
				// 412x915, etc). dvh respeta la URL bar dinámica del navegador móvil.
				minHeight: { xs: "100dvh", sm: "100vh" },
				bgcolor: theme.palette.background.default, // Fondo consistente con otros componentes
				pt: { xs: 11, sm: 10, md: 12, lg: 10, xl: 9 }, // Padding superior — compensa Toolbar más alto en landing mobile
				pb: { xs: 5, sm: 5, md: 6, lg: 8, xl: 10 }, // Padding inferior — separación con la sección siguiente
				display: "flex",
				flexDirection: "column",
			}}
		>
			<PageBackground variant="default" />
			<Container sx={{ flex: 1, display: "flex", flexDirection: "column", px: { xs: 2, sm: 3 } }}>
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
												fontSize: { xs: "1.35rem", sm: "2rem", md: "2.25rem", lg: "2.75rem", xl: "3.4375rem" },
												fontWeight: 700,
												lineHeight: 1.1,
											}}
										>
											<span>Automatizá tu </span>
											<Box
												component="span"
												sx={{
													background: "linear-gradient(90deg, #3A7BFF, #8A5CFF, #3A7BFF) 0 0 / 400% 100%",
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
												fontSize: { xs: "0.875rem", sm: "1.05rem", md: "1rem", lg: "1.0625rem", xl: "1.125rem" },
												fontWeight: 400,
												lineHeight: 1.3,
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
										<Box
											sx={{
												display: "flex",
												justifyContent: "center",
												mt: 0,
												mb: 0.5,
											}}
										>
											<Box
												component="img"
												src={dashboardImage}
												alt="Law Analytics Dashboard"
												sx={{
													width: { xs: "90%", sm: "75%" },
													maxWidth: { xs: 320, sm: 560 },
													height: "auto",
													maxHeight: { xs: 180, sm: 340 },
													objectFit: { xs: "cover", sm: "contain" },
													objectPosition: "top left",
													borderRadius: "12px",
													boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
												}}
											/>
										</Box>
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
											<Grid
												item
												xs={4}
												sm="auto"
												sx={{ textAlign: "center" }}
											>
												<Rating name="read-only" value={4.5} size="small" readOnly />
												<Typography sx={{ fontSize: { xs: "1.125rem", sm: "1.375rem", md: "1.625rem" }, fontWeight: 600, lineHeight: 1.2 }}>
													4.7/5
													<Box
														component="span"
														sx={{
															fontSize: "75%",
															fontWeight: 400,
															ml: 0.5,
															color: theme.palette.text.secondary,
														}}
													>
														valoración
													</Box>
												</Typography>
											</Grid>
											<Grid
												item
												xs={4}
												sm="auto"
												sx={{ textAlign: "center" }}
											>
												<Profile2User size={18} variant="Bulk" color={theme.palette.primary.main} style={{ marginBottom: 2 }} />
												<Typography sx={{ fontSize: { xs: "1.125rem", sm: "1.375rem", md: "1.625rem" }, fontWeight: 600, lineHeight: 1.2 }}>
													500+
													<Box
														component="span"
														sx={{
															fontSize: "75%",
															fontWeight: 400,
															ml: 0.5,
															color: theme.palette.text.secondary,
														}}
													>
														Usuarios
													</Box>
												</Typography>
											</Grid>
											{/* TODO mock — validar valor real con datos de producción */}
											<Grid
												item
												xs={4}
												sm="auto"
												sx={{ textAlign: "center" }}
											>
												<FolderOpen size={18} variant="Bulk" color={theme.palette.primary.main} style={{ marginBottom: 2 }} />
												<Typography sx={{ fontSize: { xs: "1.125rem", sm: "1.375rem", md: "1.625rem" }, fontWeight: 600, lineHeight: 1.2 }}>
													+10k
													<Box
														component="span"
														sx={{
															fontSize: "75%",
															fontWeight: 400,
															ml: 0.5,
															color: theme.palette.text.secondary,
														}}
													>
														Causas
													</Box>
												</Typography>
											</Grid>
										</Grid>
									</motion.div>
								</Grid>
							</Grid>
						</Grid>

						{/* Columna derecha - Imagen del dashboard */}
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
							>
								<Box
									sx={{
										position: "relative",
										width: "100%",
										transform: "scale(1.08)",
										transformOrigin: "center center",
									}}
								>
									{/* Imagen de fondo (segunda capa - efecto profundidad) */}
									<Box
										component="img"
										src={dashboardImage}
										alt=""
										sx={{
											position: "absolute",
											top: -20,
											right: -25,
											width: "90%",
											height: "auto",
											borderRadius: "12px",
											opacity: 0.25,
											filter: "blur(2px)",
											boxShadow: theme.shadows[10],
											zIndex: 0,
										}}
									/>
									{/* Imagen principal */}
									<Box
										component="img"
										src={dashboardImage}
										alt="Law Analytics Dashboard"
										sx={{
											width: "100%",
											height: "auto",
											borderRadius: "12px",
											boxShadow: theme.shadows[20],
											position: "relative",
											zIndex: 1,
										}}
									/>
									{/* Fade inferior */}
									<Box
										sx={{
											position: "absolute",
											bottom: 0,
											left: 0,
											right: 0,
											height: 80,
											background: `linear-gradient(to bottom, transparent, ${theme.palette.background.default})`,
											borderRadius: "0 0 12px 12px",
											zIndex: 2,
										}}
									/>
								</Box>
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
											const isDark = !integration.hasBorder;
											const baseShadow = isDark
												? "0 4px 14px rgba(35, 45, 79, 0.4), 0 2px 6px rgba(0, 0, 0, 0.15)"
												: "0 4px 14px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)";
											const hoverShadow = isDark
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
