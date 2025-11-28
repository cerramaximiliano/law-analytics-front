import React from "react";
import { useState } from "react";
import { Box, Tabs, Tab, useTheme, Skeleton, Typography, Stack, IconButton } from "@mui/material";
import { CloseCircle, DocumentText } from "iconsax-react";
import LegalDocumentViewer, { LegalDocumentType } from "./LegalDocumentViewer";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
	return (
		<div role="tabpanel" hidden={value !== index} id={`legal-tabpanel-${index}`} aria-labelledby={`legal-tab-${index}`} {...other}>
			{value === index && <Box>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `legal-tab-${index}`,
		"aria-controls": `legal-tabpanel-${index}`,
	};
}

interface TabLegalDocumentsProps {
	onClose?: () => void;
}

const TabLegalDocuments = ({ onClose }: TabLegalDocumentsProps) => {
	const [tabValue, setTabValue] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const theme = useTheme();

	const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
		setIsLoading(true);
		setTabValue(newValue);
		setTimeout(() => {
			setIsLoading(false);
		}, 800);
	};

	return (
		<Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
			{/* Header fijo con título y tabs */}
			<Box
				sx={{
					bgcolor: theme.palette.primary.lighter,
					borderBottom: 1,
					borderColor: "divider",
					flexShrink: 0,
				}}
			>
				{/* Título */}
				<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ p: 2, pb: 1 }}>
					<Stack direction="row" spacing={1} alignItems="center">
						<DocumentText size={24} color={theme.palette.primary.main} />
						<Typography variant="h5">Documentos legales de suscripción</Typography>
					</Stack>
					{onClose && (
						<IconButton onClick={onClose} size="small" color="error">
							<CloseCircle />
						</IconButton>
					)}
				</Stack>

				{/* Tabs */}
				<Tabs
					value={tabValue}
					onChange={handleChange}
					aria-label="documentos legales tabs"
					variant="scrollable"
					scrollButtons="auto"
					allowScrollButtonsMobile
					sx={{
						px: 2,
						"& .MuiTabs-indicator": {
							backgroundColor: theme.palette.primary.main,
						},
						"& .MuiTab-root.Mui-selected": {
							color: theme.palette.primary.main,
						},
					}}
				>
					<Tab label="Términos de suscripción" {...a11yProps(0)} />
					<Tab label="Política de reembolsos" {...a11yProps(1)} />
					<Tab label="Términos de facturación" {...a11yProps(2)} />
				</Tabs>
			</Box>

			{/* Contenido con scroll */}
			<Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
				{isLoading ? (
					<Box sx={{ py: 3 }}>
						<Skeleton variant="rectangular" height={40} width="60%" sx={{ mb: 2 }} />
						<Skeleton variant="rectangular" height={400} width="100%" />
					</Box>
				) : (
					<>
						<TabPanel value={tabValue} index={0}>
							<LegalDocumentViewer documentType={LegalDocumentType.SUBSCRIPTION} title="Términos y Condiciones de Suscripción" />
						</TabPanel>

						<TabPanel value={tabValue} index={1}>
							<LegalDocumentViewer documentType={LegalDocumentType.REFUND} title="Política de Reembolsos" />
						</TabPanel>

						<TabPanel value={tabValue} index={2}>
							<LegalDocumentViewer documentType={LegalDocumentType.BILLING} title="Términos de Facturación" />
						</TabPanel>
					</>
				)}
			</Box>
		</Box>
	);
};

export default TabLegalDocuments;
