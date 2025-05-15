import { useState, useEffect } from "react";

// material-ui
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	IconButton,
	Modal,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Typography,
	useTheme,
	Grid,
} from "@mui/material";

// project imports
import { Add, Edit2, Eye, Trash } from "iconsax-react";
import { useSnackbar } from "notistack";

// types
import { Campaign } from "types/campaign";
import { CampaignEmail, EmailStatus } from "types/campaign-email";
import { CampaignEmailService } from "store/reducers/campaign";
import CampaignEmailModal from "./CampaignEmailModal";

interface CampaignEmailListProps {
	campaign: Campaign;
	open: boolean;
	onClose: () => void;
}

const CampaignEmailList = ({ campaign, open, onClose }: CampaignEmailListProps) => {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();

	// State for emails data
	const [emails, setEmails] = useState<CampaignEmail[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [totalCount, setTotalCount] = useState(0);

	// State for modals
	const [selectedEmail, setSelectedEmail] = useState<CampaignEmail | null>(null);
	const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
	const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

	// State for pagination
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);

	// Fetch campaign emails
	useEffect(() => {
		if (open && campaign._id) {
			fetchCampaignEmails();
		}
	}, [open, campaign._id, page, rowsPerPage]);

	// Function to fetch campaign emails
	const fetchCampaignEmails = async () => {
		if (!campaign._id) return;

		try {
			setLoading(true);
			setError(null);

			const response = await CampaignEmailService.getEmailsByCampaignId(campaign._id);
			setEmails(response.data || []);
			setTotalCount(response.total || response.data.length || 0);
		} catch (err: any) {
			console.error("Error fetching campaign emails:", err);
			setError(err.message || "Error al cargar los emails de la campaña");
		} finally {
			setLoading(false);
		}
	};

	// Pagination handlers
	const handleChangePage = (event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	// Modal handlers
	const handleOpenCreateModal = () => {
		setCreateModalOpen(true);
	};

	const handleCloseCreateModal = () => {
		setCreateModalOpen(false);
	};

	const handleOpenEditModal = (email: CampaignEmail) => {
		setSelectedEmail(email);
		setEditModalOpen(true);
	};

	const handleCloseEditModal = () => {
		setEditModalOpen(false);
		setSelectedEmail(null);
	};

	const handleOpenDeleteDialog = (email: CampaignEmail) => {
		setSelectedEmail(email);
		setDeleteDialogOpen(true);
	};

	const handleCloseDeleteDialog = () => {
		setDeleteDialogOpen(false);
		setSelectedEmail(null);
	};

	// Success handlers
	const handleEmailCreated = () => {
		setCreateModalOpen(false);
		fetchCampaignEmails();
		enqueueSnackbar("Email creado con éxito", { variant: "success" });
	};

	const handleEmailUpdated = () => {
		setEditModalOpen(false);
		setSelectedEmail(null);
		fetchCampaignEmails();
		enqueueSnackbar("Email actualizado con éxito", { variant: "success" });
	};

	const handleEmailDeleted = async () => {
		if (!selectedEmail || !selectedEmail._id) return;

		try {
			await CampaignEmailService.deleteEmail(selectedEmail._id);
			setDeleteDialogOpen(false);
			setSelectedEmail(null);
			fetchCampaignEmails();
			enqueueSnackbar("Email eliminado con éxito", { variant: "success" });
		} catch (err: any) {
			console.error(`Error deleting email ${selectedEmail._id}:`, err);
			enqueueSnackbar(err.message || "Error al eliminar el email", { variant: "error" });
		}
	};

	// Status chip color mapping
	const getStatusColor = (status: EmailStatus) => {
		switch (status) {
			case "draft":
				return { color: "default", label: "Borrador" };
			case "active":
				return { color: "success", label: "Activo" };
			case "paused":
				return { color: "warning", label: "Pausado" };
			case "completed":
				return { color: "info", label: "Completado" };
			default:
				return { color: "default", label: status };
		}
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			aria-labelledby="emails-modal-title"
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Paper
				sx={{
					width: "90%",
					maxWidth: 1200,
					maxHeight: "90vh",
					overflow: "auto",
					p: 3,
					borderRadius: 2,
				}}
			>
				<Box sx={{ mb: 2 }}>
					<Grid container alignItems="center" justifyContent="space-between">
						<Grid item>
							<Typography variant="h4" id="emails-modal-title">
								Emails de la Campaña: {campaign.name}
							</Typography>
							<Typography variant="caption" color="textSecondary">
								{campaign.description || ""}
							</Typography>
						</Grid>
						<Grid item>
							<Button
								variant="contained"
								color="primary"
								startIcon={<Add />}
								onClick={handleOpenCreateModal}
								sx={{ textTransform: "none" }}
							>
								Nuevo Email
							</Button>
						</Grid>
					</Grid>
				</Box>

				<Divider sx={{ mb: 2 }} />

				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
						<CircularProgress />
					</Box>
				) : error ? (
					<Typography color="error" sx={{ p: 2 }}>
						{error}
					</Typography>
				) : (
					<>
						<TableContainer component={Paper} sx={{ boxShadow: "none" }}>
							<Table sx={{ minWidth: 650 }} aria-label="emails table">
								<TableHead>
									<TableRow>
										<TableCell>Nombre</TableCell>
										<TableCell>Asunto</TableCell>
										<TableCell>Secuencia</TableCell>
										<TableCell>Retraso</TableCell>
										<TableCell>Estado</TableCell>
										<TableCell>Tasa de apertura</TableCell>
										<TableCell align="center">Acciones</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{emails.length === 0 ? (
										<TableRow>
											<TableCell colSpan={7} align="center" sx={{ py: 3 }}>
												<Typography variant="subtitle1">No hay emails en esta campaña</Typography>
												<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
													Crea un nuevo email para esta campaña
												</Typography>
												<Button variant="outlined" color="primary" startIcon={<Add />} onClick={handleOpenCreateModal} sx={{ mt: 2 }}>
													Nuevo Email
												</Button>
											</TableCell>
										</TableRow>
									) : (
										emails.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((email) => {
											const statusInfo = getStatusColor(email.status || "draft");
											const openRate =
												email.metrics?.opens && email.metrics?.sent ? ((email.metrics.opens / email.metrics.sent) * 100).toFixed(1) : "0";

											return (
												<TableRow hover key={email._id} tabIndex={-1}>
													<TableCell>
														<Typography variant="subtitle2">{email.name}</Typography>
														{email.templateId && (
															<Typography variant="caption" color="primary">
																Usa plantilla
															</Typography>
														)}
													</TableCell>
													<TableCell>{email.subject}</TableCell>
													<TableCell>{email.sequenceIndex}</TableCell>
													<TableCell>
														{email.conditions?.timeDelay
															? `${email.conditions.timeDelay.value} ${email.conditions.timeDelay.unit}`
															: "Inmediato"}
													</TableCell>
													<TableCell>
														<Chip label={statusInfo.label} color={statusInfo.color as any} size="small" />
														{email.isFinal && <Chip label="Final" color="secondary" size="small" sx={{ ml: 1 }} />}
													</TableCell>
													<TableCell>{`${openRate}%`}</TableCell>
													<TableCell align="center">
														<Stack direction="row" spacing={1} justifyContent="center">
															<IconButton
																aria-label="ver"
																size="small"
																color="info"
																onClick={() => handleOpenEditModal(email)}
																title="Ver detalles del email"
															>
																<Eye size={18} />
															</IconButton>
															<IconButton
																aria-label="editar"
																size="small"
																color="primary"
																onClick={() => handleOpenEditModal(email)}
																title="Editar email"
															>
																<Edit2 size={18} />
															</IconButton>
															<IconButton
																aria-label="eliminar"
																size="small"
																color="error"
																onClick={() => handleOpenDeleteDialog(email)}
																title="Eliminar email"
															>
																<Trash size={18} />
															</IconButton>
														</Stack>
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</TableContainer>

						<TablePagination
							component="div"
							count={totalCount}
							rowsPerPage={rowsPerPage}
							page={page}
							onPageChange={handleChangePage}
							onRowsPerPageChange={handleChangeRowsPerPage}
							rowsPerPageOptions={[5, 10, 25]}
							labelRowsPerPage="Filas por página:"
							labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
						/>
					</>
				)}

				{/* Stats */}
				{emails.length > 0 && (
					<Box sx={{ mt: 3 }}>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={4}>
								<Paper sx={{ p: 2, bgcolor: theme.palette.grey[100] }}>
									<Typography variant="subtitle2">Total de emails</Typography>
									<Typography variant="h4">{emails.length}</Typography>
								</Paper>
							</Grid>
							<Grid item xs={12} sm={4}>
								<Paper sx={{ p: 2, bgcolor: theme.palette.grey[100] }}>
									<Typography variant="subtitle2">Tasa de apertura promedio</Typography>
									<Typography variant="h4">
										{emails.some((e) => e.metrics?.opens && e.metrics?.sent)
											? (
													emails.reduce((acc, email) => {
														const rate = email.metrics?.opens && email.metrics?.sent ? (email.metrics.opens / email.metrics.sent) * 100 : 0;
														return acc + rate;
													}, 0) / emails.length
											  ).toFixed(1) + "%"
											: "0%"}
									</Typography>
								</Paper>
							</Grid>
							<Grid item xs={12} sm={4}>
								<Paper sx={{ p: 2, bgcolor: theme.palette.grey[100] }}>
									<Typography variant="subtitle2">Emails enviados</Typography>
									<Typography variant="h4">{emails.reduce((acc, email) => acc + (email.metrics?.sent || 0), 0)}</Typography>
								</Paper>
							</Grid>
						</Grid>
					</Box>
				)}

				<Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
					<Button onClick={onClose} color="inherit">
						Cerrar
					</Button>
				</Box>

				{/* Create/Edit Email Modal */}
				<CampaignEmailModal
					open={createModalOpen}
					onClose={handleCloseCreateModal}
					onSuccess={handleEmailCreated}
					campaign={campaign}
					mode="create"
				/>

				{selectedEmail && (
					<CampaignEmailModal
						open={editModalOpen}
						onClose={handleCloseEditModal}
						onSuccess={handleEmailUpdated}
						campaign={campaign}
						email={selectedEmail}
						mode="edit"
					/>
				)}

				{/* Delete Confirmation Modal */}
				<Modal
					open={deleteDialogOpen}
					onClose={handleCloseDeleteDialog}
					aria-labelledby="delete-modal-title"
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Paper sx={{ width: 400, p: 3, borderRadius: 2 }}>
						<Typography variant="h6" id="delete-modal-title" gutterBottom>
							¿Eliminar email?
						</Typography>
						<Typography variant="body2">
							¿Estás seguro de que deseas eliminar este email de la campaña? Esta acción no se puede deshacer.
						</Typography>
						{selectedEmail && (
							<Box sx={{ mt: 2, mb: 3 }}>
								<Typography variant="subtitle2">{selectedEmail.name}</Typography>
								<Typography variant="body2">Asunto: {selectedEmail.subject}</Typography>
							</Box>
						)}
						<Box sx={{ display: "flex", justifyContent: "flex-end", pt: 2 }}>
							<Button onClick={handleCloseDeleteDialog} color="inherit" sx={{ mr: 1 }}>
								Cancelar
							</Button>
							<Button onClick={handleEmailDeleted} variant="contained" color="error">
								Eliminar
							</Button>
						</Box>
					</Paper>
				</Modal>
			</Paper>
		</Modal>
	);
};

export default CampaignEmailList;
