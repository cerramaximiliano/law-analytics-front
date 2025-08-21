import React from "react";
import { useState } from "react";
import { Box, Typography, Card, CardContent, CardActionArea, Collapse, Paper, Chip, Grid, Container } from "@mui/material";
import MainCard from "components/MainCard";
import PageBackground from "components/PageBackground";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import { useTheme, alpha } from "@mui/material/styles";
import { motion } from "framer-motion";

// Icons
import { ArrowRight2, Calculator, Calendar, CalendarTick, Folder, InfoCircle, MessageQuestion, Profile2User } from "iconsax-react";

// ==============================|| FAQ PAGE ||============================== //

const FaqPage = () => {
	const theme = useTheme();
	const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	// breadcrumb items
	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Preguntas Frecuentes" }];

	const handleExpandFaq = (faqId: string) => {
		if (expandedFaq === faqId) {
			setExpandedFaq(null);
		} else {
			setExpandedFaq(faqId);
		}
	};

	const handleCategoryClick = (categoryId: string | null) => {
		setActiveCategory(categoryId === activeCategory ? null : categoryId);
	};

	// Categorías de FAQs
	const categories = [
		{
			id: "calculadoras",
			name: "Calculadoras",
			icon: <Calculator size={20} style={{ color: theme.palette.primary.main }} />,
			color: theme.palette.primary.main,
		},
		{
			id: "carpetas",
			name: "Gestión de Casos",
			icon: <Folder size={20} style={{ color: theme.palette.warning.main }} />,
			color: theme.palette.warning.main,
		},
		{
			id: "contactos",
			name: "Contactos",
			icon: <Profile2User size={20} style={{ color: theme.palette.info.main }} />,
			color: theme.palette.info.main,
		},
		{
			id: "calendario",
			name: "Calendario",
			icon: <Calendar size={20} style={{ color: theme.palette.secondary.main }} />,
			color: theme.palette.secondary.main,
		},
		{
			id: "citas",
			name: "Sistema de Citas",
			icon: <CalendarTick size={20} style={{ color: theme.palette.error.main }} />,
			color: theme.palette.error.main,
		},
		{
			id: "plataforma",
			name: "Plataforma",
			icon: <InfoCircle size={20} style={{ color: theme.palette.success.main }} />,
			color: theme.palette.success.main,
		},
	];

	// Lista de FAQs
	const allFaqs = [
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

	// Filtrar las FAQs basado en la categoría seleccionada
	const filteredFaqs = activeCategory ? allFaqs.filter((faq) => faq.category === activeCategory) : allFaqs;

	return (
		<Box
			component="section"
			sx={{ pt: { xs: 10, md: 15 }, pb: { xs: 5, md: 10 }, position: "relative", overflow: "hidden", minHeight: "100vh" }}
		>
			<PageBackground variant="light" />
			<Container>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<CustomBreadcrumbs items={breadcrumbItems} />
						<Box
							sx={{
								position: "relative",
								mb: 6,
								pb: 4,
								borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
							}}
						>
							<motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.5 }}>
								<Typography variant="h1" sx={{ mb: 1 }}>
									Preguntas Frecuentes
								</Typography>
								<Typography variant="body1" color="text.secondary">
									Encuentra respuestas a las preguntas más comunes sobre nuestra plataforma
								</Typography>
							</motion.div>
						</Box>
					</Grid>

					<Grid item xs={12}>
						<MainCard>
							{/* Categorías */}
							<Box sx={{ mb: 4 }}>
								<Typography variant="h5" gutterBottom>
									Selecciona una categoría
								</Typography>
								<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
									<Chip
										label="Todas"
										color={activeCategory === null ? "primary" : "default"}
										onClick={() => handleCategoryClick(null)}
										size="medium"
										icon={<MessageQuestion size={18} />}
										sx={{ fontWeight: activeCategory === null ? "bold" : "normal" }}
									/>
									{categories.map((category) => (
										<Chip
											key={category.id}
											label={category.name}
											icon={category.icon}
											clickable
											size="medium"
											onClick={() => handleCategoryClick(category.id)}
											sx={{
												backgroundColor: activeCategory === category.id ? `${category.color}20` : "default",
												color: activeCategory === category.id ? category.color : "inherit",
												fontWeight: activeCategory === category.id ? "bold" : "normal",
												"&:hover": {
													backgroundColor: `${category.color}15`,
												},
											}}
										/>
									))}
								</Box>
							</Box>

							{/* Lista de FAQs */}
							<Grid container spacing={3}>
								{filteredFaqs.map((faq) => {
									const category = categories.find((c) => c.id === faq.category);
									const categoryColor = category?.color || theme.palette.info.main;

									return (
										<Grid item xs={12} key={faq.id}>
											<Card
												key={faq.id}
												sx={{
													boxShadow: expandedFaq === faq.id ? "0 4px 20px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.05)",
													transition: "all 0.2s",
													borderLeft: expandedFaq === faq.id ? `4px solid ${categoryColor}` : "none",
												}}
											>
												<CardActionArea onClick={() => handleExpandFaq(faq.id)}>
													<CardContent sx={{ p: 3 }}>
														<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
															<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
																{category?.icon && (
																	<Box color={categoryColor} sx={{ display: { xs: "none", sm: "block" } }}>
																		{category.icon}
																	</Box>
																)}
																<Typography variant="h5" color={expandedFaq === faq.id ? categoryColor : "inherit"}>
																	{faq.question}
																</Typography>
															</Box>
															<ArrowRight2
																size={20}
																style={{
																	transform: expandedFaq === faq.id ? "rotate(90deg)" : "rotate(0deg)",
																	transition: "transform 0.3s",
																	color: theme.palette.text.secondary,
																}}
															/>
														</Box>
													</CardContent>
												</CardActionArea>
												<Collapse in={expandedFaq === faq.id} timeout="auto" unmountOnExit>
													<CardContent
														sx={{
															pt: 0,
															pb: 3,
															px: 3,
															borderTop: `1px solid ${theme.palette.divider}`,
															bgcolor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
														}}
													>
														<Typography paragraph sx={{ mt: 2 }}>
															{faq.answer}
														</Typography>
													</CardContent>
												</Collapse>
											</Card>
										</Grid>
									);
								})}

								{filteredFaqs.length === 0 && (
									<Grid item xs={12}>
										<Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
											<MessageQuestion size={40} style={{ color: theme.palette.text.secondary, marginBottom: 16 }} />
											<Typography variant="h5" color="textSecondary" gutterBottom>
												No se encontraron preguntas en esta categoría
											</Typography>
											<Typography color="textSecondary">
												Por favor, selecciona otra categoría o consulta todas las preguntas disponibles
											</Typography>
										</Paper>
									</Grid>
								)}
							</Grid>
						</MainCard>
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default FaqPage;
