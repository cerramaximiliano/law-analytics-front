import { useState } from "react";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Button, Card, CardActionArea, Container, Grid, Stack, Typography } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// icons
import { ArrowRight, Calculator, Calendar, CalendarTick, Chart21, Cloud, Coin, FolderOpen, ProfileCircle, Task } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import {
	GuideAnalytics,
	GuideBooking,
	GuideCalendar,
	GuideContacts,
	GuideFolders,
	GuideIntereses,
	GuideLaboral,
	GuideLimits,
	GuideTasks,
} from "components/guides";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";
import SupportModal from "layout/MainLayout/Drawer/DrawerContent/SupportModal";

// ============================== TOKENS ============================== //
// Mantener en sync con sections/landing/Planes.tsx
const BRAND_BLUE = "#3A7BFF";

// ============================== GUIDES DATA ============================== //

interface GuideEntry {
	title: string;
	description: string;
	icon: typeof Calculator;
	openModal: () => void;
}

// ==============================|| GUIDES PAGE ||============================== //

const GuidesPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	// Modal states
	const [laboral, setLaboral] = useState(false);
	const [intereses, setIntereses] = useState(false);
	const [folders, setFolders] = useState(false);
	const [contacts, setContacts] = useState(false);
	const [calendar, setCalendar] = useState(false);
	const [booking, setBooking] = useState(false);
	const [tasks, setTasks] = useState(false);
	const [analytics, setAnalytics] = useState(false);
	const [limits, setLimits] = useState(false);
	const [supportOpen, setSupportOpen] = useState(false);

	const guides: GuideEntry[] = [
		{
			title: "Calculadora laboral",
			description: "Indemnizaciones, despidos y liquidaciones finales con la calculadora laboral.",
			icon: Calculator,
			openModal: () => setLaboral(true),
		},
		{
			title: "Calculadora de intereses",
			description: "Cálculo de intereses con distintas tasas para tus procesos legales.",
			icon: Coin,
			openModal: () => setIntereses(true),
		},
		{
			title: "Gestión de carpetas",
			description: "Organizá tus expedientes legales en carpetas vinculadas a cálculos, contactos y eventos.",
			icon: FolderOpen,
			openModal: () => setFolders(true),
		},
		{
			title: "Gestión de contactos",
			description: "Administrá clientes, contrapartes y testigos con categorías y vínculos a casos.",
			icon: ProfileCircle,
			openModal: () => setContacts(true),
		},
		{
			title: "Calendario",
			description: "Audiencias, vencimientos y reuniones organizados con recordatorios automáticos.",
			icon: Calendar,
			openModal: () => setCalendar(true),
		},
		{
			title: "Sistema de citas",
			description: "Disponibilidad pública para que tus clientes agenden consultas online.",
			icon: CalendarTick,
			openModal: () => setBooking(true),
		},
		{
			title: "Gestión de tareas",
			description: "Creá, organizá y seguí tareas y actividades legales por caso.",
			icon: Task,
			openModal: () => setTasks(true),
		},
		{
			title: "Panel de analíticas",
			description: "Métricas y reportes para entender tu actividad legal de un vistazo.",
			icon: Chart21,
			openModal: () => setAnalytics(true),
		},
		{
			title: "Límites y almacenamiento",
			description: "Cómo aprovechar los límites de tu plan y optimizar tu uso.",
			icon: Cloud,
			openModal: () => setLimits(true),
		},
	];

	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Guías de uso" }];

	return (
		<>
			<Box component="section" sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 6, md: 10 }, position: "relative", overflow: "hidden" }}>
				<PageBackground variant="light" />

				{/* Spotlight atmospheric */}
				<Box
					aria-hidden
					sx={{
						position: "absolute",
						top: "25%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: { xs: 520, md: 880 },
						height: { xs: 520, md: 880 },
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.07)} 0%, ${alpha(
							BRAND_BLUE,
							isDark ? 0.04 : 0.02,
						)} 40%, transparent 70%)`,
						filter: "blur(70px)",
						pointerEvents: "none",
						zIndex: 0,
					}}
				/>

				<Container sx={{ position: "relative", zIndex: 1 }}>
					<CustomBreadcrumbs items={breadcrumbItems} />

					{/* Hero editorial */}
					<Box sx={{ mt: { xs: 2, md: 3 }, mb: { xs: 5, md: 7 }, textAlign: "center" }}>
						<motion.div
							initial={{ opacity: 0, y: 24 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ type: "spring", stiffness: 150, damping: 30 }}
						>
							<Typography
								variant="h1"
								sx={{
									fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
									fontWeight: 600,
									lineHeight: 1.08,
									letterSpacing: "-0.025em",
									textWrap: "balance",
									mb: 2,
									color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
								}}
							>
								Guías para sacar el máximo de Law||Analytics
							</Typography>
						</motion.div>
						<motion.div
							initial={{ opacity: 0, y: 16 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.1 }}
						>
							<Typography
								sx={{
									maxWidth: 640,
									mx: "auto",
									fontSize: { xs: "1rem", md: "1.125rem" },
									fontWeight: 400,
									lineHeight: 1.5,
									letterSpacing: "-0.005em",
									color: theme.palette.text.secondary,
									textWrap: "pretty",
								}}
							>
								Pasos concretos para cada herramienta del producto. Abrí cualquier tarjeta para ver la guía detallada.
							</Typography>
						</motion.div>
					</Box>

					{/* Grid de guías — monocromo + hover azul */}
					<Grid container spacing={3} alignItems="stretch">
						{guides.map((guide, idx) => {
							const Icon = guide.icon;
							return (
								<Grid item xs={12} sm={6} md={4} key={guide.title} sx={{ display: "flex" }}>
									<motion.div
										initial={{ opacity: 0, y: 24 }}
										whileInView={{ opacity: 1, y: 0 }}
										viewport={{ once: true, margin: "-80px" }}
										transition={{ duration: 0.5, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
										style={{ width: "100%", display: "flex" }}
									>
										<Card
											elevation={0}
											sx={{
												width: "100%",
												borderRadius: 2,
												border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
												transition: "all 0.25s ease",
												bgcolor: "transparent",
												"&:hover": {
													borderColor: alpha(BRAND_BLUE, 0.4),
													boxShadow: `0 12px 28px ${alpha(BRAND_BLUE, 0.1)}, 0 4px 10px ${alpha(BRAND_BLUE, 0.06)}`,
													"& .guide-icon-wrap": {
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.12),
														color: BRAND_BLUE,
													},
													"& .guide-arrow": {
														transform: "translateX(4px)",
														color: BRAND_BLUE,
													},
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
													borderRadius: "inherit",
												}}
											>
												<Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
													{/* Icon */}
													<Box
														className="guide-icon-wrap"
														sx={{
															width: 48,
															height: 48,
															borderRadius: 1.5,
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
															bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.07),
															color: BRAND_BLUE,
															transition: "all 0.25s ease",
														}}
													>
														<Icon size={24} variant="Bulk" color="currentColor" />
													</Box>

													{/* Title + description */}
													<Box sx={{ flex: 1 }}>
														<Typography
															sx={{
																fontSize: "1.05rem",
																fontWeight: 600,
																letterSpacing: "-0.01em",
																lineHeight: 1.3,
																mb: 0.75,
																color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
															}}
														>
															{guide.title}
														</Typography>
														<Typography
															sx={{
																fontSize: "0.88rem",
																color: theme.palette.text.secondary,
																lineHeight: 1.55,
															}}
														>
															{guide.description}
														</Typography>
													</Box>

													{/* CTA inline */}
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 0.5,
															color: theme.palette.text.secondary,
															fontSize: "0.85rem",
															fontWeight: 500,
															transition: "color 0.25s ease",
														}}
													>
														Ver guía
														<Box
															className="guide-arrow"
															component="span"
															sx={{ display: "inline-flex", transition: "all 0.25s ease" }}
														>
															<ArrowRight size={14} />
														</Box>
													</Box>
												</Box>
											</CardActionArea>
										</Card>
									</motion.div>
								</Grid>
							);
						})}
					</Grid>

					{/* CTA de soporte — sobrio, no contained shouty */}
					<Box sx={{ mt: { xs: 6, md: 8 } }}>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-60px" }}
							transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
						>
							<MainCard
								sx={{
									borderRadius: 2,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
									border: `1px solid ${alpha(BRAND_BLUE, 0.18)}`,
								}}
							>
								<Stack
									direction={{ xs: "column", sm: "row" }}
									spacing={{ xs: 2, sm: 4 }}
									alignItems={{ xs: "flex-start", sm: "center" }}
									justifyContent="space-between"
								>
									<Box>
										<Typography
											sx={{
												fontSize: { xs: "1.25rem", md: "1.5rem" },
												fontWeight: 600,
												letterSpacing: "-0.015em",
												lineHeight: 1.2,
												mb: 0.75,
												color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
											}}
										>
											¿No encontrás lo que buscás?
										</Typography>
										<Typography
											sx={{
												fontSize: "0.95rem",
												color: theme.palette.text.secondary,
												lineHeight: 1.55,
												maxWidth: 540,
											}}
										>
											Si necesitás ayuda específica, escribinos y nuestro equipo de soporte te responde directamente.
										</Typography>
									</Box>
									<Button
										variant="contained"
										color="primary"
										size="large"
										onClick={() => setSupportOpen(true)}
										sx={{
											fontSize: "0.92rem",
											fontWeight: 600,
											textTransform: "none",
											borderRadius: 2,
											px: 3,
											height: 44,
											flexShrink: 0,
											boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, 0.25)}`,
											"&:hover": {
												boxShadow: `0 12px 26px ${alpha(BRAND_BLUE, 0.35)}`,
												transform: "translateY(-2px)",
											},
										}}
									>
										Contactar soporte
									</Button>
								</Stack>
							</MainCard>
						</motion.div>
					</Box>
				</Container>
			</Box>

			{/* Modales — funcionalidad original preservada */}
			<GuideLaboral open={laboral} onClose={() => setLaboral(false)} />
			<GuideIntereses open={intereses} onClose={() => setIntereses(false)} />
			<GuideFolders open={folders} onClose={() => setFolders(false)} />
			<GuideContacts open={contacts} onClose={() => setContacts(false)} />
			<GuideCalendar open={calendar} onClose={() => setCalendar(false)} />
			<GuideBooking open={booking} onClose={() => setBooking(false)} />
			<GuideTasks open={tasks} onClose={() => setTasks(false)} />
			<GuideAnalytics open={analytics} onClose={() => setAnalytics(false)} />
			<GuideLimits open={limits} onClose={() => setLimits(false)} />
			<SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
		</>
	);
};

export default GuidesPage;
