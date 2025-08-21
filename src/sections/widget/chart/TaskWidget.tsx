import React from "react";
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import {
	Box,
	CardContent,
	CircularProgress,
	Stack,
	Typography,
	Button,
	Divider,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	Tooltip,
	IconButton,
} from "@mui/material";
import MainCard from "components/MainCard";
import { TaskType } from "types/task";
import { useSelector, dispatch, RootState } from "store";
import { ArrowRight, Task, TaskSquare, TickCircle, Calendar } from "iconsax-react";
import { useNavigate } from "react-router-dom";

// Importar acción para obtener tareas próximas
import { getUpcomingTasks, toggleTaskStatus } from "store/reducers/tasks";
import { getUnifiedStats } from "store/reducers/unifiedStats";

// Componente para mostrar un listado simple de tareas
const TaskWidget = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const [showAllTasks, setShowAllTasks] = useState<boolean>(false);

	// Constante para los días a mostrar
	const DAYS_TO_SHOW = 7;

	// Obtener userId del usuario actual
	const user = useSelector((state: RootState) => state.auth.user);
	const userId = user?._id;

	// Obtener tareas próximas del estado con el nombre correcto del reducer
	const upcomingTasks = useSelector((state: RootState) => state.tasksReducer.upcomingTasks);
	const isTasksLoading = useSelector((state: RootState) => state.tasksReducer.isLoader);

	// Obtener datos del store unificado
	const { data: unifiedData, isLoading: isStatsLoading, isInitialized } = useSelector((state: RootState) => state.unifiedStats);

	// Crear un objeto normalizado para las métricas de tareas
	const dashboardTasks = unifiedData?.dashboard?.tasks;
	const taskStats = unifiedData?.tasks;

	const taskMetrics = {
		pending: dashboardTasks?.pending || taskStats?.metrics?.pendingTasks || 0,
		completed: dashboardTasks?.completed || taskStats?.metrics?.completedTasks || 0,
		overdue: dashboardTasks?.overdue || taskStats?.metrics?.overdueTasks || 0,
	};

	// Cargar datos de tareas y métricas
	useEffect(() => {
		if (userId) {
			// Cargar estadísticas unificadas si no están disponibles
			if (!isInitialized && !unifiedData?.dashboard && !unifiedData?.tasks) {
				dispatch(getUnifiedStats(userId, "dashboard,tasks"));
			}

			// Cargar tareas próximas a vencer
			dispatch(getUpcomingTasks(userId, DAYS_TO_SHOW));
		}
	}, [userId, isInitialized, unifiedData]);

	// Función para mostrar todas las tareas y navegar a la página
	const handleViewAllTasks = () => {
		setShowAllTasks(true);
		navigate("/tasks");
	};

	// Función para cambiar el estado de una tarea
	const handleToggleTask = (id: string, event: React.MouseEvent) => {
		event.stopPropagation();
		dispatch(toggleTaskStatus(id));
	};

	// Función para abrir el detalle de una tarea
	const handleOpenTask = (id: string) => {
		navigate(`/tasks/${id}`);
	};

	// Decidir qué tareas mostrar
	const tasksToShow = showAllTasks ? upcomingTasks : upcomingTasks.slice(0, 5);

	// Estado de carga
	if ((isStatsLoading && !unifiedData) || isTasksLoading) {
		return (
			<MainCard>
				<CardContent>
					<Stack spacing={2}>
						<Stack spacing={0.75}>
							<Typography variant="h5">Tareas Próximas</Typography>
							<Typography variant="caption" color="secondary">
								Cargando información...
							</Typography>
						</Stack>
						<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
							<CircularProgress size={24} />
						</Box>
					</Stack>
				</CardContent>
			</MainCard>
		);
	}

	// No hay tareas
	if (upcomingTasks.length === 0) {
		return (
			<MainCard>
				<CardContent>
					<Stack spacing={2}>
						<Stack spacing={0.75}>
							<Typography variant="h5">Tareas Próximas</Typography>
							<Typography variant="caption" color="secondary">
								Próximos {DAYS_TO_SHOW} días
							</Typography>
						</Stack>

						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								py: 3,
								gap: 2,
							}}
						>
							<Calendar size={32} variant="Bulk" color={theme.palette.text.secondary} />
							<Typography variant="body2" color="text.secondary" align="center">
								No tienes tareas para los próximos {DAYS_TO_SHOW} días.
							</Typography>
						</Box>
					</Stack>
				</CardContent>
			</MainCard>
		);
	}

	return (
		<MainCard>
			<CardContent>
				<Stack spacing={2}>
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Stack spacing={0.5}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="h5">Tareas Próximas</Typography>
								<Tooltip title={`Tareas que vencen en los próximos ${DAYS_TO_SHOW} días`}>
									<Calendar size={16} variant="Linear" style={{ marginTop: 2 }} />
								</Tooltip>
							</Stack>
							<Typography variant="caption" color="secondary">
								Próximos {DAYS_TO_SHOW} días • {taskMetrics.pending} pendientes
								{taskMetrics.overdue > 0 ? ` • ${taskMetrics.overdue} vencidas` : ""}
							</Typography>
						</Stack>

						<Button endIcon={<ArrowRight size={16} />} color="primary" onClick={handleViewAllTasks}>
							Ver todas
						</Button>
					</Stack>

					<Divider />

					<List disablePadding>
						{tasksToShow.map((task: TaskType) => (
							<ListItem
								key={task._id}
								disablePadding
								sx={{
									py: 0.75,
									opacity: task.checked ? 0.7 : 1,
									cursor: "pointer",
									"&:hover": {
										bgcolor: theme.palette.action.hover,
									},
								}}
								onClick={() => handleOpenTask(task._id)}
								secondaryAction={
									<Tooltip title={task.checked ? "Completada" : "Marcar como completa"}>
										<IconButton
											edge="end"
											size="small"
											color={task.checked ? "success" : "default"}
											onClick={(e) => handleToggleTask(task._id, e)}
										>
											{task.checked ? <TickCircle size={18} variant="Bold" /> : <Task size={18} />}
										</IconButton>
									</Tooltip>
								}
							>
								<ListItemIcon sx={{ minWidth: "32px" }}>
									<TaskSquare
										size={18}
										variant={task.checked ? "Bold" : "Linear"}
										color={task.checked ? theme.palette.success.main : theme.palette.primary.main}
									/>
								</ListItemIcon>
								<ListItemText
									primary={
										<Typography
											variant="body2"
											color="textPrimary"
											sx={{
												textDecoration: task.checked ? "line-through" : "none",
												fontWeight: task.checked ? "normal" : "medium",
											}}
										>
											{task.name}
										</Typography>
									}
									secondary={
										<Typography variant="caption" color="textSecondary">
											{task.dueDate
												? new Date(task.dueDate).toLocaleDateString()
												: task.date
												? new Date(task.date).toLocaleDateString()
												: "Sin fecha"}
											{task.priority && ` • ${task.priority}`}
										</Typography>
									}
								/>
							</ListItem>
						))}
					</List>

					{!showAllTasks && upcomingTasks.length > 5 && (
						<Button fullWidth variant="text" color="primary" onClick={handleViewAllTasks} sx={{ mt: 1 }}>
							Ver {upcomingTasks.length - 5} tareas más
						</Button>
					)}
				</Stack>
			</CardContent>
		</MainCard>
	);
};

export default TaskWidget;
