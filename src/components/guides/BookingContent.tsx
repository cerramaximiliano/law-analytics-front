import { useState } from "react";

// material-ui
import { Typography, Button, Box, Alert, AlertTitle, Stack, Step, Stepper, StepLabel, Paper, Grid, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import {
	Calendar,
	ArrowRight2,
	Next,
	ArrowLeft,
	ArrowRight,
	Calendar1,
	Link21,
	Clock,
	People,
	ClipboardTick,
	Setting2,
	Save2,
	GlobalEdit,
	Timer1,
	Diagram,
	MessageText1,
	UserSearch,
	NotificationCircle,
	TickSquare,
	AddSquare,
	Trash,
	Edit2,
	SecurityTime,
	CalendarTick,
	Profile2User,
	MessageQuestion,
	UserAdd,
	Mobile,
	Bookmark,
	Reserve,
} from "iconsax-react";

// ==============================|| COMPONENTE DE PASO DE LA GUÍA ||============================== //

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

// ==============================|| COMPONENTE PRINCIPAL DE GUÍA DE CITAS ||============================== //

export const BookingContent = () => {
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
			title: "Sistema de Citas Online",
			content: (
				<>
					<Typography paragraph>
						Esta guía te mostrará cómo utilizar el sistema de citas para configurar tu disponibilidad y permitir a tus clientes programar
						consultas directamente.
					</Typography>
					<Alert severity="info" sx={{ mt: 2 }}>
						<AlertTitle>Funcionalidades principales:</AlertTitle>
						<Typography component="div">
							<ul>
								<li>Configura horarios de disponibilidad para recibir citas</li>
								<li>Comparte un enlace profesional para que tus clientes agenden consultas</li>
								<li>Recibe notificaciones automáticas de nuevas citas</li>
								<li>Aprueba, rechaza o reagenda citas con facilidad</li>
								<li>Personaliza formularios para recopilar información relevante de tus clientes</li>
								<li>Integración completa con tu calendario de eventos</li>
								<li>Gestión profesional de tu agenda de consultas</li>
							</ul>
						</Typography>
					</Alert>
				</>
			),
		},
		{
			title: "Acceso y Configuración",
			content: (
				<>
					<Typography paragraph>Para comenzar a configurar tu sistema de citas, accede a la sección correspondiente:</Typography>
					<Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2) }}>
						<Stack spacing={2}>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>
									<strong>Desde la Navegación Principal:</strong> Accede a "Aplicaciones" → "Calendario" → "Reservaciones"
								</Typography>
							</Box>
							<Box display="flex" alignItems="center">
								<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
								<Typography>
									<strong>Desde el Calendario:</strong> En la vista del calendario, haz clic en "Disponibilidad" en el menú lateral
								</Typography>
							</Box>
						</Stack>
					</Paper>

					<Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
						Configuración Inicial:
					</Typography>

					<Paper
						sx={{
							margin: "16px 0",
							overflow: "hidden",
							borderRadius: "12px",
							boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
						}}
					>
						<Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant="subtitle1" fontWeight="bold">
								Pasos para Configurar tu Disponibilidad
							</Typography>
						</Box>
						<Box sx={{ p: 2 }}>
							<Stack spacing={2}>
								<Box display="flex" alignItems="flex-start">
									<Setting2 size={20} style={{ minWidth: "24px", color: theme.palette.info.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">1. Crea una nueva configuración</Typography>
										<Typography variant="body2">
											Haz clic en "Nueva Disponibilidad" y comienza a configurar tus opciones personalizadas.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<Calendar1 size={20} style={{ minWidth: "24px", color: theme.palette.info.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">2. Selecciona los días disponibles</Typography>
										<Typography variant="body2">Marca los días de la semana en que estarás disponible para recibir consultas.</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<Clock size={20} style={{ minWidth: "24px", color: theme.palette.info.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">3. Define horarios</Typography>
										<Typography variant="body2">
											Establece la hora de inicio y finalización de tu jornada de atención para cada día seleccionado.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<Timer1 size={20} style={{ minWidth: "24px", color: theme.palette.info.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">4. Ajusta duración y descanso</Typography>
										<Typography variant="body2">
											Configura la duración de cada cita y el tiempo de descanso que necesitas entre ellas.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<Save2 size={20} style={{ minWidth: "24px", color: theme.palette.info.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">5. Guarda la configuración</Typography>
										<Typography variant="body2">Al guardar, se generará un enlace único que podrás compartir con tus clientes.</Typography>
									</Box>
								</Box>
							</Stack>
						</Box>
					</Paper>

					<Alert severity="success" sx={{ mt: 3 }}>
						Una vez completada la configuración, el sistema estará listo para recibir reservas de citas según tus parámetros establecidos.
					</Alert>
				</>
			),
		},
		{
			title: "Configuración Detallada",
			content: (
				<>
					<Typography paragraph>
						El sistema de citas ofrece opciones detalladas para personalizar completamente tu disponibilidad y preferencias:
					</Typography>

					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
								<Box display="flex" alignItems="flex-start" mb={1}>
									<Calendar1 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
									<Typography variant="subtitle1" fontWeight="bold">
										Días Disponibles
									</Typography>
								</Box>
								<Typography variant="body2">
									Selecciona cualquier combinación de días de la semana para tus citas. Puedes elegir solo días laborables, incluir fines de
									semana o incluso configurar disponibilidad para un solo día específico.
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} md={6}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
								<Box display="flex" alignItems="flex-start" mb={1}>
									<Clock size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
									<Typography variant="subtitle1" fontWeight="bold">
										Horario de Atención
									</Typography>
								</Box>
								<Typography variant="body2">
									Define las horas de inicio y fin de tu jornada de atención para cada día. Puedes establecer distintos horarios para
									diferentes días según tus necesidades.
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} md={6}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
								<Box display="flex" alignItems="flex-start" mb={1}>
									<Timer1 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
									<Typography variant="subtitle1" fontWeight="bold">
										Duración de Citas
									</Typography>
								</Box>
								<Typography variant="body2">
									Establece la duración estándar de tus consultas (15, 30, 45, 60 minutos o personalizada). Esta duración determinará los
									bloques de tiempo disponibles en tu calendario.
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} md={6}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
								<Box display="flex" alignItems="flex-start" mb={1}>
									<Diagram size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
									<Typography variant="subtitle1" fontWeight="bold">
										Tiempo entre Citas
									</Typography>
								</Box>
								<Typography variant="body2">
									Configura un margen de tiempo entre consultas consecutivas para prepararte, revisar notas o simplemente descansar
									brevemente entre atenciones.
								</Typography>
							</Paper>
						</Grid>
					</Grid>

					<Paper
						sx={{
							margin: "16px 0",
							overflow: "hidden",
							borderRadius: "12px",
							boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
							mt: 3,
						}}
					>
						<Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant="subtitle1" fontWeight="bold">
								Configuraciones Avanzadas
							</Typography>
						</Box>
						<Box sx={{ p: 2 }}>
							<Stack spacing={2}>
								<Box display="flex" alignItems="flex-start">
									<CalendarTick size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Fechas Excluidas</Typography>
										<Typography variant="body2">
											Bloquea fechas específicas en las que no estarás disponible, como vacaciones, días festivos o compromisos previos.
											Puedes añadir un motivo opcional para tu referencia.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<SecurityTime size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Tiempo Mínimo de Anticipación</Typography>
										<Typography variant="body2">
											Define cuánto tiempo antes debe programarse una cita (ej: mínimo 24 horas antes), evitando reservas de última hora.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<Calendar size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Tiempo Máximo de Anticipación</Typography>
										<Typography variant="body2">
											Establece hasta cuántos días en el futuro pueden programarse citas (ej: máximo 60 días), facilitando una gestión más
											eficiente de tu agenda a largo plazo.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<UserSearch size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Límite de Reservas</Typography>
										<Typography variant="body2">
											Configura límites diarios o semanales de citas para evitar sobrecarga en tu agenda y mantener un equilibrio saludable
											en tu trabajo.
										</Typography>
									</Box>
								</Box>
							</Stack>
						</Box>
					</Paper>
				</>
			),
		},
		{
			title: "Personalización de Formularios",
			content: (
				<>
					<Typography paragraph>
						El sistema te permite personalizar el formulario que tus clientes completarán al agendar una cita, recopilando exactamente la
						información que necesitas:
					</Typography>

					<Paper
						sx={{
							margin: "16px 0",
							overflow: "hidden",
							borderRadius: "12px",
							boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
						}}
					>
						<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant="subtitle1" fontWeight="bold">
								Campos Básicos
							</Typography>
						</Box>
						<Box sx={{ p: 2 }}>
							<Stack spacing={2}>
								<Box display="flex" alignItems="flex-start">
									<Profile2User size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Información de Contacto</Typography>
										<Typography variant="body2">
											Configura qué campos de contacto son obligatorios para tus clientes: nombre, correo electrónico, teléfono, empresa,
											dirección, etc.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<MessageQuestion size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Motivo de la Consulta</Typography>
										<Typography variant="body2">
											Decide si deseas que los clientes proporcionen un motivo o descripción de la consulta al momento de agendar.
										</Typography>
									</Box>
								</Box>
							</Stack>
						</Box>
					</Paper>

					<Paper
						sx={{
							margin: "16px 0",
							overflow: "hidden",
							borderRadius: "12px",
							boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
							mt: 3,
						}}
					>
						<Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant="subtitle1" fontWeight="bold">
								Campos Personalizados
							</Typography>
						</Box>
						<Box sx={{ p: 2 }}>
							<Typography paragraph>
								Añade campos adicionales para recopilar información específica relevante para tu práctica jurídica:
							</Typography>
							<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
									<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.1) }}>
										<Box display="flex" alignItems="center">
											<MessageText1 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
											<Typography>
												<strong>Campo de Texto</strong>
											</Typography>
										</Box>
										<Typography variant="caption">Para información general como números de expediente, referencias, etc.</Typography>
									</Paper>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.1) }}>
										<Box display="flex" alignItems="center">
											<Mobile size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
											<Typography>
												<strong>Campo Numérico</strong>
											</Typography>
										</Box>
										<Typography variant="caption">Para valores numéricos como montos, plazos o cantidades.</Typography>
									</Paper>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.1) }}>
										<Box display="flex" alignItems="center">
											<Reserve size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
											<Typography>
												<strong>Lista de Opciones</strong>
											</Typography>
										</Box>
										<Typography variant="caption">
											Para selección de categorías predefinidas (tipo de consulta, jurisdicción, etc.).
										</Typography>
									</Paper>
								</Grid>
								<Grid item xs={12} sm={6}>
									<Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.1) }}>
										<Box display="flex" alignItems="center">
											<TickSquare size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
											<Typography>
												<strong>Casilla de Verificación</strong>
											</Typography>
										</Box>
										<Typography variant="caption">Para confirmaciones o aceptaciones de términos específicos.</Typography>
									</Paper>
								</Grid>
							</Grid>

							<Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.1), borderRadius: "8px" }}>
								<Typography variant="subtitle2" fontWeight="bold" gutterBottom>
									Administración de Campos
								</Typography>
								<Stack spacing={1.5}>
									<Box display="flex" alignItems="center">
										<AddSquare size={18} style={{ marginRight: "8px", color: theme.palette.info.main }} />
										<Typography>Añade campos personalizados haciendo clic en "Agregar campo"</Typography>
									</Box>
									<Box display="flex" alignItems="center">
										<Edit2 size={18} style={{ marginRight: "8px", color: theme.palette.info.main }} />
										<Typography>Edita campos existentes para modificar sus propiedades o añadir opciones</Typography>
									</Box>
									<Box display="flex" alignItems="center">
										<Trash size={18} style={{ marginRight: "8px", color: theme.palette.info.main }} />
										<Typography>Elimina campos que ya no necesites o que no sean relevantes</Typography>
									</Box>
									<Box display="flex" alignItems="center">
										<Bookmark size={18} style={{ marginRight: "8px", color: theme.palette.info.main }} />
										<Typography>Marca los campos como obligatorios u opcionales según tus necesidades</Typography>
									</Box>
								</Stack>
							</Box>
						</Box>
					</Paper>

					<Alert severity="info" sx={{ mt: 3 }}>
						<AlertTitle>Consejo profesional</AlertTitle>
						<Typography>
							Solicita solo la información realmente necesaria para la consulta inicial. Un formulario demasiado extenso puede disuadir a
							potenciales clientes de completar el proceso de reserva. Puedes recopilar información más detallada durante la cita.
						</Typography>
					</Alert>
				</>
			),
		},
		{
			title: "Gestión de Reservas",
			content: (
				<>
					<Typography paragraph>
						Una vez configurado tu sistema, podrás gestionar fácilmente las reservas que realicen tus clientes:
					</Typography>

					<Paper
						sx={{
							margin: "16px 0",
							overflow: "hidden",
							borderRadius: "12px",
							boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
						}}
					>
						<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant="subtitle1" fontWeight="bold">
								Centro de Reservas
							</Typography>
						</Box>
						<Box sx={{ p: 2 }}>
							<Typography paragraph>
								Accede a la sección "Reservaciones" en el menú del calendario para ver todas tus citas programadas. Desde aquí podrás:
							</Typography>

							<Grid container spacing={2}>
								<Grid item xs={12} md={6}>
									<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
										<Box display="flex" alignItems="flex-start" mb={1}>
											<ClipboardTick size={24} style={{ color: theme.palette.info.main, marginRight: "8px", marginTop: "2px" }} />
											<Typography variant="subtitle1" fontWeight="bold">
												Confirmar Citas
											</Typography>
										</Box>
										<Typography variant="body2">
											Si has configurado aprobación manual, podrás revisar y confirmar las solicitudes entrantes. Las citas confirmadas se
											añadirán automáticamente a tu calendario.
										</Typography>
									</Paper>
								</Grid>
								<Grid item xs={12} md={6}>
									<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
										<Box display="flex" alignItems="flex-start" mb={1}>
											<Trash size={24} style={{ color: theme.palette.info.main, marginRight: "8px", marginTop: "2px" }} />
											<Typography variant="subtitle1" fontWeight="bold">
												Rechazar o Cancelar
											</Typography>
										</Box>
										<Typography variant="body2">
											Puedes rechazar solicitudes que no puedas atender o cancelar citas ya confirmadas, añadiendo opcionalmente un motivo
											que se compartirá con el cliente.
										</Typography>
									</Paper>
								</Grid>
								<Grid item xs={12} md={6}>
									<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
										<Box display="flex" alignItems="flex-start" mb={1}>
											<UserAdd size={24} style={{ color: theme.palette.info.main, marginRight: "8px", marginTop: "2px" }} />
											<Typography variant="subtitle1" fontWeight="bold">
												Ver Información del Cliente
											</Typography>
										</Box>
										<Typography variant="body2">
											Accede a toda la información proporcionada por el cliente al momento de la reserva, incluyendo los campos
											personalizados que hayas configurado.
										</Typography>
									</Paper>
								</Grid>
								<Grid item xs={12} md={6}>
									<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
										<Box display="flex" alignItems="flex-start" mb={1}>
											<NotificationCircle size={24} style={{ color: theme.palette.info.main, marginRight: "8px", marginTop: "2px" }} />
											<Typography variant="subtitle1" fontWeight="bold">
												Marcar como Completada
											</Typography>
										</Box>
										<Typography variant="body2">
											Una vez realizada la consulta, puedes marcarla como completada para mantener un registro ordenado de tus atenciones
											pasadas y pendientes.
										</Typography>
									</Paper>
								</Grid>
							</Grid>
						</Box>
					</Paper>

					<Paper
						sx={{
							margin: "16px 0",
							overflow: "hidden",
							borderRadius: "12px",
							boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
							mt: 3,
						}}
					>
						<Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant="subtitle1" fontWeight="bold">
								Filtros y Organización
							</Typography>
						</Box>
						<Box sx={{ p: 2 }}>
							<Typography paragraph>El panel de reservas ofrece filtros para facilitar la gestión de tus citas:</Typography>
							<Stack spacing={2}>
								<Box display="flex" alignItems="flex-start">
									<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Vista Temporal</Typography>
										<Typography variant="body2">Filtra por citas próximas, pasadas o todas para gestionar mejor tu agenda.</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Filtro por Estado</Typography>
										<Typography variant="body2">
											Visualiza citas según su estado: pendientes, confirmadas, canceladas, rechazadas o completadas.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Búsqueda por Cliente</Typography>
										<Typography variant="body2">
											Localiza rápidamente citas de un cliente específico por su nombre o correo electrónico.
										</Typography>
									</Box>
								</Box>
							</Stack>
						</Box>
					</Paper>

					<Alert severity="success" sx={{ mt: 3 }}>
						<AlertTitle>Integración con el Calendario</AlertTitle>
						<Typography>
							Todas las citas confirmadas se integran automáticamente con tu calendario principal, evitando conflictos de horarios con otros
							eventos y permitiéndote tener una visión completa de tu agenda en un solo lugar.
						</Typography>
					</Alert>
				</>
			),
		},
		{
			title: "Enlace para Clientes",
			content: (
				<>
					<Typography paragraph>
						Una vez configurada tu disponibilidad, el sistema genera un enlace personalizado que puedes compartir con tus clientes para que
						programen citas:
					</Typography>

					<Paper
						sx={{
							margin: "16px 0",
							overflow: "hidden",
							borderRadius: "12px",
							boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
						}}
					>
						<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant="subtitle1" fontWeight="bold">
								URL de Reserva
							</Typography>
						</Box>
						<Box sx={{ p: 2 }}>
							<Stack spacing={2}>
								<Box display="flex" alignItems="flex-start">
									<Link21 size={20} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Acceso al Enlace</Typography>
										<Typography variant="body2">
											El enlace único para tus reservas se muestra en la sección "Reservaciones" y se genera automáticamente con tu nombre
											profesional.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<GlobalEdit size={20} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Personalización</Typography>
										<Typography variant="body2">
											El enlace incluye tu nombre profesional y se presenta con un formato amigable para proyectar una imagen profesional.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<ClipboardTick size={20} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Cómo Compartirlo</Typography>
										<Typography variant="body2">
											Utiliza el botón "Copiar" para obtener la URL completa que podrás compartir por cualquier medio.
										</Typography>
									</Box>
								</Box>
							</Stack>
						</Box>
					</Paper>

					<Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
						Dónde compartir tu enlace:
					</Typography>

					<Grid container spacing={2}>
						<Grid item xs={12} sm={6}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
								<Box display="flex" alignItems="flex-start" mb={1}>
									<MessageText1 size={24} style={{ color: theme.palette.info.main, marginRight: "8px", marginTop: "2px" }} />
									<Typography variant="subtitle1" fontWeight="bold">
										Firma de Correo
									</Typography>
								</Box>
								<Typography variant="body2">
									Añade el enlace a la firma de tu correo electrónico con un texto como "Agenda una consulta conmigo" para facilitar a tus
									contactos la programación de citas.
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
								<Box display="flex" alignItems="flex-start" mb={1}>
									<Mobile size={24} style={{ color: theme.palette.info.main, marginRight: "8px", marginTop: "2px" }} />
									<Typography variant="subtitle1" fontWeight="bold">
										Redes Sociales
									</Typography>
								</Box>
								<Typography variant="body2">
									Comparte el enlace en tus perfiles profesionales de redes sociales o como respuesta a consultas iniciales que recibas por
									estos canales.
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
								<Box display="flex" alignItems="flex-start" mb={1}>
									<GlobalEdit size={24} style={{ color: theme.palette.info.main, marginRight: "8px", marginTop: "2px" }} />
									<Typography variant="subtitle1" fontWeight="bold">
										Sitio Web
									</Typography>
								</Box>
								<Typography variant="body2">
									Si tienes un sitio web profesional, incluye un botón destacado con el enlace para que los visitantes puedan programar
									citas directamente.
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
								<Box display="flex" alignItems="flex-start" mb={1}>
									<People size={24} style={{ color: theme.palette.info.main, marginRight: "8px", marginTop: "2px" }} />
									<Typography variant="subtitle1" fontWeight="bold">
										Comunicación Directa
									</Typography>
								</Box>
								<Typography variant="body2">
									Envía el enlace directamente a clientes que necesiten programar una cita, ahorrando tiempo en intercambios de mensajes
									para coordinar horarios.
								</Typography>
							</Paper>
						</Grid>
					</Grid>

					<Alert severity="warning" sx={{ mt: 3 }}>
						<AlertTitle>Importante</AlertTitle>
						<Typography>
							El enlace refleja siempre tu configuración actual de disponibilidad. Si modificas tus horarios o parámetros, estos cambios se
							aplicarán automáticamente sin necesidad de actualizar o cambiar la URL compartida.
						</Typography>
					</Alert>
				</>
			),
		},
	];

	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
				<Calendar variant="Bulk" size={28} style={{ marginRight: "12px", color: theme.palette.error.main }} />
				<Typography variant="h3">Guía del Sistema de Citas</Typography>
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

export default BookingContent;
