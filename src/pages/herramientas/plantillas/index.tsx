import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogContent,
	Grid,
	IconButton,
	InputAdornment,
	Pagination,
	Skeleton,
	Stack,
	Tab,
	Tabs,
	TextField,
	Tooltip,
	Typography,
	useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Add, ClipboardText, CloseSquare, DocumentText, DocumentUpload, Edit2, Eye, SearchNormal1, Setting2, Trash, Warning2 } from "iconsax-react";
import MainCard from "components/MainCard";
import { dispatch, useSelector } from "store";
import { fetchPdfTemplates, getPdfTemplate, previewGeneratedEscrito } from "store/reducers/postalDocuments";
import { fetchRichTextTemplates, deleteRichTextTemplate } from "store/reducers/richTextDocuments";
import { openSnackbar } from "store/reducers/snackbar";
import { PdfTemplate } from "types/postal-document";
import { RichTextTemplate, RichTextTemplateCategory } from "types/rich-text-document";
import CreatePostalDocumentModal from "sections/apps/postal-documents/CreatePostalDocumentModal";
import CreateFormModelWizard from "sections/apps/postal-documents/CreateFormModelWizard";
import SupportModal from "layout/MainLayout/Drawer/DrawerContent/SupportModal";
import { BRAND_BLUE, STALE_AMBER } from "themes/dashboardTokens";

// ── Helpers ────────────────────────────────────────────────────────────────────

const RT_CATEGORY_LABELS: Record<RichTextTemplateCategory, string> = {
	laboral: "Laboral",
	civil: "Civil",
	penal: "Penal",
	societario: "Societario",
	familia: "Familia",
	otro: "Otro",
};

// ── Brand pill ─────────────────────────────────────────────────────────────────

const Pill = ({ label, tone = "primary" }: { label: string; tone?: "primary" | "neutral" | "amber" }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const color = tone === "primary" ? BRAND_BLUE : tone === "amber" ? STALE_AMBER : theme.palette.text.secondary;
	return (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				px: 0.875,
				py: 0.25,
				borderRadius: 0.75,
				bgcolor: alpha(color, isDark ? 0.16 : 0.08),
				border: `1px solid ${alpha(color, isDark ? 0.3 : 0.2)}`,
				alignSelf: "flex-start",
			}}
		>
			<Typography sx={{ fontSize: "0.66rem", fontWeight: 600, color, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>
				{label}
			</Typography>
		</Box>
	);
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

const CardsSkeleton = ({ count = 4 }: { count?: number }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Grid container spacing={2}>
			{Array(count)
				.fill(0)
				.map((_, i) => (
					<Grid item xs={12} sm={6} md={4} lg={3} key={i}>
						<Box
							sx={{
								height: "100%",
								p: 1.75,
								borderRadius: 1.5,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
							}}
						>
							<Stack spacing={1.5}>
								<Stack direction="row" spacing={1}>
									<Skeleton variant="rounded" width={60} height={20} sx={{ borderRadius: 0.75 }} />
									<Skeleton variant="rounded" width={55} height={20} sx={{ borderRadius: 0.75 }} />
								</Stack>
								<Skeleton variant="rounded" width="80%" height={22} />
								<Skeleton variant="rounded" width="100%" height={40} />
								<Skeleton variant="rounded" width={80} height={18} />
								<Stack direction="row" spacing={1} sx={{ pt: 1 }}>
									<Skeleton variant="rounded" width={95} height={30} />
									<Skeleton variant="rounded" width={100} height={30} />
								</Stack>
							</Stack>
						</Box>
					</Grid>
				))}
		</Grid>
	);
};

// ── Brand styles hook ──────────────────────────────────────────────────────────

const useBrandStyles = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const brandPrimarySx = {
		minWidth: 120,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
	};

	const ghostBtnSx = {
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

	const inputSx = {
		"& .MuiOutlinedInput-root": {
			borderRadius: 1.25,
			fontSize: "0.875rem",
			"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14), transition: "border-color 0.15s ease" },
			"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
			"&.Mui-focused fieldset": { borderColor: BRAND_BLUE, borderWidth: 1 },
		},
	};

	const iconBtnSx = {
		width: 28,
		height: 28,
		borderRadius: 1,
		color: "text.secondary",
		transition: "color 0.15s ease, background-color 0.15s ease",
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
	};

	const iconBtnDestructiveSx = {
		...iconBtnSx,
		"&:hover": { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, isDark ? 0.14 : 0.08) },
	};

	const dialogPaperSx = {
		borderRadius: 2,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
		overflow: "hidden",
	};

	return { brandPrimarySx, ghostBtnSx, inputSx, iconBtnSx, iconBtnDestructiveSx, dialogPaperSx, isDark };
};

