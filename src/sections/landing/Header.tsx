import { Link as RouterLink } from "react-router-dom";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, Container, Grid, Rating, Typography } from "@mui/material";
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
				pt: { xs: 5, md: 5 }, // Padding vertical consistente
				pb: { xs: 10, md: 15 }, // Padding bottom mayor para dejar espacio a los iconos
				display: "flex",
				flexDirection: "column",
			}}
		>
			<PageBackground variant="default" />
			<Container sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
				{/* Contenido principal centrado verticalmente */}
				<Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
					<Grid container alignItems="center" justifyContent="center" spacing={2}>
						<Grid item xs={12} md={9}>
							<Grid container spacing={3} sx={{ textAlign: "center" }}>
								<Grid item xs={12}>
									<motion.div
										initial={{ opacity: 0, translateY: 550 }}
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
												fontSize: { xs: "1.825rem", sm: "2rem", md: "3.4375rem" },
												fontWeight: 700,
												lineHeight: 1.2,
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
									<Grid item xs={8}>
										<motion.div
											initial={{ opacity: 0, translateY: 550 }}
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
													fontSize: { xs: "0.875rem", md: "1rem" },
													fontWeight: 400,
													lineHeight: { xs: 1.4, md: 1.4 },
												}}
											>
												Law||Analytics es uno de las herramientas legales más potentes del mercado legal hoy disponible.
											</Typography>
										</motion.div>
									</Grid>
								</Grid>
								<Grid item xs={12}>
									<motion.div
										initial={{ opacity: 0, translateY: 550 }}
										animate={{ opacity: 1, translateY: 0 }}
										transition={{
											type: "spring",
											stiffness: 150,
											damping: 30,
											delay: 0.4,
										}}
									>
										<Grid container spacing={2} justifyContent="center">
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
										initial={{ opacity: 0, translateY: 550 }}
										animate={{ opacity: 1, translateY: 0 }}
										transition={{
											type: "spring",
											stiffness: 150,
											damping: 30,
											delay: 0.6,
										}}
									>
										<Grid container spacing={3} justifyContent="center">
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
				<Box sx={{ mt: "auto", mb: 0, py: 2 }}>
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
									initial={{ opacity: 0, translateY: 80 }}
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
												p: 1.5,
												borderRadius: "50%",
												bgcolor: alpha((theme.palette[tech.color] as PaletteColor).main, 0.12),
												display: "flex",
												justifyContent: "center",
												alignItems: "center",
												mb: 1,
												width: { xs: 50, sm: 64 },
												height: { xs: 50, sm: 64 },
											}}
										>
											<tech.icon
												size={32}
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
