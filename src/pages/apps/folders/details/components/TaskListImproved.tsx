import React, { useState, useEffect, useCallback, useMemo } from "react";
import MovementLinkChip from "components/MovementLinkChip";
import { Stack, Skeleton, Button, Typography, IconButton, Checkbox, Box, useTheme, useMediaQuery, alpha, Tooltip } from "@mui/material";
import MainCard from "components/MainCard";
import { Add, TaskSquare, Trash, TickCircle, Calendar, Filter, Edit2, Clock } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";
import dayjs from "utils/dayjs-config";
import { useParams } from "react-router";
import ModalTasks from "../modals/MoldalTasks";
import LinkTaskModal from "../modals/LinkTaskModal";
import ResponsiveButton from "./ResponsiveButton";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { motion, AnimatePresence } from "framer-motion";

// Redux
import { getTasksByFolderId, deleteTask, toggleTaskStatus } from "store/reducers/tasks";
import { dispatch, useSelector } from "store";
import type { RootState } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";

// Types
import { TaskListProps, TaskType } from "types/task";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

const TaskListImproved: React.FC<TaskListProps> = ({ title, folderName }) => {
	void title;
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const { id } = useParams<{ id: string }>();
	const { canDelete, canUpdate, canCreate } = useTeam();

	const tasks = useSelector((state: RootState) => state.tasksReducer?.selectedTasks || []) as TaskType[];
	const isLoading = useSelector((state: RootState) => state.tasksReducer?.isLoader || false);

	const [open, setOpen] = useState(false);
	const [editTask, setEditTask] = useState<TaskType | null>(null);
	const [showCompleted, setShowCompleted] = useState(true);
	const [parent] = useAutoAnimate({ duration: 200 });
	const [linkModalOpen, setLinkModalOpen] = useState(false);

	useEffect(() => {
		if (id) {
			dispatch(getTasksByFolderId(id));
		}
	}, [id]);

	const taskStats = useMemo(() => {
		const completed = tasks.filter((task) => task.checked).length;
		const pending = tasks.filter((task) => !task.checked).length;
		const total = tasks.length;
		const percentage = total > 0 ? (completed / total) * 100 : 0;

		const overdue = tasks.filter((task) => {
			if (task.checked) return false;
			const taskDate = dayjs(task.dueDate || task.date);
			return taskDate.isValid() && taskDate.isBefore(dayjs(), "day");
		}).length;

		const today = tasks.filter((task) => {
			const taskDate = dayjs(task.dueDate || task.date);
			return taskDate.isValid() && taskDate.isSame(dayjs(), "day");
		}).length;

		const thisWeek = tasks.filter((task) => {
			const taskDate = dayjs(task.dueDate || task.date);
			return taskDate.isValid() && taskDate.isSame(dayjs(), "week");
		}).length;

		return { completed, pending, total, percentage, overdue, today, thisWeek };
	}, [tasks]);

	const displayTasks = useMemo(() => {
		let filtered = [...tasks];

		filtered.sort((a, b) => {
			if (a.checked !== b.checked) {
				return a.checked ? 1 : -1;
			}
			const dateA = dayjs(a.dueDate || a.date);
			const dateB = dayjs(b.dueDate || b.date);
			return dateB.diff(dateA);
		});

		if (!showCompleted) {
			filtered = filtered.filter((task) => !task.checked);
		}

		return filtered;
	}, [tasks, showCompleted]);

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

	const brandIconButtonSx = (accent: string = BRAND_BLUE) => ({
		width: 28,
		height: 28,
		borderRadius: 0.75,
		border: `1px solid ${alpha(accent, isDark ? 0.22 : 0.14)}`,
		bgcolor: alpha(accent, isDark ? 0.08 : 0.04),
		color: accent,
		transition: "all 180ms ease",
		"&:hover": {
			bgcolor: alpha(accent, isDark ? 0.18 : 0.1),
			borderColor: alpha(accent, isDark ? 0.38 : 0.28),
		},
	});

	const StatCard = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) => (
		<Box
			sx={{
				flex: "1 1 auto",
				minWidth: 140,
				p: 1.5,
				borderRadius: 1.25,
				bgcolor: alpha(accent, isDark ? 0.08 : 0.04),
				border: `1px solid ${alpha(accent, isDark ? 0.24 : 0.16)}`,
			}}
		>
			<Stack direction="row" alignItems="center" spacing={1.25}>
				<Box
					sx={{
						width: 32,
						height: 32,
						borderRadius: 0.875,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(accent, isDark ? 0.16 : 0.1),
						border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
						color: accent,
						flexShrink: 0,
					}}
				>
					{icon}
				</Box>
				<Stack spacing={0}>
					<Typography
						sx={{
							fontSize: "1.15rem",
							fontWeight: 700,
							color: accent,
							letterSpacing: "-0.015em",
							fontVariantNumeric: "tabular-nums",
							lineHeight: 1.1,
						}}
					>
						{value}
					</Typography>
					<Typography
						sx={{
							fontSize: "0.6rem",
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "text.secondary",
						}}
					>
						{label}
					</Typography>
				</Stack>
			</Stack>
		</Box>
	);

	const EmptyState = () => (
		<Box
			sx={{
				p: 3.5,
				textAlign: "center",
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
				border: `1px dashed ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.2)}`,
				borderRadius: 1.5,
			}}
		>
			<Box
				sx={{
					width: 56,
					height: 56,
					borderRadius: 1.5,
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
					color: BRAND_BLUE,
					mb: 1.5,
				}}
			>
				<TaskSquare size={28} variant="Bulk" />
			</Box>
			<Typography sx={{ fontSize: "1rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.015em" }}>
				Sin tareas registradas
			</Typography>
			<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em", mt: 0.5, maxWidth: 320, mx: "auto" }}>
				Empezá creando una tarea nueva o vinculá una existente.
			</Typography>
		</Box>
	);

	const TaskItem = ({ task, index }: { task: TaskType; index: number }) => {
		const taskDate = dayjs(task.dueDate || task.date);
		const isOverdue = !task.checked && taskDate.isBefore(dayjs(), "day");
		const isToday = taskDate.isSame(dayjs(), "day");
		const isTomorrow = taskDate.isSame(dayjs().add(1, "day"), "day");

		const accentBorder = task.checked
			? alpha(BRAND_BLUE, isDark ? 0.12 : 0.08)
			: isOverdue
			? alpha(errorColor, isDark ? 0.32 : 0.22)
			: isToday
			? alpha(STALE_AMBER, isDark ? 0.32 : 0.22)
			: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1);
		const accentBg = task.checked
			? alpha(BRAND_BLUE, isDark ? 0.02 : 0.01)
			: isOverdue
			? alpha(errorColor, isDark ? 0.04 : 0.02)
			: isToday
			? alpha(STALE_AMBER, isDark ? 0.04 : 0.02)
			: theme.palette.background.paper;

		const dateColor = isOverdue ? errorColor : isToday ? STALE_AMBER : theme.palette.text.secondary;

		return (
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
				<Box
					sx={{
						p: 1.5,
						mb: 1.25,
						borderRadius: 1.25,
						border: `1px solid ${accentBorder}`,
						bgcolor: accentBg,
						opacity: task.checked ? 0.75 : 1,
						transition: "all 180ms ease",
						"&:hover": {
							borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
						},
					}}
				>
					<Stack direction="row" alignItems="center" spacing={1.5}>
						<Checkbox
							checked={task.checked}
							onChange={() => handleCheckboxChange(task._id)}
							disabled={!canUpdate}
							sx={{
								p: 0.5,
								color: alpha(BRAND_BLUE, 0.5),
								"&.Mui-checked": { color: LIVE_GREEN },
							}}
						/>
						<Box flex={1} sx={{ minWidth: 0 }}>
							<Typography
								sx={{
									fontSize: "0.9rem",
									textDecoration: task.checked ? "line-through" : "none",
									color: task.checked ? "text.secondary" : "text.primary",
									fontWeight: task.checked ? 400 : 600,
									letterSpacing: "-0.005em",
								}}
							>
								{task.name}
							</Typography>
							{task.movementRef ? (
								<Box sx={{ mt: 0.5 }}>
									<MovementLinkChip movementRef={task.movementRef} />
								</Box>
							) : null}
							{task.description && (
								<Typography
									sx={{
										fontSize: "0.74rem",
										color: "text.secondary",
										letterSpacing: "-0.005em",
										mt: 0.375,
										opacity: 0.85,
									}}
								>
									{task.description}
								</Typography>
							)}
							<Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
								<Calendar size={12} variant="Bulk" color={dateColor} />
								<Typography
									sx={{
										fontSize: "0.72rem",
										color: dateColor,
										fontWeight: isOverdue || isToday ? 600 : 400,
										letterSpacing: "-0.005em",
									}}
								>
									{taskDate.format("DD/MM/YYYY")}
									{isOverdue && " · Vencida"}
									{isToday && " · Hoy"}
									{isTomorrow && " · Mañana"}
								</Typography>
							</Stack>
						</Box>
						<Stack direction="row" spacing={0.625} sx={{ flexShrink: 0 }}>
							{canUpdate && (
								<Tooltip title="Editar">
									<IconButton size="small" onClick={() => handleEditTask(task)} sx={brandIconButtonSx(BRAND_BLUE)}>
										<Edit2 size={14} variant="Bulk" />
									</IconButton>
								</Tooltip>
							)}
							{canDelete && (
								<Tooltip title="Eliminar">
									<IconButton size="small" onClick={() => handleDeleteTask(task._id)} sx={brandIconButtonSx(errorColor)}>
										<Trash size={14} variant="Bulk" />
									</IconButton>
								</Tooltip>
							)}
						</Stack>
					</Stack>
				</Box>
			</motion.div>
		);
	};

	const ctaButtonSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		bgcolor: BRAND_BLUE,
		color: "#fff",
		borderRadius: 1.25,
		py: 1,
		boxShadow: "none",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
	};

	const ghostCtaSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: BRAND_BLUE,
		borderRadius: 1.25,
		py: 1,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		bgcolor: "transparent",
		"&:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
		},
	};

	return (
		<MainCard
			content={false}
			sx={{
				"& .MuiCardContent-root": { p: 0 },
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				boxShadow: "none",
				overflow: "hidden",
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

			<Box sx={{ p: 2 }}>
				{isLoading ? (
					<Stack spacing={1.25}>
						{[1, 2, 3].map((index) => (
							<Skeleton key={index} variant="rectangular" height={80} sx={{ borderRadius: 1.25 }} />
						))}
					</Stack>
				) : tasks.length === 0 ? (
					<>
						<EmptyState />
						{canCreate && (
							<Stack direction={isMobile ? "column" : "row"} spacing={1.25} sx={{ mt: 2 }}>
								<ResponsiveButton
									fullWidth={!isMobile}
									startIcon={<Add size={16} variant="Bulk" />}
									onClick={handleOpen}
									disabled={isLoading}
									mobileText="Nueva"
									desktopText="Nueva tarea"
									hideTextOnMobile={false}
									sx={ctaButtonSx}
								>
									Nueva tarea
								</ResponsiveButton>
								<ResponsiveButton
									fullWidth={!isMobile}
									startIcon={<TaskSquare size={16} variant="Bulk" />}
									onClick={() => setLinkModalOpen(true)}
									disabled={isLoading}
									mobileText="Vincular"
									desktopText="Vincular tarea"
									hideTextOnMobile={false}
									sx={ghostCtaSx}
								>
									Vincular tarea
								</ResponsiveButton>
							</Stack>
						)}
					</>
				) : (
					<Box sx={{ display: "flex", flexDirection: "column", maxWidth: "100%", overflow: "hidden" }}>
						{/* Stats */}
						<Stack spacing={1.5} sx={{ flexShrink: 0, mb: 1.5 }}>
							<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
								<StatCard
									icon={<TickCircle size={16} variant="Bulk" />}
									label="Completadas"
									value={taskStats.completed}
									accent={LIVE_GREEN}
								/>
								<StatCard icon={<Clock size={16} variant="Bulk" />} label="Pendientes" value={taskStats.pending} accent={STALE_AMBER} />
								{taskStats.overdue > 0 && (
									<StatCard icon={<Calendar size={16} variant="Bulk" />} label="Vencidas" value={taskStats.overdue} accent={errorColor} />
								)}
							</Stack>

							{/* Progress */}
							<Box>
								<Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.625}>
									<Stack direction="row" spacing={0.5} alignItems="center">
										<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
										<Typography
											sx={{
												fontSize: "0.6rem",
												fontWeight: 600,
												letterSpacing: "0.08em",
												textTransform: "uppercase",
												color: "text.secondary",
											}}
										>
											Progreso general
										</Typography>
									</Stack>
									<Typography
										sx={{
											fontSize: "0.82rem",
											fontWeight: 700,
											color: taskStats.percentage === 100 ? LIVE_GREEN : BRAND_BLUE,
											letterSpacing: "-0.005em",
											fontVariantNumeric: "tabular-nums",
										}}
									>
										{Math.round(taskStats.percentage)}%
									</Typography>
								</Stack>
								<Box
									sx={{
										width: "100%",
										height: 6,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08),
										borderRadius: 1,
										overflow: "hidden",
									}}
								>
									<Box
										sx={{
											width: `${taskStats.percentage}%`,
											height: "100%",
											bgcolor: taskStats.percentage === 100 ? LIVE_GREEN : BRAND_BLUE,
											transition: "width 300ms ease",
										}}
									/>
								</Box>
							</Box>
						</Stack>

						{/* Filter */}
						<Stack
							direction="row"
							justifyContent="space-between"
							alignItems="center"
							sx={{
								py: 1.25,
								flexShrink: 0,
								borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
							}}
						>
							<Typography
								sx={{
									fontSize: "0.7rem",
									fontWeight: 600,
									letterSpacing: "0.04em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								{displayTasks.length} {displayTasks.length === 1 ? "tarea" : "tareas"}
							</Typography>
							<Button
								size="small"
								startIcon={
									showCompleted ? (
										<TickCircle size={14} variant="Bulk" color={BRAND_BLUE} />
									) : (
										<Filter size={14} variant="Bulk" color={BRAND_BLUE} />
									)
								}
								onClick={() => setShowCompleted(!showCompleted)}
								sx={{
									textTransform: "none",
									fontWeight: 600,
									fontSize: "0.78rem",
									letterSpacing: "-0.005em",
									color: BRAND_BLUE,
									borderRadius: 1,
									px: 1,
									"&:hover": {
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
									},
								}}
							>
								{showCompleted ? "Ocultar completadas" : "Mostrar todas"}
							</Button>
						</Stack>

						{/* Tasks List */}
						<Box sx={{ maxWidth: "100%", overflow: "hidden" }}>
							<SimpleBar style={{ maxHeight: 400 }}>
								<Box ref={parent}>
									<AnimatePresence>
										{displayTasks.map((task, index) => (
											<TaskItem key={task._id} task={task} index={index} />
										))}
									</AnimatePresence>
								</Box>
							</SimpleBar>
						</Box>

						{/* CTA buttons */}
						{canCreate && (
							<Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2, flexShrink: 0 }}>
								<Button
									variant="contained"
									fullWidth
									startIcon={<Add size={16} variant="Bulk" />}
									onClick={handleOpen}
									disabled={isLoading}
									sx={ctaButtonSx}
								>
									Nueva tarea
								</Button>
								<Button
									fullWidth
									startIcon={<TaskSquare size={16} variant="Bulk" />}
									onClick={() => setLinkModalOpen(true)}
									disabled={isLoading}
									sx={ghostCtaSx}
								>
									Vincular tarea
								</Button>
							</Stack>
						)}
					</Box>
				)}
			</Box>

			<LinkTaskModal
				open={linkModalOpen}
				onClose={() => {
					setLinkModalOpen(false);
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
