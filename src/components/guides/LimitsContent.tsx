import React from "react";
import { useState } from "react";
import { Typography, Button, Box, Alert, AlertTitle, Stack, Step, Stepper, StepLabel, Paper, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ArrowRight2, ArrowLeft, ArrowRight, Next, Cloud, Archive } from "iconsax-react";

// Componente de paso de la guía
interface GuideStepProps {
	title: string;
	content: React.ReactNode;
	image?: string;
}

const GuideStep: React.FC<GuideStepProps> = ({ title, content, _image }) => {
	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" gutterBottom color="primary">
				{title}
			</Typography>
			<Box sx={{ mb: 3 }}>{content}</Box>
		</Box>
	);
};

// ==============================|| CONTENIDO PARA LA GUÍA DE LÍMITES ||============================== //

export const LimitsContent = () => {
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
			title: "Sistema de Límites Dual",
			content: (
				<>
					<Typography paragraph>
						Law Analytics utiliza un sistema de límites dual para garantizar el mejor rendimiento y experiencia para todos los usuarios.
					</Typography>
					<Alert severity="info" sx={{ mt: 2 }}>
						<AlertTitle>Dos tipos de límites:</AlertTitle>
						<Typography component="div">
							<ul>
								<li>
									<strong>Límites de Cantidad:</strong> Controlan cuántos elementos activos puedes tener
								</li>
								<li>
									<strong>Límites de Almacenamiento:</strong> Controlan el espacio total que utilizas
								</li>
							</ul>
						</Typography>
					</Alert>
					<Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
							¿Por qué existen estos límites?
						</Typography>
						<Stack spacing={1} sx={{ ml: 2 }}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
								<Typography variant="body2">Mantener la aplicación rápida y fluida</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
								<Typography variant="body2">Ofrecer diferentes planes según tus necesidades</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
								<Typography variant="body2">Garantizar respaldos seguros de tu información</Typography>
							</Box>
						</Stack>
					</Paper>
				</>
			),
		},
		{
			title: "Elementos Activos vs Archivados",
			content: (
				<>
					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.2), mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" color="success.dark" gutterBottom>
							<Archive size={20} style={{ marginRight: "8px", verticalAlign: "middle" }} />
							Elementos Activos
						</Typography>
						<Stack spacing={1} sx={{ ml: 2, mt: 1 }}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
								<Typography variant="body2">Aparecen en tu lista principal</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
								<Typography variant="body2">Puedes editarlos y modificarlos</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
								<Typography variant="body2">Se incluyen en búsquedas rápidas</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.warning.main }} />
								<Typography variant="body2" color="warning.dark">
									<strong>Cuentan para tu límite de cantidad</strong>
								</Typography>
							</Box>
						</Stack>
					</Paper>

					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.2) }}>
						<Typography variant="subtitle1" fontWeight="bold" color="info.dark" gutterBottom>
							<Cloud size={20} style={{ marginRight: "8px", verticalAlign: "middle" }} />
							Elementos Archivados
						</Typography>
						<Stack spacing={1} sx={{ ml: 2, mt: 1 }}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.info.main }} />
								<Typography variant="body2">Se mantienen para consulta</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.info.main }} />
								<Typography variant="body2">Conservan toda su información</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
								<Typography variant="body2" color="success.dark">
									<strong>NO cuentan para el límite de cantidad</strong>
								</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.warning.main }} />
								<Typography variant="body2" color="warning.dark">
									<strong>SÍ ocupan espacio de almacenamiento</strong>
								</Typography>
							</Box>
						</Stack>
					</Paper>

					<Alert severity="success" sx={{ mt: 2 }}>
						<AlertTitle>Estrategia inteligente:</AlertTitle>
						Archiva los casos cerrados para liberar espacio para nuevos casos activos sin perder información histórica.
					</Alert>
				</>
			),
		},
		{
			title: "Comparación de Planes",
			content: (
				<>
					<Typography paragraph>Cada plan está diseñado para diferentes necesidades profesionales:</Typography>

					<Stack spacing={2}>
						<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
							<Typography variant="h6" color="primary" gutterBottom>
								Plan Free
							</Typography>
							<Stack spacing={1}>
								<Typography variant="body2">• 5 Carpetas activas</Typography>
								<Typography variant="body2">• 3 Calculadoras activas</Typography>
								<Typography variant="body2">• 10 Contactos activos</Typography>
								<Typography variant="body2">• 50 MB de almacenamiento total</Typography>
								<Typography variant="caption" color="text.secondary">
									Ideal para: Profesionales independientes comenzando
								</Typography>
							</Stack>
						</Paper>

						<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.1) }}>
							<Typography variant="h6" color="success.dark" gutterBottom>
								Plan Standard
							</Typography>
							<Stack spacing={1}>
								<Typography variant="body2">• 50 Carpetas activas</Typography>
								<Typography variant="body2">• 20 Calculadoras activas</Typography>
								<Typography variant="body2">• 100 Contactos activos</Typography>
								<Typography variant="body2">• 1 GB de almacenamiento total</Typography>
								<Typography variant="caption" color="text.secondary">
									Ideal para: Pequeños despachos o estudios jurídicos
								</Typography>
							</Stack>
						</Paper>

						<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
							<Typography variant="h6" color="info.dark" gutterBottom>
								Plan Premium
							</Typography>
							<Stack spacing={1}>
								<Typography variant="body2">• 500 Carpetas activas</Typography>
								<Typography variant="body2">• 200 Calculadoras activas</Typography>
								<Typography variant="body2">• 1,000 Contactos activos</Typography>
								<Typography variant="body2">• 5 GB de almacenamiento total</Typography>
								<Typography variant="caption" color="text.secondary">
									Ideal para: Firmas grandes con múltiples casos
								</Typography>
							</Stack>
						</Paper>
					</Stack>
				</>
			),
		},
		{
			title: "Sistema de Almacenamiento",
			content: (
				<>
					<Typography paragraph>El almacenamiento total incluye TODOS tus datos (activos + archivados):</Typography>

					<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Tamaños aproximados:
						</Typography>
						<Stack spacing={1}>
							<Box display="flex" justifyContent="space-between">
								<Typography variant="body2">Contacto:</Typography>
								<Typography variant="body2" color="text.secondary">
									~2 KB (500 contactos = 1 MB)
								</Typography>
							</Box>
							<Box display="flex" justifyContent="space-between">
								<Typography variant="body2">Carpeta:</Typography>
								<Typography variant="body2" color="text.secondary">
									~10 KB (100 carpetas = 1 MB)
								</Typography>
							</Box>
							<Box display="flex" justifyContent="space-between">
								<Typography variant="body2">Calculadora:</Typography>
								<Typography variant="body2" color="text.secondary">
									~5 KB (200 calculadoras = 1 MB)
								</Typography>
							</Box>
							<Box display="flex" justifyContent="space-between">
								<Typography variant="body2">Archivos PDF/Imágenes:</Typography>
								<Typography variant="body2" color="text.secondary">
									Según tamaño real del archivo
								</Typography>
							</Box>
						</Stack>
					</Paper>

					<Alert severity="info" sx={{ mb: 2 }}>
						<AlertTitle>Indicadores de uso:</AlertTitle>
						<Stack spacing={1}>
							<Box display="flex" alignItems="center">
								<Box sx={{ width: 12, height: 12, bgcolor: "success.main", borderRadius: "50%", mr: 1 }} />
								<Typography variant="body2">Verde (0-60%): Uso normal</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<Box sx={{ width: 12, height: 12, bgcolor: "warning.main", borderRadius: "50%", mr: 1 }} />
								<Typography variant="body2">Amarillo (60-80%): Considera limpiar elementos antiguos</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<Box sx={{ width: 12, height: 12, bgcolor: "error.main", borderRadius: "50%", mr: 1 }} />
								<Typography variant="body2">Rojo (80-100%): Acción necesaria pronto</Typography>
							</Box>
						</Stack>
					</Alert>
				</>
			),
		},
		{
			title: "Período de Gracia",
			content: (
				<>
					<Typography paragraph>
						El período de gracia es un tiempo adicional que te damos cuando cambias de plan o hay un problema temporal con tu pago.
					</Typography>

					<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), mb: 2 }}>
						<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
							Durante este período:
						</Typography>
						<Stack spacing={1} sx={{ ml: 2 }}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
								<Typography variant="body2">Puedes seguir trabajando normalmente</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.warning.main }} />
								<Typography variant="body2">Recibirás avisos para ajustar tu uso</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.info.main }} />
								<Typography variant="body2">Típicamente dura entre 7 y 30 días</Typography>
							</Box>
						</Stack>
					</Paper>

					<Alert severity="warning">
						<AlertTitle>Ejemplo práctico:</AlertTitle>
						<Typography variant="body2">
							Si cambias de Premium (500 carpetas) a Standard (50 carpetas) y tienes 100 carpetas activas:
						</Typography>
						<ul style={{ marginTop: "8px" }}>
							<li>Tienes 30 días de gracia para archivar 50 carpetas</li>
							<li>Puedes seguir usando tus 100 carpetas durante este tiempo</li>
							<li>Recibes recordatorios diarios del estado</li>
						</ul>
					</Alert>
				</>
			),
		},
		{
			title: "Consejos para Optimizar",
			content: (
				<>
					<Typography variant="h6" color="primary" gutterBottom>
						Mejores prácticas para gestionar tus límites:
					</Typography>

					<Stack spacing={2}>
						<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.1) }}>
							<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
								1. Archiva regularmente
							</Typography>
							<Stack spacing={1}>
								<Typography variant="body2">• Casos cerrados hace más de 6 meses</Typography>
								<Typography variant="body2">• Contactos inactivos</Typography>
								<Typography variant="body2">• Calculadoras de casos finalizados</Typography>
							</Stack>
						</Paper>

						<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
							<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
								2. Gestiona archivos inteligentemente
							</Typography>
							<Stack spacing={1}>
								<Typography variant="body2">• Comprime PDFs grandes antes de subirlos</Typography>
								<Typography variant="body2">• Elimina duplicados</Typography>
								<Typography variant="body2">• Usa enlaces externos para archivos muy grandes</Typography>
							</Stack>
						</Paper>

						<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.1) }}>
							<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
								3. Organiza por prioridad
							</Typography>
							<Stack spacing={1}>
								<Typography variant="body2">• Mantén activos solo casos en curso</Typography>
								<Typography variant="body2">• Usa etiquetas para organizar sin crear carpetas extra</Typography>
								<Typography variant="body2">• Agrupa contactos relacionados</Typography>
							</Stack>
						</Paper>
					</Stack>

					<Alert severity="success" sx={{ mt: 2 }}>
						<AlertTitle>Tip final:</AlertTitle>
						Mantén tu espacio organizado archivando regularmente. Un workspace limpio es un workspace productivo.
					</Alert>
				</>
			),
		},
	];

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<Cloud variant="Bulk" size={28} style={{ marginRight: "12px", color: theme.palette.secondary.main }} />
				<Typography variant="h3">Guía de Límites y Almacenamiento</Typography>
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

export default LimitsContent;