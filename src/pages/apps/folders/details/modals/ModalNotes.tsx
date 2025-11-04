import React from "react";
import { DialogTitle, Divider, Button, Stack, DialogContent, DialogActions, useTheme, Typography, InputLabel } from "@mui/material";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import InputField from "components/UI/InputField";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import { useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { addNote, updateNote } from "store/reducers/notes";
import { dispatch } from "store";

// icons
import { DocumentText } from "iconsax-react";

// project imports
import { PopupTransition } from "components/@extended/Transitions";

// types
import { NoteModalType, NoteFormValues } from "types/note";

const ModalNotes = ({ open, setOpen, handlerAddress, folderId, folderName, note }: NoteModalType) => {
	const theme = useTheme();
	const userId = useSelector((state: any) => state.auth?.user?._id);
	const isEditMode = Boolean(note);

	function closeNoteModal() {
		setOpen(false);
	}

	const NoteSchema = Yup.object().shape({
		title: Yup.string().max(255).required("El título es requerido"),
		content: Yup.string().max(5000),
	});

	const initialValues: NoteFormValues = {
		title: note?.title || "",
		content: note?.content || "",
		userId,
		folderId,
	};

	async function _submitForm(values: NoteFormValues, actions: any) {
		try {
			let result;

			if (isEditMode && note) {
				// Actualizar nota existente
				result = await dispatch(updateNote(note._id, values));
			} else {
				// Crear nueva nota
				result = await dispatch(addNote(values));
			}

			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: isEditMode ? "Nota actualizada exitosamente." : "Nota creada exitosamente.",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: true,
					}),
				);

				if (handlerAddress) {
					handlerAddress(result.note);
				}
				closeNoteModal();
				actions.resetForm();
				return true;
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: isEditMode ? "Error al actualizar la nota." : "Error al crear la nota.",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: true,
					}),
				);
				closeNoteModal();
				actions.resetForm();
				return false;
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: isEditMode ? "Error al actualizar la nota." : "Error al crear la nota.",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: true,
				}),
			);
			closeNoteModal();
			actions.resetForm();
			return false;
		} finally {
			actions.setSubmitting(false);
		}
	}

	async function _handleSubmit(values: NoteFormValues, actions: any) {
		await _submitForm(values, actions);
	}

	return (
		<Formik initialValues={initialValues} validationSchema={NoteSchema} onSubmit={_handleSubmit} enableReinitialize>
			{({ isSubmitting, resetForm }) => {
				const handleClose = () => {
					if (!isSubmitting) {
						closeNoteModal();
						resetForm();
					}
				};

				return (
					<ResponsiveDialog
						open={open}
						onClose={handleClose}
						TransitionComponent={PopupTransition}
						keepMounted
						maxWidth="xs"
						fullWidth
						aria-labelledby="note-modal-title"
						PaperProps={{
							elevation: 5,
							sx: {
								borderRadius: 2,
								overflow: "hidden",
							},
						}}
					>
						<Form>
							<DialogTitle
								id="note-modal-title"
								sx={{
									bgcolor: theme.palette.primary.lighter,
									p: 3,
									borderBottom: `1px solid ${theme.palette.divider}`,
								}}
							>
								<Stack spacing={1}>
									<Stack direction="row" alignItems="center" spacing={1}>
										<DocumentText size={24} color={theme.palette.primary.main} variant="Bold" />
										<Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
											{isEditMode ? "Editar Nota" : "Nueva Nota"}
										</Typography>
									</Stack>
									<Typography variant="body2" color="textSecondary">
										{isEditMode
											? "Modifica el contenido de la nota"
											: folderName
											? `Agrega una nueva nota a la carpeta "${folderName}"`
											: "Agrega una nueva nota"}
									</Typography>
								</Stack>
							</DialogTitle>
							<Divider />

							<DialogContent sx={{ p: 3 }}>
								<Stack spacing={2.5}>
									<div>
										<InputLabel htmlFor="title" sx={{ mb: 1 }}>
											Título *
										</InputLabel>
										<InputField
											name="title"
											id="title"
											autoFocus
											placeholder="Ingresa el título de la nota"
											disabled={isSubmitting}
											fullWidth
										/>
									</div>

									<div>
										<InputLabel htmlFor="content" sx={{ mb: 1 }}>
											Contenido (opcional)
										</InputLabel>
										<InputField
											name="content"
											id="content"
											placeholder="Escribe el contenido de la nota"
											multiline
											rows={6}
											disabled={isSubmitting}
											fullWidth
										/>
									</div>
								</Stack>
							</DialogContent>

							<Divider />

							<DialogActions sx={{ px: 3, py: 2 }}>
								<Button onClick={handleClose} color="error" disabled={isSubmitting}>
									Cancelar
								</Button>
								<Button type="submit" variant="contained" disabled={isSubmitting}>
									{isSubmitting ? "Guardando..." : isEditMode ? "Actualizar Nota" : "Crear Nota"}
								</Button>
							</DialogActions>
						</Form>
					</ResponsiveDialog>
				);
			}}
		</Formik>
	);
};

export default ModalNotes;
