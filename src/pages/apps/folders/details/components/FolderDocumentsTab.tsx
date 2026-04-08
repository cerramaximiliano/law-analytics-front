import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
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
import { Add, ArrowDown2, DocumentDownload, DocumentText, Eye, Printer, Trash } from "iconsax-react";
import { useDispatch, useSelector } from "store";
import {
	fetchPostalDocumentsByFolder,
	deletePostalFolderDocument,
} from "store/reducers/postalDocuments";
import {
	fetchRichTextDocumentsByFolder,
	deleteRichTextFolderDocument,
} from "store/reducers/richTextDocuments";
import { openSnackbar } from "store/reducers/snackbar";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import ApiService from "store/reducers/ApiService";
import { printRichTextDocument } from "utils/printRichTextDocument";
import CreatePostalDocumentModal from "sections/apps/postal-documents/CreatePostalDocumentModal";
import type { PostalDocumentType } from "types/postal-document";
import type { RichTextDocument } from "types/rich-text-document";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────────

const toRow = (doc: PostalDocumentType | RichTextDocument, kind: DocKind): DocRow => ({
	_id: doc._id,
	kind,
	title: doc.title,
	category: kind === "postal"
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
	postal: "Plantilla Sistema",
	richtext: "Mis Modelos",
};

const KIND_COLOR: Record<DocKind, "primary" | "secondary"> = {
	postal: "secondary",
	richtext: "primary",
};

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
	folderId: string;
	folderName?: string;
}

