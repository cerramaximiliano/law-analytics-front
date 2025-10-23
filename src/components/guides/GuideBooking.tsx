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
	UserTick,
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

// ==============================|| GUÍA DE CITAS - COMPONENTES INTERNOS ||============================== //

// Estilo de papel personalizado
const StyledPaper = styled(Paper)(({ theme }) => ({
	margin: "16px 0",
	overflow: "hidden",
	borderRadius: "12px",
	boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}));

// Componentes de contenido para cada paso
const IntroductionContent = () => {
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>
				Esta guía te mostrará cómo utilizar el sistema de citas para configurar tu disponibilidad y permitir a tus clientes programar
				consultas directamente.
			</Typography>
			<Alert severity="info">
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
		</Stack>
	);
};

const AccessConfigurationContent = () => {
	const theme = useTheme();
	return (
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

			<StyledPaper>
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
			</StyledPaper>

			<Alert severity="success" sx={{ mt: 3 }}>
				Una vez completada la configuración, el sistema estará listo para recibir reservas de citas según tus parámetros establecidos.
			</Alert>
		</>
	);
};

const DetailedConfigurationContent = () => {
	const theme = useTheme();
	return (
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
							Define las horas de inicio y fin de tu jornada de atención para cada día. Puedes establecer distintos horarios para diferentes
							días según tus necesidades.
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
							Configura un margen de tiempo entre consultas consecutivas para prepararte, revisar notas o simplemente descansar brevemente
							entre atenciones.
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			<StyledPaper sx={{ mt: 3 }}>
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
									Bloquea fechas específicas en las que no estarás disponible, como vacaciones, días festivos o compromisos previos. Puedes
									añadir un motivo opcional para tu referencia.
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
									Configura límites diarios o semanales de citas para evitar sobrecarga en tu agenda y mantener un equilibrio saludable en
									tu trabajo.
								</Typography>
							</Box>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>
		</>
	);
};

const FormCustomizationContent = () => {
	const theme = useTheme();
	return (
		<>
			<Typography paragraph>
				El sistema te permite personalizar el formulario que tus clientes completarán al agendar una cita, recopilando exactamente la
				información que necesitas:
			</Typography>

			<StyledPaper>
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
			</StyledPaper>

			<StyledPaper sx={{ mt: 3 }}>
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
								<Typography variant="caption">Para selección de categorías predefinidas (tipo de consulta, jurisdicción, etc.).</Typography>
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
			</StyledPaper>

			<Alert severity="info" sx={{ mt: 3 }}>
				<AlertTitle>Consejo profesional</AlertTitle>
				<Typography>
					Solicita solo la información realmente necesaria para la consulta inicial. Un formulario demasiado extenso puede disuadir a
					potenciales clientes de completar el proceso de reserva. Puedes recopilar información más detallada durante la cita.
				</Typography>
			</Alert>
		</>
	);
};

const ReservationManagementContent = () => {
	const theme = useTheme();
	return (
		<>
			<Typography paragraph>Una vez configurado tu sistema, podrás gestionar fácilmente las reservas que realicen tus clientes:</Typography>

			<StyledPaper>
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
									Puedes rechazar solicitudes que no puedas atender o cancelar citas ya confirmadas, añadiendo opcionalmente un motivo que
									se compartirá con el cliente.
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
									Accede a toda la información proporcionada por el cliente al momento de la reserva, incluyendo los campos personalizados
									que hayas configurado.
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
			</StyledPaper>

			<StyledPaper sx={{ mt: 3 }}>
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
			</StyledPaper>

			<Alert severity="success" sx={{ mt: 3 }}>
				<AlertTitle>Integración con el Calendario</AlertTitle>
				<Typography>
					Todas las citas confirmadas se integran automáticamente con tu calendario principal, evitando conflictos de horarios con otros
					eventos y permitiéndote tener una visión completa de tu agenda en un solo lugar.
				</Typography>
			</Alert>
		</>
	);
};

const ClientLinkContent = () => {
	const theme = useTheme();
	return (
		<>
			<Typography paragraph>
				Una vez configurada tu disponibilidad, el sistema genera un enlace personalizado que puedes compartir con tus clientes para que
				programen citas:
			</Typography>

			<StyledPaper>
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
			</StyledPaper>

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
							Si tienes un sitio web profesional, incluye un botón destacado con el enlace para que los visitantes puedan programar citas
							directamente.
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
							Envía el enlace directamente a clientes que necesiten programar una cita, ahorrando tiempo en intercambios de mensajes para
							coordinar horarios.
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
	);
};

