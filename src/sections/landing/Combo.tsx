import React from "react";
// material-ui
import { Button, Box, CardMedia, Container, Grid, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// third party
import { motion } from "framer-motion";
import { ArrowRight, Chart, Calendar, Book1, Calculator } from "iconsax-react";

// project-imports
import FadeInWhenVisible from "./Animation";
import MainCard from "components/MainCard";

interface SystemScreenItem {
	image: string;
	title: string;
	description: string;
	icon: React.ElementType;
	color: "primary" | "info" | "warning" | "success";
	link: string;
}

const SystemScreens: SystemScreenItem[] = [
	{
		image: "https://res.cloudinary.com/dqyoeolib/image/upload/v1752693971/ChatGPT_Image_16_jul_2025_04_25_52_p.m._azhane.png",
		title: "Dashboard Analítico",
		description:
			"Visualiza todos los datos de tu estudio jurídico en tiempo real con gráficos detallados y métricas clave para la toma de decisiones.",
		icon: Chart,
		color: "primary",
		link: "/login",
	},
	{
		image: "https://res.cloudinary.com/dqyoeolib/image/upload/v1752696521/ChatGPT_Image_16_jul_2025_05_08_26_p.m._pluo94.png",
		title: "Calendario Integrado",
		description:
			"Gestiona vencimientos, audiencias y reuniones de forma eficiente. Sincronización con Google Calendar e integración con expedientes.",
		icon: Calendar,
		color: "info",
		link: "/login",
	},
	{
		image: "https://res.cloudinary.com/dqyoeolib/image/upload/v1752696998/ChatGPT_Image_16_jul_2025_05_16_21_p.m._tu3dps.png",
		title: "Gestión de Expedientes",
		description:
			"Centraliza toda la información de tus causas legales, movimientos y documentos en un sistema de gestión completo y eficiente.",
		icon: Book1,
		color: "warning",
		link: "/login",
	},
	{
		image: "https://res.cloudinary.com/dqyoeolib/image/upload/v1752693206/ChatGPT_Image_16_jul_2025_03_57_15_p.m._xhyamw.png",
		title: "Herramientas Legales",
		description: "Accede a calculadoras laborales, de intereses, y más herramientas especializadas para profesionales del derecho.",
		icon: Calculator,
		color: "success",
		link: "/login",
	},
];

// ==============================|| LANDING - ComboPage ||============================== //

const ComboPage = () => {
	const theme = useTheme();

	return (
		<Container>
			<Grid container spacing={5} alignItems="center" justifyContent="center" sx={{ mt: { md: 15, xs: 2.5 }, mb: { md: 15, xs: 2.5 } }}>
				<Grid item xs={12}>
					<Grid container spacing={2} justifyContent="center" sx={{ textAlign: "center", marginBottom: 5 }}>
						<Grid item xs={12}>
							<motion.div
								initial={{ opacity: 0, translateY: 50 }}
								animate={{ opacity: 1, translateY: 0 }}
								transition={{
									type: "spring",
									stiffness: 150,
									damping: 30,
									delay: 0.2,
								}}
							>
								<Typography variant="h2">Estudio Jurídico Virtual</Typography>
							</motion.div>
						</Grid>
						<Grid item xs={12} md={8}>
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
								<Typography variant="h5" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
									Con Law||Analytics puedes mantener tu estudio jurídico de forma 100% virtual y trabajar de forma remota y colaborativa
									desde cualquier lugar 🌍
								</Typography>
							</motion.div>
						</Grid>
					</Grid>
				</Grid>

				{SystemScreens.map((screen, index) => (
					<Grid item xs={12} key={index} sx={{ mb: 4 }}>
						<FadeInWhenVisible>
							<MainCard
								sx={{
									overflow: "hidden",
									boxShadow: theme.shadows[4],
									borderRadius: "16px",
									transition: "all 0.3s ease",
									"&:hover": {
										boxShadow: theme.shadows[10],
										transform: "translateY(-5px)",
									},
								}}
							>
								<Grid
									container
									spacing={3}
									direction={index % 2 === 0 ? "row" : "row-reverse"}
									sx={{ flexDirection: { xs: "column-reverse", md: index % 2 === 0 ? "row" : "row-reverse" } }}
								>
									{/* Contenido de texto */}
									<Grid item xs={12} md={5} sx={{ display: "flex", alignItems: "center" }}>
										<Box sx={{ p: { xs: 2, md: 4 } }}>
											<Box
												sx={{
													display: "inline-flex",
													p: 1.5,
													borderRadius: "12px",
													bgcolor:
														screen.color === "primary"
															? theme.palette.primary.lighter
															: screen.color === "info"
															? theme.palette.info.lighter
															: screen.color === "warning"
															? theme.palette.warning.lighter
															: theme.palette.success.lighter,
													mb: 2,
												}}
											>
												<screen.icon
													size={36}
													variant="Bulk"
													style={{
														color:
															screen.color === "primary"
																? theme.palette.primary.main
																: screen.color === "info"
																? theme.palette.info.main
																: screen.color === "warning"
																? theme.palette.warning.main
																: theme.palette.success.main,
													}}
												/>
											</Box>

											<Typography
												variant="h3"
												sx={{
													mb: 2,
													color: theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
												}}
											>
												{screen.title}
											</Typography>

											<Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
												{screen.description}
											</Typography>

											<Button
												variant="contained"
												color={screen.color}
												endIcon={<ArrowRight />}
												href={screen.link}
												sx={{
													borderRadius: "8px",
													textTransform: "none",
													fontWeight: 600,
													"&:hover": {
														boxShadow:
															screen.color === "primary"
																? `0 6px 15px ${theme.palette.primary.lighter}`
																: screen.color === "info"
																? `0 6px 15px ${theme.palette.info.lighter}`
																: screen.color === "warning"
																? `0 6px 15px ${theme.palette.warning.lighter}`
																: `0 6px 15px ${theme.palette.success.lighter}`,
													},
												}}
											>
												Explorar
											</Button>
										</Box>
									</Grid>

									{/* Imagen */}
									<Grid item xs={12} md={7}>
										<Box
											sx={{
												position: "relative",
												height: { xs: "240px", sm: "340px", md: "400px" },
												overflow: "hidden",
												borderRadius: { xs: "12px", md: index % 2 === 0 ? "0 12px 12px 0" : "12px 0 0 12px" },
											}}
										>
											<CardMedia
												component="img"
												image={screen.image}
												alt={screen.title}
												sx={{
													width: "100%",
													height: "100%",
													objectFit: "cover",
													objectPosition: "center",
													transition: "transform 0.5s ease",
													"&:hover": {
														transform: "scale(1.05)",
													},
												}}
											/>
										</Box>
									</Grid>
								</Grid>
							</MainCard>
						</FadeInWhenVisible>
					</Grid>
				))}
			</Grid>
		</Container>
	);
};
export default ComboPage;
