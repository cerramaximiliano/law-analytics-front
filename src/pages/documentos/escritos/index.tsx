import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Autocomplete,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	Fab,
	FormControl,
	Grid,
	IconButton,
	InputAdornment,
	Menu,
	MenuItem as MuiMenuItem,
	Pagination,
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
	useMediaQuery,
	Divider,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
	Add,
	ArrowDown2,
	CloseSquare,
	DocumentDownload,
	DocumentText,
	Edit,
	Eye,
	FolderOpen,
	Printer,
	Routing,
	SearchNormal1,
	Trash,
} from "iconsax-react";
import MainCard from "components/MainCard";
import { useDispatch, useSelector } from "store";
import {
	fetchRichTextDocuments,
	fetchRichTextTemplates,
	deleteRichTextDocument,
	updateRichTextDocument,
	previewRichTextDocument,
} from "store/reducers/richTextDocuments";
import {
	fetchPostalDocuments,
	deletePostalDocument,
	updatePostalDocument,
	previewPostalDocument,
	getPdfTemplate,
} from "store/reducers/postalDocuments";
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
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// ── Constants ──────────────────────────────────────────────────────────────────

const VALID_CODE_IDS = [
	"CC",
	"CD",
	"CL",
	"CM",
	"CO",
	"CP",
	"DE",
	"DI",
	"EC",
	"EE",
	"EO",
	"EP",
	"GC",
	"GD",
	"GE",
	"GF",
	"GO",
	"GR",
	"GS",
	"HC",
	"HD",
	"HE",
	"HO",
	"HU",
	"HX",
	"IN",
	"IS",
	"JP",
	"LC",
	"LS",
	"ND",
	"MD",
	"ME",
	"MC",
	"MS",
	"MU",
	"MX",
	"OL",
	"PC",
	"PP",
	"RD",
	"RE",
	"RP",
	"RR",
	"SD",
	"SL",
	"SP",
	"SR",
	"ST",
	"TC",
	"TD",
	"TL",
	"UP",
];

const TRACKING_SLUGS = ["telegrama_laboral"];

// ── Types ──────────────────────────────────────────────────────────────────────

type TypeFilter = "all" | "system" | "user"; // origen del modelo: sistema vs propio

interface DocRow {
	kind: "postal" | "richtext";
	id: string;
	title: string;
	templateName: string;
	templateSlug?: string;
	category?: string;
	source?: "system" | "user";
	status: string;
	linkedFolderId?: string | null;
	linkedTrackingId?: string | null;
	supportsTracking?: boolean;
	documentUrl?: string;
	createdAt?: string;
	docKind?: "formulario" | "documento";
	linkedDocumentId?: string | null;
	rawPostal?: PostalDocumentType;
	rawRichText?: RichTextDocument;
}

const PAGE_SIZE = 10;
const FETCH_LIMIT = 500; // paginación client-side sobre el set completo

// ── Status configs (brand-aware) ───────────────────────────────────────────────

const POSTAL_STATUS_LABELS: Record<string, string> = {
	draft: "Borrador",
	generated: "Generado",
	sent: "Enviado",
	archived: "Archivado",
};

const RT_STATUS_LABELS: Record<string, string> = { draft: "Borrador", final: "Final" };

const DOC_CATEGORY_LABELS: Record<string, string> = {
	judicial: "Judicial",
	laboral: "Laboral",
	societario: "Societario",
	notarial: "Notarial",
	postal: "Postal",
	civil: "Civil",
	penal: "Penal",
	familia: "Familia",
	otros: "Otros",
	otro: "Otro",
};
const catLabel = (c: string) => DOC_CATEGORY_LABELS[c] || c.charAt(0).toUpperCase() + c.slice(1);

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
			category: d.templateCategory,
			source: ((d as any).templateSource as "system" | "user") || "system",
			status: d.status,
			linkedFolderId: d.linkedFolderId as string | null | undefined,
			linkedTrackingId: d.linkedTrackingId as string | null | undefined,
			supportsTracking: Boolean(d.supportsTracking) || TRACKING_SLUGS.includes(d.templateSlug ?? ""),
			documentUrl: d.documentUrl,
			createdAt: d.createdAt,
			docKind: d.docKind,
			linkedDocumentId: (d.linkedDocumentId as string | null | undefined) ?? null,
			rawPostal: d,
		};
	} else {
		const d = doc as RichTextDocument;
		return {
			kind,
			id: d._id,
			title: d.title,
			templateName: d.templateName || "—",
			category: (d as any).templateCategory,
			source: ((d as any).templateSource as "system" | "user") || "user",
			status: d.status,
			linkedFolderId: d.linkedFolderId,
			createdAt: d.createdAt,
			rawRichText: d,
		};
	}
}

// ── Brand Pills ────────────────────────────────────────────────────────────────

const BrandPill = ({ color, label, dot = true }: { color: string; label: string; dot?: boolean }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				gap: 0.625,
				px: 0.875,
				py: 0.25,
				borderRadius: 0.75,
				bgcolor: alpha(color, isDark ? 0.16 : 0.1),
				border: `1px solid ${alpha(color, isDark ? 0.32 : 0.22)}`,
			}}
		>
			{dot && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />}
			<Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color, letterSpacing: "0.01em", lineHeight: 1 }}>{label}</Typography>
		</Box>
	);
};

const PostalStatusPill = ({ value }: { value: string }) => {
	const theme = useTheme();
	const map: Record<string, string> = {
		draft: STALE_AMBER,
		generated: LIVE_GREEN,
		sent: BRAND_BLUE,
		archived: theme.palette.text.secondary,
	};
	const color = map[value] ?? theme.palette.text.secondary;
	return <BrandPill color={color} label={POSTAL_STATUS_LABELS[value] ?? value} />;
};

const RichTextStatusPill = ({ value }: { value: string }) => {
	const theme = useTheme();
	const map: Record<string, string> = {
		final: LIVE_GREEN,
		draft: theme.palette.text.secondary,
	};
	const color = map[value] ?? theme.palette.text.secondary;
	return <BrandPill color={color} label={RT_STATUS_LABELS[value] ?? value} />;
};

const TypePill = ({ docKind }: { docKind?: "formulario" | "documento" }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	// Todo es "Formulario" (planilla de captura) o "Documento" (escrito generado, incluidos los del editor).
	const isForm = docKind === "formulario";
	const label = isForm ? "Formulario" : "Documento";
	const color = isForm ? theme.palette.warning.main : BRAND_BLUE;
	const Icon = DocumentText;
	return (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				gap: 0.5,
				px: 0.75,
				py: 0.25,
				borderRadius: 0.75,
				bgcolor: alpha(color, isDark ? 0.14 : 0.08),
				border: `1px solid ${alpha(color, isDark ? 0.28 : 0.18)}`,
				color,
			}}
		>
			<Icon size={11} variant="Linear" />
			<Typography sx={{ fontSize: "0.66rem", fontWeight: 600, color, letterSpacing: "0.01em", lineHeight: 1 }}>{label}</Typography>
		</Box>
	);
};

