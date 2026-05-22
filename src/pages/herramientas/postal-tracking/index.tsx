import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
	Box,
	Button,
	Checkbox,
	FormControl,
	Grid,
	IconButton,
	InputAdornment,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Pagination,
	Select,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
	TextField,
	Tooltip,
	Typography,
	useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Add, Box as BoxIcon, DocumentUpload, Edit2, Eye, Link1, More, Refresh2, SearchNormal1, TickCircle, Trash } from "iconsax-react";

import MainCard from "components/MainCard";
import { dispatch, useSelector } from "store";
import {
	fetchPostalTrackings,
	deletePostalTracking,
	bulkDeletePostalTrackings,
	getPostalTrackingById,
	clearPostalTrackingDetail,
	uploadAttachment,
	markPostalTrackingAsCompleted,
	reactivatePostalTracking,
} from "store/reducers/postalTracking";
import { openSnackbar } from "store/reducers/snackbar";
import ApiService from "store/reducers/ApiService";
import { PostalTrackingType } from "types/postal-tracking";

import AlertPostalTrackingDelete from "sections/apps/postal-tracking/AlertPostalTrackingDelete";
import PostalTrackingModal from "sections/apps/postal-tracking/PostalTrackingModal";
import PostalTrackingDetail from "sections/apps/postal-tracking/PostalTrackingDetail";
import LinkPostalTrackingToFolder from "sections/apps/postal-tracking/LinkPostalTrackingToFolder";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

const CORREO_LOGO = "https://res.cloudinary.com/dqyoeolib/image/upload/v1773403406/logo-correo_lxrcmr.png";

const STATUS_LABELS: Record<string, string> = {
	pending: "Pendiente",
	active: "Activo",
	completed: "Completado",
	paused: "Pausado",
	error: "Error",
	not_found: "No encontrado",
};

function formatDate(date?: string | null) {
	if (!date) return "—";
	return new Intl.DateTimeFormat("es-AR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date));
}

// ── Brand pills ────────────────────────────────────────────────────────────────

const StatusPill = ({ value }: { value: string }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const map: Record<string, string> = {
		pending: STALE_AMBER,
		active: BRAND_BLUE,
		completed: LIVE_GREEN,
		paused: theme.palette.text.secondary,
		error: theme.palette.error.main,
		not_found: theme.palette.text.secondary,
	};
	const color = map[value] ?? theme.palette.text.secondary;
	const label = STATUS_LABELS[value] ?? value;
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
			<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />
			<Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color, letterSpacing: "0.01em", lineHeight: 1 }}>
				{label}
			</Typography>
		</Box>
	);
};

const TrackingStatusChip = ({ label }: { label: string }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				maxWidth: 220,
				px: 0.875,
				py: 0.25,
				borderRadius: 0.75,
				bgcolor: "transparent",
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
			}}
		>
			<Typography
				sx={{
					fontSize: "0.68rem",
					fontWeight: 600,
					color: "text.secondary",
					letterSpacing: "0.01em",
					lineHeight: 1,
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				}}
			>
				{label}
			</Typography>
		</Box>
	);
};

const CorreoBadge = ({ size = "md" }: { size?: "sm" | "md" }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const height = size === "sm" ? 16 : 18;
	return (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				px: 0.75,
				py: 0.5,
				borderRadius: 0.75,
				bgcolor: alpha("#FFCE00", isDark ? 0.22 : 0.85),
				border: `1px solid ${alpha("#E0B400", isDark ? 0.4 : 0.6)}`,
				flexShrink: 0,
			}}
		>
			<Box component="img" src={CORREO_LOGO} alt="Correo Argentino" sx={{ height, width: "auto", display: "block" }} />
		</Box>
	);
};

// ── HeaderStat ─────────────────────────────────────────────────────────────────

const HeaderStat = ({ label, value, tone = "primary" }: { label: string; value: number; tone?: "primary" | "amber" | "green" | "neutral" }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const color =
		tone === "primary" ? BRAND_BLUE : tone === "amber" ? STALE_AMBER : tone === "green" ? LIVE_GREEN : theme.palette.text.secondary;
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

// ── Empty state atmosférico ────────────────────────────────────────────────────

const EmptyState = ({ onAdd, search }: { onAdd: () => void; search?: string }) => {
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
					<BoxIcon size={26} variant="Bulk" />
				</Box>
				<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
					{search ? "Sin resultados" : "Sin seguimientos todavía"}
				</Typography>
				<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", maxWidth: 380, textWrap: "pretty" }}>
					{search
						? `No encontramos seguimientos que coincidan con tu búsqueda.`
						: "Agregá el código y número de tu envío postal para hacer seguimiento automático. Te avisamos cuando cambie de estado."}
				</Typography>
				{!search && (
					<Button
						variant="contained"
						size="small"
						startIcon={<Add size={16} variant="Linear" />}
						onClick={onAdd}
						data-testid="postal-empty-add-btn"
						sx={{
							mt: 0.5,
							minWidth: 130,
							textTransform: "none",
							bgcolor: BRAND_BLUE,
							color: "#fff",
							fontWeight: 600,
							letterSpacing: "-0.005em",
							borderRadius: 1.25,
							boxShadow: "none",
							transition: "background-color 0.15s ease",
							"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
						}}
					>
						Crear primer seguimiento
					</Button>
				)}
			</Stack>
		</Box>
	);
};

