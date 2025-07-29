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
} from "@mui/material";
import { Add, ArrowLeft2, ArrowRight2 } from "iconsax-react";
import { Movement } from "types/movements";

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
}) => {
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState(false);
	const [loadProgress, setLoadProgress] = React.useState(0);
	const [showProgress, setShowProgress] = React.useState(false);

	// Calcular índices y navegación
	const movementsWithLinks = React.useMemo(() => movements.filter((m) => m.link), [movements]);

	const currentIndex = React.useMemo(() => {
		const index = movementsWithLinks.findIndex((m) => m._id === currentMovementId);
		// Si no encuentra el movimiento actual, buscar por URL
		if (index === -1 && url) {
			return movementsWithLinks.findIndex((m) => m.link === url);
		}
		return index;
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
			// Navegar dentro de la página actual
			setLoading(true);
			setError(false);
			onNavigate(movementsWithLinks[currentIndex - 1]);
		} else if (currentIndex === 0 && documentsBeforeThisPage > 0 && onRequestPreviousPage) {
			// Solicitar la página anterior
			onRequestPreviousPage();
		}
	};

	const handleNext = () => {
		if (currentIndex < movementsWithLinks.length - 1 && onNavigate) {
			setLoading(true);
			setError(false);
			onNavigate(movementsWithLinks[currentIndex + 1]);
		} else if (hasNextPage && currentIndex === movementsWithLinks.length - 1 && onRequestNextPage) {
			// Solicitar siguiente página cuando llegamos al último
			onRequestNextPage();
		}
	};

	const handleLoad = () => {
		setLoading(false);
		setError(false);
		setShowProgress(false);
		setLoadProgress(100);
	};

	const handleError = () => {
		setLoading(false);
		setError(true);
		setShowProgress(false);
		setLoadProgress(0);
	};

	React.useEffect(() => {
		if (open && url) {
			setLoading(true);
			setError(false);
			setLoadProgress(0);
			setShowProgress(true);

			// Simulación de progreso de carga
			const progressInterval = setInterval(() => {
				setLoadProgress((prev) => {
					if (prev >= 90) {
						clearInterval(progressInterval);
						return 90;
					}
					return prev + 10;
				});
			}, 200);

			return () => clearInterval(progressInterval);
		}
	}, [open, url]);

	return (
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: "90vh" } }}>
			<DialogTitle sx={{ pb: movements.length > 0 ? 1 : 2 }}>
				<Box display="flex" justifyContent="space-between" alignItems="center">
					<Typography variant="h6">{title || "Visualizar Documento"}</Typography>
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
					<Box display="flex" justifyContent="center" alignItems="center" height="100%" flexDirection="column" gap={2}>
						<Typography color="error">Error al cargar el documento</Typography>
						<Typography variant="body2" color="text.secondary">
							Verifique que la URL sea válida y que el documento esté disponible
						</Typography>
					</Box>
				)}
				{!error && !url && (
					<Box display="flex" justifyContent="center" alignItems="center" height="100%" flexDirection="column" gap={2}>
						<Typography color="text.secondary">No hay documento disponible</Typography>
					</Box>
				)}
				{!error && url && (
					<iframe
						key={url} // Forzar recreación del iframe cuando cambia la URL
						src={url}
						width="100%"
						height="100%"
						style={{ border: "none" }}
						title={title || "PDF Document"}
						onLoad={handleLoad}
						onError={handleError}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default PDFViewer;
