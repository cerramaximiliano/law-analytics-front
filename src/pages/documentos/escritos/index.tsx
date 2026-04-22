import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Autocomplete,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	FormControl,
	Grid,
	IconButton,
	InputAdornment,
	Menu,
	MenuItem as MuiMenuItem,
	Pagination,
	Paper,
	Select,
	Skeleton,
	Stack,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tabs,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import {
	Add,
	ArrowDown2,
	DocumentDownload,
	DocumentText,
	Edit2,
	Eye,
	FolderOpen,
	Routing,
	SearchNormal1,
	Trash,
} from "iconsax-react";
import MainCard from "components/MainCard";
import { useDispatch, useSelector } from "store";
import { fetchRichTextDocuments, fetchRichTextTemplates, deleteRichTextDocument, updateRichTextDocument } from "store/reducers/richTextDocuments";
import { fetchPostalDocuments, deletePostalDocument, updatePostalDocument, getPostalDocumentById } from "store/reducers/postalDocuments";
import { createPostalTracking, fetchAllTrackings, updatePostalTracking } from "store/reducers/postalTracking";
import { getFoldersByUserId } from "store/reducers/folder";
import { openSnackbar } from "store/reducers/snackbar";
import ApiService from "store/reducers/ApiService";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import { type RichTextDocument, type RichTextTemplate, type RichTextTemplateCategory } from "types/rich-text-document";
import { type PostalDocumentType } from "types/postal-document";
import { type PostalTrackingType } from "types/postal-tracking";
import { type FolderData } from "types/folder";
import CreatePostalDocumentModal from "sections/apps/postal-documents/CreatePostalDocumentModal";

// ── Constants ──────────────────────────────────────────────────────────────────

const VALID_CODE_IDS = [
	"CC", "CD", "CL", "CM", "CO", "CP", "DE", "DI", "EC", "EE", "EO", "EP",
	"GC", "GD", "GE", "GF", "GO", "GR", "GS", "HC", "HD", "HE", "HO", "HU",
	"HX", "IN", "IS", "JP", "LC", "LS", "ND", "MD", "ME", "MC", "MS", "MU",
	"MX", "OL", "PC", "PP", "RD", "RE", "RP", "RR", "SD", "SL", "SP", "SR",
	"ST", "TC", "TD", "TL", "UP",
];

const TRACKING_SLUGS = ["telegrama_laboral"];

// ── Types ──────────────────────────────────────────────────────────────────────

type TypeFilter = "all" | "postal" | "richtext";

interface DocRow {
	kind: "postal" | "richtext";
	id: string;
	title: string;
	templateName: string;
	templateSlug?: string;
	status: string;
	linkedFolderId?: string | null;
	linkedTrackingId?: string | null;
	supportsTracking?: boolean;
	documentUrl?: string;
	createdAt?: string;
	rawPostal?: PostalDocumentType;
	rawRichText?: RichTextDocument;
}

const PAGE_SIZE = 15;

// ── Status helpers ─────────────────────────────────────────────────────────────

const POSTAL_STATUS_LABELS: Record<string, string> = {
	draft: "Borrador",
	generated: "Generado",
	sent: "Enviado",
	archived: "Archivado",
};

const POSTAL_STATUS_COLORS: Record<string, "default" | "warning" | "success" | "info"> = {
	draft: "warning",
	generated: "success",
	sent: "info",
	archived: "default",
};

const RT_STATUS_LABELS: Record<string, string> = { draft: "Borrador", final: "Final" };
const RT_STATUS_COLORS: Record<string, "default" | "success"> = { draft: "default", final: "success" };

