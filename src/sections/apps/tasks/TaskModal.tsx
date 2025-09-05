import React from "react";
// material-ui
import { 
	Box, 
	Dialog, 
	DialogContent, 
	DialogTitle, 
	Divider,
	Stack,
	Typography,
	useTheme
} from "@mui/material";

// icons
import { TaskSquare } from "iconsax-react";

// project import
import { PopupTransition } from "components/@extended/Transitions";
import AddEditTask from "./AddEditTask";

// types
import { TaskType } from "types/task";

interface Props {
	open: boolean;
	handleClose: () => void;
	task?: TaskType;
	showSnackbar: (message: string, severity: "success" | "error") => void;
}

// ==============================|| TASK MODAL ||============================== //

const TaskModal = ({ open, handleClose, task, showSnackbar }: Props) => {
	const theme = useTheme();

	return (
		<Dialog
			maxWidth="sm"
			fullWidth
			TransitionComponent={PopupTransition}
			keepMounted
			open={open}
			onClose={handleClose}
			aria-labelledby="task-modal-title"
			PaperProps={{
				elevation: 5,
				sx: {
					borderRadius: 2,
					overflow: "hidden",
				},
			}}
		>
			<DialogTitle
				id="task-modal-title"
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
							{task ? "Editar Tarea" : "Nueva Tarea"}
						</Typography>
					</Stack>
					<Typography variant="body2" color="textSecondary">
						{task 
							? "Modifica los detalles de la tarea existente" 
							: "Completa la información para crear una nueva tarea"}
					</Typography>
				</Stack>
			</DialogTitle>
			<Divider />
			<DialogContent sx={{ p: 3 }}>
				<AddEditTask task={task} onCancel={handleClose} showSnackbar={showSnackbar} />
			</DialogContent>
		</Dialog>
	);
};

export default TaskModal;