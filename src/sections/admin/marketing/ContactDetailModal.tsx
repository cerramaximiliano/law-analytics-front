import React, { useEffect, useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Grid,
	Divider,
	Box,
	Chip,
	CircularProgress,
	Alert,
	List,
	ListItem,
	ListItemText,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
} from "@mui/material";
import { MarketingContact } from "types/marketing-contact";
import { MarketingContactService } from "store/reducers/marketing-contacts";
import CampaignDetailModal from "./CampaignDetailModal";

interface ContactDetailModalProps {
	open: boolean;
	onClose: () => void;
	contactId: string | null;
}

const ContactDetailModal: React.FC<ContactDetailModalProps> = ({ open, onClose, contactId }) => {
	const [contact, setContact] = useState<MarketingContact | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [campaignModalOpen, setCampaignModalOpen] = useState<boolean>(false);
	const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
	useEffect(() => {
		if (open && contactId) {
			fetchContactDetails(contactId);
		}
	}, [open, contactId]);

	const fetchContactDetails = async (id: string) => {
		try {
			setLoading(true);
			setError(null);
			const contactData = await MarketingContactService.getContactById(id);
			setContact(contactData);
		} catch (err: any) {
			console.error("Error al obtener detalles del contacto:", err);
			setError(err?.message || "No se pudo cargar la información del contacto");
		} finally {
			setLoading(false);
		}
	};

	// Format date helper
	const formatDate = (dateString?: string | Date) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("es-ES", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Get status color
	const getStatusColor = (status?: string) => {
		switch (status) {
			case "active":
				return "success";
			case "unsubscribed":
				return "error";
			case "bounced":
				return "warning";
			case "complained":
				return "error";
			default:
				return "default";
		}
	};

	// Get status label
	const getStatusLabel = (status?: string) => {
		switch (status) {
			case "active":
				return "Activo";
			case "unsubscribed":
				return "Cancelado";
			case "bounced":
				return "Rebotado";
			case "complained":
				return "Se ha quejado";
			default:
				return status || "Desconocido";
		}
	};

	return (
		<>
			<Dialog
				open={open}
				onClose={onClose}
				maxWidth="md"
				fullWidth
				sx={{
					"& .MuiDialog-paper": {
						borderRadius: 2,
					},
				}}
			>
				<DialogTitle>
					<Grid container alignItems="center" justifyContent="space-between">
						<Grid item>
							<Typography variant="h5">Detalles del Contacto</Typography>
						</Grid>
					</Grid>
				</DialogTitle>

				<DialogContent dividers>
					{loading ? (
						<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 3 }}>
							<CircularProgress />
						</Box>
					) : error ? (
						<Alert severity="error" sx={{ my: 2 }}>
							{error}
						</Alert>
					) : contact ? (
						<Grid container spacing={3}>
							{/* Información básica */}
							<Grid item xs={12}>
								<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
									Información Básica
								</Typography>
								<Divider sx={{ mb: 2 }} />

								<Grid container spacing={2}>
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="textSecondary">
											Email
										</Typography>
										<Typography variant="body1">{contact.email}</Typography>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="textSecondary">
											Estado
										</Typography>
										<Chip label={getStatusLabel(contact.status)} color={getStatusColor(contact.status) as any} size="small" />
									</Grid>
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="textSecondary">
											Nombre
										</Typography>
										<Typography variant="body1">{contact.firstName || "-"}</Typography>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="textSecondary">
											Apellido
										</Typography>
										<Typography variant="body1">{contact.lastName || "-"}</Typography>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="textSecondary">
											Teléfono
										</Typography>
										<Typography variant="body1">{contact.phone || "-"}</Typography>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="textSecondary">
											Empresa
										</Typography>
										<Typography variant="body1">{contact.company || "-"}</Typography>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="textSecondary">
											Cargo
										</Typography>
										<Typography variant="body1">{contact.position || "-"}</Typography>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="textSecondary">
											Fuente
										</Typography>
										<Typography variant="body1">{contact.source || "-"}</Typography>
									</Grid>
								</Grid>
							</Grid>

							{/* Campos personalizados */}
							{contact.customFields && Object.keys(contact.customFields).length > 0 && (
								<Grid item xs={12}>
									<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
										Campos Personalizados
									</Typography>
									<Divider sx={{ mb: 2 }} />

									<Grid container spacing={2}>
										{Object.entries(contact.customFields).map(([key, value]) => (
											<Grid item xs={12} sm={6} key={key}>
												<Typography variant="body2" color="textSecondary">
													{key}
												</Typography>
												<Typography variant="body1">{value?.toString() || "-"}</Typography>
											</Grid>
										))}
									</Grid>
								</Grid>
							)}

							{/* Información de campañas */}
							<Grid item xs={12}>
								<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
									Campañas
								</Typography>
								<Divider sx={{ mb: 2 }} />

								{/* Tabla de campañas */}
								{contact.campaigns &&
								Array.isArray(contact.campaigns) &&
								contact.campaigns.length > 0 &&
								typeof contact.campaigns[0] === "object" ? (
									<Box sx={{ mb: 3 }}>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>ID Campaña</TableCell>
													<TableCell>Estado</TableCell>
													<TableCell>Paso Actual</TableCell>
													<TableCell>Fecha de Ingreso</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{contact.campaigns.map((campaign: any, index: number) => (
													<TableRow key={index}>
														<TableCell>
															<Button
																color="primary"
																size="small"
																onClick={() => {
																	setSelectedCampaignId(campaign.campaignId);
																	setCampaignModalOpen(true);
																}}
															>
																{campaign.campaignId.substring(0, 8)}...
															</Button>
														</TableCell>
														<TableCell>
															<Chip
																label={campaign.status}
																color={
																	campaign.status === "active"
																		? "success"
																		: campaign.status === "completed"
																		? "info"
																		: campaign.status === "paused"
																		? "warning"
																		: "default"
																}
																size="small"
																variant="outlined"
															/>
														</TableCell>
														<TableCell>{campaign.currentStep !== undefined ? campaign.currentStep : "-"}</TableCell>
														<TableCell>{formatDate(campaign.joinedAt)}</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</Box>
								) : (
									<Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
										No hay campañas disponibles
									</Typography>
								)}

								{contact.metrics && (
									<>
										<Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
											Métricas de Engagement
										</Typography>
										<Grid container spacing={2}>
											<Grid item xs={6} sm={3}>
												<Typography variant="body2" color="textSecondary">
													Enviados
												</Typography>
												<Typography variant="body1">{contact.metrics.sent || 0}</Typography>
											</Grid>
											<Grid item xs={6} sm={3}>
												<Typography variant="body2" color="textSecondary">
													Aperturas
												</Typography>
												<Typography variant="body1">{contact.metrics.opens || 0}</Typography>
											</Grid>
											<Grid item xs={6} sm={3}>
												<Typography variant="body2" color="textSecondary">
													Clics
												</Typography>
												<Typography variant="body1">{contact.metrics.clicks || 0}</Typography>
											</Grid>
											<Grid item xs={6} sm={3}>
												<Typography variant="body2" color="textSecondary">
													Tasa de apertura
												</Typography>
												<Typography variant="body1">{(contact.metrics.openRate || 0) * 100}%</Typography>
											</Grid>
										</Grid>
									</>
								)}
							</Grid>

							{/* Actividad reciente */}
							{contact.activities && contact.activities.length > 0 && (
								<Grid item xs={12}>
									<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
										Actividad Reciente
									</Typography>
									<Divider sx={{ mb: 2 }} />

									<List>
										{contact.activities.slice(0, 5).map((activity: any, index: number) => (
											<ListItem key={index} divider={index !== contact.activities!.length - 1}>
												<ListItemText
													primary={
														<Typography variant="body2">
															{activity.type === "created"
																? "Contacto creado"
																: activity.type === "status_change"
																? `Cambio de estado: ${activity.metadata?.oldStatus || "-"} → ${activity.metadata?.newStatus || "-"}`
																: activity.type}
														</Typography>
													}
													secondary={formatDate(activity.timestamp)}
												/>
											</ListItem>
										))}
									</List>
								</Grid>
							)}

							{/* Etiquetas */}
							<Grid item xs={12}>
								<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
									Etiquetas
								</Typography>
								<Divider sx={{ mb: 2 }} />

								<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
									{contact.tags && contact.tags.length > 0 ? (
										contact.tags.map((tag: any, index: number) => (
											<Chip key={index} label={typeof tag === "string" ? tag : tag.name} size="small" color="primary" variant="outlined" />
										))
									) : (
										<Typography variant="body2" color="textSecondary">
											No hay etiquetas asignadas
										</Typography>
									)}
								</Box>
							</Grid>

							{/* Fechas */}
							<Grid item xs={12}>
								<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
									Fechas
								</Typography>
								<Divider sx={{ mb: 2 }} />

								<Grid container spacing={2}>
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="textSecondary">
											Creado
										</Typography>
										<Typography variant="body1">{formatDate(contact.createdAt)}</Typography>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="textSecondary">
											Última actualización
										</Typography>
										<Typography variant="body1">{formatDate(contact.updatedAt)}</Typography>
									</Grid>
									{contact.lastActivity && (
										<Grid item xs={12} sm={6}>
											<Typography variant="body2" color="textSecondary">
												Última actividad
											</Typography>
											<Typography variant="body1">{formatDate(contact.lastActivity)}</Typography>
										</Grid>
									)}
								</Grid>
							</Grid>
						</Grid>
					) : (
						<Typography variant="body1" color="textSecondary" align="center" sx={{ py: 3 }}>
							No se ha seleccionado ningún contacto
						</Typography>
					)}
				</DialogContent>

				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={onClose} color="primary" variant="outlined">
						Cerrar
					</Button>
				</DialogActions>
			</Dialog>

			{/* Modal de detalles de campaña */}
			<CampaignDetailModal open={campaignModalOpen} onClose={() => setCampaignModalOpen(false)} campaignId={selectedCampaignId} />
		</>
	);
};

export default ContactDetailModal;
