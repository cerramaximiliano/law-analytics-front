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
	NotificationCircle,
	Sms,
	Add,
	Edit2,
	Trash,
	FolderAdd,
	Category,
	Grid6,
	TableDocument,
	Link21,
	Clock,
	Timer1,
	People,
	TickSquare,
	ClipboardTick,
	Diagram,
	UserTick,
	Setting2,
	Save2,
} from "iconsax-react";

// ==============================|| GUÍA CALENDARIO - ESTILOS ||============================== //

const StyledPaper = styled(Paper)(({ theme }) => ({
	margin: "16px 0",
	overflow: "hidden",
	borderRadius: "12px",
	boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}));

// ==============================|| GUÍA CALENDARIO - COMPONENTES DE CONTENIDO ||============================== //

const IntroductionContent = () => {
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				Esta guía te mostrará cómo utilizar el calendario para organizar tus eventos legales, gestionar recordatorios y vincular actividades
				a tus causas.
			</Typography>
			<Alert severity="info">
				<AlertTitle>Funcionalidades principales:</AlertTitle>
				<Typography component="div">
					<ul>
						<li>Crear y gestionar eventos como audiencias, vencimientos y reuniones</li>
						<li>Recibir recordatorios automáticos por correo electrónico y notificaciones web</li>
						<li>Vincular eventos a causas específicas para un mejor seguimiento</li>
						<li>Visualizar tu agenda en diferentes formatos (mes, semana, día, lista)</li>
						<li>Filtrar eventos por tipo y causa relacionada</li>
						<li>Configurar tu disponibilidad para permitir a tus clientes programar citas</li>
						<li>Gestionar de forma profesional tus citas y consultas con clientes</li>
					</ul>
				</Typography>
			</Alert>
		</Stack>
	);
};

const NavigationContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>El calendario ofrece múltiples vistas que puedes personalizar según tus necesidades:</Typography>
			<Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2) }}>
				<Stack spacing={2}>
					<Box display="flex" alignItems="center">
						<Category size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>
							<strong>Vista Mensual:</strong> Muestra todos los eventos del mes, ideal para planificación a largo plazo
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<Grid6 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>
							<strong>Vista Semanal:</strong> Muestra los eventos de la semana con detalle horario
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<Calendar1 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>
							<strong>Vista Diaria:</strong> Muestra todos los eventos del día seleccionado con máximo detalle
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<TableDocument size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>
							<strong>Vista Agenda:</strong> Muestra los eventos como una lista cronológica
						</Typography>
					</Box>
				</Stack>
			</Paper>
			<Typography paragraph>
				Para navegar entre fechas, utiliza las flechas de navegación o haz clic en el botón "Hoy" para volver rápidamente a la fecha actual.
			</Typography>
		</Stack>
	);
};

const EventCreationContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>Para crear un nuevo evento en el calendario, puedes hacerlo de dos formas:</Typography>
			<Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.2) }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Método 1: Botón de Agregar
				</Typography>
				<Stack spacing={2}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Haz clic en el botón circular con el símbolo "+ " ubicado en la esquina inferior derecha</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Se abrirá el formulario de nuevo evento</Typography>
					</Box>
				</Stack>
			</Paper>

			<Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.2) }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Método 2: Selección de Fecha/Hora
				</Typography>
				<Stack spacing={2}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Haz clic y arrastra sobre el calendario para seleccionar un rango de fecha/hora</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>El formulario se abrirá automáticamente con las fechas preseleccionadas</Typography>
					</Box>
				</Stack>
			</Paper>

			<Alert severity="success" sx={{ mb: 2 }}>
				<AlertTitle>Tipos de eventos disponibles</AlertTitle>
				<Typography component="div">
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
			</Alert>

			<Typography paragraph>
				Al crear un evento, es posible vincularlo a una causa específica, lo que te permitirá mantener un seguimiento organizado de todas
				las actividades relacionadas con cada expediente.
			</Typography>
		</Stack>
	);
};

const EventFormContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>El formulario para crear o editar un evento contiene los siguientes campos:</Typography>
			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Datos Básicos
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>
								<strong>Título:</strong> Nombre descriptivo del evento
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>
								<strong>Descripción:</strong> Detalles adicionales sobre el evento
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>
								<strong>Tipo:</strong> Categoría del evento (Audiencia, Vencimiento, Reunión, Otro)
							</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Fecha y Hora
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
							<Typography>
								<strong>Fecha Inicio:</strong> Cuándo comienza el evento
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
							<Typography>
								<strong>Fecha Fin:</strong> Cuándo termina el evento
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
							<Typography>
								<strong>Todo el día:</strong> Opción para eventos que duran todo el día
							</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Vinculación (visible al editar desde una causa)
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.success.main }} />
							<Typography>
								<strong>Causa vinculada:</strong> Expediente al que está asociado el evento
							</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>
		</Stack>
	);
};

const EventManagementContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>Una vez creados los eventos, puedes gestionarlos de diversas formas:</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Edit2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Editar Evento
							</Typography>
						</Box>
						<Typography variant="body2">
							Haz clic sobre un evento para abrir el formulario de edición donde podrás modificar todos sus datos.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Trash size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Eliminar Evento
							</Typography>
						</Box>
						<Typography variant="body2">
							Dentro del formulario de edición, encontrarás un botón de papelera para eliminar el evento seleccionado.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Clock size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Mover Evento
							</Typography>
						</Box>
						<Typography variant="body2">
							Arrastra y suelta un evento para cambiarlo a una nueva fecha u hora, manteniendo todas sus propiedades.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Timer1 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Modificar Duración
							</Typography>
						</Box>
						<Typography variant="body2">
							En las vistas Día y Semana, puedes estirar el evento desde sus bordes para modificar su duración.
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			<Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
				Navegación y filtros:
			</Typography>

			<Box sx={{ bgcolor: alpha(theme.palette.info.lighter, 0.1), p: 2, borderRadius: "8px" }}>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<Category size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>
							<strong>Cambiar Vistas:</strong> Utiliza los botones de la barra superior para alternar entre vistas (Mes, Semana, Día,
							Agenda)
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>
							<strong>Navegar entre fechas:</strong> Usa las flechas de navegación o el botón "Hoy" para moverte entre períodos
						</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<Link21 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>
							<strong>Eventos vinculados:</strong> Los eventos vinculados a causas incluyen un indicador con el nombre de la causa
						</Typography>
					</Box>
				</Stack>
			</Box>
		</Stack>
	);
};

const RemindersContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				El sistema de calendario incluye un completo sistema de recordatorios para que nunca pierdas un evento importante:
			</Typography>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Tipos de Notificaciones
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={2}>
						<Box display="flex" alignItems="flex-start">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Notificaciones por Correo Electrónico</Typography>
								<Typography variant="body2">
									Recibirás un correo electrónico con recordatorio de tus eventos programados, configurable para ser enviado con diferentes
									anticipaciones (1 día, 3 días o 1 semana antes).
								</Typography>
							</Box>
						</Box>
						<Box display="flex" alignItems="flex-start">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Notificaciones Web</Typography>
								<Typography variant="body2">
									Cuando estés utilizando la plataforma, recibirás notificaciones dentro de la aplicación para eventos próximos, apareciendo
									en el ícono de notificaciones en la barra superior.
								</Typography>
							</Box>
						</Box>
						<Box display="flex" alignItems="flex-start">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Notificaciones Push</Typography>
								<Typography variant="body2">
									Si has permitido las notificaciones del navegador, recibirás alertas incluso cuando no tengas la aplicación abierta,
									manteniéndote informado de todos tus eventos importantes.
								</Typography>
							</Box>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<Alert severity="info" sx={{ mt: 3 }}>
				<AlertTitle>Configuración de Notificaciones</AlertTitle>
				<Typography paragraph>
					Puedes personalizar tus preferencias de notificación en la sección "Configuración" de tu perfil, donde podrás elegir:
				</Typography>
				<ul>
					<li>Qué tipos de eventos deseas recibir notificaciones (Audiencias, Vencimientos, Reuniones, etc.)</li>
					<li>Con cuánta anticipación quieres ser notificado</li>
					<li>Por qué medios prefieres recibir las notificaciones (correo, web, push)</li>
				</ul>
			</Alert>
		</Stack>
	);
};

const CauseLinkingContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>Una de las características más útiles del calendario es su integración con el sistema de causas:</Typography>

			<Box sx={{ bgcolor: alpha(theme.palette.primary.lighter, 0.1), p: 2, borderRadius: "8px", mb: 3 }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Creación de Eventos desde Causas:
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Accede a la vista detallada de la causa</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Navega a la pestaña "Calendario" o "Eventos"</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Haz clic en "Agregar Evento" para crear un evento ya vinculado a esa causa</Typography>
					</Box>
				</Stack>
			</Box>

			<Box sx={{ bgcolor: alpha(theme.palette.success.lighter, 0.1), p: 2, borderRadius: "8px", mb: 3 }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Vinculación desde el Calendario:
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Crea un nuevo evento o edita uno existente</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>En el formulario, busca el campo "Vincular a causa"</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Selecciona la causa de la lista desplegable</Typography>
					</Box>
				</Stack>
			</Box>

			<Alert severity="warning" sx={{ mb: 2 }}>
				<AlertTitle>Importante</AlertTitle>
				<Typography>
					Los eventos vinculados a causas aparecerán tanto en el calendario general como en la vista específica de la causa, permitiéndote
					tener una visión completa de tu agenda y de los eventos relacionados con cada expediente.
				</Typography>
			</Alert>

			<Typography paragraph>
				La vinculación de eventos a causas te permite organizar mejor tu trabajo, priorizar tareas según los casos más urgentes y mantener
				un registro detallado de todas las actividades relacionadas con cada expediente.
			</Typography>
		</Stack>
	);
};

const AppointmentConfigContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>
				El sistema de calendario te permite configurar tu disponibilidad para que los clientes puedan programar citas directamente:
			</Typography>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Acceso a la Sección de Disponibilidad
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={2}>
						<Box display="flex" alignItems="flex-start">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Desde el Calendario Principal</Typography>
								<Typography variant="body2">
									Accede al calendario y haz clic en el botón "Citas" ubicado en el menú de la izquierda bajo Calendario.
								</Typography>
							</Box>
						</Box>
						<Box display="flex" alignItems="flex-start">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Desde tu Perfil de Usuario</Typography>
								<Typography variant="body2">
									También puedes acceder desde tu perfil, en la sección "Configuración" {" -> "} "Calendario y Citas" {" -> "} "Citas".
								</Typography>
							</Box>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<StyledPaper sx={{ mt: 3 }}>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Configuración de Horarios Disponibles
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={2}>
						<Box display="flex" alignItems="flex-start">
							<Setting2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Selección de Días</Typography>
								<Typography variant="body2">
									Selecciona los días de la semana en los que estás disponible para atender citas. Puedes configurar disponibilidades
									diferentes para cada día.
								</Typography>
							</Box>
						</Box>
						<Box display="flex" alignItems="flex-start">
							<Clock size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Horarios Disponibles</Typography>
								<Typography variant="body2">
									Para cada día seleccionado, configura las franjas horarias en las que deseas recibir citas, por ejemplo, de 9:00 a 12:00 y
									de 15:00 a 18:00.
								</Typography>
							</Box>
						</Box>
						<Box display="flex" alignItems="flex-start">
							<Calendar1 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Fechas Específicas No Disponibles</Typography>
								<Typography variant="body2">
									Bloquea fechas específicas en las que no estarás disponible (vacaciones, feriados, etc.) para evitar que se programen
									citas en esos días.
								</Typography>
							</Box>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<StyledPaper sx={{ mt: 3 }}>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Configuración de Citas
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={2}>
						<Box display="flex" alignItems="flex-start">
							<Timer1 size={18} style={{ minWidth: "24px", color: theme.palette.success.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Duración de las Citas</Typography>
								<Typography variant="body2">
									Define la duración estándar de tus citas (30 minutos, 1 hora, etc.). También puedes crear diferentes tipos de citas con
									duraciones específicas.
								</Typography>
							</Box>
						</Box>
						<Box display="flex" alignItems="flex-start">
							<Diagram size={18} style={{ minWidth: "24px", color: theme.palette.success.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Tiempo entre Citas</Typography>
								<Typography variant="body2">
									Configura el tiempo de descanso entre citas consecutivas para prepararte entre una y otra (15 minutos recomendados).
								</Typography>
							</Box>
						</Box>
						<Box display="flex" alignItems="flex-start">
							<ClipboardTick size={18} style={{ minWidth: "24px", color: theme.palette.success.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Tipos de Consulta</Typography>
								<Typography variant="body2">
									Crea diferentes tipos de consulta (inicial, seguimiento, asesoría específica) con duraciones y precios distintos.
								</Typography>
							</Box>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.1), borderRadius: "8px" }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Beneficios de la Programación de Citas
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<People size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Permite a tus clientes reservar citas en horarios que te convengan sin intercambios de mensajes</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<TickSquare size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Reduce las citas perdidas con recordatorios automáticos para ti y tus clientes</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<UserTick size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Proyecta una imagen profesional y organizada frente a tus clientes</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<Save2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Ahorra tiempo en la coordinación de reuniones y optimiza tu agenda</Typography>
					</Box>
				</Stack>
			</Box>

			<Alert severity="info" sx={{ mt: 3 }}>
				<AlertTitle>Enlace para Clientes</AlertTitle>
				<Typography paragraph>
					Una vez configurada tu disponibilidad, el sistema genera un enlace único que puedes compartir con tus clientes para que reserven
					citas directamente según tu disponibilidad configurada.
				</Typography>
				<Typography>
					Puedes incluir este enlace en tu firma de correo electrónico, compartirlo en tu página web o enviarlo directamente a tus clientes
					cuando necesiten programar una consulta.
				</Typography>
			</Alert>
		</Stack>
	);
};

const PracticalTipsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={3}>
			<Typography paragraph>Para aprovechar al máximo el calendario, te recomendamos seguir estas mejores prácticas:</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Codificación por Colores
							</Typography>
						</Box>
						<Typography variant="body2">
							Aprovecha los distintos colores de eventos para identificar rápidamente el tipo de actividad. Los vencimientos en rojo son
							especialmente útiles para destacar plazos críticos.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Vista Semanal para Planificación
							</Typography>
						</Box>
						<Typography variant="body2">
							Utiliza la vista semanal los lunes para planificar tu semana, identificar conflictos de horarios y organizar tus actividades
							de manera eficiente.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Descripciones Detalladas
							</Typography>
						</Box>
						<Typography variant="body2">
							Incluye información completa en la descripción de los eventos, como número de sala para audiencias, documentos necesarios o
							contactos relevantes, para tener todo a mano cuando lo necesites.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ArrowRight2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Sincroniza con tu Dispositivo
							</Typography>
						</Box>
						<Typography variant="body2">
							Mantén el calendario abierto en tu dispositivo móvil o configura la sincronización con tu aplicación de calendario preferida
							para tener acceso rápido a tu agenda en cualquier momento.
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			<Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.1), borderRadius: "8px" }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Recomendaciones para Gestionar Eventos:
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<NotificationCircle size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Configura múltiples recordatorios para eventos cruciales como audiencias o vencimientos procesales</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<FolderAdd size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Siempre vincula los eventos a sus causas correspondientes para mantener todo organizado por expediente</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<Sms size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Usa la vista de agenda para una revisión rápida de tus próximos compromisos</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<Add size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Programa tiempo para preparación antes de eventos importantes como audiencias o reuniones con clientes</Typography>
					</Box>
				</Stack>
			</Box>

			<Alert severity="info" sx={{ mt: 3 }}>
				<AlertTitle>Acceso Rápido</AlertTitle>
				Recuerda que puedes acceder al calendario desde el menú principal o directamente desde la vista de cada causa para gestionar eventos
				específicos relacionados con ese expediente.
			</Alert>
		</Stack>
	);
};

