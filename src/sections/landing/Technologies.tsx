// material-ui
import { Badge, Container, Grid, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// third party
import { motion } from "framer-motion";
import { Calculator, Coin, FolderOpen, ProfileCircle, Calendar, CalendarTick, Task } from "iconsax-react";

// project-imports
import FadeInWhenVisible from "./Animation";
import MainCard from "components/MainCard";

interface TechnologyItem {
	trending: boolean;
	iconComponent: React.ElementType;
	title: string;
	description: string;
	colorKey: "primary" | "secondary" | "error" | "warning" | "info" | "success";
}

const TechnologiesList: TechnologyItem[] = [
	{
		trending: false,
		iconComponent: FolderOpen,
		title: "Carpetas",
		description:
			"Herramienta de administración de causas o expedientes con gestión de clientes, movimientos, datos de tramitación, seguimiento de plazos, alarmas y notificaciones.",
		colorKey: "warning",
	},
	{
		trending: false,
		iconComponent: ProfileCircle,
		title: "Contactos",
		description:
			"Gestión completa de contactos y clientes, con registro de datos, historial y seguimiento personalizado para tu estudio jurídico.",
		colorKey: "secondary",
	},
	{
		trending: false,
		iconComponent: Calendar,
		title: "Calendario",
		description: "Calendario propio y sincronizable con Google Calendar, recordatorios y alertas para no perder ningún evento importante.",
		colorKey: "info",
	},
	{
		trending: true,
		iconComponent: CalendarTick,
		title: "Sistema de Citas",
		description: "Configura y gestiona un sistema de reservas online para que tus clientes agenden citas de forma sencilla y automática.",
		colorKey: "error",
	},
	{
		trending: false,
		iconComponent: Calculator,
		title: "Cálculos Laborales",
		description: "Calculadora especializada para indemnizaciones laborales, despidos y liquidaciones con precisión legal.",
		colorKey: "primary",
	},
	{
		trending: false,
		iconComponent: Coin,
		title: "Intereses y Actualización",
		description: "Cálculo de intereses con distintas tasas para actualización de montos en procesos judiciales.",
		colorKey: "success",
	},
	{
		trending: true,
		iconComponent: Task,
		title: "Tareas",
		description:
			"Gestión integral de tareas y actividades con seguimiento, priorización, plazos y asignación para mantener tu práctica legal organizada.",
		colorKey: "secondary",
	},
];

// ==============================|| LANDING - TechnologiesPage ||============================== //

const TechnologiesPage = () => {
	const theme = useTheme();

	return (
		<Container>
			<Grid container spacing={3} alignItems="center" justifyContent="center" sx={{ mt: { md: 15, xs: 2.5 }, mb: { md: 10, xs: 2.5 } }}>
				<Grid item xs={12}>
					<Grid container spacing={2} sx={{ textAlign: "center", marginBottom: 3 }}>
						<Grid item xs={12}>
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
								<Typography variant="h2">Herramientas Disponibles</Typography>
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
									delay: 0.4,
								}}
							>
								<Typography variant="h5" color="text.secondary" sx={{ maxWidth: "800px", mx: "auto", mt: 1, mb: 3 }}>
									Explora todas las herramientas especializadas para tu práctica legal
								</Typography>
							</motion.div>
						</Grid>
					</Grid>
				</Grid>
				<Grid item xs={12}>
					<Grid container spacing={3} justifyContent="center">
						{TechnologiesList.map((tech, index) => (
							<Grid item xs={12} sm={6} md={4} key={index}>
								<FadeInWhenVisible>
									<MainCard
										sx={{
											height: "100%",
											transition: "all 0.3s ease",
											"&:hover": {
												transform: "translateY(-8px)",
												boxShadow: theme.shadows[8],
											},
										}}
									>
										<Grid container spacing={2} alignItems="center">
											<Grid item xs={12} sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
												{tech.trending && (
													<Badge
														badgeContent="NUEVO"
														color="error"
														variant="standard"
														sx={{
															"& .MuiBadge-badge": {
																fontSize: "0.75rem",
																fontWeight: 600,
															},
														}}
													>
														<tech.iconComponent
															size={64}
															variant="Bulk"
															style={{
																color: theme.palette[tech.colorKey].main,
															}}
														/>
													</Badge>
												)}
												{!tech.trending && (
													<tech.iconComponent
														size={64}
														variant="Bulk"
														style={{
															color: theme.palette[tech.colorKey].main,
														}}
													/>
												)}
											</Grid>
											<Grid item xs={12} sx={{ textAlign: "center" }}>
												<Typography
													variant="h3"
													sx={{
														mb: 1.5,
														color: theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
													}}
												>
													{tech.title}
												</Typography>
											</Grid>
											<Grid item xs={12}>
												<Typography variant="body1" color="text.secondary" sx={{ textAlign: "center" }}>
													{tech.description}
												</Typography>
											</Grid>
										</Grid>
									</MainCard>
								</FadeInWhenVisible>
							</Grid>
						))}
					</Grid>
				</Grid>
			</Grid>
		</Container>
	);
};
export default TechnologiesPage;
