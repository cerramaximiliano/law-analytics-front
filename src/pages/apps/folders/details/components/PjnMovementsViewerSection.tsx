// PjnMovementsViewerSection — listado paginado del expediente PJN leído desde
// pjn-movements + viewer del PDF embebido (Fase 7a MVP).
//
// Es una sección nueva que coexiste con el MovementsTable clásico. No reemplaza
// nada existente. Si el folder no es PJN, no se renderiza.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Chip,
	CircularProgress,
	Dialog,
	IconButton,
	InputAdornment,
	MenuItem,
	Pagination,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
	Alert,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Calendar, DocumentText, ExportSquare, Note1, SearchNormal1, TaskSquare, TickCircle } from "iconsax-react";
import PjnPdfViewer from "components/PjnPdfViewer";
import ModalNotes from "pages/apps/folders/details/modals/ModalNotes";
import ModalTasks from "pages/apps/folders/details/modals/MoldalTasks";
import AddEventFrom from "sections/apps/calendar/AddEventForm";
import { dispatch, useSelector } from "store";
import { getNotesByFolderId } from "store/reducers/notes";
import { getTasksByFolderId } from "store/reducers/tasks";
import { getEventsById } from "store/reducers/events";
import { openSnackbar } from "store/reducers/snackbar";
import { getPjnMovementsByFolder, setPjnMovementReadStatus } from "services/pjnMovementsService";
import type { PjnMovementPdfStatus, PjnMovementsListResponse } from "types/pjnMovement";
import type { Note } from "types/note";
import type { TaskType } from "types/task";
import type { Event as CalendarEvent } from "types/events";

interface Props {
	folderId: string;
	// Deep-link: _id del movimiento a resaltar ("{causaId}:{sourceId}"), si llega
	// vía ?movement=<id> desde la vista pública /m/:token. Best-effort: solo resalta
	// si el movimiento está en la página cargada (el sort default es fecha desc, así
	// que un movimiento recién notificado cae en la página 1).
	highlightMovementId?: string | null;
}

const PDF_STATUS_OPTIONS: { value: PjnMovementPdfStatus | "all"; label: string }[] = [
	{ value: "all", label: "Todos" },
	{ value: "downloaded", label: "PDF disponible" },
	{ value: "pending", label: "PDF pendiente" },
	{ value: "expired", label: "PDF expirado" },
	{ value: "not_applicable", label: "Sin PDF" },
];

function formatDate(iso: string | null): string {
	if (!iso) return "—";
	try {
		// Las fechas de movimientos son fecha-calendario guardadas como medianoche
		// UTC (ej. 2026-06-02T00:00:00Z). Formatear en UTC para no correr el día al
		// convertir al huso del navegador (UTC-3 mostraría 01/06 en vez de 02/06).
		return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
	} catch {
		return iso;
	}
}

function pdfStatusChip(status: PjnMovementPdfStatus) {
	switch (status) {
		case "downloaded":
			return <Chip size="small" label="PDF" color="success" variant="outlined" />;
		case "pending":
			return <Chip size="small" label="Pendiente" color="info" variant="outlined" />;
		case "expired":
			return <Chip size="small" label="Expirado" color="error" variant="outlined" />;
		case "failed":
			return <Chip size="small" label="Falló" color="warning" variant="outlined" />;
		default:
			return <Chip size="small" label="—" variant="outlined" />;
	}
}

