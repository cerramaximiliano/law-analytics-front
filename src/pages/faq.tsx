import { useState } from "react";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Card, CardActionArea, CardContent, Chip, Collapse, Container, Grid, Paper, Stack, Typography } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// icons
import {
	ArrowRight2,
	Calculator,
	Calendar,
	CalendarTick,
	Folder,
	InfoCircle,
	MessageQuestion,
	Profile2User,
} from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";

// ============================== TOKENS ============================== //
// Mantener en sync con sections/landing/Planes.tsx
const BRAND_BLUE = "#3A7BFF";

// ============================== DATA ============================== //

interface Category {
	id: string;
	name: string;
	icon: typeof Calculator;
}

interface Faq {
	id: string;
	category: string;
	question: string;
	answer: string;
}

const CATEGORIES: Category[] = [
	{ id: "calculadoras", name: "Calculadoras", icon: Calculator },
	{ id: "carpetas", name: "Gestión de casos", icon: Folder },
	{ id: "contactos", name: "Contactos", icon: Profile2User },
	{ id: "calendario", name: "Calendario", icon: Calendar },
	{ id: "citas", name: "Sistema de citas", icon: CalendarTick },
	{ id: "plataforma", name: "Plataforma", icon: InfoCircle },
];

const FAQS: Faq[] = [
	{
		id: "calc1",
		category: "calculadoras",
		question: "¿Qué tipo de cálculos puedo realizar en la plataforma?",
		answer:
			"La plataforma permite realizar diferentes tipos de cálculos legales, principalmente en tres categorías: 1) Cálculos laborales (indemnizaciones, liquidaciones finales, despidos), 2) Cálculos de intereses (con diferentes tasas bancarias y períodos), y 3) Cálculos civiles (próximamente). Todos los cálculos pueden guardarse, compartirse y vincularse a carpetas específicas.",
	},
	{
		id: "calc2",
		category: "calculadoras",
		question: "¿Cómo puedo vincular un cálculo a una carpeta existente?",
		answer:
			'Al generar un cálculo, encontrarás la opción "Vincular a carpeta" en la pantalla de resultados. Al hacer clic, se desplegará una lista de tus carpetas disponibles para seleccionar. También puedes vincular cálculos posteriormente desde la sección "Mis cálculos guardados" utilizando el menú de opciones de cada registro.',
	},
	{
		id: "calc3",
		category: "calculadoras",
		question: "¿Puedo exportar o compartir los resultados de mis cálculos?",
		answer:
			"Sí, todos los cálculos pueden exportarse en diferentes formatos (PDF, Excel) o compartirse directamente por email. Estas opciones están disponibles en la pantalla de resultados y también en la vista detallada de cada cálculo guardado. Los PDFs generados incluyen detalles sobre los parámetros utilizados y el desglose completo del cálculo.",
	},
	{
		id: "calc4",
		category: "calculadoras",
		question: "¿Cómo puedo actualizar un cálculo que ya realicé anteriormente?",
		answer:
			'Para actualizar un cálculo existente, ve a la sección "Mis cálculos guardados", localiza el cálculo que deseas actualizar y haz clic en el botón "Editar" o "Recalcular". Esto te permitirá modificar los parámetros originales o actualizar las fechas de corte para intereses. Los cálculos originales se mantienen y se crea una versión actualizada, permitiéndote comparar ambos resultados.',
	},
	{
		id: "carp1",
		category: "carpetas",
		question: "¿Cómo puedo organizar mis causas/casos en carpetas?",
		answer:
			'Puedes crear y gestionar carpetas desde la sección "Carpetas". Cada carpeta puede contener información del cliente, datos del caso, cálculos vinculados, notas y fechas importantes. Para crear una nueva carpeta, haz clic en el botón "Nueva carpeta" y completa la información básica requerida. Luego podrás agregar más contenido y organizarlo según tus necesidades.',
	},
	{
		id: "carp2",
		category: "carpetas",
		question: "¿Puedo vincular diferentes tipos de documentos a una carpeta?",
		answer:
			"Sí, las carpetas están diseñadas para almacenar y organizar todo tipo de información relacionada con un caso. Puedes vincular cálculos, contactos, eventos del calendario, notas y documentos. Esta estructura centralizada te permite acceder rápidamente a toda la información relevante desde un solo lugar.",
	},
	{
		id: "carp3",
		category: "carpetas",
		question: "¿Es posible compartir información de carpetas con colaboradores?",
		answer:
			"Sí, puedes compartir carpetas específicas con otros usuarios de la plataforma, estableciendo diferentes niveles de permisos (lectura, edición o administración). Esta funcionalidad es ideal para trabajar en equipo o cuando necesitas que un colega consulte información específica de un caso.",
	},
	{
		id: "cont1",
		category: "contactos",
		question: "¿Qué información puedo registrar sobre mis contactos?",
		answer:
			"El sistema te permite almacenar información completa de tus contactos, incluyendo datos personales, información de contacto, categorías personalizadas y notas. Además, puedes vincular contactos a carpetas específicas con diferentes roles (cliente, contraparte, testigo, etc.) para mantener un registro organizado de todas las personas relacionadas con cada caso.",
	},
	{
		id: "cont2",
		category: "contactos",
		question: "¿Puedo categorizar mis contactos para organizarlos mejor?",
		answer:
			"Sí, el sistema te permite crear categorías personalizadas para clasificar tus contactos. Estas categorías son completamente flexibles, por lo que puedes adaptarlas a tus necesidades específicas. Además, puedes asignar múltiples categorías a un mismo contacto, lo que facilita las búsquedas y la organización.",
	},
	{
		id: "cal1",
		category: "calendario",
		question: "¿Cómo funciona el sistema de calendario?",
		answer:
			"El calendario te permite organizar tus eventos legales, audiencias, vencimientos y reuniones en diferentes vistas (día, semana, mes). Puedes vincular eventos a carpetas específicas, configurar recordatorios y compartir eventos con otros usuarios si fuera necesario.",
	},
	{
		id: "cal2",
		category: "calendario",
		question: "¿Es posible programar recordatorios para fechas importantes?",
		answer:
			"Sí, puedes programar recordatorios para cualquier evento en el calendario. Estos recordatorios pueden enviarse por email, notificaciones en la plataforma o notificaciones push (si has habilitado esta opción). Puedes configurar el tiempo de anticipación para cada recordatorio según tus preferencias.",
	},
	{
		id: "cal3",
		category: "calendario",
		question: "¿Puedo vincular eventos del calendario a carpetas específicas?",
		answer:
			"Sí, cada evento puede vincularse a una o más carpetas, lo que permite mantener una organización clara de todos los eventos relacionados con un caso específico. Esto facilita el seguimiento cronológico de un caso y te permite visualizar rápidamente todas las fechas importantes desde la vista de la carpeta.",
	},
	{
		id: "cit1",
		category: "citas",
		question: "¿Cómo configuro el sistema de citas para mis clientes?",
		answer:
			'Para configurar el sistema de citas, accede a "Aplicaciones" → "Calendario" → "Reservaciones". Desde allí podrás definir tu disponibilidad, duración de las citas, tiempos de descanso entre consultas y obtener un enlace personalizado que puedes compartir con tus clientes para que agenden consultas directamente en tu calendario.',
	},
	{
		id: "cit2",
		category: "citas",
		question: "¿Puedo personalizar qué información solicito a mis clientes al agendar una cita?",
		answer:
			"Sí, el sistema te permite personalizar completamente el formulario que tus clientes completarán al agendar una cita. Puedes añadir campos personalizados como texto, opciones, casillas de verificación y campos numéricos para recopilar exactamente la información que necesitas para la consulta.",
	},
	{
		id: "cit3",
		category: "citas",
		question: "¿Cómo se integra el sistema de citas con mi calendario?",
		answer:
			"Todas las citas confirmadas se añaden automáticamente a tu calendario principal, evitando conflictos de horarios con otros eventos. Podrás ver tus citas junto con el resto de tus eventos, lo que te permitirá tener una visión completa de tu agenda en un solo lugar.",
	},
	{
		id: "cit4",
		category: "citas",
		question: "¿Recibiré notificaciones cuando alguien agende una cita?",
		answer:
			"Sí, el sistema envía notificaciones automáticas cuando un cliente agenda una cita, cuando se aproxima la fecha de una cita y si un cliente cancela su cita. Puedes configurar cómo y cuándo recibir estas notificaciones desde la sección de configuración.",
	},
	{
		id: "cit5",
		category: "citas",
		question: "¿Puedo establecer diferentes tipos de citas con duraciones distintas?",
		answer:
			"Sí, puedes crear múltiples configuraciones de disponibilidad para diferentes tipos de consultas. Por ejemplo, puedes configurar una disponibilidad para consultas iniciales de 30 minutos y otra para seguimientos de 15 minutos, cada una con su propio enlace de reserva y formulario personalizado.",
	},
	{
		id: "plat1",
		category: "plataforma",
		question: "¿La información almacenada en la plataforma es segura?",
		answer:
			"Sí, toda la información se almacena de forma segura. Utilizamos encriptación de datos, accesos protegidos y servidores seguros. Los datos sensibles como información de clientes y detalles de casos permanecen privados y solo accesibles por usuarios autorizados. Además, realizamos copias de seguridad periódicas para garantizar que no se pierda información.",
	},
	{
		id: "plat2",
		category: "plataforma",
		question: "¿Puedo usar la plataforma en dispositivos móviles?",
		answer:
			"Sí, la plataforma está diseñada con un enfoque responsive que se adapta a diferentes tamaños de pantalla. Puedes acceder a todas las funciones desde tablets y smartphones, aunque para cálculos complejos o gestión extensiva de carpetas, recomendamos usar un equipo de escritorio para mayor comodidad de visualización.",
	},
	{
		id: "plat3",
		category: "plataforma",
		question: "¿Qué debo hacer si encuentro un error en alguna funcionalidad?",
		answer:
			'Si detectas algún error o inconsistencia en la plataforma, puedes contactar con soporte técnico a través del formulario en la sección "Contacto" o enviando un email a soporte@lawanalytics.com.ar. Por favor, incluye detalles específicos sobre el problema encontrado para que podamos resolverlo lo antes posible.',
	},
	{
		id: "plat4",
		category: "plataforma",
		question: "¿La plataforma recibe actualizaciones regularmente?",
		answer:
			"Sí, realizamos actualizaciones periódicas para mejorar las funcionalidades existentes, incorporar nuevas características y optimizar el rendimiento general. Siempre comunicamos las actualizaciones importantes a través de notificaciones en la plataforma y correos electrónicos informativos.",
	},
];

