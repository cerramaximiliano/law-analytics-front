import { Link as RouterLink } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, Button, Container, Grid, Rating, Typography, Link } from "@mui/material";

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

// ==============================|| LANDING - HeaderPage ||============================== //

const HeaderPage = () => {
	const theme = useTheme();
	const { trackHeroCTA } = useLandingAnalytics();

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
											Ahorrá horas de trabajo con expedientes, cálculos, agenda y clientes en un solo lugar.
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
									<Grid container spacing={4} justifyContent="center">
										<Grid item xs={6} sm="auto">
											<Box
												sx={{
													display: "flex",
													flexDirection: "column",
													alignItems: "center",
													gap: 1,
												}}
											>
												<Box
													sx={{
														width: 56,
														height: 56,
														borderRadius: 2,
														bgcolor: "#232D4F",
														boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														p: 0.75,
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
												<Typography
													variant="caption"
													sx={{
														color: theme.palette.text.primary,
														fontWeight: 500,
														fontSize: "0.8rem",
														textAlign: "center",
														lineHeight: 1.3,
													}}
												>
													Poder Judicial
													<br />
													de la Nación
												</Typography>
											</Box>
										</Grid>
										<Grid item xs={6} sm="auto">
											<Box
												sx={{
													display: "flex",
													flexDirection: "column",
													alignItems: "center",
													gap: 1,
												}}
											>
												<Box
													sx={{
														width: 56,
														height: 56,
														borderRadius: 2,
														bgcolor: "#ffffff",
														border: "1px solid rgba(0, 0, 0, 0.15)",
														boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														p: 0.75,
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
												<Typography
													variant="caption"
													sx={{
														color: theme.palette.text.primary,
														fontWeight: 500,
														fontSize: "0.8rem",
														textAlign: "center",
														lineHeight: 1.3,
													}}
												>
													Poder Judicial de la
													<br />
													Prov. de Buenos Aires
												</Typography>
											</Box>
										</Grid>
									</Grid>
									<Typography
										variant="body2"
										sx={{
											mt: 2.5,
											color: "#6E6E6E",
											fontSize: "0.875rem",
											maxWidth: 400,
											mx: "auto",
										}}
									>
										Consulta expedientes, estados y movimientos en tiempo real desde un solo lugar.
									</Typography>
								</Box>
							</motion.div>
						</Grid>
					</Grid>
				</Box>
			</Container>
		</Box>
	);
};
export default HeaderPage;