function formatDate(iso?: string | null) {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toDocRow(doc: PostalDocumentType | RichTextDocument, kind: "postal" | "richtext"): DocRow {
	if (kind === "postal") {
		const d = doc as PostalDocumentType;
		return {
			kind,
			id: d._id,
			title: d.title,
			templateName: d.templateName || "—",
			templateSlug: d.templateSlug,
			status: d.status,
			linkedFolderId: d.linkedFolderId as string | null | undefined,
			linkedTrackingId: d.linkedTrackingId as string | null | undefined,
			supportsTracking: Boolean(d.supportsTracking) || TRACKING_SLUGS.includes(d.templateSlug ?? ""),
			documentUrl: d.documentUrl,
			createdAt: d.createdAt,
			rawPostal: d,
		};
	} else {
		const d = doc as RichTextDocument;
		return {
			kind,
			id: d._id,
			title: d.title,
			templateName: d.templateName || "—",
			status: d.status,
			linkedFolderId: d.linkedFolderId,
			createdAt: d.createdAt,
			rawRichText: d,
		};
	}
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

const RowSkeleton = () => (
	<TableRow>
		{[220, 140, 90, 100, 90, 100].map((w, i) => (
			<TableCell key={i}>
				<Skeleton variant="text" width={w} />
			</TableCell>
		))}
	</TableRow>
);

// ── TemplatePickerDialog ───────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<RichTextTemplateCategory, string> = {
	civil: "Civil",
	laboral: "Laboral",
	penal: "Penal",
	familia: "Familia",
	societario: "Societario",
	otro: "Otro",
};

const CATEGORY_COLORS: Record<RichTextTemplateCategory, "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error"> = {
	civil: "info",
	laboral: "warning",
	penal: "error",
	familia: "secondary",
	societario: "primary",
	otro: "default",
};

interface TemplatePickerDialogProps {
	open: boolean;
	onClose: () => void;
}

const TemplatePickerDialog = ({ open, onClose }: TemplatePickerDialogProps) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { templates, isLoader } = useSelector((state: any) => state.richTextDocumentsReducer);

	const [search, setSearch] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<RichTextTemplateCategory | "">("");
	const [selected, setSelected] = useState<RichTextTemplate | null>(null);

	useEffect(() => {
		if (!open) return;
		setSelected(null);
		setSearch("");
		setCategoryFilter("");
		dispatch(fetchRichTextTemplates({ source: "user", limit: 100 }));
	}, [open]); // eslint-disable-line react-hooks/exhaustive-deps

	const filtered = (templates as RichTextTemplate[]).filter((t) => {
		const matchSearch =
			!search ||
			t.name.toLowerCase().includes(search.toLowerCase()) ||
			(t.description ?? "").toLowerCase().includes(search.toLowerCase());
		const matchCat = !categoryFilter || t.category === categoryFilter;
		return matchSearch && matchCat;
	});

	const handleContinue = () => {
		if (!selected) return;
		onClose();
		navigate(`/documentos/escritos/nuevo?templateId=${selected._id}`);
	};

	const handleBlank = () => {
		onClose();
		navigate("/documentos/escritos/nuevo");
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>
				<Stack spacing={0.5}>
					<Typography variant="h5">Elegir modelo</Typography>
					<Typography variant="body2" color="text.secondary">
						Seleccioná un modelo para pre-cargar su contenido y campos dinámicos.
					</Typography>
				</Stack>
			</DialogTitle>

			<DialogContent dividers sx={{ pb: 0 }}>
				{/* Filters */}
				<Stack direction="row" spacing={1.5} mb={2}>
					<TextField
						size="small"
						placeholder="Buscar modelo..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						sx={{ flex: 1 }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size={14} />
								</InputAdornment>
							),
						}}
					/>
					<Select
						size="small"
						value={categoryFilter}
						onChange={(e) => setCategoryFilter(e.target.value as RichTextTemplateCategory | "")}
						displayEmpty
						sx={{ minWidth: 160 }}
					>
						<MuiMenuItem value="">Todas las categorías</MuiMenuItem>
						{(Object.keys(CATEGORY_LABELS) as RichTextTemplateCategory[]).map((cat) => (
							<MuiMenuItem key={cat} value={cat}>
								{CATEGORY_LABELS[cat]}
							</MuiMenuItem>
						))}
					</Select>
				</Stack>

				{/* Template list */}
				{isLoader ? (
					<Stack alignItems="center" justifyContent="center" py={6}>
						<CircularProgress size={32} />
					</Stack>
				) : filtered.length === 0 ? (
					<Stack alignItems="center" justifyContent="center" spacing={1} py={6}>
						<Typography variant="body2" color="text.secondary">
							{search || categoryFilter
								? "No hay modelos que coincidan con los filtros."
								: "Todavía no creaste ningún modelo. Podés crear uno desde «Documentos › Modelos»."}
						</Typography>
					</Stack>
				) : (
					<Box sx={{ maxHeight: 360, overflowY: "auto", pr: 0.5 }}>
						<Stack spacing={1} pb={2}>
							{filtered.map((tpl) => {
								const isSelected = selected?._id === tpl._id;
								return (
									<Paper
										key={tpl._id}
										variant="outlined"
										onClick={() => setSelected(isSelected ? null : tpl)}
										sx={{
											p: 1.5,
											cursor: "pointer",
											borderColor: isSelected ? "primary.main" : "divider",
											borderWidth: isSelected ? 2 : 1,
											bgcolor: isSelected ? "primary.lighter" : "background.paper",
											"&:hover": { borderColor: "primary.light", bgcolor: isSelected ? "primary.lighter" : "action.hover" },
											transition: "border-color 0.15s, background-color 0.15s",
										}}
									>
										<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
											<Stack spacing={0.5} flex={1} minWidth={0}>
												<Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={0.5}>
													<Typography variant="body2" fontWeight={600}>
														{tpl.name}
													</Typography>
													<Chip
														label={CATEGORY_LABELS[tpl.category]}
														size="small"
														color={CATEGORY_COLORS[tpl.category]}
														variant="outlined"
														sx={{ height: 18, fontSize: "0.65rem" }}
													/>
												</Stack>
												{tpl.description && (
													<Typography variant="caption" color="text.secondary" noWrap>
														{tpl.description}
													</Typography>
												)}
											</Stack>
											{tpl.mergeFields?.length > 0 && (
												<Chip
													label={`${tpl.mergeFields.length} campo${tpl.mergeFields.length !== 1 ? "s" : ""}`}
													size="small"
													variant="outlined"
													color="default"
													sx={{ flexShrink: 0, height: 20, fontSize: "0.65rem" }}
												/>
											)}
										</Stack>
									</Paper>
								);
							})}
						</Stack>
					</Box>
				)}
			</DialogContent>

			<DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
				<Button variant="text" color="secondary" onClick={handleBlank} data-testid="picker-blank-btn">
					Continuar sin modelo
				</Button>
				<Stack direction="row" spacing={1}>
					<Button variant="outlined" onClick={onClose}>
						Cancelar
					</Button>
					<Button variant="contained" onClick={handleContinue} disabled={!selected} data-testid="picker-continue-btn">
						Crear documento
					</Button>
				</Stack>
			</DialogActions>
		</Dialog>
	);
};

