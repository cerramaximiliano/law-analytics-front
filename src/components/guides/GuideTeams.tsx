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
	People,
	ArrowRight2,
	Next,
	ArrowLeft,
	ArrowRight,
	UserAdd,
	UserRemove,
	ShieldTick,
	Crown1,
	Eye,
	Edit,
	Trash,
	Sms,
	Warning2,
	TickCircle,
	CloseCircle,
	Import,
	Profile2User,
} from "iconsax-react";

// ==============================|| GUÍA EQUIPOS - ESTILOS ||============================== //

const StyledPaper = styled(Paper)(({ theme }) => ({
	margin: "16px 0",
	overflow: "hidden",
	borderRadius: "12px",
	boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}));

// ==============================|| GUÍA EQUIPOS - COMPONENTES DE CONTENIDO ||============================== //

const IntroductionContent = () => {
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>
				El sistema de equipos te permite invitar colaboradores para trabajar juntos en tus causas, contactos, calculadoras y demás recursos
				de Law||Analytics. Todo el equipo comparte los recursos del propietario.
			</Typography>
			<Alert severity="info">
				<AlertTitle>Aprenderás a:</AlertTitle>
				<Typography component="div">
					<ul>
						<li>Crear un equipo y configurarlo</li>
						<li>Invitar miembros y asignarles roles con permisos específicos</li>
						<li>Aceptar invitaciones y migrar recursos</li>
						<li>Trabajar colaborativamente en recursos compartidos</li>
						<li>Gestionar miembros, cambiar roles y administrar el equipo</li>
						<li>Entender los límites por plan y las restricciones</li>
					</ul>
				</Typography>
			</Alert>
			<Alert severity="success" sx={{ mt: 2 }}>
				<AlertTitle>Concepto clave: Pool compartido</AlertTitle>
				<Typography>
					Cuando creas un equipo, todos tus recursos (causas, contactos, calculadoras, documentos) pasan a estar disponibles para los
					miembros según su rol. No existe separación entre recursos "personales" y recursos "del equipo": todo se comparte desde la cuenta
					del propietario.
				</Typography>
			</Alert>
		</Stack>
	);
};

const RequirementsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>
				Para crear un equipo necesitas un plan Estándar o Premium. Los usuarios con plan Gratuito no pueden crear equipos.
			</Typography>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Límites de miembros por plan
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={2}>
						<Box display="flex" alignItems="center">
							<CloseCircle size={20} style={{ marginRight: "8px", color: theme.palette.error.main }} />
							<Typography>
								<strong>Plan Gratuito:</strong> No disponible — No puede crear equipos
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<TickCircle size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
							<Typography>
								<strong>Plan Estándar:</strong> Hasta 5 miembros (incluido el propietario)
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<TickCircle size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
							<Typography>
								<strong>Plan Premium:</strong> Hasta 10 miembros (incluido el propietario)
							</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<Alert severity="info">
				<Typography>
					El límite de miembros incluye al propietario. Por ejemplo, en el plan Estándar con límite de 5, el propietario ocupa 1 lugar y
					puede invitar hasta 4 colaboradores. Un usuario solo puede pertenecer a un equipo a la vez.
				</Typography>
			</Alert>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Límites de recursos (pool compartido)
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={2}>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
							<Typography>
								<strong>Standard:</strong> 50 causas, 20 calculadoras, 100 contactos, 1 GB almacenamiento
							</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
							<Typography>
								<strong>Premium:</strong> 500 causas, 200 calculadoras, 1.000 contactos, 10 GB almacenamiento
							</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<Typography variant="body2" color="textSecondary">
				Todos los recursos creados por cualquier miembro cuentan contra los límites del plan del propietario.
			</Typography>
		</Stack>
	);
};

const CreationContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>Para crear tu equipo, sigue estos pasos:</Typography>
			<Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2) }}>
				<Stack spacing={2}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Ve a la sección de Equipos en el menú lateral</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Haz clic en el botón "Crear Equipo"</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Ingresa un nombre descriptivo para el equipo (ej. "Estudio García & Asociados")</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Opcionalmente agrega una descripción</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.primary.main }} />
						<Typography>Haz clic en "Crear" para finalizar</Typography>
					</Box>
				</Stack>
			</Paper>

			<Alert severity="success" sx={{ mt: 2 }}>
				<AlertTitle>¿Qué sucede al crear el equipo?</AlertTitle>
				<Stack spacing={1}>
					<Typography>• Te conviertes en el Propietario (Owner) del equipo</Typography>
					<Typography>• Todos tus recursos existentes pasan a estar disponibles para los futuros miembros</Typography>
					<Typography>• Los límites de tu plan definen la capacidad del equipo</Typography>
				</Stack>
			</Alert>

			<Alert severity="warning" sx={{ mt: 2 }}>
				<AlertTitle>Importante</AlertTitle>
				<Typography>
					Al crear un equipo, tus recursos siguen siendo tuyos. Los miembros podrán verlos y (según su rol) editarlos, pero la propiedad
					siempre es del propietario.
				</Typography>
			</Alert>
		</Stack>
	);
};

const InvitingContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>Para invitar colaboradores a tu equipo:</Typography>
			<Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.2) }}>
				<Stack spacing={2}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Abre la configuración de tu equipo</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Haz clic en "Invitar Miembro"</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Ingresa el email del colaborador</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Selecciona el rol que deseas asignarle (Editor o Visor)</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={20} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Haz clic en "Enviar Invitación"</Typography>
					</Box>
				</Stack>
			</Paper>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						¿Qué sucede al enviar la invitación?
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<Sms size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>El colaborador recibe un email con un link de invitación</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<Warning2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
							<Typography>La invitación es válida por 7 días</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.info.main }} />
							<Typography>Aparece como "Pendiente" hasta que sea aceptada o rechazada</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.info.main }} />
							<Typography>Puedes revocar la invitación en cualquier momento antes de que sea aceptada</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<Alert severity="info">
				<Typography>Solo el Propietario puede invitar nuevos miembros al equipo.</Typography>
			</Alert>
		</Stack>
	);
};

const RolesContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>El sistema de equipos tiene tres roles con diferentes niveles de acceso:</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12} md={4}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.warning.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Crown1 size={24} style={{ color: theme.palette.warning.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Propietario (Owner)
							</Typography>
						</Box>
						<Typography variant="body2">
							Es el creador y dueño del equipo y de todos los recursos. Los límites de su plan definen la capacidad del equipo. Es el único
							que puede eliminar el equipo e invitar miembros. No puede ser removido ni degradado.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={4}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.success.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Edit size={24} style={{ color: theme.palette.success.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Editor
							</Typography>
						</Box>
						<Typography variant="body2">
							Puede crear y editar recursos (causas, contactos, notas, etc.). No puede eliminar recursos ni gestionar miembros. Rol ideal
							para abogados y colaboradores que necesitan contribuir activamente.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={4}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Eye size={24} style={{ color: theme.palette.info.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Visor (Viewer)
							</Typography>
						</Box>
						<Typography variant="body2">
							Solo puede ver recursos, sin crear, editar ni eliminar. No puede gestionar miembros. Rol ideal para supervisores, pasantes o
							clientes con acceso de consulta.
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			<Alert severity="info" sx={{ mt: 2 }}>
				<AlertTitle>Consejo</AlertTitle>
				<Typography>
					Asigna el rol mínimo necesario para cada colaborador. Si alguien solo necesita consultar información, asígnale el rol de Visor.
					Esto protege tus datos de modificaciones accidentales.
				</Typography>
			</Alert>
		</Stack>
	);
};

const AcceptingContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>Cuando recibes una invitación a un equipo, el proceso depende de tu situación actual:</Typography>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Caso A: Usuario nuevo
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>Recibirás un email con un link de invitación</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>Haz clic en el link y se te pedirá crear una cuenta (nombre, apellido, contraseña)</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>Al completar el registro, te unes automáticamente al equipo</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Caso B: Usuario existente sin recursos
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.success.main }} />
							<Typography>Haz clic en el link de invitación del email</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.success.main }} />
							<Typography>Inicia sesión si no estás logueado</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.success.main }} />
							<Typography>Verás los detalles de la invitación y podrás aceptar directamente</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Caso C: Usuario existente con recursos
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Typography variant="body2" gutterBottom>
						Si ya tienes causas, contactos u otros recursos, deberás elegir qué hacer con ellos:
					</Typography>
					<Stack spacing={1.5} sx={{ mt: 1 }}>
						<Box display="flex" alignItems="flex-start">
							<Import size={18} style={{ minWidth: "24px", color: theme.palette.warning.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Migrar al equipo</Typography>
								<Typography variant="body2">
									Tus recursos se transfieren al equipo y pasan a ser propiedad del propietario. Es la opción recomendada.
								</Typography>
							</Box>
						</Box>
						<Box display="flex" alignItems="flex-start">
							<Trash size={18} style={{ minWidth: "24px", color: theme.palette.error.main, marginTop: "3px" }} />
							<Box>
								<Typography fontWeight="bold">Eliminar recursos</Typography>
								<Typography variant="body2">Tus recursos se eliminan permanentemente y te unes con la cuenta limpia.</Typography>
							</Box>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<Alert severity="warning">
				<Typography>
					Si la migración excedería los límites del plan del propietario, se te notificará cuáles recursos no pueden migrarse. El
					propietario deberá liberar espacio o mejorar su plan.
				</Typography>
			</Alert>
		</Stack>
	);
};

const TeamworkContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>Una vez dentro del equipo, trabajas directamente con los recursos compartidos:</Typography>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Creación de recursos en equipo
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>Los recursos se crean dentro del equipo automáticamente</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>Todo cuenta contra los límites del plan del propietario</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>Todos los miembros pueden acceder según su rol</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.primary.main }} />
							<Typography>Se registra quién creó cada recurso para auditoría</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Historial de actividad
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Typography variant="body2" gutterBottom>
						El sistema registra automáticamente todas las acciones del equipo:
					</Typography>
					<Stack spacing={1.5} sx={{ mt: 1 }}>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.info.main }} />
							<Typography>Quién creó, editó o eliminó cada recurso</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.info.main }} />
							<Typography>Fecha y hora de cada acción</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.info.main }} />
							<Typography>Detalle de los cambios realizados</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<Alert severity="info">
				<Typography>
					Si el equipo alcanza el límite de causas u otro recurso, ningún miembro podrá crear nuevos hasta que se archiven/eliminen
					existentes o el propietario mejore su plan.
				</Typography>
			</Alert>
		</Stack>
	);
};

const ManagementContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>El Propietario puede gestionar los miembros del equipo:</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Profile2User size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Cambiar Rol
							</Typography>
						</Box>
						<Typography variant="body2">
							Busca al miembro en la configuración del equipo, haz clic en el menú de opciones y selecciona "Cambiar rol" para asignar un
							nuevo rol.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.error.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<UserRemove size={24} style={{ color: theme.palette.error.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Remover Miembro
							</Typography>
						</Box>
						<Typography variant="body2">
							Busca al miembro, haz clic en "Remover" y confirma. El miembro pierde acceso inmediato. Los recursos que creó permanecen en el
							equipo.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.warning.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<UserAdd size={24} style={{ color: theme.palette.warning.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Invitar Miembros
							</Typography>
						</Box>
						<Typography variant="body2">
							Envía invitaciones por email con un rol preseleccionado. Las invitaciones son válidas por 7 días y pueden revocarse antes de
							ser aceptadas.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.info.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Trash size={24} style={{ color: theme.palette.info.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Eliminar Equipo
							</Typography>
						</Box>
						<Typography variant="body2">
							Solo el Propietario puede eliminar el equipo. Al hacerlo, los miembros pierden acceso pero los recursos permanecen en la
							cuenta del propietario.
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			<Alert severity="info" sx={{ mt: 2 }}>
				<AlertTitle>Nota</AlertTitle>
				<Typography>Solo el Propietario puede gestionar miembros: invitar, cambiar roles y remover colaboradores.</Typography>
			</Alert>
		</Stack>
	);
};

const RestrictionsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>
				Cada usuario solo puede pertenecer a un equipo a la vez. Esto aplica tanto a propietarios como a miembros.
			</Typography>

			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Si ya perteneces a un equipo
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Box display="flex" alignItems="center">
							<CloseCircle size={18} style={{ minWidth: "24px", color: theme.palette.error.main }} />
							<Typography>No puedes aceptar invitaciones a otros equipos</Typography>
						</Box>
						<Box display="flex" alignItems="center">
							<ArrowRight2 size={18} style={{ minWidth: "24px", color: theme.palette.warning.main }} />
							<Typography>Debes abandonar tu equipo actual antes de unirte a uno nuevo</Typography>
						</Box>
					</Stack>
				</Box>
			</StyledPaper>

			<Box sx={{ bgcolor: alpha(theme.palette.info.lighter, 0.1), p: 2, borderRadius: "8px" }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Para cambiar de equipo:
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Ve a la configuración de tu equipo actual</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Haz clic en "Abandonar Equipo" y confirma</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.info.main }} />
						<Typography>Ahora puedes aceptar la nueva invitación</Typography>
					</Box>
				</Stack>
			</Box>

			<Alert severity="warning" sx={{ mt: 2 }}>
				<AlertTitle>Sobre el plan y los equipos</AlertTitle>
				<Stack spacing={1}>
					<Typography>
						• <strong>Si intentas bajar al plan Gratuito:</strong> Se bloquea la acción mientras tengas un equipo activo. Debes eliminar el
						equipo primero.
					</Typography>
					<Typography>
						• <strong>Si reduces miembros permitidos:</strong> Se bloquea si tu equipo tiene más miembros activos de los que permite el
						nuevo plan.
					</Typography>
				</Stack>
			</Alert>

			<Alert severity="error">
				<Typography>
					Al abandonar un equipo, los recursos que creaste o migraste permanecen en el equipo (son propiedad del propietario). Quedas sin
					recursos propios.
				</Typography>
			</Alert>
		</Stack>
	);
};

const TipsContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>Para sacar el máximo provecho del sistema de equipos, te ofrecemos estos consejos prácticos:</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<ShieldTick size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Asignación de roles
							</Typography>
						</Box>
						<Typography variant="body2">
							Usa el rol mínimo necesario. Pasantes y supervisores como Visores, y abogados activos como Editores.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<People size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Organización previa
							</Typography>
						</Box>
						<Typography variant="body2">
							Antes de invitar miembros, organiza tus causas y recursos. Un equipo bien organizado facilita el trabajo colaborativo desde el
							primer día.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Warning2 size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Comunicar límites
							</Typography>
						</Box>
						<Typography variant="body2">
							Informa a tu equipo sobre los límites del plan para que todos sepan cuántos recursos pueden crear y evitar sorpresas.
						</Typography>
					</Paper>
				</Grid>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette.primary.lighter, 0.1) }}>
						<Box display="flex" alignItems="flex-start" mb={1}>
							<Eye size={24} style={{ color: theme.palette.primary.main, marginRight: "8px", marginTop: "2px" }} />
							<Typography variant="subtitle1" fontWeight="bold">
								Supervisar actividad
							</Typography>
						</Box>
						<Typography variant="body2">
							Revisa periódicamente el historial de actividad del equipo para mantener el control sobre los cambios realizados.
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			<Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.success.lighter, 0.1), borderRadius: "8px" }}>
				<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
					Tips de flujo de trabajo:
				</Typography>
				<Stack spacing={1.5}>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Invita primero a los colaboradores más activos para que comiencen a trabajar rápidamente</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Si un miembro cambia de responsabilidades, actualiza su rol en lugar de removerlo</Typography>
					</Box>
					<Box display="flex" alignItems="center">
						<ArrowRight2 size={18} style={{ marginRight: "8px", color: theme.palette.success.main }} />
						<Typography>Antes de eliminar el equipo, asegúrate de que ningún miembro necesite acceso a los recursos</Typography>
					</Box>
				</Stack>
			</Box>

			<Alert severity="info" sx={{ mt: 3 }}>
				<AlertTitle>Mejora Continua</AlertTitle>
				El sistema de equipos está en constante mejora. En el futuro se habilitará la posibilidad de pertenecer a múltiples equipos
				simultáneamente. Ante cualquier duda, contactanos en soporte@lawanalytics.app.
			</Alert>
		</Stack>
	);
};

