import { useState } from "react";

// material-ui
import { Typography, Button, Box, Alert, AlertTitle, Stack, Step, Stepper, StepLabel, Paper, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import {
	Calculator,
	ArrowRight2,
	Next,
	Keyboard,
	ArrowLeft,
	ArrowRight,
	Eye,
	Trash,
	DocumentText,
	SmsStar,
	Link21,
	Coin,
	Folder,
	Profile2User,
	Calendar,
} from "iconsax-react";

// ==============================|| COMPONENTES PARA CONTENIDOS DE GUÍAS ||============================== //

// Componente de paso de la guía
interface GuideStepProps {
	title: string;
	content: React.ReactNode;
	image?: string;
}

const GuideStep: React.FC<GuideStepProps> = ({ title, content, image }) => {
	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" gutterBottom color="primary">
				{title}
			</Typography>
			<Box sx={{ mb: 3 }}>{content}</Box>
			{image && (
				<Box sx={{ mt: 2, mb: 2, textAlign: "center" }}>
					<img
						src={image}
						alt={title}
						style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
					/>
				</Box>
			)}
		</Box>
	);
};

// ==============================|| CONTENIDO PARA LA GUÍA LABORAL ||============================== //

export const LaboralContent = () => {
	const [activeStep, setActiveStep] = useState(0);
	const theme = useTheme();

	const handleNext = () => {
		setActiveStep((prevStep) => prevStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	const steps = [
		{
			title: "Bienvenido a la Calculadora Laboral",
			content: (
				<>
					<Typography paragraph>
						Esta guía te mostrará cómo utilizar las calculadoras laborales para generar, guardar y gestionar diferentes tipos de cálculos
						legales.
					</Typography>
					<Alert severity="info" sx={{ mt: 2 }}>
						<AlertTitle>Aprenderás a:</AlertTitle>
						<Typography component="div">
							<ul>
								<li>Acceder a las calculadoras laborales</li>
								<li>Completar los formularios de cálculo paso a paso</li>
								<li>Guardar y gestionar tus cálculos</li>
								<li>Exportar e imprimir resultados</li>
							</ul>
						</Typography>
					</Alert>
				</>
			),
		},
		{
			title: "Acceso a la Calculadora Laboral",
			content: (
				<>
					<Typography paragraph>Para acceder a la calculadora laboral, sigue estos pasos:</Typography>
					<Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2) }}>
						<Stack spacing={2}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>Haz clic en el botón "Nuevo cálculo" en la parte superior</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>O desplázate hacia abajo hasta la sección "Cálculos disponibles"</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>Selecciona la tarjeta "Laboral" y haz clic en "Acceder"</Typography>
							</Box>
						</Stack>
					</Paper>
					<Typography paragraph>
						Al acceder encontrarás diferentes tipos de cálculos laborales disponibles en pestañas como "Despido" y "Liquidación".
					</Typography>
				</>
			),
		},
		{
			title: "Completando el Formulario de Despido",
			content: (
				<>
					<Typography paragraph>El formulario de despido se completa en 3 pasos simples:</Typography>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
						<Typography variant="subtitle1" fontWeight="bold">
							Paso 1: Datos requeridos
						</Typography>
					</Paper>
					<Box sx={{ p: 2, mb: 2 }}>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Información del reclamante y reclamado</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Fecha de ingreso y egreso</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Mejor remuneración mensual normal y habitual</Typography>
							</Box>
						</Stack>
					</Box>

					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
						<Typography variant="subtitle1" fontWeight="bold">
							Paso 2: Cálculos opcionales
						</Typography>
					</Paper>
					<Box sx={{ p: 2, mb: 2 }}>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
								<Typography>Selección de conceptos para la liquidación final</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
								<Typography>Inclusión de multas laborales</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
								<Typography>Aplicación de topes indemnizatorios</Typography>
							</Box>
						</Stack>
					</Box>

					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
						<Typography variant="subtitle1" fontWeight="bold">
							Paso 3: Resultados
						</Typography>
					</Paper>
					<Box sx={{ p: 2 }}>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.success.main }} />
								<Typography>Visualización del desglose de la liquidación</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.success.main }} />
								<Typography>Guardar, copiar, imprimir o enviar por email</Typography>
							</Box>
						</Stack>
					</Box>
				</>
			),
		},
		{
			title: "Fórmulas de Cálculo Aplicadas",
			content: (
				<>
					<Typography paragraph>La calculadora laboral utiliza las siguientes fórmulas principales para los cálculos:</Typography>

					<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
							Indemnización por antigüedad (Art. 245 LCT)
						</Typography>
						<Box sx={{ p: 1, bgcolor: "background.paper", borderRadius: "4px" }}>
							<Typography variant="body2" component="div" sx={{ fontFamily: "monospace" }}>
								Indemnización = Mejor remuneración mensual × Años de servicio
							</Typography>
						</Box>
						<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
							* Se considera 1 año completo cuando se superan los 3 meses del último año.
						</Typography>
					</Paper>

					<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
							Preaviso (Art. 231/232 LCT)
						</Typography>
						<Box sx={{ p: 1, bgcolor: "background.paper", borderRadius: "4px" }}>
							<Typography variant="body2" component="div" sx={{ fontFamily: "monospace" }}>
								• Menos de 3 meses: 15 días de salario
								<br />
								• De 3 meses a 5 años: 1 mes de salario
								<br />• Más de 5 años: 2 meses de salario
							</Typography>
						</Box>
					</Paper>

					<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
							Integración mes de despido (Art. 233 LCT)
						</Typography>
						<Box sx={{ p: 1, bgcolor: "background.paper", borderRadius: "4px" }}>
							<Typography variant="body2" component="div" sx={{ fontFamily: "monospace" }}>
								Integración = (Salario diario) × (Días restantes del mes)
							</Typography>
						</Box>
					</Paper>

					<Paper variant="outlined" sx={{ p: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
							Tope indemnizatorio (Fallo Vizzoti)
						</Typography>
						<Box sx={{ p: 1, bgcolor: "background.paper", borderRadius: "4px" }}>
							<Typography variant="body2" component="div" sx={{ fontFamily: "monospace" }}>
								Tope = Mínimo entre:
								<br />
								• 67% de la mejor remuneración mensual
								<br />• Tope legal vigente según convenio
							</Typography>
						</Box>
					</Paper>
				</>
			),
		},
		{
			title: "Gestión de Cálculos Guardados",
			content: (
				<>
					<Typography paragraph>
						Una vez generados los cálculos, estos se guardarán automáticamente y podrás acceder a ellos en cualquier momento:
					</Typography>

					<Box sx={{ bgcolor: alpha(theme.palette.primary.lighter, 0.1), p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Desde la pantalla principal:
						</Typography>
						<Stack spacing={1}>
							<Box display="flex" alignItems="center">
								<Keyboard size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>Encuentra todos tus cálculos en la tabla "Mis cálculos guardados"</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<Eye size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>Visualiza los detalles haciendo clic en cualquier fila</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<Trash size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>Elimina cálculos mediante el botón de papelera</Typography>
							</Box>
						</Stack>
					</Box>

					<Box sx={{ bgcolor: alpha(theme.palette.success.lighter, 0.1), p: 2, borderRadius: "8px" }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Desde la calculadora laboral:
						</Typography>
						<Stack spacing={1}>
							<Box display="flex" alignItems="center">
								<DocumentText size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
								<Typography>Accede a la pestaña "Guardados" para ver los cálculos laborales</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<SmsStar size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
								<Typography>Exporta los resultados en distintos formatos</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<Link21 size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
								<Typography>Vincula los cálculos a carpetas de casos específicos</Typography>
							</Box>
						</Stack>
					</Box>
				</>
			),
		},
	];

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<Calculator variant="Bulk" size={28} style={{ marginRight: "12px", color: theme.palette.primary.main }} />
				<Typography variant="h3">Guía de Calculadora Laboral</Typography>
			</Box>

			<Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
				{steps.map((step, index) => (
					<Step key={index}>
						<StepLabel>{step.title}</StepLabel>
					</Step>
				))}
			</Stepper>

			<Box sx={{ bgcolor: "background.paper", borderRadius: 2, mb: 3, boxShadow: theme.shadows[4] }}>
				{steps[activeStep] && <GuideStep title={steps[activeStep].title} content={steps[activeStep].content} />}
			</Box>

			<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
				<Button variant="outlined" onClick={handleBack} disabled={activeStep === 0} startIcon={<ArrowLeft />}>
					Anterior
				</Button>
				{activeStep === steps.length - 1 ? (
					<Button variant="contained" color="primary" onClick={() => setActiveStep(0)} endIcon={<Next />}>
						Volver al inicio
					</Button>
				) : (
					<Button variant="contained" color="primary" onClick={handleNext} endIcon={<ArrowRight />}>
						Siguiente
					</Button>
				)}
			</Box>
		</Box>
	);
};

// ==============================|| CONTENIDO PARA LA GUÍA DE INTERESES ||============================== //

export const InteresesContent = () => {
	const [activeStep, setActiveStep] = useState(0);
	const theme = useTheme();

	const handleNext = () => {
		setActiveStep((prevStep) => prevStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	const steps = [
		{
			title: "Calculadora de Intereses",
			content: (
				<>
					<Typography paragraph>
						Esta guía te muestra cómo utilizar la calculadora de intereses para actualizar montos por inflación y aplicar diferentes tasas
						de interés.
					</Typography>
					<Alert severity="info" sx={{ mt: 2 }}>
						<AlertTitle>Funcionalidades principales:</AlertTitle>
						<Typography component="div">
							<ul>
								<li>Cálculo de intereses con distintas tasas bancarias</li>
								<li>Actualización monetaria según índices oficiales</li>
								<li>Períodos personalizables para el cálculo</li>
								<li>Guardado y gestión de cálculos realizados</li>
							</ul>
						</Typography>
					</Alert>
				</>
			),
		},
		{
			title: "Tasas disponibles",
			content: (
				<>
					<Typography paragraph>La calculadora ofrece diversas tasas para aplicar según tus necesidades:</Typography>
					<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
						<Stack spacing={2}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>
									<strong>Tasa Activa BNA:</strong> La tasa activa del Banco Nación Argentina
								</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>
									<strong>Tasa Pasiva BNA:</strong> La tasa pasiva o de caja de ahorro del BNA
								</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>
									<strong>Tasa Mix:</strong> Combinación ponderada de tasas activa y pasiva
								</Typography>
							</Box>
						</Stack>
					</Paper>
					<Typography paragraph>Cada jurisdicción puede tener sus propias regulaciones sobre qué tasa aplicar.</Typography>
				</>
			),
		},
		{
			title: "Cómo realizar un cálculo",
			content: (
				<>
					<Typography paragraph>Para calcular intereses, sigue estos pasos:</Typography>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Paso 1: Datos iniciales
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Ingresa el capital inicial (monto base)</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Establece la fecha de origen (cuándo comenzar a calcular)</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Define la fecha final (hasta cuándo calcular)</Typography>
							</Box>
						</Stack>
					</Box>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Paso 2: Elección de tasa
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Selecciona la tasa de interés a aplicar</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Opciones para capitalización de intereses (si aplica)</Typography>
							</Box>
						</Stack>
					</Box>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px" }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Paso 3: Resultados
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Visualiza el capital actualizado</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Desglose de intereses generados</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Monto total final</Typography>
							</Box>
						</Stack>
					</Box>
				</>
			),
		},
	];

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<Coin variant="Bulk" size={28} style={{ marginRight: "12px", color: theme.palette.success.main }} />
				<Typography variant="h3">Guía de Calculadora de Intereses</Typography>
			</Box>

			<Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
				{steps.map((step, index) => (
					<Step key={index}>
						<StepLabel>{step.title}</StepLabel>
					</Step>
				))}
			</Stepper>

			<Box sx={{ bgcolor: "background.paper", borderRadius: 2, mb: 3, boxShadow: theme.shadows[4] }}>
				{steps[activeStep] && <GuideStep title={steps[activeStep].title} content={steps[activeStep].content} />}
			</Box>

			<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
				<Button variant="outlined" onClick={handleBack} disabled={activeStep === 0} startIcon={<ArrowLeft />}>
					Anterior
				</Button>
				{activeStep === steps.length - 1 ? (
					<Button variant="contained" color="primary" onClick={() => setActiveStep(0)} endIcon={<Next />}>
						Volver al inicio
					</Button>
				) : (
					<Button variant="contained" color="primary" onClick={handleNext} endIcon={<ArrowRight />}>
						Siguiente
					</Button>
				)}
			</Box>
		</Box>
	);
};

// ==============================|| CONTENIDO PARA LA GUÍA DE CARPETAS ||============================== //

export const ContactsContent = () => {
	const [activeStep, setActiveStep] = useState(0);
	const theme = useTheme();

	const handleNext = () => {
		setActiveStep((prevStep) => prevStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	const steps = [
		{
			title: "Gestión de Contactos",
			content: (
				<>
					<Typography paragraph>
						El módulo de Contactos te permite organizar y gestionar todas las personas y organizaciones relacionadas con tus casos legales.
					</Typography>
					<Alert severity="info" sx={{ mt: 2 }}>
						<AlertTitle>Con el módulo de Contactos puedes:</AlertTitle>
						<Typography component="div">
							<ul>
								<li>Crear perfiles detallados para clientes, oponentes, testigos y otros contactos</li>
								<li>Categorizar contactos para facilitar su búsqueda y organización</li>
								<li>Vincular contactos a carpetas específicas y casos</li>
								<li>Registrar información de contacto, historia del cliente y notas importantes</li>
								<li>Exportar datos de contactos para uso en otros sistemas</li>
							</ul>
						</Typography>
					</Alert>
				</>
			),
		},
		{
			title: "Creación y Edición de Contactos",
			content: (
				<>
					<Typography paragraph>Para agregar un nuevo contacto a tu base de datos:</Typography>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Creación de contacto
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Navega a la sección "Contactos" y haz clic en el botón "Nuevo Contacto"</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Selecciona el tipo de contacto: Persona física o Persona jurídica/Organización</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Completa los campos obligatorios: Nombre, tipo de relación, información de contacto básica</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Agrega información adicional: Dirección, datos fiscales, categorías personalizadas</Typography>
							</Box>
						</Stack>
					</Box>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Edición de contactos
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Localiza el contacto en la lista y haz clic en el ícono de edición</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Modifica los campos necesarios en el formulario de edición</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Utiliza la opción de historial para ver cambios anteriores en la información del contacto</Typography>
							</Box>
						</Stack>
					</Box>

					<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
							Tipos de contactos disponibles
						</Typography>
						<Box sx={{ pl: 2 }}>
							<Typography variant="body2" component="div">
								<ul>
									<li>
										<strong>Cliente</strong>: Persona o entidad que recibe tus servicios legales
									</li>
									<li>
										<strong>Contraparte</strong>: Persona o entidad con intereses opuestos a tu cliente
									</li>
									<li>
										<strong>Testigo</strong>: Persona que puede proveer testimonio en un caso
									</li>
									<li>
										<strong>Perito</strong>: Especialista que brinda opinión técnica sobre aspectos del caso
									</li>
									<li>
										<strong>Juez</strong>: Autoridad judicial asignada al caso
									</li>
									<li>
										<strong>Otro</strong>: Cualquier otro tipo de relación personalizable
									</li>
								</ul>
							</Typography>
						</Box>
					</Paper>
				</>
			),
		},
		{
			title: "Búsqueda y Organización",
			content: (
				<>
					<Typography paragraph>El sistema de contactos ofrece potentes herramientas de búsqueda y organización:</Typography>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Búsqueda avanzada
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Utiliza la barra de búsqueda para encontrar contactos por nombre, email o teléfono</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Filtra contactos por tipo, categoría, carpeta asociada o fecha de creación</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Guarda búsquedas frecuentes para acceder rápidamente a ellas en el futuro</Typography>
							</Box>
						</Stack>
					</Box>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Categorización
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Asigna etiquetas personalizadas a los contactos para organizarlos por área legal, estado, etc.</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Crea grupos de contactos relacionados para casos o proyectos específicos</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Marca contactos como favoritos para acceso rápido desde el panel principal</Typography>
							</Box>
						</Stack>
					</Box>

					<Alert severity="success" sx={{ mt: 3 }}>
						<AlertTitle>Consejo de productividad</AlertTitle>
						Utiliza las vistas guardadas para acceder rápidamente a grupos de contactos que consultas con frecuencia, como "Clientes
						activos", "Contactos recientes" o "Peritos disponibles".
					</Alert>
				</>
			),
		},
		{
			title: "Vinculación con Carpetas y Casos",
			content: (
				<>
					<Typography paragraph>
						Para aprovechar al máximo el sistema, vincula tus contactos con las carpetas de casos correspondientes:
					</Typography>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Vinculación desde la vista de contacto
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Abre el perfil del contacto que deseas vincular</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Navega a la sección "Carpetas asociadas"</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Haz clic en "Vincular a carpeta" y selecciona la carpeta deseada</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Especifica el rol del contacto en esa carpeta específica (puede variar por caso)</Typography>
							</Box>
						</Stack>
					</Box>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Vinculación desde la vista de carpeta
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Abre la carpeta a la que deseas agregar contactos</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Navega a la pestaña "Contactos" dentro de la carpeta</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Haz clic en "Agregar contacto" y selecciona de tu lista de contactos existentes</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>También puedes crear un nuevo contacto directamente desde esta vista</Typography>
							</Box>
						</Stack>
					</Box>

					<Paper variant="outlined" sx={{ p: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
							Beneficios de la vinculación
						</Typography>
						<Box sx={{ pl: 2 }}>
							<Typography variant="body2" component="div">
								<ul>
									<li>Acceso rápido a toda la información relevante del contacto desde la carpeta del caso</li>
									<li>Visualización inmediata de todos los casos en los que participa un contacto específico</li>
									<li>Posibilidad de aplicar filtros cruzados entre contactos y carpetas</li>
									<li>Generación de reportes integrados que incluyen datos de contactos y casos</li>
								</ul>
							</Typography>
						</Box>
					</Paper>
				</>
			),
		},
	];

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<Profile2User variant="Bulk" size={28} style={{ marginRight: 12, color: theme.palette.info.dark }} />
				<Typography variant="h3">Guía de Contactos</Typography>
			</Box>

			<Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
				{steps.map((step, index) => (
					<Step key={index}>
						<StepLabel>{step.title}</StepLabel>
					</Step>
				))}
			</Stepper>

			<Box sx={{ bgcolor: "background.paper", borderRadius: 2, mb: 3, boxShadow: theme.shadows[4] }}>
				{steps[activeStep] && <GuideStep title={steps[activeStep].title} content={steps[activeStep].content} />}
			</Box>

			<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
				<Button variant="outlined" onClick={handleBack} disabled={activeStep === 0} startIcon={<ArrowLeft />}>
					Anterior
				</Button>
				{activeStep === steps.length - 1 ? (
					<Button variant="contained" color="primary" onClick={() => setActiveStep(0)} endIcon={<Next />}>
						Volver al inicio
					</Button>
				) : (
					<Button variant="contained" color="primary" onClick={handleNext} endIcon={<ArrowRight />}>
						Siguiente
					</Button>
				)}
			</Box>
		</Box>
	);
};

export const FoldersContent = () => {
	const [activeStep, setActiveStep] = useState(0);
	const theme = useTheme();

	const handleNext = () => {
		setActiveStep((prevStep) => prevStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	const steps = [
		{
			title: "Sistema de Carpetas",
			content: (
				<>
					<Typography paragraph>
						Las carpetas te permiten organizar tus casos legales y mantener toda la información relevante en un solo lugar.
					</Typography>
					<Alert severity="info" sx={{ mt: 2 }}>
						<AlertTitle>Con las carpetas puedes:</AlertTitle>
						<Typography component="div">
							<ul>
								<li>Organizar casos por cliente, tipo o estado</li>
								<li>Vincular cálculos y documentos a carpetas específicas</li>
								<li>Añadir notas y seguimiento de eventos importantes</li>
								<li>Compartir información con otros usuarios (según permisos)</li>
							</ul>
						</Typography>
					</Alert>
				</>
			),
		},
		{
			title: "Gestión de Carpetas",
			content: (
				<>
					<Typography paragraph>Principales funciones para gestionar tus carpetas:</Typography>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Creación de carpetas
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Haz clic en "Nueva carpeta" desde la vista principal</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Completa la información básica: título, tipo y descripción</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Opcionalmente, agrega etiquetas para facilitar la búsqueda</Typography>
							</Box>
						</Stack>
					</Box>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Organización interna
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Añade diferentes tipos de elementos: notas, cálculos, fechas clave</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Organiza la información en secciones personalizables</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Accede rápidamente al historial de cambios</Typography>
							</Box>
						</Stack>
					</Box>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px" }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Vinculación con otros módulos
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Asocia cálculos laborales o de intereses</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Vincula contactos relevantes al caso</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Integración con el calendario para eventos y audiencias</Typography>
							</Box>
						</Stack>
					</Box>
				</>
			),
		},
	];

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<Folder variant="Bulk" size={28} style={{ marginRight: "12px", color: theme.palette.warning.main }} />
				<Typography variant="h3">Guía de Carpetas</Typography>
			</Box>

			<Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
				{steps.map((step, index) => (
					<Step key={index}>
						<StepLabel>{step.title}</StepLabel>
					</Step>
				))}
			</Stepper>

			<Box sx={{ bgcolor: "background.paper", borderRadius: 2, mb: 3, boxShadow: theme.shadows[4] }}>
				{steps[activeStep] && <GuideStep title={steps[activeStep].title} content={steps[activeStep].content} />}
			</Box>

			<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
				<Button variant="outlined" onClick={handleBack} disabled={activeStep === 0} startIcon={<ArrowLeft />}>
					Anterior
				</Button>
				{activeStep === steps.length - 1 ? (
					<Button variant="contained" color="primary" onClick={() => setActiveStep(0)} endIcon={<Next />}>
						Volver al inicio
					</Button>
				) : (
					<Button variant="contained" color="primary" onClick={handleNext} endIcon={<ArrowRight />}>
						Siguiente
					</Button>
				)}
			</Box>
		</Box>
	);
};

// ==============================|| CONTENIDO PARA LA GUÍA DEL CALENDARIO ||============================== //

export const CalendarContent = () => {
	const [activeStep, setActiveStep] = useState(0);
	const theme = useTheme();

	const handleNext = () => {
		setActiveStep((prevStep) => prevStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	const steps = [
		{
			title: "Calendario y Agenda",
			content: (
				<>
					<Typography paragraph>
						El calendario es una herramienta esencial que te permite organizar tus eventos legales, gestionar recordatorios y vincular
						actividades a tus causas.
					</Typography>
					<Alert severity="info" sx={{ mt: 2 }}>
						<AlertTitle>Características principales:</AlertTitle>
						<Typography component="div">
							<ul>
								<li>Gestión de diferentes tipos de eventos: audiencias, vencimientos, reuniones</li>
								<li>Sistema de notificaciones y recordatorios por email y web</li>
								<li>Integración completa con el módulo de causas</li>
								<li>Múltiples vistas para organizar tu tiempo (día, semana, mes, agenda)</li>
							</ul>
						</Typography>
					</Alert>
				</>
			),
		},
		{
			title: "Creación de Eventos",
			content: (
				<>
					<Typography paragraph>El sistema ofrece diferentes formas de crear eventos en tu calendario:</Typography>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Desde el Calendario
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Haz clic en el botón "+" en la esquina inferior derecha</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Selecciona directamente una fecha o rango de tiempo en el calendario</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Completa los detalles del evento y selecciona el tipo apropiado</Typography>
							</Box>
						</Stack>
					</Box>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Desde una Causa
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Accede a la vista detallada de la causa</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Navega a la sección de calendario o eventos</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>Crea eventos que quedarán automáticamente vinculados a esa causa</Typography>
							</Box>
						</Stack>
					</Box>

					<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
							Tipos de eventos disponibles
						</Typography>
						<Box sx={{ pl: 2 }}>
							<Typography variant="body2" component="div">
								<ul>
									<li>
										<strong>Audiencia:</strong> Para eventos judiciales (color azul)
									</li>
									<li>
										<strong>Vencimiento:</strong> Para plazos procesales y fechas límite (color rojo)
									</li>
									<li>
										<strong>Reunión:</strong> Para encuentros con clientes o colegas (color verde)
									</li>
									<li>
										<strong>Otro:</strong> Para cualquier otro tipo de evento (color amarillo)
									</li>
								</ul>
							</Typography>
						</Box>
					</Paper>
				</>
			),
		},
		{
			title: "Notificaciones y Recordatorios",
			content: (
				<>
					<Typography paragraph>
						El sistema incluye diversas opciones de notificación para que nunca pierdas un evento importante:
					</Typography>

					<Box sx={{ bgcolor: theme.palette.background.default, p: 2, borderRadius: "8px", mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Sistema de recordatorios
						</Typography>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>
									<strong>Notificaciones por correo:</strong> Recibe alertas en tu email con la anticipación que configures
								</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>
									<strong>Notificaciones en la plataforma:</strong> Alertas dentro de la aplicación cuando estés conectado
								</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>
									<strong>Notificaciones push:</strong> Alertas en tu navegador incluso cuando no tengas la aplicación abierta
								</Typography>
							</Box>
						</Stack>
					</Box>

					<Alert severity="success" sx={{ mt: 3 }}>
						<AlertTitle>Personalización</AlertTitle>
						<Typography paragraph>
							Puedes configurar tus preferencias de notificación en la sección de configuración de tu perfil, donde podrás elegir:
						</Typography>
						<ul>
							<li>El tiempo de anticipación de los recordatorios (1 día, 3 días, 1 semana)</li>
							<li>Qué tipos de eventos generan notificaciones</li>
							<li>Los canales por los que prefieres recibir las alertas</li>
						</ul>
					</Alert>
				</>
			),
		},
	];

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<Calendar variant="Bulk" size={28} style={{ marginRight: "12px", color: theme.palette.info.main }} />
				<Typography variant="h3">Guía del Calendario</Typography>
			</Box>

			<Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
				{steps.map((step, index) => (
					<Step key={index}>
						<StepLabel>{step.title}</StepLabel>
					</Step>
				))}
			</Stepper>

			<Box sx={{ bgcolor: "background.paper", borderRadius: 2, mb: 3, boxShadow: theme.shadows[4] }}>
				{steps[activeStep] && <GuideStep title={steps[activeStep].title} content={steps[activeStep].content} />}
			</Box>

			<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
				<Button variant="outlined" onClick={handleBack} disabled={activeStep === 0} startIcon={<ArrowLeft />}>
					Anterior
				</Button>
				{activeStep === steps.length - 1 ? (
					<Button variant="contained" color="primary" onClick={() => setActiveStep(0)} endIcon={<Next />}>
						Volver al inicio
					</Button>
				) : (
					<Button variant="contained" color="primary" onClick={handleNext} endIcon={<ArrowRight />}>
						Siguiente
					</Button>
				)}
			</Box>
		</Box>
	);
};
