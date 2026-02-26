import React, { useEffect, useMemo, useCallback, useState } from "react";
import {
	Box,
	IconButton,
	Typography,
	Chip,
	Stack,
	Tooltip,
	Divider,
	CircularProgress,
	LinearProgress,
	Fade,
	Button,
	TextField,
	alpha,
	useTheme,
	Badge,
} from "@mui/material";
import {
	Add,
	Edit,
	Calendar,
	Clock,
	TickCircle,
	NoteText,
	Task,
	DocumentText,
	Warning2,
	ArrowLeft,
	ArrowLeft2,
	ArrowRight2,
	HambergerMenu,
	Category,
	CloseCircle,
	TickSquare,
} from "iconsax-react";
import { AnimatePresence, motion } from "framer-motion";
import { Movement, PaginationInfo } from "types/movements";
import { Note } from "types/note";
import { TaskType } from "types/task";
import usePdfBlobLoader from "hooks/usePdfBlobLoader";
import usePdfTextDetection from "hooks/usePdfTextDetection";
import { getMovementIcon, getMovementColor, formatDate, parseDate } from "pages/apps/folders/details/components/utils/movementUtils";
import axios from "utils/axios";
import { useTeam } from "contexts/TeamContext";
import LogoIcon from "components/logo/LogoIcon";

interface DocumentExplorerProps {
	open: boolean;
	onClose: () => void;
	initialMovement: Movement | null;
	movements: Movement[];
	pagination?: PaginationInfo;
	totalWithLinks?: number;
	documentsBeforeThisPage?: number;
	isLoading?: boolean;
	onRequestPage: (page: number) => Promise<void>;
	folderId: string;
	folderName: string;
	onCreateTask: (movement: Movement) => void;
	onAddNote: (movement: Movement) => void;
	onEditMovement: (movement: Movement) => void;
	onToggleComplete: (movementId: string) => void;
}

const SIDEBAR_WIDTH = 280;
const RIGHT_SIDEBAR_WIDTH = 240;

// Helper: stable key for a movement (works for PJN without _id)
const getMovementKey = (movement: Movement): string => {
	if (movement._id) return movement._id;
	if (movement.link) return movement.link;
	return `${movement.time}-${movement.title}`;
};

