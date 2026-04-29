import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	Alert,
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	Grid,
	IconButton,
	InputAdornment,
	Skeleton,
	Stack,
	Tab,
	Tabs,
	TextField,
	Tooltip,
	Typography,
	useTheme,
} from "@mui/material";
import { Add, ClipboardText, DocumentText, DocumentUpload, Edit2, Eye, SearchNormal1, Setting2, Trash } from "iconsax-react";
import MainCard from "components/MainCard";
import { dispatch, useSelector } from "store";
import { fetchPdfTemplates, getPdfTemplate } from "store/reducers/postalDocuments";
import { fetchRichTextTemplates, deleteRichTextTemplate } from "store/reducers/richTextDocuments";
import { openSnackbar } from "store/reducers/snackbar";
import { PdfTemplate } from "types/postal-document";
import { RichTextTemplate, RichTextTemplateCategory } from "types/rich-text-document";
import CreatePostalDocumentModal from "sections/apps/postal-documents/CreatePostalDocumentModal";
import SupportModal from "layout/MainLayout/Drawer/DrawerContent/SupportModal";

// ── Helpers ────────────────────────────────────────────────────────────────────

const PDF_CATEGORY_COLORS: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
	postal: "info",
	laboral: "warning",
	judicial: "error",
	societario: "secondary",
	notarial: "success",
	otros: "default",
};

const RT_CATEGORY_COLORS: Record<RichTextTemplateCategory, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> =
	{
		laboral: "warning",
		civil: "info",
		penal: "error",
		societario: "secondary",
		familia: "success",
		otro: "default",
	};

