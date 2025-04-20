import { useState } from "react";
import { Grid, Box, Typography, Card, CardContent, CardActionArea, Button, Collapse, Divider, Paper } from "@mui/material";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MainCard from "components/MainCard";
import { LaboralContent, InteresesContent, FoldersContent, ContactsContent } from "components/guides/GuideContent";
import { useTheme } from "@mui/material/styles";

// Icons
import { Book1, ArrowRight2, Folder, Calculator, Coin, DocumentText, InfoCircle, MessageQuestion, Profile2User } from "iconsax-react";

// ==============================|| COMPONENTES DE AYUDA ||============================== //

// Sección de Guías
const GuidesSection = () => {
	const theme = useTheme();
	const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

	const handleExpandGuide = (guideName: string) => {
		if (expandedGuide === guideName) {
			setExpandedGuide(null);
		} else {
			setExpandedGuide(guideName);
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

			<Grid container spacing={3} sx={{ mt: 1 }}>
				{/* Guía Laboral */}
				<Grid item xs={12} md={3}>
					<Card
						sx={{
							height: "100%",
							transition: "all 0.2s",
							"&:hover": {
								boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
							},
						}}
					>
						<CardActionArea onClick={() => handleExpandGuide("laboral")}>
							<CardContent sx={{ textAlign: "center", pb: 3 }}>
								<Calculator
									variant="Bulk"
									size={48}
									style={{
										color: theme.palette.primary.main,
										marginBottom: 16,
									}}
								/>
								<Typography variant="h4" gutterBottom>
									Calculadora Laboral
								</Typography>
								<Typography variant="body2" color="textSecondary">
									Aprende a utilizar todas las funciones de la calculadora laboral para indemnizaciones y liquidaciones.
								</Typography>
								<Button variant="outlined" size="small" endIcon={<ArrowRight2 />} sx={{ mt: 2 }}>
									{expandedGuide === "laboral" ? "Cerrar guía" : "Ver guía"}
								</Button>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>

				{/* Guía Intereses */}
				<Grid item xs={12} md={3}>
					<Card
						sx={{
							height: "100%",
							transition: "all 0.2s",
							"&:hover": {
								boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
							},
						}}
					>
						<CardActionArea onClick={() => handleExpandGuide("intereses")}>
							<CardContent sx={{ textAlign: "center", pb: 3 }}>
								<Coin
									variant="Bulk"
									size={48}
									style={{
										color: theme.palette.success.main,
										marginBottom: 16,
									}}
								/>
								<Typography variant="h4" gutterBottom>
									Calculadora de Intereses
								</Typography>
								<Typography variant="body2" color="textSecondary">
									Aprende a calcular intereses con diferentes tasas y a actualizar montos históricos.
								</Typography>
								<Button variant="outlined" size="small" endIcon={<ArrowRight2 />} sx={{ mt: 2 }}>
									{expandedGuide === "intereses" ? "Cerrar guía" : "Ver guía"}
								</Button>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>

				{/* Guía Carpetas */}
				<Grid item xs={12} md={3}>
					<Card
						sx={{
							height: "100%",
							transition: "all 0.2s",
							"&:hover": {
								boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
							},
						}}
					>
						<CardActionArea onClick={() => handleExpandGuide("carpetas")}>
							<CardContent sx={{ textAlign: "center", pb: 3 }}>
								<Folder
									variant="Bulk"
									size={48}
									style={{
										color: theme.palette.warning.main,
										marginBottom: 16,
									}}
								/>
								<Typography variant="h4" gutterBottom>
									Sistema de Carpetas
								</Typography>
								<Typography variant="body2" color="textSecondary">
									Aprende a organizar tus casos y a vincular información relevante en el sistema de carpetas.
								</Typography>
								<Button variant="outlined" size="small" endIcon={<ArrowRight2 />} sx={{ mt: 2 }}>
									{expandedGuide === "carpetas" ? "Cerrar guía" : "Ver guía"}
								</Button>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>

				{/* Guía Contactos */}
				<Grid item xs={12} md={3}>
					<Card
						sx={{
							height: "100%",
							transition: "all 0.2s",
							"&:hover": {
								boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
							},
						}}
					>
						<CardActionArea onClick={() => handleExpandGuide("contactos")}>
							<CardContent sx={{ textAlign: "center", pb: 3 }}>
								<Profile2User
									variant="Bulk"
									size={48}
									style={{
										color: theme.palette.info.main,
										marginBottom: 16,
									}}
								/>
								<Typography variant="h4" gutterBottom>
									Sistema de Contactos
								</Typography>
								<Typography variant="body2" color="textSecondary">
									Aprende a gestionar contactos, categorizarlos y vincularlos a carpetas de casos legales.
								</Typography>
								<Button variant="outlined" size="small" endIcon={<ArrowRight2 />} sx={{ mt: 2 }}>
									{expandedGuide === "contactos" ? "Cerrar guía" : "Ver guía"}
								</Button>
							</CardContent>
						</CardActionArea>
					</Card>
				</Grid>
			</Grid>

			{/* Contenidos expandidos de las guías */}
			<Collapse in={expandedGuide === "laboral"} timeout="auto" unmountOnExit>
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

			<Collapse in={expandedGuide === "intereses"} timeout="auto" unmountOnExit>
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

			<Collapse in={expandedGuide === "carpetas"} timeout="auto" unmountOnExit>
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

			<Collapse in={expandedGuide === "contactos"} timeout="auto" unmountOnExit>
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
		</Box>
	);
};

// Sección de FAQs
const FAQSection = () => {
	const theme = useTheme();
	const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

	const handleExpandFaq = (index: number) => {
		if (expandedFaq === index) {
			setExpandedFaq(null);
		} else {
			setExpandedFaq(index);
		}
	};

	// Lista de FAQs
	const faqs = [
		{
			question: "¿Qué tipo de cálculos puedo realizar en la plataforma?",
			answer:
				"La plataforma permite realizar diferentes tipos de cálculos legales, principalmente en tres categorías: 1) Cálculos laborales (indemnizaciones, liquidaciones finales, despidos), 2) Cálculos de intereses (con diferentes tasas bancarias y períodos), y 3) Cálculos civiles (próximamente). Todos los cálculos pueden guardarse, compartirse y vincularse a carpetas específicas.",
		},
		{
			question: "¿Cómo puedo vincular un cálculo a una carpeta existente?",
			answer:
				'Al generar un cálculo, encontrarás la opción "Vincular a carpeta" en la pantalla de resultados. Al hacer clic, se desplegará una lista de tus carpetas disponibles para seleccionar. También puedes vincular cálculos posteriormente desde la sección "Mis cálculos guardados" utilizando el menú de opciones de cada registro.',
		},
		{
			question: "¿Puedo exportar o compartir los resultados de mis cálculos?",
			answer:
				"Sí, todos los cálculos pueden exportarse en diferentes formatos (PDF, Excel) o compartirse directamente por email. Estas opciones están disponibles en la pantalla de resultados y también en la vista detallada de cada cálculo guardado. Los PDFs generados incluyen detalles sobre los parámetros utilizados y el desglose completo del cálculo.",
		},
		{
			question: "¿Cómo puedo organizar mis causas/casos en carpetas?",
			answer:
				'Puedes crear y gestionar carpetas desde la sección "Carpetas". Cada carpeta puede contener información del cliente, datos del caso, cálculos vinculados, notas y fechas importantes. Para crear una nueva carpeta, haz clic en el botón "Nueva carpeta" y completa la información básica requerida. Luego podrás agregar más contenido y organizarlo según tus necesidades.',
		},
		{
			question: "¿La información almacenada en la plataforma es segura?",
			answer:
				"Sí, toda la información se almacena de forma segura. Utilizamos encriptación de datos, accesos protegidos y servidores seguros. Los datos sensibles como información de clientes y detalles de casos permanecen privados y solo accesibles por usuarios autorizados. Además, realizamos copias de seguridad periódicas para garantizar que no se pierda información.",
		},
		{
			question: "¿Cómo puedo actualizar un cálculo que ya realicé anteriormente?",
			answer:
				'Para actualizar un cálculo existente, ve a la sección "Mis cálculos guardados", localiza el cálculo que deseas actualizar y haz clic en el botón "Editar" o "Recalcular". Esto te permitirá modificar los parámetros originales o actualizar las fechas de corte para intereses. Los cálculos originales se mantienen y se crea una versión actualizada, permitiéndote comparar ambos resultados.',
		},
		{
			question: "¿Puedo usar la plataforma en dispositivos móviles?",
			answer:
				"Sí, la plataforma está diseñada con un enfoque responsive que se adapta a diferentes tamaños de pantalla. Puedes acceder a todas las funciones desde tablets y smartphones, aunque para cálculos complejos o gestión extensiva de carpetas, recomendamos usar un equipo de escritorio para mayor comodidad de visualización.",
		},
		{
			question: "¿Qué debo hacer si encuentro un error en algún cálculo?",
			answer:
				'Si detectas alguna inconsistencia en los resultados de un cálculo, puedes contactar con soporte técnico a través del formulario en la sección "Contacto" o enviando un email a soporte@lawanalytics.com.ar. Por favor, incluye detalles del cálculo realizado y la discrepancia encontrada para que podamos revisar el caso específico.',
		},
	];

	return (
		<Box sx={{ mb: 6 }}>
			<Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
				<MessageQuestion variant="Bulk" size={28} style={{ marginRight: 12, color: theme.palette.info.main }} />
				<Typography variant="h3">Preguntas Frecuentes</Typography>
			</Box>

			<Typography paragraph color="textSecondary">
				Encuentra respuestas a las preguntas más comunes sobre la plataforma.
			</Typography>

			{faqs.map((faq, index) => (
				<Card
					key={index}
					sx={{
						mb: 2,
						boxShadow: expandedFaq === index ? "0 4px 20px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.05)",
						transition: "all 0.2s",
						borderLeft: expandedFaq === index ? `4px solid ${theme.palette.info.main}` : "none",
					}}
				>
					<CardActionArea onClick={() => handleExpandFaq(index)}>
						<CardContent sx={{ p: 2 }}>
							<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
								<Typography variant="h5" color={expandedFaq === index ? "info.main" : "inherit"}>
									{faq.question}
								</Typography>
								<ArrowRight2
									size={20}
									style={{
										transform: expandedFaq === index ? "rotate(90deg)" : "rotate(0deg)",
										transition: "transform 0.3s",
										color: theme.palette.text.secondary,
									}}
								/>
							</Box>
						</CardContent>
					</CardActionArea>
					<Collapse in={expandedFaq === index} timeout="auto" unmountOnExit>
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
			))}
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
			<Grid container spacing={3}>
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