const TrackingMicroPill = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				gap: 0.5,
				px: 0.625,
				py: 0.125,
				borderRadius: 0.75,
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
			}}
		>
			<Routing size={9} variant="Linear" color={BRAND_BLUE} />
			<Typography sx={{ fontSize: "0.6rem", fontWeight: 600, color: BRAND_BLUE, letterSpacing: "0.04em", lineHeight: 1 }}>
				Seguimiento
			</Typography>
		</Box>
	);
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

const RowSkeleton = () => (
	<TableRow>
		{[220, 140, 90, 100, 90, 60].map((w, i) => (
			<TableCell key={i}>
				<Skeleton variant="text" width={w} />
			</TableCell>
		))}
	</TableRow>
);

// ── Shared brand styles ────────────────────────────────────────────────────────

const useBrandStyles = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const brandPrimaryButtonSx = {
		minWidth: 130,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};

	const ghostCancelSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		px: 2,
		py: 0.75,
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.28),
		},
	};

	const iconBtnSx = {
		width: 32,
		height: 32,
		borderRadius: 1,
		color: "text.secondary",
		transition: "color 0.15s ease, background-color 0.15s ease",
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
	};

	const iconBtnDestructiveSx = {
		...iconBtnSx,
		"&:hover": { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, isDark ? 0.14 : 0.08) },
	};

	const tableSx = {
		"& .MuiTableHead-root .MuiTableCell-root": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
			color: "text.secondary",
			fontSize: "0.68rem",
			fontWeight: 600,
			letterSpacing: "0.06em",
			textTransform: "uppercase",
			borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
			py: 1.25,
		},
		"& .MuiTableBody-root .MuiTableRow-root": {
			transition: "background-color 0.12s ease",
		},
		"& .MuiTableBody-root .MuiTableRow-root:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
		},
		"& .MuiTableBody-root .MuiTableCell-root": {
			borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.1 : 0.06)}`,
		},
	};

	const dialogPaperSx = {
		borderRadius: 2,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
		overflow: "hidden",
	};

	const inputSx = {
		"& .MuiOutlinedInput-root": {
			borderRadius: 1.25,
			fontSize: "0.875rem",
			"& fieldset": {
				borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14),
				transition: "border-color 0.15s ease",
			},
			"&:hover fieldset": {
				borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28),
			},
			"&.Mui-focused fieldset": {
				borderColor: BRAND_BLUE,
				borderWidth: 1,
			},
		},
	};

	const menuPaperSx = {
		mt: 0.5,
		minWidth: 220,
		borderRadius: 1.5,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		boxShadow: `0 10px 28px ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)}`,
		"& .MuiMenuItem-root": {
			fontSize: "0.82rem",
			letterSpacing: "-0.005em",
			py: 0.875,
			"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06) },
		},
	};

	const dialogHeaderSx = {
		position: "relative" as const,
		overflow: "hidden",
		p: { xs: 2.25, sm: 2.5 },
		bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
		borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
	};

	return {
		brandPrimaryButtonSx,
		ghostCancelSx,
		iconBtnSx,
		iconBtnDestructiveSx,
		tableSx,
		dialogPaperSx,
		inputSx,
		menuPaperSx,
		dialogHeaderSx,
		isDark,
	};
};

// ── Dialog header atmosférico reusable ─────────────────────────────────────────

const DialogBrandHeader = ({
	eyebrow,
	title,
	subtitle,
	icon,
	onClose,
}: {
	eyebrow: string;
	title: string;
	subtitle?: string;
	icon: React.ReactNode;
	onClose: () => void;
}) => {
	const { isDark, dialogHeaderSx, iconBtnSx } = useBrandStyles();
	return (
		<Box sx={dialogHeaderSx}>
			{/* Radial blob */}
			<Box
				sx={{
					position: "absolute",
					top: -60,
					right: -40,
					width: 220,
					height: 220,
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
					pointerEvents: "none",
				}}
			/>
			{/* Dot grid */}
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					backgroundImage: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)} 1px, transparent 1px)`,
					backgroundSize: "20px 20px",
					maskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
					WebkitMaskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
					opacity: 0.55,
					pointerEvents: "none",
				}}
			/>
			<Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
				<Box
					sx={{
						width: 40,
						height: 40,
						borderRadius: 1.5,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
						color: BRAND_BLUE,
						flexShrink: 0,
					}}
				>
					{icon}
				</Box>
				<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
					<Stack direction="row" spacing={0.75} alignItems="center">
						<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
						<Typography
							sx={{
								fontSize: "0.6rem",
								fontWeight: 600,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: "text.secondary",
							}}
						>
							{eyebrow}
						</Typography>
					</Stack>
					<Typography
						sx={{
							fontSize: "1.05rem",
							fontWeight: 600,
							letterSpacing: "-0.015em",
							color: "text.primary",
							textWrap: "balance",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{title}
					</Typography>
					{subtitle && (
						<Typography
							sx={{
								fontSize: "0.78rem",
								color: "text.secondary",
								letterSpacing: "-0.005em",
								textWrap: "pretty",
							}}
						>
							{subtitle}
						</Typography>
					)}
				</Stack>
				<IconButton onClick={onClose} sx={iconBtnSx} aria-label="cerrar">
					<CloseSquare size={20} variant="Linear" />
				</IconButton>
			</Stack>
		</Box>
	);
};

// ── TemplatePickerDialog ───────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<RichTextTemplateCategory, string> = {
	civil: "Civil",
	laboral: "Laboral",
	penal: "Penal",
	familia: "Familia",
	societario: "Societario",
	otro: "Otro",
};

interface TemplatePickerDialogProps {
	open: boolean;
	onClose: () => void;
}

