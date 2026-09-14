import React, { useState, useEffect } from "react";
import MovementLinkChip from "components/MovementLinkChip";
import {
	Stack,
	Button,
	Typography,
	Box,
	useTheme,
	alpha,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Tooltip,
	Collapse,
	CircularProgress,
} from "@mui/material";
import MainCard from "components/MainCard";
import { DocumentText, Add, Trash, Edit2 } from "iconsax-react";
import ModalNotes from "../modals/ModalNotes";
import { useSelector, dispatch } from "store";
import { getNotesByFolderId, deleteNote } from "store/reducers/notes";
import { openSnackbar } from "store/reducers/snackbar";
import type { RootState } from "store";
import type { Note } from "types/note";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE } from "themes/dashboardTokens";

interface NotesProps {
	title: string;
	folderId: string;
	folderName?: string;
}

const CONTENT_TRUNCATE_LENGTH = 150;

const Notes: React.FC<NotesProps> = ({ title, folderId, folderName }) => {
	void title;
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;
	const { canDelete, canUpdate, canCreate } = useTeam();
	const [openModal, setOpenModal] = useState(false);
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
	const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
	const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);
	const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
	const [isDeleting, setIsDeleting] = useState(false);
	const { selectedNotes } = useSelector((state: RootState) => state.notesReducer);

	useEffect(() => {
		if (folderId) {
			dispatch(getNotesByFolderId(folderId));
		}
	}, [folderId]);

	const handleEditClick = (note: Note) => {
		setNoteToEdit(note);
		setOpenModal(true);
	};

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
							alert: { color: "success" },
							close: true,
						}),
					);
				} else {
					dispatch(
						openSnackbar({
							open: true,
							message: "Error al eliminar la nota.",
							variant: "alert",
							alert: { color: "error" },
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
		setNoteToEdit(null);
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

	const shouldTruncate = (content: string) => content && content.length > CONTENT_TRUNCATE_LENGTH;
	const getTruncatedContent = (content: string) => (content ? content.substring(0, CONTENT_TRUNCATE_LENGTH) : "Sin contenido");
	const getRemainingContent = (content: string) => content.substring(CONTENT_TRUNCATE_LENGTH);

	const brandIconButtonSx = (accent: string) => ({
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
	});

	// Empty state — brand
	const EmptyState = () => (
		<Box
			sx={{
				p: 3.5,
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
				Sin notas registradas
			</Typography>
			<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em", mt: 0.5, maxWidth: 320, mx: "auto" }}>
				Agregá notas importantes relacionadas con este expediente.
			</Typography>
		</Box>
	);

	return (
		<MainCard
			content={false}
			sx={{
				"& .MuiCardContent-root": { p: 0 },
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				boxShadow: "none",
				overflow: "hidden",
			}}
		>
			<Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
				<Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
					{selectedNotes && selectedNotes.length > 0 ? (
						<Stack spacing={1.25}>
							{selectedNotes.map((note: Note) => {
								const needsTruncation = shouldTruncate(note.content || "");
								const isExpanded = expandedNotes.has(note._id);
								const content = note.content || "";

								return (
									<Box
										key={note._id}
										sx={{
											p: 1.5,
											borderRadius: 1.25,
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
											bgcolor: theme.palette.background.paper,
											transition: "all 180ms ease",
											"&:hover": {
												borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
											},
										}}
									>
										<Stack direction="row" spacing={1.25} alignItems="flex-start">
											<Box
												sx={{
													width: 32,
													height: 32,
													borderRadius: 0.875,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
													border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
													color: BRAND_BLUE,
													flexShrink: 0,
												}}
											>
												<DocumentText size={16} variant="Bulk" />
											</Box>
											<Box sx={{ flex: 1, minWidth: 0 }}>
												<Typography
													sx={{ fontSize: "0.92rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em", mb: 0.375 }}
												>
													{note.title}
												</Typography>
												{note.movementRef ? (
													<Box sx={{ mb: 0.5 }}>
														<MovementLinkChip movementRef={note.movementRef} folderId={folderId} />
													</Box>
												) : null}
												<Typography
													sx={{
														fontSize: "0.82rem",
														color: "text.secondary",
														letterSpacing: "-0.005em",
														lineHeight: 1.55,
														whiteSpace: "pre-wrap",
														wordBreak: "break-word",
													}}
												>
													{needsTruncation ? (
														<>
															{getTruncatedContent(content)}
															{!isExpanded && "…"}
															<Collapse in={isExpanded} timeout={300}>
																<Box component="span">{getRemainingContent(content)}</Box>
															</Collapse>
														</>
													) : (
														content || "Sin contenido"
													)}
												</Typography>
												{needsTruncation && (
													<Box
														component="button"
														onClick={() => toggleNoteExpansion(note._id)}
														sx={{
															mt: 0.625,
															background: "none",
															border: "none",
															p: 0,
															cursor: "pointer",
															fontSize: "0.74rem",
															fontWeight: 600,
															color: BRAND_BLUE,
															letterSpacing: "-0.005em",
															"&:hover": { textDecoration: "underline" },
														}}
													>
														{isExpanded ? "Ver menos" : "Ver más"}
													</Box>
												)}
											</Box>
											<Stack direction="row" spacing={0.625} sx={{ flexShrink: 0 }}>
												{canUpdate && (
													<Tooltip title="Editar">
														<IconButton
															size="small"
															aria-label="edit"
															onClick={() => handleEditClick(note)}
															sx={brandIconButtonSx(BRAND_BLUE)}
														>
															<Edit2 size={14} variant="Bulk" />
														</IconButton>
													</Tooltip>
												)}
												{canDelete && (
													<Tooltip title="Eliminar">
														<IconButton
															size="small"
															aria-label="delete"
															onClick={() => handleDeleteClick(note)}
															sx={brandIconButtonSx(errorColor)}
														>
															<Trash size={14} variant="Bulk" />
														</IconButton>
													</Tooltip>
												)}
											</Stack>
										</Stack>
									</Box>
								);
							})}
						</Stack>
					) : (
						<EmptyState />
					)}
				</Box>

				{/* Footer CTA */}
				{canCreate && (
					<Box
						sx={{
							p: 2,
							borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
						}}
					>
						<Button
							variant="contained"
							fullWidth
							startIcon={<Add size={16} variant="Bulk" />}
							onClick={() => setOpenModal(true)}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								bgcolor: BRAND_BLUE,
								color: "#fff",
								borderRadius: 1.25,
								py: 1,
								boxShadow: "none",
								"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
							}}
						>
							Nueva nota
						</Button>
					</Box>
				)}
			</Box>

			<ModalNotes open={openModal} setOpen={handleModalClose} folderId={folderId} folderName={folderName} note={noteToEdit} />

			{/* Delete confirmation — brand */}
			<Dialog
				open={openDeleteDialog}
				onClose={isDeleting ? undefined : handleDeleteCancel}
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
									¿Eliminar esta nota?
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
										"{noteToDelete?.title}"
									</Box>{" "}
									de forma permanente. Esta acción no se puede deshacer.
								</Typography>
							</Stack>
						</Stack>
					</Box>
				</DialogTitle>
				<DialogContent sx={{ display: "none" }} />
				<DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
					<Button
						fullWidth
						onClick={handleDeleteCancel}
						disabled={isDeleting}
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
						onClick={handleDeleteConfirm}
						autoFocus
						disabled={isDeleting}
						variant="contained"
						startIcon={isDeleting ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : null}
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
						{isDeleting ? "Eliminando…" : "Eliminar"}
					</Button>
				</DialogActions>
			</Dialog>
		</MainCard>
	);
};

export default Notes;
