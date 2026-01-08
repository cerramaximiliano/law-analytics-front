import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Paper,
	Divider,
	CircularProgress,
	Alert,
	List,
	ListItem,
	ListItemText,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Chip,
	useTheme,
	alpha,
} from "@mui/material";
import { ArrowDown2 } from "iconsax-react";
import ApiService, { LegalDocumentAllPlans, LegalDocumentSection } from "store/reducers/ApiService";

interface LegalDocumentViewerAllPlansProps {
	documentType: "subscription" | "refund" | "billing";
	title?: string;
}

interface PlanConfig {
	label: string;
	color: "default" | "primary" | "secondary" | "success" | "warning" | "info" | "error";
	description: string;
}

const planConfigs: Record<string, PlanConfig> = {
	free: {
		label: "Plan Gratuito",
		color: "default",
		description: "Términos aplicables al plan gratuito",
	},
	standard: {
		label: "Plan Estándar",
		color: "primary",
		description: "Términos aplicables al plan Estándar",
	},
	premium: {
		label: "Plan Premium",
		color: "secondary",
		description: "Términos aplicables al plan Premium",
	},
};

const LegalDocumentViewerAllPlans = ({ documentType, title }: LegalDocumentViewerAllPlansProps) => {
	const [document, setDocument] = useState<LegalDocumentAllPlans | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<string | false>("common");
	const theme = useTheme();

	useEffect(() => {
		const fetchDocument = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await ApiService.getLegalDocumentAllPlans(documentType);

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
	}, [documentType]);

	const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
		setExpanded(isExpanded ? panel : false);
	};

	const formatDate = (dateString: string | Date) => {
		const date = typeof dateString === "string" ? new Date(dateString) : dateString;
		return new Intl.DateTimeFormat("es-ES", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		}).format(date);
	};

	const renderSections = (sections: LegalDocumentSection[]) => {
		if (!sections || sections.length === 0) {
			return (
				<Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
					No hay secciones específicas para este plan.
				</Typography>
			);
		}

		return sections.map((section, index) => (
			<Box key={index} sx={{ mb: 3 }}>
				<Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
					{section.title}
				</Typography>
				<Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "pre-line" }}>
					{section.content}
				</Typography>
			</Box>
		));
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

	const paperBgColor = theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[100];

	return (
		<Box>
			{/* Encabezado del documento */}
			<Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: paperBgColor }}>
				<Typography variant="h4" gutterBottom>
					{title || document.title}
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

			{/* Acordeón: Términos Generales (comunes a todos los planes) */}
			{document.commonSections && document.commonSections.length > 0 && (
				<Accordion
					expanded={expanded === "common"}
					onChange={handleAccordionChange("common")}
					sx={{
						mb: 2,
						borderRadius: 2,
						"&:before": { display: "none" },
						boxShadow: theme.shadows[1],
					}}
				>
					<AccordionSummary
						expandIcon={<ArrowDown2 size={20} />}
						sx={{
							bgcolor: alpha(theme.palette.info.main, 0.08),
							borderRadius: expanded === "common" ? "8px 8px 0 0" : 2,
							"&:hover": { bgcolor: alpha(theme.palette.info.main, 0.12) },
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
							<Typography variant="h6">Términos Generales</Typography>
							<Chip label="Todos los planes" size="small" color="info" variant="outlined" />
						</Box>
					</AccordionSummary>
					<AccordionDetails sx={{ pt: 3 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
							Estos términos aplican a todos los planes de suscripción.
						</Typography>
						{renderSections(document.commonSections)}
					</AccordionDetails>
				</Accordion>
			)}

			{/* Acordeones por plan */}
			{(["free", "standard", "premium"] as const).map((planId) => {
				const planConfig = planConfigs[planId];
				const exclusiveSections = document.exclusiveSectionsByPlan?.[planId] || [];

				// Solo mostrar si hay secciones exclusivas para este plan
				if (exclusiveSections.length === 0) {
					return null;
				}

				return (
					<Accordion
						key={planId}
						expanded={expanded === planId}
						onChange={handleAccordionChange(planId)}
						sx={{
							mb: 2,
							borderRadius: 2,
							"&:before": { display: "none" },
							boxShadow: theme.shadows[1],
						}}
					>
						<AccordionSummary
							expandIcon={<ArrowDown2 size={20} />}
							sx={{
								bgcolor:
									planId === "free"
										? alpha(theme.palette.grey[500], 0.08)
										: planId === "standard"
											? alpha(theme.palette.primary.main, 0.08)
											: alpha(theme.palette.secondary.main, 0.08),
								borderRadius: expanded === planId ? "8px 8px 0 0" : 2,
								"&:hover": {
									bgcolor:
										planId === "free"
											? alpha(theme.palette.grey[500], 0.12)
											: planId === "standard"
												? alpha(theme.palette.primary.main, 0.12)
												: alpha(theme.palette.secondary.main, 0.12),
								},
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
								<Typography variant="h6">{planConfig.label}</Typography>
								<Chip
									label={`${exclusiveSections.length} ${exclusiveSections.length === 1 ? "sección" : "secciones"}`}
									size="small"
									color={planConfig.color}
									variant="outlined"
								/>
							</Box>
						</AccordionSummary>
						<AccordionDetails sx={{ pt: 3 }}>
							<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
								{planConfig.description}
							</Typography>
							{renderSections(exclusiveSections)}
						</AccordionDetails>
					</Accordion>
				);
			})}

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
					{(document.companyDetails.name || document.companyDetails.address) && (
						<ListItem disableGutters>
							<ListItemText primary={document.companyDetails.name} secondary={document.companyDetails.address} />
						</ListItem>
					)}
					{document.companyDetails.email && (
						<ListItem disableGutters>
							<ListItemText primary="Email" secondary={document.companyDetails.email} />
						</ListItem>
					)}
					{document.companyDetails.phone && (
						<ListItem disableGutters>
							<ListItemText primary="Teléfono" secondary={document.companyDetails.phone} />
						</ListItem>
					)}
					{document.companyDetails.registrationNumber && (
						<ListItem disableGutters>
							<ListItemText primary="Registro" secondary={document.companyDetails.registrationNumber} />
						</ListItem>
					)}
				</List>
			</Paper>

			{/* Fecha de última actualización */}
			<Box sx={{ mt: 4, textAlign: "center" }}>
				<Typography variant="caption" color="text.secondary">
					Última actualización: {formatDate(document.effectiveDate)}
				</Typography>
			</Box>
		</Box>
	);
};

export default LegalDocumentViewerAllPlans;