// ── VincularDialog ─────────────────────────────────────────────────────────────

interface VincularDialogProps {
	open: boolean;
	docRow: DocRow | null;
	onClose: () => void;
	onSuccess: () => void;
	showSnackbar: (msg: string, sev: "success" | "error") => void;
}

const VincularDialog = ({ open, docRow, onClose, onSuccess, showSnackbar }: VincularDialogProps) => {
	const dispatch = useDispatch();
	const folders: FolderData[] = useSelector((state: any) => state.folder?.folders || []);
	const trackings: PostalTrackingType[] = useSelector((state: any) => state.postalTrackingReducer?.allTrackings || []);
	const userId = useSelector((state: any) => state.auth?.user?._id);

	const isPostal = docRow?.kind === "postal";
	const supportsTracking = isPostal && Boolean(docRow?.supportsTracking);

	const [tab, setTab] = useState(0);
	const [submitting, setSubmitting] = useState(false);

	// ── Folder tab ──
	const [selectedFolder, setSelectedFolder] = useState<FolderData | null>(null);

	// ── Tracking tab ──
	const [trackingTab, setTrackingTab] = useState(0);
	const [loadingTrackings, setLoadingTrackings] = useState(false);
	const [codeId, setCodeId] = useState("TC");
	const [numberId, setNumberId] = useState("");
	const [label, setLabel] = useState("");
	const [selectedTracking, setSelectedTracking] = useState<PostalTrackingType | null>(null);

	useEffect(() => {
		if (!open || !docRow) return;
		setTab(0);
		setSubmitting(false);
		setTrackingTab(0);
		setCodeId("TC");
		setNumberId("");
		setLabel(docRow.title || "");
		setSelectedTracking(null);

		// Pre-select current linked folder
		const currentFolder = folders.find((f) => f._id === docRow.linkedFolderId) || null;
		setSelectedFolder(currentFolder);

		// Load data if needed
		if (folders.length === 0 && userId) dispatch(getFoldersByUserId(userId) as any);
		if (isPostal && supportsTracking) {
			setLoadingTrackings(true);
			dispatch(fetchAllTrackings() as any).then(() => setLoadingTrackings(false));
		}
	}, [open]); // eslint-disable-line react-hooks/exhaustive-deps

	const activeFolders = folders.filter((f: any) => f.status !== "archived");

	// ── Folder save ──
	const handleSaveFolder = async () => {
		if (!docRow) return;
		setSubmitting(true);
		try {
			let result: any;
			if (isPostal) {
				result = await (dispatch as any)(updatePostalDocument(docRow.id, { linkedFolderId: selectedFolder?._id || null }));
			} else {
				result = await dispatch(updateRichTextDocument(docRow.id, { linkedFolderId: selectedFolder?._id || null } as any));
			}
			if (result?.success !== false) {
				showSnackbar(selectedFolder ? "Carpeta vinculada al documento" : "Vinculación con carpeta eliminada", "success");
				onSuccess();
				onClose();
			} else {
				showSnackbar(result?.error || "Error al vincular la carpeta", "error");
			}
		} catch {
			showSnackbar("Error al vincular la carpeta", "error");
		}
		setSubmitting(false);
	};

	// ── Create tracking ──
	const numberIdValid = /^\d{9}$/.test(numberId);

	const handleCreateTracking = async () => {
		if (!docRow?.rawPostal || !numberIdValid) return;
		setSubmitting(true);
		try {
			const result = await dispatch(
				createPostalTracking({
					codeId,
					numberId,
					label,
					documentId: docRow.id,
					...(docRow.linkedFolderId ? { folderId: docRow.linkedFolderId as any } : {}),
				}) as any
			);
			if (result?.success !== false) {
				if (result?.id) {
					await (dispatch as any)(updatePostalDocument(docRow.id, { linkedTrackingId: result.id }));
				}
				showSnackbar("Seguimiento creado y vinculado al documento", "success");
				onSuccess();
				onClose();
			} else {
				showSnackbar(result?.error || "Error al crear el seguimiento", "error");
			}
		} catch {
			showSnackbar("Error al crear el seguimiento", "error");
		}
		setSubmitting(false);
	};

	// ── Link existing tracking ──
	const folderConflict = selectedTracking
		? selectedTracking.folderId && docRow?.linkedFolderId && selectedTracking.folderId !== docRow.linkedFolderId
		: false;
	const folderPropagation = selectedTracking
		? (!selectedTracking.folderId && docRow?.linkedFolderId) || (selectedTracking.folderId && !docRow?.linkedFolderId)
		: false;

	const handleLinkTracking = async () => {
		if (!docRow || !selectedTracking) return;
		setSubmitting(true);
		try {
			const trackingFolder = selectedTracking.folderId || null;
			const documentFolder = docRow.linkedFolderId || null;
			const resolvedFolder = trackingFolder || documentFolder;
			await Promise.all([
				dispatch(
					updatePostalTracking(selectedTracking._id, {
						documentId: docRow.id,
						...(!trackingFolder && resolvedFolder ? { folderId: resolvedFolder as any } : {}),
					}) as any
				),
				(dispatch as any)(
					updatePostalDocument(docRow.id, {
						linkedTrackingId: selectedTracking._id,
						...(resolvedFolder && resolvedFolder !== documentFolder ? { linkedFolderId: resolvedFolder as any } : {}),
					})
				),
			]);
			showSnackbar("Documento vinculado al seguimiento exitosamente", "success");
			onSuccess();
			onClose();
		} catch {
			showSnackbar("Error al vincular el seguimiento", "error");
		}
		setSubmitting(false);
	};

	if (!docRow) return null;

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				<Stack spacing={0.5}>
					<Typography variant="h5">Vincular</Typography>
					<Typography variant="body2" color="text.secondary">
						{docRow.title}
					</Typography>
				</Stack>
			</DialogTitle>

			<Tabs
				value={tab}
				onChange={(_, v) => setTab(v)}
				sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}
			>
				<Tab label="Carpeta" />
				{supportsTracking && <Tab label="Seguimiento postal" />}
			</Tabs>

			<DialogContent sx={{ pt: 2.5, minHeight: 240, display: "flex", flexDirection: "column" }}>
				{/* ── Carpeta ── */}
				{tab === 0 && (
					<Stack spacing={2}>
						<Typography variant="body2" color="text.secondary">
							Vinculá este documento a una carpeta de tu lista.
						</Typography>
						<Autocomplete
							size="small"
							options={activeFolders}
							value={selectedFolder}
							getOptionLabel={(f: FolderData) => f.folderName || f.folderId || ""}
							isOptionEqualToValue={(opt, val) => opt._id === val._id}
							onChange={(_e, val) => setSelectedFolder(val)}
							renderOption={(props, f: FolderData) => (
								<Box component="li" {...props} key={f._id}>
									<Stack>
										<Typography variant="body2" fontWeight={500}>
											{f.folderName}
										</Typography>
										{f.folderFuero && (
											<Typography variant="caption" color="text.secondary">
												{f.folderFuero}
											</Typography>
										)}
									</Stack>
								</Box>
							)}
							renderInput={(params) => <TextField {...params} label="Buscar carpeta..." />}
							noOptionsText="Sin carpetas disponibles"
						/>
						{docRow.linkedFolderId && !selectedFolder && (
							<Typography variant="caption" color="warning.main">
								Si confirmás sin seleccionar una carpeta, se eliminará la vinculación actual.
							</Typography>
						)}
					</Stack>
				)}

				{/* ── Seguimiento postal (solo para docs postales que lo soporten) ── */}
				{tab === 1 && supportsTracking && (
					<Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
						<Tabs
							value={trackingTab}
							onChange={(_, v) => setTrackingTab(v)}
							orientation="vertical"
							sx={{
								borderRight: 1,
								borderColor: "divider",
								minWidth: 140,
								mr: 2,
								"& .MuiTab-root": { alignItems: "flex-start", textAlign: "left", minHeight: 52 },
							}}
						>
							<Tab label="Crear nuevo" />
							<Tab label="Vincular existente" />
						</Tabs>

						<Box sx={{ flex: 1, overflow: "auto" }}>
							{trackingTab === 0 && (
								<Stack spacing={2}>
									<Typography variant="body2" color="text.secondary">
										Ingresá el código de seguimiento del envío postal para registrarlo y vincularlo a este documento.
									</Typography>
									<Stack direction="row" spacing={1.5}>
										<FormControl size="small" sx={{ minWidth: 90 }}>
											<Select value={codeId} onChange={(e) => setCodeId(e.target.value)}>
												{VALID_CODE_IDS.map((c) => (
													<MuiMenuItem key={c} value={c}>
														{c}
													</MuiMenuItem>
												))}
											</Select>
										</FormControl>
										<TextField
											size="small"
											label="Número (9 dígitos)"
											fullWidth
											value={numberId}
											onChange={(e) => setNumberId(e.target.value.replace(/\D/g, "").slice(0, 9))}
											error={numberId.length > 0 && !numberIdValid}
											helperText={numberId.length > 0 && !numberIdValid ? "Debe tener exactamente 9 dígitos" : ""}
											inputProps={{ inputMode: "numeric" }}
										/>
									</Stack>
									<TextField
										size="small"
										label="Etiqueta (opcional)"
										fullWidth
										value={label}
										onChange={(e) => setLabel(e.target.value)}
									/>
									{docRow.linkedFolderId && (
										<Typography variant="caption" color="text.secondary">
											El seguimiento también se vinculará a la carpeta asociada al documento.
										</Typography>
									)}
								</Stack>
							)}

							{trackingTab === 1 && (
								<Stack spacing={2}>
									<Typography variant="body2" color="text.secondary">
										Seleccioná un seguimiento postal ya existente para vincularlo a este documento.
									</Typography>
									{loadingTrackings ? (
										<Stack alignItems="center" sx={{ py: 3 }}>
											<CircularProgress size={28} />
										</Stack>
									) : (
										<Autocomplete
											size="small"
											options={trackings}
											value={selectedTracking}
											getOptionLabel={(t: PostalTrackingType) =>
												`${t.codeId} ${t.numberId}${t.label ? ` — ${t.label}` : ""}`
											}
											isOptionEqualToValue={(opt, val) => opt._id === val._id}
											onChange={(_e, val) => setSelectedTracking(val)}
											renderOption={(props, t: PostalTrackingType) => (
												<Box component="li" {...props} key={t._id}>
													<Stack>
														<Typography variant="body2" fontWeight={500}>
															{t.codeId} {t.numberId}
														</Typography>
														{t.label && (
															<Typography variant="caption" color="text.secondary">
																{t.label}
															</Typography>
														)}
													</Stack>
												</Box>
											)}
											renderInput={(params) => <TextField {...params} label="Buscar seguimiento..." />}
											noOptionsText="Sin seguimientos disponibles"
										/>
									)}
									{selectedTracking?.documentId && selectedTracking.documentId !== docRow.id && (
										<Typography variant="caption" color="warning.main">
											Este seguimiento ya tiene un documento vinculado. Al continuar se reemplazará.
										</Typography>
									)}
									{folderConflict && (
										<Typography variant="caption" color="warning.main">
											El seguimiento y el documento están vinculados a carpetas distintas. Se usará la carpeta del seguimiento para ambos.
										</Typography>
									)}
									{folderPropagation && !folderConflict && (
										<Typography variant="caption" color="info.main">
											{selectedTracking?.folderId
												? "El documento adoptará la carpeta del seguimiento para mantener consistencia."
												: "La carpeta del documento se asignará también al seguimiento."}
										</Typography>
									)}
								</Stack>
							)}
						</Box>
					</Stack>
				)}
			</DialogContent>

			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onClose} color="secondary" variant="outlined" disabled={submitting}>
					Cancelar
				</Button>
				{tab === 0 && (
					<Button
						onClick={handleSaveFolder}
						variant="contained"
						disabled={submitting}
						startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <FolderOpen size={16} />}
					>
						Guardar carpeta
					</Button>
				)}
				{tab === 1 && trackingTab === 0 && (
					<Button
						onClick={handleCreateTracking}
						variant="contained"
						disabled={submitting || !numberIdValid}
						startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Routing size={16} />}
					>
						Crear seguimiento
					</Button>
				)}
				{tab === 1 && trackingTab === 1 && (
					<Button
						onClick={handleLinkTracking}
						variant="contained"
						disabled={submitting || !selectedTracking || loadingTrackings}
						startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Routing size={16} />}
					>
						Vincular seguimiento
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
};

