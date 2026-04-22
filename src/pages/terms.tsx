import React from "react";
// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Container, Grid, Typography, Divider, Tab, Tabs } from "@mui/material";

// third-party
import { motion } from "framer-motion";
import { useState, useRef, SyntheticEvent } from "react";

// project imports
import MainCard from "components/MainCard";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";
import LegalDocumentViewerAllPlans from "pages/extra-pages/price/LegalDocumentViewerAllPlans";
import { LEGAL_LAST_UPDATED } from "config/legalDates";
import LegalPageTOC, { TocItem } from "components/legal/LegalPageTOC";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;
	const visited = useRef(false);
	if (value === index) {
		visited.current = true;
	}

	return (
		<div role="tabpanel" hidden={value !== index} id={`terms-tabpanel-${index}`} aria-labelledby={`terms-tab-${index}`} {...other}>
			{visited.current && <Box sx={{ pt: 3 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `terms-tab-${index}`,
		"aria-controls": `terms-tabpanel-${index}`,
	};
}

// Tab anchor IDs used both for navigation and for the TOC items
const TERMS_TOC_ITEMS: TocItem[] = [
	{ id: "terminos-suscripcion", label: "Términos de suscripción" },
	{ id: "politica-reembolso", label: "Política de reembolso" },
	{ id: "terminos-facturacion", label: "Términos de facturación" },
];

// ==============================|| TERMS PAGE ||============================== //

const TermsPage = () => {
	const theme = useTheme();
	const [value, setValue] = useState(0);

	const handleChange = (_event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	// Map TOC item ids to tab indices
	const TAB_ID_TO_INDEX: Record<string, number> = {
		"terminos-suscripcion": 0,
		"politica-reembolso": 1,
		"terminos-facturacion": 2,
	};

	const TAB_INDEX_TO_ID = ["terminos-suscripcion", "politica-reembolso", "terminos-facturacion"];

	const TAB_INDEX_TO_LABEL = ["Términos de Suscripción", "Política de Reembolso", "Términos de Facturación"];

	const handleTocItemClick = (id: string) => {
		const idx = TAB_ID_TO_INDEX[id];
		if (idx !== undefined) {
			setValue(idx);
			// Scroll to the tab panel area after switching
			const panel = document.getElementById(`terms-tabpanel-${idx}`);
			if (panel) {
				panel.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		}
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
								<Typography variant="h1" sx={{ mb: 0.5 }}>
									Términos y Condiciones
								</Typography>
								<Typography variant="h4" color="text.secondary" sx={{ mb: 0.5, fontWeight: 400 }}>
									&rsaquo; {TAB_INDEX_TO_LABEL[value]}
								</Typography>
								<Typography variant="body1" color="text.secondary">
									Última actualización: {LEGAL_LAST_UPDATED}
								</Typography>
							</motion.div>
						</Box>
					</Grid>

					{/* Mobile TOC — visible only on xs/sm */}
					<Grid item xs={12} sx={{ display: { xs: "block", md: "none" } }}>
						<LegalPageTOC
							items={TERMS_TOC_ITEMS}
							ariaLabel="Índice de Términos y Condiciones"
							onItemClick={handleTocItemClick}
							activeItemId={TAB_INDEX_TO_ID[value]}
						/>
					</Grid>

					{/* Desktop TOC sidebar */}
					<Grid item md={3} sx={{ display: { xs: "none", md: "block" } }}>
						<LegalPageTOC
							items={TERMS_TOC_ITEMS}
							ariaLabel="Índice de Términos y Condiciones"
							onItemClick={handleTocItemClick}
							activeItemId={TAB_INDEX_TO_ID[value]}
						/>
					</Grid>

					<Grid item xs={12} md={9}>
						<MainCard>
							<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
								<Tabs value={value} onChange={handleChange} aria-label="legal documents tabs" variant="scrollable">
									<Tab label="Términos de Suscripción" {...a11yProps(0)} />
									<Tab label="Política de Reembolso" {...a11yProps(1)} />
									<Tab label="Términos de Facturación" {...a11yProps(2)} />
								</Tabs>
							</Box>
							<TabPanel value={value} index={0}>
								<LegalDocumentViewerAllPlans documentType="subscription" title="Términos de Suscripción" />
							</TabPanel>
							<TabPanel value={value} index={1}>
								<LegalDocumentViewerAllPlans documentType="refund" title="Política de Reembolso" />
							</TabPanel>
							<TabPanel value={value} index={2}>
								<LegalDocumentViewerAllPlans documentType="billing" title="Términos de Facturación" />
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