const FolderDocumentsTab = ({ folderId, folderName }: Props) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const postalDocs: PostalDocumentType[] = useSelector(
		(state: any) => state.postalDocumentsReducer?.folderDocuments ?? []
	);
	const rtDocs: RichTextDocument[] = useSelector(
		(state: any) => state.richTextDocumentsReducer?.folderDocuments ?? []
	);
	const postalLoading: boolean = useSelector(
		(state: any) => state.postalDocumentsReducer?.folderDocumentsLoading ?? false
	);

	const [newDocAnchor, setNewDocAnchor] = useState<null | HTMLElement>(null);
	const [openCreatePostal, setOpenCreatePostal] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [printLoading, setPrintLoading] = useState<string | null>(null);
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorData, setLimitErrorData] = useState<{
		resourceType: string; plan: string; currentCount: string; limit: number;
	} | null>(null);

	// Load on mount / folderId change
	useEffect(() => {
		if (!folderId) return;
		dispatch(fetchPostalDocumentsByFolder(folderId) as any);
		dispatch(fetchRichTextDocumentsByFolder(folderId) as any);
	}, [folderId]); // eslint-disable-line react-hooks/exhaustive-deps

	const rows = useMemo((): DocRow[] => {
		const result: DocRow[] = [
			...postalDocs.map((d) => toRow(d, "postal")),
			...rtDocs.map((d) => toRow(d, "richtext")),
		];
		return result.sort((a, b) =>
			new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
		);
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
		} catch { /* permitir ante error de red */ }
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
		navigate(`/documentos/escritos/nuevo?folderId=${folderId}`);
	};

	const handleView = (row: DocRow) => {
		if (row.kind === "richtext") {
			navigate(`/documentos/escritos/${row._id}/editar`);
		} else {
			navigate(`/documentos/escritos`);
		}
	};

	const handleDownloadOrPrint = useCallback(async (row: DocRow) => {
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
	}, [navigate]);

	const handleDelete = async (row: DocRow) => {
		setDeleteLoading(true);
		let result: any;
		if (row.kind === "postal") {
			result = await dispatch(deletePostalFolderDocument(row._id) as any);
		} else {
			result = await dispatch(deleteRichTextFolderDocument(row._id) as any);
		}
		setDeleteLoading(false);
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

	return (
		<Box>
			{/* Header */}
			<Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
				<Stack spacing={0.25}>
					<Typography variant="h5">Documentos</Typography>
					<Typography variant="body2" color="text.secondary">
						Documentos vinculados a {folderName ? `"${folderName}"` : "este expediente"}
					</Typography>
				</Stack>
				<Box>
					<Button
						variant="contained"
						size="small"
						startIcon={<Add size={16} />}
						endIcon={<ArrowDown2 size={14} />}
						onClick={(e) => setNewDocAnchor(e.currentTarget)}
					>
						Nuevo documento
					</Button>
					<Menu
						anchorEl={newDocAnchor}
						open={Boolean(newDocAnchor)}
						onClose={() => setNewDocAnchor(null)}
					>
						<MenuItem onClick={handleNewPostal} sx={{ py: 1.5 }}>
							<Stack spacing={0.25}>
								<Typography variant="body2" fontWeight={500}>Plantilla del Sistema</Typography>
								<Typography variant="caption" color="text.secondary">
									Telegramas, cartas documento y más
								</Typography>
							</Stack>
						</MenuItem>
						<Divider />
						<MenuItem onClick={handleNewRichText} sx={{ py: 1.5 }}>
							<Stack spacing={0.25}>
								<Typography variant="body2" fontWeight={500}>Mis Modelos</Typography>
								<Typography variant="caption" color="text.secondary">
									Escritos personalizados con editor de texto
								</Typography>
							</Stack>
						</MenuItem>
					</Menu>
				</Box>
			</Stack>

			{/* Table */}
			{isLoading ? (
				<Stack alignItems="center" justifyContent="center" py={6}>
					<CircularProgress size={28} />
				</Stack>
			) : rows.length === 0 ? (
				<Stack alignItems="center" justifyContent="center" spacing={1.5} py={8}>
					<DocumentText size={40} variant="Linear" color="text.secondary" />
					<Stack alignItems="center" spacing={0.5}>
						<Typography variant="body1" fontWeight={500} color="text.secondary">
							Sin documentos vinculados
						</Typography>
						<Typography variant="body2" color="text.disabled">
							Creá un nuevo documento o vinculá uno existente desde Documentos › Escritos
						</Typography>
					</Stack>
				</Stack>
			) : (
				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow>
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
								<TableRow key={row._id} hover>
									<TableCell>
										<Chip
											label={KIND_LABEL[row.kind]}
											size="small"
											color={KIND_COLOR[row.kind]}
											variant="outlined"
											sx={{ fontSize: "0.65rem", height: 20 }}
										/>
									</TableCell>
									<TableCell>
										<Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>
											{row.title}
										</Typography>
									</TableCell>
									<TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
										<Typography variant="caption" color="text.secondary" noWrap>
											{row.category}
										</Typography>
									</TableCell>
									<TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
										<Typography variant="caption">
											{STATUS_LABEL[row.status] ?? row.status}
										</Typography>
									</TableCell>
									<TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
										<Typography variant="caption" color="text.secondary">
											{row.createdAt
												? new Date(row.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })
												: "—"}
										</Typography>
									</TableCell>
									<TableCell align="right">
										<Stack direction="row" spacing={0.5} justifyContent="flex-end">
											<Tooltip title={row.kind === "richtext" ? "Ver / Editar" : "Ver en Escritos"}>
												<IconButton size="small" onClick={() => handleView(row)}>
													<Eye size={16} />
												</IconButton>
											</Tooltip>
											<Tooltip title={row.documentUrl ? "Descargar PDF" : "Imprimir"}>
												<span>
													<IconButton
														size="small"
														disabled={printLoading === row._id}
														onClick={() => handleDownloadOrPrint(row)}
													>
														{printLoading === row._id
															? <CircularProgress size={14} />
															: row.documentUrl
																? <DocumentDownload size={16} />
																: <Printer size={16} />
														}
													</IconButton>
												</span>
											</Tooltip>
											<Tooltip title="Eliminar">
												<IconButton
													size="small"
													color="error"
													disabled={deleteLoading}
													onClick={() => handleDelete(row)}
												>
													<Trash size={16} />
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

			{/* Modals */}
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
		</Box>
	);
};

export default FolderDocumentsTab;
