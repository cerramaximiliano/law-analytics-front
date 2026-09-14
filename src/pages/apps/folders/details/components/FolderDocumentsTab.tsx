import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
	Box,
	Button,
	CircularProgress,
	DialogActions,
	DialogTitle,
	IconButton,
	Menu,
	MenuItem,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { ResponsiveDialog } from "components/@extended/ResponsiveDialog";
import { Add, ArrowDown2, DocumentDownload, DocumentText, Eye, Printer, Trash } from "iconsax-react";
import { useDispatch, useSelector } from "store";
import { fetchPostalDocumentsByFolder, deletePostalFolderDocument } from "store/reducers/postalDocuments";
import { fetchRichTextDocumentsByFolder, deleteRichTextFolderDocument } from "store/reducers/richTextDocuments";
import { openSnackbar } from "store/reducers/snackbar";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import ApiService from "store/reducers/ApiService";
import { printRichTextDocument } from "utils/printRichTextDocument";
import CreatePostalDocumentModal from "sections/apps/postal-documents/CreatePostalDocumentModal";
import PickModelDialog from "sections/apps/rich-text-documents/PickModelDialog";
import type { PostalDocumentType } from "types/postal-document";
import type { RichTextDocument } from "types/rich-text-document";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

type DocKind = "postal" | "richtext";

interface DocRow {
	_id: string;
	kind: DocKind;
	title: string;
	category: string;
	status: string;
	createdAt?: string;
	documentUrl?: string;
}

const toRow = (doc: PostalDocumentType | RichTextDocument, kind: DocKind): DocRow => ({
	_id: doc._id,
	kind,
	title: doc.title,
	category:
		kind === "postal"
			? (doc as PostalDocumentType).templateCategory ?? (doc as PostalDocumentType).templateName ?? "—"
			: (doc as RichTextDocument).templateCategory ?? "—",
	status: doc.status ?? "—",
	createdAt: doc.createdAt,
	documentUrl: kind === "postal" ? (doc as PostalDocumentType).documentUrl : undefined,
});

const STATUS_LABEL: Record<string, string> = {
	draft: "Borrador",
	final: "Final",
	generated: "Generado",
	sent: "Enviado",
	archived: "Archivado",
};

const KIND_LABEL: Record<DocKind, string> = {
	postal: "Modelo Sistema",
	richtext: "Mis Modelos",
};

interface Props {
	folderId: string;
	folderName?: string;
}

