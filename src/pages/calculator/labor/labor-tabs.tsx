import { useState, ReactNode, SyntheticEvent } from "react";
import BasicWizard from "sections/forms/wizard/calc-laboral/despido";
import LiquidacionWizard from "sections/forms/wizard/calc-laboral/liquidacion";

// material-ui
import { Box, Tab, Tabs } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";

// assets
import { Calculator, DocumentCloud } from "iconsax-react";
import SavedLabor from "./components/SavedLabor";

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

export default function LaborTabs() {
	const [value, setValue] = useState(0);

	const handleChange = (event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	return (
		<MainCard>
			<Box sx={{ width: "100%" }}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Tabs value={value} onChange={handleChange} variant="scrollable" scrollButtons="auto" aria-label="basic tabs example">
						<Tab label="Despido" icon={<Calculator />} iconPosition="start" {...a11yProps(0)} />
						<Tab label="Liquidación" icon={<Calculator />} iconPosition="start" {...a11yProps(1)} />
						<Tab label="Guardados" icon={<DocumentCloud />} iconPosition="start" {...a11yProps(3)} />
					</Tabs>
				</Box>
				<TabPanel value={value} index={0}>
					<BasicWizard />
				</TabPanel>
				<TabPanel value={value} index={1}>
					<LiquidacionWizard />
				</TabPanel>
				<TabPanel value={value} index={2}>
					<SavedLabor />
				</TabPanel>
			</Box>
		</MainCard>
	);
}
