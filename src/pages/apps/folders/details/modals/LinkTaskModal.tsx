import React, { useState, useEffect } from "react";
import {
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Stack,
	Typography,
	FormControl,
	FormLabel,
	RadioGroup,
	FormControlLabel,
	Radio,
	Skeleton,
	Alert,
	Box,
	alpha,
	useTheme,
	Divider,
} from "@mui/material";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import SimpleBar from "components/third-party/SimpleBar";
import { TaskSquare, Calendar, Folder } from "iconsax-react";
import { PopupTransition } from "components/@extended/Transitions";
import dayjs from "utils/dayjs-config";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// Redux
import { useSelector, dispatch } from "store";
import type { RootState } from "store";
import { getTasksByUserId, updateTask } from "store/reducers/tasks";
import { openSnackbar } from "store/reducers/snackbar";

interface LinkTaskModalProps {
	open: boolean;
	onClose: () => void;
	folderId: string;
	folderName: string;
}

interface TaskWithFolder {
	_id: string;
	name: string;
	date?: string;
	dueDate?: string | Date;
	description?: string;
	folderId?: string;
	folderName?: string;
	checked: boolean;
}

const LinkTaskModal: React.FC<LinkTaskModalProps> = ({ open, onClose, folderId, folderName }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [selectedTaskId, setSelectedTaskId] = useState<string>("");
	const [isLinking, setIsLinking] = useState(false);
	const [availableTasks, setAvailableTasks] = useState<TaskWithFolder[]>([]);
	const [isLoadingTasks, setIsLoadingTasks] = useState(false);

	// Get current user and tasks from Redux
	const user = useSelector((state: RootState) => state.auth.user);
	const userId = user?._id || user?.id;
	const allTasks = useSelector((state: RootState) => state.tasksReducer?.tasks || []);

	// Fetch user tasks when modal opens
	useEffect(() => {
		if (open && userId) {
			fetchUserTasks();
		}
	}, [open, userId]);

	// Update available tasks when Redux tasks change
	useEffect(() => {
		if (open) {
			// Filter out tasks that are already in the current folder or completed
			const tasksToShow = allTasks.filter((task: any) => task.folderId !== folderId && !task.checked);
			setAvailableTasks(tasksToShow);
		}
	}, [allTasks, folderId, open]);

	const fetchUserTasks = async () => {
		if (!userId) return;

		setIsLoadingTasks(true);
		try {
			const result = await dispatch(getTasksByUserId(userId));
			if (!result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: result.error || "Error al cargar las tareas",
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
					message: "Error al cargar las tareas",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			setIsLoadingTasks(false);
		}
	};

	const handleLinkTask = async () => {
		if (!selectedTaskId) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Por favor selecciona una tarea",
					variant: "alert",
					alert: { color: "warning" },
					close: true,
				}),
			);
			return;
		}

		setIsLinking(true);
		try {
			const result = await dispatch(updateTask(selectedTaskId, { folderId }));
			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Tarea vinculada exitosamente",
						variant: "alert",
						alert: { color: "success" },
						close: true,
					}),
				);
				// Refresh folder tasks
				onClose();
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: result.error || "Error al vincular la tarea",
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
					message: "Error al vincular la tarea",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		} finally {
			setIsLinking(false);
		}
	};

	const handleClose = () => {
		setSelectedTaskId("");
		onClose();
	};

	return (
		<ResponsiveDialog
			open={open}
			onClose={handleClose}
			TransitionComponent={PopupTransition}
			keepMounted
			maxWidth="sm"
			fullWidth
			aria-labelledby="link-task-modal-title"
			PaperProps={{
				elevation: 0,
				sx: {
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
					overflow: "hidden",
				},
			}}
		>
			<DialogTitle
				id="link-task-modal-title"
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1.25,
					px: 2.5,
					py: 1.75,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				}}
			>
				<Box
					sx={{
						width: 32,
						height: 32,
						borderRadius: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
						color: BRAND_BLUE,
					}}
				>
					<TaskSquare size={18} variant="Bulk" />
				</Box>
				<Stack spacing={0.125} sx={{ minWidth: 0, flex: 1 }}>
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
							Vincular
						</Typography>
					</Stack>
					<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
						Vincular tarea existente
					</Typography>
					<Typography
						sx={{
							fontSize: "0.72rem",
							color: "text.secondary",
							letterSpacing: "-0.005em",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						Seleccioná una tarea para vincular a "{folderName}"
					</Typography>
				</Stack>
			</DialogTitle>

			<DialogContent sx={{ p: 2.5 }}>
				{isLoadingTasks ? (
					<Stack spacing={1.5} sx={{ py: 1 }}>
						{[1, 2, 3].map((index) => (
							<Skeleton key={index} variant="rectangular" height={80} sx={{ borderRadius: 1.5 }} />
						))}
					</Stack>
				) : availableTasks.length === 0 ? (
					<Box
						sx={{
							p: 2.5,
							mt: 1,
							borderRadius: 1.5,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
							border: `1px dashed ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.2)}`,
						}}
					>
						<Stack direction="row" spacing={1.25} alignItems="flex-start">
							<TaskSquare size={20} variant="Bulk" color={BRAND_BLUE} />
							<Stack spacing={0.5}>
								<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
									Sin tareas disponibles
								</Typography>
								<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em", lineHeight: 1.5 }}>
									Todas tus tareas pendientes ya están asignadas a expedientes.
								</Typography>
							</Stack>
						</Stack>
					</Box>
				) : (
					<SimpleBar sx={{ maxHeight: 400 }}>
						<FormControl component="fieldset" sx={{ width: "100%", mt: 1 }}>
							<FormLabel
								component="legend"
								sx={{
									mb: 1.5,
									fontSize: "0.6rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
									"&.Mui-focused": { color: "text.secondary" },
								}}
							>
								Tareas disponibles · {availableTasks.length}
							</FormLabel>
							<RadioGroup value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)}>
								<Stack spacing={1}>
									{availableTasks.map((task) => {
										const taskDate = dayjs(task.dueDate || task.date);
										const isOverdue = taskDate.isBefore(dayjs(), "day");
										const isToday = taskDate.isSame(dayjs(), "day");
										const dateColor = isOverdue ? theme.palette.error.main : isToday ? STALE_AMBER : theme.palette.text.secondary;
										const isSelected = selectedTaskId === task._id;

										return (
											<FormControlLabel
												key={task._id}
												value={task._id}
												control={<Radio sx={{ color: alpha(BRAND_BLUE, 0.5), "&.Mui-checked": { color: BRAND_BLUE } }} />}
												label={
													<Box
														sx={{
															p: 1.5,
															border: `1px solid ${
																isSelected ? alpha(BRAND_BLUE, isDark ? 0.36 : 0.26) : alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)
															}`,
															borderRadius: 1.5,
															bgcolor: isSelected ? alpha(BRAND_BLUE, isDark ? 0.08 : 0.04) : theme.palette.background.paper,
															transition: "all 180ms ease",
															"&:hover": {
																borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
																bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
															},
															ml: 0.5,
															width: "100%",
														}}
													>
														<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
															{task.name}
														</Typography>
														{task.description && (
															<Typography
																sx={{
																	fontSize: "0.72rem",
																	color: "text.secondary",
																	letterSpacing: "-0.005em",
																	display: "block",
																	mt: 0.375,
																}}
															>
																{task.description}
															</Typography>
														)}
														<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
															<Stack direction="row" spacing={0.5} alignItems="center">
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
																</Typography>
															</Stack>
															{task.folderId && task.folderName && (
																<>
																	<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "text.disabled" }} />
																	<Stack direction="row" spacing={0.5} alignItems="center">
																		<Folder size={12} variant="Bulk" color={theme.palette.text.secondary} />
																		<Typography
																			sx={{
																				fontSize: "0.72rem",
																				color: "text.secondary",
																				letterSpacing: "-0.005em",
																			}}
																		>
																			{task.folderName}
																		</Typography>
																	</Stack>
																</>
															)}
														</Stack>
													</Box>
												}
												sx={{ margin: 0, width: "100%" }}
											/>
										);
									})}
								</Stack>
							</RadioGroup>
						</FormControl>
					</SimpleBar>
				)}
			</DialogContent>

			<DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
				<Button
					onClick={handleClose}
					disabled={isLinking}
					sx={{
						textTransform: "none",
						fontWeight: 600,
						letterSpacing: "-0.005em",
						color: "text.secondary",
						borderRadius: 1.25,
						px: 2,
						py: 0.875,
						border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
						"&:hover": {
							color: BRAND_BLUE,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
							borderColor: alpha(BRAND_BLUE, 0.28),
						},
					}}
				>
					Cancelar
				</Button>
				<Button
					onClick={handleLinkTask}
					variant="contained"
					disabled={!selectedTaskId || isLinking}
					startIcon={<TaskSquare size={16} variant="Bulk" />}
					sx={{
						textTransform: "none",
						fontWeight: 600,
						letterSpacing: "-0.005em",
						bgcolor: BRAND_BLUE,
						color: "#fff",
						borderRadius: 1.25,
						px: 2,
						py: 0.875,
						boxShadow: "none",
						"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
					}}
				>
					{isLinking ? "Vinculando…" : "Vincular tarea"}
				</Button>
			</DialogActions>
		</ResponsiveDialog>
	);
};

export default LinkTaskModal;