// ── Dialog brand header reusable ───────────────────────────────────────────────

const DialogBrandHeader = ({
	eyebrow,
	title,
	subtitle,
	icon,
	onClose,
	rightSlot,
}: {
	eyebrow: string;
	title: string;
	subtitle?: string;
	icon: React.ReactNode;
	onClose: () => void;
	rightSlot?: React.ReactNode;
}) => {
	const { isDark, iconBtnSx } = useBrandStyles();
	return (
		<Box
			sx={{
				position: "relative",
				overflow: "hidden",
				p: { xs: 2.25, sm: 2.5 },
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
				borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
			}}
		>
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
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{title}
					</Typography>
					{subtitle && (
						<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>{subtitle}</Typography>
					)}
				</Stack>
				{rightSlot}
				<IconButton onClick={onClose} sx={iconBtnSx} aria-label="cerrar">
					<CloseSquare size={20} variant="Linear" />
				</IconButton>
			</Stack>
		</Box>
	);
};

// ── Vista previa PDF ───────────────────────────────────────────────────────────

interface PreviewDialogProps {
	open: boolean;
	template: PdfTemplate | null;
	pdfUrl: string | null;
	loading: boolean;
	onClose: () => void;
	titleOverride?: string | null;
	subtitleOverride?: string | null;
}

const PreviewDialog = ({ open, template, pdfUrl, loading, onClose, titleOverride, subtitleOverride }: PreviewDialogProps) => {
	const { dialogPaperSx } = useBrandStyles();
	if (!template) return null;
	const modelTypeLabel = template?.modelType === "dynamic" ? "Dinámico" : "Estático";
	return (
		<Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
			<DialogBrandHeader
				eyebrow={titleOverride ? "Escrito vinculado" : "Vista previa"}
				title={titleOverride || template.name}
				subtitle={subtitleOverride || `${template.category ?? "—"} · ${modelTypeLabel}`}
				icon={<DocumentText size={20} variant="Bulk" />}
				onClose={onClose}
			/>
			<DialogContent sx={{ p: 0 }}>
				{loading ? (
					<Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
						<CircularProgress size={32} sx={{ color: BRAND_BLUE }} />
					</Stack>
				) : pdfUrl ? (
					<iframe src={pdfUrl} title={template.name} style={{ width: "100%", height: 560, border: "none", display: "block" }} />
				) : (
					<Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
						<Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>No se pudo cargar la vista previa.</Typography>
					</Stack>
				)}
			</DialogContent>
		</Dialog>
	);
};

// ── Tarjeta modelo PDF ─────────────────────────────────────────────────────────

interface ModelCardProps {
	template: PdfTemplate;
	onPreview: (t: PdfTemplate) => void;
	onUse: (t: PdfTemplate) => void;
	onPreviewGenerated?: (t: PdfTemplate, gen: { slug: string; name: string }) => void;
	onEdit?: (t: PdfTemplate) => void;
}

