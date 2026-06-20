// PjnPdfViewer — Drawer lateral con visor de PDF embebido.
//
// Se invoca con { folderId, movement, open, onClose }.
// Pide la presigned URL al backend y la embebe en un <iframe>. Si el PDF
// no está disponible, muestra un fallback con el link original al PJN.
//
// Fase 5 — acciones sobre el documento (gateadas por login):
//   - Marcar leído / no leído (auto-marca leído al abrir + toggle manual).
//   - Notas del movimiento (panel lateral, reusa ModalNotes con movementRef).

import { useEffect, useMemo, useState } from "react";
import {
	Badge,
	Box,
	Button,
	Chip,
	CircularProgress,
	Alert,
	Drawer,
	IconButton,
	Stack,
	Tooltip,
	Typography,
	useMediaQuery,
	useTheme,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Tabs,
	Tab,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
	Add,
	ArrowLeft,
	ArrowRight,
	CloseCircle,
	DocumentDownload,
	Edit2,
	ExportSquare,
	Note1,
	TaskSquare,
	TickCircle,
	Trash,
} from "iconsax-react";

import { dispatch, useSelector } from "store";
import { deleteNote, getNotesByFolderId } from "store/reducers/notes";
import { deleteTask, getTasksByFolderId } from "store/reducers/tasks";
import { deleteEvent, getEventsById } from "store/reducers/events";
import { openSnackbar } from "store/reducers/snackbar";
import ModalNotes from "pages/apps/folders/details/modals/ModalNotes";
import ModalTasks from "pages/apps/folders/details/modals/MoldalTasks";
import AddEventFrom from "sections/apps/calendar/AddEventForm";
import { getPjnMovementPdfUrl, setPjnMovementReadStatus } from "services/pjnMovementsService";
import type { PjnMovement, PjnMovementPdfStatus } from "types/pjnMovement";
import type { Note } from "types/note";
import type { TaskType } from "types/task";
import type { Event as CalendarEvent } from "types/events";

interface PjnPdfViewerProps {
	open: boolean;
	onClose: () => void;
	folderId: string;
	movement: PjnMovement | null;
	folderName?: string;
	// Opcional: para navegación entre movimientos del listado
	onPrev?: () => void;
	onNext?: () => void;
	hasPrev?: boolean;
	hasNext?: boolean;
	// Notifica al padre cuando cambia el estado leído (para refrescar la lista).
	onReadStatusChange?: (movementId: string, read: boolean) => void;
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

function statusLabel(s: PjnMovementPdfStatus | null | undefined): {
	label: string;
	color: "default" | "success" | "warning" | "error" | "info";
} {
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
		// Fecha-calendario guardada como medianoche UTC: formatear en UTC para no
		// correr el día al huso del navegador (ver nota en PjnMovementsViewerSection).
		return d.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
	} catch {
		return iso;
	}
}

