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
import { useSelector } from "store";
import { ArrowRight, Task, TaskSquare, TickCircle } from "iconsax-react";
import { useNavigate } from "react-router-dom";

import StatsService, { TaskMetrics } from "store/reducers/ApiService";

// Componente para mostrar un listado simple de tareas
const TaskWidget = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const [loading, setLoading] = useState<boolean>(true);
	const [showAllTasks, setShowAllTasks] = useState<boolean>(false);
	const [taskData, setTaskData] = useState<{
		tasks: TaskType[];
		pendingTasks: number;
		completionRate: number;
	}>({
		tasks: [],
		pendingTasks: 0,
		completionRate: 0,
	});

	// Obtener userId del usuario actual
	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;

	// Cargar datos de tareas usando el dashboard summary
	useEffect(() => {
		const fetchData = async () => {
			if (userId) {
				try {
					setLoading(true);

					// Obtener el resumen del dashboard que incluye taskMetrics
					const summary = await StatsService.getDashboardSummary(userId);

					// Obtener métricas de tareas más detalladas
					let taskMetrics: TaskMetrics | null = null;
					try {
						taskMetrics = await StatsService.getCategoryAnalysis<TaskMetrics>("tasks", userId);
					} catch (error) {
						console.warn("No se pudieron obtener métricas detalladas de tareas:", error);
						// Continuamos con las métricas del dashboard summary
					}

					// Intentar obtener datos de actividad - esta parte es opcional
					try {
						// Solo llamamos a este endpoint para estar seguros de que funciona
						await StatsService.getCategoryAnalysis<any>("activity", userId);
						// No necesitamos almacenar estos datos ahora
					} catch (error) {
						console.warn("No se pudieron obtener datos de actividad:", error);
						// Continuamos sin problemas
					}

					// Crear datos simulados de tareas a partir de la información disponible
					// Esto es un ejemplo; ajusta según tu API real
					const mockTasks: TaskType[] = [];

					// Si hay tareas pendientes según las métricas, creamos entradas simuladas
					const pendingTaskCount = taskMetrics?.pendingTasks || summary.taskMetrics.pendingTasks || 0;

					for (let i = 0; i < Math.min(pendingTaskCount, 10); i++) {
						mockTasks.push({
							_id: `task-${i}`,
							name: `Tarea pendiente ${i + 1}`,
							checked: false,
							date: new Date(Date.now() + i * 86400000).toISOString(), // Distribuir fechas
						});
					}

					setTaskData({
						tasks: mockTasks,
						pendingTasks: pendingTaskCount,
						completionRate: taskMetrics?.completionRate || summary.taskMetrics.completionRate || 0,
					});
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

	// Decidir qué tareas mostrar
	const tasksToShow = showAllTasks ? taskData.tasks : taskData.tasks.slice(0, 5);

	// Estado de carga
	if (loading) {
		return (
			<MainCard>
				<CardContent>
					<Stack spacing={2}>
						<Stack spacing={0.75}>
							<Typography variant="h5">Mis Tareas</Typography>
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
	if (taskData.tasks.length === 0) {
		return (
			<MainCard>
				<CardContent>
					<Stack spacing={2}>
						<Stack spacing={0.75}>
							<Typography variant="h5">Mis Tareas</Typography>
							<Typography variant="caption" color="secondary">
								No hay tareas pendientes
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
							<TaskSquare size={32} variant="Bulk" color={theme.palette.text.secondary} />
							<Typography variant="body2" color="text.secondary" align="center">
								No tienes tareas asignadas en este momento.
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
							<Typography variant="h5">Mis Tareas</Typography>
							<Typography variant="caption" color="secondary">
								{taskData.pendingTasks} tareas pendientes
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
								}}
								secondaryAction={
									<Tooltip title={task.checked ? "Completada" : "Pendiente"}>
										<IconButton edge="end" size="small" color={task.checked ? "success" : "default"}>
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
											{new Date(task.date).toLocaleDateString()}
										</Typography>
									}
								/>
							</ListItem>
						))}
					</List>

					{!showAllTasks && taskData.tasks.length > 5 && (
						<Button fullWidth variant="text" color="primary" onClick={handleViewAllTasks} sx={{ mt: 1 }}>
							Ver {taskData.tasks.length - 5} tareas más
						</Button>
					)}
				</Stack>
			</CardContent>
		</MainCard>
	);
};

export default TaskWidget;
