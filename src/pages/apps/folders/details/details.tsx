import { useState, useEffect, useMemo, useCallback } from "react";
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

// Types
/* import { CalcAmounts } from "./components/CalcTable"; */

/* const taskData = [
	{
		name: "Tarea 1",
		checked: false,
		progress: 58,
		done: 4,
		color: "info",
		_id: "65184",
		date: "20/05/2024",
	},
	{
		name: "Tarea 2",
		checked: true,
		progress: 72,
		done: 6,
		color: "primary",
		_id: "86930",
		date: "19/05/2024",
	},
	{
		name: "Tarea 3",
		checked: false,
		progress: 35,
		done: 3,
		color: "warning",
		_id: "74411",
		date: "18/05/2024",
	},
	{
		name: "Tarea 4",
		checked: true,
		progress: 47,
		done: 4,
		color: "error",
		_id: "43042",
		date: "17/05/2024",
	},
	{
		name: "Tarea 5",
		checked: false,
		progress: 19,
		done: 1,
		color: "warning",
		_id: "55515",
		date: "16/04/2024",
	},
	{
		name: "Tarea 6",
		checked: true,
		progress: 84,
		done: 9,
		color: "info",
		_id: "22886",
		date: "15/04/2024",
	},
	{
		name: "Tarea 7",
		checked: false,
		progress: 63,
		done: 5,
		color: "info",
		_id: "11248",
		date: "14/03/2024",
	},
	{
		name: "Tarea 8",
		checked: false,
		progress: 51,
		done: 4,
		color: "success",
		_id: "94190",
		date: "13/05/2024",
	},
	{
		name: "Tarea 9",
		checked: true,
		progress: 29,
		done: 2,
		color: "warning",
		_id: "72521",
		date: "12/05/2024",
	},
	{
		name: "Tarea 10",
		checked: false,
		progress: 42,
		done: 4,
		color: "info",
		_id: "59982",
		date: "11/05/2024",
	},
	{
		name: "Tarea 11",
		checked: true,
		progress: 77,
		done: 7,
		color: "error",
		_id: "38343",
		date: "10/05/2024",
	},
	{
		name: "Tarea 12",
		checked: true,
		progress: 90,
		done: 8,
		color: "warning",
		_id: "26604",
		date: "09/05/2024",
	},
	{
		name: "Tarea 13",
		checked: false,
		progress: 56,
		done: 4,
		color: "primary",
		_id: "13965",
		date: "08/05/2024",
	},
	{
		name: "Tarea 14",
		checked: true,
		progress: 65,
		done: 6,
		color: "success",
		_id: "91326",
		date: "07/05/2024",
	},
	{
		name: "Tarea 15",
		checked: false,
		progress: 38,
		done: 3,
		color: "warning",
		_id: "78787",
		date: "06/05/2024",
	},
	{
		name: "Tarea 16",
		checked: true,
		progress: 45,
		done: 4,
		color: "info",
		_id: "56148",
		date: "05/05/2024",
	},
	{
		name: "Tarea 17",
		checked: false,
		progress: 22,
		done: 2,
		color: "error",
		_id: "33609",
		date: "04/05/2024",
	},
	{
		name: "Tarea 18",
		checked: true,
		progress: 80,
		done: 8,
		color: "primary",
		_id: "20970",
		date: "03/05/2024",
	},
	{
		name: "Tarea 19",
		checked: true,
		progress: 70,
		done: 6,
		color: "success",
		_id: "98331",
		date: "02/05/2024",
	},
	{
		name: "Tarea 20",
		checked: false,
		progress: 34,
		done: 3,
		color: "warning",
		_id: "85792",
		date: "01/05/2024",
	},
	{
		name: "Tarea 21",
		checked: true,
		progress: 68,
		done: 7,
		color: "info",
		_id: "73253",
		date: "30/04/2024",
	},
	{
		name: "Tarea 22",
		checked: false,
		progress: 50,
		done: 4,
		color: "error",
		_id: "60714",
		date: "29/04/2024",
	},
	{
		name: "Tarea 23",
		checked: true,
		progress: 75,
		done: 7,
		color: "primary",
		_id: "38175",
		date: "28/04/2024",
	},
	{
		name: "Tarea 24",
		checked: false,
		progress: 31,
		done: 3,
		color: "info",
		_id: "25636",
		date: "27/04/2024",
	},
	{
		name: "Tarea 25",
		checked: true,
		progress: 83,
		done: 9,
		color: "success",
		_id: "13097",
		date: "26/04/2024",
	},
]; */

interface StateType {
	folder: {
		folder: any;
		isLoader: boolean;
	};
	contacts: {
		contacts: any[];
		selectedContacts: any[];
		isLoader: boolean;
	};
	auth: {
		user: {
			_id: string;
		};
	};
}

// Constants - Moved outside component
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

const GRID_STYLES = {
	transition: "all 0.5s ease-in-out",
};

