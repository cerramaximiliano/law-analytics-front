import { useState } from "react";

// material-ui
import { useTheme, styled, alpha } from "@mui/material/styles";
import { Box, Button, Container, Grid, Typography, Card, CardContent, CardActionArea, Divider, Stack } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// project-imports
import MainCard from "components/MainCard";
import { GuideLaboral, GuideIntereses, GuideFolders, GuideContacts, GuideCalendar, GuideBooking, GuideTasks } from "components/guides";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";

// icons
import { Calculator, Coin, FolderOpen, ProfileCircle, Calendar, CalendarTick, Task } from "iconsax-react";

// ==============================|| GUIDES PAGE - HEADER ||============================== //

const Header = styled(Box)(({ theme }) => ({
	paddingTop: 30,
	paddingBottom: 30,
	background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.3)} 100%)`,
	borderRadius: "8px",
	marginBottom: 40,
}));

// ==============================|| GUIDES PAGE ||============================== //

const GuidesPage = () => {
	const theme = useTheme();

	// Modal states
	const [laboral, setLaboral] = useState(false);
	const [intereses, setIntereses] = useState(false);
	const [folders, setFolders] = useState(false);
	const [contacts, setContacts] = useState(false);
	const [calendar, setCalendar] = useState(false);
	const [booking, setBooking] = useState(false);
	const [tasks, setTasks] = useState(false);

	const guideData = [
		{
			title: "Calculadora Laboral",
			description: "Aprende a usar la calculadora para indemnizaciones laborales, despidos y liquidaciones.",
			icon: Calculator,
			color: "primary",
			openModal: () => setLaboral(true),
		},
		{
			title: "Calculadora de Intereses",
			description: "Aprende a calcular intereses con distintas tasas para tus procesos legales.",
			icon: Coin,
			color: "success",
			openModal: () => setIntereses(true),
		},
		{
			title: "Gestión de Carpetas",
			description: "Aprende a organizar y gestionar carpetas para tus expedientes legales.",
			icon: FolderOpen,
			color: "warning",
			openModal: () => setFolders(true),
		},
		{
			title: "Gestión de Contactos",
			description: "Aprende a gestionar tus contactos y clientes en el sistema.",
			icon: ProfileCircle,
			color: "secondary",
			openModal: () => setContacts(true),
		},
		{
			title: "Calendario",
			description: "Aprende a gestionar eventos y agenda en tu calendario legal.",
			icon: Calendar,
			color: "info",
			openModal: () => setCalendar(true),
		},
		{
			title: "Sistema de Citas",
			description: "Aprende a configurar y gestionar el sistema de citas online para tus clientes.",
			icon: CalendarTick,
			color: "error",
			openModal: () => setBooking(true),
		},
		{
			title: "Gestión de Tareas",
			description: "Aprende a crear, organizar y dar seguimiento a tus tareas y actividades legales.",
			icon: Task,
			color: "primary",
			openModal: () => setTasks(true),
		},
	];

	// breadcrumb items
	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Guías de Uso" }];

	return (
		<>
			<Box component="section" sx={{ pt: { xs: 10, md: 15 }, pb: { xs: 5, md: 10 }, position: "relative", overflow: "hidden" }}>
				<PageBackground variant="light" />
				<Container>
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<CustomBreadcrumbs items={breadcrumbItems} />
							<Header>
								<Container>
									<Grid container spacing={3} alignItems="center">
										<Grid item xs={12} md={6}>
											<motion.div
												initial={{ opacity: 0, translateY: 20 }}
												animate={{ opacity: 1, translateY: 0 }}
												transition={{ duration: 0.5 }}
											>
												<Typography variant="h1" sx={{ mb: 2 }}>
													Guías de Uso
												</Typography>
												<Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
													Accede a todas nuestras guías detalladas y aprende a sacar el máximo provecho de Law||Analytics
												</Typography>
											</motion.div>
										</Grid>
										<Grid item xs={12} md={6} sx={{ display: { xs: "none", md: "block" } }}>
											<Box
												sx={{
													width: "100%",
													height: "100%",
													display: "flex",
													justifyContent: "flex-end",
													"& > *": {
														transition: "all 0.2s ease-in-out",
														"&:hover": { transform: "translateY(-5px)" },
													},
												}}
											>
												{[
													{ icon: Calculator, color: "primary.main", delay: 0.1, size: 60, offset: 20 },
													{ icon: Calendar, color: "info.main", delay: 0.2, size: 72, offset: 0 },
													{ icon: FolderOpen, color: "warning.main", delay: 0.3, size: 70, offset: 30 },
													{ icon: Task, color: "secondary.main", delay: 0.4, size: 65, offset: 15 },
												].map((item, index) => (
													<motion.div
														key={index}
														initial={{ opacity: 0, translateY: 20 }}
														animate={{ opacity: 1, translateY: 0 }}
														transition={{ duration: 0.5, delay: item.delay }}
														style={{ marginLeft: -item.offset, marginRight: index === 3 ? 0 : -item.offset }}
													>
														<Box
															sx={{
																p: 1,
																bgcolor: alpha(
																	item.color === "primary.main"
																		? theme.palette.primary.main
																		: item.color === "info.main"
																		? theme.palette.info.main
																		: theme.palette.warning.main,
																	0.2,
																),
																borderRadius: "50%",
															}}
														>
															<item.icon
																size={item.size}
																variant="Bulk"
																style={{
																	color:
																		item.color === "primary.main"
																			? theme.palette.primary.main
																			: item.color === "info.main"
																			? theme.palette.info.main
																			: item.color === "secondary.main"
																			? theme.palette.secondary.main
																			: theme.palette.warning.main,
																}}
															/>
														</Box>
													</motion.div>
												))}
											</Box>
										</Grid>
									</Grid>
								</Container>
							</Header>
						</Grid>

						<Grid item xs={12}>
							<Grid container spacing={3}>
								{guideData.map((guide, index) => {
									const IconComponent = guide.icon;
									return (
										<Grid item xs={12} sm={6} md={4} key={index}>
											<motion.div
												initial={{ opacity: 0, translateY: 20 }}
												animate={{ opacity: 1, translateY: 0 }}
												transition={{ duration: 0.3, delay: index * 0.1 }}
											>
												<Card
													sx={{
														height: "100%",
														transition: "all 0.3s ease",
														"&:hover": {
															boxShadow: theme.shadows[10],
															transform: "translateY(-8px)",
														},
													}}
												>
													<CardActionArea
														onClick={guide.openModal}
														sx={{
															height: "100%",
															display: "flex",
															flexDirection: "column",
															alignItems: "stretch",
															p: 2,
														}}
													>
														<CardContent sx={{ flexGrow: 1, textAlign: "center", p: 3 }}>
															<Box
																sx={{
																	width: 80,
																	height: 80,
																	borderRadius: "50%",
																	display: "flex",
																	justifyContent: "center",
																	alignItems: "center",
																	bgcolor: alpha(
																		guide.color === "primary"
																			? theme.palette.primary.main
																			: guide.color === "secondary"
																			? theme.palette.secondary.main
																			: guide.color === "error"
																			? theme.palette.error.main
																			: guide.color === "warning"
																			? theme.palette.warning.main
																			: guide.color === "info"
																			? theme.palette.info.main
																			: theme.palette.success.main,
																		0.15,
																	),
																	mx: "auto",
																	mb: 2,
																}}
															>
																<IconComponent
																	size={44}
																	variant="Bulk"
																	style={{
																		color:
																			guide.color === "primary"
																				? theme.palette.primary.main
																				: guide.color === "secondary"
																				? theme.palette.secondary.main
																				: guide.color === "error"
																				? theme.palette.error.main
																				: guide.color === "warning"
																				? theme.palette.warning.main
																				: guide.color === "info"
																				? theme.palette.info.main
																				: theme.palette.success.main,
																	}}
																/>
															</Box>
															<Typography variant="h4" component="div" gutterBottom>
																{guide.title}
															</Typography>
															<Typography variant="body1" color="text.secondary">
																{guide.description}
															</Typography>
														</CardContent>
														<Divider sx={{ mt: "auto" }} />
														<Box sx={{ p: 2, textAlign: "center" }}>
															<Button
																variant="text"
																color={
																	guide.color === "primary"
																		? "primary"
																		: guide.color === "secondary"
																		? "secondary"
																		: guide.color === "error"
																		? "error"
																		: guide.color === "warning"
																		? "warning"
																		: guide.color === "info"
																		? "info"
																		: "success"
																}
																size="small"
															>
																Ver Guía
															</Button>
														</Box>
													</CardActionArea>
												</Card>
											</motion.div>
										</Grid>
									);
								})}
							</Grid>
						</Grid>

						<Grid item xs={12} sx={{ mt: 6 }}>
							<MainCard>
								<Stack spacing={2}>
									<Typography variant="h3">¿Necesitas más ayuda?</Typography>
									<Typography variant="body1">
										Si no encuentras la información que necesitas en nuestras guías, puedes contactar directamente con nuestro equipo de
										soporte.
									</Typography>
									<Box sx={{ mt: 2 }}>
										<Button variant="contained" color="primary" size="large" href="mailto:support@lawanalytics.app">
											Contactar Soporte
										</Button>
									</Box>
								</Stack>
							</MainCard>
						</Grid>
					</Grid>
				</Container>
			</Box>

			{/* Modales de Guías */}
			<GuideLaboral open={laboral} onClose={() => setLaboral(false)} />
			<GuideIntereses open={intereses} onClose={() => setIntereses(false)} />
			<GuideFolders open={folders} onClose={() => setFolders(false)} />
			<GuideContacts open={contacts} onClose={() => setContacts(false)} />
			<GuideCalendar open={calendar} onClose={() => setCalendar(false)} />
			<GuideBooking open={booking} onClose={() => setBooking(false)} />
			<GuideTasks open={tasks} onClose={() => setTasks(false)} />
		</>
	);
};

export default GuidesPage;
