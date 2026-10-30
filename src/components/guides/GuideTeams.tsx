import React from "react";

// material-ui
import { Typography, Box, Alert, AlertTitle, Stack, Paper, Grid, styled, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import {
	People,
	ArrowRight2,
	UserRemove,
	ShieldTick,
	Crown1,
	Eye,
	Edit,
	Trash,
	Warning2,
	TickCircle,
	CloseCircle,
	Import,
	Profile2User,
	Notification,
	TaskSquare,
	Calendar,
	FolderOpen,
	Printer,
	Lock,
} from "iconsax-react";
import GuideShell from "./GuideShell";

// ==============================|| GUÍA EQUIPOS - ESTILOS ||============================== //

const StyledPaper = styled(Paper)(() => ({
	margin: "16px 0",
	overflow: "hidden",
	borderRadius: "12px",
	boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
}));

type Palette = "primary" | "info" | "success" | "warning" | "error";

// Encabezado + lista de renglones con ícono: el bloque que más se repite en la guía.
const Section = ({ title, color, items, intro }: { title: string; color: Palette; items: React.ReactNode[]; intro?: React.ReactNode }) => {
	const theme = useTheme();
	return (
		<StyledPaper>
			<Box sx={{ p: 2, bgcolor: alpha(theme.palette[color].lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
				<Typography variant="subtitle1" fontWeight="bold">
					{title}
				</Typography>
			</Box>
			<Box sx={{ p: 2 }}>
				{intro && (
					<Typography variant="body2" gutterBottom>
						{intro}
					</Typography>
				)}
				<Stack spacing={1.5} sx={{ mt: intro ? 1 : 0 }}>
					{items.map((item, i) => (
						<Box key={i} display="flex" alignItems="flex-start">
							<ArrowRight2 size={18} style={{ minWidth: "24px", marginTop: "3px", color: theme.palette[color].main }} />
							<Typography component="div">{item}</Typography>
						</Box>
					))}
				</Stack>
			</Box>
		</StyledPaper>
	);
};

// Tarjeta con ícono y texto (roles, gestión, consejos).
const Card = ({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: Palette; children: React.ReactNode }) => {
	const theme = useTheme();
	return (
		<Paper sx={{ p: 2, height: "100%", bgcolor: alpha(theme.palette[color].lighter, 0.1) }}>
			<Box display="flex" alignItems="flex-start" mb={1}>
				<Box sx={{ color: theme.palette[color].main, mr: 1, mt: "2px", display: "flex" }}>{icon}</Box>
				<Typography variant="subtitle1" fontWeight="bold">
					{title}
				</Typography>
			</Box>
			<Typography variant="body2" component="div">
				{children}
			</Typography>
		</Paper>
	);
};

// ==============================|| GUÍA EQUIPOS - CONTENIDO ||============================== //

const IntroductionContent = () => (
	<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
		<Typography paragraph>
			Equipos te permite trabajar con los abogados y colaboradores de tu estudio sobre las mismas causas, contactos, calendario, tareas,
			escritos y seguimientos postales. Cada uno trabaja con los permisos de su rol, las carpetas se reparten entre responsables, los avisos
			llegan a quien corresponde y el propietario decide si todos ven todo o cada uno ve lo suyo.
		</Typography>
		<Alert severity="success">
			<AlertTitle>La cuenta del propietario es el equipo</AlertTitle>
			<Typography>
				Todo lo que se carga dentro del equipo, lo cargue quien lo cargue, queda en la cuenta del propietario y cuenta contra los límites de
				su plan. Cada recurso guarda además quién lo creó. Los integrantes no pagan: los cubre el plan del propietario.
			</Typography>
		</Alert>
		<Alert severity="info">
			<AlertTitle>En esta guía</AlertTitle>
			<Typography component="div">
				<ul style={{ margin: 0, paddingLeft: 18 }}>
					<li>Cupos por plan, crear el equipo, invitar y aceptar</li>
					<li>Roles y permisos</li>
					<li>Responsables de carpetas y distribución imprimible</li>
					<li>Tareas y eventos con responsables, «Solo para mí»</li>
					<li>A quién le llegan los avisos y qué ve cada integrante</li>
					<li>Gestión de integrantes y relación con tu plan</li>
				</ul>
			</Typography>
		</Alert>
	</Stack>
);

const RequirementsContent = () => {
	const theme = useTheme();
	const plans = [
		{ name: "Gratuito", ok: false, text: "No puede crear equipos" },
		{ name: "Estándar", ok: true, text: "Hasta 5 integrantes · 50 causas · 100 MB" },
		{ name: "Pro", ok: true, text: "Hasta 8 integrantes · 200 causas · 150 MB" },
		{ name: "Premium", ok: true, text: "Hasta 10 integrantes · 500 causas · 200 MB" },
	];
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography paragraph>Para crear un equipo necesitás un plan pago: Estándar, Pro o Premium.</Typography>
			<StyledPaper>
				<Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.lighter, 0.2), borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Typography variant="subtitle1" fontWeight="bold">
						Cupos por plan (compartidos por todo el equipo)
					</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Stack spacing={2}>
						{plans.map((p) => (
							<Box key={p.name} display="flex" alignItems="center">
								{p.ok ? (
									<TickCircle size={20} style={{ marginRight: "8px", color: theme.palette.success.main }} />
								) : (
									<CloseCircle size={20} style={{ marginRight: "8px", color: theme.palette.error.main }} />
								)}
								<Typography>
									<strong>{p.name}:</strong> {p.text}
								</Typography>
							</Box>
						))}
					</Stack>
				</Box>
			</StyledPaper>
			<Alert severity="info">
				<Typography>
					El cupo de integrantes incluye al propietario: en Premium sos vos más nueve invitados. Para <strong>unirte</strong> a un equipo no
					necesitás plan; si tenés un plan pago activo, primero tenés que cancelarlo. Cada persona pertenece a un solo equipo a la vez.
				</Typography>
			</Alert>
		</Stack>
	);
};

const CreationContent = () => (
	<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
		<Section
			title="Crear el equipo"
			color="primary"
			items={[
				<>
					Abrí <strong>Configuración → Perfil → Mi equipo</strong>
				</>,
				<>Hacé clic en «Crear equipo» y escribí un nombre (por ejemplo, «Estudio García &amp; Asociados»)</>,
				<>Confirmá. Pasás a ser el Propietario y ves el cupo de tu plan</>,
			]}
		/>
		<Section
			title="Invitar integrantes"
			color="info"
			items={[
				<>
					En Mi equipo, hacé clic en <strong>Invitar miembros</strong>, escribí los correos y elegí el rol de cada uno
				</>,
				<>Cada persona recibe un enlace personal, válido por 7 días; podés reenviarlo o cancelarlo mientras esté pendiente</>,
				<>Invitan el propietario y los Administradores; solo el propietario puede invitar como Administrador</>,
			]}
		/>
	</Stack>
);

const AcceptingContent = () => (
	<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
		<Typography paragraph>Al abrir el enlace de la invitación, lo que sigue depende de tu situación:</Typography>
		<Section
			title="Casos posibles"
			color="primary"
			items={[
				<>
					<strong>No tenés cuenta:</strong> te registrás desde la invitación y entrás con el rol asignado
				</>,
				<>
					<strong>Tenés cuenta sin datos:</strong> iniciás sesión y aceptás
				</>,
				<>
					<strong>Tenés plan pago activo:</strong> primero cancelalo; dentro del equipo te cubre el plan del propietario
				</>,
				<>
					<strong>Ya estás en otro equipo:</strong> primero salí de ese equipo
				</>,
			]}
		/>
		<Section
			title="Si ya tenés causas u otros datos"
			color="warning"
			items={[
				<>
					<Import size={14} style={{ marginRight: 4 }} />
					<strong>Migrar al equipo:</strong> lo tuyo pasa al equipo (podés incluir lo archivado)
				</>,
				<>
					<strong>Migrar como archivados:</strong> si no entra en los límites del plan del equipo
				</>,
				<>
					<strong>Eliminar mis recursos:</strong> entrás con la cuenta limpia; no se puede deshacer
				</>,
			]}
		/>
	</Stack>
);

const RolesContent = () => (
	<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
		<Grid container spacing={2}>
			<Grid item xs={12} md={6}>
				<Card icon={<Crown1 size={24} />} title="Propietario" color="warning">
					Dueño del equipo y de sus datos; su plan define los cupos. Hace todo, incluido cambiar roles, invitar Administradores, cargar
					credenciales PJN y SCBA y eliminar el equipo. Siempre ve todo.
				</Card>
			</Grid>
			<Grid item xs={12} md={6}>
				<Card icon={<ShieldTick size={24} />} title="Administrador" color="primary">
					Para socios. Crea, edita y borra; invita y remueve integrantes; asigna responsables y configura avisos y qué ve cada integrante.
					Siempre ve todo.
				</Card>
			</Grid>
			<Grid item xs={12} md={6}>
				<Card icon={<Edit size={24} />} title="Editor" color="success">
					Para los abogados. Crea y edita causas, tareas, eventos, contactos y escritos, y asigna responsables. No borra ni gestiona
					integrantes.
				</Card>
			</Grid>
			<Grid item xs={12} md={6}>
				<Card icon={<Eye size={24} />} title="Visualizador" color="info">
					Solo consulta: no crea, no edita, no borra. Para pasantes, consultores o supervisión.
				</Card>
			</Grid>
		</Grid>
		<Alert severity="info">
			<Typography>
				Los botones siguen al rol: quien no puede borrar no ve «Eliminar». Asigná el rol mínimo necesario; se puede cambiar después sin
				volver a invitar.
			</Typography>
		</Alert>
	</Stack>
);

const ResponsablesContent = () => (
	<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
		<Typography paragraph>
			Cada carpeta puede tener uno o varios responsables. Sirven para repartir el trabajo, para que cada uno encuentre lo suyo y para
			decidir a quién le llegan los avisos.
		</Typography>
		<Section
			title="Asignar y cambiar"
			color="primary"
			items={[
				<>
					<FolderOpen size={14} style={{ marginRight: 4 }} />
					<strong>En la carpeta:</strong> franja «Responsables» → Editar
				</>,
				<>
					<strong>Desde el listado:</strong> hacé clic en las iniciales de la columna «Responsable» (o en «Asignar») para agregar, cambiar o
					quitar
				</>,
				<>
					<strong>De a muchas:</strong> marcá carpetas y usá «Asignar responsable (N)» con Reemplazar, Agregar o Quitar
				</>,
				<>Pueden hacerlo el propietario, los Administradores y los Editores</>,
			]}
		/>
		<Section
			title="Encontrar y controlar"
			color="info"
			items={[
				<>
					En Carpetas: selector <strong>Mis carpetas / Todas / Sin responsable</strong>
				</>,
				<>
					<Printer size={14} style={{ marginRight: 4 }} />
					En Mi equipo, <strong>Distribución de responsables</strong>: carpetas por integrante, con Imprimir y Descargar CSV (propietario y
					Administradores)
				</>,
			]}
		/>
	</Stack>
);

const TasksEventsContent = () => (
	<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
		<Section
			title="Tareas"
			color="primary"
			intro={
				<>
					<TaskSquare size={14} style={{ marginRight: 4 }} />
					Cada tarea puede tener uno o varios responsables, con o sin carpeta.
				</>
			}
			items={[
				<>
					Vistas <strong>Mis tareas / Todas / Sin asignar</strong> y filtro <strong>Responsable</strong>; Imprimir agrupa por responsable
				</>,
				<>Los recordatorios le llegan a cada responsable; sin responsables, a quien la creó</>,
			]}
		/>
		<Section
			title="Eventos del calendario"
			color="success"
			intro={
				<>
					<Calendar size={14} style={{ marginRight: 4 }} />A quién avisa un evento:
				</>
			}
			items={[
				<>
					<strong>Con carpeta:</strong> a los responsables de esa carpeta (si no tiene, a todo el equipo)
				</>,
				<>
					<strong>Sin carpeta:</strong> a todo el equipo
				</>,
				<>
					<Lock size={14} style={{ marginRight: 4 }} />
					<strong>Solo para mí:</strong> lo ve y lo recibe solo quien lo creó, con cualquier rol. La agenda que el propietario tenía antes
					del equipo queda así; para compartir un evento, desmarcá la casilla
				</>,
				<>El calendario se filtra por responsable e imprime el período visible</>,
			]}
		/>
	</Stack>
);

const NotificationsContent = () => (
	<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
		<Typography paragraph>
			<Notification size={16} style={{ marginRight: 4, verticalAlign: "text-bottom" }} />
			Los movimientos nuevos y las cédulas de las carpetas del equipo se reparten según tres reglas, que configuran el propietario o un
			Administrador en <strong>Mi equipo → Avisos del equipo</strong>.
		</Typography>
		<Section
			title="Las tres reglas"
			color="primary"
			items={[
				<>
					<strong>Del equipo:</strong> «Todos los integrantes» (predeterminada) o «Solo los responsables de cada carpeta» (si no tiene,
					todos)
				</>,
				<>
					<strong>De una carpeta:</strong> «Según el equipo», «Solo responsables» o «Todos»
				</>,
				<>
					<strong>Por integrante:</strong> «Según cada carpeta», «Todo» o «Solo lo mío»
				</>,
			]}
		/>
		<Alert severity="info">
			<Typography>
				Nunca se pierde un aviso: si las reglas dejan una novedad sin destinatario, le llega al propietario. Las altas y bajas de la
				sincronización, la verificación de causas y el estado de credenciales van a todo el equipo. Cada integrante recibe sus avisos con
				sus preferencias (inmediato o resumen de las 19 h); los recordatorios de tareas y eventos salen a las 9 h.
			</Typography>
		</Alert>
	</Stack>
);

const VisibilityContent = () => (
	<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
		<Typography paragraph>
			En <strong>Mi equipo → Qué ve cada integrante</strong>, el propietario o un Administrador eligen «Todos ven todo» (predeterminada) o
			«Cada integrante ve solo lo suyo», con excepciones por persona.
		</Typography>
		<Section
			title="«Lo suyo» es"
			color="primary"
			items={[
				<>Carpetas donde es responsable o que creó, y lo que cuelga de ellas</>,
				<>Tareas asignadas a él, creadas por él o de sus carpetas</>,
				<>Eventos que creó, los de sus carpetas y los del equipo sin carpeta</>,
			]}
		/>
		<Alert severity="warning">
			<Typography>
				La restricción es real: una carpeta ajena abierta por enlace muestra «Este recurso no está asignado a vos», no se pueden cambiar sus
				responsables y no llegan sus avisos. También vale para los conectores de IA. El propietario y los Administradores siempre ven todo.
				Contactos, cálculos, notas, escritos y seguimientos siguen compartidos.
			</Typography>
		</Alert>
		<Alert severity="info">
			<Typography>
				Los Editores y Visualizadores ven en Mi equipo un resumen: <strong>Qué ves</strong> y <strong>Tus avisos</strong>.
			</Typography>
		</Alert>
	</Stack>
);

const ManagementContent = () => (
	<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
		<Grid container spacing={2}>
			<Grid item xs={12} md={6}>
				<Card icon={<Profile2User size={24} />} title="Cambiar rol" color="primary">
					Solo el propietario, desde el menú del integrante en Mi equipo.
				</Card>
			</Grid>
			<Grid item xs={12} md={6}>
				<Card icon={<UserRemove size={24} />} title="Remover" color="error">
					El propietario o un Administrador. Pierde el acceso al instante; lo que cargó queda en el equipo.
				</Card>
			</Grid>
			<Grid item xs={12} md={6}>
				<Card icon={<ArrowRight2 size={24} />} title="Salir del equipo" color="warning">
					Cualquier integrante salvo el propietario, desde «Abandonar equipo». Lo que cargó queda en el equipo.
				</Card>
			</Grid>
			<Grid item xs={12} md={6}>
				<Card icon={<Trash size={24} />} title="Eliminar el equipo" color="info">
					Solo el propietario. No se borra ningún dato: todo vuelve a ser suyo como recursos personales.
				</Card>
			</Grid>
		</Grid>
		<Section
			title="Tu plan y el equipo"
			color="warning"
			items={[
				<>Un solo plan cubre a todo el equipo: el del propietario</>,
				<>Mejorar el plan amplía el cupo y los límites al instante</>,
				<>Bajar de plan se bloquea si el equipo no entra; para pasar a Gratuito, primero eliminá el equipo</>,
				<>Si un pago falla y vence el período de gracia, el equipo se suspende hasta regularizarlo; los datos no se pierden</>,
			]}
		/>
	</Stack>
);

const TipsContent = () => (
	<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
		<Section
			title="Para estudios"
			color="success"
			items={[
				<>Cargá las credenciales PJN o SCBA en la cuenta del propietario: las causas del estudio entran solas al equipo</>,
				<>Repartí las carpetas por juzgado o fuero con «Asignar responsable» y revisá la Distribución de responsables</>,
				<>
					Si cada abogado lleva sus causas, poné los avisos en «Solo los responsables»; si querés reserva, «Cada integrante ve solo lo suyo»
				</>,
				<>Pedile a cada uno que trabaje desde «Mis carpetas» y «Mis tareas», y revisá «Sin asignar» y «Sin responsable» cada semana</>,
				<>Editor para los abogados, Administrador para los socios</>,
			]}
		/>
		<Alert severity="info" icon={<Warning2 size={20} />}>
			<Typography>
				¿Dudas? Escribinos a <strong>soporte@lawanalytics.app</strong>.
			</Typography>
		</Alert>
	</Stack>
);

// ==============================|| COMPONENTE PRINCIPAL DE GUÍA EQUIPOS ||============================== //

interface GuideTeamsProps {
	open: boolean;
	onClose: () => void;
}

const GuideTeams: React.FC<GuideTeamsProps> = ({ open, onClose }) => {
	const steps = [
		{ title: "Cómo funciona un equipo", content: <IntroductionContent /> },
		{ title: "Requisitos y cupos", content: <RequirementsContent /> },
		{ title: "Crear e invitar", content: <CreationContent /> },
		{ title: "Aceptar una invitación", content: <AcceptingContent /> },
		{ title: "Roles y permisos", content: <RolesContent /> },
		{ title: "Responsables de carpetas", content: <ResponsablesContent /> },
		{ title: "Tareas y eventos", content: <TasksEventsContent /> },
		{ title: "Avisos de las causas", content: <NotificationsContent /> },
		{ title: "Qué ve cada integrante", content: <VisibilityContent /> },
		{ title: "Gestión y plan", content: <ManagementContent /> },
		{ title: "Consejos", content: <TipsContent /> },
	];

	return (
		<GuideShell
			open={open}
			onClose={onClose}
			icon={<People size={18} variant="Bulk" />}
			eyebrow="Guía"
			title="Guía de Equipos"
			subtitle="Trabajá con tu estudio: responsables, avisos y permisos"
			steps={steps}
		/>
	);
};

export default GuideTeams;
