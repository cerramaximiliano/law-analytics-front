// PjnPdfViewer — Drawer lateral con visor de PDF embebido.
//
// Se invoca con { folderId, movementId, movement, open, onClose }.
// Pide la presigned URL al backend y la embebe en un <iframe>. Si el PDF
// no está disponible, muestra un fallback con el link original al PJN.

import { useEffect, useState } from "react";
import {
	Box,
	Drawer,
	IconButton,
	Stack,
	Typography,
	useMediaQuery,
	useTheme,
	Chip,
	Button,
	CircularProgress,
	Alert,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
} from "@mui/material";
import { CloseCircle, DocumentDownload, ExportSquare, ArrowLeft, ArrowRight, Star1, Note1, TickCircle } from "iconsax-react";
import { getPjnMovementPdfUrl } from "services/pjnMovementsService";
import type { PjnMovement, PjnMovementPdfStatus } from "types/pjnMovement";
import type { MovementAnnotation, AnnotationUpdate } from "types/annotation";

interface PjnPdfViewerProps {
	open: boolean;
	onClose: () => void;
	folderId: string;
	movement: PjnMovement | null;
	// Opcional: para navegación entre movimientos del listado
	onPrev?: () => void;
	onNext?: () => void;
	hasPrev?: boolean;
	hasNext?: boolean;
	// Anotación del movimiento actual + callback de actualización (Item 6).
	// Si no se pasan, las acciones de anotación no se renderizan.
	annotation?: MovementAnnotation;
	onUpdateAnnotation?: (movementId: string, updates: AnnotationUpdate) => Promise<void>;
}

interface State {
	loading: boolean;
	pdfUrl: string | null;
	fallbackUrl: string | null;
	pdfStatus: PjnMovementPdfStatus | null;
	errorMsg: string | null;
	bytes?: number;
}

const initialState: State = {
	loading: false,
	pdfUrl: null,
	fallbackUrl: null,
	pdfStatus: null,
	errorMsg: null,
};

function statusLabel(s: PjnMovementPdfStatus | null | undefined): { label: string; color: "default" | "success" | "warning" | "error" | "info" } {
	switch (s) {
		case "downloaded":
			return { label: "PDF disponible", color: "success" };
		case "pending":
			return { label: "PDF pendiente", color: "info" };
		case "failed":
			return { label: "Descarga falló", color: "warning" };
		case "expired":
			return { label: "PDF expirado", color: "error" };
		case "not_applicable":
			return { label: "Sin PDF", color: "default" };
		default:
			return { label: "—", color: "default" };
	}
}

function formatFecha(iso: string | null): string {
	if (!iso) return "Sin fecha";
	try {
		const d = new Date(iso);
		return d.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
	} catch {
		return iso;
	}
}

