import React from "react";
import { useState, useRef, useEffect } from "react";
import {
	Box,
	Button,
	Collapse,
	FormControl,
	Grid,
	MenuItem,
	Select,
	Skeleton,
	Stack,
	Typography,
	useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
	LaboralContent,
	InteresesContent,
	FoldersContent,
	ContactsContent,
	CalendarContent,
	TasksContent,
	AnalyticsContent,
} from "components/guides/GuideContent";
import { LimitsContent } from "components/guides/LimitsContent";
import { BookingContent, TeamsContent } from "components/guides";

// Icons
import {
	Book1,
	ArrowRight2,
	Folder,
	Calculator,
	Coin,
	DocumentText,
	InfoCircle,
	MessageQuestion,
	Profile2User,
	Calendar,
	CalendarTick,
	Task,
	Chart21,
	Cloud,
	People,
	Sms,
	Notification,
} from "iconsax-react";

import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// ==============================|| HELPERS BRAND ||============================== //

const SectionHeader = ({ eyebrow, title, subtitle, icon }: { eyebrow: string; title: string; subtitle?: string; icon: React.ReactNode }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
			<Box
				sx={{
					width: 40,
					height: 40,
					borderRadius: 1.25,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
					color: BRAND_BLUE,
					flexShrink: 0,
				}}
			>
				{icon}
			</Box>
			<Stack spacing={0.125}>
				<Stack direction="row" spacing={0.625} alignItems="center">
					<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
					<Typography
						sx={{
							fontSize: "0.62rem",
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "text.secondary",
						}}
					>
						{eyebrow}
					</Typography>
				</Stack>
				<Typography sx={{ fontSize: "1.15rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>{title}</Typography>
				{subtitle && (
					<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
						{subtitle}
					</Typography>
				)}
			</Stack>
		</Stack>
	);
};

// ==============================|| GUIDES ||============================== //

const GUIDE_LIST = [
	{ id: "laboral", title: "Calculadora laboral", description: "Indemnizaciones, liquidaciones y despidos paso a paso.", icon: Calculator },
	{ id: "intereses", title: "Calculadora de intereses", description: "Calculá intereses con distintas tasas y actualizá montos históricos.", icon: Coin },
	{ id: "carpetas", title: "Sistema de causas", description: "Organizá tus casos y vinculá información relevante.", icon: Folder },
	{ id: "contactos", title: "Sistema de contactos", description: "Gestioná, categorizá y vinculá contactos a tus carpetas.", icon: Profile2User },
	{ id: "calendario", title: "Calendario", description: "Agenda, eventos judiciales y recordatorios automáticos.", icon: Calendar },
	{ id: "citas", title: "Sistema de citas", description: "Configurá la agenda online para tus clientes.", icon: CalendarTick },
	{ id: "tareas", title: "Gestión de tareas", description: "Creá, organizá y dale seguimiento a las tareas del estudio.", icon: Task },
	{ id: "analytics", title: "Panel de analíticas", description: "Métricas, reportes y visualizaciones del trabajo.", icon: Chart21 },
	{ id: "limits", title: "Límites y almacenamiento", description: "Conocé los límites de tu plan y optimizá el uso.", icon: Cloud },
	{ id: "teams", title: "Equipos", description: "Creá equipos, invitá colaboradores y trabajá en conjunto.", icon: People },
] as const;

const GUIDE_CONTENT_MAP: Record<string, React.ComponentType> = {
	laboral: LaboralContent,
	intereses: InteresesContent,
	carpetas: FoldersContent,
	contactos: ContactsContent,
	calendario: CalendarContent,
	citas: BookingContent,
	tareas: TasksContent,
	analytics: AnalyticsContent,
	limits: LimitsContent,
	teams: TeamsContent,
};

const GuidesSection = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
	const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

	const handleExpandGuide = (guideId: string) => {
		if (expandedGuide === guideId) {
			setExpandedGuide(null);
		} else {
			setExpandedGuide(guideId);
			setTimeout(() => {
				const el = contentRefs.current[guideId];
				if (el) {
					const elementRect = el.getBoundingClientRect();
					const absoluteElementTop = elementRect.top + window.pageYOffset;
					window.scrollTo({ top: absoluteElementTop - 150, behavior: "smooth" });
				}
			}, 300);
		}
	};

	return (
		<Box sx={{ mb: 5 }}>
			<SectionHeader
				eyebrow="Guías"
				title="Guías de uso"
				subtitle="Aprendé a usar las principales funciones de la plataforma."
				icon={<Book1 size={20} variant="Bulk" />}
			/>

			<Grid container spacing={2}>
				{GUIDE_LIST.map((guide) => {
					const Icon = guide.icon;
					const isExpanded = expandedGuide === guide.id;
					return (
						<Grid item xs={12} sm={6} md={4} key={guide.id}>
							<Box
								role="button"
								tabIndex={0}
								onClick={() => handleExpandGuide(guide.id)}
								onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleExpandGuide(guide.id)}
								sx={{
									height: "100%",
									display: "flex",
									flexDirection: "column",
									p: 2,
									cursor: "pointer",
									borderRadius: 1.5,
									bgcolor: "background.paper",
									border: `1px solid ${
										isExpanded ? alpha(BRAND_BLUE, 0.55) : alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)
									}`,
									transition: "border-color 0.15s ease, transform 0.15s ease, background-color 0.15s ease",
									"&:hover": {
										borderColor: alpha(BRAND_BLUE, isExpanded ? 0.65 : 0.32),
										bgcolor: isExpanded ? alpha(BRAND_BLUE, isDark ? 0.08 : 0.04) : alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
										transform: "translateY(-1px)",
									},
									"&:focus-visible": {
										outline: "none",
										boxShadow: `0 0 0 2px ${alpha(BRAND_BLUE, 0.35)}`,
									},
								}}
							>
								<Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
									<Box
										sx={{
											width: 40,
											height: 40,
											borderRadius: 1.25,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
											color: BRAND_BLUE,
											flexShrink: 0,
										}}
									>
										<Icon size={20} variant="Bulk" />
									</Box>
									<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
										<Typography
											sx={{
												fontSize: "0.95rem",
												fontWeight: 600,
												letterSpacing: "-0.01em",
												color: "text.primary",
												textWrap: "balance",
												lineHeight: 1.25,
											}}
										>
											{guide.title}
										</Typography>
									</Stack>
								</Stack>

								<Typography
									sx={{
										fontSize: "0.8rem",
										color: "text.secondary",
										letterSpacing: "-0.005em",
										textWrap: "pretty",
										flex: 1,
									}}
								>
									{guide.description}
								</Typography>

								<Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.5 }}>
									<Typography
										sx={{
											fontSize: "0.72rem",
											fontWeight: 600,
											letterSpacing: "0.04em",
											textTransform: "uppercase",
											color: isExpanded ? BRAND_BLUE : "text.secondary",
											transition: "color 0.15s ease",
										}}
									>
										{isExpanded ? "Cerrar guía" : "Ver guía"}
									</Typography>
									<ArrowRight2
										size={12}
										variant="Linear"
										style={{
											color: isExpanded ? BRAND_BLUE : theme.palette.text.secondary,
											transition: "transform 0.2s ease, color 0.15s ease",
											transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
										}}
									/>
								</Stack>
							</Box>
						</Grid>
					);
				})}
			</Grid>

			{/* Contenidos expandidos */}
			{GUIDE_LIST.map((guide) => {
				const Content = GUIDE_CONTENT_MAP[guide.id];
				if (!Content) return null;
				return (
					<Collapse
						key={guide.id}
						in={expandedGuide === guide.id}
						timeout="auto"
						unmountOnExit
						ref={(el: HTMLDivElement | null) => (contentRefs.current[guide.id] = el)}
					>
						<Box
							sx={{
								mt: 2,
								mb: 1,
								p: 2.5,
								borderRadius: 1.5,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
								borderTop: `3px solid ${BRAND_BLUE}`,
							}}
						>
							<Content />
						</Box>
					</Collapse>
				);
			})}
		</Box>
	);
};