const TemplatePickerDialog = ({ open, onClose }: TemplatePickerDialogProps) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { templates, isLoader } = useSelector((state: any) => state.richTextDocumentsReducer);
	const { brandPrimaryButtonSx, ghostCancelSx, inputSx, dialogPaperSx, isDark } = useBrandStyles();

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
			!search || t.name.toLowerCase().includes(search.toLowerCase()) || (t.description ?? "").toLowerCase().includes(search.toLowerCase());
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
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
			<DialogBrandHeader
				eyebrow="Mis modelos"
				title="Elegir modelo"
				subtitle="Seleccioná un modelo para pre-cargar contenido y campos dinámicos."
				icon={<DocumentText size={20} variant="Bulk" />}
				onClose={onClose}
			/>

			<DialogContent sx={{ pb: 0, pt: 2.5 }}>
				{/* Filters */}
				<Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} mb={2}>
					<TextField
						size="small"
						placeholder="Buscar modelo..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						sx={{ flex: 1, ...inputSx }}
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
						sx={{
							minWidth: { xs: "100%", sm: 180 },
							borderRadius: 1.25,
							fontSize: "0.875rem",
							"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
							"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
							"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
						}}
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
						<CircularProgress size={32} sx={{ color: BRAND_BLUE }} />
					</Stack>
				) : filtered.length === 0 ? (
					<Stack alignItems="center" justifyContent="center" spacing={1} py={6}>
						<Box
							sx={{
								width: 48,
								height: 48,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
							}}
						>
							<DocumentText size={22} variant="Bulk" />
						</Box>
						<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", textAlign: "center", textWrap: "pretty" }}>
							{search || categoryFilter
								? "No hay modelos que coincidan con los filtros."
								: "Todavía no creaste ningún modelo. Podés crear uno desde «Documentos › Modelos»."}
						</Typography>
					</Stack>
				) : (
					<Box sx={{ maxHeight: 360, overflowY: "auto", pr: 0.5, pb: 1 }}>
						<Stack spacing={1}>
							{filtered.map((tpl) => {
								const isSelected = selected?._id === tpl._id;
								return (
									<Box
										key={tpl._id}
										onClick={() => setSelected(isSelected ? null : tpl)}
										sx={{
											p: 1.25,
											borderRadius: 1.25,
											cursor: "pointer",
											bgcolor: isSelected ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.06) : "background.paper",
											border: `1px solid ${isSelected ? alpha(BRAND_BLUE, 0.55) : alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
											transition: "border-color 0.15s ease, background-color 0.15s ease",
											"&:hover": {
												borderColor: alpha(BRAND_BLUE, isSelected ? 0.65 : 0.32),
												bgcolor: isSelected ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.08) : alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
											},
										}}
									>
										<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
											<Stack spacing={0.5} flex={1} minWidth={0}>
												<Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" gap={0.5}>
													<Typography
														sx={{
															fontSize: "0.875rem",
															fontWeight: 600,
															letterSpacing: "-0.005em",
															color: "text.primary",
														}}
													>
														{tpl.name}
													</Typography>
													<BrandPill color={BRAND_BLUE} label={CATEGORY_LABELS[tpl.category]} dot={false} />
												</Stack>
												{tpl.description && (
													<Typography sx={{ fontSize: "0.75rem", color: "text.secondary", letterSpacing: "-0.005em" }} noWrap>
														{tpl.description}
													</Typography>
												)}
											</Stack>
											{tpl.mergeFields?.length > 0 && (
												<Typography
													sx={{
														fontSize: "0.65rem",
														fontWeight: 600,
														color: "text.secondary",
														letterSpacing: "0.04em",
														textTransform: "uppercase",
														flexShrink: 0,
													}}
												>
													{tpl.mergeFields.length} campo{tpl.mergeFields.length !== 1 ? "s" : ""}
												</Typography>
											)}
										</Stack>
									</Box>
								);
							})}
						</Stack>
					</Box>
				)}
			</DialogContent>

			<DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
				<Button variant="text" onClick={handleBlank} data-testid="picker-blank-btn" sx={ghostCancelSx}>
					Continuar sin modelo
				</Button>
				<Stack direction="row" spacing={1.25}>
					<Button onClick={onClose} sx={ghostCancelSx}>
						Cancelar
					</Button>
					<Button onClick={handleContinue} disabled={!selected} data-testid="picker-continue-btn" sx={brandPrimaryButtonSx}>
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
	const { brandPrimaryButtonSx, ghostCancelSx, inputSx, dialogPaperSx, isDark } = useBrandStyles();

	const isPostal = docRow?.kind === "postal";
	const supportsTracking = isPostal && Boolean(docRow?.supportsTracking);

	const [tab, setTab] = useState(0);
	const [submitting, setSubmitting] = useState(false);

	// Folder
	const [selectedFolder, setSelectedFolder] = useState<FolderData | null>(null);

	// Tracking
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

		const currentFolder = folders.find((f) => f._id === docRow.linkedFolderId) || null;
		setSelectedFolder(currentFolder);

		if (folders.length === 0 && userId) dispatch(getFoldersByUserId(userId) as any);
		if (isPostal && supportsTracking) {
			setLoadingTrackings(true);
			dispatch(fetchAllTrackings() as any).then(() => setLoadingTrackings(false));
		}
	}, [open]); // eslint-disable-line react-hooks/exhaustive-deps

	const activeFolders = folders.filter((f: any) => f.status !== "archived");

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
				}) as any,
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
					}) as any,
				),
				(dispatch as any)(
					updatePostalDocument(docRow.id, {
						linkedTrackingId: selectedTracking._id,
						...(resolvedFolder && resolvedFolder !== documentFolder ? { linkedFolderId: resolvedFolder as any } : {}),
					}),
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

	const brandTabsSx = {
		"& .MuiTab-root": {
			textTransform: "none",
			fontWeight: 600,
			fontSize: "0.82rem",
			letterSpacing: "-0.005em",
			color: "text.secondary",
			minHeight: 40,
			"&.Mui-selected": { color: BRAND_BLUE },
		},
		"& .MuiTabs-indicator": { backgroundColor: BRAND_BLUE, height: 2 },
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
			<DialogBrandHeader
				eyebrow="Vincular documento"
				title={docRow.title}
				subtitle="Asociá este documento a una carpeta o seguimiento postal."
				icon={<Routing size={20} variant="Bulk" />}
				onClose={onClose}
			/>

			<Tabs
				value={tab}
				onChange={(_, v) => setTab(v)}
				sx={{ px: 3, borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`, ...brandTabsSx }}
			>
				<Tab label="Carpeta" />
				{supportsTracking && <Tab label="Seguimiento postal" />}
			</Tabs>

			<DialogContent sx={{ pt: 2.5, minHeight: 240, display: "flex", flexDirection: "column" }}>
				{tab === 0 && (
					<Stack spacing={2}>
						<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
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
										<Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>{f.folderName}</Typography>
										{f.folderFuero && <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{f.folderFuero}</Typography>}
									</Stack>
								</Box>
							)}
							renderInput={(params) => <TextField {...params} label="Buscar carpeta..." sx={inputSx} />}
							noOptionsText="Sin carpetas disponibles"
						/>
						{docRow.linkedFolderId && !selectedFolder && (
							<Typography sx={{ fontSize: "0.72rem", color: STALE_AMBER, letterSpacing: "-0.005em" }}>
								Si confirmás sin seleccionar una carpeta, se eliminará la vinculación actual.
							</Typography>
						)}
					</Stack>
				)}

				{tab === 1 && supportsTracking && (
					<Stack direction="row" sx={{ flex: 1, minHeight: 0 }}>
						<Tabs
							value={trackingTab}
							onChange={(_, v) => setTrackingTab(v)}
							orientation="vertical"
							sx={{
								borderRight: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
								minWidth: 150,
								mr: 2,
								...brandTabsSx,
								"& .MuiTab-root": {
									...brandTabsSx["& .MuiTab-root"],
									alignItems: "flex-start",
									textAlign: "left",
									minHeight: 48,
								},
							}}
						>
							<Tab label="Crear nuevo" />
							<Tab label="Vincular existente" />
						</Tabs>

						<Box sx={{ flex: 1, overflow: "auto" }}>
							{trackingTab === 0 && (
								<Stack spacing={2}>
									<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
										Ingresá el código de seguimiento del envío postal para registrarlo y vincularlo a este documento.
									</Typography>
									<Stack direction="row" spacing={1.25}>
										<FormControl size="small" sx={{ minWidth: 90 }}>
											<Select
												value={codeId}
												onChange={(e) => setCodeId(e.target.value)}
												sx={{
													borderRadius: 1.25,
													fontSize: "0.875rem",
													"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
													"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
													"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
												}}
											>
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
											sx={inputSx}
										/>
									</Stack>
									<TextField
										size="small"
										label="Etiqueta (opcional)"
										fullWidth
										value={label}
										onChange={(e) => setLabel(e.target.value)}
										sx={inputSx}
									/>
									{docRow.linkedFolderId && (
										<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
											El seguimiento también se vinculará a la carpeta asociada al documento.
										</Typography>
									)}
								</Stack>
							)}

							{trackingTab === 1 && (
								<Stack spacing={2}>
									<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
										Seleccioná un seguimiento postal ya existente para vincularlo a este documento.
									</Typography>
									{loadingTrackings ? (
										<Stack alignItems="center" sx={{ py: 3 }}>
											<CircularProgress size={28} sx={{ color: BRAND_BLUE }} />
										</Stack>
									) : (
										<Autocomplete
											size="small"
											options={trackings}
											value={selectedTracking}
											getOptionLabel={(t: PostalTrackingType) => `${t.codeId} ${t.numberId}${t.label ? ` — ${t.label}` : ""}`}
											isOptionEqualToValue={(opt, val) => opt._id === val._id}
											onChange={(_e, val) => setSelectedTracking(val)}
											renderOption={(props, t: PostalTrackingType) => (
												<Box component="li" {...props} key={t._id}>
													<Stack>
														<Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>
															{t.codeId} {t.numberId}
														</Typography>
														{t.label && <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{t.label}</Typography>}
													</Stack>
												</Box>
											)}
											renderInput={(params) => <TextField {...params} label="Buscar seguimiento..." sx={inputSx} />}
											noOptionsText="Sin seguimientos disponibles"
										/>
									)}
									{selectedTracking?.documentId && selectedTracking.documentId !== docRow.id && (
										<Typography sx={{ fontSize: "0.72rem", color: STALE_AMBER, letterSpacing: "-0.005em" }}>
											Este seguimiento ya tiene un documento vinculado. Al continuar se reemplazará.
										</Typography>
									)}
									{folderConflict && (
										<Typography sx={{ fontSize: "0.72rem", color: STALE_AMBER, letterSpacing: "-0.005em" }}>
											El seguimiento y el documento están vinculados a carpetas distintas. Se usará la carpeta del seguimiento para ambos.
										</Typography>
									)}
									{folderPropagation && !folderConflict && (
										<Typography sx={{ fontSize: "0.72rem", color: BRAND_BLUE, letterSpacing: "-0.005em" }}>
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
				<Button onClick={onClose} disabled={submitting} sx={ghostCancelSx}>
					Cancelar
				</Button>
				{tab === 0 && (
					<Button
						onClick={handleSaveFolder}
						disabled={submitting}
						startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <FolderOpen size={16} variant="Linear" />}
						sx={brandPrimaryButtonSx}
					>
						Guardar carpeta
					</Button>
				)}
				{tab === 1 && trackingTab === 0 && (
					<Button
						onClick={handleCreateTracking}
						disabled={submitting || !numberIdValid}
						startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <Routing size={16} variant="Linear" />}
						sx={brandPrimaryButtonSx}
					>
						Crear seguimiento
					</Button>
				)}
				{tab === 1 && trackingTab === 1 && (
					<Button
						onClick={handleLinkTracking}
						disabled={submitting || !selectedTracking || loadingTrackings}
						startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <Routing size={16} variant="Linear" />}
						sx={brandPrimaryButtonSx}
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
	const { brandPrimaryButtonSx, ghostCancelSx, dialogPaperSx, isDark } = useBrandStyles();
	const [freshUrl, setFreshUrl] = useState<string | null>(null); // PDF de preview (para el iframe)
	const [downloadUrl, setDownloadUrl] = useState<string | null>(null); // archivo original (para descargar)
	const [urlLoading, setUrlLoading] = useState(false);

	useEffect(() => {
		if (!open || !doc?._id) return;
		setFreshUrl(null);
		setDownloadUrl(null);
		setUrlLoading(true);
		// Preview: si es .docx el server lo convierte a PDF; devuelve también la URL de descarga del original.
		(dispatch as any)(previewPostalDocument(doc._id)).then((res: any) => {
			if (res?.success) {
				setFreshUrl(res.url || null);
				setDownloadUrl(res.downloadUrl || res.url || null);
			}
			setUrlLoading(false);
		});
	}, [open, doc?._id]);

	if (!doc) return null;

	const linkedFolder = doc.linkedFolderId ? folders.find((f: any) => f._id === doc.linkedFolderId) : null;

	const metaLabelSx = {
		fontSize: "0.6rem",
		fontWeight: 600,
		letterSpacing: "0.08em",
		textTransform: "uppercase",
		color: "text.secondary",
	} as const;
	const metaValueSx = { fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" } as const;

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
			<DialogBrandHeader
				eyebrow="Documento postal"
				title={doc.title}
				subtitle={doc.templateName}
				icon={<DocumentDownload size={20} variant="Bulk" />}
				onClose={onClose}
			/>

			<DialogContent sx={{ p: 0 }}>
				<Grid container sx={{ height: 480 }}>
					<Grid item xs={12} md={8} sx={{ height: "100%", borderRight: { md: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` } }}>
						{urlLoading ? (
							<Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
								<CircularProgress size={28} sx={{ color: BRAND_BLUE }} />
							</Stack>
						) : freshUrl ? (
							// El server ya devuelve un PDF (convertido si el original era .docx) → se previsualiza en el iframe.
							<iframe src={freshUrl} title={doc.title} style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
						) : (
							<Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
								<Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>El documento no está disponible.</Typography>
							</Stack>
						)}
					</Grid>
					<Grid item xs={12} md={4} sx={{ p: 2.5, overflowY: "auto" }}>
						<Stack spacing={2}>
							<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
								<PostalStatusPill value={doc.status} />
							</Stack>
							<Stack spacing={0.5}>
								<Typography sx={metaLabelSx}>Modelo</Typography>
								<Typography sx={metaValueSx}>{doc.templateName}</Typography>
							</Stack>
							<Stack spacing={0.5}>
								<Typography sx={metaLabelSx}>Fecha</Typography>
								<Typography sx={metaValueSx}>{formatDate(doc.createdAt)}</Typography>
							</Stack>
							{linkedFolder && (
								<Stack spacing={0.5}>
									<Typography sx={metaLabelSx}>Carpeta</Typography>
									<Typography sx={metaValueSx}>{linkedFolder.folderName}</Typography>
								</Stack>
							)}
							{doc.description && (
								<Stack spacing={0.5}>
									<Typography sx={metaLabelSx}>Descripción</Typography>
									<Typography sx={{ ...metaValueSx, textWrap: "pretty" }}>{doc.description}</Typography>
								</Stack>
							)}
						</Stack>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onClose} sx={ghostCancelSx}>
					Cerrar
				</Button>
				{freshUrl && (
					<Button onClick={() => window.open(freshUrl, "_blank")} startIcon={<Printer size={16} variant="Linear" />} sx={ghostCancelSx}>
						Imprimir (PDF)
					</Button>
				)}
				{downloadUrl && (
					<Button
						onClick={() => window.open(downloadUrl, "_blank")}
						startIcon={<DocumentDownload size={16} variant="Linear" />}
						sx={brandPrimaryButtonSx}
					>
						Descargar
					</Button>
				)}
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

const DeleteDialog = ({ open, title, loading, onConfirm, onClose }: DeleteDialogProps) => {
	const theme = useTheme();
	const { ghostCancelSx, dialogPaperSx, isDark } = useBrandStyles();
	const errorColor = theme.palette.error.main;

	return (
		<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
			<DialogContent sx={{ p: { xs: 3, sm: 3.5 }, position: "relative" }}>
				<Box
					sx={{
						position: "absolute",
						top: -80,
						left: "50%",
						transform: "translateX(-50%)",
						width: 280,
						height: 280,
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(errorColor, isDark ? 0.18 : 0.1)} 0%, transparent 70%)`,
						pointerEvents: "none",
					}}
				/>
				<Stack alignItems="center" spacing={2.25} sx={{ position: "relative" }}>
					<Box
						sx={{
							width: 60,
							height: 60,
							borderRadius: 1.5,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(errorColor, isDark ? 0.16 : 0.08),
							border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.2)}`,
							color: errorColor,
						}}
					>
						<Trash size={26} variant="Bulk" />
					</Box>
					<Stack spacing={1} alignItems="center">
						<Typography
							sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary", textAlign: "center" }}
						>
							¿Eliminar este documento?
						</Typography>
						<Typography
							sx={{ fontSize: "0.85rem", color: "text.secondary", letterSpacing: "-0.005em", textAlign: "center", textWrap: "pretty" }}
						>
							Vas a eliminar{" "}
							<Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
								"{title}"
							</Box>{" "}
							de forma permanente. Esta acción no se puede deshacer.
						</Typography>
					</Stack>
					<Stack direction="row" spacing={1.25} sx={{ width: 1, mt: 0.5 }}>
						<Button fullWidth onClick={onClose} disabled={loading} sx={ghostCancelSx}>
							Cancelar
						</Button>
						<Button
							fullWidth
							onClick={onConfirm}
							disabled={loading}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								bgcolor: errorColor,
								color: "#fff",
								borderRadius: 1.25,
								py: 1,
								boxShadow: "none",
								"&:hover": { bgcolor: alpha(errorColor, 0.88), boxShadow: "none" },
							}}
						>
							{loading ? <CircularProgress size={16} color="inherit" /> : "Eliminar"}
						</Button>
					</Stack>
				</Stack>
			</DialogContent>
		</Dialog>
	);
};

// ── Header Stat (mini stat tile) ───────────────────────────────────────────────

const HeaderStat = ({ label, value, tone = "primary" }: { label: string; value: number; tone?: "primary" | "amber" | "neutral" }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const color = tone === "primary" ? BRAND_BLUE : tone === "amber" ? STALE_AMBER : theme.palette.text.secondary;
	return (
		<Stack
			spacing={0.25}
			sx={{
				px: 1.25,
				py: 0.875,
				borderRadius: 1.25,
				bgcolor: alpha(color, isDark ? 0.12 : 0.06),
				border: `1px solid ${alpha(color, isDark ? 0.26 : 0.16)}`,
				minWidth: 86,
			}}
		>
			<Typography
				sx={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
			>
				{label}
			</Typography>
			<Typography
				sx={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.015em", color, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}
			>
				{value}
			</Typography>
		</Stack>
	);
};

// ── Page ───────────────────────────────────────────────────────────────────────

const EscritosPage = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const { brandPrimaryButtonSx, iconBtnSx, iconBtnDestructiveSx, tableSx, inputSx, menuPaperSx, isDark } = useBrandStyles();

	const { documents: rtDocs, isLoader: rtLoading } = useSelector((state: any) => state.richTextDocumentsReducer);
	const { documents: postalDocs, isLoader: postalLoading } = useSelector((state: any) => state.postalDocumentsReducer);
	const folders = useSelector((state: any) => state.folder?.folders || []);
	const userId = useSelector((state: any) => state.auth?.user?._id);

	const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
	const [catFilter, setCatFilter] = useState<string>("");
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [newDocMenuAnchor, setNewDocMenuAnchor] = useState<null | HTMLElement>(null);
	const [openCreatePostal, setOpenCreatePostal] = useState(false);
	// Retomar un borrador: template + datos del doc para reabrir el modal de llenado.
	const [resumeData, setResumeData] = useState<{
		template: any;
		doc: { _id: string; title?: string; description?: string; formData?: Record<string, string> };
	} | null>(null);
	const [continuing, setContinuing] = useState(false);
	const [openTemplatePicker, setOpenTemplatePicker] = useState(false);
	const [postalDetail, setPostalDetail] = useState<PostalDocumentType | null>(null);
	const [vincularRow, setVincularRow] = useState<DocRow | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<{ kind: "postal" | "richtext"; id: string; title: string } | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [mainLimitErrorOpen, setMainLimitErrorOpen] = useState(false);
	const [mainLimitErrorData, setMainLimitErrorData] = useState<{
		resourceType: string;
		plan: string;
		currentCount: string;
		limit: number;
	} | null>(null);

	useEffect(() => {
		if (folders.length === 0 && userId) {
			dispatch(getFoldersByUserId(userId) as any);
		}
	}, [dispatch, userId]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		// Siempre traemos ambos orígenes; el filtro (sistema/propio) se aplica client-side por `source`.
		dispatch(fetchPostalDocuments({ page: 1, limit: FETCH_LIMIT, search: search || undefined }) as any);
		dispatch(fetchRichTextDocuments({ page: 1, limit: FETCH_LIMIT, search: search || undefined }));
	}, [dispatch, search]);

	const rows = useMemo((): DocRow[] => {
		const result: DocRow[] = [
			...(postalDocs as PostalDocumentType[]).map((d) => toDocRow(d, "postal")),
			...(rtDocs as RichTextDocument[]).map((d) => toDocRow(d, "richtext")),
		];
		result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
		return result;
	}, [postalDocs, rtDocs]);

	// Filtro por origen (sistema/propio) + categoría. Categorías presentes para el dropdown.
	const availableCategories = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean) as string[])].sort(), [rows]);
	const filteredRows = useMemo(
		() => rows.filter((r) => (typeFilter === "all" || r.source === typeFilter) && (!catFilter || r.category === catFilter)),
		[rows, typeFilter, catFilter],
	);
	const systemCount = useMemo(() => rows.filter((r) => r.source === "system").length, [rows]);
	const userCount = useMemo(() => rows.filter((r) => r.source === "user").length, [rows]);

	const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
	const pagedRows = useMemo(() => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredRows, page]);
	const isLoading = postalLoading || rtLoading;

	useEffect(() => {
		if (page > totalPages) setPage(totalPages);
	}, [page, totalPages]);

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
			// nothing
		}
		return true;
	};

	const showSnackbar = (message: string, severity: "success" | "error") => {
		dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color: severity }, close: true }));
	};

	// "Imprimir": abre el PDF del documento (convertido si el original es .docx, o TipTap→PDF si es del editor).
	const handleContinue = async (row: DocRow) => {
		const d = row.rawPostal;
		if (!d || !row.templateSlug) return;
		setContinuing(true);
		const res: any = await dispatch(getPdfTemplate(row.templateSlug) as any);
		setContinuing(false);
		if (res?.success && res.template) {
			setResumeData({
				template: res.template,
				doc: {
					_id: row.id,
					title: d.title,
					description: (d as any).description,
					formData: ((d as any).formData as Record<string, string>) || {},
				},
			});
		} else {
			showSnackbar("No se pudo cargar el formulario del borrador", "error");
		}
	};

	const handlePrint = async (row: DocRow) => {
		const res: any =
			row.kind === "richtext"
				? await (dispatch as any)(previewRichTextDocument(row.id))
				: await (dispatch as any)(previewPostalDocument(row.id));
		if (res?.success && res.url) window.open(res.url, "_blank");
		else showSnackbar(res?.error || "No se pudo obtener el PDF", "error");
	};

	const refreshDocuments = () => {
		dispatch(fetchPostalDocuments({ page: 1, limit: FETCH_LIMIT, search: search || undefined }) as any);
		dispatch(fetchRichTextDocuments({ page: 1, limit: FETCH_LIMIT, search: search || undefined }));
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
		<Stack spacing={2.5} sx={{ mt: 1 }}>
			{/* Header brand atmosférico */}
			<Box
				sx={{
					position: "relative",
					overflow: "hidden",
					borderRadius: 2,
					p: { xs: 2, md: 2.5 },
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)}`,
				}}
			>
				<Box
					sx={{
						position: "absolute",
						top: -60,
						right: -40,
						width: 280,
						height: 280,
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
						pointerEvents: "none",
					}}
				/>
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						backgroundImage: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)} 1px, transparent 1px)`,
						backgroundSize: "22px 22px",
						maskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
						WebkitMaskImage: "radial-gradient(ellipse at top right, black 0%, transparent 60%)",
						opacity: 0.6,
						pointerEvents: "none",
					}}
				/>

				<Stack
					direction={{ xs: "column", md: "row" }}
					alignItems={{ xs: "flex-start", md: "center" }}
					spacing={{ xs: 1.75, md: 3 }}
					sx={{ position: "relative" }}
				>
					{/* Identidad */}
					<Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
						<Box
							sx={{
								width: 44,
								height: 44,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
								flexShrink: 0,
							}}
						>
							<DocumentText size={22} variant="Bulk" />
						</Box>
						<Stack spacing={0.25} sx={{ minWidth: 0 }}>
							<Stack direction="row" spacing={0.875} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
								<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
								<Typography
									sx={{
										fontSize: "0.62rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Documentos
								</Typography>
							</Stack>
							<Typography
								sx={{
									fontSize: { xs: "1.05rem", md: "1.25rem" },
									fontWeight: 600,
									letterSpacing: "-0.015em",
									color: "text.primary",
									textWrap: "balance",
								}}
							>
								Tus escritos
							</Typography>
							<Typography
								sx={{
									display: { xs: "none", md: "block" },
									fontSize: "0.82rem",
									color: "text.secondary",
									letterSpacing: "-0.005em",
									textWrap: "pretty",
								}}
							>
								Documentos generados a partir de modelos del sistema y modelos propios.
							</Typography>
						</Stack>
					</Stack>

					{/* Métricas */}
					<Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, display: { xs: "none", sm: "flex" } }}>
						<HeaderStat label="Totales" value={rows.length} tone="primary" />
						<HeaderStat label="Del sistema" value={systemCount} tone="neutral" />
						<HeaderStat label="Mis modelos" value={userCount} tone="amber" />
					</Stack>

					{/* CTA */}
					<Box sx={{ flexShrink: 0 }}>
						{isMobile ? (
							<Fab
								size="small"
								aria-label="Nuevo documento"
								onClick={(e) => setNewDocMenuAnchor(e.currentTarget)}
								data-testid="escritos-new-btn"
								sx={{
									bgcolor: BRAND_BLUE,
									color: "#fff",
									boxShadow: `0 4px 12px ${alpha(BRAND_BLUE, 0.4)}`,
									"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88) },
								}}
							>
								<Add size={18} />
							</Fab>
						) : (
							<Button
								size="small"
								startIcon={<Add size={16} variant="Linear" />}
								endIcon={<ArrowDown2 size={12} variant="Linear" />}
								onClick={(e) => setNewDocMenuAnchor(e.currentTarget)}
								data-testid="escritos-new-btn"
								sx={brandPrimaryButtonSx}
							>
								Nuevo documento
							</Button>
						)}
						<Menu
							anchorEl={newDocMenuAnchor}
							open={Boolean(newDocMenuAnchor)}
							onClose={() => setNewDocMenuAnchor(null)}
							anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
							transformOrigin={{ vertical: "top", horizontal: "right" }}
							PaperProps={{ elevation: 0, sx: menuPaperSx }}
						>
							<MuiMenuItem
								onClick={async () => {
									setNewDocMenuAnchor(null);
									if (!(await checkMainLimit())) return;
									setOpenCreatePostal(true);
								}}
								sx={{ py: 1.25, flexDirection: "column", alignItems: "flex-start" }}
								data-testid="escritos-new-postal"
							>
								<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
									Modelo del sistema
								</Typography>
								<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
									Telegramas, cartas documento y más
								</Typography>
							</MuiMenuItem>
							<Divider sx={{ borderColor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08) }} />
							<MuiMenuItem
								onClick={async () => {
									setNewDocMenuAnchor(null);
									if (!(await checkMainLimit())) return;
									setOpenTemplatePicker(true);
								}}
								sx={{ py: 1.25, flexDirection: "column", alignItems: "flex-start" }}
								data-testid="escritos-new-richtext"
							>
								<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
									Mis modelos
								</Typography>
								<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
									Escritos personalizados con editor de texto
								</Typography>
							</MuiMenuItem>
						</Menu>
					</Box>
				</Stack>
			</Box>

			{/* Card de contenido */}
			<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
				{/* Toolbar consolidada */}
				<Stack
					direction={{ xs: "column", sm: "row" }}
					spacing={{ xs: 1.25, sm: 1.5 }}
					alignItems={{ xs: "stretch", sm: "center" }}
					sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.75, sm: 2 } }}
				>
					<TextField
						size="small"
						placeholder="Buscar por título o modelo..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
						sx={{
							minWidth: { sm: 240 },
							flex: { sm: 1 },
							maxWidth: { sm: 360 },
							width: { xs: "100%", sm: "auto" },
							...inputSx,
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size={14} color={theme.palette.text.secondary} />
								</InputAdornment>
							),
						}}
					/>
					<Select
						size="small"
						value={typeFilter}
						onChange={(e) => handleTypeChange(e.target.value as TypeFilter)}
						sx={{
							minWidth: { sm: 180 },
							width: { xs: "100%", sm: "auto" },
							borderRadius: 1.25,
							fontSize: "0.875rem",
							"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
							"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
							"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
						}}
					>
						<MuiMenuItem value="all">Todos los modelos</MuiMenuItem>
						<MuiMenuItem value="system">Del sistema</MuiMenuItem>
						<MuiMenuItem value="user">Mis modelos</MuiMenuItem>
					</Select>
					{availableCategories.length > 0 && (
						<Select
							size="small"
							displayEmpty
							value={catFilter}
							onChange={(e) => {
								setCatFilter(e.target.value as string);
								setPage(1);
							}}
							sx={{
								minWidth: { sm: 160 },
								width: { xs: "100%", sm: "auto" },
								borderRadius: 1.25,
								fontSize: "0.875rem",
								"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
								"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
								"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
							}}
						>
							<MuiMenuItem value="">Todas las categorías</MuiMenuItem>
							{availableCategories.map((c) => (
								<MuiMenuItem key={c} value={c}>
									{catLabel(c)}
								</MuiMenuItem>
							))}
						</Select>
					)}
					<Box sx={{ flex: 1 }} />
					<Button size="small" onClick={handleSearchSubmit} sx={{ ...brandPrimaryButtonSx, minWidth: 110 }}>
						Buscar
					</Button>
				</Stack>

				<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08), mx: { xs: 2, sm: 3 } }} />

				{/* Mobile cards / Desktop table */}
				{isMobile ? (
					<Stack spacing={1.25} sx={{ p: 2 }}>
						{isLoading ? (
							Array(4)
								.fill(0)
								.map((_, i) => (
									<Box
										key={i}
										sx={{
											p: 1.5,
											borderRadius: 1.5,
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
										}}
									>
										<Stack spacing={1}>
											<Skeleton variant="text" width="70%" />
											<Skeleton variant="text" width="40%" />
											<Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 0.75 }} />
										</Stack>
									</Box>
								))
						) : filteredRows.length === 0 ? (
							<EmptyState search={search} />
						) : (
							pagedRows.map((row) => {
								const isPostal = row.kind === "postal";
								const linkedFolder = row.linkedFolderId ? folders.find((f: any) => f._id === row.linkedFolderId) : null;
								const hasTracking = isPostal && Boolean(row.linkedTrackingId);

								return (
									<Box
										key={`${row.kind}-${row.id}`}
										sx={{
											borderRadius: 1.5,
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
											overflow: "hidden",
											transition: "border-color 0.15s ease",
											"&:hover": { borderColor: alpha(BRAND_BLUE, isDark ? 0.32 : 0.22) },
										}}
									>
										<Stack spacing={1} sx={{ p: 1.5 }}>
											<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
												<Typography
													sx={{
														fontSize: "0.875rem",
														fontWeight: 600,
														letterSpacing: "-0.005em",
														color: "text.primary",
														flex: 1,
														wordBreak: "break-word",
													}}
												>
													{row.title}
												</Typography>
												<TypePill docKind={row.docKind} />
											</Stack>

											<Stack direction="row" spacing={0.75} flexWrap="wrap" alignItems="center" useFlexGap>
												{isPostal ? <PostalStatusPill value={row.status} /> : <RichTextStatusPill value={row.status} />}
												{hasTracking && <TrackingMicroPill />}
											</Stack>

											<Stack direction="row" spacing={2.5} flexWrap="wrap" sx={{ pt: 0.25 }}>
												<Stack spacing={0.125}>
													<Typography
														sx={{
															fontSize: "0.58rem",
															fontWeight: 600,
															letterSpacing: "0.08em",
															textTransform: "uppercase",
															color: "text.secondary",
														}}
													>
														Carpeta
													</Typography>
													{linkedFolder ? (
														<Typography
															onClick={() => navigate(`/apps/folders/details/${row.linkedFolderId}`)}
															sx={{
																fontSize: "0.78rem",
																color: "text.primary",
																cursor: "pointer",
																"&:hover": { color: BRAND_BLUE, textDecoration: "underline" },
															}}
														>
															{linkedFolder.folderName}
														</Typography>
													) : (
														<Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>—</Typography>
													)}
												</Stack>
												<Stack spacing={0.125}>
													<Typography
														sx={{
															fontSize: "0.58rem",
															fontWeight: 600,
															letterSpacing: "0.08em",
															textTransform: "uppercase",
															color: "text.secondary",
														}}
													>
														Fecha
													</Typography>
													<Typography sx={{ fontSize: "0.78rem", color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
														{formatDate(row.createdAt)}
													</Typography>
												</Stack>
											</Stack>
										</Stack>

										<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06) }} />

										<Stack direction="row" spacing={0.25} sx={{ p: 0.75, justifyContent: "flex-end" }}>
											{isPostal ? (
												row.status === "draft" ? (
													<Tooltip title="Continuar el borrador">
														<IconButton sx={iconBtnSx} onClick={() => handleContinue(row)} disabled={continuing}>
															<Edit size={16} variant="Linear" />
														</IconButton>
													</Tooltip>
												) : (
													<>
														<Tooltip title="Ver documento">
															<IconButton sx={iconBtnSx} onClick={() => setPostalDetail(row.rawPostal!)}>
																<Eye size={16} variant="Linear" />
															</IconButton>
														</Tooltip>
														{row.documentUrl && (
															<Tooltip title="Descargar">
																<IconButton sx={iconBtnSx} onClick={() => window.open(row.documentUrl, "_blank")}>
																	<DocumentDownload size={16} variant="Linear" />
																</IconButton>
															</Tooltip>
														)}
														<Tooltip title="Imprimir (PDF)">
															<IconButton sx={iconBtnSx} onClick={() => handlePrint(row)}>
																<Printer size={16} variant="Linear" />
															</IconButton>
														</Tooltip>
													</>
												)
											) : (
												<>
													<Tooltip title="Ver / Editar">
														<IconButton
															sx={iconBtnSx}
															onClick={() => navigate(`/documentos/escritos/${row.id}/editar`)}
															data-testid="escritos-edit-btn"
														>
															<Eye size={16} variant="Linear" />
														</IconButton>
													</Tooltip>
													<Tooltip title="Imprimir (PDF)">
														<IconButton sx={iconBtnSx} onClick={() => handlePrint(row)}>
															<Printer size={16} variant="Linear" />
														</IconButton>
													</Tooltip>
												</>
											)}
											<Tooltip title={row.linkedFolderId ? "Cambiar vinculación" : "Vincular a carpeta"}>
												<IconButton sx={iconBtnSx} onClick={() => setVincularRow(row)}>
													<Routing size={16} variant="Linear" />
												</IconButton>
											</Tooltip>
											<Tooltip title="Eliminar">
												<IconButton
													sx={iconBtnDestructiveSx}
													onClick={() => setDeleteTarget({ kind: row.kind, id: row.id, title: row.title })}
													data-testid="escritos-delete-btn"
												>
													<Trash size={16} variant="Linear" />
												</IconButton>
											</Tooltip>
										</Stack>
									</Box>
								);
							})
						)}
					</Stack>
				) : (
					<TableContainer>
						<Table size="small" sx={tableSx}>
							<TableHead>
								<TableRow>
									<TableCell>Título</TableCell>
									<TableCell>Tipo</TableCell>
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
								) : filteredRows.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} sx={{ p: 0 }}>
											<EmptyState search={search} />
										</TableCell>
									</TableRow>
								) : (
									pagedRows.map((row) => {
										const isPostal = row.kind === "postal";
										const linkedFolder = row.linkedFolderId ? folders.find((f: any) => f._id === row.linkedFolderId) : null;
										const hasTracking = isPostal && Boolean(row.linkedTrackingId);

										return (
											<TableRow key={`${row.kind}-${row.id}`}>
												<TableCell>
													<Stack spacing={0.5}>
														<Typography
															sx={{
																fontSize: "0.875rem",
																fontWeight: 600,
																letterSpacing: "-0.005em",
																color: "text.primary",
																maxWidth: 220,
																overflow: "hidden",
																textOverflow: "ellipsis",
																whiteSpace: "nowrap",
															}}
														>
															{row.title}
														</Typography>
														{hasTracking && (
															<Box sx={{ alignSelf: "flex-start" }}>
																<TrackingMicroPill />
															</Box>
														)}
													</Stack>
												</TableCell>
												<TableCell>
													<TypePill docKind={row.docKind} />
												</TableCell>
												<TableCell>
													<Typography
														sx={{
															fontSize: "0.78rem",
															color: "text.secondary",
															maxWidth: 160,
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap",
														}}
													>
														{row.templateName}
													</Typography>
												</TableCell>
												<TableCell>
													{isPostal ? <PostalStatusPill value={row.status} /> : <RichTextStatusPill value={row.status} />}
												</TableCell>
												<TableCell>
													{linkedFolder ? (
														<Typography
															onClick={() => navigate(`/apps/folders/details/${row.linkedFolderId}`)}
															sx={{
																fontSize: "0.82rem",
																color: "text.primary",
																cursor: "pointer",
																letterSpacing: "-0.005em",
																"&:hover": { color: BRAND_BLUE, textDecoration: "underline" },
															}}
														>
															{linkedFolder.folderName}
														</Typography>
													) : (
														<Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>—</Typography>
													)}
												</TableCell>
												<TableCell>
													<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
														{formatDate(row.createdAt)}
													</Typography>
												</TableCell>
												<TableCell align="right">
													<Stack direction="row" spacing={0.25} justifyContent="flex-end">
														{isPostal ? (
															row.status === "draft" ? (
																<Tooltip title="Continuar el borrador">
																	<IconButton sx={iconBtnSx} onClick={() => handleContinue(row)} disabled={continuing}>
																		<Edit size={16} variant="Linear" />
																	</IconButton>
																</Tooltip>
															) : (
																<>
																	<Tooltip title="Ver documento">
																		<IconButton
																			sx={iconBtnSx}
																			onClick={() => setPostalDetail(row.rawPostal!)}
																			data-testid="escritos-row-view-btn"
																		>
																			<Eye size={16} variant="Linear" />
																		</IconButton>
																	</Tooltip>
																	{row.documentUrl && (
																		<Tooltip title="Descargar">
																			<IconButton sx={iconBtnSx} onClick={() => window.open(row.documentUrl, "_blank")}>
																				<DocumentDownload size={16} variant="Linear" />
																			</IconButton>
																		</Tooltip>
																	)}
																	<Tooltip title="Imprimir (PDF)">
																		<IconButton sx={iconBtnSx} onClick={() => handlePrint(row)}>
																			<Printer size={16} variant="Linear" />
																		</IconButton>
																	</Tooltip>
																</>
															)
														) : (
															<>
																<Tooltip title="Ver / Editar">
																	<IconButton
																		sx={iconBtnSx}
																		onClick={() => navigate(`/documentos/escritos/${row.id}/editar`)}
																		data-testid="escritos-edit-btn"
																	>
																		<Eye size={16} variant="Linear" />
																	</IconButton>
																</Tooltip>
																<Tooltip title="Imprimir (PDF)">
																	<IconButton sx={iconBtnSx} onClick={() => handlePrint(row)}>
																		<Printer size={16} variant="Linear" />
																	</IconButton>
																</Tooltip>
															</>
														)}
														<Tooltip title={row.linkedFolderId ? "Cambiar vinculación" : "Vincular a carpeta"}>
															<IconButton sx={iconBtnSx} onClick={() => setVincularRow(row)}>
																<Routing size={16} variant="Linear" />
															</IconButton>
														</Tooltip>
														<Tooltip title="Eliminar">
															<IconButton
																sx={iconBtnDestructiveSx}
																onClick={() => setDeleteTarget({ kind: row.kind, id: row.id, title: row.title })}
																data-testid="escritos-delete-btn"
															>
																<Trash size={16} variant="Linear" />
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
				)}

				{/* Pagination */}
				{totalPages > 1 && (
					<Box display="flex" justifyContent="center" sx={{ py: 2 }}>
						<Pagination
							count={totalPages}
							page={page}
							onChange={(_e, v) => setPage(v)}
							size="small"
							sx={{
								"& .MuiPaginationItem-root": { fontWeight: 600 },
								"& .Mui-selected": {
									bgcolor: `${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)} !important`,
									color: BRAND_BLUE,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.4 : 0.28)}`,
								},
							}}
						/>
					</Box>
				)}
			</MainCard>

			{/* Modals */}
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
				open={openCreatePostal || Boolean(resumeData)}
				preselectedTemplate={resumeData?.template || null}
				resumeDoc={resumeData?.doc || null}
				handleClose={() => {
					setOpenCreatePostal(false);
					setResumeData(null);
					refreshDocuments();
					setPage(1);
				}}
				showSnackbar={showSnackbar}
			/>
		</Stack>
	);
};

