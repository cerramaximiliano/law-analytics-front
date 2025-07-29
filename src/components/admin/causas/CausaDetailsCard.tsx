import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	CircularProgress,
	Alert,
	Chip,
	Divider,
	Collapse,
	Pagination,
	Grid,
	Link,
	IconButton,
	Tooltip,
} from "@mui/material";
import { Calendar, DocumentText, Folder2, People, Eye } from "iconsax-react";
import causasService from "services/causasService";
import { VerifiedCausa, Movimiento, CausaDetails, PaginationInfo } from "types/causas";
import PDFViewer from "components/shared/PDFViewer";

interface CausaDetailsCardProps {
	causa: VerifiedCausa;
	open: boolean;
	onClose: () => void;
}

const CausaDetailsCard: React.FC<CausaDetailsCardProps> = ({ causa, open }) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
	const [causaDetails, setCausaDetails] = useState<CausaDetails | null>(null);
	const [pagination, setPagination] = useState<PaginationInfo | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [message, setMessage] = useState<string>("");
	const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
	const [selectedPdfUrl, setSelectedPdfUrl] = useState<string>("");
	const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>("");

	useEffect(() => {
		if (open && causa && causa._id) {
			setCurrentPage(1);
			fetchMovimientos(1);
		}
	}, [open, causa?._id]);

	const fetchMovimientos = async (page: number = 1) => {
		setLoading(true);
		setError(null);
		try {
			const response = await causasService.getMovimientosByCausaId(causa.fuero, causa._id, page, 20);

			if (response.success) {
				setMovimientos(response.data);
				setCausaDetails(response.causa);
				setPagination(response.pagination);
				setMessage(response.message);
				setCurrentPage(page);
			} else {
				setMovimientos([]);
				setError("No se pudieron cargar los movimientos");
			}
		} catch (err: any) {
			setError(err.response?.data?.message || "Error al cargar los movimientos");
		} finally {
			setLoading(false);
		}
	};

	const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
		fetchMovimientos(value);
	};

	const handleViewPdf = (url: string, title: string) => {
		setSelectedPdfUrl(url);
		setSelectedPdfTitle(title);
		setPdfViewerOpen(true);
	};

	const handleClosePdfViewer = () => {
		setPdfViewerOpen(false);
		setSelectedPdfUrl("");
		setSelectedPdfTitle("");
	};

	const formatDate = (dateString: string) => {
		if (!dateString) return "-";
		const date = new Date(dateString);
		return date.toLocaleDateString("es-AR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	return (
		<Collapse in={open} timeout="auto" unmountOnExit>
			<Box sx={{ py: 2, px: 1 }}>
				{/* Compact header with key information */}
				<Grid container spacing={2} sx={{ mb: 2 }}>
					<Grid item xs={12} md={3}>
						<Box display="flex" alignItems="center" gap={1}>
							<DocumentText size={16} />
							<Box>
								<Typography variant="caption" color="text.secondary">
									Expediente
								</Typography>
								<Typography variant="body2" fontWeight="medium">
									{causa.number}/{causa.year}
								</Typography>
							</Box>
						</Box>
					</Grid>
					<Grid item xs={12} md={3}>
						<Box display="flex" alignItems="center" gap={1}>
							<Calendar size={16} />
							<Box>
								<Typography variant="caption" color="text.secondary">
									Última actualización
								</Typography>
								<Typography variant="body2" fontWeight="medium">
									{new Date(causa.lastUpdate).toLocaleDateString("es-AR")}
								</Typography>
							</Box>
						</Box>
					</Grid>
					{causaDetails && (
						<>
							<Grid item xs={12} md={3}>
								<Box display="flex" alignItems="center" gap={1}>
									<Folder2 size={16} />
									<Box>
										<Typography variant="caption" color="text.secondary">
											Carpetas asociadas
										</Typography>
										<Typography variant="body2" fontWeight="medium">
											{causaDetails.folderIds.length}
										</Typography>
									</Box>
								</Box>
							</Grid>
							<Grid item xs={12} md={3}>
								<Box display="flex" alignItems="center" gap={1}>
									<People size={16} />
									<Box>
										<Typography variant="caption" color="text.secondary">
											Usuarios vinculados
										</Typography>
										<Typography variant="body2" fontWeight="medium">
											{causaDetails.userCausaIds.length}
										</Typography>
									</Box>
								</Box>
							</Grid>
						</>
					)}
				</Grid>

				<Divider sx={{ mb: 2 }} />

				{/* Movimientos section */}
				<Box>
					<Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
						<Typography variant="subtitle2" fontWeight="bold">
							Movimientos
						</Typography>
						{message && (
							<Typography variant="caption" color="text.secondary">
								{message}
							</Typography>
						)}
					</Box>

					{loading && (
						<Box display="flex" justifyContent="center" py={2}>
							<CircularProgress size={24} />
						</Box>
					)}

					{error && (
						<Alert severity="error" sx={{ mb: 1 }} variant="outlined">
							{error}
						</Alert>
					)}

					{!loading && !error && movimientos && movimientos.length === 0 && (
						<Typography variant="caption" color="text.secondary" sx={{ py: 1, display: "block", textAlign: "center" }}>
							No hay movimientos disponibles
						</Typography>
					)}

					{!loading && !error && movimientos && movimientos.length > 0 && (
						<Box sx={{ maxHeight: 400, overflow: "auto", pr: 1 }}>
							{movimientos.map((movimiento, index) => (
								<Box
									key={index}
									sx={{
										py: 2,
										px: 2,
										borderBottom: index < movimientos.length - 1 ? 1 : 0,
										borderColor: "divider",
										"&:hover": {
											bgcolor: "action.hover",
											borderRadius: 1,
										},
									}}
								>
									<Grid container spacing={2}>
										<Grid item xs={12} sm={2}>
											<Typography variant="caption" color="text.secondary">
												Fecha
											</Typography>
											<Typography variant="body2" fontWeight="medium">
												{formatDate(movimiento.fecha)}
											</Typography>
										</Grid>
										<Grid item xs={12} sm={2}>
											<Typography variant="caption" color="text.secondary">
												Tipo
											</Typography>
											<Box>
												{movimiento.tipo ? (
													<Chip label={movimiento.tipo} size="small" sx={{ height: 22, fontSize: "0.75rem" }} />
												) : (
													<Typography variant="body2">-</Typography>
												)}
											</Box>
										</Grid>
										<Grid item xs={12} sm={6}>
											<Typography variant="caption" color="text.secondary">
												Detalle
											</Typography>
											<Typography variant="body2">{movimiento.detalle || movimiento.descripcion || "-"}</Typography>
											{movimiento.observacion && (
												<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
													{movimiento.observacion}
												</Typography>
											)}
										</Grid>
										<Grid item xs={12} sm={2}>
											<Typography variant="caption" color="text.secondary">
												Documento
											</Typography>
											<Box>
												{movimiento.url ? (
													<Box display="flex" alignItems="center" gap={1}>
														<Link
															href="#"
															variant="body2"
															underline="hover"
															onClick={(e) => {
																e.preventDefault();
																handleViewPdf(movimiento.url!, `Movimiento - ${formatDate(movimiento.fecha)}`);
															}}
															sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
														>
															Ver PDF
														</Link>
														<Tooltip title="Visualizar documento">
															<IconButton
																size="small"
																color="primary"
																onClick={() => handleViewPdf(movimiento.url!, `Movimiento - ${formatDate(movimiento.fecha)}`)}
															>
																<Eye size={16} />
															</IconButton>
														</Tooltip>
													</Box>
												) : (
													<Typography variant="body2">-</Typography>
												)}
											</Box>
										</Grid>
									</Grid>
								</Box>
							))}
						</Box>
					)}

					{pagination && pagination.totalPages > 1 && (
						<Box display="flex" justifyContent="center" mt={2}>
							<Pagination
								count={pagination.totalPages}
								page={currentPage}
								onChange={handlePageChange}
								color="primary"
								size="small"
								disabled={loading}
								showFirstButton
								showLastButton
							/>
						</Box>
					)}
				</Box>

				{/* PDF Viewer Dialog */}
				<PDFViewer open={pdfViewerOpen} onClose={handleClosePdfViewer} url={selectedPdfUrl} title={selectedPdfTitle} />
			</Box>
		</Collapse>
	);
};

export default CausaDetailsCard;