// ── Página principal ───────────────────────────────────────────────────────────

const PostalTrackingPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isMd = useMediaQuery(theme.breakpoints.down("md"));
	const { trackings, isLoader, total } = useSelector((state: any) => state.postalTrackingReducer);
	const { tracking: trackingDetail } = useSelector((state: any) => state.postalTrackingReducer);

	// Paginación y filtros
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [sortBy, setSortBy] = useState<"label" | "createdAt" | "lastCheckedAt">("createdAt");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
	const [actionMenuRow, setActionMenuRow] = useState<PostalTrackingType | null>(null);

	const [openCreate, setOpenCreate] = useState(false);
	const [trackingToEdit, setTrackingToEdit] = useState<PostalTrackingType | undefined>(undefined);
	const [trackingToDelete, setTrackingToDelete] = useState<PostalTrackingType | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [detailLoading, setDetailLoading] = useState(false);
	const [linkTracking, setLinkTracking] = useState<PostalTrackingType | null>(null);

	const [isCheckingLimit, setIsCheckingLimit] = useState(false);
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorInfo, setLimitErrorInfo] = useState<{
		resourceType: string;
		plan: string;
		currentCount: string;
		limit: number;
	} | null>(null);

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

	const attachmentInputRef = useRef<HTMLInputElement>(null);
	const [attachmentTargetId, setAttachmentTargetId] = useState<string | null>(null);

	const loadData = useCallback(() => {
		setSelectedIds(new Set());
		dispatch(
			fetchPostalTrackings({
				page: page + 1,
				limit: rowsPerPage,
				search: search || undefined,
				sortBy,
				sortOrder,
			}),
		);
	}, [page, rowsPerPage, search, sortBy, sortOrder]);

	const handleLabelSort = () => {
		if (sortBy === "label") {
			setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortBy("label");
			setSortOrder("asc");
			setPage(0);
		}
	};

	const handleLastCheckedSort = () => {
		if (sortBy === "lastCheckedAt") {
			setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortBy("lastCheckedAt");
			setSortOrder("desc");
			setPage(0);
		}
	};

	useEffect(() => {
		loadData();
	}, [loadData]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setSearch(searchInput);
			setPage(0);
		}, 400);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const showSnackbar = (message: string, severity: "success" | "error") => {
		dispatch(
			openSnackbar({
				open: true,
				message,
				variant: "alert",
				alert: { color: severity },
				close: true,
			}),
		);
	};

	const handleViewDetail = async (id: string) => {
		setDetailOpen(true);
		setDetailLoading(true);
		await dispatch(getPostalTrackingById(id));
		setDetailLoading(false);
	};

	const handleCloseDetail = () => {
		setDetailOpen(false);
		dispatch(clearPostalTrackingDetail());
	};

	const handleOpenEdit = (tracking: PostalTrackingType) => {
		setTrackingToEdit(tracking);
		setOpenCreate(true);
	};

	const handleCloseModal = () => {
		setOpenCreate(false);
		setTrackingToEdit(undefined);
		loadData();
	};

	const handleOpenCreate = async () => {
		setIsCheckingLimit(true);
		try {
			const response = await ApiService.checkResourceLimit("postalTrackings");
			if (response.success && response.data?.hasReachedLimit) {
				setLimitErrorInfo({
					resourceType: "Seguimientos postales",
					plan: response.data.currentPlan || response.data.planId || "free",
					currentCount: String(response.data.currentCount),
					limit: response.data.limit,
				});
				setLimitErrorOpen(true);
				return;
			}
			setOpenCreate(true);
		} catch (error) {
			console.error("Error al verificar el límite de seguimientos postales:", error);
			setOpenCreate(true);
		} finally {
			setIsCheckingLimit(false);
		}
	};

	const handleDeleteConfirm = async (confirmed: boolean) => {
		if (confirmed && trackingToDelete) {
			const result = await dispatch(deletePostalTracking(trackingToDelete._id));
			if (result.success) {
				showSnackbar("Seguimiento eliminado", "success");
				loadData();
			} else {
				showSnackbar(result.error || "Error al eliminar", "error");
			}
		}
		setTrackingToDelete(null);
	};

	const handleCloseLinkModal = () => {
		setLinkTracking(null);
		loadData();
	};

	const handleToggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const allCurrentSelected = trackings.length > 0 && trackings.every((t: PostalTrackingType) => selectedIds.has(t._id));
	const someCurrentSelected = trackings.some((t: PostalTrackingType) => selectedIds.has(t._id));

	const handleToggleAll = () => {
		if (allCurrentSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(trackings.map((t: PostalTrackingType) => t._id)));
		}
	};

	const handleBulkDeleteConfirm = async (confirmed: boolean) => {
		setBulkDeleteOpen(false);
		if (!confirmed) return;
		const ids = Array.from(selectedIds);
		const result = await dispatch(bulkDeletePostalTrackings(ids));
		if (result.success) {
			showSnackbar(
				`${result.deleted} seguimiento${result.deleted !== 1 ? "s" : ""} eliminado${result.deleted !== 1 ? "s" : ""}`,
				"success",
			);
			setSelectedIds(new Set());
			loadData();
		} else {
			showSnackbar(result.error || "Error al eliminar", "error");
		}
	};

	const handleReactivate = async (id: string) => {
		const result = await dispatch(reactivatePostalTracking(id));
		if (result.success) {
			showSnackbar("Seguimiento reactivado", "success");
		} else {
			showSnackbar(result.error || "Error al reactivar el seguimiento", "error");
		}
	};

	const handleMarkAsCompleted = async (id: string) => {
		const result = await dispatch(markPostalTrackingAsCompleted(id));
		if (result.success) {
			showSnackbar("Seguimiento marcado como completado", "success");
		} else {
			showSnackbar(result.error || "Error al completar el seguimiento", "error");
		}
	};

	const handleAttachmentClick = (id: string) => {
		setAttachmentTargetId(id);
		attachmentInputRef.current?.click();
	};

	const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file || !attachmentTargetId) return;
		const result = await dispatch(uploadAttachment(attachmentTargetId, file));
		setAttachmentTargetId(null);
		if (result.success) {
			showSnackbar("Adjunto guardado exitosamente", "success");
		} else {
			showSnackbar(result.error || "Error al subir el adjunto", "error");
		}
	};

	// ── Brand helpers ───────────────────────────────────────────────────────

	const brandPrimaryButtonSx = {
		minWidth: 130,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};

	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		px: 1.5,
		py: 0.5,
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.28),
		},
	};

	const iconBtnSx = (size: number = 32) => ({
		width: size,
		height: size,
		borderRadius: 1,
		color: "text.secondary",
		transition: "color 0.15s ease, background-color 0.15s ease",
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
	});

	const iconBtnIntent = (color: string, size: number = 32) => ({
		width: size,
		height: size,
		borderRadius: 1,
		color: "text.secondary",
		transition: "color 0.15s ease, background-color 0.15s ease",
		"&:hover": { color, bgcolor: alpha(color, isDark ? 0.14 : 0.08) },
	});

	const iconBtnActive = (color: string, size: number = 32) => ({
		width: size,
		height: size,
		borderRadius: 1,
		color,
		bgcolor: alpha(color, isDark ? 0.14 : 0.08),
		border: `1px solid ${alpha(color, isDark ? 0.28 : 0.2)}`,
		"&:hover": { bgcolor: alpha(color, isDark ? 0.2 : 0.12) },
	});

	const inputSx = {
		"& .MuiOutlinedInput-root": {
			borderRadius: 1.25,
			fontSize: "0.875rem",
			"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14), transition: "border-color 0.15s ease" },
			"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
			"&.Mui-focused fieldset": { borderColor: BRAND_BLUE, borderWidth: 1 },
		},
	};

	const selectSx = {
		borderRadius: 1.25,
		fontSize: "0.82rem",
		"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
		"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
		"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
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
		"& .MuiTableBody-root .MuiTableRow-root.Mui-selected, & .MuiTableBody-root .MuiTableRow-root.Mui-selected:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
		},
		"& .MuiTableBody-root .MuiTableCell-root": {
			borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.1 : 0.06)}`,
		},
		"& .MuiTableSortLabel-root": {
			color: "text.secondary",
			"&:hover": { color: BRAND_BLUE },
			"&.Mui-active": { color: BRAND_BLUE, "& .MuiTableSortLabel-icon": { color: `${BRAND_BLUE} !important` } },
		},
		"& .MuiCheckbox-root": {
			color: alpha(BRAND_BLUE, isDark ? 0.4 : 0.32),
			"&.Mui-checked, &.MuiCheckbox-indeterminate": { color: BRAND_BLUE },
		},
	};

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

	// ── Stats ────────────────────────────────────────────────────────────────

	const stats = useMemo(() => {
		const list = trackings as PostalTrackingType[];
		return {
			active: list.filter((t) => t.processingStatus === "active" || t.processingStatus === "pending").length,
			completed: list.filter((t) => t.processingStatus === "completed").length,
			problem: list.filter((t) => t.processingStatus === "error" || t.processingStatus === "not_found").length,
		};
	}, [trackings]);

	// ── Render ────────────────────────────────────────────────────────────────

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
							<BoxIcon size={22} variant="Bulk" />
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
									Logística
								</Typography>
							</Stack>
							<Stack direction="row" spacing={1.25} alignItems="center">
								<Typography
									sx={{
										fontSize: { xs: "1.05rem", md: "1.25rem" },
										fontWeight: 600,
										letterSpacing: "-0.015em",
										color: "text.primary",
										textWrap: "balance",
									}}
								>
									Seguimiento postal
								</Typography>
								<Box sx={{ display: { xs: "none", sm: "inline-flex" } }}>
									<CorreoBadge size="md" />
								</Box>
							</Stack>
							<Typography
								sx={{
									display: { xs: "none", md: "block" },
									fontSize: "0.82rem",
									color: "text.secondary",
									letterSpacing: "-0.005em",
									textWrap: "pretty",
								}}
							>
								Trackeo automático de cartas documento, telegramas y envíos del Correo Argentino.
							</Typography>
						</Stack>
					</Stack>

					<Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, display: { xs: "none", sm: "flex" } }}>
						<HeaderStat label="Activos" value={stats.active} tone="primary" />
						<HeaderStat label="Completados" value={stats.completed} tone="green" />
						<HeaderStat label="Problemas" value={stats.problem} tone="amber" />
					</Stack>

					<Box sx={{ flexShrink: 0 }}>
						{isMobile ? (
							<IconButton
								onClick={handleOpenCreate}
								disabled={isCheckingLimit}
								data-testid="postal-add-btn"
								aria-label="Nuevo seguimiento"
								sx={{
									bgcolor: BRAND_BLUE,
									color: "#fff",
									boxShadow: `0 4px 12px ${alpha(BRAND_BLUE, 0.4)}`,
									"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88) },
								}}
							>
								<Add size={18} />
							</IconButton>
						) : (
							<Button
								variant="contained"
								size="small"
								startIcon={<Add size={16} variant="Linear" />}
								onClick={handleOpenCreate}
								disabled={isCheckingLimit}
								data-testid="postal-add-btn"
								sx={brandPrimaryButtonSx}
							>
								Nuevo seguimiento
							</Button>
						)}
					</Box>
				</Stack>
			</Box>

			{/* Card contenedora */}
			<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
				{/* Toolbar */}
				{(trackings.length > 0 || search) && (
					<Stack
						direction={{ xs: "column", sm: "row" }}
						alignItems={{ xs: "stretch", sm: "center" }}
						spacing={{ xs: 1.25, sm: 1.5 }}
						sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.75, sm: 2 } }}
					>
						<TextField
							size="small"
							placeholder="Buscar por número, etiqueta o estado..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							sx={{ minWidth: { sm: 280 }, flex: { sm: 1 }, maxWidth: { sm: 380 }, ...inputSx }}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchNormal1 size={15} color={theme.palette.text.secondary} />
									</InputAdornment>
								),
							}}
						/>
					</Stack>
				)}

				{(trackings.length > 0 || search) && (
					<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08), mx: { xs: 2, sm: 3 } }} />
				)}

				{/* Bulk bar */}
				{selectedIds.size > 0 && (
					<Stack
						direction="row"
						alignItems="center"
						spacing={1.5}
						sx={{
							mx: { xs: 2, sm: 3 },
							mt: 2,
							px: 1.5,
							py: 1,
							borderRadius: 1.25,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
						}}
					>
						<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
						<Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: BRAND_BLUE, letterSpacing: "-0.005em" }}>
							{selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
						</Typography>
						<Box sx={{ flex: 1 }} />
						<Button
							size="small"
							startIcon={<Trash size={14} variant="Linear" />}
							onClick={() => setBulkDeleteOpen(true)}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								bgcolor: theme.palette.error.main,
								color: "#fff",
								borderRadius: 1,
								boxShadow: "none",
								"&:hover": { bgcolor: alpha(theme.palette.error.main, 0.88), boxShadow: "none" },
							}}
						>
							Eliminar
						</Button>
						<Button size="small" onClick={() => setSelectedIds(new Set())} sx={ghostBtnSx}>
							Cancelar
						</Button>
					</Stack>
				)}

				{/* Contenido */}
				<Box sx={{ p: { xs: 1.5, sm: 0 } }}>
					{isLoader ? (
						<Box sx={{ p: 2 }}>
							<TableContainer>
								<Table size="small" sx={tableSx}>
									<TableHead>
										<TableRow>
											<TableCell padding="checkbox">
												<Skeleton variant="rounded" width={18} height={18} />
											</TableCell>
											<TableCell sx={{ width: 60 }}>
												<Skeleton variant="rounded" width={50} height={24} />
											</TableCell>
											<TableCell>
												<Skeleton variant="rounded" width={120} height={24} />
											</TableCell>
											<TableCell>
												<Skeleton variant="rounded" width={100} height={24} />
											</TableCell>
											<TableCell>
												<Skeleton variant="rounded" width={100} height={24} />
											</TableCell>
											<TableCell>
												<Skeleton variant="rounded" width={150} height={24} />
											</TableCell>
											<TableCell>
												<Skeleton variant="rounded" width={110} height={24} />
											</TableCell>
											<TableCell align="center">
												<Skeleton variant="rounded" width={80} height={24} sx={{ mx: "auto" }} />
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{Array(Math.min(rowsPerPage, 8))
											.fill(0)
											.map((_, i) => (
												<TableRow key={i} sx={{ height: 53 }}>
													<TableCell padding="checkbox">
														<Skeleton variant="rounded" width={18} height={18} />
													</TableCell>
													<TableCell>
														<Skeleton variant="rounded" width={44} height={28} />
													</TableCell>
													<TableCell>
														<Skeleton variant="rounded" width={130} height={20} />
													</TableCell>
													<TableCell>
														<Skeleton variant="rounded" width={90} height={20} />
													</TableCell>
													<TableCell>
														<Skeleton variant="rounded" width={72} height={22} sx={{ borderRadius: 0.75 }} />
													</TableCell>
													<TableCell>
														<Skeleton variant="rounded" width={150} height={20} />
													</TableCell>
													<TableCell>
														<Skeleton variant="rounded" width={110} height={20} />
													</TableCell>
													<TableCell align="center">
														<Stack direction="row" spacing={0.5} justifyContent="center">
															{Array(4)
																.fill(0)
																.map((_, j) => (
																	<Skeleton key={j} variant="rounded" width={28} height={28} sx={{ borderRadius: 1 }} />
																))}
														</Stack>
													</TableCell>
												</TableRow>
											))}
									</TableBody>
								</Table>
							</TableContainer>
						</Box>
					) : trackings.length === 0 && !search ? (
						<EmptyState onAdd={handleOpenCreate} />
					) : trackings.length === 0 && search ? (
						<EmptyState onAdd={handleOpenCreate} search={search} />
					) : (
						<>
							{/* Mobile cards */}
							{isMobile ? (
								<Stack spacing={1.25} sx={{ px: 0.5, py: 0.5 }}>
									{trackings.map((row: PostalTrackingType) => (
										<Box
											key={row._id}
											sx={{
												borderRadius: 1.5,
												overflow: "hidden",
												border: `1px solid ${
													selectedIds.has(row._id) ? alpha(BRAND_BLUE, 0.55) : alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)
												}`,
												bgcolor: selectedIds.has(row._id) ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.06) : "background.paper",
												transition: "border-color 0.15s ease",
											}}
										>
											{/* Header */}
											<Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, pt: 1.25, pb: 1 }}>
												<Checkbox
													size="small"
													checked={selectedIds.has(row._id)}
													onChange={() => handleToggleSelect(row._id)}
													sx={{
														flexShrink: 0,
														color: alpha(BRAND_BLUE, isDark ? 0.4 : 0.32),
														"&.Mui-checked": { color: BRAND_BLUE },
													}}
												/>
												<CorreoBadge size="sm" />
												<Typography
													sx={{
														fontFamily: "monospace",
														fontWeight: 600,
														fontSize: "0.82rem",
														letterSpacing: "0.01em",
														color: "text.primary",
														flex: 1,
													}}
												>
													{row.codeId} {row.numberId}
												</Typography>
												<Tooltip title="Más acciones">
													<IconButton
														onClick={(e) => {
															setActionMenuAnchor(e.currentTarget);
															setActionMenuRow(row);
														}}
														aria-label="Más acciones"
														sx={iconBtnSx(30)}
													>
														<More size={16} variant="Linear" />
													</IconButton>
												</Tooltip>
											</Stack>

											{/* Status pills */}
											<Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 1.5, pb: 1 }} flexWrap="wrap" useFlexGap rowGap={0.75}>
												<StatusPill value={row.processingStatus} />
												{row.trackingStatus && <TrackingStatusChip label={row.trackingStatus} />}
											</Stack>

											{/* Metadata */}
											<Stack spacing={0.25} sx={{ px: 1.5, pb: 1 }}>
												{row.label && (
													<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em" }}>
														{row.label}
													</Typography>
												)}
												<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
													Último chequeo · {formatDate(row.lastCheckedAt)}
												</Typography>
											</Stack>

											<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06) }} />

											{/* Footer actions */}
											<Stack direction="row" spacing={0.25} sx={{ px: 0.75, py: 0.625, justifyContent: "flex-end" }}>
												<Tooltip title="Ver detalle">
													<IconButton sx={iconBtnSx(30)} onClick={() => handleViewDetail(row._id)} data-testid="postal-view-btn">
														<Eye size={16} variant="Linear" />
													</IconButton>
												</Tooltip>
												<Tooltip title="Editar">
													<IconButton sx={iconBtnSx(30)} onClick={() => handleOpenEdit(row)} data-testid="postal-edit-btn">
														<Edit2 size={16} variant="Linear" />
													</IconButton>
												</Tooltip>
												<Tooltip title="Eliminar">
													<IconButton
														sx={iconBtnIntent(theme.palette.error.main, 30)}
														onClick={() => setTrackingToDelete(row)}
														data-testid="postal-delete-btn"
													>
														<Trash size={16} variant="Linear" />
													</IconButton>
												</Tooltip>
											</Stack>
										</Box>
									))}
								</Stack>
							) : (
								/* Desktop table */
								<TableContainer>
									<Table size="small" sx={tableSx}>
										<TableHead>
											<TableRow>
												<TableCell padding="checkbox">
													<Checkbox
														size="small"
														checked={allCurrentSelected}
														indeterminate={!allCurrentSelected && someCurrentSelected}
														onChange={handleToggleAll}
													/>
												</TableCell>
												<TableCell sx={{ width: 60 }}>Proveedor</TableCell>
												<TableCell>Código / Número</TableCell>
												<TableCell sortDirection={sortBy === "label" ? sortOrder : false}>
													<TableSortLabel
														active={sortBy === "label"}
														direction={sortBy === "label" ? sortOrder : "asc"}
														onClick={handleLabelSort}
													>
														Etiqueta
													</TableSortLabel>
												</TableCell>
												<TableCell>Estado proceso</TableCell>
												<TableCell>Estado envío / Entrega</TableCell>
												<TableCell sortDirection={sortBy === "lastCheckedAt" ? sortOrder : false}>
													<TableSortLabel
														active={sortBy === "lastCheckedAt"}
														direction={sortBy === "lastCheckedAt" ? sortOrder : "desc"}
														onClick={handleLastCheckedSort}
													>
														Último chequeo
													</TableSortLabel>
												</TableCell>
												<TableCell align="center">Acciones</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{trackings.map((row: PostalTrackingType) => (
												<TableRow key={row._id} selected={selectedIds.has(row._id)}>
													<TableCell padding="checkbox">
														<Checkbox size="small" checked={selectedIds.has(row._id)} onChange={() => handleToggleSelect(row._id)} />
													</TableCell>
													<TableCell>
														<CorreoBadge size="md" />
													</TableCell>
													<TableCell>
														<Typography
															sx={{ fontFamily: "monospace", fontWeight: 600, fontSize: "0.82rem", color: "text.primary", letterSpacing: "0.01em" }}
														>
															{row.codeId} {row.numberId}
														</Typography>
													</TableCell>
													<TableCell>
														<Typography sx={{ fontSize: "0.82rem", color: row.label ? "text.primary" : "text.secondary", letterSpacing: "-0.005em" }}>
															{row.label || "—"}
														</Typography>
													</TableCell>
													<TableCell>
														<StatusPill value={row.processingStatus} />
													</TableCell>
													<TableCell>
														<Stack spacing={0.25}>
															<Typography
																sx={{
																	fontSize: "0.78rem",
																	color: row.trackingStatus ? "text.primary" : "text.secondary",
																	maxWidth: 200,
																	overflow: "hidden",
																	textOverflow: "ellipsis",
																	whiteSpace: "nowrap",
																}}
															>
																{row.trackingStatus || "—"}
															</Typography>
															<Typography
																sx={{
																	fontSize: "0.68rem",
																	color: row.deliveryStatus ? "text.secondary" : "text.disabled",
																	maxWidth: 200,
																	overflow: "hidden",
																	textOverflow: "ellipsis",
																	whiteSpace: "nowrap",
																}}
															>
																{row.deliveryStatus || "—"}
															</Typography>
														</Stack>
													</TableCell>
													<TableCell>
														<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
															{formatDate(row.lastCheckedAt)}
														</Typography>
													</TableCell>
													<TableCell align="center">
														<Stack direction="row" spacing={0.25} justifyContent="center">
															<Tooltip title="Ver detalle">
																<IconButton sx={iconBtnSx(isMd ? 32 : 30)} onClick={() => handleViewDetail(row._id)} data-testid="postal-view-btn">
																	<Eye size={isMd ? 16 : 15} variant="Linear" />
																</IconButton>
															</Tooltip>
															<Tooltip title="Editar">
																<IconButton sx={iconBtnSx(isMd ? 32 : 30)} onClick={() => handleOpenEdit(row)} data-testid="postal-edit-btn">
																	<Edit2 size={isMd ? 16 : 15} variant="Linear" />
																</IconButton>
															</Tooltip>
															{isMd ? (
																<Tooltip title="Más acciones">
																	<IconButton
																		sx={iconBtnSx(32)}
																		onClick={(e) => {
																			setActionMenuAnchor(e.currentTarget);
																			setActionMenuRow(row);
																		}}
																		aria-label="Más acciones"
																	>
																		<More size={16} variant="Linear" />
																	</IconButton>
																</Tooltip>
															) : (
																<>
																	{/* Vincular */}
																	{row.processingStatus === "not_found" && !row.folderId ? (
																		<Tooltip title="No se puede vincular una causa a un seguimiento no encontrado">
																			<span style={{ display: "inline-flex" }}>
																				<IconButton sx={{ ...iconBtnSx(30), opacity: 0.4 }} disabled data-testid="postal-link-btn">
																					<Link1 size={15} variant="Linear" />
																				</IconButton>
																			</span>
																		</Tooltip>
																	) : (
																		<Tooltip title={row.folderId ? "Cambiar causa vinculada" : "Vincular a causa"}>
																			<IconButton
																				sx={row.folderId ? iconBtnActive(LIVE_GREEN, 30) : iconBtnSx(30)}
																				onClick={() => setLinkTracking(row)}
																				data-testid="postal-link-btn"
																			>
																				<Link1 size={15} variant="Linear" />
																			</IconButton>
																		</Tooltip>
																	)}
																	{/* Adjuntar */}
																	{row.processingStatus === "not_found" ? (
																		<Tooltip title="No se puede adjuntar archivos a un seguimiento no encontrado">
																			<span style={{ display: "inline-flex" }}>
																				<IconButton sx={{ ...iconBtnSx(30), opacity: 0.4 }} disabled data-testid="postal-attachment-btn">
																					<DocumentUpload size={15} variant="Linear" />
																				</IconButton>
																			</span>
																		</Tooltip>
																	) : (
																		<Tooltip title={row.attachmentKey ? "Reemplazar adjunto" : "Adjuntar imagen o PDF"}>
																			<IconButton
																				sx={row.attachmentKey ? iconBtnActive(LIVE_GREEN, 30) : iconBtnSx(30)}
																				onClick={() => handleAttachmentClick(row._id)}
																				data-testid="postal-attachment-btn"
																			>
																				<DocumentUpload size={15} variant="Linear" />
																			</IconButton>
																		</Tooltip>
																	)}
																	{/* Completar */}
																	{["pending", "active", "paused", "error"].includes(row.processingStatus) && (
																		<Tooltip title="Marcar como completado">
																			<IconButton
																				sx={iconBtnIntent(LIVE_GREEN, 30)}
																				onClick={() => handleMarkAsCompleted(row._id)}
																				data-testid="postal-complete-btn"
																			>
																				<TickCircle size={15} variant="Linear" />
																			</IconButton>
																		</Tooltip>
																	)}
																	{/* Reactivar */}
																	{["completed", "not_found", "error", "paused"].includes(row.processingStatus) &&
																		(() => {
																			const canReactivate =
																				row.processingStatus === "paused" ||
																				row.processingStatus === "error" ||
																				(row.processingStatus === "completed" &&
																					(row.manuallyCompleted || row.autoCompletedReason === "code_reuse_detected"));
																			const reactivateTooltip =
																				row.processingStatus === "not_found"
																					? "No se puede reactivar un seguimiento no encontrado por el sitio"
																					: "No se puede reactivar un seguimiento con estado final determinado por el sistema";
																			return canReactivate ? (
																				<Tooltip title="Reactivar seguimiento">
																					<IconButton
																						sx={iconBtnIntent(STALE_AMBER, 30)}
																						onClick={() => handleReactivate(row._id)}
																						data-testid="postal-reactivate-btn"
																					>
																						<Refresh2 size={15} variant="Linear" />
																					</IconButton>
																				</Tooltip>
																			) : (
																				<Tooltip title={reactivateTooltip}>
																					<span style={{ display: "inline-flex" }}>
																						<IconButton sx={{ ...iconBtnSx(30), opacity: 0.4 }} disabled data-testid="postal-reactivate-btn">
																							<Refresh2 size={15} variant="Linear" />
																						</IconButton>
																					</span>
																				</Tooltip>
																			);
																		})()}
																</>
															)}
															<Tooltip title="Eliminar">
																<IconButton
																	sx={iconBtnIntent(theme.palette.error.main, isMd ? 32 : 30)}
																	onClick={() => setTrackingToDelete(row)}
																	data-testid="postal-delete-btn"
																>
																	<Trash size={isMd ? 16 : 15} variant="Linear" />
																</IconButton>
															</Tooltip>
														</Stack>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							)}

							{/* Footer pagination */}
							<Grid
								container
								alignItems="center"
								justifyContent="space-between"
								sx={{ px: { xs: 2, sm: 3 }, py: 2, gap: { xs: 1.5, sm: 0 }, flexDirection: { xs: "column", sm: "row" } }}
							>
								<Grid item>
									<Stack direction="row" spacing={1} alignItems="center">
										<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>Filas por página</Typography>
										<FormControl size="small">
											<Select
												value={rowsPerPage}
												onChange={(e) => {
													setRowsPerPage(Number(e.target.value));
													setPage(0);
												}}
												sx={{ ...selectSx, "& .MuiSelect-select": { py: 0.75, px: 1.25 } }}
											>
												{[10, 25, 50, 100].map((opt) => (
													<MenuItem key={opt} value={opt}>
														{opt}
													</MenuItem>
												))}
											</Select>
										</FormControl>
										<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em", display: { xs: "none", sm: "inline" } }}>
											Ir a
										</Typography>
										<TextField
											size="small"
											type="number"
											value={page + 1}
											onChange={(e) => {
												const p = Math.max(1, Math.min(Number(e.target.value), Math.ceil(total / rowsPerPage)));
												setPage(p - 1);
											}}
											sx={{
												...inputSx,
												"& .MuiOutlinedInput-input": { py: 0.75, px: 1.25, width: 40, fontSize: "0.82rem" },
												display: { xs: "none", sm: "flex" },
											}}
										/>
									</Stack>
								</Grid>
								<Grid item>
									<Pagination
										count={Math.ceil(total / rowsPerPage)}
										page={page + 1}
										onChange={(_, value) => setPage(value - 1)}
										variant="combined"
										showFirstButton
										showLastButton
										size="small"
										sx={paginationSx}
									/>
								</Grid>
							</Grid>
						</>
					)}
				</Box>
			</MainCard>

			{/* Menú contextual de acciones secundarias */}
			<Menu
				anchorEl={actionMenuAnchor}
				open={Boolean(actionMenuAnchor) && Boolean(actionMenuRow)}
				onClose={() => {
					setActionMenuAnchor(null);
					setActionMenuRow(null);
				}}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				PaperProps={{
					elevation: 0,
					sx: {
						mt: 0.5,
						minWidth: 240,
						borderRadius: 1.5,
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
						boxShadow: `0 10px 28px ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)}`,
						"& .MuiMenuItem-root": {
							fontSize: "0.82rem",
							letterSpacing: "-0.005em",
							py: 0.875,
							"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06) },
						},
					},
				}}
			>
				{actionMenuRow &&
					(() => {
						const row = actionMenuRow;
						const canLink = !(row.processingStatus === "not_found" && !row.folderId);
						const canAttach = row.processingStatus !== "not_found";
						const canComplete = ["pending", "active", "paused", "error"].includes(row.processingStatus);
						const canReactivate =
							["completed", "not_found", "error", "paused"].includes(row.processingStatus) &&
							(row.processingStatus === "paused" ||
								row.processingStatus === "error" ||
								(row.processingStatus === "completed" &&
									(row.manuallyCompleted || row.autoCompletedReason === "code_reuse_detected")));
						return [
							<MenuItem
								key="link"
								disabled={!canLink}
								onClick={() => {
									setActionMenuAnchor(null);
									setActionMenuRow(null);
									if (canLink) setLinkTracking(row);
								}}
								data-testid="postal-link-btn"
							>
								<ListItemIcon sx={{ color: "text.secondary", minWidth: "32px !important" }}>
									<Link1 size={15} variant="Linear" />
								</ListItemIcon>
								<ListItemText>{row.folderId ? "Cambiar causa vinculada" : "Vincular a causa"}</ListItemText>
							</MenuItem>,
							<MenuItem
								key="attach"
								disabled={!canAttach}
								onClick={() => {
									setActionMenuAnchor(null);
									setActionMenuRow(null);
									if (canAttach) handleAttachmentClick(row._id);
								}}
								data-testid="postal-attachment-btn"
							>
								<ListItemIcon sx={{ color: "text.secondary", minWidth: "32px !important" }}>
									<DocumentUpload size={15} variant="Linear" />
								</ListItemIcon>
								<ListItemText>{row.attachmentKey ? "Reemplazar adjunto" : "Adjuntar imagen o PDF"}</ListItemText>
							</MenuItem>,
							canComplete && (
								<MenuItem
									key="complete"
									onClick={() => {
										setActionMenuAnchor(null);
										setActionMenuRow(null);
										handleMarkAsCompleted(row._id);
									}}
									data-testid="postal-complete-btn"
								>
									<ListItemIcon sx={{ color: "text.secondary", minWidth: "32px !important" }}>
										<TickCircle size={15} variant="Linear" />
									</ListItemIcon>
									<ListItemText>Marcar como completado</ListItemText>
								</MenuItem>
							),
							canReactivate && (
								<MenuItem
									key="reactivate"
									onClick={() => {
										setActionMenuAnchor(null);
										setActionMenuRow(null);
										handleReactivate(row._id);
									}}
									data-testid="postal-reactivate-btn"
								>
									<ListItemIcon sx={{ color: "text.secondary", minWidth: "32px !important" }}>
										<Refresh2 size={15} variant="Linear" />
									</ListItemIcon>
									<ListItemText>Reactivar seguimiento</ListItemText>
								</MenuItem>
							),
						].filter(Boolean);
					})()}
			</Menu>

			{/* Input oculto adjuntos */}
			<input
				ref={attachmentInputRef}
				type="file"
				accept="image/jpeg,image/png,image/webp,application/pdf"
				style={{ display: "none" }}
				onChange={handleAttachmentChange}
			/>

			{/* Modales */}
			<PostalTrackingModal open={openCreate} handleClose={handleCloseModal} tracking={trackingToEdit} showSnackbar={showSnackbar} />

			<PostalTrackingDetail open={detailOpen} tracking={trackingDetail} loading={detailLoading} handleClose={handleCloseDetail} />

			{linkTracking && (
				<LinkPostalTrackingToFolder
					open={Boolean(linkTracking)}
					onClose={handleCloseLinkModal}
					trackingId={linkTracking._id}
					currentFolderId={linkTracking.folderId}
				/>
			)}

			{trackingToDelete && (
				<AlertPostalTrackingDelete
					numberId={`${trackingToDelete.codeId} ${trackingToDelete.numberId}`}
					open={Boolean(trackingToDelete)}
					handleClose={handleDeleteConfirm}
				/>
			)}

			<AlertPostalTrackingDelete
				numberId={`${selectedIds.size} seguimiento${selectedIds.size !== 1 ? "s" : ""} seleccionado${selectedIds.size !== 1 ? "s" : ""}`}
				open={bulkDeleteOpen}
				handleClose={handleBulkDeleteConfirm}
			/>

			<LimitErrorModal
				open={limitErrorOpen}
				onClose={() => setLimitErrorOpen(false)}
				message="Has alcanzado el límite de seguimientos postales disponibles en tu plan actual."
				limitInfo={limitErrorInfo ?? undefined}
				upgradeRequired={true}
			/>
		</Stack>
	);
};

export default PostalTrackingPage;
