import { Skeleton, Button, Chip, Grid, LinearProgress, Stack, Typography, IconButton, FormControlLabel, Checkbox, Tooltip } from "@mui/material";
import { useState, useEffect } from "react";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { Add, Task, TaskSquare, Trash } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";
import moment from "moment";
import { useParams } from "react-router";
import ModalTasks from "../modals/MoldalTasks";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { getTasksByFolderId, deleteTask, toggleTaskStatus } from "store/reducers/tasks";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";

//types
import { TaskDataType } from "types/task";
import { TaskCompletionType } from "types/task";
import { TaskListProps } from "types/task";

const TaskList = ({ title, folderName }: TaskListProps) => {
	const { id } = useParams();

	// Añadimos un valor por defecto de array vacío
	const tasks = useSelector((state: any) => state.tasksReducer?.tasks || []);
	const isLoading = useSelector((state: any) => state.tasks?.isLoader || false);

	const [open, setOpen] = useState(false);
	const [showAllTasks, setShowAllTasks] = useState(false);
	const [parent] = useAutoAnimate({ duration: 200 });

	useEffect(() => {
		if (id) {
			dispatch(getTasksByFolderId(id));
		}
	}, [id]); // Removido dispatch del array de dependencias ya que es una función estable

	useEffect(() => {
		if (tasks && tasks.length > 0) {
			const initialState: TaskCompletionType = {};
			tasks.forEach((task: TaskDataType) => {
				initialState[task._id] = task.checked;
			});
		}
	}, [tasks]);

	const handleOpen = () => {
		if (!isLoading) {
			setOpen(true);
		}
	};

	const countCompletedTasks = () => {
		if (!tasks) return 0;
		return tasks.reduce((count: number, task: TaskDataType) => {
			return count + (task.checked ? 1 : 0); // Usar task.checked en lugar de taskCompletion
		}, 0);
	};

	const completedPercentage = tasks && tasks.length > 0 ? (countCompletedTasks() / tasks.length) * 100 : 0;

	const sortedTasks = tasks
		? [...tasks].sort((a: TaskDataType, b: TaskDataType) => {
			const dateA = moment(a.date, "DD/MM/YYYY");
			const dateB = moment(b.date, "DD/MM/YYYY");
			return dateB.diff(dateA);
		})
		: [];

	const handleToggleTasks = () => {
		setShowAllTasks((prev) => !prev);
	};

	const handleDeleteTask = async (taskId: string) => {
		try {
			const result = await dispatch(deleteTask(taskId));
			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Tarea eliminada exitosamente",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: true,
					}),
				);
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: result.error || "Error al eliminar la tarea",
						variant: "alert",
						alert: {
							color: "error",
						},
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
					alert: {
						color: "error",
					},
					close: true,
				}),
			);
		}
	};

	const handleCheckboxChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const { id } = event.target;
		try {
			const result = await dispatch(toggleTaskStatus(id));
			if (!result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: result.error || "Error al actualizar el estado de la tarea",
						variant: "alert",
						alert: {
							color: "error",
						},
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
					alert: {
						color: "error",
					},
					close: true,
				}),
			);
		}
	};
	const currentMonthTasksCount = tasks
		? tasks.filter((task: TaskDataType) => {
			const taskDate = moment(task.date, "DD/MM/YYYY");
			return taskDate.isSame(moment(), "month");
		}).length
		: 0;

	return (
		<MainCard
			shadow={3}
			title={title}
			secondary={
				<Tooltip title="Agregar Tarea">
					<IconButton color="secondary" sx={{ color: "secondary.darker" }} onClick={handleOpen} disabled={isLoading}>
						<Add />
					</IconButton>
				</Tooltip>
			}
		>
			<ModalTasks open={open} setOpen={setOpen} folderId={id || ""} folderName={folderName} />
			{isLoading ? (
				<>
					<Skeleton />
					<Skeleton />
					<Skeleton />
					<Skeleton />
					<Skeleton />
					<Skeleton />
					<Skeleton />
				</>
			) : (
				<>
					{tasks && tasks.length > 0 ? (
						<>
							<Grid container spacing={1.5} sx={{ padding: 0 }}>
								<Grid item xs={12}>
									<Stack direction="row" alignItems="center" spacing={1} sx={{ padding: 0 }}>
										<Avatar color="success" variant="rounded">
											<Task />
										</Avatar>
										<Typography variant="h5">Nuevas tareas</Typography>
										<Chip label={currentMonthTasksCount} size="small" />
									</Stack>
								</Grid>
								<Grid item xs={12}>
									<Stack spacing={1} sx={{ padding: 0 }}>
										<Stack direction="row" alignItems="center" justifyContent="space-between">
											<Typography>Tareas realizadas</Typography>
											<Typography>{Math.round(completedPercentage)}%</Typography>
										</Stack>
										<LinearProgress variant="determinate" value={completedPercentage} />
									</Stack>
								</Grid>
							</Grid>
							<SimpleBar
								sx={{
									overflowX: "hidden",
									maxHeight: "300px",
									overflowY: "auto",
								}}
							>
								<Grid container spacing={0} sx={{ "& .Mui-checked + span": { textDecoration: "line-through" } }} ref={parent}>
									{sortedTasks.slice(0, showAllTasks ? sortedTasks.length : 4).map((task: TaskDataType) => (
										<Grid item xs={12} key={task._id}>
											<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pr: 2 }}>
												<FormControlLabel
													control={
														<Checkbox
															checked={task.checked}
															onChange={handleCheckboxChange}
															id={task._id}
															name={task.name}
															color="primary"
														/>
													}
													label={task.name}
												/>
												<IconButton color="error" onClick={() => handleDeleteTask(task._id)} size="small">
													<Trash variant="Bulk" size={16} />
												</IconButton>
											</Stack>
										</Grid>
									))}
								</Grid>
							</SimpleBar>
						</>
					) : (
						<>
							<Stack spacing={2} alignItems="center" py={4}>
								<Avatar
									color="error"
									variant="rounded"
									sx={{
										width: 64,
										height: 64,
										bgcolor: "error.lighter",
									}}
								>
									<TaskSquare variant="Bold" />
								</Avatar>

								<Typography variant="subtitle1" color="textSecondary" align="center">
									No hay tareas registrados
								</Typography>
								<Typography variant="body2" color="textSecondary" align="center">
									Comienza agregando una nueva tarea usando el botón +
								</Typography>
							</Stack>
						</>
					)}
				</>
			)}

			{tasks && tasks.length > 4 && (
				<Grid marginTop={2}>
					<Button variant="outlined" fullWidth color="secondary" onClick={handleToggleTasks} disabled={isLoading}>
						{showAllTasks ? "Ver Menos" : "Ver Todos"}
					</Button>
				</Grid>
			)}
		</MainCard>
	);
};

export default TaskList;
