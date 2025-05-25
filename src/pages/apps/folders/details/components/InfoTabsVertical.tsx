import React, { useState, ReactNode, SyntheticEvent } from "react";
import {
	Box,
	Tabs,
	Tab,
	Stack,
	Typography,
	Paper,
	useTheme,
	alpha,
	Chip,
	Skeleton,
	ToggleButton,
	ToggleButtonGroup,
	useMediaQuery,
	Drawer,
	IconButton,
} from "@mui/material";
import { Folder2, DocumentText, Judge, TickCircle, Eye, Grid1, Menu } from "iconsax-react";
import MainCard from "components/MainCard";

interface InfoTabsVerticalProps {
	folderData: any;
	basicDataComponent: ReactNode;
	mediationDataComponent: ReactNode;
	judicialDataComponent: ReactNode;
	isLoader?: boolean;
	isDetailedView?: boolean;
	onViewToggle?: (detailed: boolean) => void;
}

interface TabPanelProps {
	children?: ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<Box
			role="tabpanel"
			hidden={value !== index}
			id={`info-tabpanel-${index}`}
			aria-labelledby={`info-tab-${index}`}
			{...other}
			sx={{
				display: value === index ? "block" : "none",
				height: "100%",
			}}
		>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</Box>
	);
}

const InfoTabsVertical = ({
	folderData,
	basicDataComponent,
	mediationDataComponent,
	judicialDataComponent,
	isLoader,
	isDetailedView = false,
	onViewToggle,
}: InfoTabsVerticalProps) => {
	const [value, setValue] = useState(0);
	const [mobileOpen, setMobileOpen] = useState(false);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	const handleChange = (event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
		if (isMobile) {
			setMobileOpen(false);
		}
	};

	const handleViewChange = (event: React.MouseEvent<HTMLElement>, newView: boolean | null) => {
		if (newView !== null && onViewToggle) {
			onViewToggle(newView);
		}
	};

	// Function to check if section has data
	const hasBasicData = () => {
		if (!folderData) return false;
		return !!(
			folderData.folderName ||
			folderData.number ||
			folderData.type ||
			folderData.juzgado ||
			folderData.radicacion ||
			folderData.subType
		);
	};

	const hasMediationData = () => {
		if (!folderData) return false;
		return !!(folderData.mediador || folderData.dateMediationStart || folderData.dateMediationEnd || folderData.acuerdo);
	};

	const hasJudicialData = () => {
		if (!folderData) return false;
		return !!(
			folderData.secretaria ||
			folderData.dateStart ||
			folderData.dateEnd ||
			folderData.sentencia ||
			folderData.apelacion ||
			folderData.fechaPago
		);
	};

	// Tab configuration
	const tabs = [
		{
			value: 0,
			label: "Datos Básicos",
			icon: <Folder2 size={20} />,
			color: theme.palette.primary.main,
			description: "Información principal",
			hasData: hasBasicData(),
			status: (() => {
				// Sugerencias de estado basadas en la información disponible:

				// Opción 1: Basado en el estado general de la carpeta
				if (!folderData) return "Sin información";
				if (folderData.status === "Nueva") return "Recién creada";
				if (folderData.status === "En Proceso") return "En gestión";
				if (folderData.status === "Finalizada") return "Completada";

				// Opción 2: Basado en la completitud de datos
				// const completeness = hasBasicData() ? "Datos completos" : "Datos incompletos";

				// Opción 3: Basado en la materia/tipo de caso
				// if (folderData.materia) return folderData.materia;

				// Opción 4: Basado en el rol del cliente
				// if (folderData.orderStatus) return folderData.orderStatus;

				// Opción 5: Mostrar el fuero
				// if (folderData.folderFuero) return folderData.folderFuero;

				return folderData.status || "Sin definir";
			})(),
		},
		{
			value: 1,
			label: "Mediación",
			icon: <DocumentText size={20} />,
			color: theme.palette.warning.main,
			description: "Proceso de mediación",
			hasData: hasMediationData(),
			status: (() => {
				// Si el estado de la carpeta es "Finalizada"
				if (folderData?.status === "Finalizada") {
					return "Terminada";
				}
				// Si hay número de expediente judicial, la mediación está terminada
				if (folderData?.judFolder?.numberJudFolder) {
					return "Terminada";
				}
				// Si hay expediente de mediación, está en curso
				if (folderData?.preFolder?.memberPreFolder) {
					return "En curso";
				}
				// Si no hay número de expediente de mediación, no ha iniciado
				return "Sin iniciar";
			})(),
		},
		{
			value: 2,
			label: "Judicial",
			icon: <Judge size={20} />,
			color: theme.palette.info.main,
			description: "Proceso judicial",
			hasData: hasJudicialData(),
			status: (() => {
				// Si el estado de la carpeta es "Finalizada"
				if (folderData?.status === "Finalizada") {
					return "Terminada";
				}
				// Si hay número de expediente judicial, está en curso
				if (folderData?.judFolder?.numberJudFolder) {
					return "En curso";
				}
				// Si no hay número de expediente judicial, no ha iniciado
				return "Sin iniciar";
			})(),
		},
	];

	// Calculate totals for stats
	const totalSections = 3;
	const completedSections = tabs.filter((tab) => tab.hasData).length;

	// Sidebar content
	const sidebarContent = (
		<Box
			sx={{
				width: 280,
				display: "flex",
				flexDirection: "column",
				height: "100%",
				bgcolor: theme.palette.mode === "dark" ? alpha(theme.palette.background.paper, 0.8) : theme.palette.grey[50],
			}}
		>
			{/* Header */}
			<Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
				<Typography variant="h5" gutterBottom>
					Información General
				</Typography>
				<Typography variant="caption" color="textSecondary">
					{folderData?.folderName || "Carpeta"}
				</Typography>
			</Box>

			{/* Tabs */}
			<Tabs
				orientation="vertical"
				variant="scrollable"
				value={value}
				onChange={handleChange}
				sx={{
					flex: 1,
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
							"& .tab-icon": {
								transform: "scale(1.1)",
							},
						},
						"&:hover": {
							bgcolor: alpha(theme.palette.primary.main, 0.04),
						},
					},
				}}
			>
				{tabs.map((tab) => (
					<Tab
						key={tab.value}
						value={tab.value}
						label={
							<Stack spacing={1} alignItems="flex-start" width="100%">
								<Stack direction="row" spacing={1.5} alignItems="center" width="100%">
									<Box
										className="tab-icon"
										sx={{
											color: value === tab.value ? tab.color : theme.palette.text.secondary,
											transition: "all 0.3s ease",
											display: "flex",
											alignItems: "center",
										}}
									>
										{React.cloneElement(tab.icon, {
											variant: value === tab.value ? "Bold" : "Linear",
										})}
									</Box>
									<Box flex={1}>
										<Typography
											variant="subtitle1"
											fontWeight={value === tab.value ? 600 : 500}
											color={value === tab.value ? "text.primary" : "text.secondary"}
										>
											{tab.label}
										</Typography>
									</Box>
									{tab.hasData && <TickCircle size={16} variant="Bold" color={theme.palette.success.main} style={{ opacity: 0.8 }} />}
								</Stack>
								<Typography
									variant="caption"
									color="textSecondary"
									sx={{
										lineHeight: 1.2,
										display: "block",
										opacity: 0.8,
									}}
								>
									{tab.description}
								</Typography>
								<Typography
									variant="caption"
									sx={{
										color: tab.hasData ? tab.color : theme.palette.text.disabled,
										fontWeight: tab.hasData ? 500 : 400,
										fontSize: "0.7rem",
									}}
								>
									{tab.status}
								</Typography>
							</Stack>
						}
					/>
				))}
			</Tabs>

			{/* Stats Section */}
			<Box sx={{ p: 2.5, borderTop: `1px solid ${theme.palette.divider}` }}>
				<Typography variant="caption" color="textSecondary" gutterBottom>
					Estado de completitud
				</Typography>
				<Stack spacing={1} mt={1.5}>
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="body2">Secciones completas</Typography>
						<Chip
							size="small"
							label={`${completedSections}/${totalSections}`}
							color={completedSections === totalSections ? "success" : "default"}
							variant={completedSections === totalSections ? "filled" : "outlined"}
						/>
					</Stack>
					{/* Progress indicator */}
					<Box
						sx={{
							width: "100%",
							height: 4,
							bgcolor: theme.palette.grey[200],
							borderRadius: 2,
							overflow: "hidden",
						}}
					>
						<Box
							sx={{
								width: `${(completedSections / totalSections) * 100}%`,
								height: "100%",
								bgcolor: completedSections === totalSections ? theme.palette.success.main : theme.palette.primary.main,
								transition: "width 0.3s ease",
							}}
						/>
					</Box>
				</Stack>
			</Box>
		</Box>
	);

	return (
		<MainCard
			shadow={3}
			content={false}
			sx={{
				"& .MuiCardContent-root": { p: 0 },
				height: "100%",
				minHeight: 600,
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Box sx={{ display: "flex", height: "100%" }}>
				{isMobile ? (
					<>
						{/* Mobile Layout */}
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
							{/* Content Header with Menu */}
							<Box
								sx={{
									p: 2,
									borderBottom: `1px solid ${theme.palette.divider}`,
									bgcolor: theme.palette.background.paper,
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
										<Menu />
									</IconButton>
									<Typography variant="h6" sx={{ fontWeight: 600 }}>
										{tabs[value].label}
									</Typography>
								</Box>
								{/* View Toggle Button - Only show if available */}
								{onViewToggle && (
									<ToggleButtonGroup
										value={isDetailedView}
										exclusive
										onChange={handleViewChange}
										size="small"
										sx={{
											"& .MuiToggleButton-root": {
												px: 1.5,
												py: 0.5,
												textTransform: "none",
												fontSize: "0.8125rem",
											},
										}}
									>
										<ToggleButton value={false} aria-label="vista compacta">
											<Grid1 size={16} style={{ marginRight: 4 }} />
											Compacta
										</ToggleButton>
										<ToggleButton value={true} aria-label="vista detallada">
											<Eye size={16} style={{ marginRight: 4 }} />
											Detallada
										</ToggleButton>
									</ToggleButtonGroup>
								)}
							</Box>

							{/* Tab Panels */}
							<Box sx={{ flex: 1, overflow: "auto" }}>
								{isLoader ? (
									<Box sx={{ p: 3 }}>
										<Stack spacing={2}>
											<Skeleton variant="rectangular" height={60} />
											<Skeleton variant="rectangular" height={200} />
											<Skeleton variant="rectangular" height={100} />
										</Stack>
									</Box>
								) : (
									<>
										<TabPanel value={value} index={0}>
											{basicDataComponent}
										</TabPanel>
										<TabPanel value={value} index={1}>
											{mediationDataComponent}
										</TabPanel>
										<TabPanel value={value} index={2}>
											{judicialDataComponent}
										</TabPanel>
									</>
								)}
							</Box>
						</Box>

						{/* Mobile Drawer */}
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
					<>
						{/* Desktop Layout */}
						<Paper
							elevation={0}
							sx={{
								borderRight: `1px solid ${theme.palette.divider}`,
							}}
						>
							{sidebarContent}
						</Paper>

						{/* Main Content Area */}
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
							{/* Content Header - Only show view toggle if available */}
							{onViewToggle && (
								<Box
									sx={{
										p: 2,
										borderBottom: `1px solid ${theme.palette.divider}`,
										bgcolor: theme.palette.background.paper,
										display: "flex",
										justifyContent: "flex-end",
									}}
								>
									{/* View Toggle Button */}
									<ToggleButtonGroup
										value={isDetailedView}
										exclusive
										onChange={handleViewChange}
										size="small"
										sx={{
											"& .MuiToggleButton-root": {
												px: 1.5,
												py: 0.5,
												textTransform: "none",
												fontSize: "0.8125rem",
											},
										}}
									>
										<ToggleButton value={false} aria-label="vista compacta">
											<Grid1 size={16} style={{ marginRight: 4 }} />
											Compacta
										</ToggleButton>
										<ToggleButton value={true} aria-label="vista detallada">
											<Eye size={16} style={{ marginRight: 4 }} />
											Detallada
										</ToggleButton>
									</ToggleButtonGroup>
								</Box>
							)}

							{/* Tab Panels */}
							<Box sx={{ flex: 1, overflow: "auto" }}>
								{isLoader ? (
									<Box sx={{ p: 3 }}>
										<Stack spacing={2}>
											<Skeleton variant="rectangular" height={60} />
											<Skeleton variant="rectangular" height={200} />
											<Skeleton variant="rectangular" height={100} />
										</Stack>
									</Box>
								) : (
									<>
										<TabPanel value={value} index={0}>
											{basicDataComponent}
										</TabPanel>
										<TabPanel value={value} index={1}>
											{mediationDataComponent}
										</TabPanel>
										<TabPanel value={value} index={2}>
											{judicialDataComponent}
										</TabPanel>
									</>
								)}
							</Box>
						</Box>
					</>
				)}
			</Box>
		</MainCard>
	);
};

export default InfoTabsVertical;