const DocumentExplorer: React.FC<DocumentExplorerProps> = ({
	open,
	onClose,
	initialMovement,
	movements,
	pagination,
	totalWithLinks = 0,
	documentsBeforeThisPage = 0,
	isLoading = false,
	onRequestPage,
	folderId,
	folderName,
	onCreateTask,
	onAddNote,
	onEditMovement,
	onToggleComplete,
}) => {
	const theme = useTheme();
	const { getRequestHeaders, getTeamIdForResource, getUserIdForResource } = useTeam();
	const [sidebarOpen, setSidebarOpen] = React.useState(true);
	const [activeMovement, setActiveMovement] = React.useState<Movement | null>(initialMovement);
	const [isLoadingPage, setIsLoadingPage] = React.useState(false);

	// Inline form state
	const [inlineForm, setInlineForm] = useState<"task" | "note" | null>(null);
	const [inlineTaskName, setInlineTaskName] = useState("");
	const [inlineTaskDate, setInlineTaskDate] = useState("");
	const [inlineNoteTitle, setInlineNoteTitle] = useState("");
	const [inlineNoteContent, setInlineNoteContent] = useState("");
	const [inlineSubmitting, setInlineSubmitting] = useState(false);

	// Sync activeMovement when initialMovement changes
	useEffect(() => {
		if (initialMovement) {
			setActiveMovement(initialMovement);
		}
	}, [initialMovement]);

	// Sync activeMovement with store (keep updated data)
	const syncedActiveMovement = useMemo(() => {
		if (!activeMovement) return null;
		const activeKey = getMovementKey(activeMovement);
		const updated = movements.find((m) => getMovementKey(m) === activeKey);
		return updated || activeMovement;
	}, [activeMovement, movements]);

	// Filter movements with links
	const movementsWithLinks = useMemo(() => movements.filter((m) => m.link), [movements]);

	// PDF loader
	const { blobUrl, loading, error, loadProgress, showProgress, handleIframeLoad, handleIframeError } = usePdfBlobLoader({
		url: syncedActiveMovement?.link || "",
		enabled: open && !!syncedActiveMovement?.link,
	});

	// Text detection
	const { hasText, isChecking } = usePdfTextDetection({
		blobUrl,
		movementId: syncedActiveMovement?._id || "",
		enabled: open && !!blobUrl && !loading && !error,
	});

	// Expiration info for active movement
	const expirationInfo = useMemo(() => {
		if (!syncedActiveMovement?.dateExpiration) return null;
		const expirationDate = parseDate(syncedActiveMovement.dateExpiration);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const isExpired = !syncedActiveMovement.completed && expirationDate < today;
		const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		const isNearExpiration = !syncedActiveMovement.completed && daysUntilExpiration >= 0 && daysUntilExpiration <= 7;
		return { isExpired, isNearExpiration, daysUntilExpiration, formatted: formatDate(syncedActiveMovement.dateExpiration) };
	}, [syncedActiveMovement?.dateExpiration, syncedActiveMovement?.completed]);

	const isManualMovement = syncedActiveMovement?.source !== "pjn" && syncedActiveMovement?.source !== "mev";

	// Compute movementRef for the active movement
	const movementRef = useMemo(() => {
		if (!syncedActiveMovement) return null;
		return syncedActiveMovement.source === "pjn" ? syncedActiveMovement.link : syncedActiveMovement._id;
	}, [syncedActiveMovement]);

	// Linked notes and tasks
	const [linkedNotes, setLinkedNotes] = useState<Note[]>([]);
	const [linkedTasks, setLinkedTasks] = useState<TaskType[]>([]);
	const [linkedLoading, setLinkedLoading] = useState(false);
	const [linkedVersion, setLinkedVersion] = useState(0);

	// Fetch linked notes/tasks when movement changes
	useEffect(() => {
		if (!open || !folderId || !movementRef) {
			setLinkedNotes([]);
			setLinkedTasks([]);
			return;
		}

		let cancelled = false;
		const fetchLinked = async () => {
			setLinkedLoading(true);
			try {
				const headers = getRequestHeaders();
				const [notesRes, tasksRes] = await Promise.all([
					axios.get(`/api/notes/folder/${folderId}`, { params: { movementRef }, headers }),
					axios.get(`/api/tasks/folder/${folderId}`, { params: { movementRef }, headers }),
				]);
				if (!cancelled) {
					setLinkedNotes(notesRes.data?.notes || []);
					setLinkedTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
				}
			} catch {
				if (!cancelled) {
					setLinkedNotes([]);
					setLinkedTasks([]);
				}
			} finally {
				if (!cancelled) setLinkedLoading(false);
			}
		};
		fetchLinked();
		return () => {
			cancelled = true;
		};
	}, [open, folderId, movementRef, linkedVersion]);

	// Body scroll lock
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	// Escape key handler
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && open) {
				if (inlineForm) {
					setInlineForm(null);
				} else {
					onClose();
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onClose, inlineForm]);

	// Handle sidebar movement selection
	const handleSelectMovement = useCallback((movement: Movement) => {
		setActiveMovement(movement);
		setInlineForm(null);
	}, []);

	// Sidebar pagination
	const handlePreviousPage = useCallback(async () => {
		if (pagination?.hasPrev && !isLoadingPage) {
			setIsLoadingPage(true);
			await onRequestPage(pagination.page - 1);
			setIsLoadingPage(false);
		}
	}, [pagination, isLoadingPage, onRequestPage]);

	const handleNextPage = useCallback(async () => {
		if (pagination?.hasNext && !isLoadingPage) {
			setIsLoadingPage(true);
			await onRequestPage(pagination.page + 1);
			setIsLoadingPage(false);
		}
	}, [pagination, isLoadingPage, onRequestPage]);

	// Compute active index in sidebar for global position
	const activeIndexInPage = useMemo(() => {
		if (!syncedActiveMovement) return -1;
		const activeKey = getMovementKey(syncedActiveMovement);
		return movementsWithLinks.findIndex((m) => getMovementKey(m) === activeKey);
	}, [movementsWithLinks, syncedActiveMovement]);

	const globalPosition = useMemo(() => {
		if (activeIndexInPage >= 0 && documentsBeforeThisPage >= 0) {
			return documentsBeforeThisPage + activeIndexInPage + 1;
		}
		return 0;
	}, [activeIndexInPage, documentsBeforeThisPage]);

	// Inline form handlers
	const handleOpenInlineTask = () => {
		if (!syncedActiveMovement) return;
		setInlineForm("task");
		setInlineTaskName(`[${syncedActiveMovement.movement}] ${syncedActiveMovement.title}`);
		setInlineTaskDate(syncedActiveMovement.dateExpiration ? formatDate(syncedActiveMovement.dateExpiration) : "");
		setInlineNoteTitle("");
		setInlineNoteContent("");
	};

	const handleOpenInlineNote = () => {
		if (!syncedActiveMovement) return;
		setInlineForm("note");
		setInlineNoteTitle(`Nota: ${syncedActiveMovement.title}`);
		setInlineNoteContent(syncedActiveMovement.description || "");
		setInlineTaskName("");
		setInlineTaskDate("");
	};

	const handleCancelInline = () => {
		setInlineForm(null);
	};

	const handleSubmitInlineTask = async () => {
		if (!inlineTaskName.trim() || !inlineTaskDate.trim() || !syncedActiveMovement) return;
		setInlineSubmitting(true);
		try {
			await axios.post(
				"/api/tasks",
				{
					name: inlineTaskName.trim(),
					dueDate: inlineTaskDate.trim(),
					description: "",
					checked: false,
					folderId,
					userId: getUserIdForResource(),
					groupId: getTeamIdForResource(),
					movementRef: movementRef || undefined,
					movementSource: syncedActiveMovement.source || undefined,
				},
				{ headers: getRequestHeaders() },
			);
			setInlineForm(null);
			setLinkedVersion((v) => v + 1);
		} catch {
			// Error silencioso - el usuario verá que no se creó
		} finally {
			setInlineSubmitting(false);
		}
	};

	const handleSubmitInlineNote = async () => {
		if (!inlineNoteTitle.trim() || !syncedActiveMovement) return;
		setInlineSubmitting(true);
		try {
			await axios.post(
				"/api/notes/create",
				{
					title: inlineNoteTitle.trim(),
					content: inlineNoteContent.trim(),
					folderId,
					userId: getUserIdForResource(),
					groupId: getTeamIdForResource(),
					movementRef: movementRef || undefined,
					movementSource: syncedActiveMovement.source || undefined,
				},
				{ headers: getRequestHeaders() },
			);
			setInlineForm(null);
			setLinkedVersion((v) => v + 1);
		} catch {
			// Error silencioso
		} finally {
			setInlineSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			{open && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						style={{
							position: "fixed",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: "rgba(0, 0, 0, 0.5)",
							zIndex: theme.zIndex.modal + 10,
						}}
						onClick={onClose}
					/>

					{/* Main overlay container */}
					<motion.div
						initial={{ opacity: 0, scale: 0.97 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.97 }}
						transition={{ duration: 0.25, ease: "easeOut" }}
						style={{
							position: "fixed",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							zIndex: theme.zIndex.modal + 11,
							display: "flex",
							flexDirection: "column",
							backgroundColor: theme.palette.background.default,
						}}
					>
						{/* Top bar */}
						<Box
							sx={{
								height: 56,
								display: "flex",
								alignItems: "center",
								px: 2,
								borderBottom: `1px solid ${theme.palette.divider}`,
								bgcolor: theme.palette.background.paper,
								flexShrink: 0,
								gap: 1,
							}}
						>
							{/* Back button */}
							<Tooltip title="Volver (Esc)">
								<IconButton onClick={onClose} size="small">
									<ArrowLeft size={20} />
								</IconButton>
							</Tooltip>

							{/* Toggle sidebar */}
							<Tooltip title={sidebarOpen ? "Ocultar panel de documentos" : "Mostrar panel de documentos"}>
								<IconButton onClick={() => setSidebarOpen((prev) => !prev)} size="small">
									<HambergerMenu size={20} />
								</IconButton>
							</Tooltip>

							<Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

							{/* Movement title and metadata */}
							{syncedActiveMovement && (
								<Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
									<Typography
										variant="subtitle1"
										fontWeight={600}
										sx={{
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
											maxWidth: 400,
										}}
									>
										{syncedActiveMovement.title}
									</Typography>

									<Chip
										icon={getMovementIcon(syncedActiveMovement.movement)}
										label={syncedActiveMovement.movement}
										color={getMovementColor(syncedActiveMovement.movement)}
										size="small"
										variant="outlined"
									/>

									<Chip
										icon={<Calendar size={14} />}
										label={formatDate(syncedActiveMovement.time)}
										size="small"
										variant="outlined"
										sx={{ "& .MuiChip-icon": { ml: "4px", mr: "-2px" } }}
									/>

									{syncedActiveMovement.source && (
										<Chip
											label={syncedActiveMovement.source === "pjn" ? "PJN" : "MEV"}
											size="small"
											color="info"
											variant="outlined"
											sx={{ height: 20, fontSize: "0.7rem" }}
										/>
									)}

									{/* Text detection badge */}
									{isChecking ? (
										<Stack direction="row" spacing={0.5} alignItems="center">
											<CircularProgress size={12} />
											<Typography variant="caption" color="text.secondary">
												Analizando...
											</Typography>
										</Stack>
									) : hasText !== null ? (
										hasText ? (
											<Chip label="Texto disponible" size="small" color="success" variant="outlined" sx={{ height: 22, fontSize: "0.7rem" }} />
										) : (
											<Chip
												label="Documento escaneado"
												size="small"
												color="warning"
												variant="outlined"
												sx={{ height: 22, fontSize: "0.7rem" }}
											/>
										)
									) : null}

									{/* Position indicator */}
									{globalPosition > 0 && totalWithLinks > 0 && (
										<Typography variant="caption" color="text.secondary" sx={{ ml: "auto !important", flexShrink: 0 }}>
											{globalPosition} / {totalWithLinks}
										</Typography>
									)}
								</Stack>
							)}

							{/* App logo */}
							<Box sx={{ ml: "auto", flexShrink: 0, display: "flex", alignItems: "center", opacity: 0.6 }}>
								<LogoIcon />
							</Box>
						</Box>

						{/* Body: sidebar + PDF + right sidebar */}
						<Box sx={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
							{/* Left Sidebar */}
							<AnimatePresence initial={false}>
								{sidebarOpen && (
									<motion.div
										initial={{ width: 0, opacity: 0 }}
										animate={{ width: SIDEBAR_WIDTH, opacity: 1 }}
										exit={{ width: 0, opacity: 0 }}
										transition={{ type: "spring", stiffness: 400, damping: 35 }}
										style={{
											overflow: "hidden",
											borderRight: `1px solid ${theme.palette.divider}`,
											display: "flex",
											flexDirection: "column",
											flexShrink: 0,
											backgroundColor: theme.palette.background.paper,
										}}
									>
										{/* Sidebar header */}
										<Box
											sx={{
												p: 1.5,
												borderBottom: `1px solid ${theme.palette.divider}`,
												flexShrink: 0,
												bgcolor: alpha(theme.palette.primary.main, 0.04),
											}}
										>
											<Stack direction="row" alignItems="center" spacing={1}>
												<Typography variant="subtitle2" fontWeight={600}>
													Documentos
												</Typography>
												{totalWithLinks > 0 && (
													<Badge
														badgeContent={totalWithLinks}
														color="primary"
														max={999}
														sx={{
															"& .MuiBadge-badge": {
																fontSize: "0.65rem",
																height: 18,
																minWidth: 18,
															},
														}}
													>
														<Box sx={{ width: 8 }} />
													</Badge>
												)}
											</Stack>
											{pagination && pagination.pages > 1 && (
												<Typography variant="caption" color="text.secondary">
													Pág. {pagination.page} de {pagination.pages}
												</Typography>
											)}
										</Box>

										{/* Sidebar scrollable list */}
										<Box
											sx={{
												flex: 1,
												overflowY: "auto",
												overflowX: "hidden",
												"&::-webkit-scrollbar": {
													width: 4,
												},
												"&::-webkit-scrollbar-thumb": {
													backgroundColor: alpha(theme.palette.text.primary, 0.15),
													borderRadius: 2,
												},
											}}
										>
											{isLoading || isLoadingPage ? (
												<Box display="flex" justifyContent="center" alignItems="center" py={4}>
													<CircularProgress size={24} />
												</Box>
											) : movementsWithLinks.length === 0 ? (
												<Box display="flex" justifyContent="center" alignItems="center" py={4} px={2}>
													<Typography variant="body2" color="text.secondary" textAlign="center">
														No hay documentos en esta página
													</Typography>
												</Box>
											) : (
												movementsWithLinks.map((movement) => {
													const movKey = getMovementKey(movement);
													const activeKey = syncedActiveMovement ? getMovementKey(syncedActiveMovement) : null;
													const isActive = movKey === activeKey;
													const movExpInfo = (() => {
														if (!movement.dateExpiration) return null;
														const expDate = parseDate(movement.dateExpiration);
														const today = new Date();
														today.setHours(0, 0, 0, 0);
														const expired = !movement.completed && expDate < today;
														const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
														const nearExp = !movement.completed && daysLeft >= 0 && daysLeft <= 7;
														return { expired, nearExp, daysLeft };
													})();

													return (
														<Box
															key={movKey}
															onClick={() => handleSelectMovement(movement)}
															sx={{
																p: 1.5,
																cursor: "pointer",
																borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : "3px solid transparent",
																bgcolor: isActive ? alpha(theme.palette.primary.main, 0.16) : "transparent",
																borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
																transition: "all 0.15s ease",
																"&:hover": {
																	bgcolor: isActive
																		? alpha(theme.palette.primary.main, 0.2)
																		: alpha(theme.palette.action.hover, 0.5),
																},
																minWidth: 0,
															}}
														>
															{/* Type chip + icon */}
															<Chip
																icon={getMovementIcon(movement.movement)}
																label={movement.movement}
																color={getMovementColor(movement.movement)}
																size="small"
																variant="outlined"
																sx={{ height: 22, fontSize: "0.7rem", mb: 0.5 }}
															/>

															{/* Title (2 lines max) */}
															<Typography
																variant="body2"
																fontWeight={isActive ? 600 : 400}
																sx={{
																	overflow: "hidden",
																	textOverflow: "ellipsis",
																	display: "-webkit-box",
																	WebkitLineClamp: 2,
																	WebkitBoxOrient: "vertical",
																	lineHeight: 1.3,
																	fontSize: "0.8rem",
																	mb: 0.5,
																}}
															>
																{movement.title}
															</Typography>

															{/* Date + expiration status */}
															<Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
																<Typography variant="caption" color="text.secondary" fontSize="0.7rem">
																	{formatDate(movement.time)}
																</Typography>
																{movement.completed && (
																	<TickCircle size={12} color={theme.palette.success.main} variant="Bold" />
																)}
																{movExpInfo?.expired && (
																	<Chip
																		label="Vencido"
																		size="small"
																		color="error"
																		variant="filled"
																		sx={{ height: 16, fontSize: "0.6rem", "& .MuiChip-label": { px: 0.5 } }}
																	/>
																)}
																{movExpInfo?.nearExp && !movExpInfo.expired && (
																	<Chip
																		label={
																			movExpInfo.daysLeft === 0
																				? "Hoy"
																				: `${movExpInfo.daysLeft}d`
																		}
																		size="small"
																		color="warning"
																		variant="outlined"
																		sx={{ height: 16, fontSize: "0.6rem", "& .MuiChip-label": { px: 0.5 } }}
																	/>
																)}
															</Stack>
														</Box>
													);
												})
											)}
										</Box>

										{/* Sidebar pagination footer */}
										{pagination && pagination.pages > 1 && (
											<Box
												sx={{
													p: 1,
													borderTop: `1px solid ${theme.palette.divider}`,
													flexShrink: 0,
													bgcolor: theme.palette.background.paper,
												}}
											>
												<Stack direction="row" justifyContent="space-between" alignItems="center">
													<Button
														size="small"
														startIcon={<ArrowLeft2 size={14} />}
														onClick={handlePreviousPage}
														disabled={!pagination.hasPrev || isLoadingPage}
														sx={{ textTransform: "none", fontSize: "0.75rem", minWidth: 0, px: 1 }}
													>
														Anterior
													</Button>
													<Typography variant="caption" color="text.secondary">
														{pagination.page}/{pagination.pages}
													</Typography>
													<Button
														size="small"
														endIcon={<ArrowRight2 size={14} />}
														onClick={handleNextPage}
														disabled={!pagination.hasNext || isLoadingPage}
														sx={{ textTransform: "none", fontSize: "0.75rem", minWidth: 0, px: 1 }}
													>
														Siguiente
													</Button>
												</Stack>
											</Box>
										)}
									</motion.div>
								)}
							</AnimatePresence>

							{/* Main PDF area */}
							<Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
								{/* Progress bar */}
								<Fade in={showProgress} unmountOnExit>
									<LinearProgress
										variant="determinate"
										value={loadProgress}
										sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, height: 3 }}
									/>
								</Fade>

								{/* Loading state */}
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

								{/* Error state */}
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
									</Box>
								)}

								{/* Empty state - no movement selected */}
								{!error && !syncedActiveMovement && !loading && (
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
										<Typography variant="h5" color="text.secondary" fontWeight={600}>
											Seleccioná un documento
										</Typography>
										<Typography variant="body2" color="text.secondary">
											Elegí un movimiento del panel lateral para ver su documento.
										</Typography>
									</Box>
								)}

								{/* Empty state - no blobUrl */}
								{!error && syncedActiveMovement && !blobUrl && !loading && (
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
										<Typography variant="h5" color="text.secondary" fontWeight={600}>
											Sin documento
										</Typography>
										<Typography variant="body1" color="text.secondary">
											Este movimiento no tiene un documento asociado.
										</Typography>
									</Box>
								)}

								{/* PDF iframe */}
								{!error && blobUrl && (
									<iframe
										key={blobUrl}
										src={blobUrl}
										width="100%"
										height="100%"
										style={{ border: "none", flex: 1 }}
										title={syncedActiveMovement?.title || "PDF Document"}
										onLoad={handleIframeLoad}
										onError={handleIframeError}
									/>
								)}
							</Box>

							{/* Right sidebar - Actions & Details */}
							<Box
								sx={{
									width: RIGHT_SIDEBAR_WIDTH,
									flexShrink: 0,
									borderLeft: `1px solid ${theme.palette.divider}`,
									bgcolor: theme.palette.background.paper,
									display: "flex",
									flexDirection: "column",
									overflowY: "auto",
									overflowX: "hidden",
									"&::-webkit-scrollbar": { width: 4 },
									"&::-webkit-scrollbar-thumb": {
										backgroundColor: alpha(theme.palette.text.primary, 0.15),
										borderRadius: 2,
									},
								}}
							>
								{/* Acciones rápidas */}
								<Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
									<Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
										Acciones rápidas
									</Typography>
									<Stack spacing={1}>
										<Button
											variant={inlineForm === "task" ? "contained" : "outlined"}
											size="small"
											startIcon={<Task size={16} />}
											disabled={!syncedActiveMovement}
											onClick={handleOpenInlineTask}
											sx={{ textTransform: "none", justifyContent: "flex-start", fontSize: "0.8rem" }}
										>
											Crear tarea
											{linkedTasks.length > 0 && (
												<Chip
													label={linkedTasks.length}
													size="small"
													color={inlineForm === "task" ? "default" : "primary"}
													sx={{ height: 18, fontSize: "0.65rem", ml: "auto", "& .MuiChip-label": { px: 0.5 } }}
												/>
											)}
										</Button>

										{/* Inline task form */}
										<AnimatePresence>
											{inlineForm === "task" && (
												<motion.div
													initial={{ opacity: 0, height: 0, marginTop: 0 }}
													animate={{ opacity: 1, height: "auto", marginTop: 8 }}
													exit={{ opacity: 0, height: 0, marginTop: 0 }}
													transition={{ duration: 0.2, ease: "easeOut" }}
													style={{ overflow: "hidden" }}
												>
													<Box
														sx={{
															p: 1.5,
															borderRadius: 2,
															bgcolor: theme.palette.background.default,
															border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
															boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
														}}
													>
														<Stack spacing={1.5}>
															<TextField
																size="small"
																label="Nombre"
																value={inlineTaskName}
																onChange={(e) => setInlineTaskName(e.target.value)}
																fullWidth
																autoFocus
																inputProps={{ style: { fontSize: "0.8rem" } }}
																InputLabelProps={{ style: { fontSize: "0.8rem" } }}
															/>
															<TextField
																size="small"
																label="Vencimiento (DD/MM/AAAA)"
																value={inlineTaskDate}
																onChange={(e) => setInlineTaskDate(e.target.value)}
																fullWidth
																placeholder="DD/MM/AAAA"
																inputProps={{ style: { fontSize: "0.8rem" } }}
																InputLabelProps={{ style: { fontSize: "0.8rem" } }}
															/>
															<Stack direction="row" spacing={1} justifyContent="flex-end">
																<Button size="small" onClick={handleCancelInline} disabled={inlineSubmitting} sx={{ textTransform: "none", fontSize: "0.75rem" }}>
																	Cancelar
																</Button>
																<Button
																	size="small"
																	variant="contained"
																	onClick={handleSubmitInlineTask}
																	disabled={!inlineTaskName.trim() || !inlineTaskDate.trim() || inlineSubmitting}
																	startIcon={inlineSubmitting ? <CircularProgress size={12} /> : <TickSquare size={14} />}
																	sx={{ textTransform: "none", fontSize: "0.75rem" }}
																>
																	Crear
																</Button>
															</Stack>
														</Stack>
													</Box>
												</motion.div>
											)}
										</AnimatePresence>

										<Button
											variant={inlineForm === "note" ? "contained" : "outlined"}
											size="small"
											startIcon={<NoteText size={16} />}
											disabled={!syncedActiveMovement}
											onClick={handleOpenInlineNote}
											sx={{ textTransform: "none", justifyContent: "flex-start", fontSize: "0.8rem" }}
										>
											Crear nota
											{linkedNotes.length > 0 && (
												<Chip
													label={linkedNotes.length}
													size="small"
													color={inlineForm === "note" ? "default" : "primary"}
													sx={{ height: 18, fontSize: "0.65rem", ml: "auto", "& .MuiChip-label": { px: 0.5 } }}
												/>
											)}
										</Button>

										{/* Inline note form */}
										<AnimatePresence>
											{inlineForm === "note" && (
												<motion.div
													initial={{ opacity: 0, height: 0, marginTop: 0 }}
													animate={{ opacity: 1, height: "auto", marginTop: 8 }}
													exit={{ opacity: 0, height: 0, marginTop: 0 }}
													transition={{ duration: 0.2, ease: "easeOut" }}
													style={{ overflow: "hidden" }}
												>
													<Box
														sx={{
															p: 1.5,
															borderRadius: 2,
															bgcolor: theme.palette.background.default,
															border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
															boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
														}}
													>
														<Stack spacing={1.5}>
															<TextField
																size="small"
																label="Título"
																value={inlineNoteTitle}
																onChange={(e) => setInlineNoteTitle(e.target.value)}
																fullWidth
																autoFocus
																inputProps={{ style: { fontSize: "0.8rem" } }}
																InputLabelProps={{ style: { fontSize: "0.8rem" } }}
															/>
															<TextField
																size="small"
																label="Contenido"
																value={inlineNoteContent}
																onChange={(e) => setInlineNoteContent(e.target.value)}
																fullWidth
																multiline
																rows={3}
																inputProps={{ style: { fontSize: "0.8rem" } }}
																InputLabelProps={{ style: { fontSize: "0.8rem" } }}
															/>
															<Stack direction="row" spacing={1} justifyContent="flex-end">
																<Button size="small" onClick={handleCancelInline} disabled={inlineSubmitting} sx={{ textTransform: "none", fontSize: "0.75rem" }}>
																	Cancelar
																</Button>
																<Button
																	size="small"
																	variant="contained"
																	onClick={handleSubmitInlineNote}
																	disabled={!inlineNoteTitle.trim() || inlineSubmitting}
																	startIcon={inlineSubmitting ? <CircularProgress size={12} /> : <TickSquare size={14} />}
																	sx={{ textTransform: "none", fontSize: "0.75rem" }}
																>
																	Crear
																</Button>
															</Stack>
														</Stack>
													</Box>
												</motion.div>
											)}
										</AnimatePresence>

										{isManualMovement && (
											<Button
												variant="outlined"
												size="small"
												startIcon={<Edit size={16} />}
												disabled={!syncedActiveMovement}
												onClick={() => syncedActiveMovement && onEditMovement(syncedActiveMovement)}
												sx={{ textTransform: "none", justifyContent: "flex-start", fontSize: "0.8rem" }}
											>
												Editar
											</Button>
										)}
										{syncedActiveMovement?.dateExpiration && (
											<Button
												variant={syncedActiveMovement.completed ? "contained" : "outlined"}
												size="small"
												color={syncedActiveMovement.completed ? "success" : "inherit"}
												startIcon={
													<TickCircle size={16} variant={syncedActiveMovement.completed ? "Bold" : "Linear"} />
												}
												onClick={() => syncedActiveMovement._id && onToggleComplete(syncedActiveMovement._id)}
												sx={{ textTransform: "none", justifyContent: "flex-start", fontSize: "0.8rem" }}
											>
												{syncedActiveMovement.completed ? "Completado" : "Completar"}
											</Button>
										)}
									</Stack>
								</Box>

								{/* Detalles del movimiento */}
								{syncedActiveMovement && (
									<Box sx={{ p: 1.5 }}>
										<Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
											Detalles
										</Typography>
										<Stack spacing={1.5}>
											{/* Tipo */}
											<Chip
												icon={getMovementIcon(syncedActiveMovement.movement)}
												label={syncedActiveMovement.movement}
												color={getMovementColor(syncedActiveMovement.movement)}
												size="small"
												variant="outlined"
												sx={{ alignSelf: "flex-start" }}
											/>

											{/* Fecha de dictado */}
											<Stack direction="row" spacing={0.5} alignItems="center">
												<Calendar size={14} color={theme.palette.text.secondary} />
												<Typography variant="caption" color="text.secondary">
													{formatDate(syncedActiveMovement.time)}
												</Typography>
											</Stack>

											{/* Vencimiento */}
											{expirationInfo && (
												<Stack spacing={0.5}>
													<Stack direction="row" spacing={0.5} alignItems="center">
														<Clock size={14} color={theme.palette.text.secondary} />
														<Typography variant="caption" color="text.secondary">
															Vence: {expirationInfo.formatted}
														</Typography>
													</Stack>
													{syncedActiveMovement.completed ? (
														<Chip
															label="Completado"
															size="small"
															color="success"
															variant="filled"
															sx={{ height: 20, fontSize: "0.7rem", alignSelf: "flex-start" }}
														/>
													) : expirationInfo.isExpired ? (
														<Chip
															label="Vencido"
															size="small"
															color="error"
															variant="filled"
															sx={{ height: 20, fontSize: "0.7rem", alignSelf: "flex-start" }}
														/>
													) : expirationInfo.isNearExpiration ? (
														<Chip
															label={
																expirationInfo.daysUntilExpiration === 0
																	? "Vence hoy"
																	: `Vence en ${expirationInfo.daysUntilExpiration}d`
															}
															size="small"
															color="warning"
															variant="outlined"
															sx={{ height: 20, fontSize: "0.7rem", alignSelf: "flex-start" }}
														/>
													) : null}
												</Stack>
											)}

											{/* Fuente */}
											{syncedActiveMovement.source && (
												<Chip
													label={syncedActiveMovement.source === "pjn" ? "PJN" : "MEV"}
													size="small"
													color="info"
													variant="outlined"
													sx={{ height: 20, fontSize: "0.7rem", alignSelf: "flex-start" }}
												/>
											)}

											{/* Descripción */}
											{syncedActiveMovement.description && (
												<Typography
													variant="caption"
													color="text.secondary"
													sx={{
														overflow: "hidden",
														textOverflow: "ellipsis",
														display: "-webkit-box",
														WebkitLineClamp: 4,
														WebkitBoxOrient: "vertical",
														lineHeight: 1.4,
													}}
												>
													{syncedActiveMovement.description}
												</Typography>
											)}

											{/* Text detection */}
											{isChecking ? (
												<Stack direction="row" spacing={0.5} alignItems="center">
													<CircularProgress size={12} />
													<Typography variant="caption" color="text.secondary">
														Analizando...
													</Typography>
												</Stack>
											) : hasText !== null ? (
												hasText ? (
													<Chip
														label="Texto disponible"
														size="small"
														color="success"
														variant="outlined"
														sx={{ height: 22, fontSize: "0.7rem", alignSelf: "flex-start" }}
													/>
												) : (
													<Chip
														label="Documento escaneado"
														size="small"
														color="warning"
														variant="outlined"
														sx={{ height: 22, fontSize: "0.7rem", alignSelf: "flex-start" }}
													/>
												)
											) : null}
										</Stack>
									</Box>
								)}

								{/* Vinculados (notas y tareas del movimiento) */}
								{syncedActiveMovement && movementRef && (
									<>
										<Divider />
										<Box sx={{ p: 1.5 }}>
											<Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
												Vinculados
											</Typography>
											{linkedLoading ? (
												<Stack direction="row" spacing={0.5} alignItems="center" sx={{ py: 1 }}>
													<CircularProgress size={12} />
													<Typography variant="caption" color="text.secondary">
														Cargando...
													</Typography>
												</Stack>
											) : linkedNotes.length === 0 && linkedTasks.length === 0 ? (
												<Typography variant="caption" color="text.secondary">
													Sin notas ni tareas vinculadas
												</Typography>
											) : (
												<Stack spacing={1}>
													{linkedTasks.map((task) => (
														<Box
															key={task._id}
															sx={{
																p: 1,
																borderRadius: 1,
																bgcolor: alpha(theme.palette.primary.main, 0.04),
																border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
															}}
														>
															<Stack direction="row" spacing={0.5} alignItems="center">
																<Task
																	size={12}
																	color={
																		task.checked
																			? theme.palette.success.main
																			: theme.palette.text.secondary
																	}
																	variant={task.checked ? "Bold" : "Linear"}
																/>
																<Typography
																	variant="caption"
																	fontWeight={500}
																	sx={{
																		textDecoration: task.checked
																			? "line-through"
																			: "none",
																		overflow: "hidden",
																		textOverflow: "ellipsis",
																		whiteSpace: "nowrap",
																	}}
																>
																	{task.name}
																</Typography>
															</Stack>
														</Box>
													))}
													{linkedNotes.map((note) => (
														<Box
															key={note._id}
															sx={{
																p: 1,
																borderRadius: 1,
																bgcolor: alpha(theme.palette.warning.main, 0.04),
																border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
															}}
														>
															<Stack direction="row" spacing={0.5} alignItems="center">
																<NoteText size={12} color={theme.palette.warning.main} />
																<Typography
																	variant="caption"
																	fontWeight={500}
																	sx={{
																		overflow: "hidden",
																		textOverflow: "ellipsis",
																		whiteSpace: "nowrap",
																	}}
																>
																	{note.title}
																</Typography>
															</Stack>
														</Box>
													))}
												</Stack>
											)}
										</Box>
									</>
								)}
							</Box>
						</Box>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};

export default DocumentExplorer;
