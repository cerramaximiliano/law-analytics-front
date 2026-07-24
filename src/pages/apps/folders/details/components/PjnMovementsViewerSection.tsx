// PjnMovementsViewerSection — listado paginado del expediente PJN leído desde
// pjn-movements + viewer del PDF embebido (Fase 7a MVP).
//
// Es una sección nueva que coexiste con el MovementsTable clásico. No reemplaza
// nada existente. Si el folder no es PJN, no se renderiza.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Box,
	Chip,
	Dialog,
	IconButton,
	Pagination,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
	Alert,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Calendar, Clock, DocumentText, ExportSquare, Note1, TableDocument, TaskSquare, TickCircle } from "iconsax-react";
import dayjs from "utils/dayjs-config";
import PjnPdfViewer from "components/PjnPdfViewer";
import MovementsUpgradeBanner from "components/shared/MovementsUpgradeBanner";
import ModalNotes from "pages/apps/folders/details/modals/ModalNotes";
import ModalTasks from "pages/apps/folders/details/modals/MoldalTasks";
import AddEventFrom from "sections/apps/calendar/AddEventForm";
import { dispatch, useSelector } from "store";
import { getNotesByFolderId } from "store/reducers/notes";
import { getTasksByFolderId } from "store/reducers/tasks";
import { getEventsById } from "store/reducers/events";
import { openSnackbar } from "store/reducers/snackbar";
import { BRAND_BLUE } from "themes/dashboardTokens";
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
	// Acción rápida del deep-link (?action=vencimiento|nota|tarea, desde los botones
	// de la vista pública): auto-abre el visor del movimiento resaltado con el panel
	// lateral en la sub-pestaña correspondiente. A diferencia del highlight puro
	// (que NO auto-abre, decisión Fase 4), acá el usuario pidió explícitamente crear algo.
	quickAction?: "vencimiento" | "nota" | "tarea" | null;
	// ?open=1 (calendario / chips "Ir al movimiento"): auto-abre el visor del
	// movimiento resaltado, sin forzar sub-pestaña del panel. Los deep-links de
	// email siguen highlight-only.
	autoOpen?: boolean;
	// Búsqueda del toolbar de ActivityTables (rediseño 2026-07: un solo buscador —
	// esta sección ya NO renderiza el suyo). Se debounce-a acá adentro.
	searchQuery?: string;
	// Chip "Con documento" del toolbar del padre (uniforme con MEV/SCBA/EJE):
	// solo movimientos con documento (hasUrl).
	withDocuments?: boolean;
	// Rango de fechas (YYYY-MM-DD) — los date pickers viven en el toolbar del padre.
	dateFrom?: string;
	dateTo?: string;
	// Solo movimientos con notas/tareas/vencimientos vinculados (chip del toolbar).
	linkedOnly?: boolean;
	// Última sincronización de la causa — se muestra en la línea de info densa
	// (reemplaza al banner FolderSyncStatus para PJN).
	causaLastSyncDate?: string | null;
}

const QUICK_ACTION_TO_PANEL_TAB = {
	vencimiento: "vencimientos",
	nota: "notas",
	tarea: "tareas",
} as const;

// CausasX → label humano para la línea de info densa.
const CAUSA_TYPE_LABELS: Record<string, string> = {
	CausasCivil: "Civil",
	CausasTrabajo: "Trabajo",
	CausasSegSocial: "Seguridad Social",
	CausasComercial: "Comercial",
};

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

// Ícono de documento con el estado en tooltip (rediseño: un solo acento de
// marca en vez de chips multicolor — mismo lenguaje visual que la tabla
// clásica MEV/SCBA/EJE, que usa DocumentText Bulk en azul).
function pdfStatusChip(status: PjnMovementPdfStatus) {
	const meta: Partial<Record<PjnMovementPdfStatus, { label: string; active: boolean }>> = {
		downloaded: { label: "PDF disponible — abrir en el visor", active: true },
		pending: { label: "PDF pendiente de descarga", active: false },
		expired: { label: "PDF expirado en el portal", active: false },
		failed: { label: "La descarga del PDF falló", active: false },
	};
	const m = meta[status];
	if (!m) {
		return (
			<Typography component="span" variant="body2" sx={{ color: "text.disabled" }}>
				—
			</Typography>
		);
	}
	return (
		<Tooltip title={m.label}>
			<Box component="span" sx={{ display: "inline-flex", color: m.active ? BRAND_BLUE : "text.disabled" }}>
				<DocumentText size={18} variant={m.active ? "Bulk" : "Linear"} />
			</Box>
		</Tooltip>
	);
}

