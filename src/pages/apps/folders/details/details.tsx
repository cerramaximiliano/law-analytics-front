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

	// Optimized selectors with specific state slices
	const folder = useSelector((state: StateType) => state.folder.folder);
	const isLoader = useSelector((state: StateType) => state.folder.isLoader);
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

	const MemoizedMovements = useMemo(() => <Movements title="Movimientos" />, []);

	const MemoizedNotifications = useMemo(() => <Notifications title="Notificaciones" />, []);

	const MemoizedPreJudData = useMemo(() => <FolderPreJudData isLoader={isLoader} folder={folder} type="mediacion" />, [isLoader, folder]);

	const MemoizedJudData = useMemo(() => <FolderJudData isLoader={isLoader} folder={folder} type="judicial" />, [isLoader, folder]);

	const MemoizedCalcTable = useMemo(
		() => <CalcTable title="Montos, Cálculos y Ofrecimientos" folderData={folder} tableData={[]} />,
		[folder],
	);

	const MemoizedMembers = useMemo(
		() => (id ? <Members title="Intervinientes" membersData={selectedContacts} isLoader={contactsLoading} folderId={id} /> : null),
		[id, selectedContacts, contactsLoading],
	);

	const MemoizedTaskList = useMemo(() => <TaskList title="Tareas" tasks={[]} />, []);

	const MemoizedCalendar = useMemo(() => <Calendar title="Calendario" />, []);

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