// ==============================|| COMPONENTE PRINCIPAL DE GUÍA EQUIPOS ||============================== //

interface GuideTeamsProps {
	open: boolean;
	onClose: () => void;
}

const GuideTeams: React.FC<GuideTeamsProps> = ({ open, onClose }) => {
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
			title: "Introducción a los Equipos",
			content: <IntroductionContent />,
		},
		{
			title: "Requisitos y Límites",
			content: <RequirementsContent />,
		},
		{
			title: "Crear un Equipo",
			content: <CreationContent />,
		},
		{
			title: "Invitar Miembros",
			content: <InvitingContent />,
		},
		{
			title: "Roles y Permisos",
			content: <RolesContent />,
		},
		{
			title: "Aceptar una Invitación",
			content: <AcceptingContent />,
		},
		{
			title: "Trabajar en Equipo",
			content: <TeamworkContent />,
		},
		{
			title: "Gestión de Miembros",
			content: <ManagementContent />,
		},
		{
			title: "Restricciones y Consejos",
			content: <RestrictionsContent />,
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
					<People variant="Bulk" size={28} style={{ marginRight: "12px", color: theme.palette.primary.main }} />
					<Typography variant="h3">Guía de Equipos</Typography>
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

				<Box sx={{ p: 0, height: 400, overflowY: "auto" }}>
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

export default GuideTeams;
