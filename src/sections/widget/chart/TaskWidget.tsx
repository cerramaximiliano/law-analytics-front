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

import ApiService, { TaskMetrics } from "store/reducers/ApiService";

// Componente para mostrar un listado simple de tareas
const TaskWidget = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const [loading, setLoading] = useState<boolean>(true);
	const [showAllTasks, setShowAllTasks] = useState<boolean>(false);
	const [taskMetrics, setTaskMetrics] = useState<{
		pendingTasks: number;
		completionRate: number;
		overdueTasks: number;
	}>({
		pendingTasks: 0,
		completionRate: 0,
		overdueTasks: 0,
	});

	// Constante para los días a mostrar
	const DAYS_TO_SHOW = 7;

	// Obtener userId del usuario actual
	const user = useSelector((state: RootState) => state.auth.user);
	const userId = user?._id;

	// Obtener tareas próximas del estado con el nombre correcto del reducer
	const upcomingTasks = useSelector((state: RootState) => state.tasksReducer.upcomingTasks);
	const isTasksLoading = useSelector((state: RootState) => state.tasksReducer.isLoader);

	// Cargar datos de tareas y métricas
	useEffect(() => {
		const fetchData = async () => {
			if (userId) {
				try {
					setLoading(true);

					// Obtener el resumen del dashboard que incluye taskMetrics
					const summary = await ApiService.getDashboardSummary(userId);

					// Obtener métricas de tareas más detalladas
					let taskMetricsData: TaskMetrics | null = null;
					try {
						taskMetricsData = await ApiService.getCategoryAnalysis<TaskMetrics>("tasks", userId);
					} catch (error) {
						console.warn("No se pudieron obtener métricas detalladas de tareas:", error);
						// Continuamos con las métricas del dashboard summary
					}

					// Actualizar métricas de tareas
					setTaskMetrics({
						pendingTasks: taskMetricsData?.pendingTasks || summary.taskMetrics.pendingTasks || 0,
						completionRate: taskMetricsData?.completionRate || summary.taskMetrics.completionRate || 0,
						overdueTasks: taskMetricsData?.overdueTasks || 0,
					});

					// Cargar tareas próximas a vencer
					dispatch(getUpcomingTasks(userId, DAYS_TO_SHOW));
				} catch (error) {
					console.error("Error al cargar datos de tareas:", error);
				} finally {
					setLoading(false);
				}
			}
		};

		fetchData();
	}, [userId]);

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
	if (loading || isTasksLoading) {
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
								Próximos {DAYS_TO_SHOW} días • {taskMetrics.pendingTasks} pendientes • {taskMetrics.overdueTasks} vencidas
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
