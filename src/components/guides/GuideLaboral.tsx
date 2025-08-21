import React from "react";
import { useState } from "react";

// material-ui
import {
	Typography,
	Button,
	Box,
	Alert,
	AlertTitle,
	Stack,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Step,
	Stepper,
	StepLabel,
	Paper,
	Grid,
	styled,
	alpha,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import { PopupTransition } from "components/@extended/Transitions";
import { Calculator, ArrowRight2, Next, Keyboard, ArrowLeft, ArrowRight, Eye, Trash, DocumentText, SmsStar, Link21 } from "iconsax-react";

// ==============================|| GUÍA LABORAL - COMPONENTES INTERNOS ||============================== //

// Componente de paso de la guía
interface GuideStepProps {
	title: string;
	content: React.ReactNode;
}

const GuideStep: React.FC<GuideStepProps> = ({ title, content }) => {
	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" gutterBottom color="primary">
				{title}
			</Typography>
			<Box sx={{ mb: 3 }}>{content}</Box>
		</Box>
	);
};

// Estilo de papel personalizado
const StyledPaper = styled(Paper)(({ theme }) => ({
	margin: "16px 0",
	overflow: "hidden",
	borderRadius: "12px",
	boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}));

// ==============================|| CONTENIDOS DE LA GUÍA DE TAREAS ||============================== //

const IntroductionContent = () => (
	<Stack spacing={3}>
		<Typography variant="body1">
			Esta guía te mostrará cómo utilizar las calculadoras laborales para generar, guardar y gestionar diferentes tipos de cálculos legales.
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
	</Stack>
);

const AccessCalculatorContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
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
		</Stack>
	);
};

const FormStepsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>El formulario de despido se completa en 3 pasos simples:</Typography>
			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Paso 1: Datos requeridos
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
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
			</StyledPaper>

			<StyledPaper sx={{ mt: 2 }}>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Paso 2: Cálculos opcionales
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
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
			</StyledPaper>

			<StyledPaper sx={{ mt: 2 }}>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Paso 3: Resultados
					</Typography>
				</Box>
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
			</StyledPaper>
		</Stack>
	);
};

const FormulasContent = () => (
	<Stack spacing={3}>
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
	</Stack>
);

const ManageCalculationsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
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
		</Stack>
	);
};

const TipsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>Para sacar el máximo provecho de la calculadora laboral, ten en cuenta estos consejos:</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Vincular a carpetas
							</Typography>
						</Box>
						<Typography variant="body2">
							Vincula tus cálculos a carpetas específicas para mantener organizados todos los documentos relacionados con un mismo caso
							legal.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Exportación
							</Typography>
						</Box>
						<Typography variant="body2">
							Utiliza las opciones de exportación (email, impresión, copiar) para compartir fácilmente los resultados con clientes o
							colegas.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Multas
							</Typography>
						</Box>
						<Typography variant="body2">
							No olvides revisar las opcionales de multas en el segundo paso para incluir conceptos adicionales que pueden ser relevantes
							para el caso.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Actualizaciones
							</Typography>
						</Box>
						<Typography variant="body2">
							Puedes actualizar los cálculos con intereses mediante la opción específica disponible en la vista detallada de cada cálculo.
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			<Alert severity="info" sx={{ mt: 3 }}>
				<AlertTitle>Recordatorio</AlertTitle>
				Los cálculos se guardan automáticamente y están disponibles para su consulta en cualquier momento desde la sección "Mis cálculos
				guardados".
			</Alert>
		</Stack>
	);
};

// ==============================|| COMPONENTE PRINCIPAL DE GUÍA LABORAL ||============================== //

interface GuideLaboralProps {
	open: boolean;
	onClose: () => void;
}

const GuideLaboral: React.FC<GuideLaboralProps> = ({ open, onClose }) => {
	const [activeStep, setActiveStep] = useState(0);
	const theme = useTheme();

	const handleNext = () => {
		setActiveStep((prevStep) => prevStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	const handleClose = () => {
		onClose();
		// Reset a paso 0 al cerrar
		setTimeout(() => setActiveStep(0), 300);
	};

	const steps = [
		{
			title: "Bienvenido a la Calculadora Laboral",
			content: <IntroductionContent />,
		},
		{
			title: "Acceso a la Calculadora Laboral",
			content: <AccessCalculatorContent />,
		},
		{
			title: "Completando el Formulario de Despido",
			content: <FormStepsContent />,
		},
		{
			title: "Fórmulas de Cálculo Aplicadas",
			content: <FormulasContent />,
		},
		{
			title: "Gestión de Cálculos Guardados",
			content: <ManageCalculationsContent />,
		},
		{
			title: "Consejos Prácticos",
			content: <TipsContent />,
		},
	];

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="md"
			fullWidth
			TransitionComponent={PopupTransition}
			sx={{ "& .MuiDialog-paper": { borderRadius: "12px" } }}
		>
			<DialogTitle
				sx={{
					borderBottom: `1px solid ${theme.palette.divider}`,
					p: 2,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Box display="flex" alignItems="center">
					<Calculator variant="Bulk" size={28} style={{ marginRight: "12px", color: theme.palette.primary.main }} />
					<Typography variant="h3">Guía de Calculadora Laboral</Typography>
				</Box>
			</DialogTitle>

			<DialogContent sx={{ p: 0 }}>
				<Stepper activeStep={activeStep} alternativeLabel sx={{ p: 3, pb: 1, pt: 3 }}>
					{steps.map((step, index) => (
						<Step key={index}>
							<StepLabel>{step.title}</StepLabel>
						</Step>
					))}
				</Stepper>

				<Box sx={{ p: 0 }}>{steps[activeStep] && <GuideStep title={steps[activeStep].title} content={steps[activeStep].content} />}</Box>
			</DialogContent>

			<DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
				<Button onClick={handleBack} disabled={activeStep === 0} startIcon={<ArrowLeft />}>
					Anterior
				</Button>
				<Box sx={{ flex: "1 1 auto" }} />
				<Button color="error" onClick={handleClose}>
					Cerrar
				</Button>
				{activeStep === steps.length - 1 ? (
					<Button variant="contained" color="primary" onClick={handleClose} endIcon={<Next />}>
						Finalizar
					</Button>
				) : (
					<Button variant="contained" color="primary" onClick={handleNext} endIcon={<ArrowRight />}>
						Siguiente
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

export default GuideLaboral;