const ClientExperienceContent = () => {
	const theme = useTheme();
	return (
		<>
			<Typography paragraph>
				Para entender mejor el proceso, es útil conocer la experiencia que tendrán tus clientes al usar el sistema de citas:
			</Typography>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Proceso de Reserva desde la Perspectiva del Cliente
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Box sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.grey[100], 0.5), borderRadius: "8px" }}>
						<Typography variant="subtitle2" gutterBottom color="primary">
							Paso 1: Acceso al Portal de Citas
						</Typography>
						<Typography paragraph>
							El cliente hace clic en el enlace que has compartido y accede a una página profesional con tu nombre y la descripción de tu
							servicio de citas.
						</Typography>
					</Box>

					<Box sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.grey[100], 0.5), borderRadius: "8px" }}>
						<Typography variant="subtitle2" gutterBottom color="primary">
							Paso 2: Selección de Fecha y Hora
						</Typography>
						<Typography paragraph>Se presenta un calendario intuitivo donde el cliente puede:</Typography>
						<ul>
							<li>Ver claramente los días disponibles (los no disponibles aparecen deshabilitados)</li>
							<li>Seleccionar una fecha específica para ver los horarios disponibles en ese día</li>
							<li>Elegir un horario entre las opciones disponibles, presentadas en bloques según la duración configurada</li>
						</ul>
					</Box>

					<Box sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.grey[100], 0.5), borderRadius: "8px" }}>
						<Typography variant="subtitle2" gutterBottom color="primary">
							Paso 3: Formulario de Información
						</Typography>
						<Typography paragraph>Después de elegir fecha y hora, el cliente completa un formulario con:</Typography>
						<ul>
							<li>Campos básicos de contacto (según lo que hayas configurado como obligatorio)</li>
							<li>Los campos personalizados que hayas definido para recopilar información adicional</li>
							<li>Aceptación de términos y condiciones si los has establecido</li>
						</ul>
					</Box>

					<Box sx={{ p: 2, bgcolor: alpha(theme.palette.grey[100], 0.5), borderRadius: "8px" }}>
						<Typography variant="subtitle2" gutterBottom color="primary">
							Paso 4: Confirmación y Recordatorios
						</Typography>
						<Typography paragraph>Una vez completada la reserva, el cliente:</Typography>
						<ul>
							<li>Recibe una página de confirmación con el resumen de su cita y un código de confirmación</li>
							<li>Se le envía un correo electrónico automático con los detalles de la cita</li>
							<li>Si has configurado aprobación manual, se le informa que recibirá una confirmación una vez que apruebes la cita</li>
							<li>Recibe recordatorios automáticos por correo electrónico antes de la fecha de la cita</li>
						</ul>
					</Box>
				</Box>
			</StyledPaper>

			<Alert severity="success" sx={{ mt: 3 }}>
				<AlertTitle>Beneficios para el Cliente</AlertTitle>
				<Typography paragraph>Este sistema ofrece una experiencia profesional que beneficia a tus clientes de múltiples formas:</Typography>
				<Stack spacing={1}>
					<Box display="flex" alignItems="center">
						<TickSquare size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Flexibilidad para programar citas en el momento que les resulte conveniente</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<TickSquare size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Visualización clara de tu disponibilidad sin necesidad de intercambios de mensajes</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<TickSquare size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Confirmación inmediata y recordatorios automáticos para no olvidar la cita</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<TickSquare size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Experiencia profesional que genera confianza desde el primer contacto</Typography>
					</Box>
				</Stack>
			</Alert>
		</>
	);
};

