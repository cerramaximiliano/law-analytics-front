import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
	Stack,
	Skeleton,
	Button,
	LinearProgress,
	Typography,
	IconButton,
	Checkbox,
	Box,
	Paper,
	useTheme,
	alpha,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Avatar,
	Tooltip,
} from "@mui/material";
import MainCard from "components/MainCard";
import { Add, TaskSquare, Trash, TickCircle, CloseCircle, Calendar, Filter, Edit2 } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";
import moment from "moment";
import { useParams } from "react-router";
import ModalTasks from "../modals/MoldalTasks";
import LinkTaskModal from "../modals/LinkTaskModal";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { motion, AnimatePresence } from "framer-motion";

// Redux
import { getTasksByFolderId, deleteTask, toggleTaskStatus } from "store/reducers/tasks";
import { dispatch, useSelector } from "store";
import type { RootState } from "store";
import { openSnackbar } from "store/reducers/snackbar";

// Types
import { TaskListProps, TaskType } from "types/task";

const TaskListImproved: React.FC<TaskListProps> = ({ title, folderName }) => {
	const theme = useTheme();
	const { id } = useParams<{ id: string }>();

	// Redux state
	const tasks = useSelector((state: RootState) => state.tasksReducer?.selectedTasks || []) as TaskType[];
	const isLoading = useSelector((state: RootState) => state.tasksReducer?.isLoader || false);

	// Local state
	const [open, setOpen] = useState(false);
	const [editTask, setEditTask] = useState<TaskType | null>(null);
	const [showCompleted, setShowCompleted] = useState(true);
	const [parent] = useAutoAnimate({ duration: 200 });
	const [linkModalOpen, setLinkModalOpen] = useState(false);

	// Fetch tasks on mount
	useEffect(() => {
		if (id) {
			dispatch(getTasksByFolderId(id));
		}
	}, [id]);

	// Memoized calculations
	const taskStats = useMemo(() => {
		const completed = tasks.filter((task) => task.checked).length;
		const pending = tasks.filter((task) => !task.checked).length;
		const total = tasks.length;
		const percentage = total > 0 ? (completed / total) * 100 : 0;

		// Tasks by date
		const overdue = tasks.filter((task) => {
			if (task.checked) return false;
			const taskDate = moment(task.dueDate || task.date);
			return taskDate.isValid() && taskDate.isBefore(moment(), "day");
		}).length;

		const today = tasks.filter((task) => {
			const taskDate = moment(task.dueDate || task.date);
			return taskDate.isValid() && taskDate.isSame(moment(), "day");
		}).length;

		const thisWeek = tasks.filter((task) => {
			const taskDate = moment(task.dueDate || task.date);
			return taskDate.isValid() && taskDate.isSame(moment(), "week");
		}).length;

		return { completed, pending, total, percentage, overdue, today, thisWeek };
	}, [tasks]);

	// Sorted and filtered tasks
	const displayTasks = useMemo(() => {
		let filtered = [...tasks];

		// Sort by date (newest first) and completion status
		filtered.sort((a, b) => {
			// Uncompleted tasks first
			if (a.checked !== b.checked) {
				return a.checked ? 1 : -1;
			}
			// Then by date
			const dateA = moment(a.dueDate || a.date);
			const dateB = moment(b.dueDate || b.date);
			return dateB.diff(dateA);
		});

		// Filter completed tasks if needed
		if (!showCompleted) {
			filtered = filtered.filter((task) => !task.checked);
		}

		return filtered;
	}, [tasks, showCompleted]);

	// Handlers
	const handleOpen = useCallback(() => {
		if (!isLoading) {
			setOpen(true);
		}
	}, [isLoading]);

	const handleEditTask = (task: TaskType) => {
		setEditTask(task);
		setOpen(true);
	};

	const handleDeleteTask = useCallback(async (taskId: string) => {
		try {
			const result = await dispatch(deleteTask(taskId));
			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Tarea eliminada exitosamente",
						variant: "alert",
						alert: { color: "success" },
						close: true,
					}),
				);
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: result.error || "Error al eliminar la tarea",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al eliminar la tarea",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	}, []);

	const handleCheckboxChange = useCallback(async (taskId: string) => {
		try {
			const result = await dispatch(toggleTaskStatus(taskId));
			if (!result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: result.error || "Error al actualizar el estado de la tarea",
						variant: "alert",
						alert: { color: "error" },
						close: true,
					}),
				);
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al actualizar el estado de la tarea",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	}, []);

	// Components
	const EmptyState = () => (
		<Box sx={{ textAlign: "center", py: 4 }}>
			<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
				<Avatar
					color="error"
					variant="rounded"
					sx={{
						width: 64,
						height: 64,
						bgcolor: alpha(theme.palette.error.main, 0.1),
						color: "error.main",
						mx: "auto",
						mb: 2,
					}}
				>
					<TaskSquare variant="Bold" size={32} />
				</Avatar>
			</motion.div>
			<Typography variant="subtitle1" color="textSecondary" gutterBottom>
				No hay tareas registradas
			</Typography>
			<Typography variant="body2" color="textSecondary" sx={{ maxWidth: 320, mx: "auto" }}>
				Comienza creando una tarea nueva o vincula una existente
			</Typography>
		</Box>
	);

	const TaskItem = ({ task, index }: { task: TaskType; index: number }) => {
		const taskDate = moment(task.dueDate || task.date);
		const isOverdue = !task.checked && taskDate.isBefore(moment(), "day");
		const isToday = taskDate.isSame(moment(), "day");
		const isTomorrow = taskDate.isSame(moment().add(1, "day"), "day");

		return (
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
				<Paper
					elevation={0}
					sx={{
						p: 2,
						mb: 1.5,
						border: `1px solid ${
							isOverdue && !task.checked
								? alpha(theme.palette.error.main, 0.3)
								: isToday && !task.checked
								? alpha(theme.palette.warning.main, 0.3)
								: theme.palette.divider
						}`,
						borderRadius: 2,
						transition: "all 0.2s ease",
						opacity: task.checked ? 0.7 : 1,
						bgcolor: task.checked
							? alpha(theme.palette.action.selected, 0.02)
							: isOverdue
							? alpha(theme.palette.error.main, 0.02)
							: isToday
							? alpha(theme.palette.warning.main, 0.02)
							: "background.paper",
						"&:hover": {
							borderColor: theme.palette.primary.main,
							bgcolor: alpha(theme.palette.primary.main, 0.02),
							transform: "translateY(-2px)",
							boxShadow: theme.shadows[2],
						},
					}}
				>
					<Stack direction="row" alignItems="center" spacing={2}>
						<Checkbox
							checked={task.checked}
							onChange={() => handleCheckboxChange(task._id)}
							color="primary"
							sx={{
								"&.Mui-checked": {
									color: theme.palette.success.main,
								},
							}}
						/>
						<Box flex={1}>
							<Typography
								variant="body1"
								sx={{
									textDecoration: task.checked ? "line-through" : "none",
									color: task.checked ? "text.secondary" : "text.primary",
									fontWeight: task.checked ? 400 : 500,
								}}
							>
								{task.name}
							</Typography>
							{task.description && (
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{
										display: "block",
										mt: 0.5,
										opacity: 0.8,
									}}
								>
									{task.description}
								</Typography>
							)}
							<Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
								<Calendar size={14} color={theme.palette.text.secondary} />
								<Typography
									variant="caption"
									color={isOverdue ? "error.main" : isToday ? "warning.main" : "text.secondary"}
									fontWeight={isOverdue || isToday ? 600 : 400}
								>
									{taskDate.format("DD/MM/YYYY")}
									{isOverdue && " • Vencida"}
									{isToday && " • Hoy"}
									{isTomorrow && " • Mañana"}
								</Typography>
							</Stack>
						</Box>
						<Stack direction="row" spacing={0.5}>
							<Tooltip title="Editar">
								<IconButton
									size="small"
									onClick={() => handleEditTask(task)}
									sx={{
										color: "text.secondary",
										"&:hover": {
											bgcolor: alpha(theme.palette.primary.main, 0.1),
											color: "primary.main",
										},
									}}
								>
									<Edit2 size={16} />
								</IconButton>
							</Tooltip>
							<Tooltip title="Eliminar">
								<IconButton
									size="small"
									onClick={() => handleDeleteTask(task._id)}
									sx={{
										color: "text.secondary",
										"&:hover": {
											bgcolor: alpha(theme.palette.error.main, 0.1),
											color: "error.main",
										},
									}}
								>
									<Trash size={16} />
								</IconButton>
							</Tooltip>
						</Stack>
					</Stack>
				</Paper>
			</motion.div>
		);
	};

	return (
		<MainCard
			shadow={3}
			title={
				title ? (
					<List disablePadding>
						<ListItem sx={{ p: 0 }}>
							<ListItemAvatar>
								<Avatar color="warning" variant="rounded">
									<TaskSquare variant="Bold" />
								</Avatar>
							</ListItemAvatar>
							<ListItemText
								sx={{ my: 0 }}
								primary="Tareas"
								secondary={<Typography variant="subtitle1">Actividades y recordatorios del expediente</Typography>}
							/>
						</ListItem>
					</List>
				) : null
			}
			content={false}
			sx={{
				"& .MuiCardContent-root": {
					p: 2.5,
				},
			}}
		>
			<ModalTasks
				open={open}
				setOpen={setOpen}
				folderId={id || ""}
				folderName={folderName}
				editMode={!!editTask}
				taskToEdit={editTask}
				onClose={() => {
					setOpen(false);
					setEditTask(null);
				}}
			/>

			<Box sx={{ p: 2.5 }}>
				{isLoading ? (
					<Stack spacing={2}>
						{[1, 2, 3].map((index) => (
							<Paper key={index} sx={{ p: 2 }}>
								<Stack direction="row" spacing={2} alignItems="center">
									<Skeleton variant="circular" width={24} height={24} />
									<Box flex={1}>
										<Skeleton width="70%" height={20} sx={{ mb: 0.5 }} />
										<Skeleton width="30%" height={16} />
									</Box>
									<Skeleton variant="circular" width={30} height={30} />
								</Stack>
							</Paper>
						))}
					</Stack>
				) : tasks.length === 0 ? (
					// Empty state - compact view
					<>
						<EmptyState />
						{/* Task Action Buttons */}
						<Stack direction="row" spacing={2} sx={{ mt: 3 }}>
							<Button variant="contained" fullWidth color="primary" startIcon={<Add size={18} />} onClick={handleOpen} disabled={isLoading}>
								Nueva Tarea
							</Button>
							<Button
								variant="outlined"
								fullWidth
								color="primary"
								startIcon={<TaskSquare size={18} />}
								onClick={() => setLinkModalOpen(true)}
								disabled={isLoading}
							>
								Vincular Tarea
							</Button>
						</Stack>
					</>
				) : (
					// Tasks view - with fixed height and scroll
					<Box sx={{ display: "flex", flexDirection: "column", height: "500px" }}>
						<>
							{/* Stats Overview - Fixed */}
							<Stack spacing={2} sx={{ flexShrink: 0 }}>
								<Stack direction="row" spacing={2}>
									<Paper
										elevation={0}
										sx={{
											flex: 1,
											p: 2,
											bgcolor: alpha(theme.palette.success.main, 0.08),
											border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
											borderRadius: 2,
										}}
									>
										<Stack direction="row" alignItems="center" spacing={1}>
											<TickCircle size={20} color={theme.palette.success.main} />
											<Box>
												<Typography variant="h5" color="success.main">
													{taskStats.completed}
												</Typography>
												<Typography variant="caption" color="text.secondary">
													Completadas
												</Typography>
											</Box>
										</Stack>
									</Paper>
									<Paper
										elevation={0}
										sx={{
											flex: 1,
											p: 2,
											bgcolor: alpha(theme.palette.warning.main, 0.08),
											border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
											borderRadius: 2,
										}}
									>
										<Stack direction="row" alignItems="center" spacing={1}>
											<CloseCircle size={20} color={theme.palette.warning.main} />
											<Box>
												<Typography variant="h5" color="warning.main">
													{taskStats.pending}
												</Typography>
												<Typography variant="caption" color="text.secondary">
													Pendientes
												</Typography>
											</Box>
										</Stack>
									</Paper>
									{taskStats.overdue > 0 && (
										<Paper
											elevation={0}
											sx={{
												flex: 1,
												p: 2,
												bgcolor: alpha(theme.palette.error.main, 0.08),
												border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
												borderRadius: 2,
											}}
										>
											<Stack direction="row" alignItems="center" spacing={1}>
												<Calendar size={20} color={theme.palette.error.main} />
												<Box>
													<Typography variant="h5" color="error.main">
														{taskStats.overdue}
													</Typography>
													<Typography variant="caption" color="text.secondary">
														Vencidas
													</Typography>
												</Box>
											</Stack>
										</Paper>
									)}
								</Stack>

								{/* Progress Bar */}
								<Box>
									<Stack direction="row" justifyContent="space-between" mb={1}>
										<Typography variant="body2" color="text.secondary">
											Progreso general
										</Typography>
										<Typography variant="body2" fontWeight={600}>
											{Math.round(taskStats.percentage)}%
										</Typography>
									</Stack>
									<LinearProgress
										variant="determinate"
										value={taskStats.percentage}
										sx={{
											height: 8,
											borderRadius: 4,
											bgcolor: "grey.200",
											"& .MuiLinearProgress-bar": {
												borderRadius: 4,
												bgcolor: "success.main",
											},
										}}
									/>
								</Box>
							</Stack>

							{/* Filter - Fixed */}
							<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 2, flexShrink: 0 }}>
								<Typography variant="subtitle2" color="text.secondary">
									{displayTasks.length} {displayTasks.length === 1 ? "tarea" : "tareas"}
								</Typography>
								<Button
									size="small"
									startIcon={showCompleted ? <TickCircle size={16} /> : <Filter size={16} />}
									onClick={() => setShowCompleted(!showCompleted)}
									sx={{ color: "text.secondary" }}
								>
									{showCompleted ? "Ocultar completadas" : "Mostrar todas"}
								</Button>
							</Stack>

							{/* Tasks List - Scrollable */}
							<Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
								<SimpleBar style={{ height: "100%" }}>
									<Box ref={parent}>
										<AnimatePresence>
											{displayTasks.map((task, index) => (
												<TaskItem key={task._id} task={task} index={index} />
											))}
										</AnimatePresence>
									</Box>
								</SimpleBar>
							</Box>
							{/* Task Action Buttons - Fixed at bottom */}
							<Stack direction="row" spacing={2} sx={{ mt: 2, flexShrink: 0 }}>
								<Button
									variant="contained"
									fullWidth
									color="primary"
									startIcon={<Add size={18} />}
									onClick={handleOpen}
									disabled={isLoading}
								>
									Nueva Tarea
								</Button>
								<Button
									variant="outlined"
									fullWidth
									color="primary"
									startIcon={<TaskSquare size={18} />}
									onClick={() => setLinkModalOpen(true)}
									disabled={isLoading}
								>
									Vincular Tarea
								</Button>
							</Stack>
						</>
					</Box>
				)}
			</Box>

			{/* Link Task Modal */}
			<LinkTaskModal
				open={linkModalOpen}
				onClose={() => {
					setLinkModalOpen(false);
					// Refresh tasks after linking
					if (id) {
						dispatch(getTasksByFolderId(id));
					}
				}}
				folderId={id || ""}
				folderName={folderName}
			/>
		</MainCard>
	);
};

export default TaskListImproved;
