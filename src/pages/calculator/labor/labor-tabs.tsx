import React from "react";
import { useState, ReactNode, SyntheticEvent, useEffect } from "react";
import BasicWizard from "sections/forms/wizard/calc-laboral/despido";
import LiquidacionWizard from "sections/forms/wizard/calc-laboral/liquidacion";

// material-ui
import { Box, Tab, Tabs, Typography, Tooltip, IconButton } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";

// assets
import { Calculator, DocumentCloud, InfoCircle } from "iconsax-react";
import SavedLabor from "./components/SavedLabor";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { dispatch } from "store";
import { getFoldersByUserId } from "store/reducers/folder";
import { GuideLaboral } from "components/guides";

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

export default function LaborTabs() {
	const [value, setValue] = useState(0);
	const [searchParams] = useSearchParams();
	const { folders } = useSelector((state: any) => state.folder);
	const { id } = useSelector((state: any) => state.auth?.user);
	const [guideOpen, setGuideOpen] = useState(false);

	const folderParam = searchParams.get("folder");
	const currentFolder = folderParam ? folders.find((f: any) => f._id === folderParam) : null;

	useEffect(() => {
		if (id && folderParam) {
			dispatch(getFoldersByUserId(id));
		}
	}, [dispatch, id, folderParam]);

	const handleChange = (event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const shouldShowFolderName = value !== 2 && folderParam && currentFolder?.folderName;
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
						<Tab label="Despido" icon={<Calculator />} iconPosition="start" {...a11yProps(0)} />
						<Tab label="Liquidación" icon={<Calculator />} iconPosition="start" {...a11yProps(1)} />
						<Tab label="Guardados" icon={<DocumentCloud />} iconPosition="start" {...a11yProps(2)} />
					</Tabs>
					<Tooltip title="Ver Guía">
						<IconButton color="success" onClick={() => setGuideOpen(true)} size="medium">
							<InfoCircle variant="Bulk" />
						</IconButton>
					</Tooltip>
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
				</Box>
				<TabPanel value={value} index={0}>
					<BasicWizard folder={currentFolder} />
				</TabPanel>
				<TabPanel value={value} index={1}>
					<LiquidacionWizard folder={currentFolder} />
				</TabPanel>
				<TabPanel value={value} index={2}>
					<SavedLabor />
				</TabPanel>
			</Box>
			<GuideLaboral open={guideOpen} onClose={() => setGuideOpen(false)} />
		</MainCard>
	);
}
