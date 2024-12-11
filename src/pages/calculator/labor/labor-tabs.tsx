import { useState, ReactNode, SyntheticEvent, useEffect } from "react";
import BasicWizard from "sections/forms/wizard/calc-laboral/despido";
import LiquidacionWizard from "sections/forms/wizard/calc-laboral/liquidacion";

// material-ui
import { Box, Tab, Tabs, Typography } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";

// assets
import { Calculator, DocumentCloud } from "iconsax-react";
import SavedLabor from "./components/SavedLabor";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { dispatch } from "store";
import { getFoldersByUserId } from "store/reducers/folders";

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
	const [currentFolder, setCurrentFolder] = useState<any>(null);
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

	const { folders, loading } = useSelector((state: any) => state.folders);
	const { id } = useSelector((state: any) => state.auth?.user);
	const folderParam = searchParams.get("folder");

	// Primer useEffect para cargar los folders si es necesario
	useEffect(() => {
		if (id && !hasAttemptedFetch && folderParam) {
			dispatch(getFoldersByUserId(id));
			setHasAttemptedFetch(true);
		}
	}, [id, hasAttemptedFetch, folderParam]);

	// Segundo useEffect para buscar el folder una vez que los datos están cargados
	useEffect(() => {
		if (!folderParam || loading) return;

		const foundFolder = folders.find((f: any) => f._id === folderParam);
		setCurrentFolder(foundFolder || null);
	}, [folderParam, folders, loading]);

	const handleChange = (event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const shouldShowFolderName = value !== 2 && currentFolder?.folderName;

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
		</MainCard>
	);
}
