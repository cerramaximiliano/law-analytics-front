import { useState, useEffect, useMemo, useCallback, useRef, ReactNode, SyntheticEvent } from "react";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import { Tooltip, Grid, Stack, Skeleton, Box, Tab, Tabs, Typography, useTheme, alpha } from "@mui/material";
import { Category, TableDocument, ExportSquare, InfoCircle, Activity, Briefcase, Folder2, Judge, DocumentText } from "iconsax-react";
import MainCard from "components/MainCard";
import { useBreadcrumb } from "contexts/BreadcrumbContext";
import useSubscription from "hooks/useSubscription";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";

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
import LinkToJudicialPower from "sections/apps/folders/LinkToJudicialPower";
import NavigationControls from "./components/NavigationControls";
import CollapsibleSection from "./components/CollapsibleSection";

// Actions
import { dispatch } from "store";
import { getFolderById } from "store/reducers/folder";
import { filterContactsByFolder, getContactsByUserId } from "store/reducers/contacts";

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
		label: "Vista Detallada",
		value: "detailed",
		icon: Category,
		description: "Muestra toda la información expandida",
	},
	{
		label: "Vista Compacta",
		value: "compact",
		icon: TableDocument,
		description: "Muestra la información condensada",
	},
] as const;

const GRID_STYLES = {
	transition: "all 0.5s ease-in-out",
};

// ==============================|| TAB PANEL ||============================== //

interface TabPanelProps {
	children?: ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`folder-tabpanel-${index}`} aria-labelledby={`folder-tab-${index}`} {...other}>
			{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `folder-tab-${index}`,
		"aria-controls": `folder-tabpanel-${index}`,
	};
}