const Details = () => {
	const { id } = useParams<{ id: string }>();
	const [alignment, setAlignment] = useState<string>("two");
	const [isColumn, setIsColumn] = useState(false);
	const [isInitialLoad, setIsInitialLoad] = useState(true);

	const { folder, isLoader } = useSelector((state: StateType) => state.folder);

	const selectedContacts = useSelector((state: StateType) => state.contacts.selectedContacts);
	const contactsLoading = useSelector((state: StateType) => state.contacts.isLoader);
	const contacts = useSelector((state: StateType) => state.contacts.contacts);
	const userId = useSelector((state: StateType) => state.auth.user?._id);

	// Memoized data fetching function
	const fetchData = useCallback(async () => {
		if (!id || id === "undefined") return;

		try {
			const promises = [dispatch(getFolderById(id))];
			if (userId) {
				promises.push(dispatch(getContactsByUserId(userId)));
			}
			await Promise.all(promises);
		} catch (error) {
			console.error("Error fetching data:", error);
		}
	}, [id, userId]);

	// Initial data fetch
	useEffect(() => {
		if (isInitialLoad) {
			fetchData();
			setIsInitialLoad(false);
		}
	}, [fetchData, isInitialLoad]);

	// Contacts filtering with debounce
	useEffect(() => {
		if (!id || id === "undefined" || !contacts?.length) return;

		const timeoutId = setTimeout(() => {
			dispatch(filterContactsByFolder(id));
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [id, contacts]);

	// Memoized grid size calculation
	const getGridSize = useMemo(
		() => (size: number) => ({
			xs: 12,
			md: isColumn ? 12 : 6,
			lg: isColumn ? 12 : size,
		}),
		[isColumn],
	);

	// Memoized handlers
	const handleAlignment = useCallback((_: any, newAlignment: string | null) => {
		if (!newAlignment) return;
		setAlignment(newAlignment);
		setIsColumn(newAlignment === "one");
	}, []);

	// Memoized view options renderer
	const renderViewOptions = useMemo(
		() => (
			<ToggleButtonGroup value={alignment} exclusive onChange={handleAlignment} size="small" aria-label="view layout">
				{VIEW_OPTIONS.map(({ value, label, icon: Icon }) => (
					<ToggleButton value={value} key={value} aria-label={label}>
						<Tooltip title={label}>
							<Icon variant="Bold" />
						</Tooltip>
					</ToggleButton>
				))}
			</ToggleButtonGroup>
		),
		[alignment, handleAlignment],
	);

	// Memoized components
	const MemoizedFolderData = useMemo(() => <FolderData isLoader={isLoader} folder={folder} type="general" />, [isLoader, folder]);

	const MemoizedMovements = useMemo(() => <Movements title="Movimientos" folderName={folder?.folderName} />, [folder]);

	const MemoizedNotifications = useMemo(() => <Notifications title="Notificaciones" folderName={folder?.folderName} />, [folder]);

	const MemoizedPreJudData = useMemo(() => <FolderPreJudData isLoader={isLoader} folder={folder} type="mediacion" />, [isLoader, folder]);

	const MemoizedJudData = useMemo(() => <FolderJudData isLoader={isLoader} folder={folder} type="judicial" />, [isLoader, folder]);

	const MemoizedCalcTable = useMemo(() => <CalcTable title="Montos, Cálculos y Ofrecimientos" folderData={folder} />, [folder]);

	const MemoizedMembers = useMemo(
		() => (id ? <Members title="Intervinientes" membersData={selectedContacts} isLoader={contactsLoading} folderId={id} /> : null),
		[id, selectedContacts, contactsLoading],
	);

	const MemoizedTaskList = useMemo(() => <TaskList title="Tareas" folderName={folder?.folderName} />, [folder]);

	const MemoizedCalendar = useMemo(() => <Calendar title="Calendario" folderName={folder?.folderName} />, [folder]);

	return (
		<MainCard title="Detalles de la Causa" secondary={renderViewOptions}>
			<Grid container spacing={3}>
				{/* Row 1 */}
				<Grid item {...getGridSize(6)} sx={GRID_STYLES}>
					{MemoizedFolderData}
				</Grid>
				<Grid item {...getGridSize(3)} sx={GRID_STYLES}>
					{MemoizedMovements}
				</Grid>
				<Grid item {...getGridSize(3)} sx={GRID_STYLES}>
					{MemoizedNotifications}
				</Grid>

				{/* Row 2 */}
				<Grid item {...getGridSize(4)} sx={GRID_STYLES}>
					{MemoizedPreJudData}
				</Grid>
				<Grid item {...getGridSize(4)} sx={GRID_STYLES}>
					{MemoizedJudData}
				</Grid>
				<Grid item {...getGridSize(4)} sx={GRID_STYLES}>
					{MemoizedCalcTable}
				</Grid>

				{/* Row 3 */}
				<Grid item {...getGridSize(3)} sx={GRID_STYLES}>
					{MemoizedMembers}
				</Grid>
				<Grid item {...getGridSize(3)} sx={GRID_STYLES}>
					{MemoizedTaskList}
				</Grid>
				<Grid item {...getGridSize(6)} sx={GRID_STYLES}>
					{MemoizedCalendar}
				</Grid>
			</Grid>
		</MainCard>
	);
};

export default Details;