function formatBytes(n?: number): string {
	if (!n) return "";
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

const PjnPdfViewer = ({
	open,
	onClose,
	folderId,
	movement,
	onPrev,
	onNext,
	hasPrev,
	hasNext,
	annotation,
	onUpdateAnnotation,
}: PjnPdfViewerProps) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [state, setState] = useState<State>(initialState);
	const [notesDialogOpen, setNotesDialogOpen] = useState(false);
	const [notesDraft, setNotesDraft] = useState("");
	const [tagsDraft, setTagsDraft] = useState("");
	const [savingAnnotation, setSavingAnnotation] = useState(false);

	useEffect(() => {
		if (!open || !movement) {
			setState(initialState);
			return;
		}

		// Si el doc indica que no hay PDF, ni siquiera consultar
		if (!movement.hasPdf) {
			setState({
				...initialState,
				pdfStatus: movement.pdfStatus,
				fallbackUrl: movement.url,
			});
			return;
		}

		let cancelled = false;
		let refreshTimer: ReturnType<typeof setTimeout> | null = null;

		// Fetch (re)usable: pide la presigned URL al backend.
		// onRefresh=true se usa para refrescos automáticos (silencioso, no
		// muestra loading spinner para evitar parpadeo).
		const fetchPdf = (onRefresh = false) => {
			if (!onRefresh) setState({ ...initialState, loading: true });
			getPjnMovementPdfUrl(folderId, movement._id)
				.then((res) => {
					if (cancelled) return;
					if (res.success && res.pdfUrl) {
						setState({
							loading: false,
							pdfUrl: res.pdfUrl,
							fallbackUrl: null,
							pdfStatus: "downloaded",
							errorMsg: null,
							bytes: res.bytes,
						});
						// La presigned URL dura 5 min; programar refresh
						// silencioso a los 4 min para evitar que expire mientras
						// el user lee el PDF (no recarga el iframe — solo deja
						// la nueva URL lista por si el browser refetch).
						if (refreshTimer) clearTimeout(refreshTimer);
						refreshTimer = setTimeout(() => fetchPdf(true), 4 * 60 * 1000);
					} else {
						setState({
							loading: false,
							pdfUrl: null,
							fallbackUrl: res.fallbackUrl ?? movement.url ?? null,
							pdfStatus: res.pdfStatus ?? movement.pdfStatus,
							errorMsg: res.message ?? null,
						});
					}
				})
				.catch((err) => {
					if (cancelled) return;
					setState({
						loading: false,
						pdfUrl: null,
						fallbackUrl: movement.url,
						pdfStatus: movement.pdfStatus,
						errorMsg: err?.message ?? "Error al obtener PDF",
					});
				});
		};

		fetchPdf();

		return () => {
			cancelled = true;
			if (refreshTimer) clearTimeout(refreshTimer);
		};
	}, [open, movement, folderId]);

	const status = statusLabel(movement?.pdfStatus ?? state.pdfStatus);
	// Drawer ancho: en mobile fullscreen, en desktop ~92vw (deja una franja
	// del listado a la izquierda para mantener contexto visual sin perder
	// área del PDF).
	const drawerWidth = isMobile ? "100vw" : "min(1400px, 92vw)";

	// Navegación por teclado: ArrowLeft/ArrowRight cuando el viewer está
	// abierto. Ignorar si el foco está en un input/textarea (para no
	// interferir con escritura).
	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			const tag = target?.tagName?.toLowerCase();
			if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
			if (e.key === "ArrowLeft" && hasPrev && onPrev) {
				e.preventDefault();
				onPrev();
			} else if (e.key === "ArrowRight" && hasNext && onNext) {
				e.preventDefault();
				onNext();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [open, hasPrev, hasNext, onPrev, onNext]);

	// Auto-marcar como leído al abrir el viewer (si hay handler y aún no está leído).
	// Silencioso: si falla, lo ignoramos (revert lo maneja el hook).
	useEffect(() => {
		if (!open || !movement || !onUpdateAnnotation) return;
		const isRead = annotation?.isRead === true;
		if (isRead) return;
		onUpdateAnnotation(movement._id, { isRead: true }).catch(() => {});
		// Solo dispara cuando cambia el movimiento abierto.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, movement?._id]);

	// Sincronizar drafts del dialog cuando cambia el movimiento o se abre el dialog.
	useEffect(() => {
		if (!notesDialogOpen) return;
		setNotesDraft(annotation?.notes ?? "");
		setTagsDraft((annotation?.tags ?? []).join(", "));
	}, [notesDialogOpen, annotation?.movementId]);

	const isImportant = annotation?.isImportant === true;
	const isRead = annotation?.isRead === true;
	const hasNotes = !!(annotation?.notes && annotation.notes.trim().length > 0);
	const tagsCount = annotation?.tags?.length ?? 0;

	const toggleImportant = () => {
		if (!movement || !onUpdateAnnotation) return;
		onUpdateAnnotation(movement._id, { isImportant: !isImportant }).catch(() => {});
	};

	const toggleRead = () => {
		if (!movement || !onUpdateAnnotation) return;
		onUpdateAnnotation(movement._id, { isRead: !isRead }).catch(() => {});
	};

	const openNotesDialog = () => setNotesDialogOpen(true);
	const closeNotesDialog = () => {
		if (savingAnnotation) return;
		setNotesDialogOpen(false);
	};

	const saveNotes = async () => {
		if (!movement || !onUpdateAnnotation) return;
		const tags = tagsDraft
			.split(",")
			.map((t) => t.trim())
			.filter((t) => t.length > 0)
			.slice(0, 20);
		setSavingAnnotation(true);
		try {
			await onUpdateAnnotation(movement._id, { notes: notesDraft.trim(), tags });
			setNotesDialogOpen(false);
		} catch {
			// El hook hace revert; dejamos el dialog abierto para reintento.
		} finally {
			setSavingAnnotation(false);
		}
	};

	return (
		<>
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{ sx: { width: drawerWidth } }}
			ModalProps={{ keepMounted: false }}
		>
			<Stack sx={{ height: "100%" }}>
				{/* Header */}
				<Stack
					direction="row"
					alignItems="flex-start"
					justifyContent="space-between"
					spacing={2}
					sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
				>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
							<Typography variant="caption" color="text.secondary">
								{formatFecha(movement?.fecha ?? null)}
							</Typography>
							<Chip size="small" label={status.label} color={status.color} variant="outlined" />
							{state.bytes ? (
								<Typography variant="caption" color="text.secondary">
									{formatBytes(state.bytes)}
								</Typography>
							) : null}
						</Stack>
						<Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
							{movement?.tipo || "Movimiento"}
						</Typography>
						{movement?.detalle ? (
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{
									mt: 0.5,
									display: "-webkit-box",
									WebkitLineClamp: 2,
									WebkitBoxOrient: "vertical",
									overflow: "hidden",
								}}
							>
								{movement.detalle}
							</Typography>
						) : null}
						{(hasNotes || tagsCount > 0) && (
							<Box
								sx={{
									mt: 1,
									p: 1,
									borderRadius: 1,
									bgcolor: theme.palette.action.hover,
									borderLeft: `3px solid ${theme.palette.primary.main}`,
								}}
							>
								{hasNotes && (
									<Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
										{annotation?.notes}
									</Typography>
								)}
								{tagsCount > 0 && (
									<Stack direction="row" spacing={0.5} sx={{ mt: hasNotes ? 0.75 : 0, flexWrap: "wrap", gap: 0.5 }}>
										{annotation!.tags.map((t) => (
											<Chip key={t} label={t} size="small" variant="outlined" />
										))}
									</Stack>
								)}
							</Box>
						)}
					</Box>
					<Stack direction="row" spacing={0.5} alignItems="center">
						{onUpdateAnnotation && movement && (
							<>
								<Tooltip title={isImportant ? "Quitar importante" : "Marcar importante"}>
									<IconButton
										size="small"
										onClick={toggleImportant}
										aria-label={isImportant ? "Quitar importante" : "Marcar importante"}
										sx={{ color: isImportant ? theme.palette.warning.main : undefined }}
									>
										<Star1 size="20" variant={isImportant ? "Bold" : "Linear"} />
									</IconButton>
								</Tooltip>
								<Tooltip title={isRead ? "Marcar como no leído" : "Marcar como leído"}>
									<IconButton
										size="small"
										onClick={toggleRead}
										aria-label={isRead ? "Marcar como no leído" : "Marcar como leído"}
										sx={{ color: isRead ? theme.palette.success.main : undefined }}
									>
										<TickCircle size="20" variant={isRead ? "Bold" : "Linear"} />
									</IconButton>
								</Tooltip>
								<Tooltip title={hasNotes ? `Editar nota${tagsCount ? ` (${tagsCount} tag${tagsCount === 1 ? "" : "s"})` : ""}` : "Agregar nota"}>
									<IconButton
										size="small"
										onClick={openNotesDialog}
										aria-label={hasNotes ? "Editar nota" : "Agregar nota"}
										sx={{ color: hasNotes ? theme.palette.primary.main : undefined }}
									>
										<Note1 size="20" variant={hasNotes ? "Bold" : "Linear"} />
									</IconButton>
								</Tooltip>
								<Box sx={{ width: 8 }} />
							</>
						)}
						{(onPrev || onNext) && (
							<>
								<IconButton size="small" onClick={onPrev} disabled={!hasPrev} aria-label="Anterior">
									<ArrowLeft size="20" />
								</IconButton>
								<IconButton size="small" onClick={onNext} disabled={!hasNext} aria-label="Siguiente">
									<ArrowRight size="20" />
								</IconButton>
							</>
						)}
						<IconButton onClick={onClose} aria-label="Cerrar">
							<CloseCircle size="22" />
						</IconButton>
					</Stack>
				</Stack>

				{/* Body */}
				<Box sx={{ flex: 1, position: "relative", bgcolor: theme.palette.grey[100] }}>
					{state.loading && (
						<Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
							<CircularProgress />
							<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
								Cargando PDF...
							</Typography>
						</Stack>
					)}

					{!state.loading && state.pdfUrl && (
						<iframe
							src={state.pdfUrl}
							title="PDF del movimiento"
							style={{ width: "100%", height: "100%", border: 0 }}
						/>
					)}

					{!state.loading && !state.pdfUrl && (
						<Stack alignItems="center" justifyContent="center" spacing={2} sx={{ p: 4, height: "100%" }}>
							<Alert severity={status.color === "error" ? "error" : "info"} sx={{ width: "100%", maxWidth: 480 }}>
								<Typography variant="subtitle2" sx={{ mb: 0.5 }}>
									{state.errorMsg ?? "PDF no disponible en nuestra plataforma"}
								</Typography>
								<Typography variant="body2">
									Estado: <strong>{status.label}</strong>
								</Typography>
								{state.fallbackUrl && (
									<Typography variant="body2" sx={{ mt: 1 }}>
										Podés ver el documento original en el portal del PJN.
									</Typography>
								)}
							</Alert>
							{state.fallbackUrl && (
								<Button
									variant="contained"
									color="primary"
									startIcon={<ExportSquare size="18" />}
									href={state.fallbackUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									Abrir en PJN
								</Button>
							)}
						</Stack>
					)}
				</Box>

				{/* Footer */}
				{state.pdfUrl && (
					<Stack
						direction="row"
						spacing={1}
						alignItems="center"
						justifyContent="space-between"
						sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}
					>
						{/* Hint sutil de fallback manual a la izquierda */}
						{movement?.url ? (
							<Typography variant="caption" color="text.secondary">
								¿No carga el PDF? Probá abrirlo en PJN →
							</Typography>
						) : (
							<span />
						)}
						<Stack direction="row" spacing={1}>
							<Button
								size="small"
								startIcon={<DocumentDownload size="18" />}
								href={state.pdfUrl}
								download={`${movement?.tipo || "documento"}.pdf`}
							>
								Descargar
							</Button>
							{movement?.url && (
								<Tooltip title="Abrir el documento original en el portal del PJN (útil si el PDF embebido no carga)">
									<Button
										size="small"
										startIcon={<ExportSquare size="18" />}
										href={movement.url}
										target="_blank"
										rel="noopener noreferrer"
									>
										Original PJN
									</Button>
								</Tooltip>
							)}
						</Stack>
					</Stack>
				)}
			</Stack>
		</Drawer>

		{/* Dialog para editar nota y tags del movimiento abierto */}
		<Dialog open={notesDialogOpen} onClose={closeNotesDialog} fullWidth maxWidth="sm">
			<DialogTitle>{hasNotes ? "Editar nota" : "Agregar nota"}</DialogTitle>
			<DialogContent>
				<TextField
					autoFocus
					label="Nota"
					value={notesDraft}
					onChange={(e) => setNotesDraft(e.target.value.slice(0, 5000))}
					fullWidth
					multiline
					minRows={4}
					maxRows={12}
					sx={{ mt: 1 }}
					helperText={`${notesDraft.length}/5000`}
					disabled={savingAnnotation}
				/>
				<TextField
					label="Tags (separados por coma)"
					value={tagsDraft}
					onChange={(e) => setTagsDraft(e.target.value)}
					fullWidth
					sx={{ mt: 2 }}
					helperText="Hasta 20 tags, máx 50 caracteres c/u"
					disabled={savingAnnotation}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={closeNotesDialog} disabled={savingAnnotation}>
					Cancelar
				</Button>
				<Button
					onClick={saveNotes}
					variant="contained"
					disabled={savingAnnotation}
					startIcon={savingAnnotation ? <CircularProgress size={16} color="inherit" /> : undefined}
				>
					Guardar
				</Button>
			</DialogActions>
		</Dialog>
		</>
	);
};

export default PjnPdfViewer;
