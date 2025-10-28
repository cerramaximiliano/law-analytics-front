import React from "react";
import { useState, ReactNode, SyntheticEvent, useEffect } from "react";
// material-ui
import { Box, Tab, Tabs, IconButton, Tooltip, Skeleton, Stack, Grid } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";

// assets
import { Calculator, DocumentCloud, InfoCircle } from "iconsax-react";
import InteresesWizard from "sections/forms/wizard/calc-intereses";
import SavedIntereses from "./components/SavedIntereses";
import { GuideIntereses } from "components/guides";

// ==============================|| TAB PANEL ||============================== //

interface TabPanelProps {
	children?: ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
			{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}

// ==============================|| TABS - ICON ||============================== //

export default function InteresesTabs() {
	const [value, setValue] = useState(0);
	const [guideOpen, setGuideOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Simular carga inicial liviana para mostrar skeleton
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 150);
		return () => clearTimeout(timer);
	}, []);

	const handleChange = (event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	// Mostrar skeleton mientras se carga
	if (isLoading) {
		return (
			<MainCard>
				<Box sx={{ width: "100%" }}>
					<Box
						sx={{
							borderBottom: 1,
							borderColor: "divider",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<Stack direction="row" spacing={2} sx={{ mb: 2 }}>
							<Skeleton variant="rounded" width={160} height={42} />
							<Skeleton variant="rounded" width={140} height={42} />
						</Stack>
					</Box>
					<Box sx={{ pt: 2 }}>
						<Grid container spacing={3}>
							<Grid item xs={12} md={6}>
								<Stack spacing={2}>
									<Skeleton variant="text" width="40%" height={24} />
									<Skeleton variant="rounded" height={56} />
									<Skeleton variant="text" width="40%" height={24} />
									<Skeleton variant="rounded" height={56} />
									<Skeleton variant="text" width="40%" height={24} />
									<Skeleton variant="rounded" height={56} />
								</Stack>
							</Grid>
							<Grid item xs={12} md={6}>
								<Stack spacing={2}>
									<Skeleton variant="text" width="40%" height={24} />
									<Skeleton variant="rounded" height={56} />
									<Skeleton variant="text" width="40%" height={24} />
									<Skeleton variant="rounded" height={56} />
									<Skeleton variant="text" width="40%" height={24} />
									<Skeleton variant="rounded" height={56} />
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack direction="row" spacing={2} justifyContent="flex-end">
									<Skeleton variant="rounded" width={100} height={36} />
									<Skeleton variant="rounded" width={100} height={36} />
								</Stack>
							</Grid>
						</Grid>
					</Box>
				</Box>
			</MainCard>
		);
	}

	return (
		<MainCard>
			<Box sx={{ width: "100%" }}>
				<Box
					sx={{
						borderBottom: 1,
						borderColor: "divider",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Tabs
						value={value}
						onChange={handleChange}
						variant="scrollable"
						scrollButtons="auto"
						aria-label="basic tabs example"
						sx={{ flex: 1 }}
					>
						<Tab label="Cáculo Intereses" icon={<Calculator />} iconPosition="start" {...a11yProps(0)} />
						<Tab label="Guardados" icon={<DocumentCloud />} iconPosition="start" {...a11yProps(1)} />
					</Tabs>
					<Tooltip title="Ver Guía">
						<IconButton color="success" onClick={() => setGuideOpen(true)} size="medium">
							<InfoCircle variant="Bulk" />
						</IconButton>
					</Tooltip>
				</Box>
				<TabPanel value={value} index={0}>
					<InteresesWizard />
				</TabPanel>
				<TabPanel value={value} index={1}>
					<SavedIntereses />
				</TabPanel>
			</Box>
			<GuideIntereses open={guideOpen} onClose={() => setGuideOpen(false)} />
		</MainCard>
	);
}
