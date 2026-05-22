import React, { useState } from "react";
import { Box, Drawer, IconButton, Stack, Tab, Tabs, Typography, alpha, useMediaQuery, useTheme } from "@mui/material";
import { DocumentText, Menu } from "iconsax-react";
import MainCard from "components/MainCard";
import FolderDocumentsTab from "./FolderDocumentsTab";
import { BRAND_BLUE } from "themes/dashboardTokens";

interface SubTabItem {
	value: number;
	label: string;
	description: string;
	icon: React.ReactElement;
}

interface Props {
	folderId: string;
	folderName?: string;
}

function TabPanel({ children, value, index }: { children?: React.ReactNode; value: number; index: number }) {
	return (
		<Box role="tabpanel" hidden={value !== index} sx={{ display: value === index ? "block" : "none", height: "100%" }}>
			{value === index && <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>}
		</Box>
	);
}

const SUB_TABS: SubTabItem[] = [
	{ value: 0, label: "Documentos", description: "Escritos y modelos vinculados", icon: <DocumentText size={20} /> },
];

const FolderRecursosTab = ({ folderId, folderName }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [subTab, setSubTab] = useState(0);
	const [mobileOpen, setMobileOpen] = useState(false);

	const handleChange = (_e: React.SyntheticEvent, v: number) => {
		setSubTab(v);
		if (isMobile) setMobileOpen(false);
	};

	const sidebar = (
		<Box
			sx={{
				width: 220,
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
						<DocumentText size={16} variant="Bulk" />
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
								Recursos
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
							{folderName ?? "Este expediente"}
						</Typography>
					</Stack>
				</Stack>
			</Box>

			{/* Tabs verticales */}
			<Tabs
				orientation="vertical"
				variant="scrollable"
				value={subTab}
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
						minHeight: 68,
						justifyContent: "flex-start",
						alignItems: "flex-start",
						textAlign: "left",
						px: 1.75,
						py: 1.25,
						borderRadius: 0,
						textTransform: "none",
						transition: "all 180ms ease",
						"&.Mui-selected": {
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
						},
						"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03) },
					},
				}}
			>
				{SUB_TABS.map((t) => {
					const active = subTab === t.value;
					return (
						<Tab
							key={t.value}
							value={t.value}
							disableRipple
							label={
								<Stack spacing={0.5} alignItems="flex-start" width="100%">
									<Stack direction="row" spacing={1.25} alignItems="center">
										<Box
											sx={{
												width: 26,
												height: 26,
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
											{React.cloneElement(t.icon, { size: 14, variant: active ? "Bulk" : "Linear" })}
										</Box>
										<Typography
											sx={{
												fontSize: "0.82rem",
												fontWeight: active ? 600 : 500,
												letterSpacing: "-0.005em",
												color: active ? "text.primary" : "text.secondary",
											}}
										>
											{t.label}
										</Typography>
									</Stack>
									<Typography sx={{ fontSize: "0.68rem", color: "text.secondary", letterSpacing: "-0.005em", pl: 4.625, opacity: 0.85 }}>
										{t.description}
									</Typography>
								</Stack>
							}
						/>
					);
				})}
			</Tabs>
		</Box>
	);

	return (
		<MainCard
			content={false}
			sx={{
				"& .MuiCardContent-root": { p: 0 },
				minHeight: 480,
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
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
										"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1) },
									}}
								>
									<Menu size={16} variant="Bulk" />
								</IconButton>
								<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
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
										{SUB_TABS[subTab]?.label}
									</Typography>
								</Stack>
							</Box>
							<Box sx={{ flex: 1, overflow: "auto" }}>
								<TabPanel value={subTab} index={0}>
									<FolderDocumentsTab folderId={folderId} folderName={folderName} />
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
							{sidebar}
						</Drawer>
					</>
				) : (
					<>
						{sidebar}
						<Box sx={{ flex: 1, overflow: "auto" }}>
							<TabPanel value={subTab} index={0}>
								<FolderDocumentsTab folderId={folderId} folderName={folderName} />
							</TabPanel>
						</Box>
					</>
				)}
			</Box>
		</MainCard>
	);
};

export default FolderRecursosTab;