const RT_CATEGORY_LABELS: Record<RichTextTemplateCategory, string> = {
	laboral: "Laboral",
	civil: "Civil",
	penal: "Penal",
	societario: "Societario",
	familia: "Familia",
	otro: "Otro",
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

const CardsSkeleton = ({ count = 4 }: { count?: number }) => (
	<Grid container spacing={2.5}>
		{Array(count)
			.fill(0)
			.map((_, i) => (
				<Grid item xs={12} sm={6} md={4} lg={3} key={i}>
					<Card variant="outlined" sx={{ height: "100%" }}>
						<CardContent>
							<Stack spacing={1.5}>
								<Stack direction="row" spacing={1}>
									<Skeleton variant="rounded" width={60} height={22} sx={{ borderRadius: 4 }} />
									<Skeleton variant="rounded" width={55} height={22} sx={{ borderRadius: 4 }} />
								</Stack>
								<Skeleton variant="rounded" width="80%" height={22} />
								<Skeleton variant="rounded" width="100%" height={40} />
								<Skeleton variant="rounded" width={80} height={18} />
							</Stack>
						</CardContent>
						<CardActions sx={{ px: 2, pb: 2 }}>
							<Skeleton variant="rounded" width={95} height={30} />
							<Skeleton variant="rounded" width={100} height={30} />
						</CardActions>
					</Card>
				</Grid>
			))}
	</Grid>
);

// ── Vista previa PDF ───────────────────────────────────────────────────────────

interface PreviewDialogProps {
	open: boolean;
	template: PdfTemplate | null;
	pdfUrl: string | null;
	loading: boolean;
	onClose: () => void;
}

const PreviewDialog = ({ open, template, pdfUrl, loading, onClose }: PreviewDialogProps) => (
	<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
		<DialogTitle>
			<Stack direction="row" alignItems="center" spacing={1.5}>
				<Typography variant="h5">{template?.name}</Typography>
				{template?.category && <Chip size="small" label={template.category} color={PDF_CATEGORY_COLORS[template.category] ?? "default"} />}
				<Chip
					size="small"
					label={template?.modelType === "dynamic" ? "Dinámico" : "Estático"}
					color={template?.modelType === "dynamic" ? "secondary" : "default"}
					variant="outlined"
				/>
			</Stack>
		</DialogTitle>
		<DialogContent dividers>
			{loading ? (
				<Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
					<CircularProgress />
				</Stack>
			) : pdfUrl ? (
				<iframe src={pdfUrl} title={template?.name} style={{ width: "100%", height: 560, border: "none" }} />
			) : (
				<Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
					<Typography color="textSecondary">No se pudo cargar la vista previa.</Typography>
				</Stack>
			)}
		</DialogContent>
	</Dialog>
);

// ── Tarjeta modelo PDF ─────────────────────────────────────────────────────────

interface ModelCardProps {
	template: PdfTemplate;
	onPreview: (t: PdfTemplate) => void;
	onUse: (t: PdfTemplate) => void;
}

const ModelCard = ({ template, onPreview, onUse }: ModelCardProps) => (
	<Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
		<CardContent sx={{ flexGrow: 1 }}>
			<Stack spacing={1.5}>
				<Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
					<Chip size="small" label={template.category} color={PDF_CATEGORY_COLORS[template.category] ?? "default"} variant="outlined" />
					<Chip
						size="small"
						label={template.modelType === "dynamic" ? "Dinámico" : "Estático"}
						variant="outlined"
						color={template.modelType === "dynamic" ? "secondary" : "default"}
					/>
				</Stack>
				<Typography variant="subtitle1" fontWeight={600} lineHeight={1.3}>
					{template.name}
				</Typography>
				{template.description && (
					<Typography variant="body2" color="textSecondary">
						{template.description}
					</Typography>
				)}
				<Divider />
				<Stack direction="row" alignItems="center" spacing={0.75}>
					<DocumentText size={14} style={{ opacity: 0.5 }} />
					<Typography variant="caption" color="textSecondary">
						{template.fields?.length ?? 0} campo{template.fields?.length !== 1 ? "s" : ""} completables
					</Typography>
				</Stack>
			</Stack>
		</CardContent>
		<CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
			<Button size="small" variant="outlined" color="secondary" startIcon={<Eye size={15} />} onClick={() => onPreview(template)}>
				Vista previa
			</Button>
			<Button size="small" variant="contained" onClick={() => onUse(template)}>
				Usar modelo
			</Button>
		</CardActions>
	</Card>
);

// ── Tarjeta modelo rich text ───────────────────────────────────────────────────

interface RichTextModelCardProps {
	template: RichTextTemplate;
	onEdit: (t: RichTextTemplate) => void;
	onDelete: (t: RichTextTemplate) => void;
	onUse: (t: RichTextTemplate) => void;
}

const RichTextModelCard = ({ template, onEdit, onDelete, onUse }: RichTextModelCardProps) => (
	<Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
		<CardContent sx={{ flexGrow: 1 }}>
			<Stack spacing={1.5}>
				<Stack direction="row" alignItems="center" justifyContent="space-between">
					<Chip
						size="small"
						label={RT_CATEGORY_LABELS[template.category] ?? template.category}
						color={RT_CATEGORY_COLORS[template.category] ?? "default"}
						variant="outlined"
					/>
					<Stack direction="row">
						<Tooltip title="Editar">
							<IconButton size="small" onClick={() => onEdit(template)}>
								<Edit2 size={15} />
							</IconButton>
						</Tooltip>
						<Tooltip title="Eliminar">
							<IconButton size="small" color="error" onClick={() => onDelete(template)}>
								<Trash size={15} />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>
				<Typography variant="subtitle1" fontWeight={600} lineHeight={1.3}>
					{template.name}
				</Typography>
				{template.description && (
					<Typography variant="body2" color="textSecondary">
						{template.description}
					</Typography>
				)}
				<Divider />
				<Stack direction="row" alignItems="center" spacing={0.75}>
					<DocumentText size={14} style={{ opacity: 0.5 }} />
					<Typography variant="caption" color="textSecondary">
						{template.mergeFields?.length ?? 0} campo{template.mergeFields?.length !== 1 ? "s" : ""} dinámico
						{template.mergeFields?.length !== 1 ? "s" : ""}
					</Typography>
				</Stack>
			</Stack>
		</CardContent>
		<CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
			<Button size="small" variant="outlined" onClick={() => onEdit(template)} startIcon={<Edit2 size={15} />}>
				Editar
			</Button>
			<Button size="small" variant="contained" onClick={() => onUse(template)} startIcon={<DocumentUpload size={15} />}>
				Crear documento
			</Button>
		</CardActions>
	</Card>
);

// ── Confirmación de eliminación ────────────────────────────────────────────────

interface DeleteConfirmProps {
	open: boolean;
	name: string;
	loading: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

const DeleteConfirmDialog = ({ open, name, loading, onConfirm, onClose }: DeleteConfirmProps) => (
	<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
		<DialogTitle>Eliminar modelo</DialogTitle>
		<DialogContent>
			<DialogContentText>
				¿Eliminás el modelo <strong>{name}</strong>? Esta acción no se puede deshacer.
			</DialogContentText>
		</DialogContent>
		<DialogActions>
			<Button onClick={onClose} disabled={loading}>
				Cancelar
			</Button>
			<Button color="error" variant="contained" onClick={onConfirm} disabled={loading}>
				{loading ? <CircularProgress size={16} /> : "Eliminar"}
			</Button>
		</DialogActions>
	</Dialog>
);

// ── Página principal ───────────────────────────────────────────────────────────

const ModelosPage = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const userId = useSelector((state: any) => state.auth?.user?._id);

	// PDF templates (Tab 0)
	const [pdfTemplates, setPdfTemplates] = useState<PdfTemplate[]>([]);
	const [pdfLoading, setPdfLoading] = useState(true);
	const [previewTemplate, setPreviewTemplate] = useState<PdfTemplate | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [createFromTemplate, setCreateFromTemplate] = useState<PdfTemplate | null>(null);

	// Rich text templates (Tab 1)
	const [rtTemplates, setRtTemplates] = useState<RichTextTemplate[]>([]);
	const [rtLoading, setRtLoading] = useState(false);
	const [rtSearch, setRtSearch] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<RichTextTemplate | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	// Shared — initialise from ?tab= query param
	const [activeTab, setActiveTab] = useState(() => {
		const t = Number(searchParams.get("tab"));
		return isNaN(t) ? 0 : t;
	});
	const [pdfSearch, setPdfSearch] = useState("");
	const [requestModelOpen, setRequestModelOpen] = useState(false);

	const showSnackbar = (message: string, severity: "success" | "error") => {
		dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color: severity }, close: true }));
	};

	// Cargar PDF templates
	useEffect(() => {
		dispatch(fetchPdfTemplates()).then((res: any) => {
			if (res.success) setPdfTemplates(res.templates || []);
			setPdfLoading(false);
		});
	}, []);

	// Cargar rich text templates cuando se activa el tab
	useEffect(() => {
		if (activeTab !== 1) return;
		setRtLoading(true);
		dispatch(fetchRichTextTemplates({ source: "user" })).then((res: any) => {
			if (res.success) setRtTemplates(res.templates || []);
			setRtLoading(false);
		});
	}, [activeTab]);

	const handlePreview = async (tpl: PdfTemplate) => {
		setPreviewTemplate(tpl);
		setPreviewUrl(null);
		setPreviewLoading(true);
		const res = await dispatch(getPdfTemplate(tpl.slug));
		if (res?.success && res.template?.previewUrl) {
			setPreviewUrl(res.template.previewUrl);
		} else {
			showSnackbar("No se pudo obtener la vista previa", "error");
		}
		setPreviewLoading(false);
	};

	const handleDeleteConfirm = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		const res = await dispatch(deleteRichTextTemplate(deleteTarget._id));
		if (res.success) {
			setRtTemplates((prev) => prev.filter((t) => t._id !== deleteTarget._id));
			showSnackbar("Modelo eliminado", "success");
		} else {
			showSnackbar(res.error || "Error al eliminar", "error");
		}
		setDeleteLoading(false);
		setDeleteTarget(null);
	};

	// Filtros
	const systemTemplates = pdfTemplates
		.filter((t) => t.source === "system" || t.isPublic || !t.userId)
		.filter((t) => {
			if (!pdfSearch.trim()) return true;
			const q = pdfSearch.toLowerCase();
			return t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q);
		});

	const filteredRtTemplates = rtTemplates.filter((t) => {
		if (!rtSearch.trim()) return true;
		const q = rtSearch.toLowerCase();
		return t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
	});

	return (
		<MainCard title="Modelos">
			<Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
				<Tab
					label={
						<Stack direction="row" alignItems="center" spacing={1}>
							<Setting2 size={16} />
							<span>Modelos del sistema</span>
						</Stack>
					}
				/>
				<Tab
					label={
						<Stack direction="row" alignItems="center" spacing={1}>
							<ClipboardText size={16} />
							<span>Mis modelos</span>
						</Stack>
					}
				/>
			</Tabs>

			{/* ── Tab 0: Modelos del sistema ── */}
			{activeTab === 0 && (
				<>
					<Stack
						direction={{ xs: "column", sm: "row" }}
						alignItems={{ sm: "center" }}
						justifyContent="space-between"
						spacing={1.5}
						sx={{ mb: 2.5 }}
					>
						<Typography variant="body2" color="textSecondary">
							Plantillas predefinidas listas para usar.
						</Typography>
						<Stack direction="row" spacing={1} alignItems="center">
							<Button
								size="small"
								variant="outlined"
								color="secondary"
								startIcon={<DocumentUpload size={15} />}
								onClick={() => setRequestModelOpen(true)}
							>
								Solicitar modelo
							</Button>
							<TextField
								size="small"
								placeholder="Buscar modelo..."
								value={pdfSearch}
								onChange={(e) => setPdfSearch(e.target.value)}
								sx={{ minWidth: 220 }}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<SearchNormal1 size={16} style={{ opacity: 0.5 }} />
										</InputAdornment>
									),
								}}
							/>
						</Stack>
					</Stack>

					{pdfLoading ? (
						<CardsSkeleton count={4} />
					) : systemTemplates.length === 0 ? (
						<Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 6 }}>
							<Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: "50%" }}>
								<ClipboardText size={32} style={{ color: theme.palette.text.secondary }} />
							</Box>
							<Typography color="textSecondary">
								{pdfSearch.trim() ? `Sin resultados para "${pdfSearch}"` : "No hay modelos del sistema configurados."}
							</Typography>
						</Stack>
					) : (
						<Grid container spacing={2.5}>
							{systemTemplates.map((tpl) => (
								<Grid item xs={12} sm={6} md={4} lg={3} key={tpl._id}>
									<ModelCard template={tpl} onPreview={handlePreview} onUse={setCreateFromTemplate} />
								</Grid>
							))}
							<Grid item xs={12} sm={6} md={4} lg={3}>
								<Card
									variant="outlined"
									onClick={() => setRequestModelOpen(true)}
									sx={{
										height: "100%",
										minHeight: 160,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										borderStyle: "dashed",
										borderColor: "primary.light",
										cursor: "pointer",
										transition: "border-color 0.2s, background-color 0.2s",
										"&:hover": { borderColor: "primary.main", bgcolor: "primary.lighter" },
									}}
								>
									<CardContent>
										<Stack alignItems="center" spacing={1.5} sx={{ textAlign: "center" }}>
											<Box sx={{ p: 1.5, bgcolor: "primary.lighter", borderRadius: "50%" }}>
												<DocumentUpload size={24} color={theme.palette.primary.main} />
											</Box>
											<Typography variant="subtitle2" fontWeight={600} color="primary">
												Solicitar nuevo modelo
											</Typography>
											<Typography variant="caption" color="textSecondary">
												¿Tenés un PDF o DOC que querés convertir en modelo autocompletable?
											</Typography>
										</Stack>
									</CardContent>
								</Card>
							</Grid>
						</Grid>
					)}
				</>
			)}

			{/* ── Tab 1: Mis modelos ── */}
			{activeTab === 1 && (
				<>
					<Stack
						direction={{ xs: "column", sm: "row" }}
						alignItems={{ sm: "center" }}
						justifyContent="space-between"
						spacing={1.5}
						sx={{ mb: 2.5 }}
					>
						<Typography variant="body2" color="textSecondary">
							Modelos de texto enriquecido propios con campos dinámicos vinculables a expedientes y contactos.
						</Typography>
						<Stack direction="row" spacing={1} alignItems="center">
							<TextField
								size="small"
								placeholder="Buscar modelo..."
								value={rtSearch}
								onChange={(e) => setRtSearch(e.target.value)}
								sx={{ minWidth: 200 }}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<SearchNormal1 size={16} style={{ opacity: 0.5 }} />
										</InputAdornment>
									),
								}}
							/>
							<Button variant="contained" size="small" startIcon={<Add size={16} />} onClick={() => navigate("/documentos/modelos/nuevo")}>
								Crear modelo
							</Button>
						</Stack>
					</Stack>

					{rtLoading ? (
						<CardsSkeleton count={3} />
					) : filteredRtTemplates.length === 0 ? (
						<Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 6 }}>
							<Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: "50%" }}>
								<ClipboardText size={32} style={{ color: theme.palette.text.secondary }} />
							</Box>
							<Typography color="textSecondary">
								{rtSearch.trim() ? `Sin resultados para "${rtSearch}"` : "Todavía no creaste ningún modelo propio."}
							</Typography>
							{!rtSearch.trim() && (
								<Button variant="outlined" size="small" startIcon={<Add size={16} />} onClick={() => navigate("/documentos/modelos/nuevo")}>
									Crear mi primer modelo
								</Button>
							)}
						</Stack>
					) : (
						<Grid container spacing={2.5}>
							{filteredRtTemplates.map((tpl) => (
								<Grid item xs={12} sm={6} md={4} lg={3} key={tpl._id}>
									<RichTextModelCard
										template={tpl}
										onEdit={(t) => navigate(`/documentos/modelos/${t._id}/editar`)}
										onDelete={setDeleteTarget}
										onUse={(t) => navigate(`/documentos/escritos/nuevo?templateId=${t._id}`)}
									/>
								</Grid>
							))}
							{/* Tarjeta para crear nuevo */}
							<Grid item xs={12} sm={6} md={4} lg={3}>
								<Card
									variant="outlined"
									onClick={() => navigate("/documentos/modelos/nuevo")}
									sx={{
										height: "100%",
										minHeight: 160,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										borderStyle: "dashed",
										borderColor: "primary.light",
										cursor: "pointer",
										transition: "border-color 0.2s, background-color 0.2s",
										"&:hover": { borderColor: "primary.main", bgcolor: "primary.lighter" },
									}}
								>
									<CardContent>
										<Stack alignItems="center" spacing={1.5} sx={{ textAlign: "center" }}>
											<Box sx={{ p: 1.5, bgcolor: "primary.lighter", borderRadius: "50%" }}>
												<Add size={24} color={theme.palette.primary.main} />
											</Box>
											<Typography variant="subtitle2" fontWeight={600} color="primary">
												Nuevo modelo
											</Typography>
										</Stack>
									</CardContent>
								</Card>
							</Grid>
						</Grid>
					)}
				</>
			)}

			{/* Diálogos */}
			<PreviewDialog
				open={Boolean(previewTemplate)}
				template={previewTemplate}
				pdfUrl={previewUrl}
				loading={previewLoading}
				onClose={() => {
					setPreviewTemplate(null);
					setPreviewUrl(null);
				}}
			/>

			<CreatePostalDocumentModal
				open={Boolean(createFromTemplate)}
				handleClose={() => setCreateFromTemplate(null)}
				preselectedTemplate={createFromTemplate}
				showSnackbar={showSnackbar}
			/>

			<SupportModal
				open={requestModelOpen}
				onClose={() => setRequestModelOpen(false)}
				defaultSubject="Solicitud de nuevo modelo de documento"
			/>

			<DeleteConfirmDialog
				open={Boolean(deleteTarget)}
				name={deleteTarget?.name ?? ""}
				loading={deleteLoading}
				onConfirm={handleDeleteConfirm}
				onClose={() => setDeleteTarget(null)}
			/>
		</MainCard>
	);
};

export default ModelosPage;
