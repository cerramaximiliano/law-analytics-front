// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Container, Grid, Typography, Divider, Tab, Tabs } from "@mui/material";

// third-party
import { motion } from "framer-motion";
import { useState, SyntheticEvent } from "react";

// project imports
import MainCard from "components/MainCard";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";
import LegalDocumentViewer, { LegalDocumentType } from "pages/extra-pages/price/LegalDocumentViewer";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`terms-tabpanel-${index}`} aria-labelledby={`terms-tab-${index}`} {...other}>
			{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `terms-tab-${index}`,
		"aria-controls": `terms-tabpanel-${index}`,
	};
}

// ==============================|| TERMS PAGE ||============================== //

const TermsPage = () => {
	const theme = useTheme();
	const [value, setValue] = useState(0);

	const handleChange = (event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	// breadcrumb items
	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Términos y Condiciones" }];

	return (
		<Box component="section" sx={{ pt: { xs: 10, md: 15 }, pb: { xs: 5, md: 10 }, position: "relative", overflow: "hidden" }}>
			<PageBackground variant="light" />
			<Container>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<CustomBreadcrumbs items={breadcrumbItems} />
						<Box
							sx={{
								position: "relative",
								mb: 6,
								pb: 6,
								borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
							}}
						>
							<motion.div initial={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.5 }}>
								<Typography variant="h1" sx={{ mb: 1 }}>
									Términos y Condiciones
								</Typography>
								<Typography variant="body1" color="text.secondary">
									Última actualización: 1 de Mayo de 2025
								</Typography>
							</motion.div>
						</Box>
					</Grid>

					<Grid item xs={12}>
						<MainCard>
							<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
								<Tabs value={value} onChange={handleChange} aria-label="legal documents tabs" variant="scrollable">
									<Tab label="Términos de Suscripción" {...a11yProps(0)} />
									<Tab label="Política de Reembolso" {...a11yProps(1)} />
									<Tab label="Términos de Facturación" {...a11yProps(2)} />
								</Tabs>
							</Box>
							<TabPanel value={value} index={0}>
								<LegalDocumentViewer documentType={LegalDocumentType.SUBSCRIPTION} title="Términos de Suscripción" />
							</TabPanel>
							<TabPanel value={value} index={1}>
								<LegalDocumentViewer documentType={LegalDocumentType.REFUND} title="Política de Reembolso" />
							</TabPanel>
							<TabPanel value={value} index={2}>
								<LegalDocumentViewer documentType={LegalDocumentType.BILLING} title="Términos de Facturación" />
							</TabPanel>

							<Divider sx={{ my: 4 }} />

							<Typography variant="body1" paragraph>
								Si tiene alguna pregunta sobre estos Términos y Condiciones, puede contactarnos a través de nuestro formulario de contacto o
								por correo electrónico a terms@lawanalytics.app.
							</Typography>
						</MainCard>
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default TermsPage;
