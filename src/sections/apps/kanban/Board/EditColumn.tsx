import { ChangeEvent } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import { OutlinedInput } from "@mui/material";

// project-imports
import { dispatch, useSelector } from "store";
import { editColumn } from "store/reducers/kanban";

// types
import { ThemeMode } from "types/config";
import { KanbanColumn } from "types/kanban";

interface Props {
	column: KanbanColumn;
}

// ==============================|| KANBAN BOARD - COLUMN EDIT ||============================== //

const EditColumn = ({ column }: Props) => {
	const theme = useTheme();

	const { columns } = useSelector((state) => state.kanban);

	const handleColumnRename = (event: ChangeEvent<HTMLInputElement>) => {
		dispatch(
			editColumn(
				{
					id: column.id,
					title: event.target.value,
					itemIds: column.itemIds,
				},
				columns,
			),
		);
	};

	return (
		<OutlinedInput
			fullWidth
			value={column.title}
			onChange={handleColumnRename}
			sx={{
				mb: 1.5,
				fontWeight: 500,
				"& input:focus": {
					bgcolor: theme.palette.mode === ThemeMode.DARK ? theme.palette.secondary[100] : theme.palette.secondary.lighter,
				},
				"& input:hover": {
					bgcolor: theme.palette.mode === ThemeMode.DARK ? theme.palette.secondary[100] : theme.palette.secondary.lighter,
				},
				"& input:hover + fieldset": {
					display: "block",
				},
				"&, & input": { bgcolor: "transparent" },
				"& fieldset": { display: "none" },
				"& input:focus + fieldset": { display: "block" },
			}}
		/>
	);
};

export default EditColumn;