// ==============================|| FAQ ||============================== //

const FAQ_CATEGORIES = [
	{ id: "calculadoras", name: "Calculadoras", icon: Calculator },
	{ id: "carpetas", name: "Gestión de causas", icon: Folder },
	{ id: "contactos", name: "Contactos", icon: Profile2User },
	{ id: "calendario", name: "Calendario", icon: Calendar },
	{ id: "citas", name: "Sistema de citas", icon: CalendarTick },
	{ id: "plataforma", name: "Plataforma", icon: InfoCircle },
] as const;

const ALL_FAQS = [
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
			'Si detectas algún error o inconsistencia en la plataforma, puedes contactar con soporte técnico a través del formulario en la sección "Contacto" o enviando un email a soporte@lawanalytics.app. Por favor, incluye detalles específicos sobre el problema encontrado para que podamos resolverlo lo antes posible.',
	},
	{
		id: "plat4",
		category: "plataforma",
		question: "¿La plataforma recibe actualizaciones regularmente?",
		answer:
			"Sí, realizamos actualizaciones periódicas para mejorar las funcionalidades existentes, incorporar nuevas características y optimizar el rendimiento general. Siempre comunicamos las actualizaciones importantes a través de notificaciones en la plataforma y correos electrónicos informativos.",
	},
] as const;

