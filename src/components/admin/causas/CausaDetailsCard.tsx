import React, { useState, useEffect } from "react";
import {
	Box,
	Card,
	CardContent,
	Typography,
	CircularProgress,
	Alert,
	Chip,
	Divider,
	List,
	ListItem,
	Stack,
	IconButton,
	Collapse,
	Pagination,
} from "@mui/material";
import { CloseCircle } from "iconsax-react";
import causasService from "services/causasService";
import { VerifiedCausa, Movimiento, CausaDetails, PaginationInfo } from "types/causas";

interface CausaDetailsCardProps {
	causa: VerifiedCausa;
	open: boolean;
	onClose: () => void;
}

const CausaDetailsCard: React.FC<CausaDetailsCardProps> = ({ causa, open, onClose }) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
	const [causaDetails, setCausaDetails] = useState<CausaDetails | null>(null);
	const [pagination, setPagination] = useState<PaginationInfo | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [message, setMessage] = useState<string>("");

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
			<Card sx={{ mt: 2, boxShadow: 3 }}>
				<CardContent>
					<Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
						<Box>
							<Typography variant="h5" component="h2" gutterBottom>
								Detalles de la Causa
							</Typography>
							<Typography variant="subtitle1" color="text.secondary">
								{causa.caratula}
							</Typography>
						</Box>
						<IconButton onClick={onClose} size="small">
							<CloseCircle />
						</IconButton>
					</Box>

					<Divider sx={{ my: 2 }} />

					{/* Información básica */}
					<Box mb={3}>
						<Typography variant="h6" gutterBottom>
							Información General
						</Typography>
						<Stack spacing={1}>
							<Box display="flex" gap={1}>
								<Typography variant="body2" fontWeight="bold">
									Número:
								</Typography>
								<Typography variant="body2">
									{causa.number}/{causa.year}
								</Typography>
							</Box>
							<Box display="flex" gap={1}>
								<Typography variant="body2" fontWeight="bold">
									Fuero:
								</Typography>
								<Chip
									label={causa.fuero === "CNT" ? "Trabajo" : causa.fuero === "CSS" ? "Seguridad Social" : "Civil"}
									size="small"
									color={causa.fuero === "CNT" ? "primary" : causa.fuero === "CSS" ? "info" : "secondary"}
								/>
							</Box>
							<Box display="flex" gap={1}>
								<Typography variant="body2" fontWeight="bold">
									Juzgado/Secretaría:
								</Typography>
								<Typography variant="body2">
									Juzgado {causa.juzgado} - Secretaría {causa.secretaria}
								</Typography>
							</Box>
							<Box display="flex" gap={1}>
								<Typography variant="body2" fontWeight="bold">
									Objeto:
								</Typography>
								<Typography variant="body2">{causa.objeto}</Typography>
							</Box>
							<Box display="flex" gap={1}>
								<Typography variant="body2" fontWeight="bold">
									Total de movimientos:
								</Typography>
								<Typography variant="body2">{causaDetails?.movimientosCount || causa.movimientosCount}</Typography>
							</Box>
						</Stack>
					</Box>

					<Divider sx={{ my: 2 }} />

					{/* Movimientos */}
					<Box>
						<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
							<Typography variant="h6">Movimientos</Typography>
							{message && (
								<Typography variant="body2" color="text.secondary">
									{message}
								</Typography>
							)}
						</Box>

						{loading && (
							<Box display="flex" justifyContent="center" py={3}>
								<CircularProgress />
							</Box>
						)}

						{error && (
							<Alert severity="error" sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}

						{!loading && !error && movimientos && movimientos.length === 0 && (
							<Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
								No hay movimientos disponibles
							</Typography>
						)}

						{!loading && !error && movimientos && movimientos.length > 0 && (
							<List sx={{ maxHeight: 400, overflow: "auto" }}>
								{movimientos.map((movimiento, index) => (
									<ListItem
										key={index}
										sx={{
											borderBottom: index < movimientos.length - 1 ? 1 : 0,
											borderColor: "divider",
											flexDirection: "column",
											alignItems: "flex-start",
										}}
									>
										<Box width="100%">
											<Box display="flex" justifyContent="space-between" alignItems="center">
												<Typography variant="subtitle2" fontWeight="bold">
													{formatDate(movimiento.fecha)}
												</Typography>
												{movimiento.tipo && <Chip label={movimiento.tipo} size="small" variant="outlined" />}
											</Box>
											<Typography variant="body2" sx={{ mt: 0.5 }}>
												{movimiento.descripcion}
											</Typography>
											{movimiento.observacion && (
												<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
													Observación: {movimiento.observacion}
												</Typography>
											)}
										</Box>
									</ListItem>
								))}
							</List>
						)}

						{pagination && pagination.totalPages > 1 && (
							<Box display="flex" justifyContent="center" mt={3}>
								<Pagination
									count={pagination.totalPages}
									page={currentPage}
									onChange={handlePageChange}
									color="primary"
									disabled={loading}
									showFirstButton
									showLastButton
								/>
							</Box>
						)}
					</Box>
				</CardContent>
			</Card>
		</Collapse>
	);
};

export default CausaDetailsCard;
