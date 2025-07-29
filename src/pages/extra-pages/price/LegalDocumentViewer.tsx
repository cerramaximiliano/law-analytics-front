import { useState, useEffect } from "react";
import { Box, Typography, Paper, Divider, CircularProgress, Alert, Container, List, ListItem, ListItemText, useTheme } from "@mui/material";
import MainCard from "components/MainCard";
import ApiService, { LegalDocument } from "store/reducers/ApiService";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

interface LegalDocumentViewerProps {
	documentType: "subscription" | "refund" | "billing";
	planId?: string;
	title?: string;
}

const LegalDocumentViewer = ({ documentType, planId, title }: LegalDocumentViewerProps) => {
	const [document, setDocument] = useState<LegalDocument | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const theme = useTheme();

	useEffect(() => {
		const fetchDocument = async () => {
			try {
				setLoading(true);
				setError(null);

				let response;
				switch (documentType) {
					case "subscription":
						response = await ApiService.getSubscriptionTerms(planId);
						break;
					case "refund":
						response = await ApiService.getRefundPolicy(planId);
						break;
					case "billing":
						response = await ApiService.getBillingTerms(planId);
						break;
				}

				if (response && response.success && response.document) {
					setDocument(response.document);
				} else {
					setError("No se pudo obtener el documento solicitado");
				}
			} catch (err: any) {
				setError(err.message || "Error al cargar el documento");
			} finally {
				setLoading(false);
			}
		};

		fetchDocument();
	}, [documentType, planId]);

	const formatDate = (dateString: string | Date) => {
		const date = typeof dateString === "string" ? new Date(dateString) : dateString;
		return new Intl.DateTimeFormat("es-ES", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		}).format(date);
	};

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Alert severity="error" sx={{ mt: 2 }}>
				{error}
			</Alert>
		);
	}

	if (!document) {
		return (
			<Alert severity="info" sx={{ mt: 2 }}>
				No se encontró el documento solicitado.
			</Alert>
		);
	}

	// Color de fondo alternativo seguro para los papeles
	const paperBgColor = theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[100];

	return (
		<MainCard title={title || document.title}>
			<SimpleBar style={{ maxHeight: "70vh" }}>
				<Container maxWidth="lg" sx={{ py: 2 }}>
					{/* Encabezado del documento */}
					<Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: paperBgColor }}>
						<Typography variant="h4" gutterBottom>
							{document.title}
						</Typography>
						<Typography variant="body2" color="text.secondary" gutterBottom>
							Versión {document.version} - Vigente desde: {formatDate(document.effectiveDate)}
						</Typography>
					</Paper>

					{/* Introducción */}
					<Box sx={{ my: 3 }}>
						<Typography variant="body1" paragraph>
							{document.introduction}
						</Typography>
					</Box>

					<Divider sx={{ my: 3 }} />

					{/* Secciones del documento */}
					<Box sx={{ my: 4 }}>
						{document.sections
							.sort((a, b) => a.order - b.order)
							.map((section, index) => (
								<Box key={index} sx={{ mb: 4 }}>
									<Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
										{section.title}
									</Typography>
									<Typography variant="body1" paragraph>
										{section.content}
									</Typography>
								</Box>
							))}
					</Box>

					<Divider sx={{ my: 3 }} />

					{/* Conclusión */}
					{document.conclusion && (
						<Box sx={{ my: 3 }}>
							<Typography variant="body1" paragraph>
								{document.conclusion}
							</Typography>
						</Box>
					)}

					{/* Información de la empresa */}
					<Paper elevation={0} sx={{ p: 3, mt: 3, bgcolor: paperBgColor }}>
						<Typography variant="subtitle1" gutterBottom>
							Información de contacto:
						</Typography>
						<List dense disablePadding>
							<ListItem disableGutters>
								<ListItemText primary={document.companyDetails.name} secondary={document.companyDetails.address} />
							</ListItem>
							<ListItem disableGutters>
								<ListItemText primary="Email" secondary={document.companyDetails.email} />
							</ListItem>
							<ListItem disableGutters>
								<ListItemText primary="Teléfono" secondary={document.companyDetails.phone} />
							</ListItem>
							<ListItem disableGutters>
								<ListItemText primary="Registro" secondary={document.companyDetails.registrationNumber} />
							</ListItem>
						</List>
					</Paper>

					{/* Información del plan (si está disponible) */}
					{document.planDetails && (
						<Paper
							elevation={0}
							sx={{
								p: 3,
								mt: 3,
								bgcolor: theme.palette.primary.light + "20",
								border: `1px solid ${theme.palette.primary.light}`,
							}}
						>
							<Typography variant="subtitle1" gutterBottom color="primary.main">
								Detalles específicos para {document.planDetails.name}:
							</Typography>
							<List dense disablePadding>
								<ListItem disableGutters>
									<ListItemText primary="Plan" secondary={document.planDetails.name} />
								</ListItem>
								<ListItem disableGutters>
									<ListItemText
										primary="Precio"
										secondary={`${document.planDetails.price} ${document.planDetails.currency} / ${
											document.planDetails.billingPeriod === "monthly" ? "mes" : "año"
										}`}
									/>
								</ListItem>
								<ListItem disableGutters>
									<ListItemText primary="Descripción" secondary={document.planDetails.description} />
								</ListItem>
							</List>

							{/* Límites de recursos */}
							{document.planDetails.resourceLimits && Object.keys(document.planDetails.resourceLimits).length > 0 && (
								<>
									<Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
										Límites de recursos:
									</Typography>
									<List dense disablePadding>
										{Object.entries(document.planDetails.resourceLimits).map(([key, value], index) => (
											<ListItem key={index} disableGutters>
												<ListItemText primary={key} secondary={`${value.limit} ${value.description ? `- ${value.description}` : ""}`} />
											</ListItem>
										))}
									</List>
								</>
							)}
						</Paper>
					)}

					{/* Fecha de última actualización */}
					<Box sx={{ mt: 4, textAlign: "center" }}>
						<Typography variant="caption" color="text.secondary">
							Última actualización: {formatDate(document.effectiveDate)}
						</Typography>
					</Box>
				</Container>
			</SimpleBar>
		</MainCard>
	);
};

// Re-exportamos los tipos específicos para estos componentes
export const LegalDocumentType = {
	SUBSCRIPTION: "subscription" as const,
	REFUND: "refund" as const,
	BILLING: "billing" as const,
};

export type LegalDocumentTypeValues = (typeof LegalDocumentType)[keyof typeof LegalDocumentType];

export default LegalDocumentViewer;
