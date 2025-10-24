import React, { useState, useEffect } from "react";
import {
	Box,
	Tabs,
	Tab,
	Divider,
	Paper,
	Typography,
	Badge,
	useTheme,
	useMediaQuery,
	Drawer,
	IconButton,
	Stack,
	alpha,
} from "@mui/material";
import { Calculator, People, TaskSquare, Menu, DocumentText } from "iconsax-react";
import MainCard from "components/MainCard";
import CalcTableResponsive from "../components/CalcTableResponsive";
import MembersImproved from "../components/MembersImproved";
import TaskListImproved from "../components/TaskListImproved";
import Notes from "../components/Notes";
import { FolderData } from "types/folder";
import { useSelector, dispatch } from "store";
import { getCalculatorsByFolderId } from "store/reducers/calculator";
import { filterContactsByFolder, getContactsByUserId } from "store/reducers/contacts";
import { getTasksByFolderId } from "store/reducers/tasks";
import type { RootState } from "store";

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
	folder: FolderData;
	isDetailedView: boolean;
}

const GestionTabImproved: React.FC<GestionTabImprovedProps> = ({ folder, isDetailedView }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [value, setValue] = useState(0);
	const [mobileOpen, setMobileOpen] = useState(false);

	// Get data from Redux store
	const { selectedCalculators } = useSelector((state: RootState) => state.calculator);
	const { selectedContacts, contacts } = useSelector((state: RootState) => state.contacts);
	const { selectedTasks } = useSelector((state: RootState) => state.tasksReducer);
	const { selectedNotes } = useSelector((state: RootState) => state.notesReducer);
	const userId = useSelector((state: RootState) => state.auth.user?._id);

	// Fetch data when component mounts
	useEffect(() => {
		if (folder._id) {
			const fetchData = async () => {
				// Fetch calculations and tasks
				dispatch(getCalculatorsByFolderId(folder._id));
				dispatch(getTasksByFolderId(folder._id));

				// Fetch contacts if needed, then filter by folder
				if (userId && (!contacts || contacts.length === 0)) {
					await dispatch(getContactsByUserId(userId));
				}
				dispatch(filterContactsByFolder(folder._id));
			};
			fetchData();
		}
	}, [folder._id, userId]);

	const pendingTasks = selectedTasks?.filter((t: any) => !t.checked).length || 0;
	const totalTasks = selectedTasks?.length || 0;
	const completedTasks = totalTasks - pendingTasks;

	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
		setValue(newValue);
		if (isMobile) {
			setMobileOpen(false);
		}
	};

	const tabData = [
		{
			icon: <Calculator size={20} />,
			label: "Cálculos, Montos y Ofrecimientos",
			shortLabel: "Cálculos",
			description: `${selectedCalculators?.length || 0} registros`,
			color: theme.palette.primary.main,
		},
		{
			icon: <People size={20} />,
			label: "Intervinientes",
			shortLabel: "Intervinientes",
			description: `${selectedContacts?.length || 0} contactos`,
			color: theme.palette.success.main,
		},
		{
			icon: <TaskSquare size={20} />,
			label: "Tareas",
			shortLabel: "Tareas",
			description: `${pendingTasks} pendientes de ${totalTasks}`,
			color: theme.palette.warning.main,
			badge: pendingTasks,
		},
		{
			icon: <DocumentText size={20} />,
			label: "Notas",
			shortLabel: "Notas",
			description: `${selectedNotes?.length || 0} notas`,
			color: theme.palette.info.main,
		},
	];

	const sidebarContent = (
		<Box
			sx={{
				width: 280,
				display: "flex",
				flexDirection: "column",
				height: "100%",
			}}
		>
			<Box sx={{ p: 2.5 }}>
				<Typography variant="h5" sx={{ fontWeight: 600 }}>
					Gestión
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					Administra cálculos, intervinientes y tareas
				</Typography>
			</Box>
			<Divider />
			<Box sx={{ flex: 1, overflow: "auto" }}>
				<Tabs
					orientation="vertical"
					variant="scrollable"
					value={value}
					onChange={handleChange}
					sx={{
						borderRight: 0,
						"& .MuiTabs-indicator": {
							left: 0,
							width: 4,
							transition: "all 0.3s ease",
						},
						"& .MuiTab-root": {
							minHeight: 88,
							justifyContent: "flex-start",
							textAlign: "left",
							alignItems: "flex-start",
							px: 2.5,
							py: 2,
							borderRadius: 0,
							textTransform: "none",
							transition: "all 0.2s ease",
							"&.Mui-selected": {
								bgcolor: alpha(theme.palette.primary.main, 0.08),
							},
							"&:hover": {
								bgcolor: alpha(theme.palette.primary.main, 0.04),
							},
						},
					}}
				>
					{tabData.map((tab, index) => (
						<Tab
							key={index}
							label={
								<Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%" }}>
									<Box sx={{ color: tab.color }}>
										{tab.badge ? (
											<Badge badgeContent={tab.badge} color="warning">
												{tab.icon}
											</Badge>
										) : (
											tab.icon
										)}
									</Box>
									<Stack spacing={0.5} sx={{ textAlign: "left" }}>
										<Typography variant="body1" sx={{ fontWeight: 500 }}>
											{tab.shortLabel}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{tab.description}
										</Typography>
									</Stack>
								</Stack>
							}
						/>
					))}
				</Tabs>
			</Box>
			<Divider />
			<Box sx={{ p: 2 }}>
				<Paper
					sx={{
						p: 2,
						bgcolor: alpha(theme.palette.primary.main, 0.04),
						border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
						borderRadius: 2,
					}}
				>
					<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
						Estado General
					</Typography>
					<Stack spacing={0.5}>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<Typography variant="body2" color="text.secondary">
								Completitud:
							</Typography>
							<Typography variant="body2" fontWeight={600}>
								{totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : "0%"}
							</Typography>
						</Box>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<Typography variant="body2" color="text.secondary">
								Última actualización:
							</Typography>
							<Typography variant="body2" fontWeight={600}>
								Hoy
							</Typography>
						</Box>
					</Stack>
				</Paper>
			</Box>
		</Box>
	);

	return (
		<MainCard
			content={false}
			sx={{ display: "flex", flexDirection: "column", height: isMobile ? "auto" : "calc(100vh - 200px)", overflow: "hidden" }}
		>
			{isMobile ? (
				<>
					<Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
						<Box sx={{ display: "flex", alignItems: "center", p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
							<IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
								<Menu />
							</IconButton>
							<Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
								{tabData[value].shortLabel}
							</Typography>
							<Typography variant="caption" color="text.secondary">
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
						ModalProps={{
							keepMounted: true,
						}}
					>
						{sidebarContent}
					</Drawer>
				</>
			) : (
				<Box sx={{ display: "flex", width: "100%", height: "100%" }}>
					<Paper
						elevation={0}
						sx={{
							borderRight: `1px solid ${theme.palette.divider}`,
							bgcolor: theme.palette.mode === "dark" ? alpha(theme.palette.background.paper, 0.8) : theme.palette.grey[50],
							flexShrink: 0,
						}}
					>
						{sidebarContent}
					</Paper>
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
