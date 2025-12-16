import React from "react";
// material-ui
import { Badge, Box, Button, Container, Grid, Link, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// third party
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import { FolderOpen, Profile2User, Calendar, Calculator, Chart, TaskSquare, CalendarTick, ArrowRight2 } from "iconsax-react";

// project-imports
import FadeInWhenVisible from "./Animation";
import MainCard from "components/MainCard";

interface TechnologyItem {
	iconComponent: React.ElementType;
	title: string;
	description: string;
	cta: string;
	colorKey: "primary" | "secondary" | "error" | "warning" | "info" | "success";
	mobileOrder: number;
}

const TechnologiesList: TechnologyItem[] = [
	{
		iconComponent: FolderOpen,
		title: "Dejá de buscar expedientes en mil lugares",
		description: "Centralizá causas, movimientos, clientes y estados en un solo panel.",
		cta: "Organizar mis expedientes",
		colorKey: "warning",
		mobileOrder: 1, // Expedientes
	},
	{
		iconComponent: Profile2User,
		title: "Tené todos tus clientes ordenados",
		description: "Datos, causas, historial y seguimiento en un solo lugar.",
		cta: "Centralizar clientes",
		colorKey: "secondary",
		mobileOrder: 6, // Clientes (después del texto intermedio)
	},
	{
		iconComponent: Calendar,
		title: "No te olvides nunca más de un vencimiento",
		description: "Agenda integrada, alertas automáticas y sincronización con Google Calendar.",
		cta: "Controlar vencimientos",
		colorKey: "info",
		mobileOrder: 2, // Vencimientos
	},
	{
		iconComponent: Calculator,
		title: "Calculá indemnizaciones sin errores",
		description: "Despidos, SAC, intereses y topes legales siempre actualizados.",
		cta: "Calcular ahora",
		colorKey: "primary",
		mobileOrder: 3, // Cálculos
	},
	{
		iconComponent: Chart,
		title: "Actualizá montos en segundos",
		description: "Cálculo automático con tasas BCRA, actas y criterios judiciales.",
		cta: "Actualizar montos",
		colorKey: "success",
		mobileOrder: 4, // Intereses (espacio para Integración en posición 4 si se agrega)
	},
	{
		iconComponent: TaskSquare,
		title: "Organizá el trabajo diario del estudio",
		description: "Tareas, prioridades, responsables y plazos bien claros.",
		cta: "Gestionar tareas",
		colorKey: "error",
		mobileOrder: 7, // Tareas (después de Clientes)
	},
];

// Card destacada - Sistema de Citas
const FeaturedCard = {
	iconComponent: CalendarTick,
	title: "Dejá que tus clientes agenden solos",
	description: "Sistema de reservas online con link compartible y agenda sincronizada.",
	cta: "Activar sistema de citas",
	colorKey: "primary" as const,
};

// ==============================|| LANDING - TechnologiesPage ||============================== //

const TechnologiesPage = () => {
	const theme = useTheme();

	return (
		<Container>
			<Grid container spacing={3} alignItems="center" justifyContent="center" sx={{ mt: { md: 15, xs: 2.5 }, mb: { md: 10, xs: 2.5 } }}>
				{/* Título y subtítulo de la sección */}
				<Grid item xs={12}>
					<Grid container spacing={2} sx={{ textAlign: "center", marginBottom: 3 }}>
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
								<Typography variant="h2">Todo lo que hoy hacés a mano, en un solo sistema</Typography>
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
								<Typography variant="h5" color="text.secondary" sx={{ maxWidth: "800px", mx: "auto", mt: 1, mb: 3 }}>
									Expedientes, clientes, agenda y cálculos legales organizados automáticamente.
								</Typography>
							</motion.div>
						</Grid>
					</Grid>
				</Grid>

				{/* Grid principal de cards */}
				<Grid item xs={12}>
					<Grid container spacing={3} justifyContent="center">
						{TechnologiesList.map((tech, index) => (
							<Grid
								item
								xs={12}
								sm={6}
								md={4}
								key={index}
								sx={{
									order: { xs: tech.mobileOrder, sm: 0 },
								}}
							>
								<FadeInWhenVisible>
									<MainCard
										sx={{
											height: "100%",
											transition: "all 0.3s ease",
											cursor: "pointer",
											"&:hover": {
												transform: { sm: "translateY(-8px)" },
												boxShadow: { sm: theme.shadows[8] },
												"& .cta-link": {
													textDecoration: "underline",
												},
											},
										}}
									>
										<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
											{/* Ícono */}
											<Box sx={{ mb: 2 }}>
												<tech.iconComponent
													size={40}
													variant="Bulk"
													style={{
														color: theme.palette[tech.colorKey].main,
													}}
												/>
											</Box>

											{/* Título (dolor) */}
											<Typography
												variant="h4"
												sx={{
													mb: 1.5,
													fontWeight: 600,
													color: theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
												}}
											>
												{tech.title}
											</Typography>

											{/* Descripción (beneficio) */}
											<Typography
												variant="body1"
												color="text.secondary"
												sx={{
													mb: 2,
													minHeight: { xs: "auto", sm: "48px" },
												}}
											>
												{tech.description}
											</Typography>

											{/* CTA tipo link - siempre visible en mobile */}
											<Link
												className="cta-link"
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 0.5,
													color: theme.palette[tech.colorKey].main,
													fontWeight: 500,
													cursor: "pointer",
													textDecoration: { xs: "underline", sm: "none" },
													"&:hover": {
														textDecoration: "underline",
													},
												}}
											>
												{tech.cta}
												<ArrowRight2 size={16} />
											</Link>
										</Box>
									</MainCard>
								</FadeInWhenVisible>
							</Grid>
						))}

						{/* Texto intermedio - solo visible en mobile */}
						<Grid
							item
							xs={12}
							sx={{
								order: { xs: 5, sm: 0 },
								display: { xs: "block", sm: "none" },
								textAlign: "center",
								py: 2,
							}}
						>
							<Typography
								variant="h5"
								sx={{
									fontWeight: 500,
									color: theme.palette.mode === "dark" ? theme.palette.grey[300] : theme.palette.grey[700],
								}}
							>
								Todo esto funciona junto, en un solo sistema.
							</Typography>
						</Grid>
					</Grid>
				</Grid>

				{/* Card destacada - Sistema de Citas */}
				<Grid item xs={12} sx={{ mt: 4 }}>
					<FadeInWhenVisible>
						<MainCard
							sx={{
								background:
									theme.palette.mode === "dark"
										? `linear-gradient(135deg, ${theme.palette.primary.dark}15 0%, ${theme.palette.primary.main}10 100%)`
										: `linear-gradient(135deg, ${theme.palette.primary.lighter} 0%, ${theme.palette.grey[50]} 100%)`,
								border: `1px solid ${theme.palette.primary.main}30`,
								transition: "all 0.3s ease",
								cursor: "pointer",
								"&:hover": {
									transform: "translateY(-4px)",
									boxShadow: theme.shadows[8],
									"& .cta-link": {
										textDecoration: "underline",
									},
								},
							}}
						>
							<Grid container spacing={3} alignItems="center" justifyContent="center">
								<Grid item xs={12} md={8}>
									<Box
										sx={{
											display: "flex",
											flexDirection: { xs: "column", sm: "row" },
											alignItems: "center",
											gap: 3,
											textAlign: { xs: "center", sm: "left" },
										}}
									>
										{/* Badge + Ícono */}
										<Badge
											badgeContent="NUEVO"
											color="error"
											sx={{
												"& .MuiBadge-badge": {
													fontSize: "0.7rem",
													fontWeight: 600,
												},
											}}
										>
											<Box
												sx={{
													p: 1.5,
													borderRadius: 2,
													bgcolor: theme.palette.primary.main + "20",
												}}
											>
												<FeaturedCard.iconComponent
													size={40}
													variant="Bulk"
													style={{
														color: theme.palette.primary.main,
													}}
												/>
											</Box>
										</Badge>

										{/* Contenido */}
										<Box sx={{ flex: 1 }}>
											<Typography
												variant="h4"
												sx={{
													mb: 1,
													fontWeight: 600,
													color: theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
												}}
											>
												{FeaturedCard.title}
											</Typography>
											<Typography variant="body1" color="text.secondary">
												{FeaturedCard.description}
											</Typography>
										</Box>

										{/* CTA - siempre visible en mobile */}
										<Link
											component={RouterLink}
											to="/register"
											className="cta-link"
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 0.5,
												color: theme.palette.primary.main,
												fontWeight: 600,
												cursor: "pointer",
												textDecoration: { xs: "underline", sm: "none" },
												whiteSpace: "nowrap",
												"&:hover": {
													textDecoration: "underline",
												},
											}}
										>
											{FeaturedCard.cta}
											<ArrowRight2 size={18} />
										</Link>
									</Box>
								</Grid>
							</Grid>
						</MainCard>
					</FadeInWhenVisible>
				</Grid>

				{/* CTA Final de la sección */}
				<Grid item xs={12} sx={{ mt: 6 }}>
					<FadeInWhenVisible>
						<Box sx={{ textAlign: "center" }}>
							<Typography
								variant="h4"
								sx={{
									mb: 3,
									fontWeight: 500,
									color: theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
								}}
							>
								Probá LawAnalytics gratis y dejá de trabajar a mano.
							</Typography>
							<Button
								component={RouterLink}
								to="/register"
								variant="contained"
								color="primary"
								size="large"
								sx={{
									px: 4,
									py: 1.5,
									fontSize: "1rem",
									fontWeight: 600,
									borderRadius: 2,
								}}
							>
								Probar gratis ahora
							</Button>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
								No requiere tarjeta · Registrate en 1 minuto
							</Typography>
						</Box>
					</FadeInWhenVisible>
				</Grid>
			</Grid>
		</Container>
	);
};

export default TechnologiesPage;
