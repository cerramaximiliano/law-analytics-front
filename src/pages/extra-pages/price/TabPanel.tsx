import { useState } from "react";
import { Box, Tabs, Tab, useTheme, Skeleton } from "@mui/material";
import MainCard from "components/MainCard";
import LegalDocumentViewer, { LegalDocumentType } from "./LegalDocumentViewer";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
	return (
		<div role="tabpanel" hidden={value !== index} id={`legal-tabpanel-${index}`} aria-labelledby={`legal-tab-${index}`} {...other}>
			{value === index && <Box sx={{ py: 3 }}>{children}</Box>}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `legal-tab-${index}`,
		"aria-controls": `legal-tabpanel-${index}`,
	};
}

const TabLegalDocuments = () => {
	const [tabValue, setTabValue] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const theme = useTheme();

	// Establecemos una altura mínima para el contenedor de documentos
	const minDocumentHeight = 600; // Ajusta este valor según la altura mínima que necesites

	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
		// Activamos el estado de carga cuando cambiamos de pestaña
		setIsLoading(true);
		setTabValue(newValue);

		// Simulamos un tiempo de carga y luego desactivamos el estado de carga
		// Esto debería sincronizarse con la carga real del documento
		setTimeout(() => {
			setIsLoading(false);
		}, 800); // Ajusta este tiempo según la duración típica de carga de tus documentos
	};

	return (
		<MainCard title="Documentos legales de suscripción">
			<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
				<Tabs
					value={tabValue}
					onChange={handleChange}
					aria-label="documentos legales tabs"
					variant="scrollable"
					scrollButtons="auto"
					allowScrollButtonsMobile
					sx={{
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

			{/* Contenedor con altura mínima fija */}
			<Box sx={{ minHeight: minDocumentHeight }}>
				{isLoading ? (
					// Skeleton que ocupa el mismo espacio que el documento cargado
					<Box sx={{ py: 3 }}>
						<Skeleton variant="rectangular" height={40} width="60%" sx={{ mb: 2 }} />
						<Skeleton variant="rectangular" height={minDocumentHeight - 100} width="100%" />
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
		</MainCard>
	);
};

export default TabLegalDocuments;
