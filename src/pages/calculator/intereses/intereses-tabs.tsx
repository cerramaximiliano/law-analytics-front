import { useState, ReactNode, SyntheticEvent } from "react";
// material-ui
import { Box, Tab, Tabs, Button } from "@mui/material";

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

	const handleChange = (event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

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
					<Button variant="text" color="primary" startIcon={<InfoCircle />} onClick={() => setGuideOpen(true)} sx={{ mr: 2 }}>
						Ver Guía
					</Button>
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