// ==============================|| FAQ PAGE ||============================== //

const FaqPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Preguntas Frecuentes" }];

	const handleExpandFaq = (faqId: string) => {
		setExpandedFaq(expandedFaq === faqId ? null : faqId);
	};

	const handleCategoryClick = (categoryId: string | null) => {
		setActiveCategory(categoryId === activeCategory ? null : categoryId);
	};

	const filteredFaqs = activeCategory ? FAQS.filter((faq) => faq.category === activeCategory) : FAQS;

	return (
		<Box
			component="section"
			sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 6, md: 10 }, position: "relative", overflow: "hidden", minHeight: "100vh" }}
		>
			<PageBackground variant="light" />

			{/* Spotlight atmospheric brand-blue */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: "30%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: { xs: 520, md: 880 },
					height: { xs: 520, md: 880 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.06)} 0%, ${alpha(
						BRAND_BLUE,
						isDark ? 0.04 : 0.02,
					)} 40%, transparent 70%)`,
					filter: "blur(70px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			<Container sx={{ position: "relative", zIndex: 1 }}>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<CustomBreadcrumbs items={breadcrumbItems} />
						<Box
							sx={{
								position: "relative",
								mt: { xs: 2, md: 3 },
								mb: { xs: 4, md: 6 },
								pb: { xs: 3, md: 4 },
								borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
							}}
						>
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
										mb: 1.5,
										color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
									}}
								>
									Preguntas frecuentes
								</Typography>
								<Typography
									sx={{
										fontSize: { xs: "1rem", md: "1.125rem" },
										color: theme.palette.text.secondary,
										maxWidth: 640,
										letterSpacing: "-0.005em",
										lineHeight: 1.5,
										textWrap: "pretty",
									}}
								>
									Respuestas a las dudas más comunes sobre la plataforma.
								</Typography>
							</motion.div>
						</Box>
					</Grid>

					<Grid item xs={12}>
						<MainCard>
							{/* Filtros de categoría — monocromos */}
							<Box sx={{ mb: 4 }}>
								<Typography
									sx={{
										fontSize: "0.72rem",
										fontWeight: 600,
										letterSpacing: "0.12em",
										textTransform: "uppercase",
										color: theme.palette.text.secondary,
										mb: 1.5,
									}}
								>
									Filtrar por categoría
								</Typography>
								<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
									<Chip
										label="Todas"
										icon={<MessageQuestion size={16} />}
										clickable
										onClick={() => handleCategoryClick(null)}
										sx={{
											fontSize: "0.82rem",
											fontWeight: activeCategory === null ? 600 : 500,
											letterSpacing: "0.01em",
											height: 30,
											bgcolor: activeCategory === null ? alpha(BRAND_BLUE, 0.12) : "transparent",
											color: activeCategory === null ? BRAND_BLUE : theme.palette.text.primary,
											border: `1px solid ${activeCategory === null ? alpha(BRAND_BLUE, 0.35) : alpha(theme.palette.divider, 0.5)}`,
											"& .MuiChip-icon": {
												color: activeCategory === null ? BRAND_BLUE : theme.palette.text.secondary,
												ml: 1,
											},
											"&:hover": {
												bgcolor: activeCategory === null ? alpha(BRAND_BLUE, 0.16) : alpha(BRAND_BLUE, 0.06),
												borderColor: alpha(BRAND_BLUE, 0.35),
											},
										}}
									/>
									{CATEGORIES.map((category) => {
										const Icon = category.icon;
										const active = activeCategory === category.id;
										return (
											<Chip
												key={category.id}
												label={category.name}
												icon={<Icon size={16} />}
												clickable
												onClick={() => handleCategoryClick(category.id)}
												sx={{
													fontSize: "0.82rem",
													fontWeight: active ? 600 : 500,
													letterSpacing: "0.01em",
													height: 30,
													bgcolor: active ? alpha(BRAND_BLUE, 0.12) : "transparent",
													color: active ? BRAND_BLUE : theme.palette.text.primary,
													border: `1px solid ${active ? alpha(BRAND_BLUE, 0.35) : alpha(theme.palette.divider, 0.5)}`,
													"& .MuiChip-icon": {
														color: active ? BRAND_BLUE : theme.palette.text.secondary,
														ml: 1,
													},
													"&:hover": {
														bgcolor: active ? alpha(BRAND_BLUE, 0.16) : alpha(BRAND_BLUE, 0.06),
														borderColor: alpha(BRAND_BLUE, 0.35),
													},
												}}
											/>
										);
									})}
								</Box>
							</Box>

							{/* Lista de FAQs */}
							<Stack spacing={1.5}>
								{filteredFaqs.map((faq, idx) => {
									const expanded = expandedFaq === faq.id;
									return (
										<motion.div
											key={faq.id}
											initial={{ opacity: 0, y: 12 }}
											whileInView={{ opacity: 1, y: 0 }}
											viewport={{ once: true, margin: "-40px" }}
											transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.4) }}
										>
											<Card
												elevation={0}
												sx={{
													borderRadius: 1.5,
													border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
													borderLeft: `3px solid ${expanded ? BRAND_BLUE : "transparent"}`,
													transition: "all 0.25s ease",
													bgcolor: expanded ? alpha(BRAND_BLUE, isDark ? 0.04 : 0.02) : "transparent",
													"&:hover": {
														borderColor: alpha(BRAND_BLUE, 0.35),
														borderLeftColor: expanded ? BRAND_BLUE : alpha(BRAND_BLUE, 0.35),
													},
												}}
											>
												<CardActionArea onClick={() => handleExpandFaq(faq.id)} sx={{ borderRadius: "inherit" }}>
													<CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
														<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
															<Typography
																sx={{
																	fontSize: "1rem",
																	fontWeight: 500,
																	letterSpacing: "-0.01em",
																	lineHeight: 1.4,
																	color: expanded ? BRAND_BLUE : theme.palette.text.primary,
																	transition: "color 0.25s ease",
																}}
															>
																{faq.question}
															</Typography>
															<Box
																sx={{
																	flexShrink: 0,
																	display: "flex",
																	transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
																	transition: "transform 0.3s ease",
																	color: expanded ? BRAND_BLUE : theme.palette.text.secondary,
																}}
															>
																<ArrowRight2 size={18} />
															</Box>
														</Box>
													</CardContent>
												</CardActionArea>
												<Collapse in={expanded} timeout="auto" unmountOnExit>
													<Box
														sx={{
															px: 2.5,
															pb: 2.5,
															pt: 0,
															borderTop: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
														}}
													>
														<Typography
															sx={{
																fontSize: "0.92rem",
																lineHeight: 1.65,
																color: theme.palette.text.primary,
																maxWidth: "70ch",
																mt: 2,
															}}
														>
															{faq.answer}
														</Typography>
													</Box>
												</Collapse>
											</Card>
										</motion.div>
									);
								})}

								{filteredFaqs.length === 0 && (
									<Paper
										variant="outlined"
										sx={{
											p: 4,
											textAlign: "center",
											borderRadius: 1.5,
											borderColor: alpha(theme.palette.divider, 0.6),
											bgcolor: "transparent",
										}}
									>
										<MessageQuestion size={36} color={theme.palette.text.secondary} style={{ marginBottom: 12 }} />
										<Typography
											sx={{
												fontSize: "1rem",
												fontWeight: 600,
												letterSpacing: "-0.01em",
												color: theme.palette.text.primary,
												mb: 0.5,
											}}
										>
											No hay preguntas en esta categoría
										</Typography>
										<Typography sx={{ fontSize: "0.88rem", color: theme.palette.text.secondary }}>
											Probá con otra categoría o mostrá todas las preguntas.
										</Typography>
									</Paper>
								)}
							</Stack>
						</MainCard>
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default FaqPage;
