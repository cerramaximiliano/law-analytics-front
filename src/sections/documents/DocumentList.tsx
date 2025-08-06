import { useState } from "react";
import { useDispatch } from "react-redux";
import { useSnackbar } from "notistack";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// material-ui
import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	IconButton,
	Chip,
	Typography,
	Tooltip,
	Menu,
	MenuItem,
	Paper,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	DialogContentText,
	CircularProgress,
	Grid,
	Skeleton,
} from "@mui/material";

// project imports
import { setCurrentDocument, deleteDocument, changeDocumentStatus } from "store/reducers/documents";

// assets
import { Edit2, Trash, More, Eye, DocumentCopy, Archive, Clock, DocumentDownload, Printer } from "iconsax-react";

// types
import { Document, DocumentStatus, DocumentType } from "types/documents";

interface DocumentListProps {
	documents: Document[];
	onEdit: () => void;
	isLoading?: boolean;
}

const statusConfig: Record<DocumentStatus, { label: string; color: "default" | "primary" | "success" | "warning" }> = {
	draft: { label: "Borrador", color: "default" },
	final: { label: "Final", color: "success" },
	archived: { label: "Archivado", color: "warning" },
};

const typeLabels: Record<DocumentType, string> = {
	demanda: "Demanda",
	contestacion: "Contestación",
	escrito: "Escrito",
	notificacion: "Notificación",
	contrato: "Contrato",
	poder: "Poder",
	recurso: "Recurso",
	otros: "Otros",
};

