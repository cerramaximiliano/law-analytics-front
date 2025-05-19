import { useState, useEffect } from "react";
import { CircularProgress, Box } from "@mui/material";
import TaskView from "./TaskView";
import { dispatch } from "store";
import { getTaskDetail } from "store/reducers/tasks";

interface TaskDetailRowProps {
	taskId: string;
	taskData?: any;
	colSpan: number;
	folders?: any[];
	onError: (message: string) => void;
	onLoadComplete?: () => void;
}

const TaskDetailRow = ({ taskId, taskData: propTaskData, colSpan, folders, onError, onLoadComplete }: TaskDetailRowProps) => {
	const [loading, setLoading] = useState(!propTaskData);
	const [taskData, setTaskData] = useState<any>(propTaskData || null);

	useEffect(() => {
		// If we already have the task data, use it
		if (propTaskData) {
			const enrichedData = {
				...propTaskData,
				folderName: folders?.find((f: any) => f._id === propTaskData.folderId)?.folderName,
			};
			setTaskData(enrichedData);
			setLoading(false);
			// Remove onLoadComplete to avoid potential re-render loops
			// onLoadComplete?.();
			return;
		}

		// Fallback to fetching if no data is provided (for backward compatibility)
		const fetchTaskDetails = async () => {
			try {
				setLoading(true);
				const result = await dispatch(getTaskDetail(taskId));

				if (result.success && result.data) {
					const enrichedData = {
						...result.data,
						folderName: folders?.find((f: any) => f._id === result.data.folderId)?.folderName,
					};
					setTaskData(enrichedData);
				} else {
					onError(result.error || "Error al cargar los detalles de la tarea");
				}
			} catch (error) {
				onError("Error al cargar los detalles de la tarea");
			} finally {
				setLoading(false);
				// Remove onLoadComplete to avoid potential re-render loops
				// onLoadComplete?.();
			}
		};

		fetchTaskDetails();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [taskId]); // Reduce dependencies to avoid re-render loops

	if (loading) {
		return (
			<Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
				<CircularProgress size={32} />
			</Box>
		);
	}

	if (!taskData) {
		return null;
	}

	return <TaskView data={taskData} />;
};

export default TaskDetailRow;
