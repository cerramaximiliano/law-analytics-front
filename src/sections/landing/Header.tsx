import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

// material-ui
import { useTheme, Theme } from "@mui/material/styles";
import { Box, Button, Chip, Container, Grid, Rating, Typography, Link, Tooltip, useMediaQuery } from "@mui/material";

// project imports
import SupportModal from "layout/MainLayout/Drawer/DrawerContent/SupportModal";

// third party
import { motion } from "framer-motion";

// project imports
import AnimateButton from "components/@extended/AnimateButton";
import PageBackground from "components/PageBackground";
import { useLandingAnalytics } from "hooks/useLandingAnalytics";

// assets
import dashboardImage from "assets/images/dashboard.png";
import logoPJNacion from "assets/images/logos/logo_pj_nacion.png";
import logoPJBuenosAires from "assets/images/logos/logo_pj_buenos_aires.svg";

// Logo externo (Cloudinary)
const logoPJCABA = "https://res.cloudinary.com/dqyoeolib/image/upload/v1770081495/ChatGPT_Image_2_feb_2026_09_44_56_p.m._ymi66g.png";

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
				minHeight: "100vh",
				bgcolor: theme.palette.background.default, // Fondo consistente con otros componentes
				pt: { xs: 9, sm: 11, md: 16, lg: 14, xl: 12 }, // Padding ajustado para dejar espacio al header
				pb: { xs: 2, sm: 4, md: 8, lg: 10, xl: 12 }, // Padding bottom reducido y progresivo
				display: "flex",
				flexDirection: "column",
			}}
		>
			<PageBackground variant="default" />
			<Container sx={{ flex: 1, display: "flex", flexDirection: "column", px: { xs: 2, sm: 3 } }}>
				{/* Contenido principal centrado verticalmente */}
				<Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
					<Grid container alignItems="center" justifyContent="center" spacing={{ xs: 2, md: 4 }}>
						{/* Columna izquierda - Contenido textual */}
						<Grid item xs={12} md={6} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
							<Grid container spacing={{ xs: 1, sm: 1.5, md: 2.5, lg: 3 }} sx={{ textAlign: "center", maxWidth: { md: 500 } }}>
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
												fontSize: { xs: "1.35rem", sm: "1.65rem", md: "2.25rem", lg: "2.75rem", xl: "3.4375rem" },
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
												fontSize: { xs: "0.875rem", sm: "0.9rem", md: "1rem", lg: "1.0625rem", xl: "1.125rem" },
												fontWeight: 400,
												lineHeight: 1.3,
												mb: { xs: 0, md: 1.5 },
											}}
										>
											Dejá de perder horas con expedientes, cálculos y agenda. Centralizá todo tu estudio jurídico en un solo sistema.
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
											No requiere tarjeta. Registrate en 1 minuto.
										</Typography>
									</motion.div>
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
												mt: 1,
												mb: 1.5,
											}}
										>
											<Box
												component="img"
												src={dashboardImage}
												alt="Law Analytics Dashboard"
												sx={{
													width: "90%",
													maxWidth: 320,
													height: "auto",
													maxHeight: 180,
													objectFit: "cover",
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
												mt: { xs: 1, md: 2 },
												mb: { xs: 0.5, md: 0 },
												display: "block",
												color: theme.palette.text.secondary,
												fontSize: { xs: "0.65rem", sm: "0.75rem" },
											}}
										>
											Al continuar, acepta nuestros{" "}
											<Link component={RouterLink} to="/terms" underline="hover" sx={{ color: theme.palette.primary.main }}>
												Términos y Condiciones
											</Link>{" "}
											y{" "}
											<Link component={RouterLink} to="/privacy-policy" underline="hover" sx={{ color: theme.palette.primary.main }}>
												Política de Privacidad
											</Link>
										</Typography>
									</motion.div>
								</Grid>
								<Grid item xs={12} sx={{ mt: { xs: 0.5, md: 1.5 } }}>
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
										<Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }} justifyContent="center">
											<Grid
												item
												sx={{
													position: "relative",
													"&:after": {
														content: '""',
														position: "absolute",
														height: 30,
														bottom: 10,
														left: "auto",
														right: "-12px",
														width: "1px",
														background: theme.palette.divider,
														display: { xs: "none", sm: "block" },
													},
												}}
											>
												<Rating name="read-only" value={4.5} size="small" readOnly />
												<Typography variant="h4">
													4.7/5
													<span
														style={{
															fontSize: "75%",
															fontWeight: 400,
															margin: 5,
															color: theme.palette.text.secondary,
														}}
													>
														Ratings
													</span>
												</Typography>
											</Grid>
											<Grid item>
												<Typography variant="h5">
													<span
														style={{
															fontSize: "75%",
															fontWeight: 400,
															color: theme.palette.text.secondary,
														}}
													>
														Usuarios
													</span>
												</Typography>
												<Typography variant="h4">500+</Typography>
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
						<Grid item xs={12} sx={{ mt: { xs: 2, sm: 3, md: 5 } }}>
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
									<Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center">
										{/* PJN - Poder Judicial de la Nación */}
										<Grid item xs={4} sm="auto">
											<Tooltip title="Poder Judicial de la Nación" arrow placement="top" disableHoverListener={!isMobile}>
												<Box
													sx={{
														display: "flex",
														flexDirection: "column",
														alignItems: "center",
														gap: { xs: 0.5, sm: 1 },
														width: { xs: "auto", sm: 130 },
													}}
												>
													<Box
														sx={{
															width: { xs: 48, sm: 60 },
															height: { xs: 48, sm: 60 },
															borderRadius: 2,
															bgcolor: "#232D4F",
															boxShadow: "0 4px 14px rgba(35, 45, 79, 0.4), 0 2px 6px rgba(0, 0, 0, 0.15)",
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
															p: 0.75,
															transition: "transform 0.2s ease, box-shadow 0.2s ease",
															"&:hover": {
																transform: "translateY(-2px)",
																boxShadow: "0 6px 20px rgba(35, 45, 79, 0.5), 0 4px 10px rgba(0, 0, 0, 0.2)",
															},
														}}
													>
														<Box
															component="img"
															src={logoPJNacion}
															alt="Poder Judicial de la Nación"
															sx={{
																width: "100%",
																height: "100%",
																objectFit: "contain",
															}}
														/>
													</Box>
													{/* Texto corto en móvil */}
													<Typography
														variant="caption"
														sx={{
															display: { xs: "block", sm: "none" },
															color: theme.palette.text.primary,
															fontWeight: 600,
															fontSize: "0.75rem",
															textAlign: "center",
															lineHeight: 1.3,
															textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
														}}
													>
														PJN
													</Typography>
													{/* Texto completo en desktop */}
													<Typography
														variant="caption"
														sx={{
															display: { xs: "none", sm: "block" },
															color: theme.palette.text.primary,
															fontWeight: 600,
															fontSize: "0.8rem",
															textAlign: "center",
															lineHeight: 1.3,
															textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
														}}
													>
														Poder Judicial
														<br />
														de la Nación
													</Typography>
												</Box>
											</Tooltip>
										</Grid>

										{/* MEV - Poder Judicial de la Provincia de Buenos Aires */}
										<Grid item xs={4} sm="auto">
											<Tooltip title="Poder Judicial de la Provincia de Buenos Aires (MEV)" arrow placement="top" disableHoverListener={!isMobile}>
												<Box
													sx={{
														display: "flex",
														flexDirection: "column",
														alignItems: "center",
														gap: { xs: 0.5, sm: 1 },
														width: { xs: "auto", sm: 130 },
													}}
												>
													<Box
														sx={{
															width: { xs: 48, sm: 60 },
															height: { xs: 48, sm: 60 },
															borderRadius: 2,
															bgcolor: "#ffffff",
															border: "1px solid rgba(0, 0, 0, 0.1)",
															boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)",
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
															p: 0.75,
															transition: "transform 0.2s ease, box-shadow 0.2s ease",
															"&:hover": {
																transform: "translateY(-2px)",
																boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.12)",
															},
														}}
													>
														<Box
															component="img"
															src={logoPJBuenosAires}
															alt="Poder Judicial de la Provincia de Buenos Aires"
															sx={{
																width: "100%",
																height: "100%",
																objectFit: "contain",
															}}
														/>
													</Box>
													{/* Texto corto en móvil */}
													<Typography
														variant="caption"
														sx={{
															display: { xs: "block", sm: "none" },
															color: theme.palette.text.primary,
															fontWeight: 600,
															fontSize: "0.75rem",
															textAlign: "center",
															lineHeight: 1.3,
															textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
														}}
													>
														MEV
													</Typography>
													{/* Texto completo en desktop */}
													<Typography
														variant="caption"
														sx={{
															display: { xs: "none", sm: "block" },
															color: theme.palette.text.primary,
															fontWeight: 600,
															fontSize: "0.8rem",
															textAlign: "center",
															lineHeight: 1.3,
															textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
														}}
													>
														Poder Judicial de la
														<br />
														Prov. de Buenos Aires
													</Typography>
												</Box>
											</Tooltip>
										</Grid>

										{/* EJE - Poder Judicial de la Ciudad de Buenos Aires */}
										<Grid item xs={4} sm="auto">
											<Tooltip title="Poder Judicial de la Ciudad de Buenos Aires (EJE) - Próximamente" arrow placement="top" disableHoverListener={!isMobile}>
												<Box
													sx={{
														display: "flex",
														flexDirection: "column",
														alignItems: "center",
														gap: { xs: 0.5, sm: 1 },
														width: { xs: "auto", sm: 130 },
														opacity: 0.6,
													}}
												>
													<Box
														sx={{
															width: { xs: 48, sm: 60 },
															height: { xs: 48, sm: 60 },
															borderRadius: 2,
															bgcolor: "#ffffff",
															border: "1px solid rgba(0, 0, 0, 0.1)",
															boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06)",
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
															p: 0.75,
															filter: "grayscale(20%)",
															transition: "transform 0.2s ease, box-shadow 0.2s ease",
														}}
													>
														<Box
															component="img"
															src={logoPJCABA}
															alt="Poder Judicial de la Ciudad de Buenos Aires"
															sx={{
																width: "100%",
																height: "100%",
																objectFit: "contain",
															}}
														/>
													</Box>
													{/* Texto corto en móvil */}
													<Typography
														variant="caption"
														sx={{
															display: { xs: "block", sm: "none" },
															color: theme.palette.text.primary,
															fontWeight: 600,
															fontSize: "0.75rem",
															textAlign: "center",
															lineHeight: 1.3,
															textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
														}}
													>
														EJE
													</Typography>
													{/* Texto completo en desktop */}
													<Typography
														variant="caption"
														sx={{
															display: { xs: "none", sm: "block" },
															color: theme.palette.text.primary,
															fontWeight: 600,
															fontSize: "0.8rem",
															textAlign: "center",
															lineHeight: 1.3,
															textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
														}}
													>
														Poder Judicial de la
														<br />
														Ciudad de Buenos Aires
													</Typography>
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
												</Box>
											</Tooltip>
										</Grid>
									</Grid>
									<Typography
										variant="body2"
										sx={{
											mt: 2.5,
											color: "#6E6E6E",
											fontSize: "0.875rem",
											maxWidth: { xs: 300, sm: "none" },
											mx: "auto",
										}}
									>
										Consulta expedientes, estados y movimientos en tiempo real desde un solo lugar.
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
										¿Tu jurisdicción no está disponible?{" "}
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
											Contáctanos
										</Link>{" "}
										y desarrollamos una integración personalizada.
									</Typography>
								</Box>
							</motion.div>
						</Grid>
					</Grid>
				</Box>
			</Container>

			{/* Modal de soporte para solicitar nueva jurisdicción */}
			<SupportModal
				open={supportModalOpen}
				onClose={() => setSupportModalOpen(false)}
				defaultSubject="Solicitud de nueva jurisdicción"
			/>
		</Box>
	);
};
export default HeaderPage;