// ==============================|| COMPONENTE PRINCIPAL DE GUÍA CALENDARIO ||============================== //

interface GuideCalendarProps {
	open: boolean;
	onClose: () => void;
}

const GuideCalendar: React.FC<GuideCalendarProps> = ({ open, onClose }) => {
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
			title: "Introducción al Calendario",
			content: <IntroductionContent />,
		},
		{
			title: "Navegación del Calendario",
			content: <NavigationContent />,
		},
		{
			title: "Creación de Eventos",
			content: <EventCreationContent />,
		},
		{
			title: "Formulario de Evento",
			content: <EventFormContent />,
		},
		{
			title: "Gestión de Eventos",
			content: <EventManagementContent />,
		},
		{
			title: "Recordatorios y Notificaciones",
			content: <RemindersContent />,
		},
		{
			title: "Vinculación con Causas",
			content: <CauseLinkingContent />,
		},
		{
			title: "Configuración de Citas",
			content: <AppointmentConfigContent />,
		},
		{
			title: "Consejos Prácticos",
			content: <PracticalTipsContent />,
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
					<Typography variant="h3">Guía de Calendario</Typography>
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

				<Box sx={{ p: 0 }}>
					<Box sx={{ p: 3 }}>
						<Typography variant="h4" gutterBottom color="primary">
							{steps[activeStep].title}
						</Typography>
						<Box sx={{ mb: 3 }}>{steps[activeStep].content}</Box>
					</Box>
				</Box>
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

export default GuideCalendar;