const FAQSection = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const handleExpandFaq = (faqId: string) => setExpandedFaq(expandedFaq === faqId ? null : faqId);
	const handleCategoryClick = (categoryId: string | null) => setActiveCategory(categoryId === activeCategory ? null : categoryId);

	const filteredFaqs = activeCategory ? ALL_FAQS.filter((faq) => faq.category === activeCategory) : ALL_FAQS;

	const CategoryPill = ({ id, name, icon: Icon, active }: { id: string | null; name: string; icon?: any; active: boolean }) => (
		<Box
			role="button"
			tabIndex={0}
			onClick={() => handleCategoryClick(id)}
			onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleCategoryClick(id)}
			sx={{
				display: "inline-flex",
				alignItems: "center",
				gap: 0.625,
				px: 1,
				py: 0.5,
				borderRadius: 0.875,
				cursor: "pointer",
				bgcolor: active ? alpha(BRAND_BLUE, isDark ? 0.16 : 0.08) : "transparent",
				border: `1px solid ${active ? alpha(BRAND_BLUE, 0.4) : alpha(BRAND_BLUE, isDark ? 0.14 : 0.1)}`,
				color: active ? BRAND_BLUE : "text.secondary",
				transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
				"&:hover": {
					color: BRAND_BLUE,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
					borderColor: alpha(BRAND_BLUE, 0.3),
				},
				"&:focus-visible": {
					outline: "none",
					boxShadow: `0 0 0 2px ${alpha(BRAND_BLUE, 0.35)}`,
				},
			}}
		>
			{Icon && <Icon size={13} variant={active ? "Bulk" : "Linear"} />}
			<Typography
				sx={{
					fontSize: "0.72rem",
					fontWeight: 600,
					letterSpacing: "-0.005em",
					lineHeight: 1.4,
					color: "inherit",
				}}
			>
				{name}
			</Typography>
		</Box>
	);

	return (
		<Box sx={{ mb: 5 }}>
			<SectionHeader
				eyebrow="Soporte"
				title="Preguntas frecuentes"
				subtitle="Respuestas a las dudas más comunes sobre la plataforma."
				icon={<MessageQuestion size={20} variant="Bulk" />}
			/>

			{/* Filtros por categoría */}
			<Stack direction="row" flexWrap="wrap" useFlexGap rowGap={0.75} columnGap={0.75} sx={{ mb: 2 }}>
				<CategoryPill id={null} name="Todas" active={activeCategory === null} />
				{FAQ_CATEGORIES.map((cat) => (
					<CategoryPill key={cat.id} id={cat.id} name={cat.name} icon={cat.icon} active={activeCategory === cat.id} />
				))}
			</Stack>

			{/* Lista de FAQs */}
			<Stack spacing={1}>
				{filteredFaqs.map((faq) => {
					const isExpanded = expandedFaq === faq.id;
					return (
						<Box
							key={faq.id}
							sx={{
								borderRadius: 1.25,
								bgcolor: "background.paper",
								border: `1px solid ${isExpanded ? alpha(BRAND_BLUE, 0.4) : alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
								overflow: "hidden",
								transition: "border-color 0.15s ease",
							}}
						>
							<Box
								role="button"
								tabIndex={0}
								onClick={() => handleExpandFaq(faq.id)}
								onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleExpandFaq(faq.id)}
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									px: 1.75,
									py: 1.5,
									cursor: "pointer",
									transition: "background-color 0.15s ease",
									"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03) },
									"&:focus-visible": {
										outline: "none",
										boxShadow: `inset 0 0 0 2px ${alpha(BRAND_BLUE, 0.35)}`,
									},
								}}
							>
								<Typography
									sx={{
										flex: 1,
										fontSize: "0.88rem",
										fontWeight: 600,
										letterSpacing: "-0.005em",
										color: isExpanded ? BRAND_BLUE : "text.primary",
										textWrap: "pretty",
										transition: "color 0.15s ease",
									}}
								>
									{faq.question}
								</Typography>
								<ArrowRight2
									size={14}
									variant="Linear"
									style={{
										color: isExpanded ? BRAND_BLUE : theme.palette.text.secondary,
										transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
										transition: "transform 0.2s ease, color 0.15s ease",
										flexShrink: 0,
									}}
								/>
							</Box>
							<Collapse in={isExpanded} timeout="auto" unmountOnExit>
								<Box
									sx={{
										px: 1.75,
										py: 1.5,
										borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
									}}
								>
									<Typography sx={{ fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
										{faq.answer}
									</Typography>
								</Box>
							</Collapse>
						</Box>
					);
				})}
			</Stack>

			{filteredFaqs.length === 0 && (
				<Box sx={{ textAlign: "center", py: 4 }}>
					<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
						No se encontraron preguntas en esta categoría.
					</Typography>
				</Box>
			)}
		</Box>
	);
};

// ==============================|| RESOURCES ||============================== //

const ResourcesSection = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.16)}`,
		px: 1.5,
		py: 0.5,
		fontSize: "0.78rem",
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.32),
		},
	};

	return (
		<Box sx={{ mb: 4 }}>
			<SectionHeader
				eyebrow="Recursos"
				title="Recursos adicionales"
				subtitle="Canales para obtener ayuda y estar al tanto de las novedades."
				icon={<DocumentText size={20} variant="Bulk" />}
			/>

			<Grid container spacing={2}>
				<Grid item xs={12} sm={6}>
					<Box
						sx={{
							height: "100%",
							p: 2,
							borderRadius: 1.5,
							bgcolor: "background.paper",
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
						}}
					>
						<Stack spacing={1.25}>
							<Stack direction="row" alignItems="center" spacing={1.25}>
								<Box
									sx={{
										width: 36,
										height: 36,
										borderRadius: 1,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
										color: BRAND_BLUE,
										flexShrink: 0,
									}}
								>
									<Sms size={18} variant="Bulk" />
								</Box>
								<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
									Soporte técnico
								</Typography>
							</Stack>
							<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
								¿Encontraste un problema o necesitás asistencia? Contactanos directamente por email.
							</Typography>
							<Box>
								<Button href="mailto:soporte@lawanalytics.app" component="a" size="small" sx={ghostBtnSx}>
									soporte@lawanalytics.app
								</Button>
							</Box>
						</Stack>
					</Box>
				</Grid>

				<Grid item xs={12} sm={6}>
					<Box
						sx={{
							height: "100%",
							p: 2,
							borderRadius: 1.5,
							bgcolor: "background.paper",
							border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.18 : 0.12)}`,
						}}
					>
						<Stack spacing={1.25}>
							<Stack direction="row" alignItems="center" spacing={1.25}>
								<Box
									sx={{
										width: 36,
										height: 36,
										borderRadius: 1,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: alpha(LIVE_GREEN, isDark ? 0.16 : 0.08),
										border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.28 : 0.18)}`,
										color: LIVE_GREEN,
										flexShrink: 0,
									}}
								>
									<Notification size={18} variant="Bulk" />
								</Box>
								<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
									Novedades
								</Typography>
							</Stack>
							<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
								Seguí las actualizaciones y nuevas funcionalidades a través de las notificaciones en la plataforma.
							</Typography>
							<Box
								sx={{
									display: "inline-flex",
									alignSelf: "flex-start",
									alignItems: "center",
									gap: 0.625,
									px: 0.875,
									py: 0.25,
									borderRadius: 0.75,
									bgcolor: alpha(LIVE_GREEN, isDark ? 0.16 : 0.1),
									border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.32 : 0.22)}`,
								}}
							>
								<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: LIVE_GREEN }} />
								<Typography sx={{ fontSize: "0.66rem", fontWeight: 600, color: LIVE_GREEN, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>
									Notificaciones activas
								</Typography>
							</Box>
						</Stack>
					</Box>
				</Grid>
			</Grid>
		</Box>
	);
};

// ==============================|| HELP PAGE ||============================== //

const HelpPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [isLoading, setIsLoading] = useState(true);

	const sections = [
		{ id: "guides", name: "Guías de uso", icon: Book1 },
		{ id: "faq", name: "Preguntas frecuentes", icon: MessageQuestion },
		{ id: "resources", name: "Recursos", icon: DocumentText },
	];

	const [activeSection, setActiveSection] = useState<string | null>(null);

	useEffect(() => {
		const timer = setTimeout(() => setIsLoading(false), 300);
		return () => clearTimeout(timer);
	}, []);

	const handleSectionClick = (sectionId: string | null) => {
		setActiveSection(sectionId === activeSection ? null : sectionId);
	};

	const showGuides = activeSection === null || activeSection === "guides";
	const showFAQ = activeSection === null || activeSection === "faq";
	const showResources = activeSection === null || activeSection === "resources";

	const navItem = ({
		id,
		label,
		icon: Icon,
	}: {
		id: string | null;
		label: string;
		icon: any;
	}) => {
		const isSelected = activeSection === id;
		return (
			<Box
				key={id ?? "all"}
				role="button"
				tabIndex={0}
				onClick={() => setActiveSection(id)}
				onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActiveSection(id)}
				sx={{
					position: "relative",
					display: "flex",
					alignItems: "center",
					gap: 1.25,
					p: 1.25,
					borderRadius: 1.25,
					cursor: "pointer",
					bgcolor: isSelected ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.07) : "transparent",
					border: `1px solid ${isSelected ? alpha(BRAND_BLUE, isDark ? 0.36 : 0.24) : "transparent"}`,
					transition: "background-color 0.15s ease, border-color 0.15s ease",
					"&:hover": {
						bgcolor: isSelected ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.09) : alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
						borderColor: isSelected ? alpha(BRAND_BLUE, 0.5) : alpha(BRAND_BLUE, isDark ? 0.2 : 0.14),
					},
					"&:focus-visible": {
						outline: "none",
						boxShadow: `0 0 0 2px ${alpha(BRAND_BLUE, 0.35)}`,
					},
				}}
			>
				{isSelected && (
					<Box
						sx={{
							position: "absolute",
							left: -1,
							top: "50%",
							transform: "translateY(-50%)",
							width: 3,
							height: 20,
							borderRadius: "0 2px 2px 0",
							bgcolor: BRAND_BLUE,
						}}
					/>
				)}
				<Box
					sx={{
						width: 30,
						height: 30,
						borderRadius: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: isSelected ? alpha(BRAND_BLUE, isDark ? 0.2 : 0.12) : alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
						border: `1px solid ${isSelected ? alpha(BRAND_BLUE, isDark ? 0.36 : 0.24) : alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
						color: isSelected ? BRAND_BLUE : "text.secondary",
						flexShrink: 0,
						transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
					}}
				>
					<Icon size={14} variant={isSelected ? "Bulk" : "Linear"} />
				</Box>
				<Typography
					sx={{
						fontSize: "0.85rem",
						fontWeight: 600,
						letterSpacing: "-0.005em",
						color: "text.primary",
						flex: 1,
						minWidth: 0,
					}}
				>
					{label}
				</Typography>
				{isSelected && (
					<ArrowRight2 size={14} variant="Linear" style={{ color: BRAND_BLUE, flexShrink: 0 }} />
				)}
			</Box>
		);
	};

	// Loading skeleton brand
	if (isLoading) {
		return (
			<Stack spacing={2.5} sx={{ mt: 1 }}>
				{/* Header skeleton */}
				<Box
					sx={{
						borderRadius: 2,
						p: { xs: 2, md: 2.5 },
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
					}}
				>
					<Stack direction="row" alignItems="center" spacing={1.5}>
						<Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: 1.25 }} />
						<Stack spacing={0.5}>
							<Skeleton variant="text" width={120} height={14} />
							<Skeleton variant="text" width={240} height={22} />
							<Skeleton variant="text" width={300} height={14} />
						</Stack>
					</Stack>
				</Box>

				<Grid container spacing={2.5}>
					<Grid item xs={12} md={3}>
						<Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
							<Stack spacing={0.75}>
								{[1, 2, 3, 4].map((i) => (
									<Stack key={i} direction="row" alignItems="center" spacing={1.25}>
										<Skeleton variant="rounded" width={30} height={30} sx={{ borderRadius: 1 }} />
										<Skeleton variant="text" sx={{ flex: 1 }} height={16} />
									</Stack>
								))}
							</Stack>
						</Box>
					</Grid>
					<Grid item xs={12} md={9}>
						<Grid container spacing={2}>
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<Grid item xs={12} sm={6} md={4} key={i}>
									<Box sx={{ p: 2, borderRadius: 1.5, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}` }}>
										<Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
											<Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: 1.25 }} />
											<Skeleton variant="text" sx={{ flex: 1 }} height={20} />
										</Stack>
										<Skeleton variant="text" height={14} />
										<Skeleton variant="text" width="80%" height={14} />
									</Box>
								</Grid>
							))}
						</Grid>
					</Grid>
				</Grid>
			</Stack>
		);
	}

	return (
		<Stack spacing={2.5} sx={{ mt: 1 }}>
			{/* Header brand atmosférico */}
			<Box
				sx={{
					position: "relative",
					overflow: "hidden",
					borderRadius: 2,
					p: { xs: 2, md: 2.5 },
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
				}}
			>
				<Box
					sx={{
						position: "absolute",
						top: -60,
						right: -40,
						width: 280,
						height: 280,
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
						pointerEvents: "none",
					}}
				/>
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						backgroundImage: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)} 1px, transparent 1px)`,
						backgroundSize: "22px 22px",
						maskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
						WebkitMaskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
						opacity: 0.6,
						pointerEvents: "none",
					}}
				/>
				<Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: "relative" }}>
					<Box
						sx={{
							width: 44,
							height: 44,
							borderRadius: 1.5,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
							flexShrink: 0,
						}}
					>
						<Book1 size={22} variant="Bulk" />
					</Box>
					<Stack spacing={0.25} sx={{ minWidth: 0 }}>
						<Stack direction="row" spacing={0.875} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
							<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
							<Typography
								sx={{
									fontSize: "0.62rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								Centro de ayuda
							</Typography>
						</Stack>
						<Typography
							sx={{
								fontSize: { xs: "1.05rem", md: "1.25rem" },
								fontWeight: 600,
								letterSpacing: "-0.015em",
								color: "text.primary",
								textWrap: "balance",
							}}
						>
							¿En qué te podemos ayudar?
						</Typography>
						<Typography
							sx={{
								display: { xs: "none", md: "block" },
								fontSize: "0.82rem",
								color: "text.secondary",
								letterSpacing: "-0.005em",
								textWrap: "pretty",
							}}
						>
							Guías paso a paso, respuestas a preguntas frecuentes y canales de contacto.
						</Typography>
					</Stack>
				</Stack>
			</Box>

			<Grid container spacing={2.5}>
				{/* Sidebar navegación */}
				<Grid item xs={12} md={3}>
					{isMobile ? (
						<Box sx={{ position: "sticky", top: 64, zIndex: 10, bgcolor: "background.paper", py: 0.5 }}>
							<FormControl fullWidth size="small">
								<Select
									value={activeSection ?? "all"}
									onChange={(e) => setActiveSection(e.target.value === "all" ? null : e.target.value)}
									displayEmpty
									sx={{
										borderRadius: 1.25,
										fontSize: "0.875rem",
										"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
										"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
										"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
									}}
								>
									<MenuItem value="all">Todas las secciones</MenuItem>
									{sections.map((section) => (
										<MenuItem key={section.id} value={section.id}>
											{section.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Box>
					) : (
						<Box
							sx={{
								p: 1.25,
								borderRadius: 2,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
								bgcolor: "background.paper",
								position: "sticky",
								top: 80,
							}}
						>
							<Typography
								sx={{
									fontSize: "0.6rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
									px: 1,
									py: 0.75,
								}}
							>
								Secciones
							</Typography>
							<Stack spacing={0.5}>
								{navItem({ id: null, label: "Todas", icon: InfoCircle })}
								<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.06), my: 0.5 }} />
								{sections.map((section) =>
									navItem({ id: section.id, label: section.name, icon: section.icon }),
								)}
							</Stack>
						</Box>
					)}
				</Grid>

				{/* Contenido principal */}
				<Grid item xs={12} md={9}>
					{showGuides && <GuidesSection />}
					{showFAQ && <FAQSection />}
					{showResources && <ResourcesSection />}
				</Grid>
			</Grid>
		</Stack>
	);
};

export default HelpPage;
