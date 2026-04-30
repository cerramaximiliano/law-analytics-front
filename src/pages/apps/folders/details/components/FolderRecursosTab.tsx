import React, { useState } from "react";
import { Box, Drawer, IconButton, Paper, Stack, Tab, Tabs, Typography, alpha, useMediaQuery, useTheme } from "@mui/material";
import { DocumentText, Menu } from "iconsax-react";
import MainCard from "components/MainCard";
import FolderDocumentsTab from "./FolderDocumentsTab";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Tab panel ──────────────────────────────────────────────────────────────────

function TabPanel({ children, value, index }: { children?: React.ReactNode; value: number; index: number }) {
	return (
		<Box role="tabpanel" hidden={value !== index} sx={{ display: value === index ? "block" : "none", height: "100%" }}>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</Box>
	);
}

// ── Sub-tabs config ────────────────────────────────────────────────────────────

const SUB_TABS: SubTabItem[] = [
	{ value: 0, label: "Documentos", description: "Escritos y modelos vinculados", icon: <DocumentText size={20} /> },
];

// ── Component ──────────────────────────────────────────────────────────────────

const FolderRecursosTab = ({ folderId, folderName }: Props) => {
	const theme = useTheme();
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
				bgcolor: theme.palette.mode === "dark" ? alpha(theme.palette.background.paper, 0.8) : theme.palette.grey[50],
			}}
		>
			<Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
				<Typography variant="h6" fontWeight={600}>
					Recursos
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{folderName ?? "Este expediente"}
				</Typography>
			</Box>

			<Tabs
				orientation="vertical"
				variant="scrollable"
				value={subTab}
				onChange={handleChange}
				sx={{
					flex: 1,
					"& .MuiTabs-indicator": { left: 0, width: 3, borderRadius: "0 2px 2px 0" },
					"& .MuiTab-root": {
						minHeight: 72,
						justifyContent: "flex-start",
						alignItems: "flex-start",
						textAlign: "left",
						px: 2.5,
						py: 1.5,
						borderRadius: 0,
						textTransform: "none",
						transition: "background 0.2s",
						"&.Mui-selected": {
							bgcolor: alpha(theme.palette.primary.main, 0.08),
							"& .tab-icon": { transform: "scale(1.1)" },
						},
						"&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
					},
				}}
			>
				{SUB_TABS.map((t) => (
					<Tab
						key={t.value}
						value={t.value}
						label={
							<Stack spacing={0.5} alignItems="flex-start">
								<Stack direction="row" spacing={1} alignItems="center">
									<Box
										className="tab-icon"
										sx={{
											color: subTab === t.value ? theme.palette.primary.main : theme.palette.text.secondary,
											transition: "all 0.3s",
											display: "flex",
										}}
									>
										{React.cloneElement(t.icon, { variant: subTab === t.value ? "Bold" : "Linear" })}
									</Box>
									<Typography
										variant="body2"
										fontWeight={subTab === t.value ? 600 : 500}
										color={subTab === t.value ? "text.primary" : "text.secondary"}
									>
										{t.label}
									</Typography>
								</Stack>
								<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3, opacity: 0.8 }}>
									{t.description}
								</Typography>
							</Stack>
						}
					/>
				))}
			</Tabs>
		</Box>
	);

	return (
		<MainCard
			shadow={3}
			content={false}
			sx={{ "& .MuiCardContent-root": { p: 0 }, minHeight: 480, display: "flex", flexDirection: "column" }}
		>
			<Box sx={{ display: "flex", height: "100%" }}>
				{isMobile ? (
					<>
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
							<Box
								sx={{
									p: 1.5,
									borderBottom: `1px solid ${theme.palette.divider}`,
									display: "flex",
									alignItems: "center",
									gap: 1,
								}}
							>
								<IconButton size="small" onClick={() => setMobileOpen(true)}>
									<Menu size={18} />
								</IconButton>
								<Typography variant="subtitle1" fontWeight={600}>
									{SUB_TABS[subTab]?.label}
								</Typography>
							</Box>
							<Box sx={{ flex: 1, overflow: "auto" }}>
								<TabPanel value={subTab} index={0}>
									<FolderDocumentsTab folderId={folderId} folderName={folderName} />
								</TabPanel>
							</Box>
						</Box>
						<Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }}>
							{sidebar}
						</Drawer>
					</>
				) : (
					<>
						<Paper elevation={0} sx={{ borderRight: `1px solid ${theme.palette.divider}` }}>
							{sidebar}
						</Paper>
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