const PjnMovementsViewerSection = ({
	folderId,
	highlightMovementId,
	quickAction,
	autoOpen = false,
	searchQuery = "",
	withDocuments = false,
	dateFrom = "",
	dateTo = "",
	linkedOnly = false,
	causaLastSyncDate = null,
}: Props) => {
	const [page, setPage] = useState(1);
	const [limit] = useState(20);
	const [search, setSearch] = useState("");

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

	// Deep-link ?locate=: se manda UNA vez (primer fetch con highlight); el server
	// salta a la página del movimiento o responde outside_plan/not_found.
	const locateConsumedRef = useRef(false);
	useEffect(() => {
		locateConsumedRef.current = false;
	}, [highlightMovementId]);

	const fetchData = useCallback(async () => {
		setLoading(true);
		setError(null);
		const locate = highlightMovementId && !locateConsumedRef.current ? highlightMovementId : undefined;
		try {
			const res = await getPjnMovementsByFolder(folderId, {
				page,
				limit,
				search: search || undefined,
				hasUrl: withDocuments ? true : undefined,
				dateFrom: dateFrom || undefined,
				dateTo: dateTo || undefined,
				hasLinked: linkedOnly || undefined,
				locate,
			});
			if (locate) {
				locateConsumedRef.current = true;
				if (res.locateStatus === "ok" && res.locatedPage && res.locatedPage !== page) {
					// La respuesta ya ES la página del movimiento — sincronizamos el
					// estado local. El refetch que dispara es idempotente (misma página).
					setPage(res.locatedPage);
				} else if (res.locateStatus === "outside_plan") {
					dispatch(
						openSnackbar({
							open: true,
							message:
								"El movimiento vinculado no está entre los movimientos visibles de tu plan. Actualizá tu plan para ver el historial completo.",
							variant: "alert",
							alert: { color: "warning" },
							close: true,
						}),
					);
				} else if (res.locateStatus === "not_found") {
					dispatch(
						openSnackbar({
							open: true,
							message: "El movimiento vinculado ya no está disponible en el expediente.",
							variant: "alert",
							alert: { color: "warning" },
							close: true,
						}),
					);
				}
			}
			setData(res);
		} catch (err: any) {
			setError(err?.response?.data?.message ?? err?.message ?? "Error al cargar movimientos");
		} finally {
			setLoading(false);
		}
	}, [folderId, page, limit, search, withDocuments, dateFrom, dateTo, linkedOnly, highlightMovementId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Debounce simple del search del toolbar (350ms)
	useEffect(() => {
		const t = setTimeout(() => {
			if (searchQuery !== search) {
				setPage(1);
				setSearch(searchQuery);
			}
		}, 350);
		return () => clearTimeout(t);
	}, [searchQuery, search]);

	// Cambio de filtros del toolbar (PDF / rango de fechas / vinculados) → volver a página 1.
	useEffect(() => {
		setPage(1);
	}, [withDocuments, dateFrom, dateTo, linkedOnly]);

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

	// Fecha del vencimiento vinculado por movementRef, para la columna
	// "Vencimiento" (paridad con MovementsTable): el próximo por vencer; si
	// todos pasaron, el más reciente.
	const eventDueByMov = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const byMov: Record<string, Date[]> = {};
		(folderEvents as CalendarEvent[]).forEach((e) => {
			if (!e.movementRef || !e.start) return;
			const d = new Date(e.start);
			if (isNaN(d.getTime())) return;
			(byMov[e.movementRef] = byMov[e.movementRef] || []).push(d);
		});
		const map: Record<string, Date> = {};
		Object.entries(byMov).forEach(([ref, dates]) => {
			const upcoming = dates.filter((d) => d >= today).sort((a, b) => a.getTime() - b.getTime());
			map[ref] = upcoming[0] ?? dates.sort((a, b) => b.getTime() - a.getTime())[0];
		});
		return map;
	}, [folderEvents]);

	// Chip de fecha de vencimiento (rojo vencido / amarillo próximo) — mismo
	// render que la columna Vencimiento de MovementsTable.
	const renderLinkedDueChip = (d: Date) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const isExpired = d < today;
		const days = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		const isNear = days >= 0 && days <= 7;
		return (
			<Stack direction="row" spacing={0.5} alignItems="center">
				<Chip
					label={d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
					color={isExpired ? "error" : isNear ? "warning" : "success"}
					size="small"
					variant={isExpired ? "filled" : "outlined"}
					icon={isExpired || isNear ? <Clock size={14} style={{ color: "inherit" }} /> : undefined}
					sx={{ fontWeight: isExpired ? 600 : 500, "& .MuiChip-icon": { marginLeft: "4px", marginRight: "-2px" } }}
				/>
				{isExpired && (
					<Typography variant="caption" color="error" fontWeight={600}>
						Vencido
					</Typography>
				)}
				{isNear && !isExpired && (
					<Typography variant="caption" color="warning.main" fontWeight={500}>
						{days === 0 ? "Hoy" : `${days}d`}
					</Typography>
				)}
			</Stack>
		);
	};

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

	// Si cambia el movimiento objetivo (ej. el usuario clickea otro chip de
	// vínculo sin desmontar la sección), reabrir el scroll para el nuevo id.
	useEffect(() => {
		hasScrolledToHighlight.current = false;
	}, [highlightMovementId]);

	// Acción rápida del deep-link: auto-abrir el visor del movimiento resaltado con
	// el panel en la sub-pestaña pedida (una sola vez por combinación id+acción).
	const [autoPanelTab, setAutoPanelTab] = useState<"notas" | "tareas" | "vencimientos" | null>(null);
	const hasAutoOpened = useRef(false);
	useEffect(() => {
		hasAutoOpened.current = false;
	}, [highlightMovementId, quickAction, autoOpen]);
	useEffect(() => {
		if ((!quickAction && !autoOpen) || !highlightMovementId || hasAutoOpened.current) return;
		const idx = movements.findIndex((m) => m._id === highlightMovementId);
		if (idx === -1) return;
		hasAutoOpened.current = true;
		if (quickAction) setAutoPanelTab(QUICK_ACTION_TO_PANEL_TAB[quickAction]);
		setSelectedIdx(idx);
		setViewerOpen(true);
	}, [quickAction, autoOpen, highlightMovementId, movements]);

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
	if (data && total === 0 && !search && !withDocuments && !dateFrom && !dateTo && data.message?.includes("no tiene causa PJN")) {
		return null; // No renderizar nada — mejor UX para folders no-PJN
	}

	const causaTypeLabel = data?.causa?.causaType ? CAUSA_TYPE_LABELS[data.causa.causaType] || data.causa.causaType : null;

	return (
		<Box>
			{/* Línea de info densa: reemplaza al CardHeader "Expediente PJN" + el banner
			    FolderSyncStatus (rediseño 2026-07 — menos chrome, la tabla más arriba). */}
			<Stack
				direction="row"
				alignItems="center"
				flexWrap="wrap"
				columnGap={1.25}
				rowGap={0.5}
				sx={(t) => ({ px: 2, py: 1, borderBottom: `1px solid ${t.palette.divider}` })}
			>
				<Typography
					sx={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
				>
					Expediente PJN
				</Typography>
				{data && (
					<Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
						{total.toLocaleString("es-AR")} movimientos
						{causaTypeLabel ? ` · ${causaTypeLabel}` : ""}
					</Typography>
				)}
				{causaLastSyncDate && (
					<Tooltip title={dayjs(causaLastSyncDate).format("DD/MM/YYYY HH:mm")}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "success.main" }} />
							<Typography variant="caption" color="text.secondary">
								sincronizado {dayjs(causaLastSyncDate).fromNow()}
							</Typography>
						</Stack>
					</Tooltip>
				)}
			</Stack>

			<Box sx={{ p: 2, pt: 1.5 }}>
				{/* Banner de upgrade (plan free): componente UNIFICADO — mismo diseño y
				    copy que la tabla clásica y la Vista combinada. */}
				{requiresUpgrade && <MovementsUpgradeBanner previewCount={movements.length} totalMovements={total} unlockSuffix=" y los PDF" />}

				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				{loading && (
					<Stack spacing={0.75} sx={{ py: 1 }}>
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton key={i} variant="rounded" height={44} />
						))}
					</Stack>
				)}

				{!loading && movements.length === 0 && !error && (
					// Empty state con ícono — mismo bloque visual que MovementsTable
					<Stack alignItems="center" spacing={1.5} sx={{ py: 5 }}>
						<Box
							sx={(t) => ({
								width: 56,
								height: 56,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, t.palette.mode === "dark" ? 0.14 : 0.08),
								border: `1px solid ${alpha(BRAND_BLUE, t.palette.mode === "dark" ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
							})}
						>
							<TableDocument size={28} variant="Bulk" />
						</Box>
						<Stack alignItems="center" spacing={0.375}>
							<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.015em" }}>
								{linkedOnly
									? "Sin movimientos con vinculados"
									: search || withDocuments || dateFrom || dateTo
									? "Sin resultados"
									: "Sin movimientos registrados"}
							</Typography>
							<Typography
								sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em", maxWidth: 360, textAlign: "center" }}
							>
								{linkedOnly
									? "Ningún movimiento tiene notas, tareas o vencimientos vinculados. Podés crearlos desde las acciones de cada fila o desde el visor."
									: search || withDocuments || dateFrom || dateTo
									? "No hay movimientos que coincidan con los filtros."
									: "Los movimientos del expediente aparecerán acá cuando se sincronicen."}
							</Typography>
						</Stack>
					</Stack>
				)}

				{!loading && movements.length > 0 && (
					<>
						{/* maxHeight en desktop: la tabla scrollea adentro con el header sticky
						    (1.100+ movimientos sin perder las columnas de vista). En mobile
						    fluye con la página (scroll anidado en touch es incómodo). */}
						<TableContainer sx={{ maxHeight: { md: "calc(100vh - 340px)" } }}>
							<Table size="small" stickyHeader>
								<TableHead>
									<TableRow>
										<TableCell sx={{ width: 110 }}>Fecha</TableCell>
										<TableCell sx={{ width: 200 }}>Tipo</TableCell>
										<TableCell>Detalle</TableCell>
										<TableCell sx={{ width: 130 }}>Vencimiento</TableCell>
										<TableCell sx={{ width: 100 }} align="center">
											Documento
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
													// No leído: toda la fila en negrita (no solo el tipo)
													...(!m.read && {
														"& .MuiTableCell-root": { fontWeight: 700, color: "text.primary" },
														"& .MuiTableCell-root .MuiTypography-root": { fontWeight: 700 },
													}),
													...(isHighlighted && {
														bgcolor: alpha(theme.palette.primary.main, 0.12),
														"&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.18) },
													}),
												})}
												onClick={() => handleOpenViewer(idx)}
											>
												<TableCell sx={{ fontVariantNumeric: "tabular-nums", color: "text.secondary", whiteSpace: "nowrap" }}>
													{formatDate(m.fecha)}
												</TableCell>
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
												<TableCell>{eventDueByMov[m._id] ? renderLinkedDueChip(eventDueByMov[m._id]) : "—"}</TableCell>
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
														{/* Slot documento SIEMPRE presente (placeholder si no hay nada que
														    abrir) — mantiene los botones alineados entre filas. */}
														{m.hasPdf ? (
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
														) : m.url ? (
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
														) : (
															<Box sx={{ width: 28, height: 28 }} />
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
									{/* Filas blureadas para usuarios free (paridad con MovementsTable) */}
									{requiresUpgrade && total > movements.length && (
										<>
											{[...Array(Math.min(3, total - movements.length))].map((_, index) => (
												<TableRow
													key={`blurred-row-${index}`}
													sx={(t) => ({
														position: "relative",
														"&::after": {
															content: '""',
															position: "absolute",
															top: 0,
															left: 0,
															right: 0,
															bottom: 0,
															backdropFilter: "blur(2px)",
															backgroundColor: t.palette.mode === "dark" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.2)",
															pointerEvents: "none",
															zIndex: 1,
														},
													})}
												>
													<TableCell sx={{ color: "text.disabled", fontVariantNumeric: "tabular-nums" }}>
														{["12/05/2024", "03/04/2024", "27/02/2024"][index % 3]}
													</TableCell>
													<TableCell>
														<Typography variant="body2" sx={{ color: "text.disabled", fontWeight: 500 }}>
															{["Despacho", "Cédula", "Escrito-Actor"][index % 3]}
														</Typography>
													</TableCell>
													<TableCell>
														<Typography variant="body2" sx={{ color: "text.disabled" }}>
															{
																[
																	"Providencia simple - Téngase presente",
																	"Notificación electrónica al demandado",
																	"Vista al actor por el término de ley",
																][index % 3]
															}
														</Typography>
													</TableCell>
													<TableCell>
														<Typography variant="body2" sx={{ color: "text.disabled" }}>
															—
														</Typography>
													</TableCell>
													<TableCell align="center">
														<Box component="span" sx={{ display: "inline-flex", color: "text.disabled", opacity: 0.5 }}>
															<DocumentText size={18} />
														</Box>
													</TableCell>
													<TableCell align="right">
														<Stack direction="row" spacing={0.5} justifyContent="flex-end" sx={{ opacity: 0.3 }}>
															<IconButton size="small" disabled>
																<DocumentText size={18} />
															</IconButton>
														</Stack>
													</TableCell>
												</TableRow>
											))}
										</>
									)}
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
			</Box>

			<PjnPdfViewer
				open={viewerOpen}
				onClose={() => {
					setViewerOpen(false);
					// El auto-tab es de un solo uso: aperturas manuales posteriores no lo heredan.
					setAutoPanelTab(null);
				}}
				folderId={folderId}
				movement={selected}
				initialPanelTab={autoPanelTab}
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
		</Box>
	);
};

export default PjnMovementsViewerSection;
