import React, { useState, useEffect } from "react";
import {
	Stack,
	Button,
	Typography,
	Box,
	useTheme,
	alpha,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Avatar,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	DialogContentText,
	Tooltip,
	Link,
	Collapse,
	CircularProgress,
} from "@mui/material";
import MainCard from "components/MainCard";
import { DocumentText, Add, Trash } from "iconsax-react";
import { motion } from "framer-motion";
import ModalNotes from "../modals/ModalNotes";
import { useSelector, dispatch } from "store";
import { getNotesByFolderId, deleteNote } from "store/reducers/notes";
import { openSnackbar } from "store/reducers/snackbar";
import type { RootState } from "store";
import type { Note } from "types/note";

interface NotesProps {
	title: string;
	folderId: string;
	folderName?: string;
}

const CONTENT_TRUNCATE_LENGTH = 150;

const Notes: React.FC<NotesProps> = ({ title, folderId, folderName }) => {
	const theme = useTheme();
	const [openModal, setOpenModal] = useState(false);
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
	const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
	const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
	const [isDeleting, setIsDeleting] = useState(false);
	const { selectedNotes } = useSelector((state: RootState) => state.notesReducer);

	// Fetch notes when component mounts
	useEffect(() => {
		if (folderId) {
			dispatch(getNotesByFolderId(folderId));
		}
	}, [folderId]);

	const handleDeleteClick = (note: Note) => {
		setNoteToDelete(note);
		setOpenDeleteDialog(true);
	};

	const handleDeleteConfirm = async () => {
		if (noteToDelete) {
			setIsDeleting(true);
			try {
				const result = await dispatch(deleteNote(noteToDelete._id));
				if (result.success) {
					dispatch(
						openSnackbar({
							open: true,
							message: "Nota eliminada exitosamente.",
							variant: "alert",
							alert: {
								color: "success",
							},
							close: true,
						}),
					);
				} else {
					dispatch(
						openSnackbar({
							open: true,
							message: "Error al eliminar la nota.",
							variant: "alert",
							alert: {
								color: "error",
							},
							close: true,
						}),
					);
				}
			} finally {
				setIsDeleting(false);
				setOpenDeleteDialog(false);
				setNoteToDelete(null);
			}
		}
	};

	const handleDeleteCancel = () => {
		setOpenDeleteDialog(false);
		setNoteToDelete(null);
	};

	const handleModalClose = () => {
		setOpenModal(false);
	};

	const toggleNoteExpansion = (noteId: string) => {
		setExpandedNotes((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(noteId)) {
				newSet.delete(noteId);
			} else {
				newSet.add(noteId);
			}
			return newSet;
		});
	};

	const shouldTruncate = (content: string) => {
		return content && content.length > CONTENT_TRUNCATE_LENGTH;
	};

	const getTruncatedContent = (content: string) => {
		if (!content) return "Sin contenido";
		return content.substring(0, CONTENT_TRUNCATE_LENGTH);
	};

	const getRemainingContent = (content: string) => {
		return content.substring(CONTENT_TRUNCATE_LENGTH);
	};

	// Empty state component
	const EmptyState = () => (
		<Box sx={{ textAlign: "center", py: 4 }}>
			<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
				<Avatar
					color="error"
					variant="rounded"
					sx={{
						width: 64,
						height: 64,
						bgcolor: alpha(theme.palette.error.main, 0.1),
						color: "error.main",
						mx: "auto",
						mb: 2,
					}}
				>
					<DocumentText variant="Bold" size={32} />
				</Avatar>
			</motion.div>
			<Typography variant="subtitle1" color="textSecondary" gutterBottom>
				No hay notas registradas
			</Typography>
			<Typography variant="body2" color="textSecondary" sx={{ maxWidth: 320, mx: "auto" }}>
				Agrega notas importantes relacionadas con este expediente
			</Typography>
		</Box>
	);

	return (
		<MainCard
			shadow={3}
			title={
				title ? (
					<List disablePadding>
						<ListItem sx={{ p: 0 }}>
							<ListItemAvatar>
								<Avatar color="info" variant="rounded">
									<DocumentText variant="Bold" />
								</Avatar>
							</ListItemAvatar>
							<ListItemText
								sx={{ my: 0 }}
								primary="Notas"
								secondary={<Typography variant="subtitle1">Anotaciones y recordatorios del expediente</Typography>}
							/>
						</ListItem>
					</List>
				) : null
			}
			content={false}
			sx={{
				"& .MuiCardContent-root": {
					p: 2.5,
				},
			}}
		>
			<Box sx={{ p: 2.5 }}>
				{selectedNotes && selectedNotes.length > 0 ? (
					<>
						<List>
							{selectedNotes.map((note: Note) => {
								const needsTruncation = shouldTruncate(note.content || "");
								const isExpanded = expandedNotes.has(note._id);
								const content = note.content || "";

								return (
									<ListItem
										key={note._id}
										sx={{
											border: `1px solid ${theme.palette.divider}`,
											borderRadius: 1,
											mb: 1.5,
											"&:hover": {
												bgcolor: alpha(theme.palette.primary.main, 0.04),
											},
											flexDirection: "column",
											alignItems: "flex-start",
										}}
									>
										<Box sx={{ display: "flex", width: "100%", alignItems: "flex-start" }}>
											<ListItemAvatar>
												<Avatar color="primary" variant="rounded">
													<DocumentText variant="Bold" />
												</Avatar>
											</ListItemAvatar>
											<Box sx={{ my: 0, pr: 2, flex: 1 }}>
												<Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
													{note.title}
												</Typography>
												<Typography
													variant="body2"
													color="text.secondary"
													sx={{
														whiteSpace: "pre-wrap",
														wordBreak: "break-word",
													}}
												>
													{needsTruncation ? (
														<>
															{getTruncatedContent(content)}
															{!isExpanded && "..."}
															<Collapse in={isExpanded} timeout={300}>
																<Box component="span">{getRemainingContent(content)}</Box>
															</Collapse>
														</>
													) : (
														content || "Sin contenido"
													)}
												</Typography>
											</Box>
											<Tooltip title="Eliminar">
												<IconButton size="small" aria-label="delete" onClick={() => handleDeleteClick(note)} color="error" sx={{ mt: 0.5 }}>
													<Trash variant="Bulk" />
												</IconButton>
											</Tooltip>
										</Box>
										{needsTruncation && (
											<Box sx={{ width: "100%", pl: 7, mt: 0.5 }}>
												<Link
													component="button"
													variant="body2"
													onClick={() => toggleNoteExpansion(note._id)}
													sx={{
														cursor: "pointer",
														fontWeight: 500,
														textDecoration: "none",
														"&:hover": {
															textDecoration: "underline",
														},
													}}
												>
													{isExpanded ? "Ver menos" : "Ver más"}
												</Link>
											</Box>
										)}
									</ListItem>
								);
							})}
						</List>
						<Stack direction="row" spacing={2} sx={{ mt: 2 }}>
							<Button variant="contained" fullWidth startIcon={<Add size={18} />} onClick={() => setOpenModal(true)}>
								Nueva Nota
							</Button>
						</Stack>
					</>
				) : (
					<>
						<EmptyState />
						<Stack direction="row" spacing={2} sx={{ mt: 3 }}>
							<Button variant="contained" fullWidth startIcon={<Add size={18} />} onClick={() => setOpenModal(true)}>
								Nueva Nota
							</Button>
						</Stack>
					</>
				)}
			</Box>

			{/* Modal para crear notas */}
			<ModalNotes open={openModal} setOpen={handleModalClose} folderId={folderId} folderName={folderName} />

			{/* Diálogo de confirmación de eliminación */}
			<Dialog
				open={openDeleteDialog}
				onClose={isDeleting ? undefined : handleDeleteCancel}
				aria-labelledby="alert-dialog-title"
				aria-describedby="alert-dialog-description"
			>
				<DialogTitle id="alert-dialog-title">Confirmar eliminación</DialogTitle>
				<DialogContent>
					<DialogContentText id="alert-dialog-description">
						¿Estás seguro de que deseas eliminar la nota "{noteToDelete?.title}"? Esta acción no se puede deshacer.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDeleteCancel} color="secondary" disabled={isDeleting}>
						Cancelar
					</Button>
					<Button
						onClick={handleDeleteConfirm}
						color="error"
						variant="contained"
						autoFocus
						disabled={isDeleting}
						startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
					>
						{isDeleting ? "Eliminando..." : "Eliminar"}
					</Button>
				</DialogActions>
			</Dialog>
		</MainCard>
	);
};

export default Notes;
