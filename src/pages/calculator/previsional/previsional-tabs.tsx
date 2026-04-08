import React from "react";
import { useState, ReactNode, SyntheticEvent, useEffect } from "react";

// material-ui
import { Box, Tab, Tabs, Skeleton, Stack, Grid, Typography } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import SavedPrevisional from "./components/SavedPrevisional";
import PrevisionalRetroactivoWizard from "sections/forms/wizard/calc-previsional/retroactivo";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { dispatch } from "store";
import { getFoldersByUserId } from "store/reducers/folder";

// assets
import { Calculator, DocumentCloud } from "iconsax-react";

// ==============================|| TAB PANEL ||============================== //

interface TabPanelProps {
	children?: ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`previsional-tabpanel-${index}`} aria-labelledby={`previsional-tab-${index}`} {...other}>
			{value === index && <Box sx={{ pt: 4 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `previsional-tab-${index}`,
		"aria-controls": `previsional-tabpanel-${index}`,
	};
}

// ==============================|| PREVISIONAL TABS ||============================== //

export default function PrevisionalTabs() {
	const [value, setValue] = useState(0);
	const [searchParams, setSearchParams] = useSearchParams();
	const { folders } = useSelector((state: any) => state.folder);
	const { id } = useSelector((state: any) => state.auth?.user);
	const [isLoading, setIsLoading] = useState(true);

	const folderParam = searchParams.get("folder");
	const currentFolder = folderParam ? folders.find((f: any) => f._id === folderParam) : null;

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
	}, [id, folderParam]);

	useEffect(() => {
		const timer = setTimeout(() => setIsLoading(false), 150);
		return () => clearTimeout(timer);
	}, []);

	const handleChange = (_event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const shouldShowFolderName = value !== 1 && folderParam && currentFolder?.folderName;

	if (isLoading) {
		return (
			<MainCard>
				<Box sx={{ width: "100%" }}>
					<Box sx={{ borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<Stack direction="row" spacing={2} sx={{ mb: 2 }}>
							<Skeleton variant="rounded" width={160} height={42} />
							<Skeleton variant="rounded" width={140} height={42} />
						</Stack>
					</Box>
					<Box sx={{ pt: 2 }}>
						<Grid container spacing={3}>
							<Grid item xs={12} md={6}>
								<Stack spacing={2}>
									{[1, 2, 3].map((i) => (
										<React.Fragment key={i}>
											<Skeleton variant="text" width="40%" height={24} />
											<Skeleton variant="rounded" height={56} />
										</React.Fragment>
									))}
								</Stack>
							</Grid>
							<Grid item xs={12} md={6}>
								<Stack spacing={2}>
									{[1, 2, 3].map((i) => (
										<React.Fragment key={i}>
											<Skeleton variant="text" width="40%" height={24} />
											<Skeleton variant="rounded" height={56} />
										</React.Fragment>
									))}
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
						aria-label="previsional tabs"
						sx={{ flex: 1 }}
					>
						<Tab label="Retroactivo" icon={<Calculator />} iconPosition="start" {...a11yProps(0)} />
						<Tab label="Guardados" icon={<DocumentCloud />} iconPosition="start" {...a11yProps(1)} />
					</Tabs>
					{shouldShowFolderName && (
						<Typography
							variant="subtitle1"
							sx={{ ml: 2, mr: 2, color: "text.secondary", display: "flex", alignItems: "center", gap: 1 }}
						>
							<DocumentCloud size={20} />
							{currentFolder.folderName}
						</Typography>
					)}
				</Box>

				<TabPanel value={value} index={0}>
					<PrevisionalRetroactivoWizard
						folder={currentFolder}
						onFolderChange={handleFolderChange}
					/>
				</TabPanel>

				<TabPanel value={value} index={1}>
					<SavedPrevisional />
				</TabPanel>
			</Box>
		</MainCard>
	);
}
