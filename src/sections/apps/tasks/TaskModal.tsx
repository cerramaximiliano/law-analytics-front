// material-ui
import { Box, Dialog, DialogContent, DialogTitle, Divider } from "@mui/material";

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
	return (
		<Dialog
			maxWidth="sm"
			fullWidth
			TransitionComponent={PopupTransition}
			open={open}
			onClose={handleClose}
			sx={{ "& .MuiDialog-paper": { p: 0 } }}
		>
			<DialogTitle id="task-modal-title" sx={{ px: 3, py: 2 }}>
				<Box display="flex" alignItems="center" justifyContent="space-between">
					{task ? "Editar Tarea" : "Nueva Tarea"}
				</Box>
			</DialogTitle>
			<Divider />
			<DialogContent sx={{ p: 3 }}>
				<AddEditTask task={task} onCancel={handleClose} showSnackbar={showSnackbar} />
			</DialogContent>
		</Dialog>
	);
};

export default TaskModal;