const PjnMovementsViewerSection = ({ folderId, highlightMovementId }: Props) => {
	const [page, setPage] = useState(1);
	const [limit] = useState(20);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [pdfStatusFilter, setPdfStatusFilter] = useState<PjnMovementPdfStatus | "all">("all");

	const [data, setData] = useState<PjnMovementsListResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [viewerOpen, setViewerOpen] = useState(false);
	const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
	// Cuando navegamos cross-page (prev/next cruza límite), marcamos qué hacer
	// al cargar la nueva página: saltar al primero o al último mov con PDF.
	const [pendingNavOnLoad, setPendingNavOnLoad] = useState<"first" | "last" | null>(null);
	// Fila resaltada por deep-link: ref para hacer scrollIntoView una vez cargada.
	const highlightRowRef = useRef<HTMLTableRowElement | null>(null);
	const hasScrolledToHighlight = useRef(false);

	const fetchData = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await getPjnMovementsByFolder(folderId, {
				page,
				limit,
				search: search || undefined,
				pdfStatus: pdfStatusFilter !== "all" ? pdfStatusFilter : undefined,
			});
			setData(res);
		} catch (err: any) {
			setError(err?.response?.data?.message ?? err?.message ?? "Error al cargar movimientos");
		} finally {
			setLoading(false);
		}
	}, [folderId, page, limit, search, pdfStatusFilter]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Debounce simple del search input (350ms)
	useEffect(() => {
		const t = setTimeout(() => {
			if (searchInput !== search) {
				setPage(1);
				setSearch(searchInput);
			}
		}, 350);
		return () => clearTimeout(t);
	}, [searchInput, search]);

	// Notas y tareas del folder (para mostrar en la tabla qué movimientos tienen).
	// Se leen de redux y se cuentan por movementRef (= movement._id en PJN). Reactivo:
	// al crear/borrar una nota o tarea desde el drawer, los indicadores se actualizan solos.
	useEffect(() => {
		if (folderId) {
			dispatch(getNotesByFolderId(folderId));
			dispatch(getTasksByFolderId(folderId));
			dispatch(getEventsById(folderId));
		}
	}, [folderId]);

	const folderNotes = useSelector((s: any) => s.notesReducer?.selectedNotes ?? []);
	const folderTasks = useSelector((s: any) => s.tasksReducer?.selectedTasks ?? []);
	const folderEvents = useSelector((s: any) => s.events?.events ?? []);
	const notesCountByMov = useMemo(() => {
		const map: Record<string, number> = {};
		(folderNotes as Note[]).forEach((n) => {
			if (n.movementRef) map[n.movementRef] = (map[n.movementRef] || 0) + 1;
		});
		return map;
	}, [folderNotes]);
	const tasksCountByMov = useMemo(() => {
		const map: Record<string, number> = {};
		(folderTasks as TaskType[]).forEach((t) => {
			if (t.movementRef) map[t.movementRef] = (map[t.movementRef] || 0) + 1;
		});
		return map;
	}, [folderTasks]);
	const eventsCountByMov = useMemo(() => {
		const map: Record<string, number> = {};
		(folderEvents as CalendarEvent[]).forEach((e) => {
			if (e.movementRef) map[e.movementRef] = (map[e.movementRef] || 0) + 1;
		});
		return map;
	}, [folderEvents]);

	const movements = data?.data ?? [];
	const total = data?.count ?? 0;
	const totalPages = data?.pagination?.totalPages ?? 0;
	// Plan free: el backend devuelve solo un preview (últimos N) y marca requiresUpgrade.
	const requiresUpgrade = Boolean(data?.requiresUpgrade);

	// Deep-link: una vez cargada la página que contiene el movimiento resaltado,
	// hacer scroll hacia su fila (una sola vez por id). Si no está en la página
	// cargada no hace nada — el usuario igual aterriza en el expediente correcto.
	useEffect(() => {
		if (!highlightMovementId || hasScrolledToHighlight.current) return;
		if (movements.some((m) => m._id === highlightMovementId) && highlightRowRef.current) {
			highlightRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
			hasScrolledToHighlight.current = true;
		}
	}, [highlightMovementId, movements]);

	const handleOpenViewer = (idx: number) => {
		setSelectedIdx(idx);
		setViewerOpen(true);
	};

	// Actualiza el flag `read` de un movimiento en la lista cargada (optimista),
	// cuando el viewer lo marca leído/no leído (auto al abrir o toggle manual).
	const handleReadStatusChange = (movementId: string, read: boolean) => {
		setData((prev) => (prev ? { ...prev, data: prev.data.map((m) => (m._id === movementId ? { ...m, read } : m)) } : prev));
	};

	// Acciones rápidas desde la tabla (sin abrir el visor): agregar nota / tarea
	// vinculada al movimiento. actionMovId guarda a qué movimiento aplica el modal.
	const [actionMovId, setActionMovId] = useState<string | null>(null);
	const [noteModalOpen, setNoteModalOpen] = useState(false);
	const [taskModalOpen, setTaskModalOpen] = useState(false);
	const [eventModalOpen, setEventModalOpen] = useState(false);
	const eventUserId = useSelector((s: any) => s.auth?.user?._id);
	const openNoteModal = (movId: string) => {
		setActionMovId(movId);
		setNoteModalOpen(true);
	};
	const openTaskModal = (movId: string) => {
		setActionMovId(movId);
		setTaskModalOpen(true);
	};
	const openEventModal = (movId: string) => {
		setActionMovId(movId);
		setEventModalOpen(true);
	};

	// Marcar leído / no leído desde la tabla (sin abrir el visor). Cubre también los
	// movimientos sin PDF, que no se pueden abrir y por eso nunca se auto-marcaban.
	const handleToggleReadRow = async (movId: string, currentRead: boolean) => {
		const next = !currentRead;
		// Optimista: reflejar en la lista de inmediato.
		handleReadStatusChange(movId, next);
		try {
			await setPjnMovementReadStatus(folderId, movId, next);
		} catch {
			handleReadStatusChange(movId, currentRead); // revertir
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

	// Prev/next navegan entre movimientos con PDF descargado.
	// Si llegan al límite de la página actual, saltan a la página
	// anterior/siguiente y se posicionan automáticamente en el primer/último
	// mov con PDF (vía pendingNavOnLoad + useEffect).
	const handlePrev = () => {
		if (selectedIdx === null) return;
		for (let i = selectedIdx - 1; i >= 0; i--) {
			if (movements[i].hasPdf) {
				setSelectedIdx(i);
				return;
			}
		}
		// Sin más en esta página → ir a página anterior
		if (data?.pagination?.hasPrevPage) {
			setPendingNavOnLoad("last");
			setPage((p) => p - 1);
		}
	};

	const handleNext = () => {
		if (selectedIdx === null) return;
		for (let i = selectedIdx + 1; i < movements.length; i++) {
			if (movements[i].hasPdf) {
				setSelectedIdx(i);
				return;
			}
		}
		// Sin más en esta página → ir a página siguiente
		if (data?.pagination?.hasNextPage) {
			setPendingNavOnLoad("first");
			setPage((p) => p + 1);
		}
	};

	// Cuando llega data nueva tras un cross-page, posicionar el viewer.
	useEffect(() => {
		if (pendingNavOnLoad === null || movements.length === 0) return;
		if (pendingNavOnLoad === "first") {
			const idx = movements.findIndex((m) => m.hasPdf);
			if (idx >= 0) setSelectedIdx(idx);
		} else {
			for (let i = movements.length - 1; i >= 0; i--) {
				if (movements[i].hasPdf) {
					setSelectedIdx(i);
					break;
				}
			}
		}
		setPendingNavOnLoad(null);
	}, [data, movements, pendingNavOnLoad]);

	const selected = selectedIdx !== null ? movements[selectedIdx] ?? null : null;
	// hasPrev/hasNext consideran cross-page también.
	const hasPrev = selectedIdx !== null && (movements.slice(0, selectedIdx).some((m) => m.hasPdf) || Boolean(data?.pagination?.hasPrevPage));
	const hasNext =
		selectedIdx !== null && (movements.slice(selectedIdx + 1).some((m) => m.hasPdf) || Boolean(data?.pagination?.hasNextPage));

	// Si el folder no tiene causa PJN, el endpoint devuelve count=0 con mensaje.
	// Este guard va DESPUÉS de todos los hooks (rules-of-hooks): un return temprano
	// antes de un useEffect cambia el número de hooks entre renders y crashea React.
	if (data && total === 0 && !search && pdfStatusFilter === "all" && data.message?.includes("no tiene causa PJN")) {
		return null; // No renderizar nada — mejor UX para folders no-PJN
	}

	return (
		<Card>
			<CardHeader
				title="Expediente PJN"
				subheader={
					data ? (
						<Typography variant="caption" color="text.secondary">
							{total} movimientos · {data.causa?.causaType}
						</Typography>
					) : null
				}
			/>
			<CardContent>
				{/* Banner de upgrade (plan free): preview limitado, sin filtros ni PDF */}
				{requiresUpgrade && (
					<Alert severity="info" sx={{ mb: 2 }}>
						Estás viendo los últimos {movements.length} movimientos de {total}. Actualizá a un plan Standard o Premium para ver el
						expediente completo y abrir los PDF desde la plataforma.
					</Alert>
				)}

				{/* Filtros — ocultos en preview free (no operan sobre el set limitado) */}
				{!requiresUpgrade && (
					<Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
						<TextField
							size="small"
							placeholder="Buscar en tipo o detalle..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchNormal1 size="18" />
									</InputAdornment>
								),
							}}
							sx={{ flex: 1, maxWidth: 360 }}
						/>
						<TextField
							select
							size="small"
							label="Estado del PDF"
							value={pdfStatusFilter}
							onChange={(e) => {
								setPage(1);
								setPdfStatusFilter(e.target.value as PjnMovementPdfStatus | "all");
							}}
							sx={{ minWidth: 180 }}
						>
							{PDF_STATUS_OPTIONS.map((opt) => (
								<MenuItem key={opt.value} value={opt.value}>
									{opt.label}
								</MenuItem>
							))}
						</TextField>
					</Stack>
				)}

				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				{loading && (
					<Stack alignItems="center" sx={{ py: 4 }}>
						<CircularProgress size={28} />
					</Stack>
				)}

				{!loading && movements.length === 0 && !error && (
					<Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
						{search || pdfStatusFilter !== "all"
							? "No hay movimientos que coincidan con los filtros."
							: "No hay movimientos para este expediente."}
					</Typography>
				)}

				{!loading && movements.length > 0 && (
					<>
						<TableContainer>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell sx={{ width: 110 }}>Fecha</TableCell>
										<TableCell sx={{ width: 200 }}>Tipo</TableCell>
										<TableCell>Detalle</TableCell>
										<TableCell sx={{ width: 100 }} align="center">
											PDF
										</TableCell>
										<TableCell sx={{ width: 80 }} align="right">
											Acciones
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{movements.map((m, idx) => {
										const isHighlighted = Boolean(highlightMovementId) && m._id === highlightMovementId;
										return (
											<TableRow
												key={m._id}
												ref={isHighlighted ? highlightRowRef : undefined}
												hover
												sx={(theme) => ({
													cursor: "pointer", // clickeable aun sin PDF: abre el panel de notas/tareas/vencimientos
													...(isHighlighted && {
														bgcolor: alpha(theme.palette.primary.main, 0.12),
														"&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.18) },
													}),
												})}
												onClick={() => handleOpenViewer(idx)}
											>
												<TableCell>{formatDate(m.fecha)}</TableCell>
												<TableCell>
													<Stack spacing={0.25}>
														<Stack direction="row" alignItems="center" spacing={0.75}>
															{!m.read && (
																<Tooltip title="No leído">
																	<Box
																		component="span"
																		sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }}
																	/>
																</Tooltip>
															)}
															<Typography variant="body2" sx={{ fontWeight: m.read ? 500 : 700 }}>
																{m.tipo || "—"}
															</Typography>
														</Stack>
														{(notesCountByMov[m._id] || tasksCountByMov[m._id] || eventsCountByMov[m._id]) && (
															<Stack direction="row" alignItems="center" spacing={1}>
																{notesCountByMov[m._id] ? (
																	<Tooltip title={`${notesCountByMov[m._id]} nota${notesCountByMov[m._id] > 1 ? "s" : ""}`}>
																		<Stack direction="row" alignItems="center" spacing={0.25} sx={{ color: "primary.main" }}>
																			<Note1 size="13" variant="Bulk" />
																			<Typography variant="caption" sx={{ fontWeight: 600 }}>
																				{notesCountByMov[m._id]}
																			</Typography>
																		</Stack>
																	</Tooltip>
																) : null}
																{tasksCountByMov[m._id] ? (
																	<Tooltip title={`${tasksCountByMov[m._id]} tarea${tasksCountByMov[m._id] > 1 ? "s" : ""}`}>
																		<Stack direction="row" alignItems="center" spacing={0.25} sx={{ color: "success.main" }}>
																			<TaskSquare size="13" variant="Bulk" />
																			<Typography variant="caption" sx={{ fontWeight: 600 }}>
																				{tasksCountByMov[m._id]}
																			</Typography>
																		</Stack>
																	</Tooltip>
																) : null}
																{eventsCountByMov[m._id] ? (
																	<Tooltip title={`${eventsCountByMov[m._id]} vencimiento${eventsCountByMov[m._id] > 1 ? "s" : ""}`}>
																		<Stack direction="row" alignItems="center" spacing={0.25} sx={{ color: "error.main" }}>
																			<Calendar size="13" variant="Bulk" />
																			<Typography variant="caption" sx={{ fontWeight: 600 }}>
																				{eventsCountByMov[m._id]}
																			</Typography>
																		</Stack>
																	</Tooltip>
																) : null}
															</Stack>
														)}
													</Stack>
												</TableCell>
												<TableCell>
													<Typography
														variant="body2"
														color="text.secondary"
														sx={{
															display: "-webkit-box",
															WebkitLineClamp: 2,
															WebkitBoxOrient: "vertical",
															overflow: "hidden",
														}}
													>
														{m.detalle || "—"}
													</Typography>
												</TableCell>
												<TableCell align="center">{pdfStatusChip(m.pdfStatus)}</TableCell>
												<TableCell align="right">
													<Stack direction="row" spacing={0.5} justifyContent="flex-end">
														<Tooltip title={m.read ? "Marcar como no leído" : "Marcar como leído"}>
															<IconButton
																size="small"
																color={m.read ? "success" : "default"}
																onClick={(e) => {
																	e.stopPropagation();
																	handleToggleReadRow(m._id, Boolean(m.read));
																}}
															>
																<TickCircle size={18} variant={m.read ? "Bold" : "Linear"} />
															</IconButton>
														</Tooltip>
														{m.hasPdf && (
															<Tooltip title="Ver PDF">
																<IconButton
																	size="small"
																	color="primary"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleOpenViewer(idx);
																	}}
																>
																	<DocumentText size={18} />
																</IconButton>
															</Tooltip>
														)}
														{!m.hasPdf && m.url && (
															<Tooltip title="Abrir en PJN">
																<IconButton
																	size="small"
																	href={m.url}
																	target="_blank"
																	rel="noopener noreferrer"
																	onClick={(e) => e.stopPropagation()}
																>
																	<ExportSquare size={18} />
																</IconButton>
															</Tooltip>
														)}
														{/* Acciones rápidas: agregar nota / tarea vinculada a este movimiento */}
														<Tooltip title="Agregar nota">
															<IconButton
																size="small"
																color="primary"
																onClick={(e) => {
																	e.stopPropagation();
																	openNoteModal(m._id);
																}}
															>
																<Note1 size={18} />
															</IconButton>
														</Tooltip>
														<Tooltip title="Agregar tarea">
															<IconButton
																size="small"
																sx={{ color: "success.main" }}
																onClick={(e) => {
																	e.stopPropagation();
																	openTaskModal(m._id);
																}}
															>
																<TaskSquare size={18} />
															</IconButton>
														</Tooltip>
														<Tooltip title="Agregar vencimiento">
															<IconButton
																size="small"
																color="error"
																onClick={(e) => {
																	e.stopPropagation();
																	openEventModal(m._id);
																}}
															>
																<Calendar size={18} />
															</IconButton>
														</Tooltip>
													</Stack>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</TableContainer>

						{totalPages > 1 && (
							<Stack alignItems="center" sx={{ mt: 2 }}>
								<Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" size="small" />
							</Stack>
						)}
					</>
				)}
			</CardContent>

			<PjnPdfViewer
				open={viewerOpen}
				onClose={() => setViewerOpen(false)}
				folderId={folderId}
				movement={selected}
				onPrev={handlePrev}
				onNext={handleNext}
				hasPrev={hasPrev}
				hasNext={hasNext}
				onReadStatusChange={handleReadStatusChange}
			/>

			{/* Modales de acción rápida desde la tabla (nota / tarea vinculada al movimiento) */}
			{actionMovId && (
				<ModalNotes
					open={noteModalOpen}
					setOpen={setNoteModalOpen}
					folderId={folderId}
					note={null}
					initialValues={{ movementRef: actionMovId, movementSource: "pjn" }}
				/>
			)}
			{actionMovId && (
				<ModalTasks
					open={taskModalOpen}
					setOpen={setTaskModalOpen}
					folderId={folderId}
					folderName=""
					editMode={false}
					taskToEdit={null}
					initialValues={{ movementRef: actionMovId, movementSource: "pjn" }}
				/>
			)}
			{actionMovId && (
				<Dialog
					open={eventModalOpen}
					onClose={() => setEventModalOpen(false)}
					maxWidth="sm"
					fullWidth
					sx={{ "& .MuiDialog-paper": { p: 0 } }}
				>
					<AddEventFrom
						event={null}
						range={null}
						onCancel={() => setEventModalOpen(false)}
						userId={eventUserId}
						folderId={folderId}
						movementRef={actionMovId}
						movementSource="pjn"
						defaultType="vencimiento"
					/>
				</Dialog>
			)}
		</Card>
	);
};

export default PjnMovementsViewerSection;
