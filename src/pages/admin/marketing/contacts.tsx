import { useState } from "react";

// material-ui
import { Box, Divider, Grid, Tab, Tabs, Typography } from "@mui/material";

// project imports
import MainCard from "components/MainCard";
import ContactsPanel from "sections/admin/marketing/ContactsPanel";
import SegmentsPanel from "sections/admin/marketing/SegmentsPanel";

// ==============================|| ADMIN - MARKETING CONTACTS ||============================== //

// TabPanel component
interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`contacts-tabpanel-${index}`} aria-labelledby={`contacts-tab-${index}`} {...other}>
			{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
		</div>
	);
}

const MarketingContacts = () => {
	// Tab state
	const [tabValue, setTabValue] = useState<number>(0);

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	return (
		<MainCard>
			<Box sx={{ mb: 2 }}>
				<Grid container alignItems="center" justifyContent="space-between">
					<Grid item>
						<Typography variant="h3">Gestión de Contactos y Segmentos</Typography>
					</Grid>
				</Grid>
			</Box>

			<MainCard content={false}>
				<Tabs
					value={tabValue}
					onChange={handleTabChange}
					indicatorColor="primary"
					textColor="primary"
					variant="fullWidth"
					aria-label="contact management tabs"
				>
					<Tab label="Contactos" />
					<Tab label="Segmentos" />
				</Tabs>

				<Divider />

				<TabPanel value={tabValue} index={0}>
					<ContactsPanel />
				</TabPanel>

				<TabPanel value={tabValue} index={1}>
					<SegmentsPanel />
				</TabPanel>
			</MainCard>
		</MainCard>
	);
};

export default MarketingContacts;