// ── PostalDetailDialog ─────────────────────────────────────────────────────────

interface PostalDetailDialogProps {
	open: boolean;
	doc: PostalDocumentType | null;
	onClose: () => void;
}

const PostalDetailDialog = ({ open, doc, onClose }: PostalDetailDialogProps) => {
	const dispatch = useDispatch();
	const folders = useSelector((state: any) => state.folder?.folders || []);
	const [freshUrl, setFreshUrl] = useState<string | null>(null);
	const [urlLoading, setUrlLoading] = useState(false);

	// Fetch a fresh presigned URL each time the dialog opens
	useEffect(() => {
		if (!open || !doc?._id) return;
		setFreshUrl(null);
		setUrlLoading(true);
		(dispatch as any)(getPostalDocumentById(doc._id)).then((res: any) => {
			if (res?.success && res.document?.documentUrl) setFreshUrl(res.document.documentUrl);
			setUrlLoading(false);
		});
	}, [open, doc?._id]);

	if (!doc) return null;

	const linkedFolder = doc.linkedFolderId ? folders.find((f: any) => f._id === doc.linkedFolderId) : null;

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>
				<Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
					<Stack spacing={0.5}>
						<Typography variant="h5">{doc.title}</Typography>
						<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
							<Chip size="small" label={doc.templateName} variant="outlined" />
							<Chip
								size="small"
								label={POSTAL_STATUS_LABELS[doc.status] ?? doc.status}
								color={POSTAL_STATUS_COLORS[doc.status] ?? "default"}
							/>
						</Stack>
					</Stack>
					{freshUrl && (
						<Button
							variant="contained"
							size="small"
							startIcon={<DocumentDownload size={16} />}
							onClick={() => window.open(freshUrl, "_blank")}
							sx={{ flexShrink: 0 }}
						>
							Descargar PDF
						</Button>
					)}
				</Stack>
			</DialogTitle>
			<DialogContent dividers sx={{ p: 0 }}>
				<Grid container sx={{ height: 480 }}>
					<Grid item xs={12} md={8} sx={{ height: "100%", borderRight: 1, borderColor: "divider" }}>
						{urlLoading ? (
							<Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
								<CircularProgress size={28} />
							</Stack>
						) : freshUrl ? (
							<iframe
								src={freshUrl}
								title={doc.title}
								style={{ width: "100%", height: "100%", border: "none", display: "block" }}
							/>
						) : (
							<Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
								<Typography color="text.secondary">El PDF no está disponible.</Typography>
							</Stack>
						)}
					</Grid>
					<Grid item xs={12} md={4} sx={{ p: 2.5, overflowY: "auto" }}>
						<Stack spacing={2}>
							<Stack spacing={0.5}>
								<Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
									Modelo
								</Typography>
								<Typography variant="body2">{doc.templateName}</Typography>
							</Stack>
							<Stack spacing={0.5}>
								<Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
									Fecha
								</Typography>
								<Typography variant="body2">{formatDate(doc.createdAt)}</Typography>
							</Stack>
							{linkedFolder && (
								<Stack spacing={0.5}>
									<Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
										Carpeta
									</Typography>
									<Typography variant="body2">{linkedFolder.folderName}</Typography>
								</Stack>
							)}
							{doc.description && (
								<Stack spacing={0.5}>
									<Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
										Descripción
									</Typography>
									<Typography variant="body2">{doc.description}</Typography>
								</Stack>
							)}
						</Stack>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cerrar</Button>
			</DialogActions>
		</Dialog>
	);
};

