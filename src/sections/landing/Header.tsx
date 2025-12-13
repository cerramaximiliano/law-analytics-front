import { Link as RouterLink } from "react-router-dom";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, Container, Grid, Rating, Typography, Link } from "@mui/material";

// third party
import { motion } from "framer-motion";

// project imports
import AnimateButton from "components/@extended/AnimateButton";
import PageBackground from "components/PageBackground";

// assets
import dashboardImage from "assets/images/dashboard.png";

// ==============================|| LANDING - HeaderPage ||============================== //

const HeaderPage = () => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				position: "relative",
				overflow: "hidden",
				minHeight: "100vh",
				bgcolor: theme.palette.background.default, // Fondo consistente con otros componentes
				pt: { xs: 8, sm: 9, md: 10, lg: 8, xl: 6 }, // Padding ajustado para todas las resoluciones
				pb: { xs: 4, sm: 6, md: 8, lg: 10, xl: 12 }, // Padding bottom reducido y progresivo
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
							<Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5, lg: 3 }} sx={{ textAlign: "center", maxWidth: { md: 500 } }}>
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
													background: "linear-gradient(90deg, rgb(37, 161, 244), rgb(249, 31, 169), rgb(37, 161, 244)) 0 0 / 400% 100%",
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
											}}
										>
											Ahorrá horas de trabajo con expedientes, cálculos, agenda y clientes en un solo lugar.
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
											delay: 0.3,
										}}
									>
										<Box
											sx={{
												display: "flex",
												justifyContent: "center",
												mt: 2,
												mb: 3.5,
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
													maxHeight: 220,
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
											delay: 0.4,
										}}
									>
										<Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} justifyContent="center">
											<Grid item>
												<AnimateButton>
													<Button component={RouterLink} to="/register" size="large" color="primary" variant="contained">
														Probar Gratis
													</Button>
												</AnimateButton>
											</Grid>
										</Grid>
										<Typography
											variant="body2"
											sx={{
												mt: 1.5,
												fontSize: "0.875rem",
												color: theme.palette.text.secondary,
											}}
										>
											No requiere tarjeta. Registrate en 1 minuto.
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
											delay: 0.5,
										}}
									>
										<Typography variant="caption" sx={{ mt: 2, display: "block", color: theme.palette.text.secondary }}>
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
								<Grid item xs={12}>
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
										<Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} justifyContent="center">
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
										transform: "scale(1.08) translateY(-15px)",
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
											opacity: 0.45,
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
					</Grid>
				</Box>
			</Container>
		</Box>
	);
};
export default HeaderPage;
