import React, { useState, useEffect } from "react";
import { Box, Tabs, Tab, Typography, Badge, useTheme, useMediaQuery, Drawer, IconButton, Stack, alpha } from "@mui/material";
import { Calculator, People, TaskSquare, Menu, DocumentText, Briefcase } from "iconsax-react";
import MainCard from "components/MainCard";
import CalcTableResponsive from "../components/CalcTableResponsive";
import MembersImproved from "../components/MembersImproved";
import TaskListImproved from "../components/TaskListImproved";
import Notes from "../components/Notes";
import { FolderData } from "types/folder";
import { useSelector, dispatch } from "store";
import { getCalculatorsByFolderId } from "store/reducers/calculator";
import { filterContactsByFolder, getContactsByUserId, getContactsByGroupId } from "store/reducers/contacts";
import { getTasksByFolderId } from "store/reducers/tasks";
import { useTeam } from "contexts/TeamContext";
import type { RootState } from "store";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`vertical-tabpanel-${index}`} aria-labelledby={`vertical-tab-${index}`} {...other}>
			{value === index && <Box sx={{ p: 0 }}>{children}</Box>}
		</div>
	);
}

interface GestionTabImprovedProps {
	folder: FolderData & { groupId?: string };
	isDetailedView: boolean;
}

const GestionTabImproved: React.FC<GestionTabImprovedProps> = ({ folder, isDetailedView }) => {
	void isDetailedView;
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [value, setValue] = useState(0);
	const [mobileOpen, setMobileOpen] = useState(false);

	const { activeTeam, isTeamMode } = useTeam();

	const { selectedCalculators } = useSelector((state: RootState) => state.calculator);
	const { selectedContacts, isInitialized: contactsInitialized } = useSelector((state: RootState) => state.contacts);
	const { selectedTasks, selectedFolderId: tasksFolderId } = useSelector((state: RootState) => state.tasksReducer);
	const { selectedNotes } = useSelector((state: RootState) => state.notesReducer);
	const userId = useSelector((state: RootState) => state.auth.user?._id);

	const lastFetchedFolderIdRef = React.useRef<string | null>(null);

	useEffect(() => {
		if (!folder._id) return;

		if (lastFetchedFolderIdRef.current === folder._id) {
			return;
		}

		const fetchData = async () => {
			const groupId = folder.groupId || (isTeamMode ? activeTeam?._id : undefined);

			dispatch(getCalculatorsByFolderId(folder._id, groupId));

			if (tasksFolderId !== folder._id) {
				dispatch(getTasksByFolderId(folder._id));
			}

			if (groupId) {
				await dispatch(getContactsByGroupId(groupId));
			} else if (userId && !contactsInitialized) {
				await dispatch(getContactsByUserId(userId));
			}
			dispatch(filterContactsByFolder(folder._id));

			lastFetchedFolderIdRef.current = folder._id;
		};

		fetchData();
	}, [folder._id, folder.groupId, userId, isTeamMode, activeTeam?._id, tasksFolderId, contactsInitialized]);

	const pendingTasks = selectedTasks?.filter((t: any) => !t.checked).length || 0;
	const totalTasks = selectedTasks?.length || 0;
	const completedTasks = totalTasks - pendingTasks;
	const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

	const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
		setValue(newValue);
		if (isMobile) {
			setMobileOpen(false);
		}
	};

	const tabData = [
		{
			icon: <Calculator size={20} />,
			label: "Cálculos, montos y ofrecimientos",
			shortLabel: "Cálculos",
			description: `${selectedCalculators?.length || 0} registros`,
		},
		{
			icon: <People size={20} />,
			label: "Intervinientes",
			shortLabel: "Intervinientes",
			description: `${selectedContacts?.length || 0} contactos`,
		},
		{
			icon: <TaskSquare size={20} />,
			label: "Tareas",
			shortLabel: "Tareas",
			description: `${pendingTasks} pendientes de ${totalTasks}`,
			badge: pendingTasks,
		},
		{
			icon: <DocumentText size={20} />,
			label: "Notas",
			shortLabel: "Notas",
			description: `${selectedNotes?.length || 0} notas`,
		},
	];

	const StatRow = ({ label, value: rowValue }: { label: string; value: React.ReactNode }) => (
		<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
			<Typography
				sx={{
					fontSize: "0.7rem",
					fontWeight: 600,
					letterSpacing: "0.04em",
					textTransform: "uppercase",
					color: "text.secondary",
				}}
			>
				{label}
			</Typography>
			<Typography
				sx={{
					fontSize: "0.82rem",
					fontWeight: 600,
					color: "text.primary",
					letterSpacing: "-0.005em",
					fontVariantNumeric: "tabular-nums",
				}}
			>
				{rowValue}
			</Typography>
		</Box>
	);

	const sidebarContent = (
		<Box
			sx={{
				width: 280,
				display: "flex",
				flexDirection: "column",
				height: "100%",
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
				borderRight: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
			}}
		>
			{/* Header */}
			<Box sx={{ p: 1.75, borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
				<Stack direction="row" spacing={1.25} alignItems="center">
					<Box
						sx={{
							width: 32,
							height: 32,
							borderRadius: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
						}}
					>
						<Briefcase size={16} variant="Bulk" />
					</Box>
					<Stack spacing={0.125}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
							<Typography
								sx={{
									fontSize: "0.58rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								Gestión
							</Typography>
						</Stack>
						<Typography
							sx={{
								fontSize: "0.82rem",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								color: "text.primary",
								lineHeight: 1.3,
							}}
						>
							Cálculos, contactos y tareas
						</Typography>
					</Stack>
				</Stack>
			</Box>

			{/* Tabs verticales */}
			<Box sx={{ flex: 1 }}>
				<Tabs
					orientation="vertical"
					variant="standard"
					value={value}
					onChange={handleChange}
					TabIndicatorProps={{
						sx: {
							left: 0,
							width: 3,
							borderRadius: "0 2px 2px 0",
							bgcolor: BRAND_BLUE,
							transition: "all 200ms ease",
						},
					}}
					sx={{
						borderRight: 0,
						"& .MuiTab-root": {
							minHeight: 68,
							justifyContent: "flex-start",
							textAlign: "left",
							alignItems: "flex-start",
							px: 1.75,
							py: 1.25,
							borderRadius: 0,
							textTransform: "none",
							transition: "all 180ms ease",
							"&.Mui-selected": {
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
							},
							"&:hover": {
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
							},
						},
					}}
				>
					{tabData.map((tab, index) => {
						const active = value === index;
						return (
							<Tab
								key={index}
								disableRipple
								label={
									<Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%" }}>
										<Box
											sx={{
												width: 28,
												height: 28,
												borderRadius: 0.75,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												bgcolor: active ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.1) : alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
												border: `1px solid ${active ? alpha(BRAND_BLUE, isDark ? 0.32 : 0.22) : alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
												color: BRAND_BLUE,
												flexShrink: 0,
												transition: "all 180ms ease",
											}}
										>
											{tab.badge ? (
												<Badge
													badgeContent={tab.badge}
													sx={{
														"& .MuiBadge-badge": {
															bgcolor: STALE_AMBER,
															color: "#fff",
															fontSize: "0.58rem",
															fontWeight: 700,
															height: 14,
															minWidth: 14,
															padding: "0 4px",
														},
													}}
												>
													{React.cloneElement(tab.icon, { size: 14, variant: active ? "Bulk" : "Linear" })}
												</Badge>
											) : (
												React.cloneElement(tab.icon, { size: 14, variant: active ? "Bulk" : "Linear" })
											)}
										</Box>
										<Stack spacing={0.125} sx={{ textAlign: "left", minWidth: 0 }}>
											<Typography
												sx={{
													fontSize: "0.85rem",
													fontWeight: active ? 600 : 500,
													letterSpacing: "-0.005em",
													color: active ? "text.primary" : "text.secondary",
												}}
											>
												{tab.shortLabel}
											</Typography>
											<Typography
												sx={{
													fontSize: "0.68rem",
													color: "text.secondary",
													letterSpacing: "-0.005em",
													opacity: 0.85,
												}}
											>
												{tab.description}
											</Typography>
										</Stack>
									</Stack>
								}
							/>
						);
					})}
				</Tabs>
			</Box>

			{/* Stats footer */}
			<Box sx={{ p: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
				<Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
					<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
					<Typography
						sx={{
							fontSize: "0.58rem",
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "text.secondary",
						}}
					>
						Estado general
					</Typography>
				</Stack>
				<Stack spacing={0.875}>
					<StatRow
						label="Completitud"
						value={
							<Box component="span" sx={{ color: completionPct === 100 ? LIVE_GREEN : BRAND_BLUE, fontWeight: 700 }}>
								{completionPct}%
							</Box>
						}
					/>
					{totalTasks > 0 && (
						<Box
							sx={{
								width: "100%",
								height: 5,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08),
								borderRadius: 1,
								overflow: "hidden",
							}}
						>
							<Box
								sx={{
									width: `${completionPct}%`,
									height: "100%",
									bgcolor: completionPct === 100 ? LIVE_GREEN : BRAND_BLUE,
									transition: "width 300ms ease",
								}}
							/>
						</Box>
					)}
					<StatRow label="Última actualización" value="Hoy" />
				</Stack>
			</Box>
		</Box>
	);

	return (
		<MainCard
			content={false}
			sx={{
				display: "flex",
				flexDirection: "column",
				height: isMobile ? "auto" : "calc(100vh - 200px)",
				overflow: "hidden",
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				boxShadow: "none",
			}}
		>
			{isMobile ? (
				<>
					<Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
						{/* Mobile header */}
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								p: 1.5,
								borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
							}}
						>
							<IconButton
								onClick={() => setMobileOpen(true)}
								sx={{
									width: 32,
									height: 32,
									borderRadius: 1,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
									color: BRAND_BLUE,
									"&:hover": {
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
									},
								}}
							>
								<Menu size={16} variant="Bulk" />
							</IconButton>
							<Stack spacing={0.125} sx={{ minWidth: 0, flex: 1 }}>
								<Stack direction="row" spacing={0.5} alignItems="center">
									<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
									<Typography
										sx={{
											fontSize: "0.58rem",
											fontWeight: 600,
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											color: "text.secondary",
										}}
									>
										Sección activa
									</Typography>
								</Stack>
								<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
									{tabData[value].shortLabel}
								</Typography>
							</Stack>
							<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
								{tabData[value].description}
							</Typography>
						</Box>
						<Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
							<TabPanel value={value} index={0}>
								<CalcTableResponsive title="" folderData={{ folderName: folder.folderName, monto: folder.amount || 0 }} />
							</TabPanel>
							<TabPanel value={value} index={1}>
								<MembersImproved title="" membersData={selectedContacts || []} isLoader={false} folderId={folder._id} />
							</TabPanel>
							<TabPanel value={value} index={2}>
								<TaskListImproved title="" folderName={folder.folderName} />
							</TabPanel>
							<TabPanel value={value} index={3}>
								<Notes title="" folderId={folder._id} />
							</TabPanel>
						</Box>
					</Box>
					<Drawer
						anchor="left"
						open={mobileOpen}
						onClose={() => setMobileOpen(false)}
						ModalProps={{ keepMounted: true }}
						PaperProps={{
							sx: {
								border: "none",
								boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
							},
						}}
					>
						{sidebarContent}
					</Drawer>
				</>
			) : (
				<Box sx={{ display: "flex", width: "100%", height: "100%" }}>
					{sidebarContent}
					<Box sx={{ flexGrow: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
						<Box sx={{ flex: 1, p: 3, overflow: "auto" }}>
							<TabPanel value={value} index={0}>
								<CalcTableResponsive title="" folderData={{ folderName: folder.folderName, monto: folder.amount || 0 }} />
							</TabPanel>
							<TabPanel value={value} index={1}>
								<MembersImproved title="" membersData={selectedContacts || []} isLoader={false} folderId={folder._id} />
							</TabPanel>
							<TabPanel value={value} index={2}>
								<TaskListImproved title="" folderName={folder.folderName} />
							</TabPanel>
							<TabPanel value={value} index={3}>
								<Notes title="" folderId={folder._id} />
							</TabPanel>
						</Box>
					</Box>
				</Box>
			)}
		</MainCard>
	);
};

export default GestionTabImproved;
