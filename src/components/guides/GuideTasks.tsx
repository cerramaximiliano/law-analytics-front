import React from "react";

// material-ui
import { Typography, Button, Box, Alert, AlertTitle, Stack, Paper, Grid, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// project imports
import {
	Task,
	TaskSquare,
	Add,
	Edit2,
	Trash,
	Eye,
	TickCircle,
	DocumentDownload,
	Filter,
	ArrowRight2,
	Warning2,
	Folder2,
} from "iconsax-react";
import GuideShell from "./GuideShell";

// ==============================|| CONTENIDOS DE LA GUÍA DE TAREAS ||============================== //

const CreateTaskContent = () => (
	<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
		<Stack spacing={2}>
			<Typography variant="body1">Para crear una nueva tarea:</Typography>

			<Box sx={{ bgcolor: "grey.50", borderRadius: 1, p: 2 }}>
				<Typography variant="subtitle2" gutterBottom color="primary">
					Pasos para crear una tarea:
				</Typography>
				<Stack spacing={1.5}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Typography variant="body2">1. Haz clic en el botón</Typography>
						<Button size="small" variant="contained" startIcon={<Add />}>
							Nueva Tarea
						</Button>
					</Box>
					<Typography variant="body2">2. Completa el formulario con la información requerida:</Typography>
					<Box sx={{ pl: 2 }}>
						<Typography variant="body2">
							• <strong>Nombre de la tarea:</strong> Título descriptivo
						</Typography>
						<Typography variant="body2">
							• <strong>Descripción:</strong> Detalles adicionales (opcional)
						</Typography>
						<Typography variant="body2">
							• <strong>Fecha de vencimiento:</strong> Cuándo debe completarse
						</Typography>
						<Typography variant="body2">
							• <strong>Prioridad:</strong> Alta, Media o Baja
						</Typography>
						<Typography variant="body2">
							• <strong>Carpeta:</strong> Organiza por categorías
						</Typography>
						<Typography variant="body2">
							• <strong>Estado:</strong> Pendiente, En Progreso, Completada, etc.
						</Typography>
					</Box>
					<Typography variant="body2">3. Haz clic en "Guardar" para crear la tarea</Typography>
				</Stack>
			</Box>
		</Stack>

		<Alert severity="success" icon={<TickCircle />}>
			<AlertTitle>Consejo</AlertTitle>
			<Typography variant="body2">
				Asigna prioridades adecuadas a tus tareas para mantener un flujo de trabajo organizado. Las tareas de alta prioridad aparecerán
				destacadas en la lista.
			</Typography>
		</Alert>
	</Stack>
);

const ViewManageTasksContent = () => {
	const theme = useTheme();
	return (
		<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
			<Typography variant="body1">
				La vista principal de tareas te muestra todas tus actividades en una tabla organizada. Aquí puedes:
			</Typography>

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%" }}>
						<Typography variant="subtitle2" gutterBottom color="primary">
							Filtrar y Buscar
						</Typography>
						<Stack spacing={1}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Filter size={20} />
								<Typography variant="body2">Usa la barra de búsqueda para encontrar tareas específicas</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<ArrowRight2 size={20} />
								<Typography variant="body2">Ordena por nombre, fecha, prioridad o estado</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Folder2 size={20} />
								<Typography variant="body2">Filtra por carpeta para ver tareas categorizadas</Typography>
							</Box>
						</Stack>
					</Paper>
				</Grid>

				<Grid item xs={12} md={6}>
					<Paper sx={{ p: 2, height: "100%" }}>
						<Typography variant="subtitle2" gutterBottom color="primary">
							Acciones Disponibles
						</Typography>
						<Stack spacing={1}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Eye size={20} color={theme.palette.secondary.main} />
								<Typography variant="body2">Ver detalles completos de la tarea</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Edit2 size={20} color={theme.palette.primary.main} />
								<Typography variant="body2">Editar información de la tarea</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Trash size={20} color={theme.palette.error.main} />
								<Typography variant="body2">Eliminar tarea (con confirmación)</Typography>
							</Box>
						</Stack>
					</Paper>
				</Grid>
			</Grid>

			<Alert severity="info" icon={<TaskSquare />}>
				<Typography variant="body2">
					<strong>Indicadores visuales:</strong> Las tareas vencidas se muestran en rojo, las próximas a vencer en amarillo, y cada
					prioridad tiene su propio color distintivo.
				</Typography>
			</Alert>
		</Stack>
	);
};

const PrioritiesAndStatusContent = () => (
	<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
		<Typography variant="body1">Entender el sistema de prioridades y estados te ayudará a gestionar mejor tus tareas:</Typography>

		<Grid container spacing={2}>
			<Grid item xs={12} md={6}>
				<Paper sx={{ p: 2 }}>
					<Typography variant="subtitle2" gutterBottom color="primary">
						Niveles de Prioridad
					</Typography>
					<Stack spacing={1.5}>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Chip size="small" label="Alta" color="error" />
							<Typography variant="body2">Tareas críticas que requieren atención inmediata</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Chip size="small" label="Media" color="warning" />
							<Typography variant="body2">Tareas importantes pero no urgentes</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Chip size="small" label="Baja" color="success" />
							<Typography variant="body2">Tareas que pueden realizarse cuando hay tiempo</Typography>
						</Box>
					</Stack>
				</Paper>
			</Grid>

			<Grid item xs={12} md={6}>
				<Paper sx={{ p: 2 }}>
					<Typography variant="subtitle2" gutterBottom color="primary">
						Estados de Tarea
					</Typography>
					<Stack spacing={1.5}>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Chip size="small" label="Pendiente" color="default" />
							<Typography variant="body2">Tarea aún no iniciada</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Chip size="small" label="En Progreso" color="warning" />
							<Typography variant="body2">Tarea actualmente en desarrollo</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Chip size="small" label="Revisión" color="secondary" />
							<Typography variant="body2">Tarea esperando aprobación o revisión</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Chip size="small" label="Completada" color="success" />
							<Typography variant="body2">Tarea finalizada exitosamente</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Chip size="small" label="Cancelada" color="error" />
							<Typography variant="body2">Tarea cancelada o descartada</Typography>
						</Box>
					</Stack>
				</Paper>
			</Grid>
		</Grid>

		<Alert severity="warning" icon={<Warning2 />}>
			<Typography variant="body2">
				Las tareas con fechas de vencimiento próximas (3 días o menos) se resaltarán en amarillo para alertarte. Las vencidas aparecerán en
				rojo.
			</Typography>
		</Alert>
	</Stack>
);

const ExportAndTipsContent = () => (
	<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
		<Typography variant="body1">Aprovecha al máximo la gestión de tareas con estas funcionalidades adicionales y consejos:</Typography>

		<Paper sx={{ p: 2, bgcolor: "primary.lighter", borderLeft: 4, borderColor: "primary.main" }}>
			<Stack spacing={1.5}>
				<Typography variant="subtitle2" color="primary">
					Exportar Tareas
				</Typography>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<DocumentDownload size={20} />
					<Typography variant="body2">Haz clic en el ícono de descarga para exportar todas tus tareas visibles en formato CSV</Typography>
				</Box>
				<Typography variant="body2">
					El archivo CSV incluirá toda la información de las tareas: nombre, descripción, fecha de vencimiento, prioridad, estado y carpeta.
				</Typography>
			</Stack>
		</Paper>

		<Typography variant="subtitle2" gutterBottom>
			Mejores Prácticas:
		</Typography>

		<Stack spacing={1}>
			<Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
				<Typography variant="body2">•</Typography>
				<Typography variant="body2">
					<strong>Usa carpetas temáticas:</strong> Agrupa tareas relacionadas para mejor organización
				</Typography>
			</Box>
			<Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
				<Typography variant="body2">•</Typography>
				<Typography variant="body2">
					<strong>Actualiza estados regularmente:</strong> Mantén tus tareas actualizadas para reflejar tu progreso real
				</Typography>
			</Box>
			<Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
				<Typography variant="body2">•</Typography>
				<Typography variant="body2">
					<strong>Revisa tareas vencidas:</strong> Regularmente revisa y actualiza tareas que han vencido
				</Typography>
			</Box>
			<Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
				<Typography variant="body2">•</Typography>
				<Typography variant="body2">
					<strong>Usa descripciones detalladas:</strong> Incluye toda la información necesaria para evitar confusiones futuras
				</Typography>
			</Box>
			<Box sx={{ display: "flex", alignItems: "start", gap: 1 }}>
				<Typography variant="body2">•</Typography>
				<Typography variant="body2">
					<strong>Archiva tareas completadas:</strong> Mantén tu lista limpia archivando tareas ya finalizadas
				</Typography>
			</Box>
		</Stack>

		<Alert severity="success" icon={<TickCircle />}>
			<AlertTitle>¡Consejo Pro!</AlertTitle>
			<Typography variant="body2">
				Usa atajos de teclado: presiona "Ctrl+F" para buscar rápidamente entre tus tareas, y usa las teclas de flecha para navegar por la
				lista.
			</Typography>
		</Alert>
	</Stack>
);

// ==============================|| COMPONENTE PRINCIPAL DE LA GUÍA ||============================== //

interface GuideTasksProps {
	open: boolean;
	onClose: () => void;
}

const GuideTasks: React.FC<GuideTasksProps> = ({ open, onClose }) => {
	const steps = [
		{
			title: "Introducción a Tareas",
			content: (
				<Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
					<Typography paragraph>
						Esta guía te mostrará cómo utilizar el sistema de gestión de tareas para organizar tus actividades, establecer prioridades y
						mantener un seguimiento efectivo de tus pendientes.
					</Typography>
					<Alert severity="info">
						<AlertTitle>Aprenderás a:</AlertTitle>
						<Typography component="div">
							<ul>
								<li>Crear y organizar tareas con diferentes niveles de prioridad</li>
								<li>Filtrar y buscar tareas específicas</li>
								<li>Gestionar estados y fechas de vencimiento</li>
								<li>Asignar tareas a carpetas temáticas</li>
								<li>Exportar tu lista de tareas para respaldo o reporte</li>
							</ul>
						</Typography>
					</Alert>
				</Stack>
			),
		},
		{
			title: "Crear una Nueva Tarea",
			content: <CreateTaskContent />,
		},
		{
			title: "Ver y Gestionar Tareas",
			content: <ViewManageTasksContent />,
		},
		{
			title: "Prioridades y Estados",
			content: <PrioritiesAndStatusContent />,
		},
		{
			title: "Exportar y Consejos",
			content: <ExportAndTipsContent />,
		},
	];

	return (
		<GuideShell
			open={open}
			onClose={onClose}
			icon={<Task size={18} variant="Bulk" />}
			eyebrow="Guía"
			title="Guía de Tareas"
			subtitle="Crear, priorizar y organizar tus pendientes"
			steps={steps}
		/>
	);
};

export default GuideTasks;