function formatNoteDate(iso?: string): string {
	if (!iso) return "";
	try {
		return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
	} catch {
		return "";
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
	folderName,
	onPrev,
	onNext,
	hasPrev,
	hasNext,
	onReadStatusChange,
}: PjnPdfViewerProps) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [state, setState] = useState<State>(initialState);

	// Notas y tareas del movimiento (asociadas por movementRef = movement._id, source "pjn").
	const allNotes = useSelector((s: any) => s.notesReducer?.selectedNotes ?? []);
	const allTasks = useSelector((s: any) => s.tasksReducer?.selectedTasks ?? []);
	const movementNotes: Note[] = useMemo(
		() => (movement ? (allNotes as Note[]).filter((n) => n.movementRef === movement._id) : []),
		[allNotes, movement],
	);
	const movementTasks: TaskType[] = useMemo(
		() => (movement ? (allTasks as TaskType[]).filter((t) => t.movementRef === movement._id) : []),
		[allTasks, movement],
	);
	const allEvents = useSelector((s: any) => s.events?.events ?? []);
	const movementEvents: CalendarEvent[] = useMemo(
		() => (movement ? (allEvents as CalendarEvent[]).filter((e) => e.movementRef === movement._id) : []),
		[allEvents, movement],
	);
	const userId = useSelector((s: any) => s.auth?.user?._id);

	const [panelOpen, setPanelOpen] = useState(false);
	const [panelTab, setPanelTab] = useState<"notas" | "tareas" | "vencimientos">("notas");
	const [noteModalOpen, setNoteModalOpen] = useState(false);
	const [editingNote, setEditingNote] = useState<Note | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
	const [taskModalOpen, setTaskModalOpen] = useState(false);
	const [editingTask, setEditingTask] = useState<TaskType | null>(null);
	const [deleteTaskTarget, setDeleteTaskTarget] = useState<TaskType | null>(null);
	const [eventModalOpen, setEventModalOpen] = useState(false);
	const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
	const [deleteEventTarget, setDeleteEventTarget] = useState<CalendarEvent | null>(null);

	const isRead = Boolean(movement?.read);

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

	// Cargar notas, tareas y eventos (vencimientos) del folder al abrir.
	useEffect(() => {
		if (open && folderId) {
			dispatch(getNotesByFolderId(folderId));
			dispatch(getTasksByFolderId(folderId));
			dispatch(getEventsById(folderId));
		}
	}, [open, folderId]);

	// Auto-marcar leído al abrir un movimiento no leído (abrir el doc = leerlo).
	// El toggle manual permite volver a marcarlo no leído.
	useEffect(() => {
		if (!open || !movement || movement.read) return;
		let cancelled = false;
		const id = movement._id;
		setPjnMovementReadStatus(folderId, id, true)
			.then(() => {
				if (!cancelled) onReadStatusChange?.(id, true);
			})
			.catch(() => {
				/* silencioso: marcar leído no es crítico */
			});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, movement?._id]);

	// Fallback si el iframe no logra cargar el PDF embebido. Cubre el caso en que
	// el backend firma una presigned URL OK pero el objeto S3 no existe (DB con
	// pdfStatus=downloaded huérfano) o hay un fallo de red al traerlo. Caemos al
	// estado de "PDF no disponible" reutilizando el link original al PJN.
	const handleIframeError = () => {
		setState((s) => ({
			...s,
			pdfUrl: null,
			fallbackUrl: s.fallbackUrl ?? movement?.url ?? null,
			errorMsg: "No se pudo cargar el PDF. Probá abrirlo en el portal del PJN.",
		}));
	};

	const handleToggleRead = async () => {
		if (!movement) return;
		const next = !movement.read;
		try {
			await setPjnMovementReadStatus(folderId, movement._id, next);
			onReadStatusChange?.(movement._id, next);
		} catch {
			dispatch(
				openSnackbar({
					open: true,
					message: "No se pudo actualizar el estado de lectura.",
					variant: "alert",
					alert: { color: "error" },
					close: true,
				}),
			);
		}
	};

	const handleAddNote = () => {
		setEditingNote(null);
		setNoteModalOpen(true);
	};

	const handleEditNote = (note: Note) => {
		setEditingNote(note);
		setNoteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		const res = await dispatch(deleteNote(deleteTarget._id));
		dispatch(
			openSnackbar({
				open: true,
				message: res?.success ? "Nota eliminada." : "No se pudo eliminar la nota.",
				variant: "alert",
				alert: { color: res?.success ? "success" : "error" },
				close: true,
			}),
		);
		setDeleteTarget(null);
	};

	const handleAddTask = () => {
		setEditingTask(null);
		setTaskModalOpen(true);
	};

	const handleEditTask = (task: TaskType) => {
		setEditingTask(task);
		setTaskModalOpen(true);
	};

	const handleConfirmDeleteTask = async () => {
		if (!deleteTaskTarget) return;
		const res = await dispatch(deleteTask(deleteTaskTarget._id));
		dispatch(
			openSnackbar({
				open: true,
				message: res?.success ? "Tarea eliminada." : "No se pudo eliminar la tarea.",
				variant: "alert",
				alert: { color: res?.success ? "success" : "error" },
				close: true,
			}),
		);
		setDeleteTaskTarget(null);
	};

	const formatTaskDue = (d?: Date | string): string => {
		if (!d) return "";
		try {
			return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
		} catch {
			return String(d);
		}
	};

	const formatEventDate = (d?: Date | string): string => {
		if (!d) return "";
		try {
			return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
		} catch {
			return String(d);
		}
	};

	const handleAddVencimiento = () => {
		setEditingEvent(null);
		setEventModalOpen(true);
	};

	const handleEditVencimiento = (ev: CalendarEvent) => {
		setEditingEvent(ev);
		setEventModalOpen(true);
	};

	const handleConfirmDeleteEvent = async () => {
		if (!deleteEventTarget?._id) return;
		const res: any = await dispatch(deleteEvent(deleteEventTarget._id));
		dispatch(
			openSnackbar({
				open: true,
				message: res?.success ? "Vencimiento eliminado." : "No se pudo eliminar el vencimiento.",
				variant: "alert",
				alert: { color: res?.success ? "success" : "error" },
				close: true,
			}),
		);
		setDeleteEventTarget(null);
	};

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

	return (
		<Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: drawerWidth } }} ModalProps={{ keepMounted: false }}>
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
					</Box>
					<Stack direction="row" spacing={0.5} alignItems="center">
						{/* Toggle leído / no leído */}
						<Tooltip title={isRead ? "Leído — marcar como no leído" : "Marcar como leído"}>
							<IconButton size="small" onClick={handleToggleRead} aria-label="Marcar leído" color={isRead ? "success" : "default"}>
								<TickCircle size="20" variant={isRead ? "Bold" : "Linear"} />
							</IconButton>
						</Tooltip>
						{/* Toggle panel de notas y tareas */}
						<Tooltip title="Notas y tareas del movimiento">
							<IconButton
								size="small"
								onClick={() => setPanelOpen((v) => !v)}
								aria-label="Notas y tareas"
								color={panelOpen ? "primary" : "default"}
							>
								<Badge badgeContent={movementNotes.length + movementTasks.length} color="primary">
									<Note1 size="20" variant={panelOpen ? "Bold" : "Linear"} />
								</Badge>
							</IconButton>
						</Tooltip>
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

				{/* Body: PDF + (opcional) panel de notas */}
				<Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
					<Box sx={{ flex: 1, position: "relative", bgcolor: theme.palette.grey[100], minWidth: 0 }}>
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
								onError={handleIframeError}
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

					{/* Panel lateral de notas y tareas */}
					{panelOpen && (
						<Box
							sx={{
								width: isMobile ? "100%" : 360,
								flexShrink: 0,
								borderLeft: `1px solid ${theme.palette.divider}`,
								display: "flex",
								flexDirection: "column",
								bgcolor: theme.palette.background.paper,
							}}
						>
							<Tabs
								value={panelTab}
								onChange={(_, v) => setPanelTab(v)}
								variant="fullWidth"
								sx={{ borderBottom: `1px solid ${theme.palette.divider}`, minHeight: 44 }}
							>
								<Tab
									value="notas"
									label={`Notas${movementNotes.length ? ` (${movementNotes.length})` : ""}`}
									sx={{ minHeight: 44, py: 1, minWidth: 0, px: 1, fontSize: "0.75rem" }}
								/>
								<Tab
									value="tareas"
									label={`Tareas${movementTasks.length ? ` (${movementTasks.length})` : ""}`}
									sx={{ minHeight: 44, py: 1, minWidth: 0, px: 1, fontSize: "0.75rem" }}
								/>
								<Tab
									value="vencimientos"
									label={`Vencim.${movementEvents.length ? ` (${movementEvents.length})` : ""}`}
									sx={{ minHeight: 44, py: 1, minWidth: 0, px: 1, fontSize: "0.75rem" }}
								/>
							</Tabs>
							<Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
								{panelTab === "notas" && (
									<>
										<Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
											<Button size="small" variant="text" startIcon={<Add size="16" />} onClick={handleAddNote}>
												Agregar nota
											</Button>
										</Stack>
										{movementNotes.length === 0 ? (
											<Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 1.5 }}>
												Sin notas para este movimiento.
											</Typography>
										) : (
											<Stack spacing={1}>
												{movementNotes.map((note) => (
													<Box
														key={note._id}
														sx={{
															p: 1.5,
															borderRadius: 1.5,
															border: `1px solid ${theme.palette.divider}`,
															bgcolor: alpha(theme.palette.primary.main, 0.03),
														}}
													>
														<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
															<Typography variant="subtitle2" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
																{note.title}
															</Typography>
															<Stack direction="row" spacing={0.25}>
																<Tooltip title="Editar">
																	<IconButton size="small" onClick={() => handleEditNote(note)} aria-label="Editar nota">
																		<Edit2 size="16" />
																	</IconButton>
																</Tooltip>
																<Tooltip title="Eliminar">
																	<IconButton size="small" color="error" onClick={() => setDeleteTarget(note)} aria-label="Eliminar nota">
																		<Trash size="16" />
																	</IconButton>
																</Tooltip>
															</Stack>
														</Stack>
														{note.content ? (
															<Typography
																variant="body2"
																color="text.secondary"
																sx={{ mt: 0.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
															>
																{note.content}
															</Typography>
														) : null}
														{note.createdAt ? (
															<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
																{formatNoteDate(note.createdAt)}
															</Typography>
														) : null}
													</Box>
												))}
											</Stack>
										)}
									</>
								)}
								{panelTab === "tareas" && (
									<>
										<Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
											<Button size="small" variant="text" startIcon={<Add size="16" />} onClick={handleAddTask}>
												Agregar tarea
											</Button>
										</Stack>
										{movementTasks.length === 0 ? (
											<Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 1.5 }}>
												Sin tareas para este movimiento.
											</Typography>
										) : (
											<Stack spacing={1}>
												{movementTasks.map((task) => (
													<Box
														key={task._id}
														sx={{
															p: 1.5,
															borderRadius: 1.5,
															border: `1px solid ${theme.palette.divider}`,
															bgcolor: alpha(theme.palette.success.main, 0.04),
														}}
													>
														<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
															<Stack direction="row" alignItems="flex-start" spacing={0.75} sx={{ minWidth: 0 }}>
																<TaskSquare
																	size="16"
																	variant={task.checked ? "Bold" : "Linear"}
																	color={theme.palette.success.main}
																	style={{ marginTop: 2, flexShrink: 0 }}
																/>
																<Typography
																	variant="subtitle2"
																	sx={{ fontWeight: 600, wordBreak: "break-word", textDecoration: task.checked ? "line-through" : "none" }}
																>
																	{task.name}
																</Typography>
															</Stack>
															<Stack direction="row" spacing={0.25}>
																<Tooltip title="Editar">
																	<IconButton size="small" onClick={() => handleEditTask(task)} aria-label="Editar tarea">
																		<Edit2 size="16" />
																	</IconButton>
																</Tooltip>
																<Tooltip title="Eliminar">
																	<IconButton
																		size="small"
																		color="error"
																		onClick={() => setDeleteTaskTarget(task)}
																		aria-label="Eliminar tarea"
																	>
																		<Trash size="16" />
																	</IconButton>
																</Tooltip>
															</Stack>
														</Stack>
														{task.dueDate ? (
															<Chip
																size="small"
																variant="outlined"
																label={`Vence ${formatTaskDue(task.dueDate)}`}
																sx={{ mt: 0.75, height: 22 }}
															/>
														) : null}
														{task.description ? (
															<Typography
																variant="body2"
																color="text.secondary"
																sx={{ mt: 0.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
															>
																{task.description}
															</Typography>
														) : null}
													</Box>
												))}
											</Stack>
										)}
									</>
								)}
								{panelTab === "vencimientos" && (
									<>
										<Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
											<Button size="small" variant="text" startIcon={<Add size="16" />} onClick={handleAddVencimiento}>
												Agregar vencimiento
											</Button>
										</Stack>
										{movementEvents.length === 0 ? (
											<Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 1.5 }}>
												Sin vencimientos para este movimiento.
											</Typography>
										) : (
											<Stack spacing={1}>
												{movementEvents.map((ev) => (
													<Box
														key={ev._id}
														sx={{
															p: 1.5,
															borderRadius: 1.5,
															border: `1px solid ${theme.palette.divider}`,
															bgcolor: alpha(theme.palette.error.main, 0.04),
														}}
													>
														<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
															<Typography variant="subtitle2" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
																{ev.title}
															</Typography>
															<Stack direction="row" spacing={0.25}>
																<Tooltip title="Editar">
																	<IconButton size="small" onClick={() => handleEditVencimiento(ev)} aria-label="Editar vencimiento">
																		<Edit2 size="16" />
																	</IconButton>
																</Tooltip>
																<Tooltip title="Eliminar">
																	<IconButton
																		size="small"
																		color="error"
																		onClick={() => setDeleteEventTarget(ev)}
																		aria-label="Eliminar vencimiento"
																	>
																		<Trash size="16" />
																	</IconButton>
																</Tooltip>
															</Stack>
														</Stack>
														<Chip
															size="small"
															color="error"
															variant="outlined"
															label={`Vence ${formatEventDate(ev.start)}`}
															sx={{ mt: 0.75, height: 22 }}
														/>
														{ev.description ? (
															<Typography
																variant="body2"
																color="text.secondary"
																sx={{ mt: 0.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
															>
																{ev.description}
															</Typography>
														) : null}
													</Box>
												))}
											</Stack>
										)}
									</>
								)}
							</Box>
						</Box>
					)}
				</Stack>

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
									<Button size="small" startIcon={<ExportSquare size="18" />} href={movement.url} target="_blank" rel="noopener noreferrer">
										Original PJN
									</Button>
								</Tooltip>
							)}
						</Stack>
					</Stack>
				)}
			</Stack>

			{/* Modal de nota (crear / editar) — prefill movementRef para asociarla al movimiento */}
			{movement && (
				<ModalNotes
					open={noteModalOpen}
					setOpen={setNoteModalOpen}
					folderId={folderId}
					folderName={folderName}
					note={editingNote}
					initialValues={{ movementRef: movement._id, movementSource: "pjn" }}
				/>
			)}

			{/* Modal de tarea (crear / editar) — prefill movementRef para asociarla al movimiento */}
			{movement && (
				<ModalTasks
					open={taskModalOpen}
					setOpen={setTaskModalOpen}
					folderId={folderId}
					folderName={folderName ?? ""}
					editMode={Boolean(editingTask)}
					taskToEdit={editingTask}
					initialValues={{ movementRef: movement._id, movementSource: "pjn" }}
				/>
			)}

			{/* Confirmación de borrado de nota */}
			<Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
				<DialogTitle>Eliminar nota</DialogTitle>
				<DialogContent>
					<DialogContentText>
						¿Seguro que querés eliminar la nota{deleteTarget?.title ? ` "${deleteTarget.title}"` : ""}? Esta acción no se puede deshacer.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteTarget(null)} color="secondary">
						Cancelar
					</Button>
					<Button onClick={handleConfirmDelete} color="error" variant="contained">
						Eliminar
					</Button>
				</DialogActions>
			</Dialog>

			{/* Confirmación de borrado de tarea */}
			<Dialog open={Boolean(deleteTaskTarget)} onClose={() => setDeleteTaskTarget(null)} maxWidth="xs" fullWidth>
				<DialogTitle>Eliminar tarea</DialogTitle>
				<DialogContent>
					<DialogContentText>
						¿Seguro que querés eliminar la tarea{deleteTaskTarget?.name ? ` "${deleteTaskTarget.name}"` : ""}? Esta acción no se puede
						deshacer.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteTaskTarget(null)} color="secondary">
						Cancelar
					</Button>
					<Button onClick={handleConfirmDeleteTask} color="error" variant="contained">
						Eliminar
					</Button>
				</DialogActions>
			</Dialog>

			{/* Modal de vencimiento (crear / editar) — reusa AddEventForm con folderId + movementRef */}
			{movement && (
				<Dialog
					open={eventModalOpen}
					onClose={() => setEventModalOpen(false)}
					maxWidth="sm"
					fullWidth
					sx={{ "& .MuiDialog-paper": { p: 0 } }}
				>
					<AddEventFrom
						event={editingEvent}
						range={null}
						onCancel={() => setEventModalOpen(false)}
						userId={userId}
						folderId={folderId}
						folderName={folderName}
						movementRef={movement._id}
						movementSource="pjn"
						defaultType="vencimiento"
					/>
				</Dialog>
			)}

			{/* Confirmación de borrado de vencimiento */}
			<Dialog open={Boolean(deleteEventTarget)} onClose={() => setDeleteEventTarget(null)} maxWidth="xs" fullWidth>
				<DialogTitle>Eliminar vencimiento</DialogTitle>
				<DialogContent>
					<DialogContentText>
						¿Seguro que querés eliminar el vencimiento{deleteEventTarget?.title ? ` "${deleteEventTarget.title}"` : ""}? Esta acción no se
						puede deshacer.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteEventTarget(null)} color="secondary">
						Cancelar
					</Button>
					<Button onClick={handleConfirmDeleteEvent} color="error" variant="contained">
						Eliminar
					</Button>
				</DialogActions>
			</Dialog>
		</Drawer>
	);
};

export default PjnPdfViewer;
