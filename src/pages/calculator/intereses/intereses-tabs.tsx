import React from "react";
import { useState, ReactNode, SyntheticEvent, useEffect } from "react";
// material-ui
import { Box, Tab, Tabs, IconButton, Tooltip, Skeleton, Stack, Grid, Typography, Divider } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";

// assets
import { Calculator, DocumentCloud, InfoCircle } from "iconsax-react";
import InteresesWizard from "sections/forms/wizard/calc-intereses";
import SavedIntereses from "./components/SavedIntereses";
import { GuideIntereses } from "components/guides";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { dispatch } from "store";
import { getFoldersByUserId } from "store/reducers/folder";

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
			{value === index && <Box sx={{ pt: 4 }}>{children}</Box>}
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
	const [searchParams, setSearchParams] = useSearchParams();
	const { folders } = useSelector((state: any) => state.folder);
	const { id } = useSelector((state: any) => state.auth?.user);
	const [guideOpen, setGuideOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const folderParam = searchParams.get("folder");
	const currentFolder = folderParam ? folders.find((f: any) => f._id === folderParam) : null;

	// Callback para actualizar la URL cuando se cambia la carpeta
	const handleFolderChange = (newFolderId: string | null) => {
		if (newFolderId) {
			setSearchParams({ folder: newFolderId });
		} else {
			setSearchParams({});
		}
	};

	useEffect(() => {
		if (id && folderParam) {
			dispatch(getFoldersByUserId(id));
		}
	}, [dispatch, id, folderParam]);

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

	const shouldShowFolderName = value !== 1 && folderParam && currentFolder?.folderName;

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
					{shouldShowFolderName && (
						<Typography
							variant="subtitle1"
							sx={{
								ml: 2,
								mr: 2,
								color: "text.secondary",
								display: "flex",
								alignItems: "center",
								gap: 1,
							}}
						>
							<DocumentCloud size={20} />
							{currentFolder.folderName}
						</Typography>
					)}
					<Tooltip title="Ver Guía">
						<IconButton color="success" onClick={() => setGuideOpen(true)} size="medium">
							<InfoCircle variant="Bulk" />
						</IconButton>
					</Tooltip>
				</Box>
				<TabPanel value={value} index={0}>
					<Stack spacing={3}>
						<Box>
							<Typography variant="h4" sx={{ mb: 1 }}>
								Liquidación de Intereses
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Calcula intereses sobre capital aplicando tasas BCRA, Acta 2601 o Acta 2630
							</Typography>
						</Box>
						<Divider />
						<InteresesWizard folder={currentFolder} onFolderChange={handleFolderChange} />
					</Stack>
				</TabPanel>
				<TabPanel value={value} index={1}>
					<SavedIntereses />
				</TabPanel>
			</Box>
			<GuideIntereses open={guideOpen} onClose={() => setGuideOpen(false)} />
		</MainCard>
	);
}
