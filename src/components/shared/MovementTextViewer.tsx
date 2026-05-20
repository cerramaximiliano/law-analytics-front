import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	IconButton,
	Box,
	Typography,
	Button,
	Stack,
	Link,
	useTheme,
	alpha,
} from "@mui/material";
import { Add, ArrowLeft2, ArrowRight2, DocumentText, Paperclip2 } from "iconsax-react";
import { Movement } from "types/movements";

interface MovementTextViewerProps {
	open: boolean;
	onClose: () => void;
	movement?: Movement | null;
	// Navegación entre movements visibles
	movements?: Movement[];
	currentMovementId?: string;
	onNavigate?: (movement: Movement) => void;
	onRequestNextPage?: () => void;
	onRequestPreviousPage?: () => void;
	hasNextPage?: boolean;
	hasPreviousPage?: boolean;
	isLoadingMore?: boolean;
	totalWithLinks?: number;
	documentsBeforeThisPage?: number;
}

const formatDate = (iso?: string) => {
	if (!iso) return "";
	try {
		return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
	} catch {
		return iso;
	}
};

const MovementTextViewer: React.FC<MovementTextViewerProps> = ({
	open,
	onClose,
	movement,
	movements = [],
	currentMovementId,
	onNavigate,
	onRequestNextPage,
	onRequestPreviousPage,
	hasNextPage = false,
	isLoadingMore = false,
	totalWithLinks = 0,
	documentsBeforeThisPage = 0,
}) => {
	const theme = useTheme();

	// Movs con contenido renderizable (description o attachments)
	const renderableMovs = React.useMemo(
		() => movements.filter((m) => (m.description && m.description.trim()) || (m.attachments && m.attachments.length > 0)),
		[movements],
	);

	const currentIndex = React.useMemo(() => {
		if (!currentMovementId) return -1;
		return renderableMovs.findIndex((m) => m._id === currentMovementId);
	}, [renderableMovs, currentMovementId]);

	const globalPosition = currentIndex >= 0 && documentsBeforeThisPage >= 0 ? documentsBeforeThisPage + currentIndex + 1 : 0;

	const hasPrevious = currentIndex > 0 || documentsBeforeThisPage > 0;
	const hasNext = currentIndex < renderableMovs.length - 1 || hasNextPage;

	const handlePrevious = () => {
		if (currentIndex > 0 && onNavigate) {
			onNavigate(renderableMovs[currentIndex - 1]);
		} else if (currentIndex === 0 && documentsBeforeThisPage > 0 && onRequestPreviousPage) {
			onRequestPreviousPage();
		}
	};

	const handleNext = () => {
		if (currentIndex < renderableMovs.length - 1 && onNavigate) {
			onNavigate(renderableMovs[currentIndex + 1]);
		} else if (hasNextPage && currentIndex === renderableMovs.length - 1 && onRequestNextPage) {
			onRequestNextPage();
		}
	};

	const sourceLabel = movement?.source === "scba" ? "SCBA" : movement?.source === "mev" ? "MEV" : movement?.movement || "Documento";
	const hasText = !!(movement?.description && movement.description.trim());
	const hasAttachments = !!(movement?.attachments && movement.attachments.length > 0);

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: "90vh" } }}>
			<DialogTitle sx={{ pb: movements.length > 0 ? 1 : 2 }}>
				<Box display="flex" justifyContent="space-between" alignItems="flex-start">
					<Box>
						<Typography variant="h6" sx={{ lineHeight: 1.3 }}>
							{movement?.title || "Documento"}
						</Typography>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
							<Typography variant="caption" color="text.secondary">
								{sourceLabel}
							</Typography>
							{movement?.time && (
								<>
									<Typography variant="caption" color="text.secondary">
										·
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{formatDate(movement.time)}
									</Typography>
								</>
							)}
						</Stack>
					</Box>
					<IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
						<Add size={20} style={{ transform: "rotate(45deg)" }} />
					</IconButton>
				</Box>

				{movements.length > 0 && (
					<Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mt: 2 }}>
						<Button
							size="small"
							startIcon={<ArrowLeft2 size={16} />}
							onClick={handlePrevious}
							disabled={!hasPrevious || isLoadingMore}
							variant="outlined"
							sx={{ minWidth: 100 }}
						>
							Anterior
						</Button>
						<Typography variant="body2" color="text.secondary" sx={{ minWidth: 150, textAlign: "center" }}>
							{globalPosition > 0 && totalWithLinks > 0 ? (
								<>
									Documento {globalPosition} de {totalWithLinks}
								</>
							) : currentIndex >= 0 ? (
								<>
									Documento {currentIndex + 1} de {renderableMovs.length}
									{hasNextPage && "+"}
								</>
							) : (
								"Sin documentos"
							)}
						</Typography>
						<Button
							size="small"
							endIcon={<ArrowRight2 size={16} />}
							onClick={handleNext}
							disabled={!hasNext || isLoadingMore}
							variant="outlined"
							sx={{ minWidth: 100 }}
						>
							Siguiente
						</Button>
					</Stack>
				)}
			</DialogTitle>

			<DialogContent dividers sx={{ p: 3 }}>
				{!hasText && !hasAttachments && (
					<Box sx={{ textAlign: "center", py: 6 }}>
						<DocumentText size={40} color={theme.palette.text.disabled} />
						<Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
							Este movimiento no tiene texto ni adjuntos asociados.
						</Typography>
					</Box>
				)}

				{hasText && (
					<Box sx={{ mb: hasAttachments ? 3 : 0 }}>
						<Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
							Contenido del documento
						</Typography>
						<Box
							sx={{
								p: 2.5,
								borderRadius: 1,
								border: `1px solid ${theme.palette.divider}`,
								bgcolor: alpha(theme.palette.background.default, 0.6),
								maxHeight: "55vh",
								overflowY: "auto",
								whiteSpace: "pre-wrap",
								fontFamily: '"Inter", "Helvetica", sans-serif',
								fontSize: "0.875rem",
								lineHeight: 1.7,
								color: "text.primary",
							}}
						>
							{movement?.description}
						</Box>
					</Box>
				)}

				{hasAttachments && (
					<Box>
						<Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
							Adjuntos ({movement?.attachments?.length})
						</Typography>
						<Stack spacing={1}>
							{movement?.attachments?.map((att, idx) => (
								<Box
									key={idx}
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1.5,
										p: 1.5,
										border: `1px solid ${theme.palette.divider}`,
										borderRadius: 1,
										transition: "border-color 180ms ease, background-color 180ms ease",
										"&:hover": {
											borderColor: theme.palette.primary.main,
											bgcolor: alpha(theme.palette.primary.main, 0.04),
										},
									}}
								>
									<Paperclip2 size={18} color={theme.palette.text.secondary} />
									<Link
										href={att.url}
										target="_blank"
										rel="noopener noreferrer"
										underline="none"
										sx={{
											flex: 1,
											color: "text.primary",
											fontSize: "0.85rem",
											fontWeight: 500,
											"&:hover": { color: "primary.main" },
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{att.name}
									</Link>
									{att.type && (
										<Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
											{att.type}
										</Typography>
									)}
								</Box>
							))}
						</Stack>
						<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, fontStyle: "italic" }}>
							Los adjuntos pueden requerir acceso al portal original para descargarse.
						</Typography>
					</Box>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default MovementTextViewer;