const FolderDocumentsTab = ({ folderId, folderName }: Props) => {
	void folderName;
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;

	const postalDocs: PostalDocumentType[] = useSelector((state: any) => state.postalDocumentsReducer?.folderDocuments ?? []);
	const rtDocs: RichTextDocument[] = useSelector((state: any) => state.richTextDocumentsReducer?.folderDocuments ?? []);
	const postalLoading: boolean = useSelector((state: any) => state.postalDocumentsReducer?.folderDocumentsLoading ?? false);

	const [newDocAnchor, setNewDocAnchor] = useState<null | HTMLElement>(null);
	const [openCreatePostal, setOpenCreatePostal] = useState(false);
	const [openPickModel, setOpenPickModel] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<{ _id: string; kind: DocKind; title: string } | null>(null);
	const [printLoading, setPrintLoading] = useState<string | null>(null);
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorData, setLimitErrorData] = useState<{
		resourceType: string;
		plan: string;
		currentCount: string;
		limit: number;
	} | null>(null);

	useEffect(() => {
		if (!folderId) return;
		dispatch(fetchPostalDocumentsByFolder(folderId) as any);
		dispatch(fetchRichTextDocumentsByFolder(folderId) as any);
	}, [folderId]); // eslint-disable-line react-hooks/exhaustive-deps

	const rows = useMemo((): DocRow[] => {
		const result: DocRow[] = [...postalDocs.map((d) => toRow(d, "postal")), ...rtDocs.map((d) => toRow(d, "richtext"))];
		return result.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
	}, [postalDocs, rtDocs]);

	const isLoading = postalLoading;

	const showSnackbar = (message: string, severity: "success" | "error") => {
		dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color: severity }, close: true }));
	};

	const checkLimit = async (): Promise<boolean> => {
		try {
			const res = await ApiService.checkResourceLimit("postalDocuments");
			if (res.success && res.data?.hasReachedLimit) {
				setLimitErrorData({
					resourceType: "Documentos",
					plan: res.data.currentPlan || "free",
					currentCount: `${res.data.currentCount}`,
					limit: res.data.limit,
				});
				setLimitErrorOpen(true);
				return false;
			}
		} catch {
			/* permitir ante error de red */
		}
		return true;
	};

	const handleNewPostal = async () => {
		setNewDocAnchor(null);
		if (!(await checkLimit())) return;
		setOpenCreatePostal(true);
	};

	const handleNewRichText = async () => {
		setNewDocAnchor(null);
		if (!(await checkLimit())) return;
		setOpenPickModel(true);
	};

	const handleView = (row: DocRow) => {
		if (row.kind === "richtext") {
			navigate(`/documentos/escritos/${row._id}/editar`);
		} else {
			navigate(`/documentos/escritos`);
		}
	};

	const handleDownloadOrPrint = useCallback(
		async (row: DocRow) => {
			if (row.kind === "postal" && row.documentUrl) {
				window.open(row.documentUrl, "_blank");
			} else if (row.kind === "richtext") {
				setPrintLoading(row._id);
				try {
					await printRichTextDocument(row._id);
				} catch {
					showSnackbar("No se pudo abrir la vista de impresión", "error");
				} finally {
					setPrintLoading(null);
				}
			} else {
				navigate(`/documentos/escritos`);
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		},
		[navigate],
	);

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		let result: any;
		if (deleteTarget.kind === "postal") {
			result = await dispatch(deletePostalFolderDocument(deleteTarget._id) as any);
		} else {
			result = await dispatch(deleteRichTextFolderDocument(deleteTarget._id) as any);
		}
		setDeleteLoading(false);
		setDeleteTarget(null);
		if (result?.success) {
			showSnackbar("Documento eliminado", "success");
		} else {
			showSnackbar("Error al eliminar el documento", "error");
		}
	};

	const refresh = () => {
		dispatch(fetchPostalDocumentsByFolder(folderId) as any);
		dispatch(fetchRichTextDocumentsByFolder(folderId) as any);
	};

	const brandIconButtonSx = (accent: string = BRAND_BLUE) => ({
		width: 28,
		height: 28,
		borderRadius: 0.75,
		border: `1px solid ${alpha(accent, isDark ? 0.22 : 0.14)}`,
		bgcolor: alpha(accent, isDark ? 0.08 : 0.04),
		color: accent,
		transition: "all 180ms ease",
		"&:hover": {
			bgcolor: alpha(accent, isDark ? 0.18 : 0.1),
			borderColor: alpha(accent, isDark ? 0.38 : 0.28),
		},
		"&:disabled": {
			bgcolor: alpha(theme.palette.text.disabled, 0.06),
			color: theme.palette.text.disabled,
		},
	});

	const getStatusAccent = (status: string) => {
		switch (status) {
			case "final":
			case "generated":
			case "sent":
				return LIVE_GREEN;
			case "draft":
				return STALE_AMBER;
			case "archived":
				return theme.palette.text.disabled as string;
			default:
				return theme.palette.text.secondary as string;
		}
	};

	const KindPill = ({ kind }: { kind: DocKind }) => (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				gap: 0.5,
				px: 0.75,
				py: 0.125,
				borderRadius: 0.625,
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
			}}
		>
			<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
			<Typography
				sx={{
					fontSize: "0.62rem",
					fontWeight: 600,
					color: BRAND_BLUE,
					letterSpacing: "0.04em",
					textTransform: "uppercase",
					lineHeight: 1,
				}}
			>
				{KIND_LABEL[kind]}
			</Typography>
		</Box>
	);

	const StatusPill = ({ status }: { status: string }) => {
		const accent = getStatusAccent(status);
		return (
			<Box
				sx={{
					display: "inline-flex",
					alignItems: "center",
					gap: 0.5,
					px: 0.75,
					py: 0.125,
					borderRadius: 0.625,
					bgcolor: alpha(accent, isDark ? 0.16 : 0.1),
					border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
				}}
			>
				<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: accent }} />
				<Typography
					sx={{
						fontSize: "0.62rem",
						fontWeight: 600,
						color: accent,
						letterSpacing: "0.04em",
						textTransform: "uppercase",
						lineHeight: 1,
					}}
				>
					{STATUS_LABEL[status] ?? status}
				</Typography>
			</Box>
		);
	};

	// Dropdown menu
	const newDocMenu = (
		<Menu
			anchorEl={newDocAnchor}
			open={Boolean(newDocAnchor)}
			onClose={() => setNewDocAnchor(null)}
			PaperProps={{
				sx: {
					borderRadius: 1.25,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
					boxShadow: `0 8px 24px ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)}`,
					mt: 0.5,
				},
			}}
		>
			<MenuItem onClick={handleNewPostal} sx={{ py: 1.25, px: 1.75 }}>
				<Stack spacing={0.25}>
					<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
						Modelo del sistema
					</Typography>
					<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
						Telegramas, cartas documento y más
					</Typography>
				</Stack>
			</MenuItem>
			<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1), mx: 1.5 }} />
			<MenuItem onClick={handleNewRichText} sx={{ py: 1.25, px: 1.75 }}>
				<Stack spacing={0.25}>
					<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
						Mis modelos
					</Typography>
					<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
						Escritos personalizados con editor de texto
					</Typography>
				</Stack>
			</MenuItem>
		</Menu>
	);

	const ctaButtonSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		bgcolor: BRAND_BLUE,
		color: "#fff",
		borderRadius: 1.25,
		px: 1.75,
		py: 0.875,
		boxShadow: "none",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
	};

	const ghostButtonSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: BRAND_BLUE,
		borderRadius: 1.25,
		px: 1.5,
		py: 0.625,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		bgcolor: "transparent",
		"&:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
		},
	};

	return (
		<Box>
			{isLoading ? (
				<Stack alignItems="center" justifyContent="center" py={6}>
					<CircularProgress size={28} sx={{ color: BRAND_BLUE }} />
				</Stack>
			) : rows.length === 0 ? (
				<Box
					sx={{
						p: 4,
						textAlign: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
						border: `1px dashed ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.2)}`,
						borderRadius: 1.5,
					}}
				>
					<Box
						sx={{
							width: 56,
							height: 56,
							borderRadius: 1.5,
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
							mb: 1.5,
						}}
					>
						<DocumentText size={28} variant="Bulk" />
					</Box>
					<Typography sx={{ fontSize: "1rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.015em" }}>
						Sin documentos vinculados
					</Typography>
					<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em", mt: 0.5, maxWidth: 380, mx: "auto" }}>
						Creá un nuevo documento o vinculá uno existente desde Documentos › Escritos.
					</Typography>
					<Button
						variant="contained"
						size="small"
						startIcon={<Add size={16} variant="Bulk" />}
						endIcon={<ArrowDown2 size={12} variant="Bulk" />}
						onClick={(e) => setNewDocAnchor(e.currentTarget)}
						sx={{ ...ctaButtonSx, mt: 2 }}
					>
						Nuevo documento
					</Button>
					{newDocMenu}
				</Box>
			) : (
				<>
					{/* Header */}
					<Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
							<Typography
								sx={{
									fontSize: "0.6rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								Documentos vinculados · {rows.length}
							</Typography>
						</Stack>
						<Button
							size="small"
							startIcon={<Add size={14} variant="Bulk" />}
							endIcon={<ArrowDown2 size={12} variant="Bulk" />}
							onClick={(e) => setNewDocAnchor(e.currentTarget)}
							sx={ghostButtonSx}
						>
							Nuevo documento
						</Button>
						{newDocMenu}
					</Stack>

					{/* Table */}
					<TableContainer
						sx={{
							borderRadius: 1.5,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
						}}
					>
						<Table size="small">
							<TableHead>
								<TableRow
									sx={{
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
										"& th": {
											borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
											fontSize: "0.6rem",
											fontWeight: 600,
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											color: "text.secondary",
											py: 1,
										},
									}}
								>
									<TableCell>Tipo</TableCell>
									<TableCell>Título</TableCell>
									<TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Categoría</TableCell>
									<TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Estado</TableCell>
									<TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Fecha</TableCell>
									<TableCell align="right">Acciones</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{rows.map((row) => (
									<TableRow
										key={row._id}
										sx={{
											"& td": {
												borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.08)}`,
												py: 1.25,
											},
											"&:last-child td": { borderBottom: "none" },
											transition: "background 180ms ease",
											"&:hover": {
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
											},
										}}
									>
										<TableCell>
											<KindPill kind={row.kind} />
										</TableCell>
										<TableCell>
											<Typography
												sx={{
													fontSize: "0.82rem",
													fontWeight: 500,
													color: "text.primary",
													letterSpacing: "-0.005em",
													maxWidth: 220,
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{row.title}
											</Typography>
										</TableCell>
										<TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
											<Typography
												sx={{
													fontSize: "0.78rem",
													color: "text.secondary",
													letterSpacing: "-0.005em",
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{row.category}
											</Typography>
										</TableCell>
										<TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
											<StatusPill status={row.status} />
										</TableCell>
										<TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
											<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em", fontVariantNumeric: "tabular-nums" }}>
												{row.createdAt
													? new Date(row.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })
													: "—"}
											</Typography>
										</TableCell>
										<TableCell align="right">
											<Stack direction="row" spacing={0.625} justifyContent="flex-end">
												<Tooltip title={row.kind === "richtext" ? "Ver / Editar" : "Ver en Escritos"}>
													<IconButton size="small" onClick={() => handleView(row)} sx={brandIconButtonSx()}>
														<Eye size={14} variant="Bulk" />
													</IconButton>
												</Tooltip>
												<Tooltip title={row.documentUrl ? "Descargar PDF" : "Imprimir"}>
													<span>
														<IconButton
															size="small"
															disabled={printLoading === row._id}
															onClick={() => handleDownloadOrPrint(row)}
															sx={brandIconButtonSx()}
														>
															{printLoading === row._id ? (
																<CircularProgress size={12} sx={{ color: BRAND_BLUE }} />
															) : row.documentUrl ? (
																<DocumentDownload size={14} variant="Bulk" />
															) : (
																<Printer size={14} variant="Bulk" />
															)}
														</IconButton>
													</span>
												</Tooltip>
												<Tooltip title="Eliminar">
													<IconButton
														size="small"
														onClick={() => setDeleteTarget({ _id: row._id, kind: row.kind, title: row.title })}
														sx={brandIconButtonSx(errorColor)}
													>
														<Trash size={14} variant="Bulk" />
													</IconButton>
												</Tooltip>
											</Stack>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</>
			)}

			<PickModelDialog open={openPickModel} onClose={() => setOpenPickModel(false)} folderId={folderId} />

			<CreatePostalDocumentModal
				open={openCreatePostal}
				handleClose={() => {
					setOpenCreatePostal(false);
					refresh();
				}}
				prefilledFolderId={folderId}
				showSnackbar={showSnackbar}
			/>

			<LimitErrorModal
				open={limitErrorOpen}
				onClose={() => setLimitErrorOpen(false)}
				message="Has alcanzado el límite de documentos para tu plan actual."
				limitInfo={limitErrorData ?? undefined}
			/>

			{/* Delete dialog — brand sober destructive */}
			<ResponsiveDialog
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				maxWidth="xs"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: 2,
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
						boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
						overflow: "hidden",
					},
				}}
			>
				<DialogTitle sx={{ p: 0 }}>
					<Box sx={{ p: { xs: 3, sm: 3.5 }, position: "relative" }}>
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
									sx={{
										fontSize: "1.05rem",
										fontWeight: 600,
										letterSpacing: "-0.015em",
										color: "text.primary",
										textAlign: "center",
										textWrap: "balance" as any,
									}}
								>
									¿Eliminar este documento?
								</Typography>
								<Typography
									sx={{
										fontSize: "0.85rem",
										color: "text.secondary",
										letterSpacing: "-0.005em",
										textAlign: "center",
										textWrap: "pretty" as any,
									}}
								>
									Vas a eliminar{" "}
									<Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
										"{deleteTarget?.title}"
									</Box>{" "}
									de forma permanente. Esta acción no se puede deshacer.
								</Typography>
							</Stack>
						</Stack>
					</Box>
				</DialogTitle>
				<DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
					<Button
						fullWidth
						onClick={() => setDeleteTarget(null)}
						disabled={deleteLoading}
						sx={{
							textTransform: "none",
							fontWeight: 600,
							letterSpacing: "-0.005em",
							color: "text.secondary",
							borderRadius: 1.25,
							py: 1,
							border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
							"&:hover": {
								color: BRAND_BLUE,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
								borderColor: alpha(BRAND_BLUE, 0.28),
							},
						}}
					>
						Cancelar
					</Button>
					<Button
						fullWidth
						variant="contained"
						onClick={handleDelete}
						disabled={deleteLoading}
						startIcon={deleteLoading ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : null}
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
						{deleteLoading ? "Eliminando…" : "Eliminar"}
					</Button>
				</DialogActions>
			</ResponsiveDialog>
		</Box>
	);
};

export default FolderDocumentsTab;
