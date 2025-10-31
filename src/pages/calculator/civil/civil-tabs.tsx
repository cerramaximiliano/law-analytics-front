import React from "react";
import { useState, ReactNode, SyntheticEvent, useEffect } from "react";

// material-ui
import { Box, Tab, Tabs, Typography, Alert, Tooltip, IconButton, Divider, Stack } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";

// assets
import { Calculator, DocumentCloud, InfoCircle } from "iconsax-react";
import CompensacionWizard from "sections/forms/wizard/calc-civil/compensacion";
import PunitivosWizard from "sections/forms/wizard/calc-civil/punitivos";
import ResarcimientoWizard from "sections/forms/wizard/calc-civil/resarcimiento";
import SavedCivil from "./components/SavedCivil";
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

export default function CivilTabs() {
	const [value, setValue] = useState(0);
	const [searchParams, setSearchParams] = useSearchParams();
	const { folders } = useSelector((state: any) => state.folder);
	const { id } = useSelector((state: any) => state.auth?.user);

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
	}, [id, folderParam]);

	const handleChange = (event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const shouldShowFolderAlert = value !== 4 && folderParam && currentFolder?.folderName;

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
					<Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto" aria-label="basic tabs example" sx={{ flex: 1 }}>
						<Tab label="Daños Punitivos" icon={<Calculator />} iconPosition="start" {...a11yProps(0)} />
						<Tab label="Compensación Económica" icon={<Calculator />} iconPosition="start" {...a11yProps(1)} />
						<Tab label="Daños y Perjuicios 'Vuoto'" icon={<Calculator />} iconPosition="start" {...a11yProps(2)} />
						<Tab label="Daños y Perjuicios 'Mendez'" icon={<Calculator />} iconPosition="start" {...a11yProps(3)} />
						<Tab label="Guardados" icon={<DocumentCloud />} iconPosition="start" {...a11yProps(4)} />
					</Tabs>
					<Tooltip title="Ver Guía">
						<IconButton color="success" size="medium">
							<InfoCircle variant="Bulk" />
						</IconButton>
					</Tooltip>
				</Box>

				{/* Mostrar nombre de la carpeta debajo del header cuando aplica */}
				{shouldShowFolderAlert && (
					<Alert
						severity="info"
						icon={<DocumentCloud variant="Bulk" size={20} />}
						sx={{ mt: 2, mb: 2 }}
						action={
							<Typography variant="caption" color="text.secondary">
								Carpeta vinculada
							</Typography>
						}
					>
						<Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
							{currentFolder.folderName}
						</Typography>
					</Alert>
				)}

				<TabPanel value={value} index={0}>
					<Stack spacing={3}>
					<Box>
						<Typography variant="h4" sx={{ mb: 1 }}>
							Daños Punitivos
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Calcula daños punitivos según la conducta del responsable y el contexto del daño causado
						</Typography>
					</Box>
					<Divider />
					<PunitivosWizard folder={currentFolder} onFolderChange={handleFolderChange} />
				</Stack>
				</TabPanel>
				<TabPanel value={value} index={1}>
					<Stack spacing={3}>
					<Box>
						<Typography variant="h4" sx={{ mb: 1 }}>
							Compensación Económica
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Determina la compensación económica en casos de divorcio o cese de convivencia
						</Typography>
					</Box>
					<Divider />
					<CompensacionWizard folder={currentFolder} onFolderChange={handleFolderChange} />
				</Stack>
				</TabPanel>
				<TabPanel value={value} index={2}>
					<Stack spacing={3}>
					<Box>
						<Typography variant="h4" sx={{ mb: 1 }}>
							Daños y Perjuicios 'Vuoto'
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Calcula resarcimiento de daños y perjuicios según el método Vuoto
						</Typography>
					</Box>
					<Divider />
					<ResarcimientoWizard folder={currentFolder} onFolderChange={handleFolderChange} />
				</Stack>
				</TabPanel>
				<TabPanel value={value} index={3}>
					<Stack spacing={3}>
					<Box>
						<Typography variant="h4" sx={{ mb: 1 }}>
							Daños y Perjuicios 'Mendez'
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Calcula resarcimiento de daños y perjuicios según el método Mendez
						</Typography>
					</Box>
					<Divider />
					<ResarcimientoWizard folder={currentFolder} onFolderChange={handleFolderChange} />
				</Stack>
				</TabPanel>
				<TabPanel value={value} index={4}>
					<SavedCivil />
				</TabPanel>
			</Box>
		</MainCard>
	);
}
