import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	IconButton,
	Box,
	CircularProgress,
	Typography,
	Button,
	Stack,
	LinearProgress,
	Fade,
	Tooltip,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { Add, ArrowLeft2, ArrowRight2, DocumentText, Warning2, Maximize4 } from "iconsax-react";
import { Movement } from "types/movements";
import usePdfBlobLoader from "hooks/usePdfBlobLoader";

interface PDFViewerProps {
	open: boolean;
	onClose: () => void;
	url: string;
	title?: string;
	// Props para navegación
	movements?: Movement[];
	currentMovementId?: string;
	onNavigate?: (movement: Movement) => void;
	onRequestNextPage?: () => void;
	onRequestPreviousPage?: () => void;
	hasNextPage?: boolean;
	hasPreviousPage?: boolean;
	isLoadingMore?: boolean;
	// Props para numeración correcta
	totalWithLinks?: number;
	documentsBeforeThisPage?: number;
	documentsInThisPage?: number;
	// Props para explorador de documentos
	onOpenExplorer?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
	open,
	onClose,
	url,
	title,
	movements = [],
	currentMovementId,
	onNavigate,
	onRequestNextPage,
	onRequestPreviousPage,
	hasNextPage = false,
	hasPreviousPage = false,
	isLoadingMore = false,
	totalWithLinks = 0,
	documentsBeforeThisPage = 0,
	documentsInThisPage = 0,
	onOpenExplorer,
}) => {
	const theme = useTheme();
	const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
	const { blobUrl, loading, error, loadProgress, showProgress, handleIframeLoad, handleIframeError } = usePdfBlobLoader({
		url,
		enabled: open,
	});

	// Calcular índices y navegación
	const movementsWithLinks = React.useMemo(() => movements.filter((m) => m.link), [movements]);

	const currentIndex = React.useMemo(() => {
		// Primero buscar por URL ya que es la fuente de verdad actual
		if (url) {
			const indexByUrl = movementsWithLinks.findIndex((m) => m.link === url);
			if (indexByUrl !== -1) {
				return indexByUrl;
			}
		}
		// Si no encuentra por URL, buscar por ID
		if (currentMovementId) {
			const indexById = movementsWithLinks.findIndex((m) => m._id === currentMovementId);
			if (indexById !== -1) {
				return indexById;
			}
		}
		return 0;
	}, [movementsWithLinks, currentMovementId, url]);

	// Calcular la posición global del documento
	const globalPosition = React.useMemo(() => {
		if (currentIndex >= 0 && documentsBeforeThisPage >= 0) {
			return documentsBeforeThisPage + currentIndex + 1;
		}
		return 0;
	}, [currentIndex, documentsBeforeThisPage]);

	// Determinar si podemos navegar
	const hasPrevious = currentIndex > 0 || documentsBeforeThisPage > 0;
	const hasNext = currentIndex < movementsWithLinks.length - 1 || hasNextPage;

	const handlePrevious = () => {
		if (currentIndex > 0 && onNavigate) {
			onNavigate(movementsWithLinks[currentIndex - 1]);
		} else if (currentIndex === 0 && documentsBeforeThisPage > 0 && onRequestPreviousPage) {
			onRequestPreviousPage();
		}
	};

	const handleNext = () => {
		if (currentIndex < movementsWithLinks.length - 1 && onNavigate) {
			onNavigate(movementsWithLinks[currentIndex + 1]);
		} else if (hasNextPage && currentIndex === movementsWithLinks.length - 1 && onRequestNextPage) {
			onRequestNextPage();
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: "90vh" } }}>
			<DialogTitle sx={{ pb: movements.length > 0 ? 1 : 2 }}>
				<Box display="flex" justifyContent="space-between" alignItems="center">
					<Typography variant="h6">{title || "Visualizar Documento"}</Typography>
					<Stack direction="row" spacing={0.5} alignItems="center">
						{onOpenExplorer && isDesktop && (
							<Tooltip title="Abrir en explorador">
								<IconButton
									onClick={onOpenExplorer}
									size="small"
									sx={{
										color: "primary.main",
										"&:hover": {
											backgroundColor: "primary.lighter",
										},
									}}
								>
									<Maximize4 size={20} />
								</IconButton>
							</Tooltip>
						)}
						<IconButton
							onClick={onClose}
							size="small"
							sx={{
								color: "text.secondary",
								"&:hover": {
									backgroundColor: "action.hover",
								},
							}}
						>
							<Add size={20} style={{ transform: "rotate(45deg)" }} />
						</IconButton>
					</Stack>
				</Box>
				{/* Barra de navegación */}
				{movements.length > 0 && (
					<Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mt: 2 }}>
						<Button
							size="small"
							startIcon={isLoadingMore && currentIndex === 0 ? <CircularProgress size={14} /> : <ArrowLeft2 size={16} />}
							onClick={handlePrevious}
							disabled={!hasPrevious || loading || isLoadingMore}
							variant="outlined"
							sx={{
								minWidth: 100,
								transition: "all 0.2s ease",
							}}
						>
							{isLoadingMore && currentIndex === 0 ? "Cargando..." : "Anterior"}
						</Button>

						<Typography variant="body2" color="text.secondary" sx={{ minWidth: 150, textAlign: "center" }}>
							{isLoadingMore ? (
								"Cargando..."
							) : globalPosition > 0 && totalWithLinks > 0 ? (
								<>
									Documento {globalPosition} de {totalWithLinks}
								</>
							) : currentIndex >= 0 ? (
								<>
									Documento {currentIndex + 1} de {movementsWithLinks.length}
									{hasNextPage && "+"}
								</>
							) : movementsWithLinks.length === 0 ? (
								"Sin documentos"
							) : (
								"Selecciona un documento"
							)}
						</Typography>

						<Button
							size="small"
							endIcon={isLoadingMore ? <CircularProgress size={14} /> : <ArrowRight2 size={16} />}
							onClick={handleNext}
							disabled={!hasNext || loading || isLoadingMore}
							variant="outlined"
							sx={{
								minWidth: 100,
								transition: "all 0.2s ease",
							}}
						>
							{isLoadingMore ? "Cargando..." : "Siguiente"}
						</Button>
					</Stack>
				)}
			</DialogTitle>
			<DialogContent dividers sx={{ p: 0, position: "relative", height: "calc(100% - 64px)" }}>
				{/* Barra de progreso superior */}
				<Fade in={showProgress} unmountOnExit>
					<LinearProgress
						variant="determinate"
						value={loadProgress}
						sx={{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							zIndex: 2,
							height: 3,
						}}
					/>
				</Fade>
				{loading && (
					<Box
						display="flex"
						flexDirection="column"
						justifyContent="center"
						alignItems="center"
						height="100%"
						position="absolute"
						top={0}
						left={0}
						right={0}
						bottom={0}
						bgcolor="background.paper"
						zIndex={1}
						gap={2}
					>
						<CircularProgress />
						<Typography variant="body2" color="text.secondary">
							Cargando documento... {loadProgress}%
						</Typography>
					</Box>
				)}
				{error && (
					<Box
						display="flex"
						justifyContent="center"
						alignItems="center"
						height="100%"
						flexDirection="column"
						gap={2}
						sx={{ px: 3, textAlign: "center" }}
					>
						<Box
							sx={{
								width: 80,
								height: 80,
								borderRadius: "50%",
								backgroundColor: "error.lighter",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Warning2 size={40} color="var(--mui-palette-error-main)" variant="Bold" />
						</Box>
						<Typography variant="h4" color="error.main" fontWeight={600}>
							Documento no disponible
						</Typography>
						<Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
							No se pudo acceder al documento en este momento.
						</Typography>
						<Button variant="outlined" color="inherit" onClick={onClose} sx={{ mt: 1 }}>
							Cerrar
						</Button>
					</Box>
				)}
				{!error && !blobUrl && !loading && (
					<Box
						display="flex"
						justifyContent="center"
						alignItems="center"
						height="100%"
						flexDirection="column"
						gap={2}
						sx={{ px: 3, textAlign: "center" }}
					>
						<Box
							sx={{
								width: 80,
								height: 80,
								borderRadius: "50%",
								backgroundColor: "grey.100",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<DocumentText size={40} color="var(--mui-palette-text-secondary)" variant="Bulk" />
						</Box>
						<Typography variant="h4" color="text.secondary" fontWeight={600}>
							Sin documento
						</Typography>
						<Typography variant="body1" color="text.secondary">
							Este movimiento no tiene un documento asociado.
						</Typography>
					</Box>
				)}
				{!error && blobUrl && (
					<iframe
						key={blobUrl}
						src={blobUrl}
						width="100%"
						height="100%"
						style={{ border: "none" }}
						title={title || "PDF Document"}
						onLoad={handleIframeLoad}
						onError={handleIframeError}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default PDFViewer;