// ── DeleteDialog ───────────────────────────────────────────────────────────────

interface DeleteDialogProps {
	open: boolean;
	title: string;
	loading: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

const DeleteDialog = ({ open, title, loading, onConfirm, onClose }: DeleteDialogProps) => (
	<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
		<DialogTitle>Eliminar documento</DialogTitle>
		<DialogContent>
			<DialogContentText>
				¿Eliminás el documento <strong>{title}</strong>? Esta acción no se puede deshacer.
			</DialogContentText>
		</DialogContent>
		<DialogActions>
			<Button onClick={onClose} disabled={loading}>
				Cancelar
			</Button>
			<Button color="error" variant="contained" onClick={onConfirm} disabled={loading}>
				{loading ? <CircularProgress size={16} color="inherit" /> : "Eliminar"}
			</Button>
		</DialogActions>
	</Dialog>
);

// ── Page ───────────────────────────────────────────────────────────────────────

const EscritosPage = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const { documents: rtDocs, documentsTotal: rtTotal, isLoader: rtLoading } = useSelector(
		(state: any) => state.richTextDocumentsReducer
	);
	const { documents: postalDocs, total: postalTotal, isLoader: postalLoading } = useSelector(
		(state: any) => state.postalDocumentsReducer
	);
	const folders = useSelector((state: any) => state.folder?.folders || []);
	const userId = useSelector((state: any) => state.auth?.user?._id);

