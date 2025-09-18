import React from "react";
import { useState, useRef } from "react";
import { Grid, Box, Typography, Card, CardContent, CardActionArea, Button, Collapse, Divider, Paper, Chip } from "@mui/material";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MainCard from "components/MainCard";
import {
	LaboralContent,
	InteresesContent,
	FoldersContent,
	ContactsContent,
	CalendarContent,
	TasksContent,
	AnalyticsContent,
} from "components/guides/GuideContent";
import { BookingContent } from "components/guides";
import { useTheme } from "@mui/material/styles";

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
} from "iconsax-react";

// ==============================|| COMPONENTES DE AYUDA ||============================== //

// Sección de Guías
const GuidesSection = () => {
	const theme = useTheme();
	const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

	// Create refs for guide cards
	const laboralCardRef = useRef<HTMLDivElement>(null);
	const interesesCardRef = useRef<HTMLDivElement>(null);
	const carpetasCardRef = useRef<HTMLDivElement>(null);
	const contactosCardRef = useRef<HTMLDivElement>(null);
	const calendarioCardRef = useRef<HTMLDivElement>(null);
	const citasCardRef = useRef<HTMLDivElement>(null);
	const tareasCardRef = useRef<HTMLDivElement>(null);
	const analyticsCardRef = useRef<HTMLDivElement>(null);

	// Create refs for expanded content
	const laboralContentRef = useRef<HTMLDivElement>(null);
	const interesesContentRef = useRef<HTMLDivElement>(null);
	const carpetasContentRef = useRef<HTMLDivElement>(null);
	const contactosContentRef = useRef<HTMLDivElement>(null);
	const calendarioContentRef = useRef<HTMLDivElement>(null);
	const citasContentRef = useRef<HTMLDivElement>(null);
	const tareasContentRef = useRef<HTMLDivElement>(null);
	const analyticsContentRef = useRef<HTMLDivElement>(null);

	const handleExpandGuide = (guideName: string) => {
		if (expandedGuide === guideName) {
			setExpandedGuide(null);
		} else {
			setExpandedGuide(guideName);

			// Wait for the collapse animation to start before scrolling
			setTimeout(() => {
				// Get the appropriate content ref based on the guide name
				let contentRef = null;
				switch (guideName) {
					case "laboral":
						contentRef = laboralContentRef;
						break;
					case "intereses":
						contentRef = interesesContentRef;
						break;
					case "carpetas":
						contentRef = carpetasContentRef;
						break;
					case "contactos":
						contentRef = contactosContentRef;
						break;
					case "calendario":
						contentRef = calendarioContentRef;
						break;
					case "citas":
						contentRef = citasContentRef;
						break;
					case "tareas":
						contentRef = tareasContentRef;
						break;
					case "analytics":
						contentRef = analyticsContentRef;
						break;
					default:
						break;
				}

				// Scroll to the expanded content with offset to keep title visible
				if (contentRef && contentRef.current) {
					const elementRect = contentRef.current.getBoundingClientRect();
					const absoluteElementTop = elementRect.top + window.pageYOffset;
					const offset = 150; // 150px offset to make title visible
					window.scrollTo({
						top: absoluteElementTop - offset,
						behavior: "smooth",
					});
				}
			}, 300); // Small delay to allow the collapse animation to expand
		}
	};

	return (
		<Box sx={{ mb: 6 }}>
			<Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
				<Book1 variant="Bulk" size={28} style={{ marginRight: 12, color: theme.palette.primary.main }} />
				<Typography variant="h3">Guías de Uso</Typography>
			</Box>

			<Typography paragraph color="textSecondary">
				Estas guías te ayudarán a entender cómo utilizar las principales funciones de la aplicación.
			</Typography>

			<Grid container spacing={4} sx={{ mt: 1 }}>
				{/* Guía Laboral */}
				<Grid item xs={12} sm={6} md={4} lg={4}>
					<Card
						ref={laboralCardRef}
						sx={{
							height: "100%",
							display: "flex",
							flexDirection: "column",
							transition: "all 0.2s",
							borderRadius: 2,
							"&:hover": {
								boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
								transform: "translateY(-4px)",
							},
						}}
					>
						<CardActionArea
							onClick={() => handleExpandGuide("laboral")}
							sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
						>
							<CardContent
								sx={{
									textAlign: "center",
									pb: 3,
									px: 4,
									height: "100%",
									minHeight: 280,
									display: "flex",
									flexDirection: "column",
									justifyContent: "space-between",
								}}
							>
								<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
									<Calculator
										variant="Bulk"
										size={62}
										style={{
											color: theme.palette.primary.main,
											marginBottom: 28,
											marginTop: 12,
										}}
									/>
								</Box>
								<Typography variant="h4" gutterBottom>
									Calculadora Laboral
								</Typography>
								<Typography variant="body2" color="textSecondary" sx={{ minHeight: 60 }}>
									Aprende a utilizar todas las funciones de la calculadora laboral para indemnizaciones y liquidaciones.
								</Typography>
								<Button variant="outlined" size="small" endIcon={<ArrowRight2 />} sx={{ mt: 3 }}>
									{expandedGuide === "laboral" ? "Cerrar guía" : "Ver guía"}
								</Button>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>

				{/* Guía Intereses */}
				<Grid item xs={12} sm={6} md={4} lg={4}>
					<Card
						ref={interesesCardRef}
						sx={{
							height: "100%",
							display: "flex",
							flexDirection: "column",
							transition: "all 0.2s",
							borderRadius: 2,
							"&:hover": {
								boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
								transform: "translateY(-4px)",
							},
						}}
					>
						<CardActionArea
							onClick={() => handleExpandGuide("intereses")}
							sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
						>
							<CardContent
								sx={{
									textAlign: "center",
									pb: 3,
									px: 4,
									height: "100%",
									minHeight: 280,
									display: "flex",
									flexDirection: "column",
									justifyContent: "space-between",
								}}
							>
								<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
									<Coin
										variant="Bulk"
										size={62}
										style={{
											color: theme.palette.success.main,
											marginBottom: 28,
											marginTop: 12,
										}}
									/>
								</Box>
								<Typography variant="h4" gutterBottom>
									Calculadora de Intereses
								</Typography>
								<Typography variant="body2" color="textSecondary" sx={{ minHeight: 60 }}>
									Aprende a calcular intereses con diferentes tasas y a actualizar montos históricos.
								</Typography>
								<Button variant="outlined" size="small" endIcon={<ArrowRight2 />} sx={{ mt: 3 }}>
									{expandedGuide === "intereses" ? "Cerrar guía" : "Ver guía"}
								</Button>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>

				{/* Guía Carpetas */}
				<Grid item xs={12} sm={6} md={4} lg={4}>
					<Card
						ref={carpetasCardRef}
						sx={{
							height: "100%",
							display: "flex",
							flexDirection: "column",
							transition: "all 0.2s",
							borderRadius: 2,
							"&:hover": {
								boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
								transform: "translateY(-4px)",
							},
						}}
					>
						<CardActionArea
							onClick={() => handleExpandGuide("carpetas")}
							sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
						>
							<CardContent
								sx={{
									textAlign: "center",
									pb: 3,
									px: 4,
									height: "100%",
									minHeight: 280,
									display: "flex",
									flexDirection: "column",
									justifyContent: "space-between",
								}}
							>
								<Folder
									variant="Bulk"
									size={62}
									style={{
										color: theme.palette.warning.main,
										marginBottom: 28,
										marginTop: 12,
									}}
								/>
								<Typography variant="h4" gutterBottom>
									Sistema de Causas
								</Typography>
								<Typography variant="body2" color="textSecondary" sx={{ minHeight: 60 }}>
									Aprende a organizar tus casos y a vincular información relevante en el sistema de causas.
								</Typography>
								<Button variant="outlined" size="small" endIcon={<ArrowRight2 />} sx={{ mt: 3 }}>
									{expandedGuide === "carpetas" ? "Cerrar guía" : "Ver guía"}
								</Button>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>

				{/* Guía Contactos */}
				<Grid item xs={12} sm={6} md={4} lg={4}>
					<Card
						ref={contactosCardRef}
						sx={{
							height: "100%",
							display: "flex",
							flexDirection: "column",
							transition: "all 0.2s",
							borderRadius: 2,
							"&:hover": {
								boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
								transform: "translateY(-4px)",
							},
						}}
					>
						<CardActionArea
							onClick={() => handleExpandGuide("contactos")}
							sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
						>
							<CardContent
								sx={{
									textAlign: "center",
									pb: 3,
									px: 4,
									height: "100%",
									minHeight: 280,
									display: "flex",
									flexDirection: "column",
									justifyContent: "space-between",
								}}
							>
								<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
									<Profile2User
										variant="Bulk"
										size={62}
										style={{
											color: theme.palette.info.main,
											marginBottom: 28,
											marginTop: 12,
										}}
									/>
								</Box>
								<Typography variant="h4" gutterBottom>
									Sistema de Contactos
								</Typography>
								<Typography variant="body2" color="textSecondary" sx={{ minHeight: 60 }}>
									Aprende a gestionar contactos, categorizarlos y vincularlos a carpetas de casos legales.
								</Typography>
								<Button variant="outlined" size="small" endIcon={<ArrowRight2 />} sx={{ mt: 3 }}>
									{expandedGuide === "contactos" ? "Cerrar guía" : "Ver guía"}
								</Button>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>

				{/* Guía Calendario */}
				<Grid item xs={12} sm={6} md={4} lg={4}>
					<Card
						ref={calendarioCardRef}
						sx={{
							height: "100%",
							display: "flex",
							flexDirection: "column",
							transition: "all 0.2s",
							borderRadius: 2,
							"&:hover": {
								boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
								transform: "translateY(-4px)",
							},
						}}
					>
						<CardActionArea
							onClick={() => handleExpandGuide("calendario")}
							sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
						>
							<CardContent
								sx={{
									textAlign: "center",
									pb: 3,
									px: 4,
									height: "100%",
									minHeight: 280,
									display: "flex",
									flexDirection: "column",
									justifyContent: "space-between",
								}}
							>
								<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
									<Calendar
										variant="Bulk"
										size={62}
										style={{
											color: theme.palette.secondary.main,
											marginBottom: 28,
											marginTop: 12,
										}}
									/>
								</Box>
								<Typography variant="h4" gutterBottom>
									Calendario
								</Typography>
								<Typography variant="body2" color="textSecondary" sx={{ minHeight: 60 }}>
									Aprende a gestionar tu agenda, eventos judiciales y recibir recordatorios de fechas importantes.
								</Typography>
								<Button variant="outlined" size="small" endIcon={<ArrowRight2 />} sx={{ mt: 3 }}>
									{expandedGuide === "calendario" ? "Cerrar guía" : "Ver guía"}
								</Button>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>

				{/* Guía Sistema de Citas */}
				<Grid item xs={12} sm={6} md={4} lg={4}>
					<Card
						ref={citasCardRef}
						sx={{
							height: "100%",
							display: "flex",
							flexDirection: "column",
							transition: "all 0.2s",
							borderRadius: 2,
							"&:hover": {
								boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
								transform: "translateY(-4px)",
							},
						}}
					>
						<CardActionArea
							onClick={() => handleExpandGuide("citas")}
							sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
						>
							<CardContent
								sx={{
									textAlign: "center",
									pb: 3,
									px: 4,
									height: "100%",
									minHeight: 280,
									display: "flex",
									flexDirection: "column",
									justifyContent: "space-between",
								}}
							>
								<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
									<CalendarTick
										variant="Bulk"
										size={62}
										style={{
											color: theme.palette.error.main,
											marginBottom: 28,
											marginTop: 12,
										}}
									/>
								</Box>
								<Typography variant="h4" gutterBottom>
									Sistema de Citas
								</Typography>
								<Typography variant="body2" color="textSecondary" sx={{ minHeight: 60 }}>
									Aprende a configurar y gestionar el sistema de citas online para tus clientes.
								</Typography>
								<Button variant="outlined" size="small" endIcon={<ArrowRight2 />} sx={{ mt: 3 }}>
									{expandedGuide === "citas" ? "Cerrar guía" : "Ver guía"}
								</Button>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>

				{/* Guía Tareas */}
				<Grid item xs={12} sm={6} md={4} lg={4}>
					<Card
						ref={tareasCardRef}
						sx={{
							height: "100%",
							display: "flex",
							flexDirection: "column",
							transition: "all 0.2s",
							borderRadius: 2,
							"&:hover": {
								boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
								transform: "translateY(-4px)",
							},
						}}
					>
						<CardActionArea sx={{ height: "100%" }} onClick={() => handleExpandGuide("tareas")}>
							<CardContent
								sx={{
									textAlign: "center",
									pb: 3,
									px: 4,
									height: "100%",
									minHeight: 280,
									display: "flex",
									flexDirection: "column",
									justifyContent: "space-between",
								}}
							>
								<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
									<Task
										variant="Bulk"
										size={62}
										style={{
											color: theme.palette.primary.main,
											marginBottom: 28,
											marginTop: 12,
										}}
									/>
								</Box>
								<Typography variant="h4" gutterBottom>
									Gestión de Tareas
								</Typography>
								<Typography variant="body2" color="textSecondary" sx={{ minHeight: 60 }}>
									Aprende a crear, organizar y gestionar tus tareas de manera eficiente.
								</Typography>
								<Button variant="outlined" size="small" endIcon={<ArrowRight2 />} sx={{ mt: 3 }}>
									{expandedGuide === "tareas" ? "Cerrar guía" : "Ver guía"}
								</Button>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>

				{/* Guía Analíticas */}
				<Grid item xs={12} sm={6} md={4} lg={4}>
					<Card
						ref={analyticsCardRef}
						sx={{
							height: "100%",
							display: "flex",
							flexDirection: "column",
							transition: "all 0.2s",
							borderRadius: 2,
							"&:hover": {
								boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
								transform: "translateY(-4px)",
							},
						}}
					>
						<CardActionArea sx={{ height: "100%" }} onClick={() => handleExpandGuide("analytics")}>
							<CardContent
								sx={{
									textAlign: "center",
									pb: 3,
									px: 4,
									height: "100%",
									minHeight: 280,
									display: "flex",
									flexDirection: "column",
									justifyContent: "space-between",
								}}
							>
								<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
									<Chart21
										variant="Bulk"
										size={62}
										style={{
											color: theme.palette.info.main,
											marginBottom: 28,
											marginTop: 12,
										}}
									/>
								</Box>
								<Typography variant="h4" gutterBottom>
									Panel de Analíticas
								</Typography>
								<Typography variant="body2" color="textSecondary" sx={{ minHeight: 60 }}>
									Aprende a utilizar el panel de analíticas para visualizar métricas y reportes.
								</Typography>
								<Button variant="outlined" size="small" endIcon={<ArrowRight2 />} sx={{ mt: 3 }}>
									{expandedGuide === "analytics" ? "Cerrar guía" : "Ver guía"}
								</Button>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>
			</Grid>

			{/* Contenidos expandidos de las guías */}
			<Collapse in={expandedGuide === "laboral"} timeout="auto" unmountOnExit ref={laboralContentRef}>
				<Paper
					elevation={3}
					sx={{
						mt: 3,
						mb: 2,
						p: 2,
						borderTop: `3px solid ${theme.palette.primary.main}`,
					}}
				>
					<LaboralContent />
				</Paper>
			</Collapse>

			<Collapse in={expandedGuide === "intereses"} timeout="auto" unmountOnExit ref={interesesContentRef}>
				<Paper
					elevation={3}
					sx={{
						mt: 3,
						mb: 2,
						p: 2,
						borderTop: `3px solid ${theme.palette.success.main}`,
					}}
				>
					<InteresesContent />
				</Paper>
			</Collapse>

			<Collapse in={expandedGuide === "carpetas"} timeout="auto" unmountOnExit ref={carpetasContentRef}>
				<Paper
					elevation={3}
					sx={{
						mt: 3,
						mb: 2,
						p: 2,
						borderTop: `3px solid ${theme.palette.warning.main}`,
					}}
				>
					<FoldersContent />
				</Paper>
			</Collapse>

			<Collapse in={expandedGuide === "contactos"} timeout="auto" unmountOnExit ref={contactosContentRef}>
				<Paper
					elevation={3}
					sx={{
						mt: 3,
						mb: 2,
						p: 2,
						borderTop: `3px solid ${theme.palette.info.main}`,
					}}
				>
					<ContactsContent />
				</Paper>
			</Collapse>

			<Collapse in={expandedGuide === "calendario"} timeout="auto" unmountOnExit ref={calendarioContentRef}>
				<Paper
					elevation={3}
					sx={{
						mt: 3,
						mb: 2,
						p: 2,
						borderTop: `3px solid ${theme.palette.secondary.main}`,
					}}
				>
					<CalendarContent />
				</Paper>
			</Collapse>

			{/* Contenido de Guía de Citas */}
			<Collapse in={expandedGuide === "citas"} timeout="auto" unmountOnExit ref={citasContentRef}>
				<Paper
					elevation={3}
					sx={{
						mt: 3,
						mb: 2,
						p: 2,
						borderTop: `3px solid ${theme.palette.error.main}`,
					}}
				>
					<BookingContent />
				</Paper>
			</Collapse>

			<Collapse in={expandedGuide === "tareas"} timeout="auto" unmountOnExit ref={tareasContentRef}>
				<Paper
					elevation={3}
					sx={{
						mt: 3,
						mb: 2,
						p: 2,
						borderTop: `3px solid ${theme.palette.primary.main}`,
					}}
				>
					<TasksContent />
				</Paper>
			</Collapse>

			<Collapse in={expandedGuide === "analytics"} timeout="auto" unmountOnExit ref={analyticsContentRef}>
				<Paper
					elevation={3}
					sx={{
						mt: 3,
						mb: 2,
						p: 2,
						borderTop: `3px solid ${theme.palette.info.main}`,
					}}
				>
					<AnalyticsContent />
				</Paper>
			</Collapse>
		</Box>
	);
};