const ModelCard = ({ template, onPreview, onUse, onPreviewGenerated, onEdit }: ModelCardProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { brandPrimarySx, ghostBtnSx } = useBrandStyles();
	const isDocxMerge = template.fillMethod === "docx-merge";
	const needsDoc = isDocxMerge && !template.s3Key;
	// Placeholders del documento que ningún campo del formulario mapea (mapeo incompleto).
	const freePlaceholders =
		isDocxMerge && template.s3Key && template.docxPlaceholders?.length
			? (() => {
					const mapped = new Set((template.fields || []).map((f) => f.docxField).filter(Boolean));
					return template.docxPlaceholders.filter((p) => !mapped.has(p));
			  })()
			: [];
	return (
		<Box
			sx={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				p: 1.75,
				borderRadius: 1.5,
				bgcolor: "background.paper",
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
				transition: "border-color 0.15s ease, transform 0.15s ease",
				"&:hover": { borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.24), transform: "translateY(-1px)" },
			}}
		>
			<Stack spacing={1.25} sx={{ flex: 1 }}>
				<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
					<Pill label={template.category} tone="primary" />
					<Pill label={template.modelType === "dynamic" ? "Dinámico" : "Estático"} tone={template.modelType === "dynamic" ? "amber" : "neutral"} />
				</Stack>
				<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary", lineHeight: 1.3 }}>
					{template.name}
				</Typography>
				{template.description && (
					<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
						{template.description}
					</Typography>
				)}
				<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.06), mt: 0.5 }} />
				<Stack direction="row" alignItems="center" spacing={0.75}>
					<DocumentText size={13} color={theme.palette.text.secondary} variant="Linear" />
					<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
						{template.fields?.length ?? 0} campo{template.fields?.length !== 1 ? "s" : ""} completables
					</Typography>
				</Stack>
				{template.generates && template.generates.length > 0 && (
					<Box
						sx={{
							mt: 0.25,
							px: 1,
							py: 0.875,
							borderRadius: 1,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.1)}`,
						}}
					>
						<Typography
							sx={{
								fontSize: "0.6rem",
								fontWeight: 700,
								letterSpacing: "0.09em",
								textTransform: "uppercase",
								color: alpha(BRAND_BLUE, isDark ? 0.75 : 0.7),
								display: "block",
								mb: 0.5,
							}}
						>
							{template.generates.length > 1 ? `Genera ${template.generates.length} escritos` : "Genera"}
						</Typography>
						<Stack spacing={0.5}>
							{template.generates.map((g) => {
								const clickable = Boolean(onPreviewGenerated);
								return (
									<Stack
										key={g.slug}
										direction="row"
										alignItems="center"
										spacing={0.75}
										onClick={clickable ? () => onPreviewGenerated!(template, g) : undefined}
										sx={{
											borderRadius: 0.75,
											mx: -0.5,
											px: 0.5,
											py: 0.25,
											...(clickable && {
												cursor: "pointer",
												transition: "background-color 0.15s ease",
												"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.09) },
												"&:hover .gen-eye": { opacity: 1 },
											}),
										}}
									>
										<DocumentText size={14} color={BRAND_BLUE} variant="Bulk" />
										<Typography
											sx={{
												flex: 1,
												minWidth: 0,
												fontSize: "0.75rem",
												fontWeight: 600,
												color: "text.primary",
												letterSpacing: "-0.005em",
												lineHeight: 1.25,
												textWrap: "pretty",
											}}
										>
											{g.name}
										</Typography>
										{clickable && (
											<Eye
												size={13}
												variant="Linear"
												color={BRAND_BLUE}
												className="gen-eye"
												style={{ opacity: 0.5, transition: "opacity 0.15s ease", flexShrink: 0 }}
											/>
										)}
									</Stack>
								);
							})}
						</Stack>
					</Box>
				)}
				{needsDoc && (
					<Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.25 }}>
						<Warning2 size={14} color={STALE_AMBER} variant="Bulk" />
						<Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: STALE_AMBER, letterSpacing: "-0.005em" }}>
							Falta vincular documento
						</Typography>
					</Stack>
				)}
				{freePlaceholders.length > 0 && (
					<Tooltip title={`Sin vincular: ${freePlaceholders.map((p) => `[${p}]`).join(", ")}`}>
						<Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.25 }}>
							<Warning2 size={14} color={STALE_AMBER} variant="Bulk" />
							<Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: STALE_AMBER, letterSpacing: "-0.005em" }}>
								Mapeo incompleto — {freePlaceholders.length} campo{freePlaceholders.length !== 1 ? "s" : ""} del documento sin vincular
							</Typography>
						</Stack>
					</Tooltip>
				)}
			</Stack>
			<Stack direction="row" spacing={1} sx={{ pt: 1.5 }}>
				{isDocxMerge ? (
					<>
						{onEdit && (
							<Button size="small" startIcon={<Edit2 size={14} variant="Linear" />} onClick={() => onEdit(template)} sx={{ ...ghostBtnSx, flex: 1 }}>
								Editar
							</Button>
						)}
						{needsDoc ? (
							<Button size="small" onClick={() => onEdit?.(template)} sx={{ ...brandPrimarySx, flex: 1, minWidth: 0 }}>
								Vincular documento
							</Button>
						) : (
							<Button size="small" onClick={() => onUse(template)} sx={{ ...brandPrimarySx, flex: 1, minWidth: 0 }}>
								Usar modelo
							</Button>
						)}
					</>
				) : (
					<>
						<Button size="small" startIcon={<Eye size={14} variant="Linear" />} onClick={() => onPreview(template)} sx={{ ...ghostBtnSx, flex: 1 }}>
							Vista previa
						</Button>
						<Button size="small" onClick={() => onUse(template)} sx={{ ...brandPrimarySx, flex: 1, minWidth: 0 }}>
							Usar modelo
						</Button>
					</>
				)}
			</Stack>
		</Box>
	);
};

// ── Tarjeta modelo rich text ───────────────────────────────────────────────────

interface RichTextModelCardProps {
	template: RichTextTemplate;
	onEdit: (t: RichTextTemplate) => void;
	onDelete: (t: RichTextTemplate) => void;
	onUse: (t: RichTextTemplate) => void;
}

const RichTextModelCard = ({ template, onEdit, onDelete, onUse }: RichTextModelCardProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { brandPrimarySx, ghostBtnSx, iconBtnSx, iconBtnDestructiveSx } = useBrandStyles();
	return (
		<Box
			sx={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				p: 1.75,
				borderRadius: 1.5,
				bgcolor: "background.paper",
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
				transition: "border-color 0.15s ease, transform 0.15s ease",
				"&:hover": { borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.24), transform: "translateY(-1px)" },
			}}
		>
			<Stack spacing={1.25} sx={{ flex: 1 }}>
				<Stack direction="row" alignItems="center" justifyContent="space-between">
					<Pill label={RT_CATEGORY_LABELS[template.category] ?? template.category} tone="primary" />
					<Stack direction="row" spacing={0.25}>
						<Tooltip title="Editar">
							<IconButton sx={iconBtnSx} onClick={() => onEdit(template)}>
								<Edit2 size={14} variant="Linear" />
							</IconButton>
						</Tooltip>
						<Tooltip title="Eliminar">
							<IconButton sx={iconBtnDestructiveSx} onClick={() => onDelete(template)}>
								<Trash size={14} variant="Linear" />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>
				<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary", lineHeight: 1.3 }}>
					{template.name}
				</Typography>
				{template.description && (
					<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
						{template.description}
					</Typography>
				)}
				<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.06), mt: 0.5 }} />
				<Stack direction="row" alignItems="center" spacing={0.75}>
					<DocumentText size={13} color={theme.palette.text.secondary} variant="Linear" />
					<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
						{template.mergeFields?.length ?? 0} campo{template.mergeFields?.length !== 1 ? "s" : ""} dinámico
						{template.mergeFields?.length !== 1 ? "s" : ""}
					</Typography>
				</Stack>
			</Stack>
			<Stack direction="row" spacing={1} sx={{ pt: 1.5 }}>
				<Button size="small" startIcon={<Edit2 size={14} variant="Linear" />} onClick={() => onEdit(template)} sx={{ ...ghostBtnSx, flex: 1 }}>
					Editar
				</Button>
				<Button
					size="small"
					startIcon={<DocumentUpload size={14} variant="Linear" />}
					onClick={() => onUse(template)}
					sx={{ ...brandPrimarySx, flex: 1, minWidth: 0 }}
				>
					Crear documento
				</Button>
			</Stack>
		</Box>
	);
};

// ── Tarjeta "dashed" para crear / solicitar ────────────────────────────────────

const DashedCard = ({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle?: string; onClick: () => void }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box
			role="button"
			tabIndex={0}
			onClick={onClick}
			onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
			sx={{
				height: "100%",
				minHeight: 180,
				p: 2,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				cursor: "pointer",
				borderRadius: 1.5,
				border: `1px dashed ${alpha(BRAND_BLUE, isDark ? 0.3 : 0.22)}`,
				bgcolor: "transparent",
				transition: "border-color 0.2s, background-color 0.2s",
				"&:hover": {
					borderColor: alpha(BRAND_BLUE, isDark ? 0.55 : 0.42),
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
				},
				"&:focus-visible": {
					outline: "none",
					boxShadow: `0 0 0 2px ${alpha(BRAND_BLUE, 0.35)}`,
				},
			}}
		>
			<Stack alignItems="center" spacing={1.25} sx={{ textAlign: "center" }}>
				<Box
					sx={{
						width: 44,
						height: 44,
						borderRadius: 1.5,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
						color: BRAND_BLUE,
					}}
				>
					{icon}
				</Box>
				<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, letterSpacing: "-0.005em", color: BRAND_BLUE }}>{title}</Typography>
				{subtitle && (
					<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em", maxWidth: 220, textWrap: "pretty" }}>
						{subtitle}
					</Typography>
				)}
			</Stack>
		</Box>
	);
};

// ── HeaderStat ─────────────────────────────────────────────────────────────────

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
			<Typography sx={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>
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

// ── Confirmación de eliminación ────────────────────────────────────────────────

interface DeleteConfirmProps {
	open: boolean;
	name: string;
	loading: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

const DeleteConfirmDialog = ({ open, name, loading, onConfirm, onClose }: DeleteConfirmProps) => {
	const theme = useTheme();
	const { ghostBtnSx, dialogPaperSx, isDark } = useBrandStyles();
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
						<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary", textAlign: "center" }}>
							¿Eliminar este modelo?
						</Typography>
						<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", letterSpacing: "-0.005em", textAlign: "center", textWrap: "pretty" }}>
							Vas a eliminar{" "}
							<Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
								"{name}"
							</Box>{" "}
							de forma permanente. Esta acción no se puede deshacer.
						</Typography>
					</Stack>
					<Stack direction="row" spacing={1.25} sx={{ width: 1, mt: 0.5 }}>
						<Button fullWidth onClick={onClose} disabled={loading} sx={ghostBtnSx}>
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

// ── Empty state atmosférico ────────────────────────────────────────────────────

const EmptyState = ({
	title,
	message,
	action,
}: {
	title: string;
	message: string;
	action?: React.ReactNode;
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box sx={{ position: "relative", overflow: "hidden", px: 3, py: { xs: 6, md: 8 }, textAlign: "center" }}>
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
					<ClipboardText size={26} variant="Bulk" />
				</Box>
				<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>{title}</Typography>
				<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", maxWidth: 360, textWrap: "pretty" }}>{message}</Typography>
				{action}
			</Stack>
		</Box>
	);
};

// ── Página principal ───────────────────────────────────────────────────────────

const ModelosPage = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const userId = useSelector((state: any) => state.auth?.user?._id);
	const { brandPrimarySx, ghostBtnSx, inputSx, isDark } = useBrandStyles();
	const theme = useTheme();

	const [pdfTemplates, setPdfTemplates] = useState<PdfTemplate[]>([]);
	const [pdfLoading, setPdfLoading] = useState(true);
	const [previewTemplate, setPreviewTemplate] = useState<PdfTemplate | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [previewGenTitle, setPreviewGenTitle] = useState<string | null>(null);
	const [wizardOpen, setWizardOpen] = useState(false);
	const [editTemplate, setEditTemplate] = useState<PdfTemplate | null>(null);
	const [createFromTemplate, setCreateFromTemplate] = useState<PdfTemplate | null>(null);

	const [rtTemplates, setRtTemplates] = useState<RichTextTemplate[]>([]);
	const [rtLoading, setRtLoading] = useState(false);
	const [rtSearch, setRtSearch] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<RichTextTemplate | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [myModelsCount, setMyModelsCount] = useState<number>(0);

	const [activeTab, setActiveTab] = useState(() => {
		const t = Number(searchParams.get("tab"));
		return isNaN(t) ? 0 : t;
	});
	const [pdfSearch, setPdfSearch] = useState("");
	const [requestModelOpen, setRequestModelOpen] = useState(false);

	// Paginación: 2 filas según breakpoint (lg=4 cols → 8, md=3 cols → 6, sm=2 cols → 4, xs=1 col → 2)
	const isLg = useMediaQuery(theme.breakpoints.up("lg"));
	const isMd = useMediaQuery(theme.breakpoints.up("md"));
	const isSm = useMediaQuery(theme.breakpoints.up("sm"));
	const cardsPerPage = isLg ? 8 : isMd ? 6 : isSm ? 4 : 2;
	const [pdfPage, setPdfPage] = useState(1);
	const [rtPage, setRtPage] = useState(1);

	const showSnackbar = (message: string, severity: "success" | "error") => {
		dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color: severity }, close: true }));
	};

	useEffect(() => {
		dispatch(fetchPdfTemplates()).then((res: any) => {
			if (res.success) setPdfTemplates(res.templates || []);
			setPdfLoading(false);
		});
	}, []);

	useEffect(() => {
		dispatch(fetchRichTextTemplates({ source: "user" })).then((res: any) => {
			if (res.success) {
				const list = res.templates || [];
				setMyModelsCount(list.length);
				if (activeTab === 1) setRtTemplates(list);
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (activeTab !== 1) return;
		setRtLoading(true);
		dispatch(fetchRichTextTemplates({ source: "user" })).then((res: any) => {
			if (res.success) {
				setRtTemplates(res.templates || []);
				setMyModelsCount((res.templates || []).length);
			}
			setRtLoading(false);
		});
	}, [activeTab]);

	// Reset paginación al cambiar búsqueda o breakpoint
	useEffect(() => {
		setPdfPage(1);
	}, [pdfSearch, cardsPerPage]);

	useEffect(() => {
		setRtPage(1);
	}, [rtSearch, cardsPerPage]);

	const handlePreview = async (tpl: PdfTemplate) => {
		setPreviewGenTitle(null);
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

	// Vista previa del escrito .docx vinculado (docx→pdf en el server) en el mismo visor.
	const handleEditTemplate = (tpl: PdfTemplate) => {
		setEditTemplate(tpl);
		setWizardOpen(true);
	};

	const handlePreviewGenerated = async (tpl: PdfTemplate, gen: { slug: string; name: string }) => {
		setPreviewGenTitle(gen.name);
		setPreviewTemplate(tpl);
		setPreviewUrl(null);
		setPreviewLoading(true);
		const res = await dispatch(previewGeneratedEscrito(tpl.slug, gen.slug));
		if (res?.success && res.url) {
			setPreviewUrl(res.url);
		} else {
			showSnackbar("No se pudo obtener la vista previa del escrito", "error");
		}
		setPreviewLoading(false);
	};

	const handleDeleteConfirm = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		const res = await dispatch(deleteRichTextTemplate(deleteTarget._id));
		if (res.success) {
			setRtTemplates((prev) => prev.filter((t) => t._id !== deleteTarget._id));
			setMyModelsCount((c) => Math.max(0, c - 1));
			showSnackbar("Modelo eliminado", "success");
		} else {
			showSnackbar(res.error || "Error al eliminar", "error");
		}
		setDeleteLoading(false);
		setDeleteTarget(null);
	};

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

	// Modelos de tipo formulario (PdfTemplate) propios del usuario — se muestran en "Mis modelos".
	// La API solo devuelve al dueño sus propios PdfTemplate (source=user + userId), así que quedan aislados.
	const myPdfTemplates = pdfTemplates
		.filter((t) => t.source === "user" && t.userId === userId)
		.filter((t) => {
			if (!rtSearch.trim()) return true;
			const q = rtSearch.toLowerCase();
			return t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q);
		});

	const systemTotal = pdfTemplates.filter((t) => t.source === "system" || t.isPublic || !t.userId).length;
	// "Mis modelos" = formularios propios (PdfTemplate) + modelos de texto (RichText)
	const myTotalCount = myModelsCount + pdfTemplates.filter((t) => t.source === "user" && t.userId === userId).length;

	// Calcula slice de cards y total de páginas, dejando un slot libre en la primera página para la dashed card
	function paginateWithDashed<T>(items: T[], page: number) {
		const firstPageSlots = Math.max(1, cardsPerPage - 1);
		const totalPages = items.length <= firstPageSlots ? 1 : 1 + Math.ceil((items.length - firstPageSlots) / cardsPerPage);
		const safePage = Math.min(Math.max(1, page), totalPages);
		const start = safePage === 1 ? 0 : firstPageSlots + (safePage - 2) * cardsPerPage;
		const end = safePage === 1 ? firstPageSlots : start + cardsPerPage;
		return { slice: items.slice(start, end), totalPages, isFirstPage: safePage === 1 };
	}

	const pdfPagination = paginateWithDashed(systemTemplates, pdfPage);
	const rtPagination = paginateWithDashed(filteredRtTemplates, rtPage);

	const paginationSx = {
		"& .MuiPaginationItem-root": {
			fontWeight: 600,
			color: "text.secondary",
			borderRadius: 1,
			"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06), color: BRAND_BLUE },
		},
		"& .Mui-selected": {
			bgcolor: `${alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)} !important`,
			color: BRAND_BLUE,
			border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.4 : 0.28)}`,
		},
	};

	const brandTabsSx = {
		minHeight: 44,
		"& .MuiTab-root": {
			textTransform: "none",
			fontWeight: 600,
			fontSize: "0.85rem",
			letterSpacing: "-0.005em",
			color: "text.secondary",
			minHeight: 44,
			py: 1,
			px: 2,
			"&.Mui-selected": { color: BRAND_BLUE },
		},
		"& .MuiTabs-indicator": { backgroundColor: BRAND_BLUE, height: 2 },
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
					spacing={{ xs: 1.5, md: 3 }}
					sx={{ position: "relative" }}
				>
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
							<ClipboardText size={22} variant="Bulk" />
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
									Plantillas
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
								Modelos de documentos
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
								Plantillas del sistema y modelos propios con campos dinámicos.
							</Typography>
						</Stack>
					</Stack>

					<Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, display: { xs: "none", sm: "flex" } }}>
						<HeaderStat label="Sistema" value={systemTotal} tone="primary" />
						<HeaderStat label="Míos" value={myTotalCount} tone="amber" />
					</Stack>
				</Stack>
			</Box>

			{/* Card de contenido */}
			<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
				<Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 1 }}>
					<Tabs
						value={activeTab}
						onChange={(_e, v) => setActiveTab(v)}
						variant="scrollable"
						scrollButtons="auto"
						allowScrollButtonsMobile
						sx={{ borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`, ...brandTabsSx }}
					>
						<Tab
							label={
								<Stack direction="row" alignItems="center" spacing={1}>
									<Setting2 size={15} variant="Linear" />
									<span>Modelos del sistema</span>
								</Stack>
							}
						/>
						<Tab
							label={
								<Stack direction="row" alignItems="center" spacing={1}>
									<ClipboardText size={15} variant="Linear" />
									<span>Mis modelos</span>
									{myTotalCount > 0 && (
										<Box
											sx={{
												ml: 0.25,
												px: 0.625,
												py: 0.125,
												borderRadius: 0.75,
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.12),
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.36 : 0.24)}`,
												color: BRAND_BLUE,
												fontSize: "0.65rem",
												fontWeight: 700,
												fontVariantNumeric: "tabular-nums",
												lineHeight: 1.4,
											}}
										>
											{myTotalCount > 99 ? "99+" : myTotalCount}
										</Box>
									)}
								</Stack>
							}
						/>
					</Tabs>
				</Box>

				<Box sx={{ p: { xs: 2, sm: 2.5 } }}>
					{/* ── Tab 0: Modelos del sistema ── */}
					{activeTab === 0 && (
						<>
							<Stack
								direction={{ xs: "column", sm: "row" }}
								alignItems={{ sm: "center" }}
								justifyContent="space-between"
								spacing={1.5}
								sx={{ mb: 2 }}
							>
								<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
									Plantillas predefinidas listas para usar.
								</Typography>
								<Stack
									direction={{ xs: "column", sm: "row" }}
									spacing={1}
									alignItems={{ xs: "stretch", sm: "center" }}
									sx={{ width: { xs: "100%", sm: "auto" } }}
								>
									<Button
										size="small"
										startIcon={<DocumentUpload size={14} variant="Linear" />}
										onClick={() => setRequestModelOpen(true)}
										sx={{ ...ghostBtnSx, width: { xs: "100%", sm: "auto" } }}
									>
										Solicitar modelo
									</Button>
									<TextField
										size="small"
										placeholder="Buscar modelo..."
										value={pdfSearch}
										onChange={(e) => setPdfSearch(e.target.value)}
										sx={{ minWidth: { sm: 240 }, width: { xs: "100%", sm: "auto" }, ...inputSx }}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<SearchNormal1 size={15} color={theme.palette.text.secondary} />
												</InputAdornment>
											),
										}}
									/>
								</Stack>
							</Stack>

							{pdfLoading ? (
								<CardsSkeleton count={cardsPerPage} />
							) : systemTemplates.length === 0 ? (
								<EmptyState
									title={pdfSearch.trim() ? "Sin resultados" : "Sin modelos del sistema"}
									message={
										pdfSearch.trim()
											? `No encontramos plantillas que coincidan con "${pdfSearch}". Probá con otro término.`
											: "No hay modelos del sistema configurados todavía."
									}
								/>
							) : (
								<>
									<Grid container spacing={2}>
										{pdfPagination.slice.map((tpl) => (
											<Grid item xs={12} sm={6} md={4} lg={3} key={tpl._id}>
												<ModelCard template={tpl} onPreview={handlePreview} onUse={setCreateFromTemplate} onPreviewGenerated={handlePreviewGenerated} />
											</Grid>
										))}
										{pdfPagination.isFirstPage && (
											<Grid item xs={12} sm={6} md={4} lg={3}>
												<DashedCard
													icon={<DocumentUpload size={22} variant="Bulk" />}
													title="Solicitar nuevo modelo"
													subtitle="¿Tenés un PDF o DOC que querés convertir en modelo autocompletable?"
													onClick={() => setRequestModelOpen(true)}
												/>
											</Grid>
										)}
									</Grid>
									{pdfPagination.totalPages > 1 && (
										<Box display="flex" justifyContent="center" sx={{ pt: 2.5 }}>
											<Pagination
												count={pdfPagination.totalPages}
												page={pdfPage}
												onChange={(_e, v) => setPdfPage(v)}
												size="small"
												sx={paginationSx}
											/>
										</Box>
									)}
								</>
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
								sx={{ mb: 2 }}
							>
								<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
									Modelos propios con campos dinámicos vinculables a expedientes y contactos.
								</Typography>
								<Stack
									direction={{ xs: "column", sm: "row" }}
									spacing={1}
									alignItems={{ xs: "stretch", sm: "center" }}
									sx={{ width: { xs: "100%", sm: "auto" } }}
								>
									<TextField
										size="small"
										placeholder="Buscar modelo..."
										value={rtSearch}
										onChange={(e) => setRtSearch(e.target.value)}
										sx={{ minWidth: { sm: 220 }, width: { xs: "100%", sm: "auto" }, ...inputSx }}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<SearchNormal1 size={15} color={theme.palette.text.secondary} />
												</InputAdornment>
											),
										}}
									/>
									<Button
										size="small"
										startIcon={<DocumentUpload size={15} variant="Linear" />}
										onClick={() => navigate("/documentos/modelos/nuevo")}
										sx={ghostBtnSx}
									>
										Modelo de texto
									</Button>
									<Button
										size="small"
										startIcon={<Add size={15} variant="Linear" />}
										onClick={() => {
							setEditTemplate(null);
							setWizardOpen(true);
						}}
										sx={brandPrimarySx}
									>
										Crear formulario
									</Button>
								</Stack>
							</Stack>

							{rtLoading || pdfLoading ? (
								<CardsSkeleton count={cardsPerPage} />
							) : myPdfTemplates.length === 0 && filteredRtTemplates.length === 0 ? (
								<EmptyState
									title={rtSearch.trim() ? "Sin resultados" : "Sin modelos propios"}
									message={
										rtSearch.trim()
											? `No encontramos modelos que coincidan con "${rtSearch}".`
											: "Creá tu primer modelo de texto enriquecido con campos dinámicos para reutilizar en escritos."
									}
									action={
										!rtSearch.trim() && (
											<Button
												size="small"
												startIcon={<Add size={15} variant="Linear" />}
												onClick={() => navigate("/documentos/modelos/nuevo")}
												sx={{ ...brandPrimarySx, mt: 0.5 }}
											>
												Crear mi primer modelo
											</Button>
										)
									}
								/>
							) : (
								<>
									{/* Formularios propios (PdfTemplate) — se completan con el modal de campos, sin editor */}
									{myPdfTemplates.length > 0 && (
										<Box sx={{ mb: filteredRtTemplates.length > 0 ? 3 : 0 }}>
											<Typography
												sx={{
													fontSize: "0.7rem",
													fontWeight: 700,
													letterSpacing: "0.06em",
													textTransform: "uppercase",
													color: "text.secondary",
													mb: 1.25,
												}}
											>
												Formularios
											</Typography>
											<Grid container spacing={2}>
												{myPdfTemplates.map((tpl) => (
													<Grid item xs={12} sm={6} md={4} lg={3} key={tpl._id}>
														<ModelCard template={tpl} onPreview={handlePreview} onUse={setCreateFromTemplate} onPreviewGenerated={handlePreviewGenerated} onEdit={handleEditTemplate} />
													</Grid>
												))}
											</Grid>
										</Box>
									)}

									{/* Modelos de texto (RichText) — se editan en el editor */}
									{filteredRtTemplates.length > 0 && (
										<>
											{myPdfTemplates.length > 0 && (
												<Typography
													sx={{
														fontSize: "0.7rem",
														fontWeight: 700,
														letterSpacing: "0.06em",
														textTransform: "uppercase",
														color: "text.secondary",
														mb: 1.25,
													}}
												>
													Modelos de texto
												</Typography>
											)}
											<Grid container spacing={2}>
												{rtPagination.slice.map((tpl) => (
													<Grid item xs={12} sm={6} md={4} lg={3} key={tpl._id}>
														<RichTextModelCard
															template={tpl}
															onEdit={(t) => navigate(`/documentos/modelos/${t._id}/editar`)}
															onDelete={setDeleteTarget}
															onUse={(t) => navigate(`/documentos/escritos/nuevo?templateId=${t._id}`)}
														/>
													</Grid>
												))}
												{rtPagination.isFirstPage && (
													<Grid item xs={12} sm={6} md={4} lg={3}>
														<DashedCard
															icon={<Add size={22} variant="Linear" />}
															title="Nuevo modelo"
															subtitle="Creá uno desde cero con campos dinámicos."
															onClick={() => navigate("/documentos/modelos/nuevo")}
														/>
													</Grid>
												)}
											</Grid>
											{rtPagination.totalPages > 1 && (
												<Box display="flex" justifyContent="center" sx={{ pt: 2.5 }}>
													<Pagination
														count={rtPagination.totalPages}
														page={rtPage}
														onChange={(_e, v) => setRtPage(v)}
														size="small"
														sx={paginationSx}
													/>
												</Box>
											)}
										</>
									)}
								</>
							)}
						</>
					)}
				</Box>
			</MainCard>

			{/* Diálogos */}
			<PreviewDialog
				open={Boolean(previewTemplate)}
				template={previewTemplate}
				pdfUrl={previewUrl}
				loading={previewLoading}
				titleOverride={previewGenTitle}
				subtitleOverride={previewGenTitle ? "Escrito Word · se completa desde el formulario" : null}
				onClose={() => {
					setPreviewTemplate(null);
					setPreviewUrl(null);
					setPreviewGenTitle(null);
				}}
			/>

			<CreateFormModelWizard
				open={wizardOpen}
				editTemplate={editTemplate}
				onClose={() => {
					setWizardOpen(false);
					setEditTemplate(null);
				}}
				onCreated={() => {
					dispatch(fetchPdfTemplates()).then((res: any) => {
						if (res.success) setPdfTemplates(res.templates || []);
					});
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
		</Stack>
	);
};

export default ModelosPage;