	const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [newDocMenuAnchor, setNewDocMenuAnchor] = useState<null | HTMLElement>(null);
	const [openCreatePostal, setOpenCreatePostal] = useState(false);
	const [openTemplatePicker, setOpenTemplatePicker] = useState(false);
	const [postalDetail, setPostalDetail] = useState<PostalDocumentType | null>(null);
	const [vincularRow, setVincularRow] = useState<DocRow | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<{ kind: "postal" | "richtext"; id: string; title: string } | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [mainLimitErrorOpen, setMainLimitErrorOpen] = useState(false);
	const [mainLimitErrorData, setMainLimitErrorData] = useState<{ resourceType: string; plan: string; currentCount: string; limit: number } | null>(null);

	// Load folders if needed
	useEffect(() => {
		if (folders.length === 0 && userId) {
			dispatch(getFoldersByUserId(userId) as any);
		}
	}, [dispatch, userId]); // eslint-disable-line react-hooks/exhaustive-deps

	// Fetch documents
	useEffect(() => {
		const fetchPage = typeFilter === "all" ? 1 : page;
		if (typeFilter === "all" || typeFilter === "postal") {
			dispatch(fetchPostalDocuments({ page: fetchPage, limit: PAGE_SIZE, search: search || undefined }) as any);
		}
		if (typeFilter === "all" || typeFilter === "richtext") {
			dispatch(fetchRichTextDocuments({ page: fetchPage, limit: PAGE_SIZE, search: search || undefined }));
		}
	}, [dispatch, page, search, typeFilter]);

	// Merged & sorted rows
	const rows = useMemo((): DocRow[] => {
		let result: DocRow[] = [];
		if (typeFilter !== "richtext") {
			result.push(...(postalDocs as PostalDocumentType[]).map((d) => toDocRow(d, "postal")));
		}
		if (typeFilter !== "postal") {
			result.push(...(rtDocs as RichTextDocument[]).map((d) => toDocRow(d, "richtext")));
		}
		if (typeFilter === "all") {
			result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
			result = result.slice(0, PAGE_SIZE);
		}
		return result;
	}, [postalDocs, rtDocs, typeFilter]);

	const totalItems = typeFilter === "postal" ? postalTotal : typeFilter === "richtext" ? rtTotal : postalTotal + rtTotal;
	const totalPages = Math.ceil(totalItems / PAGE_SIZE);
	const isLoading = postalLoading || rtLoading;

	const handleSearchSubmit = () => {
		setSearch(searchInput);
		setPage(1);
	};

	const handleTypeChange = (t: TypeFilter) => {
		setTypeFilter(t);
		setPage(1);
	};

	const checkMainLimit = async (): Promise<boolean> => {
		try {
			const res = await ApiService.checkResourceLimit("postalDocuments");
			if (res.success && res.data?.hasReachedLimit) {
				setMainLimitErrorData({
					resourceType: "Documentos",
					plan: res.data.currentPlan || "free",
					currentCount: `${res.data.currentCount}`,
					limit: res.data.limit,
				});
				setMainLimitErrorOpen(true);
				return false;
			}
		} catch {
			// ante error de red, permitir continuar
		}
		return true;
	};

