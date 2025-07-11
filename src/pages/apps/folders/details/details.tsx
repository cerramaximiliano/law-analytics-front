import React, { useState, useEffect, useMemo, useCallback, useRef, ReactNode, SyntheticEvent } from "react";
import { useParams, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import {
	Skeleton,
	Box,
	Tab,
	Tabs,
	Typography,
	useTheme,
	alpha,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	useMediaQuery,
	Paper,
} from "@mui/material";
import {
	ExportSquare,
	InfoCircle,
	Activity,
	Briefcase,
	Category,
	TableDocument,
	FolderCross,
	ArrowLeft,
	TickCircle,
	CloseCircle,
} from "iconsax-react";
import MainCard from "components/MainCard";
import { useBreadcrumb } from "contexts/BreadcrumbContext";
import useSubscription from "hooks/useSubscription";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import { formatFolderName } from "utils/formatFolderName";

// Components
import FolderDataCompact from "./components/FolderDataCompact";
import FolderPreJudDataCompact from "./components/FolderPreJudDataCompact";
import FolderJudDataCompact from "./components/FolderJudDataCompact";
import FolderDataImproved from "./components/FolderDataImproved";
import FolderPreJudDataImproved from "./components/FolderPreJudDataImproved";
import FolderJudDataImproved from "./components/FolderJudDataImproved";
import ActivityTables from "./components/ActivityTables";
import LinkToJudicialPower from "sections/apps/folders/LinkToJudicialPower";
import NavigationControls from "./components/NavigationControls";
import InfoTabsVertical from "./components/InfoTabsVertical";

// Actions
import { dispatch } from "store";
import { getFolderById } from "store/reducers/folder";
import { filterContactsByFolder, getContactsByUserId } from "store/reducers/contacts";
import GestionTabImproved from "./alternatives/GestionTabImproved";

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
			{value === index && <Box sx={{ pt: 2, px: 2 }}>{children}</Box>}
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
	const navigate = useNavigate();
	const [viewMode, setViewMode] = useState<"compact" | "detailed">("compact");
	const isDetailedView = viewMode === "detailed";
	const [openLinkJudicial, setOpenLinkJudicial] = useState(false);
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);
	const [tabValue, setTabValue] = useState(0);
	const [folderNotFound, setFolderNotFound] = useState(false);
	// const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false); // Removed: Using icon tabs instead
	const { setCustomLabel, clearCustomLabel } = useBreadcrumb();

	// Media queries for responsive design
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isTablet = useMediaQuery(theme.breakpoints.down("md"));

	// Usar el hook de suscripción para verificar características
	const { canVinculateFolders } = useSubscription();

	// Optimized selectors with specific state slices
	const folder = useSelector((state: StateType) => state.folder.folder);
	const isLoader = useSelector((state: StateType) => state.folder.isLoader);
	const contacts = useSelector((state: StateType) => state.contacts.contacts);
	const userId = useSelector((state: StateType) => state.auth.user?._id);

	// Memoized data fetching function
	const fetchData = useCallback(async () => {
		if (!id || id === "undefined") return;

		try {
			// Ejecutar las promesas en paralelo pero sin mezclar tipos
			const folderPromise = dispatch(getFolderById(id));
			const contactsPromise = userId ? dispatch(getContactsByUserId(userId)) : Promise.resolve();

			const [folderResult] = await Promise.all([folderPromise, contactsPromise]);

			// Check if folder was not found
			if (!folderResult.success) {
				setFolderNotFound(true);
			}
		} catch (error) {
			setFolderNotFound(true);
		}
	}, [id, userId]);

	// Data fetch when id changes
	useEffect(() => {
		// Reset folder not found state when id changes
		setFolderNotFound(false);
		fetchData();
		// Reset tab to first tab when changing folders
		setTabValue(0);
	}, [id, fetchData]);

	// Handle folder not found - redirect after showing message
	useEffect(() => {
		if (folderNotFound) {
			const timer = setTimeout(() => {
				navigate("/apps/folders/list");
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [folderNotFound, navigate]);

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

	const handleOpenLinkJudicial = useCallback(() => {
		// Verificar si el usuario tiene acceso a la característica de vincular carpetas
		const { canAccess, featureInfo } = canVinculateFolders();
		console.log(canAccess, featureInfo);
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
		// Mobile drawer removed - no longer needed with icon tabs
	}, []);

	// Drawer functions removed: Using icon tabs instead

	// Tab items configuration
	// Tab configuration with icons and labels
	interface TabItem {
		value: number;
		label: string;
		icon: React.ReactElement;
		shortLabel: string;
		ariaLabel: string;
	}

	const tabItems = useMemo<TabItem[]>(
		() => [
			{
				value: 0,
				label: "Información General",
				icon: <InfoCircle size="20" />,
				shortLabel: "Info",
				ariaLabel: "Información General",
			},
			{
				value: 1,
				label: "Actividad",
				icon: <Activity size="20" />,
				shortLabel: "Actividad",
				ariaLabel: "Actividad",
			},
			{
				value: 2,
				label: "Gestión",
				icon: <Briefcase size="20" />,
				shortLabel: "Gestión",
				ariaLabel: "Gestión",
			},
		],
		[],
	);

	// Memoized judicial link button
	const renderJudicialLink = useMemo(
		() =>
			isLoader ? (
				<Skeleton variant="rectangular" width={180} height={36} sx={{ borderRadius: 0.5 }} />
			) : (
				<Box>
					{folder?.pjn ? (
						<Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
							<Box sx={{ position: "relative", display: "inline-flex" }}>
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
								{/* Ícono de estado de verificación */}
								{(folder?.causaVerified === false || (folder?.causaVerified === true && folder?.causaIsValid !== undefined)) && (
									<Tooltip
										title={
											folder?.causaVerified === false
												? "Pendiente de verificación"
												: folder.causaIsValid
												? "Causa válida"
												: "Causa inválida"
										}
									>
										<Box
											sx={{
												position: "absolute",
												bottom: -8,
												right: -8,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												width: 20,
												height: 20,
												bgcolor: theme.palette.background.paper,
												borderRadius: "50%",
												boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
											}}
										>
											{folder?.causaVerified === false ? (
												<InfoCircle size={18} variant="Bold" color={theme.palette.warning.main} />
											) : folder.causaIsValid ? (
												<TickCircle size={18} variant="Bold" color={theme.palette.success.main} />
											) : (
												<CloseCircle size={18} variant="Bold" color={theme.palette.error.main} />
											)}
										</Box>
									</Tooltip>
								)}
							</Box>
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
			),
		[folder?.pjn, folder?.causaVerified, folder?.causaIsValid, handleOpenLinkJudicial, isLoader, theme],
	);

	// Memoized components - switch between compact and improved based on isDetailedView
	const MemoizedFolderData = useMemo(
		() =>
			isDetailedView ? (
				<FolderDataImproved isLoader={isLoader} folder={folder} />
			) : (
				<FolderDataCompact isLoader={isLoader} folder={folder} type="general" />
			),
		[isLoader, folder, isDetailedView],
	);

	const MemoizedPreJudData = useMemo(
		() =>
			isDetailedView ? (
				<FolderPreJudDataImproved isLoader={isLoader} folder={folder} />
			) : (
				<FolderPreJudDataCompact isLoader={isLoader} folder={folder} type="mediacion" />
			),
		[isLoader, folder, isDetailedView],
	);

	const MemoizedJudData = useMemo(
		() =>
			isDetailedView ? (
				<FolderJudDataImproved isLoader={isLoader} folder={folder} />
			) : (
				<FolderJudDataCompact isLoader={isLoader} folder={folder} type="judicial" />
			),
		[isLoader, folder, isDetailedView],
	);

	// Show folder not found message
	if (folderNotFound) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "60vh",
					px: 2,
				}}
			>
				<Paper
					elevation={0}
					sx={{
						maxWidth: 500,
						width: "100%",
						borderRadius: 2,
						overflow: "hidden",
						border: `1px solid ${theme.palette.divider}`,
						backgroundColor: theme.palette.background.paper,
					}}
				>
					<Box sx={{ p: 4, textAlign: "center" }}>
						{/* Icon */}
						<Box
							sx={{
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								width: 80,
								height: 80,
								borderRadius: "50%",
								backgroundColor: alpha(theme.palette.error.main, 0.08),
								mb: 3,
							}}
						>
							<FolderCross size={40} color={theme.palette.error.main} variant="Bulk" />
						</Box>

						{/* Title */}
						<Typography
							variant="h4"
							sx={{
								fontWeight: 600,
								color: theme.palette.text.primary,
								mb: 1.5,
							}}
						>
							Carpeta no encontrada
						</Typography>

						{/* Description */}
						<Typography
							variant="body1"
							sx={{
								color: theme.palette.text.secondary,
								mb: 3,
								lineHeight: 1.6,
							}}
						>
							La carpeta que intentas acceder no existe o no tienes permisos para verla.
						</Typography>

						{/* Redirect message with icon */}
						<Box
							sx={{
								display: "inline-flex",
								alignItems: "center",
								gap: 1,
								px: 2.5,
								py: 1,
								borderRadius: 1,
								backgroundColor: alpha(theme.palette.primary.main, 0.08),
							}}
						>
							<ArrowLeft size={18} color={theme.palette.primary.main} />
							<Typography
								variant="body2"
								sx={{
									color: theme.palette.primary.main,
									fontWeight: 500,
								}}
							>
								Redirigiendo a la lista de carpetas...
							</Typography>
						</Box>
					</Box>
				</Paper>
			</Box>
		);
	}

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

			{/* Mobile Drawer for Navigation - Removed: Now using icon tabs */}

			<MainCard content={false} sx={{ "& .MuiCardContent-root": { p: 0 } }}>
				<Box sx={{ width: "100%", position: "relative" }}>
					{/* Tab Header with buttons - responsive layout */}
					<Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 2 }}>
						{/* On mobile, stack vertically */}
						<Box
							sx={{
								display: "flex",
								flexDirection: { xs: "column", sm: "column", md: "row" },
								justifyContent: { md: "space-between" },
								alignItems: { xs: "stretch", md: "center" },
								gap: { xs: 2, md: 0 },
								mb: { xs: 2, md: 0 },
							}}
						>
							{/* Mobile Icon Tabs */}
							{isMobile ? (
								<Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>
									<Box
										sx={{
											display: "flex",
											gap: 0,
											"& > *:not(:last-child)": {
												borderRight: `1px solid ${theme.palette.divider}`,
											},
										}}
									>
										{tabItems.map((tab) => (
											<Tooltip key={tab.value} title={tab.label} arrow>
												<Box
													onClick={() => setTabValue(tab.value)}
													sx={{
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														px: 3,
														py: 1.5,
														cursor: "pointer",
														color: tabValue === tab.value ? theme.palette.primary.main : theme.palette.text.secondary,
														transition: "all 0.2s ease",
														position: "relative",
														"&:hover": {
															color: theme.palette.primary.main,
														},
														"&::after": {
															content: '""',
															position: "absolute",
															bottom: 0,
															left: "50%",
															transform: "translateX(-50%)",
															width: tabValue === tab.value ? "60%" : "0%",
															height: 2,
															backgroundColor: theme.palette.primary.main,
															transition: "width 0.3s ease",
														},
													}}
													aria-label={tab.ariaLabel}
													role="tab"
													aria-selected={tabValue === tab.value}
													tabIndex={0}
													onKeyDown={(e) => {
														if (e.key === "Enter" || e.key === " ") {
															e.preventDefault();
															setTabValue(tab.value);
														}
													}}
												>
													{React.cloneElement(tab.icon, {
														size: 28,
														variant: tabValue === tab.value ? "Bold" : "Linear",
													})}
												</Box>
											</Tooltip>
										))}
									</Box>
								</Box>
							) : (
								/* Desktop/Tablet Tabs */
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
											fontSize: { xs: "0.75rem", sm: "0.875rem" },
											fontWeight: 500,
											px: { xs: 1.5, sm: 2 },
											minWidth: { xs: "auto", sm: 120 },
										},
										"& .MuiTab-iconWrapper": {
											marginRight: { xs: 0.5, sm: 1 },
										},
									}}
								>
									{tabItems.map((tab) => (
										<Tab
											key={tab.value}
											label={isTablet ? tab.shortLabel : tab.label}
											icon={React.cloneElement(tab.icon, { size: isTablet ? 18 : 20 })}
											iconPosition="start"
											{...a11yProps(tab.value)}
										/>
									))}
								</Tabs>
							)}

							{/* View Mode Selector and Judicial Link Button */}
							<Box
								sx={{
									display: "flex",
									gap: 2,
									alignItems: "center",
									justifyContent: { xs: "center", sm: "flex-start", md: "flex-end" },
									flexWrap: { xs: "wrap", sm: "nowrap" },
								}}
							>
								{/* View Mode Toggle - Only show on Info tab */}
								{tabValue === 0 && (
									<ToggleButtonGroup
										value={viewMode}
										exclusive
										onChange={(_, newViewMode) => newViewMode && setViewMode(newViewMode)}
										size="small"
										sx={{
											"& .MuiToggleButton-root": {
												px: 2,
												py: 0.75,
												height: 36,
												borderRadius: 0.5,
												"&.Mui-selected": {
													bgcolor: alpha(theme.palette.primary.main, 0.08),
													borderColor: theme.palette.primary.main,
												},
											},
										}}
									>
										<ToggleButton value="compact">
											<Tooltip title="Vista compacta">
												<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
													<TableDocument size={16} />
													<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
														Compacta
													</Typography>
												</Box>
											</Tooltip>
										</ToggleButton>
										<ToggleButton value="detailed">
											<Tooltip title="Vista detallada con mejor aprovechamiento del espacio">
												<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
													<Category size={16} />
													<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
														Detallada
													</Typography>
												</Box>
											</Tooltip>
										</ToggleButton>
									</ToggleButtonGroup>
								)}
								{renderJudicialLink}
							</Box>
						</Box>
					</Box>

					{/* Tab 1: Información General */}
					<TabPanel value={tabValue} index={0}>
						<InfoTabsVertical
							folderData={folder}
							basicDataComponent={MemoizedFolderData}
							mediationDataComponent={MemoizedPreJudData}
							judicialDataComponent={MemoizedJudData}
							isLoader={isLoader}
						/>
					</TabPanel>

					{/* Tab 2: Actividad */}
					<TabPanel value={tabValue} index={1}>
						<ActivityTables folderName={folder?.folderName} />
					</TabPanel>

					{/* Tab 3: Gestión */}
					<TabPanel value={tabValue} index={2}>
						{folder && <GestionTabImproved folder={folder} isDetailedView={isDetailedView} />}
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