// ── Empty state atmosférico ────────────────────────────────────────────────────

const EmptyState = ({ search }: { search: string }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box
			sx={{
				position: "relative",
				overflow: "hidden",
				px: 3,
				py: { xs: 6, md: 8 },
				textAlign: "center",
			}}
		>
			<Box
				sx={{
					position: "absolute",
					top: "-20%",
					left: "50%",
					transform: "translateX(-50%)",
					width: 360,
					height: 360,
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.08)} 0%, transparent 70%)`,
					pointerEvents: "none",
				}}
			/>
			<Box
				sx={{
					position: "absolute",
					inset: 0,
					backgroundImage: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)} 1px, transparent 1px)`,
					backgroundSize: "20px 20px",
					opacity: 0.5,
					maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
					WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
					pointerEvents: "none",
				}}
			/>
			<Stack spacing={1.5} alignItems="center" sx={{ position: "relative" }}>
				<Box
					sx={{
						width: 56,
						height: 56,
						borderRadius: 1.5,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
						color: BRAND_BLUE,
					}}
				>
					<DocumentText size={26} variant="Bulk" />
				</Box>
				<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
					{search ? "Sin resultados" : "Sin documentos todavía"}
				</Typography>
				<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", maxWidth: 380, textWrap: "pretty" }}>
					{search
						? "No encontramos documentos que coincidan con tu búsqueda. Probá con otro término o limpiá el filtro."
						: "Creá tu primer documento desde un modelo del sistema o uno de tus modelos propios."}
				</Typography>
			</Stack>
		</Box>
	);
};

export default EscritosPage;
