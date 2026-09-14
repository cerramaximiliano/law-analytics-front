import React from "react";
import { useState } from "react";

// material-ui
import { Typography, Button, Box, Alert, AlertTitle, Stack, Step, Stepper, StepLabel, Paper, Grid, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import {
	People,
	ArrowRight2,
	Next,
	ArrowLeft,
	ArrowRight,
	Crown1,
	Eye,
	Edit,
	CloseCircle,
	TickCircle,
	Import,
	Trash,
	Sms,
	Warning2,
	UserRemove,
	UserAdd,
	Profile2User,
} from "iconsax-react";

// ==============================|| COMPONENTE DE PASO ||============================== //

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

// ==============================|| CONTENIDO PARA LA GUÍA DE EQUIPOS ||============================== //

export const TeamsContent = () => {
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
			title: "Introducción a los Equipos",
			content: (
				<>
					<Typography paragraph>
						El sistema de equipos te permite invitar colaboradores para trabajar juntos en tus causas, contactos, calculadoras y demás
						recursos de Law||Analytics. Todo el equipo comparte los recursos del propietario.
					</Typography>
					<Alert severity="info" sx={{ mt: 2 }}>
						<AlertTitle>Aprenderás a:</AlertTitle>
						<Typography component="div">
							<ul>
								<li>Crear un equipo y configurarlo</li>
								<li>Invitar miembros y asignarles roles</li>
								<li>Aceptar invitaciones y migrar recursos</li>
								<li>Trabajar colaborativamente</li>
								<li>Gestionar miembros y administrar el equipo</li>
							</ul>
						</Typography>
					</Alert>
					<Alert severity="success" sx={{ mt: 2 }}>
						<AlertTitle>Concepto clave</AlertTitle>
						<Typography>
							Cuando creas un equipo, todos tus recursos pasan a estar disponibles para los miembros según su rol. No existe separación
							entre recursos "personales" y "del equipo".
						</Typography>
					</Alert>
				</>
			),
		},
		{
			title: "Requisitos y Límites",
			content: (
				<>
					<Typography paragraph>
						Para crear un equipo necesitas un plan Estándar o Premium. Los usuarios con plan Gratuito no pueden crear equipos.
					</Typography>
					<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
						<Stack spacing={2}>
							<Box display="flex" alignItems="center">
								<CloseCircle size={20} style={{ marginRight: "8px", color: theme.palette.error.main }} />
								<Typography>
									<strong>Plan Gratuito:</strong> No disponible
								</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<TickCircle size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>
									<strong>Plan Estándar:</strong> Hasta 5 miembros (incluido el propietario), 50 causas, 1 GB almacenamiento
								</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<TickCircle size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
								<Typography>
									<strong>Plan Premium:</strong> Hasta 10 miembros (incluido el propietario), 500 causas, 10 GB almacenamiento
								</Typography>
							</Box>
						</Stack>
					</Paper>
					<Alert severity="info">
						<Typography>
							El límite de miembros incluye al propietario. Por ejemplo, en el plan Estándar con límite de 5, el propietario ocupa 1 lugar y
							puede invitar hasta 4 colaboradores. Un usuario solo puede pertenecer a un equipo a la vez.
						</Typography>
					</Alert>
				</>
			),
		},
		{
			title: "Crear un Equipo e Invitar",
			content: (
				<>
					<Typography paragraph>Para crear tu equipo:</Typography>
					<Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2) }}>
						<Stack spacing={2}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>Ve a la sección de Equipos y haz clic en "Crear Equipo"</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>Ingresa nombre y descripción del equipo</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>Haz clic en "Crear" — te conviertes en Propietario</Typography>
							</Box>
						</Stack>
					</Paper>

					<Typography paragraph sx={{ mt: 2 }}>
						Para invitar miembros:
					</Typography>
					<Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.info.lighter, 0.2) }}>
						<Stack spacing={2}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
								<Typography>Haz clic en "Invitar Miembro" desde la configuración del equipo</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
								<Typography>Ingresa el email y selecciona el rol (Editor o Visor)</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
								<Typography>El colaborador recibirá un email con link válido por 7 días</Typography>
							</Box>
						</Stack>
					</Paper>
				</>
			),
		},
		{
			title: "Roles y Permisos",
			content: (
				<>
					<Typography paragraph>Tres roles con diferentes niveles de acceso:</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={4}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.warning.lighter, 0.1) }}>
								<Box display="flex" alignItems="center" mb={1}>
									<Crown1 size={20} style={{ color: theme.palette.warning.main, marginRight: "8px" }} />
									<Typography fontWeight="bold">Propietario</Typography>
								</Box>
								<Typography variant="body2">
									Control total. Dueño de recursos. Único que puede eliminar el equipo e invitar miembros.
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} sm={4}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.success.lighter, 0.1) }}>
								<Box display="flex" alignItems="center" mb={1}>
									<Edit size={20} style={{ color: theme.palette.success.main, marginRight: "8px" }} />
									<Typography fontWeight="bold">Editor</Typography>
								</Box>
								<Typography variant="body2">Crea y edita recursos. No puede eliminar ni gestionar miembros.</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} sm={4}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
								<Box display="flex" alignItems="center" mb={1}>
									<Eye size={20} style={{ color: theme.palette.info.main, marginRight: "8px" }} />
									<Typography fontWeight="bold">Visor</Typography>
								</Box>
								<Typography variant="body2">Solo lectura. Ideal para supervisores, pasantes o clientes.</Typography>
							</Paper>
						</Grid>
					</Grid>
				</>
			),
		},
		{
			title: "Aceptar Invitaciones",
			content: (
				<>
					<Typography paragraph>El proceso depende de tu situación:</Typography>
					<Stack spacing={2}>
						<Paper variant="outlined" sx={{ p: 2 }}>
							<Typography fontWeight="bold" gutterBottom>
								Usuario nuevo
							</Typography>
							<Typography variant="body2">
								Haz clic en el link del email, crea tu cuenta (nombre, apellido, contraseña) y te unes automáticamente.
							</Typography>
						</Paper>
						<Paper variant="outlined" sx={{ p: 2 }}>
							<Typography fontWeight="bold" gutterBottom>
								Usuario existente sin recursos
							</Typography>
							<Typography variant="body2">Haz clic en el link, inicia sesión y acepta la invitación directamente.</Typography>
						</Paper>
						<Paper variant="outlined" sx={{ p: 2 }}>
							<Typography fontWeight="bold" gutterBottom>
								Usuario existente con recursos
							</Typography>
							<Typography variant="body2">
								Deberás elegir qué hacer con tus recursos: migrarlos al equipo (recomendado) o eliminarlos. Si la migración excedería los
								límites del plan, se te notificará.
							</Typography>
						</Paper>
					</Stack>
					<Alert severity="warning" sx={{ mt: 2 }}>
						<Typography>Si ya perteneces a otro equipo, debes abandonarlo primero antes de aceptar una nueva invitación.</Typography>
					</Alert>
				</>
			),
		},
		{
			title: "Gestión y Consejos",
			content: (
				<>
					<Typography paragraph>El Propietario puede gestionar miembros:</Typography>
					<Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
						<Stack spacing={1.5}>
							<Box display="flex" alignItems="center">
								<Profile2User size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
								<Typography>
									<strong>Cambiar rol:</strong> Desde la configuración del equipo, selecciona al miembro y cambia su rol
								</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<UserRemove size={18} style={{ minWidth: "24px", color: theme.palette.error.main }} />
								<Typography>
									<strong>Remover:</strong> El miembro pierde acceso inmediato. Sus recursos creados permanecen
								</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<Trash size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
								<Typography>
									<strong>Eliminar equipo:</strong> Solo el Propietario puede. Los recursos permanecen en su cuenta
								</Typography>
							</Box>
						</Stack>
					</Paper>

					<Alert severity="success" sx={{ mt: 2 }}>
						<AlertTitle>Consejos prácticos</AlertTitle>
						<Stack spacing={1}>
							<Typography variant="body2">• Asigna el rol mínimo necesario a cada colaborador</Typography>
							<Typography variant="body2">• Organiza tus recursos antes de invitar al equipo</Typography>
							<Typography variant="body2">• Revisa periódicamente el historial de actividad</Typography>
							<Typography variant="body2">• Actualiza roles en lugar de remover y reinvitar miembros</Typography>
						</Stack>
					</Alert>

					<Alert severity="warning" sx={{ mt: 2 }}>
						<AlertTitle>Sobre cambios de plan</AlertTitle>
						<Typography variant="body2">
							No puedes bajar a plan Gratuito con un equipo activo. Elimina el equipo primero o remueve miembros si el nuevo plan permite
							menos.
						</Typography>
					</Alert>
				</>
			),
		},
	];

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<People variant="Bulk" size={28} style={{ marginRight: "12px", color: theme.palette.primary.main }} />
				<Typography variant="h3">Guía de Equipos</Typography>
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

export default TeamsContent;