const Details = () => {
	const { id } = useParams<{ id: string }>();
	const theme = useTheme();
	const [viewMode, setViewMode] = useState<string>("compact");
	const [isDetailedView, setIsDetailedView] = useState(false);
	const [openLinkJudicial, setOpenLinkJudicial] = useState(false);
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);
	const [tabValue, setTabValue] = useState(0);
	const { setCustomLabel, clearCustomLabel } = useBreadcrumb();

	// Usar el hook de suscripción para verificar características
	const { canVinculateFolders } = useSubscription();

	// Format folder name with first letter of each word capitalized
	const formatFolderName = useCallback((name: string) => {
		if (!name) return "";
		// Split by spaces, capitalize each word, then join back
		return name
			.toLowerCase()
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	}, []);

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

	// Data fetch when id changes
	useEffect(() => {
		fetchData();
		// Reset tab to first tab when changing folders
		setTabValue(0);
	}, [id, fetchData]);

	// Contacts filtering with debounce
	useEffect(() => {
		if (!id || id === "undefined" || !contacts?.length) return;

		const timeoutId = setTimeout(() => {
			dispatch(filterContactsByFolder(id));
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [id, contacts]);

	// Track the previous folder name to avoid unnecessary updates
	const prevFolderNameRef = useRef<string>();

	// Set placeholder in breadcrumb when ID changes (loading state)
	useEffect(() => {
		if (!id) return;

		// Set a non-breaking space as placeholder to maintain height
		setCustomLabel(`apps/folders/details/${id}`, "\u00A0");

		return () => {
			clearCustomLabel(`apps/folders/details/${id}`);
		};
	}, [id, setCustomLabel, clearCustomLabel]);

	// Update breadcrumb with folder name when loaded
	useEffect(() => {
		if (!folder?.folderName || !id || isLoader) return;

		// Only update if the folder name has actually changed
		if (prevFolderNameRef.current === folder.folderName) return;

		const formattedName = formatFolderName(folder.folderName);
		setCustomLabel(`apps/folders/details/${id}`, formattedName);
		prevFolderNameRef.current = folder.folderName;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [folder?.folderName, id, isLoader]);

	// Memoized handlers
	const handleViewModeChange = useCallback((_: any, newViewMode: string | null) => {
		if (!newViewMode) return;
		setViewMode(newViewMode);
		setIsDetailedView(newViewMode === "detailed");
	}, []);

	const handleOpenLinkJudicial = useCallback(() => {
		// Verificar si el usuario tiene acceso a la característica de vincular carpetas
		const { canAccess, featureInfo } = canVinculateFolders();

		if (canAccess) {
			// Si tiene acceso, mostrar el modal de vinculación
			setOpenLinkJudicial(true);
		} else {
			// Si no tiene acceso, mostrar el modal de error de límite
			setLimitErrorInfo(featureInfo);
			setLimitErrorOpen(true);
		}
	}, [canVinculateFolders]);

	const handleCloseLinkJudicial = useCallback(() => {
		setOpenLinkJudicial(false);
	}, []);

	const handleCloseLimitErrorModal = useCallback(() => {
		setLimitErrorOpen(false);
	}, []);

	const handleTabChange = useCallback((event: SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	}, []);

	// Memoized view options renderer
	const renderViewOptions = useMemo(
		() => (
			<Stack spacing={1.5} alignItems="flex-end">
				{/* View mode buttons - Formal style */}
				{isLoader ? (
					<Skeleton variant="rectangular" width={320} height={36} sx={{ borderRadius: 0.5 }} />
				) : (
					<Stack direction="row" spacing={0}>
						{VIEW_OPTIONS.map(({ value, label, icon: Icon, description }, index) => (
							<Tooltip key={value} title={description} placement="top">
								<Box
									onClick={() => handleViewModeChange(null, value)}
									sx={{
										px: 2.5,
										py: 1,
										height: 36,
										display: "flex",
										alignItems: "center",
										gap: 1,
										cursor: "pointer",
										bgcolor: viewMode === value ? theme.palette.grey[100] : "transparent",
										borderTop: `1px solid ${theme.palette.divider}`,
										borderBottom: `1px solid ${theme.palette.divider}`,
										borderLeft: index === 0 ? `1px solid ${theme.palette.divider}` : "none",
										borderRight: `1px solid ${theme.palette.divider}`,
										borderRadius: index === 0 ? "4px 0 0 4px" : index === VIEW_OPTIONS.length - 1 ? "0 4px 4px 0" : 0,
										transition: "all 0.2s ease",
										"&:hover": {
											bgcolor: theme.palette.grey[50],
										},
									}}
								>
									<Icon
										size={18}
										variant={viewMode === value ? "Bold" : "Linear"}
										color={viewMode === value ? theme.palette.primary.main : theme.palette.text.secondary}
									/>
									<Typography
										variant="body2"
										sx={{
											fontWeight: viewMode === value ? 600 : 400,
											color: viewMode === value ? theme.palette.text.primary : theme.palette.text.secondary,
											fontSize: "0.8125rem",
										}}
									>
										{label}
									</Typography>
								</Box>
							</Tooltip>
						))}
					</Stack>
				)}

				{/* Vincular con Poder Judicial - Formal button */}
				{isLoader ? (
					<Skeleton variant="rectangular" width={180} height={36} sx={{ borderRadius: 0.5 }} />
				) : (
					<Box>
						{folder?.pjn ? (
							<Box
								sx={{
									px: 2,
									py: 0.75,
									height: 36,
									display: "flex",
									alignItems: "center",
									gap: 0.75,
									bgcolor: alpha(theme.palette.success.main, 0.1),
									border: `1px solid ${theme.palette.success.main}`,
									borderRadius: 0.5,
								}}
							>
								<ExportSquare size={16} variant="Bold" color={theme.palette.success.main} />
								<Typography
									variant="body2"
									sx={{
										fontWeight: 500,
										color: theme.palette.success.dark,
										fontSize: "0.8125rem",
									}}
								>
									Vinculado con PJN
								</Typography>
							</Box>
						) : (
							<Box
								onClick={handleOpenLinkJudicial}
								sx={{
									px: 2,
									py: 0.75,
									height: 36,
									display: "flex",
									alignItems: "center",
									gap: 0.75,
									cursor: "pointer",
									bgcolor: "transparent",
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: 0.5,
									transition: "all 0.2s ease",
									"&:hover": {
										borderColor: theme.palette.primary.main,
										bgcolor: alpha(theme.palette.primary.main, 0.04),
									},
								}}
							>
								<ExportSquare size={16} variant="Linear" color={theme.palette.text.secondary} />
								<Typography
									variant="body2"
									sx={{
										fontWeight: 400,
										color: theme.palette.text.secondary,
										fontSize: "0.8125rem",
									}}
								>
									Vincular con Poder Judicial
								</Typography>
							</Box>
						)}
					</Box>
				)}
			</Stack>
		),
		[viewMode, handleViewModeChange, folder?.pjn, handleOpenLinkJudicial, isLoader, theme, VIEW_OPTIONS],
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
		<Box
			key={id}
			sx={{
				position: "relative",
				"@keyframes fadeIn": {
					from: { opacity: 0.7 },
					to: { opacity: 1 },
				},
				animation: "fadeIn 0.3s ease-in-out",
			}}
		>
			{/* Navigation controls positioned at breadcrumb level */}
			{id && (
				<Box
					sx={{
						position: "absolute",
						top: { xs: -56, md: -60 }, // Moved up by 8px
						right: 0,
						zIndex: 1100, // Higher than breadcrumb
						display: "flex",
						alignItems: "center",
						height: 36, // Match breadcrumb height
					}}
				>
					<NavigationControls currentFolderId={id} inline />
				</Box>
			)}

			<MainCard
				title={
					isLoader || !folder?.folderName ? (
						<Box sx={{ position: "relative", display: "inline-block", minHeight: "32px" }}>
							<Box component="span" sx={{ visibility: "hidden" }}>
								Nombre De Carpeta Ejemplo
							</Box>
							<Skeleton
								variant="text"
								width={200}
								height={32}
								sx={{
									position: "absolute",
									top: 0,
									left: 0,
								}}
							/>
						</Box>
					) : (
						<Box sx={{ minHeight: "32px", display: "flex", alignItems: "center" }}>{formatFolderName(folder.folderName)}</Box>
					)
				}
				secondary={renderViewOptions}
			>
				<Box sx={{ width: "100%" }}>
					<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
						<Tabs
							value={tabValue}
							onChange={handleTabChange}
							aria-label="folder detail tabs"
							variant="scrollable"
							scrollButtons="auto"
							sx={{
								"& .MuiTab-root": {
									minHeight: 48,
									textTransform: "none",
									fontSize: "0.875rem",
									fontWeight: 500,
								},
								"& .MuiTab-iconWrapper": {
									marginRight: 1,
								},
							}}
						>
							<Tab label="Información General" icon={<InfoCircle size="20" />} iconPosition="start" {...a11yProps(0)} />
							<Tab label="Actividad" icon={<Activity size="20" />} iconPosition="start" {...a11yProps(1)} />
							<Tab label="Gestión" icon={<Briefcase size="20" />} iconPosition="start" {...a11yProps(2)} />
						</Tabs>
					</Box>

					{/* Tab 1: Información General */}
					<TabPanel value={tabValue} index={0}>
						<Stack spacing={3}>
							<CollapsibleSection
								title="Datos Básicos"
								icon={<Folder2 size={24} variant="Bold" />}
								subtitle="Información principal de la carpeta"
								defaultExpanded={true}
							>
								{MemoizedFolderData}
							</CollapsibleSection>

							<CollapsibleSection
								title="Datos de Mediación"
								icon={<DocumentText size={24} variant="Bold" />}
								subtitle="Información del proceso de mediación"
								defaultExpanded={false}
							>
								{MemoizedPreJudData}
							</CollapsibleSection>

							<CollapsibleSection
								title="Datos Judiciales"
								icon={<Judge size={24} variant="Bold" />}
								subtitle="Información del proceso judicial"
								defaultExpanded={false}
							>
								{MemoizedJudData}
							</CollapsibleSection>
						</Stack>
					</TabPanel>

					{/* Tab 2: Actividad */}
					<TabPanel value={tabValue} index={1}>
						<Grid container spacing={3}>
							<Grid item xs={12} md={isDetailedView ? 12 : 4} sx={GRID_STYLES}>
								{MemoizedMovements}
							</Grid>
							<Grid item xs={12} md={isDetailedView ? 12 : 4} sx={GRID_STYLES}>
								{MemoizedNotifications}
							</Grid>
							<Grid item xs={12} md={isDetailedView ? 12 : 4} sx={GRID_STYLES}>
								{MemoizedCalendar}
							</Grid>
						</Grid>
					</TabPanel>

					{/* Tab 3: Gestión */}
					<TabPanel value={tabValue} index={2}>
						<Grid container spacing={3}>
							<Grid item xs={12} md={isDetailedView ? 12 : 6} sx={GRID_STYLES}>
								{MemoizedCalcTable}
							</Grid>
							<Grid item xs={12} md={isDetailedView ? 12 : 6} sx={GRID_STYLES}>
								{MemoizedMembers}
							</Grid>
							<Grid item xs={12} md={12} sx={GRID_STYLES}>
								{MemoizedTaskList}
							</Grid>
						</Grid>
					</TabPanel>
				</Box>

				{/* LinkToJudicialPower Modal */}
				{id && folder && (
					<LinkToJudicialPower
						openLink={openLinkJudicial}
						onCancelLink={handleCloseLinkJudicial}
						folderId={id}
						folderName={folder.folderName}
					/>
				)}

				{/* Modal de error cuando no se tiene acceso a la característica */}
				<LimitErrorModal
					open={limitErrorOpen}
					onClose={handleCloseLimitErrorModal}
					message="Esta característica no está disponible en tu plan actual."
					featureInfo={limitErrorInfo}
					upgradeRequired={true}
				/>
			</MainCard>
		</Box>
	);
};

export default Details;
