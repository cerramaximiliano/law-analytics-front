import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import { ToggleButtonGroup, ToggleButton, Tooltip, Grid } from "@mui/material";
import { Category, TableDocument } from "iconsax-react";
import MainCard from "components/MainCard";

// Components
import CalcTable from "./components/CalcTable";
import Movements from "./components/Movements";
import FolderData from "./components/FolderData";
import FolderPreJudData from "./components/FolderPreJudData";
import FolderJudData from "./components/FolderJudData";
import Notifications from "./components/Notifications";
import Members from "./components/Members";
import TaskList from "./components/TaskList";
import Calendar from "./components/Calendar";

// Actions
import { dispatch } from "store";
import { getFolderById } from "store/reducers/folder";
import { filterContactsByFolder, getContactsByUserId } from "store/reducers/contacts";

// Constants
const VIEW_OPTIONS = [
	{
		label: "Expandir",
		value: "one",
		icon: Category,
	},
	{
		label: "Colapsar",
		value: "two",
		icon: TableDocument,
	},
] as const;

const Details = () => {
	const { id } = useParams<{ id: string }>();
	const [alignment, setAlignment] = useState<string>("two");
	const [isColumn, setIsColumn] = useState(false);

	// Selectors
	const { folder, isLoader } = useSelector((state: any) => state.folder);
	const { contacts, selectedContacts, isLoader: contactsLoading } = useSelector((state: any) => state.contacts);
	const { user } = useSelector((state: any) => state.auth);

	// Data fetching
	useEffect(() => {
		const fetchInitialData = async () => {
			if (!id || id === "undefined") return;

			try {
				// Parallel data fetching
				await Promise.all([dispatch(getFolderById(id)), user?._id && dispatch(getContactsByUserId(user._id))]);
			} catch (error) {
				console.error("Error fetching initial data:", error);
			}
		};

		fetchInitialData();
	}, [id, user?._id]);

	// Filter contacts when both folder and contacts are available
	useEffect(() => {
		if (id && id !== "undefined" && contacts?.length > 0) {
			dispatch(filterContactsByFolder(id));
		}
	}, [id, contacts]);

	// Memoized grid styles for better performance
	const gridStyles = useMemo(
		() => ({
			transition: "all 0.5s ease-in-out",
		}),
		[],
	);

	// View toggle handler
	const handleAlignment = (_: any, newAlignment: string) => {
		if (newAlignment === null) return;
		setAlignment(newAlignment);
		setIsColumn(newAlignment === "one");
	};

	// Memoized grid size calculations
	const getGridSize = useMemo(
		() => (size: number) => ({
			xs: 12,
			md: isColumn ? 12 : 6,
			lg: isColumn ? 12 : size,
		}),
		[isColumn],
	);

	return (
		<MainCard
			title="Detalles de la Causa"
			secondary={
				<ToggleButtonGroup value={alignment} exclusive onChange={handleAlignment} size="small" aria-label="view layout">
					{VIEW_OPTIONS.map(({ value, label, icon: Icon }) => (
						<ToggleButton value={value} key={value} aria-label={label}>
							<Tooltip title={label}>
								<Icon variant="Bold" />
							</Tooltip>
						</ToggleButton>
					))}
				</ToggleButtonGroup>
			}
		>
			<Grid container spacing={3}>
				{/* Row 1 */}
				<Grid item {...getGridSize(6)} sx={gridStyles}>
					<FolderData isLoader={isLoader} folder={folder} type="general" />
				</Grid>
				<Grid item {...getGridSize(3)} sx={gridStyles}>
					<Movements title="Movimientos" />
				</Grid>
				<Grid item {...getGridSize(3)} sx={gridStyles}>
					<Notifications title="Notificaciones" />
				</Grid>

				{/* Row 2 */}
				<Grid item {...getGridSize(4)} sx={gridStyles}>
					<FolderPreJudData isLoader={isLoader} folder={folder} type="mediacion" />
				</Grid>
				<Grid item {...getGridSize(4)} sx={gridStyles}>
					<FolderJudData isLoader={isLoader} folder={folder} type="judicial" />
				</Grid>
				<Grid item {...getGridSize(4)} sx={gridStyles}>
					<CalcTable
						title="Montos, Cálculos y Ofrecimientos"
						folderData={folder}
						tableData={[]} // Pass actual table data here
					/>
				</Grid>

				{/* Row 3 */}
				<Grid item {...getGridSize(3)} sx={gridStyles}>
					{id && <Members title="Intervinientes" membersData={selectedContacts} isLoader={contactsLoading} folderId={id} />}
				</Grid>
				<Grid item {...getGridSize(3)} sx={gridStyles}>
					<TaskList title="Tareas" tasks={[]} /> {/* Pass actual tasks data here */}
				</Grid>
				<Grid item {...getGridSize(6)} sx={gridStyles}>
					<Calendar title="Calendario" />
				</Grid>
			</Grid>
		</MainCard>
	);
};

export default Details;