// Sección de FAQs
const FAQSection = () => {
	const theme = useTheme();
	const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
		<Box sx={{ mb: 6 }}>
			<Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
				<MessageQuestion variant="Bulk" size={28} style={{ marginRight: 12, color: theme.palette.info.main }} />
				<Typography variant="h3">Preguntas Frecuentes</Typography>
			</Box>

			<Typography paragraph color="textSecondary">
				Encuentra respuestas a las preguntas más comunes sobre la plataforma.
			</Typography>

			{/* Selector de categorías */}
			<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
				<Chip
					label="Todas"
					color={activeCategory === null ? "primary" : "default"}
					onClick={() => handleCategoryClick(null)}
					sx={{ fontWeight: activeCategory === null ? "bold" : "normal" }}
				/>
				{categories.map((category) => (
					<Chip
						key={category.id}
						label={category.name}
						icon={category.icon}
						clickable
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

			{/* Lista de FAQs */}
			{filteredFaqs.map((faq) => {
				const category = categories.find((c) => c.id === faq.category);
				const categoryColor = category?.color || theme.palette.info.main;

				return (
					<Card
						key={faq.id}
						sx={{
							mb: 2,
							boxShadow: expandedFaq === faq.id ? "0 4px 20px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.05)",
							transition: "all 0.2s",
							borderLeft: expandedFaq === faq.id ? `4px solid ${categoryColor}` : "none",
						}}
					>
						<CardActionArea onClick={() => handleExpandFaq(faq.id)}>
							<CardContent sx={{ p: 2 }}>
								<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
									pb: 2,
									px: 2,
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
				);
			})}

			{filteredFaqs.length === 0 && (
				<Box sx={{ textAlign: "center", py: 4 }}>
					<Typography variant="body1" color="textSecondary">
						No se encontraron preguntas en esta categoría.
					</Typography>
				</Box>
			)}
		</Box>
	);
};

// Sección de Recursos (para demostrar la estructura extensible)
const ResourcesSection = () => {
	const theme = useTheme();

	return (
		<Box sx={{ mb: 6 }}>
			<Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
				<DocumentText variant="Bulk" size={28} style={{ marginRight: 12, color: theme.palette.secondary.main }} />
				<Typography variant="h3">Recursos Adicionales</Typography>
			</Box>

			<Typography paragraph color="textSecondary">
				Material complementario para sacar el máximo provecho de la plataforma.
			</Typography>

			<Card sx={{ mb: 2 }}>
				<CardContent>
					<Typography variant="h5" gutterBottom>
						Próximamente
					</Typography>
					<Typography variant="body2" color="textSecondary">
						Estamos preparando una biblioteca de recursos adicionales para ti.
					</Typography>
				</CardContent>
			</Card>
		</Box>
	);
};

// Componente principal de la página de Ayuda
const HelpPage = () => {
	const theme = useTheme();

	// Secciones disponibles
	const sections = [
		{ id: "guides", name: "Guías de Uso", icon: <Book1 size={20} /> },
		{ id: "faq", name: "Preguntas Frecuentes", icon: <MessageQuestion size={20} /> },
		{ id: "resources", name: "Recursos", icon: <DocumentText size={20} /> },
	];

	// Estado para sección activa (inicialmente muestra todas)
	const [activeSection, setActiveSection] = useState<string | null>(null);

	const handleSectionClick = (sectionId: string) => {
		setActiveSection(activeSection === sectionId ? null : sectionId);
	};

	// Determinamos qué secciones mostrar
	const showGuides = activeSection === null || activeSection === "guides";
	const showFAQ = activeSection === null || activeSection === "faq";
	const showResources = activeSection === null || activeSection === "resources";

	return (
		<MainCard title="Centro de Ayuda">
			<Grid container spacing={4}>
				{/* Menú lateral */}
				<Grid item xs={12} md={3}>
					<Paper sx={{ p: 2, mb: { xs: 3, md: 0 } }}>
						<Typography variant="h4" sx={{ mb: 2 }}>
							Secciones
						</Typography>
						<List component="nav">
							<ListItemButton
								onClick={() => setActiveSection(null)}
								selected={activeSection === null}
								sx={{
									borderRadius: 1,
									mb: 1,
									bgcolor: activeSection === null ? theme.palette.primary.lighter : "inherit",
								}}
							>
								<ListItemIcon>
									<InfoCircle size={20} />
								</ListItemIcon>
								<ListItemText primary="Todas las secciones" />
							</ListItemButton>

							<Divider sx={{ my: 1.5 }} />

							{sections.map((section) => (
								<ListItemButton
									key={section.id}
									onClick={() => handleSectionClick(section.id)}
									selected={activeSection === section.id}
									sx={{
										borderRadius: 1,
										mb: 1,
										bgcolor: activeSection === section.id ? theme.palette.primary.lighter : "inherit",
									}}
								>
									<ListItemIcon>{section.icon}</ListItemIcon>
									<ListItemText primary={section.name} />
								</ListItemButton>
							))}
						</List>
					</Paper>
				</Grid>

				{/* Contenido principal */}
				<Grid item xs={12} md={9}>
					{showGuides && <GuidesSection />}
					{showFAQ && <FAQSection />}
					{showResources && <ResourcesSection />}
				</Grid>
			</Grid>
		</MainCard>
	);
};

export default HelpPage;
