import { useState } from "react";
import { useDispatch } from "react-redux";

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
} from "@mui/material";

// project imports
import { setCurrentDocument, deleteDocument } from "store/reducers/documents";

// assets
import { Edit2, Trash, More, Eye, DocumentCopy, Archive, Clock } from "iconsax-react";

// types
import { Document, DocumentStatus, DocumentType } from "types/documents";

interface DocumentListProps {
	documents: Document[];
	onEdit: () => void;
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

function DocumentList({ documents, onEdit }: DocumentListProps) {
	const dispatch = useDispatch();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

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

	const handleDelete = async (id: string) => {
		if (window.confirm("¿Está seguro de eliminar este documento?")) {
			// TODO: API call to delete document
			dispatch(deleteDocument(id));
		}
		handleMenuClose();
	};

	const handleDuplicate = (doc: Document) => {
		// TODO: Implement duplicate functionality
		console.log("Duplicate document:", doc);
		handleMenuClose();
	};

	const handleArchive = (doc: Document) => {
		// TODO: Implement archive functionality
		console.log("Archive document:", doc);
		handleMenuClose();
	};

	const handleView = (doc: Document) => {
		// TODO: Implement view functionality
		console.log("View document:", doc);
		handleMenuClose();
	};

	const formatDate = (date: Date | string) => {
		return new Date(date).toLocaleDateString("es-AR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

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
				<MenuItem onClick={() => selectedDoc && handleDelete(selectedDoc.id)} sx={{ color: "error.main" }}>
					<Trash size={16} style={{ marginRight: 8 }} />
					Eliminar
				</MenuItem>
			</Menu>
		</>
	);
}

export default DocumentList;
