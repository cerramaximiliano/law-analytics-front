import { Link as RouterLink } from "react-router-dom";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, Container, Grid, Rating, Typography, Link } from "@mui/material";
import { PaletteColor } from "@mui/material/styles";

// third party
import { motion } from "framer-motion";

// project imports
import AnimateButton from "components/@extended/AnimateButton";
import PageBackground from "components/PageBackground";

// icons
import { Calculator, Coin, FolderOpen, ProfileCircle, Calendar, CalendarTick } from "iconsax-react";

// ==============================|| LANDING - HeaderPage ||============================== //

// Define las propiedades de las tecnologías/herramientas
interface Technology {
	icon: React.ElementType;
	color: "primary" | "secondary" | "info" | "success" | "warning" | "error";
	delay: number;
}

const HeaderPage = () => {
	const theme = useTheme();

	// Lista de tecnologías/herramientas con sus respectivos colores
	const technologies: Technology[] = [
		{ icon: FolderOpen, color: "warning", delay: 0.8 },
		{ icon: ProfileCircle, color: "secondary", delay: 0.9 },
		{ icon: Calendar, color: "info", delay: 1.0 },
		{ icon: CalendarTick, color: "error", delay: 1.1 },
		{ icon: Calculator, color: "primary", delay: 1.2 },
		{ icon: Coin, color: "success", delay: 1.3 },
	];

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
					<Grid container alignItems="center" justifyContent="center" spacing={2}>
						<Grid item xs={12} md={9}>
							<Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5, lg: 3 }} sx={{ textAlign: "center" }}>
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
												fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.25rem", lg: "2.75rem", xl: "3.4375rem" },
												fontWeight: 700,
												lineHeight: 1.1,
											}}
										>
											<span>Explore las</span>
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
												<span> Herramientas Legales </span>
											</Box>
											<span> más Potentes del Mercado</span>
										</Typography>
									</motion.div>
								</Grid>
								<Grid container justifyContent="center" item xs={12}>
									<Grid item xs={12} sm={10} md={8}>
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
													fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem", lg: "0.95rem", xl: "1rem" },
													fontWeight: 400,
													lineHeight: 1.3,
												}}
											>
												Law||Analytics es una de las herramientas legales más potentes del mercado legal hoy disponible.
											</Typography>
										</motion.div>
									</Grid>
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
													<Button component={RouterLink} to="/login" target="_blank" size="large" color="primary" variant="contained">
														Inicie Gratis
													</Button>
												</AnimateButton>
											</Grid>
										</Grid>
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
					</Grid>
				</Box>

				{/* Sección de iconos en la parte inferior, dentro del mismo container */}
				<Box sx={{ mt: "auto", mb: 0, py: { xs: 0.5, sm: 1, md: 1.5, lg: 2 } }}>
					<Grid
						container
						spacing={2}
						justifyContent="center"
						sx={{
							maxWidth: 900,
							mx: "auto",
						}}
					>
						{technologies.map((tech, index) => (
							<Grid item key={index} xs={4} sm={2} sx={{ textAlign: "center" }}>
								<motion.div
									initial={{ opacity: 0, translateY: 20 }}
									animate={{ opacity: 1, translateY: 0 }}
									transition={{
										type: "spring",
										stiffness: 150,
										damping: 30,
										delay: 0.6 + index * 0.1, // Secuencia de aparición más pronunciada
									}}
								>
									<Box
										sx={{
											display: "flex",
											justifyContent: "center",
											alignItems: "center",
											flexDirection: "column",
											p: 1,
										}}
									>
										<Box
											sx={{
												p: { xs: 0.75, sm: 1, md: 1.25, lg: 1.5 },
												borderRadius: "50%",
												bgcolor: alpha((theme.palette[tech.color] as PaletteColor).main, 0.12),
												display: "flex",
												justifyContent: "center",
												alignItems: "center",
												mb: { xs: 0, sm: 0.5, md: 1 },
												width: { xs: 40, sm: 48, md: 56, lg: 64 },
												height: { xs: 40, sm: 48, md: 56, lg: 64 },
											}}
										>
											<tech.icon
												size={24}
												variant="Bulk"
												style={{
													color: (theme.palette[tech.color] as PaletteColor).main,
												}}
											/>
										</Box>
									</Box>
								</motion.div>
							</Grid>
						))}
					</Grid>
				</Box>
			</Container>
		</Box>
	);
};
export default HeaderPage;