	const showSnackbar = (message: string, severity: "success" | "error") => {
		dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color: severity }, close: true }));
	};

	const refreshDocuments = (currentPage = page) => {
		const fetchPage = typeFilter === "all" ? 1 : currentPage;
		if (typeFilter === "all" || typeFilter === "postal") {
			dispatch(fetchPostalDocuments({ page: fetchPage, limit: PAGE_SIZE, search: search || undefined }) as any);
		}
		if (typeFilter === "all" || typeFilter === "richtext") {
			dispatch(fetchRichTextDocuments({ page: fetchPage, limit: PAGE_SIZE, search: search || undefined }));
		}
		// Also reload folders to get updated linked state
		if (userId) dispatch(getFoldersByUserId(userId) as any);
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		let result: any;
		if (deleteTarget.kind === "postal") {
			result = await (dispatch as any)(deletePostalDocument(deleteTarget.id));
		} else {
			result = await dispatch(deleteRichTextDocument(deleteTarget.id));
		}
		setDeleteLoading(false);
		setDeleteTarget(null);

		if (result?.success !== false) {
			showSnackbar("Documento eliminado.", "success");
			refreshDocuments();
		} else {
			showSnackbar("Error al eliminar el documento.", "error");
		}
	};

	return (
		<Stack spacing={2}>
			{/* Header */}
			<MainCard>
				<Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
					<Stack spacing={0.25}>
						<Typography variant="h4">Documentos</Typography>
						<Typography variant="body2" color="text.secondary">
							Documentos generados a partir de modelos del sistema y modelos propios
						</Typography>
					</Stack>

					<Box>
						<Button
							variant="contained"
							size="small"
							startIcon={<Add size={16} />}
							endIcon={<ArrowDown2 size={14} />}
							onClick={(e) => setNewDocMenuAnchor(e.currentTarget)}
							data-testid="escritos-new-btn"
						>
							Nuevo documento
						</Button>
						<Menu anchorEl={newDocMenuAnchor} open={Boolean(newDocMenuAnchor)} onClose={() => setNewDocMenuAnchor(null)}>
							<MuiMenuItem
								onClick={async () => {
									setNewDocMenuAnchor(null);
									if (!(await checkMainLimit())) return;
									setOpenCreatePostal(true);
								}}
								sx={{ py: 1.5 }}
								data-testid="escritos-new-postal"
							>
								<Stack spacing={0.25}>
									<Typography variant="body2" fontWeight={500}>
										Modelo del Sistema
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Telegramas, cartas documento y más
									</Typography>
								</Stack>
							</MuiMenuItem>
							<Divider />
							<MuiMenuItem
								onClick={async () => {
									setNewDocMenuAnchor(null);
									if (!(await checkMainLimit())) return;
									setOpenTemplatePicker(true);
								}}
								sx={{ py: 1.5 }}
								data-testid="escritos-new-richtext"
							>
								<Stack spacing={0.25}>
									<Typography variant="body2" fontWeight={500}>
										Mis Modelos
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Escritos personalizados con editor de texto
									</Typography>
								</Stack>
							</MuiMenuItem>
						</Menu>
					</Box>
				</Stack>
			</MainCard>

			{/* Table card */}
			<MainCard>
				{/* Filters */}
				<Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1} mb={2} alignItems="center">
					<TextField
						size="small"
						placeholder="Buscar por título o modelo..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
						sx={{ minWidth: 240, flex: 1, maxWidth: 360 }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size={14} />
								</InputAdornment>
							),
						}}
					/>
					<Select
						size="small"
						value={typeFilter}
						onChange={(e) => handleTypeChange(e.target.value as TypeFilter)}
						sx={{ minWidth: 160 }}
					>
						<MuiMenuItem value="all">Todos los tipos</MuiMenuItem>
						<MuiMenuItem value="postal">Del Sistema</MuiMenuItem>
						<MuiMenuItem value="richtext">Mis Modelos</MuiMenuItem>
					</Select>
					<Button size="small" variant="contained" onClick={handleSearchSubmit}>
						Buscar
					</Button>
				</Stack>

				<Divider sx={{ mb: 2 }} />

				{/* Table */}
				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow>
									<TableCell>Título</TableCell>
								<TableCell>Modelo</TableCell>
								<TableCell>Estado</TableCell>
								<TableCell>Carpeta</TableCell>
								<TableCell>Fecha</TableCell>
								<TableCell align="right">Acciones</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{isLoading ? (
								Array(5)
									.fill(0)
									.map((_, i) => <RowSkeleton key={i} />)
							) : rows.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6}>
										<Stack alignItems="center" justifyContent="center" spacing={1.5} py={6}>
											<DocumentText size={40} style={{ opacity: 0.3 }} />
											<Typography variant="body2" color="text.secondary">
												{search ? "No se encontraron documentos con esa búsqueda." : "Todavía no creaste ningún documento."}
											</Typography>
										</Stack>
									</TableCell>
								</TableRow>
							) : (
								rows.map((row) => {
									const isPostal = row.kind === "postal";
									const linkedFolder = row.linkedFolderId ? folders.find((f: any) => f._id === row.linkedFolderId) : null;
									const hasTracking = isPostal && Boolean(row.linkedTrackingId);

									return (
										<TableRow key={`${row.kind}-${row.id}`} hover>
											<TableCell>
												<Stack spacing={0.25}>
													<Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
														{row.title}
													</Typography>
													{hasTracking && (
														<Chip
															size="small"
															label="Seguimiento"
															color="info"
															variant="outlined"
															sx={{ alignSelf: "flex-start", height: 18, fontSize: "0.65rem" }}
														/>
													)}
												</Stack>
											</TableCell>
											<TableCell>
												<Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 140 }}>
													{row.templateName}
												</Typography>
											</TableCell>
											<TableCell>
												{isPostal ? (
													<Chip
														size="small"
														label={POSTAL_STATUS_LABELS[row.status] ?? row.status}
														color={POSTAL_STATUS_COLORS[row.status] ?? "default"}
													/>
												) : (
													<Chip
														size="small"
														label={RT_STATUS_LABELS[row.status] ?? row.status}
														color={(RT_STATUS_COLORS[row.status] ?? "default") as "default" | "success"}
														variant={row.status === "final" ? "filled" : "outlined"}
													/>
												)}
											</TableCell>
											<TableCell>
												{linkedFolder ? (
													<Typography
														variant="body2"
														onClick={() => navigate(`/apps/folders/details/${row.linkedFolderId}`)}
														sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
													>
														{linkedFolder.folderName}
													</Typography>
												) : (
													<Typography variant="caption" color="text.disabled">
														Sin vincular
													</Typography>
												)}
											</TableCell>
											<TableCell>
												<Typography variant="caption" color="text.secondary">
													{formatDate(row.createdAt)}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Stack direction="row" justifyContent="flex-end" spacing={0.5}>
													{isPostal ? (
														<>
															<Tooltip title="Ver documento">
																<IconButton size="small" color="primary" onClick={() => setPostalDetail(row.rawPostal!)}>
																	<Eye size={15} />
																</IconButton>
															</Tooltip>
															{row.documentUrl && (
																<Tooltip title="Descargar PDF">
																	<IconButton
																		size="small"
																		color="info"
																		onClick={() => window.open(row.documentUrl, "_blank")}
																	>
																		<DocumentDownload size={15} />
																	</IconButton>
																</Tooltip>
															)}
														</>
													) : (
														<Tooltip title="Ver / Editar documento">
															<IconButton size="small" onClick={() => navigate(`/documentos/escritos/${row.id}/editar`)} data-testid="escritos-edit-btn">
																<Eye size={15} />
															</IconButton>
														</Tooltip>
													)}
													<Tooltip title={row.linkedFolderId ? "Cambiar vinculación" : "Vincular a carpeta"}>
														<IconButton
															size="small"
															color={row.linkedFolderId ? "success" : "default"}
															onClick={() => setVincularRow(row)}
														>
															<Routing size={15} />
														</IconButton>
													</Tooltip>
													<Tooltip title="Eliminar">
														<IconButton
															size="small"
															color="error"
															onClick={() => setDeleteTarget({ kind: row.kind, id: row.id, title: row.title })}
															data-testid="escritos-delete-btn"
														>
															<Trash size={15} />
														</IconButton>
													</Tooltip>
												</Stack>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</TableContainer>

				{/* Pagination — only in type-specific mode */}
				{typeFilter !== "all" && totalPages > 1 && (
					<Box display="flex" justifyContent="center" mt={2}>
						<Pagination count={totalPages} page={page} onChange={(_e, v) => setPage(v)} size="small" color="primary" />
					</Box>
				)}
				{typeFilter === "all" && postalTotal + rtTotal > PAGE_SIZE && (
					<Typography variant="caption" color="text.disabled" sx={{ display: "block", textAlign: "center", mt: 1.5 }}>
						Mostrando los {PAGE_SIZE} documentos más recientes. Para ver el historial completo, filtrá por tipo.
					</Typography>
				)}
			</MainCard>

			{/* ── Modals ── */}
			<TemplatePickerDialog open={openTemplatePicker} onClose={() => setOpenTemplatePicker(false)} />

			<LimitErrorModal
				open={mainLimitErrorOpen}
				onClose={() => setMainLimitErrorOpen(false)}
				message="Has alcanzado el límite de documentos para tu plan actual."
				limitInfo={mainLimitErrorData ?? undefined}
			/>

			<VincularDialog
				open={!!vincularRow}
				docRow={vincularRow}
				onClose={() => setVincularRow(null)}
				onSuccess={() => refreshDocuments()}
				showSnackbar={showSnackbar}
			/>

			<PostalDetailDialog open={!!postalDetail} doc={postalDetail} onClose={() => setPostalDetail(null)} />

			<DeleteDialog
				open={!!deleteTarget}
				title={deleteTarget?.title ?? ""}
				loading={deleteLoading}
				onConfirm={handleDelete}
				onClose={() => setDeleteTarget(null)}
			/>

			<CreatePostalDocumentModal
				open={openCreatePostal}
				handleClose={() => {
					setOpenCreatePostal(false);
					dispatch(fetchPostalDocuments({ page: 1, limit: PAGE_SIZE, search: search || undefined }) as any);
					if (typeFilter !== "richtext") setPage(1);
				}}
				showSnackbar={showSnackbar}
			/>
		</Stack>
	);
};

export default EscritosPage;
