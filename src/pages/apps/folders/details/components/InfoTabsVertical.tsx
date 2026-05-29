import React, { useState, ReactNode, SyntheticEvent } from "react";
import {
	Box,
	Tabs,
	Tab,
	Stack,
	Typography,
	useTheme,
	alpha,
	Skeleton,
	useMediaQuery,
	Drawer,
	IconButton,
} from "@mui/material";
import { Folder2, DocumentText, Judge, TickCircle, Menu } from "iconsax-react";
import MainCard from "components/MainCard";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

interface InfoTabsVerticalProps {
	folderData: any;
	basicDataComponent: ReactNode;
	mediationDataComponent: ReactNode;
	judicialDataComponent: ReactNode;
	isLoader?: boolean;
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
			{value === index && <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>}
		</Box>
	);
}

const InfoTabsVertical = ({ folderData, basicDataComponent, mediationDataComponent, judicialDataComponent, isLoader }: InfoTabsVerticalProps) => {
	const [value, setValue] = useState(0);
	const [mobileOpen, setMobileOpen] = useState(false);
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	const handleChange = (_event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
		if (isMobile) {
			setMobileOpen(false);
		}
	};

	// Check data presence per section
	const hasBasicData = () => {
		if (!folderData) return false;
		return !!(folderData.folderName || folderData.number || folderData.type || folderData.juzgado || folderData.radicacion || folderData.subType);
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

	// Tab configuration — all brand-aligned, no rainbow
	const tabs = [
		{
			value: 0,
			label: "Datos básicos",
			icon: <Folder2 size={18} />,
			description: "Información principal",
			hasData: hasBasicData(),
			status: (() => {
				if (!folderData) return "Sin información";
				if (folderData.status === "Nueva") return "Recién creada";
				if (folderData.status === "En Progreso") return "En gestión";
				if (folderData.status === "Cerrada") return "Completada";
				return folderData.status || "Sin definir";
			})(),
		},
		{
			value: 1,
			label: "Mediación",
			icon: <DocumentText size={18} />,
			description: "Proceso de mediación",
			hasData: hasMediationData(),
			status: (() => {
				if (folderData?.status === "Cerrada") return "Terminada";
				if (folderData?.judFolder?.numberJudFolder) return "Terminada";
				if (folderData?.preFolder?.memberPreFolder) return "En curso";
				return "Sin iniciar";
			})(),
		},
		{
			value: 2,
			label: "Judicial",
			icon: <Judge size={18} />,
			description: "Proceso judicial",
			hasData: hasJudicialData(),
			status: (() => {
				if (folderData?.status === "Cerrada") return "Terminada";
				if (folderData?.judFolder?.numberJudFolder) return "En curso";
				return "Sin iniciar";
			})(),
		},
	];

	const totalSections = 3;
	const completedSections = tabs.filter((tab) => tab.hasData).length;
	const completionPct = (completedSections / totalSections) * 100;

	// Sidebar — brand-aligned
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
			<Box
				sx={{
					p: 2,
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
				}}
			>
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
						<Folder2 size={16} variant="Bulk" />
					</Box>
					<Stack spacing={0.125} sx={{ minWidth: 0 }}>
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
								Información general
							</Typography>
						</Stack>
						<Typography
							sx={{
								fontSize: "0.82rem",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								color: "text.primary",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{folderData?.folderName || "Carpeta"}
						</Typography>
					</Stack>
				</Stack>
			</Box>

			{/* Tabs vertical */}
			<Tabs
				orientation="vertical"
				variant="scrollable"
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
					flex: 1,
					"& .MuiTab-root": {
						minHeight: 76,
						justifyContent: "flex-start",
						textAlign: "left",
						alignItems: "flex-start",
						px: 1.75,
						py: 1.5,
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
				{tabs.map((tab) => {
					const active = value === tab.value;
					const statusAccent = tab.hasData ? LIVE_GREEN : STALE_AMBER;
					return (
						<Tab
							key={tab.value}
							value={tab.value}
							disableRipple
							label={
								<Stack spacing={0.625} alignItems="flex-start" width="100%">
									<Stack direction="row" spacing={1.25} alignItems="center" width="100%">
										<Box
											sx={{
												width: 28,
												height: 28,
												borderRadius: 0.75,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												bgcolor: active ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.1) : alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
												border: `1px solid ${active ? alpha(BRAND_BLUE, isDark ? 0.32 : 0.22) : alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
												color: BRAND_BLUE,
												transition: "all 180ms ease",
												flexShrink: 0,
											}}
										>
											{React.cloneElement(tab.icon, {
												variant: active ? "Bulk" : "Linear",
											})}
										</Box>
										<Box flex={1} sx={{ minWidth: 0 }}>
											<Typography
												sx={{
													fontSize: "0.85rem",
													fontWeight: active ? 600 : 500,
													letterSpacing: "-0.005em",
													color: active ? "text.primary" : "text.secondary",
												}}
											>
												{tab.label}
											</Typography>
										</Box>
										{tab.hasData && <TickCircle size={14} variant="Bold" color={LIVE_GREEN} />}
									</Stack>
									<Typography
										sx={{
											fontSize: "0.7rem",
											color: "text.secondary",
											letterSpacing: "-0.005em",
											pl: 4.75,
											opacity: 0.85,
										}}
									>
										{tab.description}
									</Typography>
									<Box sx={{ pl: 4.75, display: "inline-flex", alignItems: "center", gap: 0.5 }}>
										<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: statusAccent }} />
										<Typography
											sx={{
												fontSize: "0.66rem",
												fontWeight: 600,
												letterSpacing: "0.04em",
												textTransform: "uppercase",
												color: statusAccent,
											}}
										>
											{tab.status}
										</Typography>
									</Box>
								</Stack>
							}
						/>
					);
				})}
			</Tabs>

			{/* Stats footer */}
			<Box
				sx={{
					p: 2,
					borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
				}}
			>
				<Stack spacing={1}>
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
							Estado de completitud
						</Typography>
					</Stack>
					<Stack direction="row" justifyContent="space-between" alignItems="baseline">
						<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em" }}>Secciones completas</Typography>
						<Typography
							sx={{
								fontSize: "0.95rem",
								fontWeight: 700,
								color: completedSections === totalSections ? LIVE_GREEN : BRAND_BLUE,
								letterSpacing: "-0.015em",
								fontVariantNumeric: "tabular-nums",
							}}
						>
							{completedSections}
							<Box component="span" sx={{ fontSize: "0.78rem", fontWeight: 500, color: "text.secondary" }}>
								/{totalSections}
							</Box>
						</Typography>
					</Stack>
					<Box
						sx={{
							width: "100%",
							height: 6,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08),
							borderRadius: 1,
							overflow: "hidden",
						}}
					>
						<Box
							sx={{
								width: `${completionPct}%`,
								height: "100%",
								bgcolor: completedSections === totalSections ? LIVE_GREEN : BRAND_BLUE,
								transition: "width 300ms ease",
							}}
						/>
					</Box>
				</Stack>
			</Box>
		</Box>
	);

	return (
		<MainCard
			content={false}
			sx={{
				"& .MuiCardContent-root": { p: 0 },
				height: "100%",
				minHeight: 600,
				display: "flex",
				flexDirection: "column",
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				boxShadow: "none",
				overflow: "hidden",
			}}
		>
			<Box sx={{ display: "flex", height: "100%" }}>
				{isMobile ? (
					<>
						{/* Mobile layout */}
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
							{/* Mobile header bar */}
							<Box
								sx={{
									p: 1.5,
									borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
									display: "flex",
									alignItems: "center",
									gap: 1,
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
										{tabs[value].label}
									</Typography>
								</Stack>
							</Box>

							{/* Tab content */}
							<Box sx={{ flex: 1, overflow: "auto" }}>
								{isLoader ? (
									<Box sx={{ p: 2 }}>
										<Stack spacing={1.5}>
											<Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
											<Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1 }} />
											<Skeleton variant="rectangular" height={90} sx={{ borderRadius: 1 }} />
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

						{/* Mobile drawer */}
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
					<>
						{/* Desktop layout */}
						{sidebarContent}

						{/* Main content */}
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
							<Box sx={{ flex: 1, overflow: "auto" }}>
								{isLoader ? (
									<Box sx={{ p: 3 }}>
										<Stack spacing={1.5}>
											<Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
											<Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1 }} />
											<Skeleton variant="rectangular" height={90} sx={{ borderRadius: 1 }} />
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
