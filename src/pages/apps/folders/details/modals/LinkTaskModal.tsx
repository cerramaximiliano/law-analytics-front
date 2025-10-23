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
				elevation: 5,
				sx: {
					borderRadius: 2,
					overflow: "hidden",
				},
			}}
		>
			<DialogTitle
				id="link-task-modal-title"
				sx={{
					bgcolor: theme.palette.primary.lighter,
					p: 3,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Stack spacing={1}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<TaskSquare size={24} color={theme.palette.primary.main} variant="Bold" />
						<Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
							Vincular Tarea Existente
						</Typography>
					</Stack>
					<Typography variant="body2" color="textSecondary">
						Selecciona una tarea para vincular a "{folderName}"
					</Typography>
				</Stack>
			</DialogTitle>
			<Divider />

			<DialogContent sx={{ p: 3 }}>
				{isLoadingTasks ? (
					<Stack spacing={2} sx={{ py: 2 }}>
						{[1, 2, 3].map((index) => (
							<Skeleton key={index} variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
						))}
					</Stack>
				) : availableTasks.length === 0 ? (
					<Alert severity="info" sx={{ mt: 2 }}>
						No hay tareas disponibles para vincular. Todas tus tareas pendientes ya están asignadas a expedientes.
					</Alert>
				) : (
					<SimpleBar sx={{ maxHeight: 400 }}>
						<FormControl component="fieldset" sx={{ width: "100%", mt: 2 }}>
							<FormLabel component="legend" sx={{ mb: 2 }}>
								Tareas disponibles ({availableTasks.length})
							</FormLabel>
							<RadioGroup value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)}>
								<Stack spacing={1}>
									{availableTasks.map((task) => {
										const taskDate = dayjs(task.dueDate || task.date);
										const isOverdue = taskDate.isBefore(dayjs(), "day");
										const isToday = taskDate.isSame(dayjs(), "day");

										return (
											<FormControlLabel
												key={task._id}
												value={task._id}
												control={<Radio />}
												label={
													<Box
														sx={{
															p: 2,
															border: `1px solid ${selectedTaskId === task._id ? theme.palette.primary.main : theme.palette.divider}`,
															borderRadius: 2,
															bgcolor: selectedTaskId === task._id ? alpha(theme.palette.primary.main, 0.05) : "background.paper",
															transition: "all 0.2s ease",
															"&:hover": {
																borderColor: theme.palette.primary.main,
																bgcolor: alpha(theme.palette.primary.main, 0.02),
															},
															ml: 1,
															width: "100%",
														}}
													>
														<Typography variant="body1" fontWeight={500}>
															{task.name}
														</Typography>
														{task.description && (
															<Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
																{task.description}
															</Typography>
														)}
														<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
															<Calendar size={14} color={theme.palette.text.secondary} />
															<Typography
																variant="caption"
																color={isOverdue ? "error.main" : isToday ? "warning.main" : "text.secondary"}
																fontWeight={isOverdue || isToday ? 600 : 400}
															>
																{taskDate.format("DD/MM/YYYY")}
																{isOverdue && " • Vencida"}
																{isToday && " • Hoy"}
															</Typography>
															{task.folderId && task.folderName && (
																<>
																	<Box sx={{ mx: 0.5 }}>•</Box>
																	<Folder size={14} color={theme.palette.text.secondary} />
																	<Typography variant="caption" color="text.secondary">
																		{task.folderName}
																	</Typography>
																</>
															)}
														</Stack>
													</Box>
												}
												sx={{
													margin: 0,
													width: "100%",
												}}
											/>
										);
									})}
								</Stack>
							</RadioGroup>
						</FormControl>
					</SimpleBar>
				)}
			</DialogContent>

			<Divider />
			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={handleClose} color="error" disabled={isLinking}>
					Cancelar
				</Button>
				<Button onClick={handleLinkTask} variant="contained" disabled={!selectedTaskId || isLinking} startIcon={<TaskSquare size={18} />}>
					{isLinking ? "Vinculando..." : "Vincular Tarea"}
				</Button>
			</DialogActions>
		</ResponsiveDialog>
	);
};

export default LinkTaskModal;
