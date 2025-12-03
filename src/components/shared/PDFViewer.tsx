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
import { Add, ArrowLeft2, ArrowRight2, DocumentText, Warning2 } from "iconsax-react";
import { Movement } from "types/movements";
import axios from "axios";

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
	const [blobUrl, setBlobUrl] = React.useState<string>("");

	// Calcular índices y navegación
	const movementsWithLinks = React.useMemo(() => movements.filter((m) => m.link), [movements]);

	const currentIndex = React.useMemo(() => {
		// Primero buscar por URL ya que es la fuente de verdad actual
		if (url) {
			const indexByUrl = movementsWithLinks.findIndex((m) => m.link === url);
			if (indexByUrl !== -1) {
				console.log("Found by URL:", indexByUrl, "URL:", url);
				return indexByUrl;
			}
		}
		// Si no encuentra por URL, buscar por ID
		if (currentMovementId) {
			const indexById = movementsWithLinks.findIndex((m) => m._id === currentMovementId);
			if (indexById !== -1) {
				console.log("Found by ID:", indexById, "ID:", currentMovementId);
				return indexById;
			}
		}
		console.log("Using default index 0");
		return 0; // Default al primer elemento
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
			// No establecer loading aquí, el useEffect lo manejará
			onNavigate(movementsWithLinks[currentIndex - 1]);
		} else if (currentIndex === 0 && documentsBeforeThisPage > 0 && onRequestPreviousPage) {
			// Solicitar la página anterior
			onRequestPreviousPage();
		}
	};

	const handleNext = () => {
		if (currentIndex < movementsWithLinks.length - 1 && onNavigate) {
			// No establecer loading aquí, el useEffect lo manejará
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

	// Rastrear la URL anterior para detectar cambios reales
	const prevUrlRef = React.useRef<string>("");

	React.useEffect(() => {
		if (!open || !url || url === prevUrlRef.current) {
			return;
		}

		prevUrlRef.current = url;
		setLoading(true);
		setError(false);
		setLoadProgress(0);
		setShowProgress(true);

		let currentBlobUrl: string | null = null;

		const fetchDocument = async () => {
			try {
				// Determinar si es una URL relativa (de nuestro servidor) o absoluta (externa)
				const isRelativeUrl = url.startsWith("/api/") || url.startsWith("api/");

				if (isRelativeUrl) {
					// Para URLs relativas (MEV, PJN), usar axios para que las cookies se envíen correctamente
					const baseURL = import.meta.env.VITE_BASE_URL || "";
					const fullUrl = url.startsWith("/") ? `${baseURL}${url}` : `${baseURL}/${url}`;

					const response = await axios.get(fullUrl, {
						responseType: "blob",
						withCredentials: true, // Enviar cookies auth_token y refresh_token
						headers: {
							Accept: "application/pdf",
						},
						onDownloadProgress: (progressEvent) => {
							if (progressEvent.total) {
								const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
								setLoadProgress(Math.min(progress, 90));
							}
						},
					});

					// Crear URL temporal del blob
					const blob = new Blob([response.data], { type: "application/pdf" });
					const objectUrl = URL.createObjectURL(blob);
					currentBlobUrl = objectUrl;
					setBlobUrl(objectUrl);
					setLoadProgress(100);
					setLoading(false);
					setShowProgress(false);
				} else {
					// URLs externas: verificar que sea un PDF válido antes de mostrar
					try {
						// Hacer una petición HEAD para verificar el content-type
						const headResponse = await fetch(url, { method: "HEAD" });

						if (!headResponse.ok) {
							console.error("Document URL returned error status:", headResponse.status);
							setError(true);
							setLoading(false);
							setShowProgress(false);
							setLoadProgress(0);
							return;
						}

						const contentType = headResponse.headers.get("content-type") || "";
						const isPdf = contentType.includes("application/pdf") || contentType.includes("application/octet-stream");

						if (!isPdf) {
							console.error("URL does not contain a PDF. Content-Type:", contentType);
							setError(true);
							setLoading(false);
							setShowProgress(false);
							setLoadProgress(0);
							return;
						}

						// Es un PDF válido, cargar en el iframe
						setBlobUrl(url);
						setLoadProgress(90);
					} catch (headErr) {
						// Si HEAD falla (CORS), intentar cargar directamente
						console.warn("HEAD request failed (possibly CORS), trying to load directly:", headErr);
						setBlobUrl(url);
						setLoadProgress(90);
					}
				}
			} catch (err) {
				console.error("Error fetching document:", err);
				setError(true);
				setLoading(false);
				setShowProgress(false);
				setLoadProgress(0);
			}
		};

		fetchDocument();

		// Cleanup: revocar la URL del blob al cerrar o cambiar de documento
		return () => {
			if (currentBlobUrl && currentBlobUrl.startsWith("blob:")) {
				URL.revokeObjectURL(currentBlobUrl);
			}
		};
	}, [open, url]);

	// Cleanup cuando se cierra el modal
	React.useEffect(() => {
		if (!open && blobUrl && blobUrl.startsWith("blob:")) {
			URL.revokeObjectURL(blobUrl);
			setBlobUrl("");
		}
	}, [open]);

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
						key={blobUrl} // Forzar recreación del iframe cuando cambia la URL del blob
						src={blobUrl}
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
