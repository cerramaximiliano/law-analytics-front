// material-ui
import { Badge, Button, CardMedia, Container, Grid, Link, Typography } from "@mui/material";

// third party
import { motion } from "framer-motion";

// project-imports
import FadeInWhenVisible from "./Animation";
import MainCard from "components/MainCard";

// assets
import { ExportSquare } from "iconsax-react";

import calendar from "assets/images/landing/calendar.svg";
import calculator from "assets/images/landing/calculator.svg";
import folder from "assets/images/landing/folder.svg";
import notifications from "assets/images/landing/notifications.svg";

let value: string = window.location.search;
const params = new URLSearchParams(value);
const ispValue = params.get("isp");

const Technologies = [
	{
		trending: false,
		icon: folder,
		title: "Expedientes",
		description:
			"Herramienta de administración de causas o expendientes con administración de clientes, movimientos, datos de tramitación, seguimiento de plazos, alarmas y notificaciones.",
		preview: ispValue !== null && parseInt(ispValue) === 1 ? "https://ableproadmin.com?isp=1" : "https://ableproadmin.com",
		free: "https://github.com/phoenixcoded/able-pro-free-admin-dashboard-template",
	},
	{
		trending: false,
		icon: notifications,
		title: "Notificaciones",
		description:
			"Plantillas para armado de notificaciones con almacenamiento de modelos, seguimiento automatizados de envíos y alertas de plazos.",
		preview: ispValue !== null && parseInt(ispValue) === 1 ? "https://ableproadmin.com/react/?isp=1" : "https://ableproadmin.com/react/",
		free: "https://github.com/phoenixcoded/able-pro-free-admin-dashboard-template",
	},
	{
		trending: false,
		icon: calendar,
		title: "Calendario",
		description: "Calendario propio y sincronizable con Google Calendar, recordatorios y alertas.",
		preview:
			ispValue !== null && parseInt(ispValue) === 1
				? "https://ableproadmin.com/angular/default/?isp=1"
				: "https://ableproadmin.com/angular/default/",
		free: "https://github.com/phoenixcoded/able-pro-free-admin-dashboard-template",
	},
	{
		trending: false,
		icon: calculator,
		title: "Cálculos",
		description: "Diferentes de tipos de cálculos judiciales laborales, civiles y de actualización de montos.",
		preview: ispValue !== null && parseInt(ispValue) === 1 ? "https://ableproadmin.com/vue/?isp=1" : "https://ableproadmin.com/vue/",
		free: null,
	},
];

// ==============================|| LANDING - TechnologiesPage ||============================== //

const TechnologiesPage = () => {
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
								<Typography>Explore todas las herramientas hoy disponibles.</Typography>
							</motion.div>
						</Grid>
					</Grid>
				</Grid>
				<Grid item xs={12}>
					<Grid container spacing={3} alignItems="center">
						{Technologies.map((tech, index) => (
							<Grid item xs={12} md={6} lg={4} key={index}>
								<FadeInWhenVisible>
									<MainCard>
										<Grid container spacing={2}>
											<Grid item xs={12}>
												{tech.trending && (
													<Badge badgeContent="TRENDING" color="error" variant="light">
														<CardMedia component="img" image={tech.icon} sx={{ width: "auto" }} />
													</Badge>
												)}
												{!tech.trending && <CardMedia component="img" image={tech.icon} sx={{ width: "auto" }} />}
											</Grid>
											<Grid item xs={12}>
												<Typography variant="h4">{tech.title}</Typography>
											</Grid>
											<Grid item xs={12}>
												<Typography>{tech.description}</Typography>
											</Grid>
											<Grid item xs={12}>
												<Grid container spacing={2} justifyContent="flex-start">
													<Grid item>
														<Button
															variant="contained"
															color="secondary"
															size="large"
															startIcon={<ExportSquare />}
															component={Link}
															href={tech.preview}
															target="_blank"
															sx={{
																fontWeight: 500,
																bgcolor: "secondary.light",
																color: "secondary.darker",
																"&:hover": { color: "secondary.lighter" },
															}}
														>
															Reference
														</Button>
													</Grid>
												</Grid>
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
