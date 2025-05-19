import { TableRow, TableCell } from "@mui/material";
import TaskDetailRow from "sections/apps/tasks/TaskDetailRow";

interface ExpandedRowProps {
	taskId: string;
	colSpan: number;
	folders: any[];
}

const ExpandedRow = ({ taskId, colSpan, folders }: ExpandedRowProps) => {
	return (
		<TableRow>
			<TableCell colSpan={colSpan} sx={{ p: 0 }}>
				<TaskDetailRow taskId={taskId} colSpan={colSpan} folders={folders} onError={(message) => console.error(message)} />
			</TableCell>
		</TableRow>
	);
};

export default ExpandedRow;