function DocumentList({ documents, onEdit, isLoading = false }: DocumentListProps) {
	const dispatch = useDispatch();
	const { enqueueSnackbar } = useSnackbar();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [docToDelete, setDocToDelete] = useState<Document | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
	const [docToPreview, setDocToPreview] = useState<Document | null>(null);

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, doc: Document) => {
		setAnchorEl(event.currentTarget);
		setSelectedDoc(doc);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setSelectedDoc(null);
	};

	const handleEdit = (doc: Document) => {
		dispatch(setCurrentDocument(doc));
		onEdit();
		handleMenuClose();
	};

	const handleDeleteClick = (doc: Document) => {
		setDocToDelete(doc);
		setDeleteDialogOpen(true);
		handleMenuClose();
	};

	const handleDeleteConfirm = async () => {
		if (docToDelete) {
			setIsDeleting(true);
			try {
				const result = await dispatch(deleteDocument(docToDelete.id) as any);

				if (result.success) {
					enqueueSnackbar(`Documento "${docToDelete.title}" eliminado correctamente`, {
						variant: "success",
					});
				} else {
					enqueueSnackbar(result.error || "Error al eliminar el documento", {
						variant: "error",
					});
				}
				// Always close dialog after showing snackbar
				setDeleteDialogOpen(false);
				setDocToDelete(null);
			} catch (error) {
				enqueueSnackbar("Error al eliminar el documento", {
					variant: "error",
				});
			} finally {
				setIsDeleting(false);
			}
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setDocToDelete(null);
	};

	const handleDuplicate = (doc: Document) => {
		// TODO: Implement duplicate functionality
		console.log("Duplicate document:", doc);
		handleMenuClose();
	};

	const handleArchive = async (doc: Document) => {
		handleMenuClose();

		try {
			// Toggle between archived and draft status
			const newStatus = doc.status === "archived" ? "draft" : "archived";
			const result = await dispatch(changeDocumentStatus(doc.id, newStatus) as any);

			if (result.success) {
				enqueueSnackbar(
					doc.status === "archived"
						? `Documento "${doc.title}" desarchivado correctamente`
						: `Documento "${doc.title}" archivado correctamente`,
					{ variant: "success" },
				);
			} else {
				enqueueSnackbar(result.error || "Error al cambiar el estado del documento", {
					variant: "error",
				});
			}
		} catch (error) {
			enqueueSnackbar("Error al cambiar el estado del documento", {
				variant: "error",
			});
		}
	};

	const handleView = (doc: Document) => {
		setDocToPreview(doc);
		setPreviewDialogOpen(true);
		handleMenuClose();
	};

	const handleClosePreview = () => {
		setPreviewDialogOpen(false);
		setDocToPreview(null);
	};

	const handlePrint = () => {
		if (!docToPreview) return;

		// Create a hidden iframe for printing
		const printFrame = document.createElement("iframe");
		printFrame.style.position = "absolute";
		printFrame.style.top = "-10000px";
		printFrame.style.left = "-10000px";
		document.body.appendChild(printFrame);

		const printDocument = printFrame.contentDocument || printFrame.contentWindow?.document;
		if (printDocument) {
			printDocument.open();
			printDocument.write(`
				<!DOCTYPE html>
				<html>
					<head>
						<title>${docToPreview.title}</title>
						<style>
							@page { 
								size: A4; 
								margin: 25mm 20mm;
							}
							body { 
								font-family: 'Times New Roman', serif;
								font-size: 12pt;
								line-height: 1.8;
								margin: 0;
								padding: 0;
							}
							p { 
								margin-bottom: 12px;
								text-align: justify;
							}
							h1, h2, h3 {
								font-weight: bold;
								margin-top: 24px;
								margin-bottom: 12px;
							}
							h1 { font-size: 18pt; }
							h2 { font-size: 16pt; }
							h3 { font-size: 14pt; }
						</style>
					</head>
					<body>
						${docToPreview.content}
					</body>
				</html>
			`);
			printDocument.close();

			// Wait for content to load, then print
			printFrame.onload = () => {
				printFrame.contentWindow?.print();
				// Remove iframe after printing
				setTimeout(() => {
					document.body.removeChild(printFrame);
				}, 1000);
			};
		}
	};

	const handleDownloadPDF = async () => {
		if (!docToPreview) return;

		try {
			// Show loading message
			enqueueSnackbar("Generando PDF...", { variant: "info" });

			// Create a temporary container for rendering
			const tempContainer = document.createElement("div");
			tempContainer.style.position = "absolute";
			tempContainer.style.left = "-9999px";
			tempContainer.style.width = "210mm"; // A4 width
			tempContainer.style.padding = "25mm 20mm"; // Standard margins
			tempContainer.style.backgroundColor = "white";
			tempContainer.style.fontFamily = "Times New Roman, serif";
			tempContainer.innerHTML = `
				<style>
					* {
						font-family: 'Times New Roman', serif !important;
					}
					p {
						font-size: 12pt;
						line-height: 1.8;
						margin-bottom: 12px;
						text-align: justify;
					}
					h1, h2, h3 {
						font-weight: bold;
						margin-top: 24px;
						margin-bottom: 12px;
					}
					h1 { font-size: 18pt; }
					h2 { font-size: 16pt; }
					h3 { font-size: 14pt; }
				</style>
				${docToPreview.content}
			`;
			document.body.appendChild(tempContainer);

			// Wait for fonts to load
			await document.fonts.ready;

			// Convert HTML to canvas
			const canvas = await html2canvas(tempContainer, {
				scale: 2, // Higher quality
				backgroundColor: "#ffffff",
				logging: false,
				useCORS: true,
				allowTaint: true,
			});

			// Remove temporary container
			document.body.removeChild(tempContainer);

			// Create PDF
			const pdf = new jsPDF({
				orientation: "portrait",
				unit: "mm",
				format: "a4",
			});

			// Calculate dimensions
			const imgWidth = 210; // A4 width in mm
			const imgHeight = (canvas.height * imgWidth) / canvas.width;
			const pageHeight = 297; // A4 height in mm
			const margin = 0; // We already have margins in the content

			let heightLeft = imgHeight;
			let position = margin;

			// Add image to PDF
			const imgData = canvas.toDataURL("image/png");

			// First page
			pdf.addImage(imgData, "PNG", margin, position, imgWidth - 2 * margin, imgHeight);
			heightLeft -= pageHeight;

			// Add additional pages if needed
			while (heightLeft > 0) {
				position = heightLeft - imgHeight;
				pdf.addPage();
				pdf.addImage(imgData, "PNG", margin, position, imgWidth - 2 * margin, imgHeight);
				heightLeft -= pageHeight;
			}

			// Generate filename
			const filename = `${docToPreview.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;

			// Save PDF
			pdf.save(filename);

			enqueueSnackbar("PDF descargado correctamente", { variant: "success" });
		} catch (error) {
			console.error("Error generating PDF:", error);
			enqueueSnackbar("Error al generar el PDF", { variant: "error" });
		}
	};

	const formatDate = (date: Date | string) => {
		return new Date(date).toLocaleDateString("es-AR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	if (isLoading) {
		return (
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Título</TableCell>
							<TableCell>Tipo</TableCell>
							<TableCell>Estado</TableCell>
							<TableCell>Última modificación</TableCell>
							<TableCell>Creado por</TableCell>
							<TableCell align="right">Acciones</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{[...Array(5)].map((_, index) => (
							<TableRow key={`skeleton-${index}`}>
								<TableCell>
									<Skeleton variant="text" width="80%" />
									<Skeleton variant="text" width="60%" height={16} />
								</TableCell>
								<TableCell>
									<Skeleton variant="text" width="100px" />
								</TableCell>
								<TableCell>
									<Skeleton variant="rectangular" width="80px" height={24} sx={{ borderRadius: 1 }} />
								</TableCell>
								<TableCell>
									<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
										<Skeleton variant="circular" width={16} height={16} />
										<Skeleton variant="text" width="100px" />
									</Box>
								</TableCell>
								<TableCell>
									<Skeleton variant="text" width="120px" />
								</TableCell>
								<TableCell align="right">
									<Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
										<Skeleton variant="circular" width={32} height={32} />
										<Skeleton variant="circular" width={32} height={32} />
										<Skeleton variant="circular" width={32} height={32} />
									</Box>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		);
	}

	if (documents.length === 0) {
		return (
			<Box sx={{ textAlign: "center", py: 5 }}>
				<Typography variant="h6" color="textSecondary">
					No hay documentos disponibles
				</Typography>
				<Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
					Cree su primer documento haciendo clic en "Nuevo Documento"
				</Typography>
			</Box>
		);
	}

	return (
		<>
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Título</TableCell>
							<TableCell>Tipo</TableCell>
							<TableCell>Estado</TableCell>
							<TableCell>Última modificación</TableCell>
							<TableCell>Creado por</TableCell>
							<TableCell align="right">Acciones</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{documents.map((doc) => (
							<TableRow key={doc.id} hover>
								<TableCell>
									<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
										{doc.title}
									</Typography>
									{doc.folderId && (
										<Typography variant="caption" color="textSecondary">
											Vinculado a carpeta
										</Typography>
									)}
								</TableCell>
								<TableCell>{typeLabels[doc.type]}</TableCell>
								<TableCell>
									<Chip label={statusConfig[doc.status].label} color={statusConfig[doc.status].color} size="small" />
								</TableCell>
								<TableCell>
									<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
										<Clock size={14} />
										<Typography variant="body2">{formatDate(doc.updatedAt)}</Typography>
									</Box>
								</TableCell>
								<TableCell>
									<Typography variant="body2">{doc.createdBy}</Typography>
								</TableCell>
								<TableCell align="right">
									<Tooltip title="Ver">
										<IconButton size="small" onClick={() => handleView(doc)}>
											<Eye size={18} />
										</IconButton>
									</Tooltip>
									<Tooltip title="Editar">
										<IconButton size="small" onClick={() => handleEdit(doc)}>
											<Edit2 size={18} />
										</IconButton>
									</Tooltip>
									<Tooltip title="Más opciones">
										<IconButton size="small" onClick={(e) => handleMenuOpen(e, doc)}>
											<More size={18} />
										</IconButton>
									</Tooltip>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
				<MenuItem onClick={() => selectedDoc && handleDuplicate(selectedDoc)}>
					<DocumentCopy size={16} style={{ marginRight: 8 }} />
					Duplicar
				</MenuItem>
				<MenuItem onClick={() => selectedDoc && handleArchive(selectedDoc)}>
					<Archive size={16} style={{ marginRight: 8 }} />
					{selectedDoc?.status === "archived" ? "Desarchivar" : "Archivar"}
				</MenuItem>
				<MenuItem onClick={() => selectedDoc && handleDeleteClick(selectedDoc)} sx={{ color: "error.main" }}>
					<Trash size={16} style={{ marginRight: 8 }} />
					Eliminar
				</MenuItem>
			</Menu>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={deleteDialogOpen}
				onClose={handleDeleteCancel}
				aria-labelledby="delete-dialog-title"
				aria-describedby="delete-dialog-description"
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle id="delete-dialog-title">
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Trash size={24} color="#d32f2f" />
						<Typography variant="h6">Eliminar Documento</Typography>
					</Box>
				</DialogTitle>
				<DialogContent>
					<DialogContentText id="delete-dialog-description">
						¿Está seguro que desea eliminar el documento{" "}
						<Box component="span" sx={{ fontWeight: 600 }}>
							"{docToDelete?.title}"
						</Box>
						? Esta acción no se puede deshacer.
					</DialogContentText>
				</DialogContent>
				<DialogActions sx={{ p: 2.5 }}>
					<Button onClick={handleDeleteCancel} color="secondary" disabled={isDeleting}>
						Cancelar
					</Button>
					<Button
						onClick={handleDeleteConfirm}
						color="error"
						variant="contained"
						startIcon={isDeleting ? <CircularProgress size={18} color="inherit" /> : <Trash size={18} />}
						disabled={isDeleting}
					>
						{isDeleting ? "Eliminando..." : "Eliminar"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Document Preview Dialog */}
			<Dialog
				open={previewDialogOpen}
				onClose={handleClosePreview}
				aria-labelledby="preview-dialog-title"
				maxWidth={false}
				sx={{
					"& .MuiDialog-paper": {
						width: "90vw",
						maxWidth: "1200px",
						height: "90vh",
						borderRadius: 2,
					},
				}}
			>
				<DialogTitle
					id="preview-dialog-title"
					sx={{
						borderBottom: 1,
						borderColor: "divider",
						pb: 2,
					}}
				>
					<Typography variant="h5" sx={{ fontWeight: 600 }}>
						Vista Previa del Documento
					</Typography>
				</DialogTitle>
				<DialogContent sx={{ p: 0, bgcolor: "#f5f5f5", overflow: "hidden" }}>
					{docToPreview && (
						<Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
							{/* Document metadata bar */}
							<Box
								sx={{
									p: 2,
									bgcolor: "background.paper",
									borderBottom: 1,
									borderColor: "divider",
									boxShadow: 1,
								}}
							>
								<Grid container spacing={3} alignItems="center">
									<Grid item xs={12} sm={4}>
										<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
											{docToPreview.title}
										</Typography>
										<Typography variant="caption" color="textSecondary">
											{typeLabels[docToPreview.type]}
										</Typography>
									</Grid>
									<Grid item xs={6} sm={4}>
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											<Typography variant="caption" color="textSecondary">
												Estado:
											</Typography>
											<Chip label={statusConfig[docToPreview.status].label} color={statusConfig[docToPreview.status].color} size="small" />
										</Box>
									</Grid>
									<Grid item xs={6} sm={4}>
										<Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "flex-end" }}>
											<Clock size={16} color="#666" />
											<Typography variant="caption" color="textSecondary">
												{formatDate(docToPreview.updatedAt)}
											</Typography>
										</Box>
									</Grid>
								</Grid>
							</Box>

							{/* Document content with page design */}
							<Box
								sx={{
									flex: 1,
									overflow: "auto",
									display: "flex",
									justifyContent: "center",
									alignItems: "flex-start",
									p: 3,
								}}
							>
								<Box
									sx={{
										width: "210mm", // A4 width
										minHeight: "297mm", // A4 height
										bgcolor: "white",
										boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
										borderRadius: 1,
										p: "25mm 20mm", // Standard document margins
										"& p": {
											fontFamily: "Times New Roman, serif",
											fontSize: "12pt",
											lineHeight: 1.8,
											marginBottom: "12px",
											textAlign: "justify",
										},
										"& h1, & h2, & h3": {
											fontFamily: "Times New Roman, serif",
											fontWeight: "bold",
											marginTop: "24px",
											marginBottom: "12px",
										},
										"& h1": { fontSize: "18pt" },
										"& h2": { fontSize: "16pt" },
										"& h3": { fontSize: "14pt" },
									}}
									dangerouslySetInnerHTML={{ __html: docToPreview.content }}
								/>
							</Box>
						</Box>
					)}
				</DialogContent>
				<DialogActions
					sx={{
						p: 2,
						borderTop: 1,
						borderColor: "divider",
						bgcolor: "background.paper",
						display: "flex",
						justifyContent: "space-between",
					}}
				>
					<Box>
						<Button onClick={handleClosePreview} variant="outlined" sx={{ mr: 1 }}>
							Cerrar
						</Button>
					</Box>
					<Box>
						<Button onClick={handleDownloadPDF} variant="outlined" startIcon={<DocumentDownload size={18} />} sx={{ mr: 1 }}>
							Descargar PDF
						</Button>
						<Button onClick={handlePrint} variant="outlined" startIcon={<Printer size={18} />} sx={{ mr: 1 }}>
							Imprimir
						</Button>
						<Button
							variant="contained"
							onClick={() => {
								handleEdit(docToPreview!);
								handleClosePreview();
							}}
							startIcon={<Edit2 size={18} />}
						>
							Editar Documento
						</Button>
					</Box>
				</DialogActions>
			</Dialog>
		</>
	);
}

export default DocumentList;
