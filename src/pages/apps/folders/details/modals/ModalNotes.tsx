import React from "react";
import { Box, DialogTitle, Button, Stack, DialogContent, DialogActions, useTheme, Typography, InputLabel } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import InputField from "components/UI/InputField";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import { useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { addNote, updateNote } from "store/reducers/notes";
import { dispatch } from "store";
import { useTeam } from "contexts/TeamContext";

import { DocumentText } from "iconsax-react";

import { PopupTransition } from "components/@extended/Transitions";
import { BRAND_BLUE } from "themes/dashboardTokens";

import { NoteModalType, NoteFormValues } from "types/note";

const ModalNotes = ({
	open,
	setOpen,
	handlerAddress,
	folderId,
	folderName,
	note,
	initialValues: externalInitialValues,
	dialogSx,
}: NoteModalType) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const userId = useSelector((state: any) => state.auth?.user?._id);
	const { getRequestHeaders } = useTeam();
	const isEditMode = Boolean(note);

	function closeNoteModal() {
		setOpen(false);
	}

	const NoteSchema = Yup.object().shape({
		title: Yup.string().max(255).required("El título es requerido"),
		content: Yup.string().max(5000),
	});

	const defaultValues: NoteFormValues = {
		title: note?.title || "",
		content: note?.content || "",
		userId,
		folderId,
	};

	const initialValues: NoteFormValues = !note && externalInitialValues ? { ...defaultValues, ...externalInitialValues } : defaultValues;

	async function _submitForm(values: NoteFormValues, actions: any) {
		try {
			let result;

			if (isEditMode && note) {
				// Actualizar nota existente
				result = await dispatch(updateNote(note._id, values));
			} else {
				// Crear nueva nota
				result = await dispatch(addNote(values, { headers: getRequestHeaders() }));
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
						sx={dialogSx}
						PaperProps={{
							elevation: 0,
							sx: {
								borderRadius: 2,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
								boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
								overflow: "hidden",
							},
						}}
					>
						<Form>
							<DialogTitle
								id="note-modal-title"
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1.25,
									px: 2.5,
									py: 1.75,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
									borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
								}}
							>
								<Box
									sx={{
										width: 32,
										height: 32,
										borderRadius: 1,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
										color: BRAND_BLUE,
									}}
								>
									<DocumentText size={18} variant="Bulk" />
								</Box>
								<Stack spacing={0.125} sx={{ minWidth: 0, flex: 1 }}>
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
											{isEditMode ? "Editar" : "Nueva"}
										</Typography>
									</Stack>
									<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
										{isEditMode ? "Editar nota" : "Nueva nota"}
									</Typography>
									<Typography
										sx={{
											fontSize: "0.72rem",
											color: "text.secondary",
											letterSpacing: "-0.005em",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{isEditMode
											? "Modificá el contenido de la nota"
											: folderName
											? `Agregás una nueva nota a "${folderName}"`
											: "Agregás una nueva nota"}
									</Typography>
								</Stack>
							</DialogTitle>

							<DialogContent sx={{ p: 2.5 }}>
								<Stack spacing={2}>
									<div>
										<InputLabel htmlFor="title" sx={{ mb: 0.75, fontSize: "0.78rem", fontWeight: 500, color: "text.primary" }}>
											Título *
										</InputLabel>
										<InputField
											name="title"
											id="title"
											autoFocus
											placeholder="Ingresá el título de la nota"
											disabled={isSubmitting}
											fullWidth
										/>
									</div>

									<div>
										<InputLabel htmlFor="content" sx={{ mb: 0.75, fontSize: "0.78rem", fontWeight: 500, color: "text.primary" }}>
											Contenido (opcional)
										</InputLabel>
										<InputField
											name="content"
											id="content"
											placeholder="Escribí el contenido de la nota"
											multiline
											rows={6}
											disabled={isSubmitting}
											fullWidth
										/>
									</div>
								</Stack>
							</DialogContent>

							<DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
								<Button
									onClick={handleClose}
									disabled={isSubmitting}
									sx={{
										textTransform: "none",
										fontWeight: 600,
										letterSpacing: "-0.005em",
										color: "text.secondary",
										borderRadius: 1.25,
										px: 2,
										py: 0.875,
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
									type="submit"
									variant="contained"
									disabled={isSubmitting}
									sx={{
										textTransform: "none",
										fontWeight: 600,
										letterSpacing: "-0.005em",
										bgcolor: BRAND_BLUE,
										color: "#fff",
										borderRadius: 1.25,
										px: 2,
										py: 0.875,
										boxShadow: "none",
										"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
									}}
								>
									{isSubmitting ? "Guardando…" : isEditMode ? "Actualizar nota" : "Crear nota"}
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
