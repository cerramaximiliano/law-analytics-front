import { Skeleton, Button, Chip, Grid, LinearProgress, Stack, Typography, IconButton, FormControlLabel, Checkbox } from "@mui/material";
import { useState } from "react";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { Add, Task, TaskSquare } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";
import moment from "moment";
import { useParams } from "react-router";
import ModalTasks from "../modals/MoldalTasks";
import { useAutoAnimate } from "@formkit/auto-animate/react";

type TaskDataType = {
	name: string;
	_id: string;
	progress?: number;
	done?: number;
	checked: boolean;
	date: string;
};

type TaskCompletionType = {
	[key: string]: boolean;
};

const TaskList = (props: { title: string; tasks: TaskDataType[] }) => {
	const { title, tasks: initialTasks } = props;
	const { id } = useParams();
	const [tasks, setTasks] = useState(initialTasks);
	const [open, setOpen] = useState(false);
	const [showAllTasks, setShowAllTasks] = useState(false);
	const [parent] = useAutoAnimate({ duration: 200 });
	const [isLoading, setIsLoading] = useState(true);
	console.log(isLoading, setIsLoading);
	const [taskCompletion, setTaskCompletion] = useState<TaskCompletionType>(() => {
		const initialState: TaskCompletionType = {};
		initialTasks.forEach((task) => {
			initialState[task._id] = task.checked;
		});
		return initialState;
	});

	const handleOpen = () => {
		if (isLoading === true) {
			return;
		} else {
			setOpen(true);
		}
	};

	const handleAddTask = (newTask: TaskDataType) => {
		setTasks((prevTasks) => [...prevTasks, newTask]);
		setTaskCompletion((prevCompletion) => ({
			...prevCompletion,
			[newTask._id]: newTask.checked,
		}));
	};

	const countCompletedTasks = () => {
		let completedTasks = 0;
		tasks.forEach((task) => {
			if (taskCompletion[task._id]) {
				completedTasks++;
			}
		});
		return completedTasks;
	};

	const completedPercentage = (countCompletedTasks() / tasks.length) * 100;

	const handleCheckboxChange = (event: any) => {
		const { id, checked } = event.target;
		setTaskCompletion((prev) => ({
			...prev,
			[id]: checked,
		}));
	};

	const sortedTasks = [...tasks].sort((a, b) => {
		const dateA = moment(a.date, "DD/MM/YYYY");
		const dateB = moment(b.date, "DD/MM/YYYY");
		return dateB.diff(dateA);
	});

	const handleToggleTasks = () => {
		setShowAllTasks((prev) => !prev);
	};

	const currentMonthTasksCount = tasks.filter((task) => {
		const taskDate = moment(task.date, "DD/MM/YYYY");
		return taskDate.isSame(moment(), "month");
	}).length;

	return (
		<MainCard
			title={title}
			secondary={
				<IconButton color="secondary" sx={{ color: "secondary.darker" }} onClick={handleOpen}>
					<Add />
				</IconButton>
			}
		>
			<ModalTasks open={open} setOpen={setOpen} handlerAddress={handleAddTask} folderId={id} />
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
					{" "}
					{tasks.length > 0 ? (
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
									{sortedTasks.slice(0, showAllTasks ? sortedTasks.length : 4).map((task, index) => (
										<Grid item xs={12} key={task._id}>
											<FormControlLabel
												control={
													<Checkbox
														checked={!!taskCompletion[task._id]}
														onChange={handleCheckboxChange}
														id={task._id}
														name={task.name}
														color="primary"
													/>
												}
												label={task.name}
											/>
										</Grid>
									))}
								</Grid>
							</SimpleBar>
						</>
					) : (
						<>
							<Grid container justifyContent="center">
								<Avatar color="error" variant="rounded">
									<TaskSquare variant="Bold" />
								</Avatar>
							</Grid>
							<Typography variant="body1" color="text.secondary" align="center">
								No hay tareas disponibles
							</Typography>
						</>
					)}
				</>
			)}

			<Grid marginTop={2}>
				<Button variant="outlined" fullWidth color="secondary" onClick={handleToggleTasks} disabled={tasks.length === 0 || isLoading}>
					{showAllTasks ? "Ver Menos" : "Ver Todos"}
				</Button>
			</Grid>
		</MainCard>
	);
};

export default TaskList;