const NotificationsRemindersContent = () => {
	const theme = useTheme();
	return (
		<>
			<Typography paragraph>
				El sistema de citas incluye un completo sistema de notificaciones y recordatorios para mantenerte informado y ayudarte a gestionar
				tu agenda de manera eficiente:
			</Typography>

			<Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
				<Grid item xs={12} md={6}>
					<StyledPaper>
						<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant="subtitle1" fontWeight="bold">
								Notificaciones para Ti
							</Typography>
						</Box>
						<Box sx={{ p: 2 }}>
							<Stack spacing={2}>
								<Box display="flex" alignItems="flex-start">
									<UserAdd size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Nuevas Reservas</Typography>
										<Typography variant="body2">
											Recibes notificaciones inmediatas cuando un cliente programa una nueva cita, permitiéndote revisar y confirmar
											rápidamente.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<NotificationCircle size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Recordatorios de Citas</Typography>
										<Typography variant="body2">
											El sistema te envía recordatorios automáticos antes de tus citas programadas para ayudarte a prepararte adecuadamente.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<Trash size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Cancelaciones</Typography>
										<Typography variant="body2">
											Si un cliente cancela su cita, recibirás una notificación inmediata para que puedas actualizar tu agenda.
										</Typography>
									</Box>
								</Box>
							</Stack>
						</Box>
					</StyledPaper>
				</Grid>

				<Grid item xs={12} md={6}>
					<StyledPaper>
						<Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant="subtitle1" fontWeight="bold">
								Notificaciones para tus Clientes
							</Typography>
						</Box>
						<Box sx={{ p: 2 }}>
							<Stack spacing={2}>
								<Box display="flex" alignItems="flex-start">
									<ClipboardTick size={18} style={{ minWidth: "24px", color: theme.palette.info.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Confirmación de Reserva</Typography>
										<Typography variant="body2">
											Los clientes reciben un correo electrónico inmediato confirmando que su solicitud ha sido recibida, con todos los
											detalles de la cita.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<UserTick size={18} style={{ minWidth: "24px", color: theme.palette.info.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Aprobación de Cita</Typography>
										<Typography variant="body2">
											Si tienes activada la aprobación manual, los clientes recibirán una notificación cuando confirmes su cita.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<Calendar1 size={18} style={{ minWidth: "24px", color: theme.palette.info.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Recordatorios Previos</Typography>
										<Typography variant="body2">
											Se envían recordatorios automáticos 24 horas antes de la cita para reducir las ausencias y mejorar la puntualidad.
										</Typography>
									</Box>
								</Box>
							</Stack>
						</Box>
					</StyledPaper>
				</Grid>
			</Grid>

			<StyledPaper sx={{ mt: 3 }}>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Canales de Notificación
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={2}>
						<Box display="flex" alignItems="flex-start">
							<MessageText1 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Correo Electrónico</Typography>
								<Typography variant="body2">
									Todas las notificaciones se envían por correo electrónico con un formato profesional y claro, incluyendo todos los
									detalles relevantes.
								</Typography>
							</Box>
						</Box>
						<Box display="flex" alignItems="flex-start">
							<NotificationCircle size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Notificaciones en la Plataforma</Typography>
								<Typography variant="body2">
									Cuando estás usando la plataforma, recibirás notificaciones en tiempo real en el ícono de notificaciones de la barra
									superior.
								</Typography>
							</Box>
						</Box>
						<Box display="flex" alignItems="flex-start">
							<Mobile size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Notificaciones Push (Opcional)</Typography>
								<Typography variant="body2">
									Si has habilitado las notificaciones del navegador, puedes recibir alertas incluso cuando no tengas la plataforma abierta.
								</Typography>
							</Box>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<Alert severity="info" sx={{ mt: 3 }}>
				<AlertTitle>Configuración de Notificaciones</AlertTitle>
				<Typography>
					Puedes personalizar qué notificaciones deseas recibir y por qué canales desde la sección de configuración de tu perfil. Los
					recordatorios para clientes son siempre enviados para garantizar un servicio profesional.
				</Typography>
			</Alert>
		</>
	);
};

const SystemBenefitsContent = () => {
	const theme = useTheme();
	return (
		<>
			<Typography paragraph>
				Implementar el sistema de citas en tu práctica profesional ofrece numerosas ventajas tanto para ti como para tus clientes:
			</Typography>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Ventajas para tu Práctica Profesional
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<Box display="flex" alignItems="flex-start" mb={2}>
								<Clock size={20} style={{ marginRight: "8px", color: theme.palette.success.main, marginTop: "3px" }} />
								<Box>
									<Typography fontWeight="bold">Ahorro de Tiempo</Typography>
									<Typography variant="body2">
										Elimina los intercambios de correos y mensajes para coordinar horarios, permitiéndote enfocarte en tu trabajo.
									</Typography>
								</Box>
							</Box>
						</Grid>
						<Grid item xs={12} md={6}>
							<Box display="flex" alignItems="flex-start" mb={2}>
								<Calendar1 size={20} style={{ marginRight: "8px", color: theme.palette.success.main, marginTop: "3px" }} />
								<Box>
									<Typography fontWeight="bold">Optimización de Agenda</Typography>
									<Typography variant="body2">
										Establece horarios específicos para consultas, evitando interrupciones en otras actividades profesionales.
									</Typography>
								</Box>
							</Box>
						</Grid>
						<Grid item xs={12} md={6}>
							<Box display="flex" alignItems="flex-start" mb={2}>
								<TickSquare size={20} style={{ marginRight: "8px", color: theme.palette.success.main, marginTop: "3px" }} />
								<Box>
									<Typography fontWeight="bold">Reducción de Ausencias</Typography>
									<Typography variant="body2">
										Los recordatorios automáticos disminuyen significativamente las citas perdidas o los retrasos de los clientes.
									</Typography>
								</Box>
							</Box>
						</Grid>
						<Grid item xs={12} md={6}>
							<Box display="flex" alignItems="flex-start" mb={2}>
								<UserTick size={20} style={{ marginRight: "8px", color: theme.palette.success.main, marginTop: "3px" }} />
								<Box>
									<Typography fontWeight="bold">Imagen Profesional</Typography>
									<Typography variant="body2">
										Proyecta una imagen de organización y profesionalismo que impresiona positivamente a los clientes.
									</Typography>
								</Box>
							</Box>
						</Grid>
						<Grid item xs={12} md={6}>
							<Box display="flex" alignItems="flex-start" mb={2}>
								<Diagram size={20} style={{ marginRight: "8px", color: theme.palette.success.main, marginTop: "3px" }} />
								<Box>
									<Typography fontWeight="bold">Análisis de Datos</Typography>
									<Typography variant="body2">
										Obtén información valiosa sobre patrones de citas, horarios más solicitados y tasas de conversión.
									</Typography>
								</Box>
							</Box>
						</Grid>
						<Grid item xs={12} md={6}>
							<Box display="flex" alignItems="flex-start" mb={2}>
								<MessageText1 size={20} style={{ marginRight: "8px", color: theme.palette.success.main, marginTop: "3px" }} />
								<Box>
									<Typography fontWeight="bold">Información Previa</Typography>
									<Typography variant="body2">
										Recibe información relevante antes de la cita, permitiéndote prepararte adecuadamente para cada consulta.
									</Typography>
								</Box>
							</Box>
						</Grid>
					</Grid>
				</Box>
			</StyledPaper>

			<StyledPaper sx={{ mt: 3 }}>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Ventajas para tus Clientes
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<Box display="flex" alignItems="flex-start" mb={2}>
								<GlobalEdit size={20} style={{ marginRight: "8px", color: theme.palette.info.main, marginTop: "3px" }} />
								<Box>
									<Typography fontWeight="bold">Comodidad 24/7</Typography>
									<Typography variant="body2">
										Pueden programar citas en cualquier momento, incluso fuera del horario laboral, sin necesidad de llamadas telefónicas.
									</Typography>
								</Box>
							</Box>
						</Grid>
						<Grid item xs={12} md={6}>
							<Box display="flex" alignItems="flex-start" mb={2}>
								<People size={20} style={{ marginRight: "8px", color: theme.palette.info.main, marginTop: "3px" }} />
								<Box>
									<Typography fontWeight="bold">Visualización Clara</Typography>
									<Typography variant="body2">
										Ven claramente tu disponibilidad real, evitando frustraciones por intentar agendar en horarios ya ocupados.
									</Typography>
								</Box>
							</Box>
						</Grid>
						<Grid item xs={12} md={6}>
							<Box display="flex" alignItems="flex-start" mb={2}>
								<NotificationCircle size={20} style={{ marginRight: "8px", color: theme.palette.info.main, marginTop: "3px" }} />
								<Box>
									<Typography fontWeight="bold">Recordatorios Automáticos</Typography>
									<Typography variant="body2">
										Reciben recordatorios oportunos que les ayudan a no olvidar su cita y a llegar puntuales.
									</Typography>
								</Box>
							</Box>
						</Grid>
						<Grid item xs={12} md={6}>
							<Box display="flex" alignItems="flex-start" mb={2}>
								<ClipboardTick size={20} style={{ marginRight: "8px", color: theme.palette.info.main, marginTop: "3px" }} />
								<Box>
									<Typography fontWeight="bold">Confirmación Inmediata</Typography>
									<Typography variant="body2">
										Obtienen una confirmación inmediata con todos los detalles de la cita para su tranquilidad.
									</Typography>
								</Box>
							</Box>
						</Grid>
					</Grid>
				</Box>
			</StyledPaper>

			<Alert severity="success" sx={{ mt: 3 }}>
				<AlertTitle>Optimización del Flujo de Trabajo</AlertTitle>
				<Typography paragraph>
					El sistema de citas se integra perfectamente con el resto de las funcionalidades de la plataforma, permitiéndote:
				</Typography>
				<ul>
					<li>
						<strong>Vincular citas a expedientes</strong> - Conecta automáticamente cada consulta con su causa correspondiente
					</li>
					<li>
						<strong>Centralizar información</strong> - Mantén todos los datos del cliente y su historial en un solo lugar
					</li>
					<li>
						<strong>Automatizar seguimientos</strong> - Configura recordatorios para acciones posteriores a la consulta
					</li>
					<li>
						<strong>Profesionalizar tu servicio</strong> - Ofrece una experiencia completa desde el primer contacto hasta el seguimiento
					</li>
				</ul>
			</Alert>
		</>
	);
};

const BestPracticesContent = () => {
	const theme = useTheme();
	return (
		<>
			<Typography paragraph>Para aprovechar al máximo el sistema de citas, te recomendamos seguir estas mejores prácticas:</Typography>

			<Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
				<Grid item xs={12} md={6}>
					<StyledPaper>
						<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant="subtitle1" fontWeight="bold">
								Configuración Efectiva
							</Typography>
						</Box>
						<Box sx={{ p: 2 }}>
							<Stack spacing={2}>
								<Box display="flex" alignItems="flex-start">
									<Setting2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Duración Realista</Typography>
										<Typography variant="body2">
											Configura la duración de las citas considerando no solo el tiempo de la consulta, sino también la preparación y
											documentación posterior.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<Timer1 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Buffers Adecuados</Typography>
										<Typography variant="body2">
											Incluye tiempo de descanso suficiente entre citas (15-30 minutos) para manejar consultas que se extiendan y para
											prepararte adecuadamente.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<Calendar1 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Bloques de Agenda</Typography>
										<Typography variant="body2">
											Considera definir bloques específicos para citas (ej: mañanas de lunes a miércoles) manteniendo otros momentos libres
											para trabajo sin interrupciones.
										</Typography>
									</Box>
								</Box>
							</Stack>
						</Box>
					</StyledPaper>
				</Grid>

				<Grid item xs={12} md={6}>
					<StyledPaper>
						<Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant="subtitle1" fontWeight="bold">
								Gestión de Clientes
							</Typography>
						</Box>
						<Box sx={{ p: 2 }}>
							<Stack spacing={2}>
								<Box display="flex" alignItems="flex-start">
									<People size={18} style={{ minWidth: "24px", color: theme.palette.success.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Aprobación Manual</Typography>
										<Typography variant="body2">
											Para clientes nuevos, considera activar la aprobación manual para valorar primero si la consulta corresponde a tu área
											de especialización.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<UserTick size={18} style={{ minWidth: "24px", color: theme.palette.success.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Comunicación Previa</Typography>
										<Typography variant="body2">
											Envía un mensaje personalizado de confirmación incluyendo cualquier información o documentación que el cliente deba
											preparar para la consulta.
										</Typography>
									</Box>
								</Box>
								<Box display="flex" alignItems="flex-start">
									<MessageText1 size={18} style={{ minWidth: "24px", color: theme.palette.success.main, marginTop: "3px" }} />
									<Box>
										<Typography fontWeight="bold">Campos Personalizados Estratégicos</Typography>
										<Typography variant="body2">
											Diseña campos personalizados que recopilen información crítica para preparar mejor la consulta sin sobrecargar el
											formulario.
										</Typography>
									</Box>
								</Box>
							</Stack>
						</Box>
					</StyledPaper>
				</Grid>
			</Grid>

			<StyledPaper sx={{ mt: 3 }}>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Promoción y Uso Estratégico
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Typography paragraph>Maximiza el beneficio de tu sistema de citas con estas estrategias:</Typography>

					<Grid container spacing={2}>
						<Grid item xs={12} sm={6}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
								<Box display="flex" alignItems="flex-start" mb={1}>
									<GlobalEdit size={20} style={{ marginRight: "8px", color: theme.palette.info.main, marginTop: "3px" }} />
									<Typography variant="subtitle2" fontWeight="bold">
										Promoción Activa
									</Typography>
								</Box>
								<Typography variant="body2">
									Menciona la posibilidad de agendar citas online en todas tus comunicaciones y destaca la conveniencia para el cliente.
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
								<Box display="flex" alignItems="flex-start" mb={1}>
									<UserSearch size={20} style={{ marginRight: "8px", color: theme.palette.info.main, marginTop: "3px" }} />
									<Typography variant="subtitle2" fontWeight="bold">
										Personalización del Enlace
									</Typography>
								</Box>
								<Typography variant="body2">
									Asegúrate de que tu nombre profesional aparezca correctamente en el enlace y la página de reserva para fortalecer tu marca
									personal.
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
								<Box display="flex" alignItems="flex-start" mb={1}>
									<Diagram size={20} style={{ marginRight: "8px", color: theme.palette.info.main, marginTop: "3px" }} />
									<Typography variant="subtitle2" fontWeight="bold">
										Análisis Regular
									</Typography>
								</Box>
								<Typography variant="body2">
									Revisa periódicamente los patrones de reservas para identificar horarios de alta demanda y ajustar tu disponibilidad según
									sea necesario.
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
								<Box display="flex" alignItems="flex-start" mb={1}>
									<Calendar1 size={20} style={{ marginRight: "8px", color: theme.palette.info.main, marginTop: "3px" }} />
									<Typography variant="subtitle2" fontWeight="bold">
										Mantenimiento Actualizado
									</Typography>
								</Box>
								<Typography variant="body2">
									Actualiza regularmente tu disponibilidad para reflejar cambios en tu agenda, períodos de vacaciones o modificaciones en tu
									horario de trabajo.
								</Typography>
							</Paper>
						</Grid>
					</Grid>
				</Box>
			</StyledPaper>

			<Alert severity="info" sx={{ mt: 3 }}>
				<AlertTitle>Evolución Continua</AlertTitle>
				<Typography>
					El sistema de citas está diseñado para adaptarse a tus necesidades. A medida que lo utilices, identifica oportunidades de mejora
					en tu configuración e implementa ajustes para optimizar tanto tu experiencia como la de tus clientes.
				</Typography>
			</Alert>
		</>
	);
};

// ==============================|| COMPONENTE PRINCIPAL DE GUÍA DE CITAS ||============================== //

interface GuideBookingProps {
	open: boolean;
	onClose: () => void;
}

const GuideBooking: React.FC<GuideBookingProps> = ({ open, onClose }) => {
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
			title: "Sistema de Citas Online",
			content: <IntroductionContent />,
		},
		{
			title: "Acceso y Configuración",
			content: <AccessConfigurationContent />,
		},
		{
			title: "Configuración Detallada",
			content: <DetailedConfigurationContent />,
		},
		{
			title: "Personalización de Formularios",
			content: <FormCustomizationContent />,
		},
		{
			title: "Gestión de Reservas",
			content: <ReservationManagementContent />,
		},
		{
			title: "Enlace para Clientes",
			content: <ClientLinkContent />,
		},
		{
			title: "Experiencia del Cliente",
			content: <ClientExperienceContent />,
		},
		{
			title: "Notificaciones y Recordatorios",
			content: <NotificationsRemindersContent />,
		},
		{
			title: "Beneficios del Sistema",
			content: <SystemBenefitsContent />,
		},
		{
			title: "Mejores Prácticas",
			content: <BestPracticesContent />,
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
					<Calendar variant="Bulk" size={28} style={{ marginRight: "12px", color: theme.palette.primary.main }} />
					<Typography variant="h3">Guía del Sistema de Citas</Typography>
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

				<Box sx={{ p: 3 }}>{steps[activeStep] && steps[activeStep].content}</Box>
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

export default GuideBooking;
