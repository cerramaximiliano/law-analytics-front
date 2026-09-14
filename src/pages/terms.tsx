// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Container, Grid, Typography, Divider, Tab, Tabs, Link } from "@mui/material";

// third-party
import { motion } from "framer-motion";
import React, { useState, useRef, SyntheticEvent } from "react";

// project imports
import MainCard from "components/MainCard";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";
import LegalDocumentViewerAllPlans from "pages/extra-pages/price/LegalDocumentViewerAllPlans";
import { LEGAL_LAST_UPDATED } from "config/legalDates";
import LegalPageTOC, { TocItem } from "components/legal/LegalPageTOC";

// ============================== TOKENS ============================== //
// Mantener en sync con sections/landing/Planes.tsx
const BRAND_BLUE = "#3A7BFF";

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
	const isDark = theme.palette.mode === "dark";
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
			const panel = document.getElementById(`terms-tabpanel-${idx}`);
			if (panel) {
				panel.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		}
	};


	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Términos y Condiciones" }];

	return (
		<Box component="section" sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 6, md: 10 }, position: "relative", overflow: "hidden" }}>
			<PageBackground variant="light" />
			<Container sx={{ position: "relative", zIndex: 1 }}>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<CustomBreadcrumbs items={breadcrumbItems} />
						<Box
							sx={{
								position: "relative",
								mt: { xs: 2, md: 3 },
								mb: { xs: 4, md: 6 },
								pb: { xs: 3, md: 4 },
								borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
							}}
						>
							<motion.div
								initial={{ opacity: 0, y: 24 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ type: "spring", stiffness: 150, damping: 30 }}
							>
								<Typography
									variant="h1"
									sx={{
										fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
										fontWeight: 600,
										lineHeight: 1.08,
										letterSpacing: "-0.025em",
										textWrap: "balance",
										mb: 0.75,
										color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
									}}
								>
									Términos y Condiciones
								</Typography>
								<Typography
									sx={{
										fontSize: { xs: "1rem", md: "1.125rem" },
										color: theme.palette.text.secondary,
										fontWeight: 400,
										letterSpacing: "-0.005em",
										mb: 1,
									}}
								>
									&rsaquo; {TAB_INDEX_TO_LABEL[value]}
								</Typography>
								<Typography
									sx={{
										fontSize: "0.92rem",
										color: theme.palette.text.secondary,
										letterSpacing: "0.01em",
									}}
								>
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
							<Box sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}` }}>
								<Tabs
									value={value}
									onChange={handleChange}
									aria-label="legal documents tabs"
									variant="scrollable"
									sx={{
										minHeight: 44,
										"& .MuiTab-root": {
											textTransform: "none",
											fontSize: "0.95rem",
											fontWeight: 500,
											letterSpacing: "-0.01em",
											minHeight: 44,
											px: 2.5,
											color: theme.palette.text.secondary,
											"&.Mui-selected": {
												color: BRAND_BLUE,
												fontWeight: 600,
											},
										},
										"& .MuiTabs-indicator": {
											backgroundColor: BRAND_BLUE,
											height: 2,
										},
									}}
								>
									<Tab label="Términos de suscripción" {...a11yProps(0)} />
									<Tab label="Política de reembolso" {...a11yProps(1)} />
									<Tab label="Términos de facturación" {...a11yProps(2)} />
								</Tabs>
							</Box>
							<TabPanel value={value} index={0}>
								<LegalDocumentViewerAllPlans documentType="subscription" title="Términos de suscripción" />
							</TabPanel>
							<TabPanel value={value} index={1}>
								<LegalDocumentViewerAllPlans documentType="refund" title="Política de reembolso" />
							</TabPanel>
							<TabPanel value={value} index={2}>
								<LegalDocumentViewerAllPlans documentType="billing" title="Términos de facturación" />
							</TabPanel>

							<Divider sx={{ my: 4, borderColor: alpha(theme.palette.divider, 0.6) }} />

							<Typography
								paragraph
								sx={{
									fontSize: "0.95rem",
									lineHeight: 1.65,
									color: theme.palette.text.primary,
									maxWidth: "70ch",
								}}
							>
								Si tiene alguna pregunta sobre estos Términos y Condiciones, puede contactarnos a través de nuestro formulario de contacto o
								por correo electrónico a{" "}
								<Link
									href="mailto:terms@lawanalytics.app"
									sx={{
										color: BRAND_BLUE,
										fontWeight: 500,
										textDecoration: "none",
										"&:hover": { textDecoration: "underline" },
									}}
								>
									terms@lawanalytics.app
								</Link>
								.
							</Typography>
						</MainCard>
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default TermsPage;
