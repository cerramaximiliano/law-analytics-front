// MovementTextViewer — Drawer lateral con visor de movimientos de texto (SCBA/EJE/MEV).
//
// Espejo del PjnPdfViewer para fuentes sin PDF propio: muestra el texto del
// movimiento (description) + adjuntos, y el mismo panel lateral de
// Notas | Tareas | Vencimientos asociados por movementRef = movement._id con
// movementSource = movement.source. Fase 5 del visor multi-fuente.
//
// Sin marcar leído: el read-status es una feature PJN (colección pjn-movements);
// los movimientos de texto no tienen persistencia de lectura todavía.

import React, { useEffect, useMemo, useState } from "react";
import {
	Badge,
	Box,
	Button,
	Chip,
	Drawer,
	IconButton,
	Link,
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
import { Add, ArrowLeft, ArrowRight, CloseCircle, DocumentText, Edit2, Note1, Paperclip2, TaskSquare, Trash } from "iconsax-react";

import { dispatch, useSelector } from "store";
import { deleteNote, getNotesByFolderId } from "store/reducers/notes";
import { deleteTask, getTasksByFolderId } from "store/reducers/tasks";
import { deleteEvent, getEventsById } from "store/reducers/events";
import { openSnackbar } from "store/reducers/snackbar";
import ModalNotes from "pages/apps/folders/details/modals/ModalNotes";
import ModalTasks from "pages/apps/folders/details/modals/MoldalTasks";
import AddEventFrom from "sections/apps/calendar/AddEventForm";
import { Movement } from "types/movements";
import type { Note } from "types/note";
import type { TaskType } from "types/task";
import type { Event as CalendarEvent } from "types/events";

const BASE_URL = import.meta.env.VITE_BASE_URL;

type AttachmentLike = NonNullable<Movement["attachments"]>[number];

/**
 * Resuelve el URL a usar al hacer click en un attachment:
 *   - Si tiene s3Key → endpoint proxy del server (presigned URL S3, 5 min).
 *   - Si no, fallback a url externa (puede requerir login del portal).
 */
function resolveAttachmentHref(movementId: string | undefined, idx: number, att: AttachmentLike): string {
	if (att.s3Key && movementId) {
		return `${BASE_URL}/api/movements/${movementId}/attachments/${idx}/download`;
	}
	return att.url || "";
}

interface MovementTextViewerProps {
	open: boolean;
	onClose: () => void;
	movement?: Movement | null;
	// Carpeta dueña — habilita el panel de notas/tareas/vencimientos.
	folderId?: string;
	folderName?: string;
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

const formatShortDate = (d?: Date | string): string => {
	if (!d) return "";
	try {
		return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
	} catch {
		return String(d);
	}
};

function sourceChipLabel(movement?: Movement | null): string {
	switch (movement?.source) {
		case "scba":
			return "SCBA";
		case "eje":
			return "EJE";
		case "mev":
			return "MEV";
		default:
			return movement?.movement || "Documento";
	}
}

const MovementTextViewer: React.FC<MovementTextViewerProps> = ({
	open,
	onClose,
	movement,
	folderId,
	folderName,
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
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	// El panel necesita un _id real como movementRef. Los movs SCBA sin _id de
	// subdocumento usan un id sintético "scba-<folderId>-<idx>" (posicional,
	// inestable entre páginas) — sobre esos no se pueden colgar notas.
	const movementRef = movement?._id && !String(movement._id).startsWith("scba-") ? movement._id : null;
	const panelAvailable = Boolean(folderId && movementRef);
	const movementSource =
		movement?.source === "mev" || movement?.source === "scba" || movement?.source === "eje" ? movement.source : "manual";

	// Notas / tareas / vencimientos del movimiento (asociados por movementRef).
	const allNotes = useSelector((s: any) => s.notesReducer?.selectedNotes ?? []);
	const allTasks = useSelector((s: any) => s.tasksReducer?.selectedTasks ?? []);
	const allEvents = useSelector((s: any) => s.events?.events ?? []);
	const movementNotes: Note[] = useMemo(
		() => (movementRef ? (allNotes as Note[]).filter((n) => n.movementRef === movementRef) : []),
		[allNotes, movementRef],
	);
	const movementTasks: TaskType[] = useMemo(
		() => (movementRef ? (allTasks as TaskType[]).filter((t) => t.movementRef === movementRef) : []),
		[allTasks, movementRef],
	);
	const movementEvents: CalendarEvent[] = useMemo(
		() => (movementRef ? (allEvents as CalendarEvent[]).filter((e) => e.movementRef === movementRef) : []),
		[allEvents, movementRef],
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

	// Cargar notas, tareas y eventos del folder al abrir.
	useEffect(() => {
		if (open && folderId) {
			dispatch(getNotesByFolderId(folderId));
			dispatch(getTasksByFolderId(folderId));
			dispatch(getEventsById(folderId));
		}
	}, [open, folderId]);

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

	// Navegación por teclado (ignora inputs para no interferir con los modals).
	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			const tag = target?.tagName?.toLowerCase();
			if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
			if (e.key === "ArrowLeft" && hasPrevious && !isLoadingMore) {
				e.preventDefault();
				handlePrevious();
			} else if (e.key === "ArrowRight" && hasNext && !isLoadingMore) {
				e.preventDefault();
				handleNext();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	});

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

	const hasText = !!(movement?.description && movement.description.trim());
	const hasAttachments = !!(movement?.attachments && movement.attachments.length > 0);
	const panelBadge = movementNotes.length + movementTasks.length + movementEvents.length;

	const drawerWidth = isMobile ? "100vw" : "min(1100px, 92vw)";

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
							<Chip size="small" label={sourceChipLabel(movement)} color="primary" variant="outlined" />
							{movement?.time && (
								<Typography variant="caption" color="text.secondary">
									{formatDate(movement.time)}
								</Typography>
							)}
							{globalPosition > 0 && totalWithLinks > 0 ? (
								<Typography variant="caption" color="text.secondary">
									· Documento {globalPosition} de {totalWithLinks}
								</Typography>
							) : currentIndex >= 0 ? (
								<Typography variant="caption" color="text.secondary">
									· Documento {currentIndex + 1} de {renderableMovs.length}
									{hasNextPage && "+"}
								</Typography>
							) : null}
						</Stack>
						<Typography
							variant="subtitle1"
							sx={{
								fontWeight: 600,
								display: "-webkit-box",
								WebkitLineClamp: 2,
								WebkitBoxOrient: "vertical",
								overflow: "hidden",
								lineHeight: 1.3,
							}}
						>
							{movement?.title || "Documento"}
						</Typography>
					</Box>
					<Stack direction="row" spacing={0.5} alignItems="center">
						{panelAvailable && (
							<Tooltip title="Notas, tareas y vencimientos del movimiento">
								<IconButton
									size="small"
									onClick={() => setPanelOpen((v) => !v)}
									aria-label="Notas y tareas"
									color={panelOpen ? "primary" : "default"}
								>
									<Badge badgeContent={panelBadge} color="primary">
										<Note1 size="20" variant={panelOpen ? "Bold" : "Linear"} />
									</Badge>
								</IconButton>
							</Tooltip>
						)}
						{movements.length > 0 && (
							<>
								<IconButton size="small" onClick={handlePrevious} disabled={!hasPrevious || isLoadingMore} aria-label="Anterior">
									<ArrowLeft size="20" />
								</IconButton>
								<IconButton size="small" onClick={handleNext} disabled={!hasNext || isLoadingMore} aria-label="Siguiente">
									<ArrowRight size="20" />
								</IconButton>
							</>
						)}
						<IconButton onClick={onClose} aria-label="Cerrar">
							<CloseCircle size="22" />
						</IconButton>
					</Stack>
				</Stack>

				{/* Body: lectura + (opcional) panel lateral. En mobile el panel abierto
				    ocupa todo el ancho — se oculta el área de lectura. */}
				<Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
					{(!isMobile || !panelOpen) && (
						<Box sx={{ flex: 1, minWidth: 0, overflowY: "auto", bgcolor: alpha(theme.palette.background.default, 0.6) }}>
							<Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>
								{!hasText && !hasAttachments && (
									<Box sx={{ textAlign: "center", py: 6 }}>
										<DocumentText size={40} color={theme.palette.text.disabled} />
										<Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
											Este movimiento no tiene texto ni adjuntos asociados.
										</Typography>
									</Box>
								)}

								{hasText && (
									<Box
										sx={{
											p: { xs: 2, sm: 3 },
											borderRadius: 1.5,
											border: `1px solid ${theme.palette.divider}`,
											bgcolor: theme.palette.background.paper,
											whiteSpace: "pre-wrap",
											fontFamily: '"Inter", "Helvetica", sans-serif',
											fontSize: "0.9rem",
											lineHeight: 1.75,
											color: "text.primary",
											wordBreak: "break-word",
										}}
									>
										{movement?.description}
									</Box>
								)}

								{hasAttachments && (
									<Box sx={{ mt: hasText ? 3 : 0 }}>
										<Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
											Adjuntos ({movement?.attachments?.length})
										</Typography>
										<Stack spacing={1}>
											{movement?.attachments?.map((att, idx) => {
												const href = resolveAttachmentHref(movement._id, idx, att);
												const fromS3 = !!att.s3Key;
												return (
													<Box
														key={idx}
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 1.5,
															p: 1.5,
															border: `1px solid ${theme.palette.divider}`,
															borderRadius: 1,
															bgcolor: theme.palette.background.paper,
															transition: "border-color 180ms ease, background-color 180ms ease",
															"&:hover": {
																borderColor: theme.palette.primary.main,
																bgcolor: alpha(theme.palette.primary.main, 0.04),
															},
														}}
													>
														<Paperclip2 size={18} color={theme.palette.text.secondary} />
														<Link
															href={href}
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
														{!fromS3 && att.url && (
															<Typography variant="caption" color="warning.main" sx={{ fontSize: "0.65rem" }}>
																externo
															</Typography>
														)}
													</Box>
												);
											})}
										</Stack>
										{movement?.attachments?.some((a) => !a.s3Key && a.url) && (
											<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, fontStyle: "italic" }}>
												Adjuntos marcados como "externo" requieren acceso al portal original para descargarse.
											</Typography>
										)}
									</Box>
								)}
							</Box>
						</Box>
					)}

					{/* Panel lateral de notas, tareas y vencimientos */}
					{panelAvailable && panelOpen && (
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
																{formatShortDate(note.createdAt)}
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
																label={`Vence ${formatShortDate(task.dueDate)}`}
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
															label={`Vence ${formatShortDate(ev.start)}`}
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
			</Stack>

			{/* Modal de nota (crear / editar) — prefill movementRef para asociarla al movimiento */}
			{panelAvailable && movementRef && folderId && (
				<ModalNotes
					open={noteModalOpen}
					setOpen={setNoteModalOpen}
					folderId={folderId}
					folderName={folderName}
					note={editingNote}
					initialValues={{ movementRef, movementSource }}
				/>
			)}

			{/* Modal de tarea (crear / editar) — prefill movementRef para asociarla al movimiento */}
			{panelAvailable && movementRef && folderId && (
				<ModalTasks
					open={taskModalOpen}
					setOpen={setTaskModalOpen}
					folderId={folderId}
					folderName={folderName ?? ""}
					editMode={Boolean(editingTask)}
					taskToEdit={editingTask}
					initialValues={{ movementRef, movementSource }}
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
			{panelAvailable && movementRef && folderId && (
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
						movementRef={movementRef}
						movementSource={movementSource}
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

export default MovementTextViewer;
