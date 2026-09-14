import React from "react";
import { useState, useEffect } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import {
	Box,
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
import { ArrowRight, TaskSquare, TickCircle, Task as TaskIcon } from "iconsax-react";
import { useNavigate } from "react-router-dom";

// Importar acción para obtener tareas próximas
import { getUpcomingTasks, toggleTaskStatus } from "store/reducers/tasks";
import { getUnifiedStats } from "store/reducers/unifiedStats";

// Tokens
import { BRAND_BLUE, navActiveBg } from "themes/dashboardTokens";
import { ThemeMode } from "types/config";

// Componente para mostrar un listado simple de tareas
const TaskWidget = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
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
			if (!isInitialized && !unifiedData?.dashboard && !unifiedData?.tasks) {
				dispatch(getUnifiedStats(userId, "dashboard,tasks"));
			}
			dispatch(getUpcomingTasks(userId, DAYS_TO_SHOW));
		}
	}, [userId, isInitialized, unifiedData]);

	const handleViewAllTasks = () => {
		setShowAllTasks(true);
		navigate("/tasks");
	};

	const handleToggleTask = (id: string, event: React.MouseEvent) => {
		event.stopPropagation();
		dispatch(toggleTaskStatus(id));
	};

	const handleOpenTask = (id: string) => {
		navigate(`/tasks/${id}`);
	};

	const tasksToShow = showAllTasks ? upcomingTasks : upcomingTasks.slice(0, 5);

	// Header reusable — icono brand-tinted + título.
	const renderHeader = (subtitle: React.ReactNode) => (
		<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
			<Stack direction="row" alignItems="center" spacing={1.5}>
				<Box
					sx={{
						width: 40,
						height: 40,
						borderRadius: 1.5,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
						color: BRAND_BLUE,
					}}
				>
					<TaskIcon size={20} variant="Bulk" />
				</Box>
				<Stack spacing={0.25}>
					<Typography variant="subtitle1" sx={{ letterSpacing: "-0.005em" }}>
						Tareas próximas
					</Typography>
					{subtitle}
				</Stack>
			</Stack>
			{upcomingTasks.length > 0 && (
				<Button
					endIcon={<ArrowRight size={14} />}
					onClick={handleViewAllTasks}
					sx={{
						color: BRAND_BLUE,
						fontWeight: 600,
						fontSize: "0.8rem",
						textTransform: "none",
						letterSpacing: "-0.005em",
						"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.06) },
					}}
				>
					Ver todas
				</Button>
			)}
		</Stack>
	);

	// Loading
	if ((isStatsLoading && !unifiedData) || isTasksLoading) {
		return (
			<MainCard>
				<Stack spacing={2}>
					{renderHeader(
						<Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "-0.005em" }}>
							Cargando…
						</Typography>,
					)}
					<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
						<CircularProgress size={24} />
					</Box>
				</Stack>
			</MainCard>
		);
	}

	// Empty state
	if (upcomingTasks.length === 0) {
		return (
			<MainCard>
				<Stack spacing={2}>
					{renderHeader(
						<Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "-0.005em" }}>
							Próximos {DAYS_TO_SHOW} días
						</Typography>,
					)}
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							py: 3,
							gap: 1.5,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
							borderRadius: 1.5,
						}}
					>
						{/* Disco monocromático BRAND_BLUE coherente con container */}
						<Box
							sx={{
								width: 44,
								height: 44,
								borderRadius: "50%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.36 : 0.24)}`,
								color: BRAND_BLUE,
							}}
						>
							<TickCircle size={24} variant="Bulk" />
						</Box>
						<Typography
							variant="body2"
							sx={{ color: "text.secondary", letterSpacing: "-0.005em", textAlign: "center", textWrap: "balance" }}
						>
							No tenés tareas en los próximos {DAYS_TO_SHOW} días.
						</Typography>
					</Box>
				</Stack>
			</MainCard>
		);
	}

	// Lista con tareas
	return (
		<MainCard>
			<Stack spacing={2}>
				{renderHeader(
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontVariantNumeric: "tabular-nums",
							letterSpacing: "-0.005em",
						}}
					>
						Próximos {DAYS_TO_SHOW} días · {taskMetrics.pending} pendientes
						{taskMetrics.overdue > 0 && (
							<Box component="span" sx={{ color: theme.palette.error.main, fontWeight: 600, ml: 0.5 }}>
								· {taskMetrics.overdue} vencidas
							</Box>
						)}
					</Typography>,
				)}

				<Divider />

				<List disablePadding>
					{tasksToShow.map((task: TaskType) => (
						<ListItem
							key={task._id}
							disablePadding
							sx={{
								py: 0.75,
								px: 1,
								mx: -1,
								borderRadius: 1,
								opacity: task.checked ? 0.7 : 1,
								cursor: "pointer",
								transition: "background-color 0.15s ease-in-out",
								"&:hover": {
									bgcolor: navActiveBg(isDark),
								},
							}}
							onClick={() => handleOpenTask(task._id)}
							secondaryAction={
								<Tooltip title={task.checked ? "Completada" : "Marcar como completa"}>
									<IconButton
										edge="end"
										size="small"
										onClick={(e) => handleToggleTask(task._id, e)}
										sx={{
											color: task.checked ? theme.palette.success.main : "text.secondary",
											transition: "color 0.15s ease-in-out, background-color 0.15s ease-in-out",
											"&:hover": {
												color: theme.palette.success.main,
												bgcolor: alpha(theme.palette.success.main, 0.1),
											},
										}}
									>
										{task.checked ? <TickCircle size={18} variant="Bold" /> : <TaskSquare size={18} />}
									</IconButton>
								</Tooltip>
							}
						>
							<ListItemIcon sx={{ minWidth: "32px" }}>
								<TaskSquare
									size={18}
									variant={task.checked ? "Bold" : "Linear"}
									color={task.checked ? theme.palette.success.main : BRAND_BLUE}
								/>
							</ListItemIcon>
							<ListItemText
								primary={
									<Typography
										variant="body2"
										color="text.primary"
										sx={{
											textDecoration: task.checked ? "line-through" : "none",
											fontWeight: task.checked ? 400 : 500,
											letterSpacing: "-0.005em",
										}}
									>
										{task.name}
									</Typography>
								}
								secondary={
									<Typography
										variant="caption"
										sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.005em" }}
									>
										{task.dueDate
											? new Date(task.dueDate).toLocaleDateString("es-AR")
											: task.date
											? new Date(task.date).toLocaleDateString("es-AR")
											: "Sin fecha"}
										{task.priority && ` · ${task.priority}`}
									</Typography>
								}
							/>
						</ListItem>
					))}
				</List>

				{!showAllTasks && upcomingTasks.length > 5 && (
					<Button
						fullWidth
						variant="text"
						onClick={handleViewAllTasks}
						sx={{
							color: BRAND_BLUE,
							fontWeight: 600,
							fontSize: "0.85rem",
							textTransform: "none",
							letterSpacing: "-0.005em",
							"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.06) },
						}}
					>
						Ver {upcomingTasks.length - 5} tareas más
					</Button>
				)}
			</Stack>
		</MainCard>
	);
};

export default TaskWidget;
