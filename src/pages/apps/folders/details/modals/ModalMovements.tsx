import { Dialog, DialogTitle, Divider, Button, Grid, Stack, DialogContent, InputLabel, DialogActions, Zoom } from "@mui/material";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import SelectField from "components/UI/SelectField";
import { Dispatch, SetStateAction } from "react";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { Link1, TableDocument } from "iconsax-react";
import { dispatch, useSelector } from "store";
import { addMovement } from "store/reducers/movements";
import { Movement } from "types/movements";
import { enqueueSnackbar } from "notistack";

type AddressModalType = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	folderId: any;
};

const customInputStyles = {
	"& .MuiInputBase-root": {
		height: 39.91,
	},
	"& .MuiInputBase-input": {
		fontSize: 12,
	},
	"& input::placeholder": {
		color: "#000000",
		opacity: 0.6,
	},
};

const customTextareaStyles = {
	"& .MuiInputBase-input": {
		fontSize: 12,
	},
	"& textarea::placeholder": {
		color: "#000000",
		opacity: 0.6,
	},
};

const ModalMovements = ({ open, setOpen, folderId }: AddressModalType) => {
	const auth = useSelector((state) => state.auth);
	const userId = auth.user?._id;

	function closeTaskModal() {
		setOpen(false);
	}

	const CustomerSchema = [
		Yup.object().shape({
			title: Yup.string().max(255).required("Campo requerido"),
			movement: Yup.string().max(255).required("Campo requerido"),
			dateExpiration: Yup.string().matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			}),
			time: Yup.string()
				.required("La fecha es requerida")
				.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
					message: "El formato de fecha debe ser DD/MM/AAAA",
				}),
		}),
	];

	const currentValidationSchema = CustomerSchema[0];

	type MovementFormValues = Omit<Movement, '_id'>;

	const initialValues: MovementFormValues = {
		time: "",
		dateExpiration: "",
		title: "",
		description: "",
		movement: "",
		link: "",
		folderId: folderId,
		userId: "", // Asegúrate de asignar un userId por defecto o real
	};

	async function _submitForm(values: any, actions: any) {
		try {
			actions.setSubmitting(true);

			const result = await dispatch(
				addMovement({
					...values,
					userId: userId,
				}),
			);

			if (result.success) {
				enqueueSnackbar("Se agregó correctamente", {
					variant: "success",
					anchorOrigin: {
						vertical: "bottom",
						horizontal: "right",
					},
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});

				// Opcional: puedes usar el movement retornado si lo necesitas
				// const newMovement = result.movement;

				// Aquí podrías hacer algo adicional con el resultado exitoso
				// Como cerrar un modal, limpiar el formulario, etc.
				actions.resetForm();
			} else {
				// Si hay un error, mostramos el mensaje de error
				enqueueSnackbar(result.error || "Error al crear el movimiento", {
					variant: "error",
					anchorOrigin: {
						vertical: "bottom",
						horizontal: "right",
					},
					TransitionComponent: Zoom,
					autoHideDuration: 4000,
				});
			}
		} catch (error) {
			// Manejo de errores inesperados
			console.error("Error en _submitForm:", error);
			enqueueSnackbar("Error inesperado al crear el movimiento", {
				variant: "error",
				anchorOrigin: {
					vertical: "bottom",
					horizontal: "right",
				},
				TransitionComponent: Zoom,
				autoHideDuration: 4000,
			});
		} finally {
			// Siempre finalizamos el estado de envío
			actions.setSubmitting(false);
		}
	}

	function _handleSubmit(values: any, actions: any) {
		console.log("submit", values, actions);
		_submitForm(values, actions);
		closeTaskModal();
		actions.resetForm();
	}

	return (
		<Formik initialValues={initialValues} validationSchema={currentValidationSchema} onSubmit={_handleSubmit}>
			{({ isSubmitting, resetForm }) => {
				const handleClose = () => {
					closeTaskModal();
					resetForm();
				};

				return (
					<Dialog
						maxWidth="sm"
						open={open}
						onClose={handleClose}
						sx={{ "& .MuiDialog-paper": { p: 0 }, "& .MuiBackdrop-root": { opacity: "0.5 !important" } }}
					>
						<DialogTitle>Agregar Movimiento</DialogTitle>
						<Divider />
						<Form autoComplete="off" noValidate>
							<DialogContent sx={{ p: 2.5 }}>
								<Grid container spacing={3} justifyContent="center">
									<Grid item xs={12} md={8}>
										<Grid container spacing={3}>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="title">Título del Movimiento</InputLabel>
													<InputField
														fullWidth
														sx={customInputStyles}
														id="title"
														placeholder="Identifique un movimiento"
														name="title"
														InputProps={{ startAdornment: <TableDocument /> }}
													/>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="movement">Tipo</InputLabel>
													<SelectField
														required={true}
														label="Seleccione un tipo"
														data={["Evento", "Despacho", "Cédula", "Oficio", "Escrito-Actor", "Escrito-Demandado"]}
														name="movement"
														style={{ maxHeight: "39.91px" }}
													/>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="time">Fecha</InputLabel>
													<DateInputField name="time" customInputStyles={customInputStyles} />
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="dateExpiration">Vencimiento</InputLabel>
													<DateInputField name="dateExpiration" customInputStyles={customInputStyles} />
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="link">Link</InputLabel>
													<InputField
														fullWidth
														sx={customInputStyles}
														id="link"
														placeholder="Añada un link"
														name="link"
														InputProps={{ startAdornment: <Link1 /> }}
													/>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="description">Descripción</InputLabel>
													<InputField
														fullWidth
														sx={customTextareaStyles}
														id="description"
														multiline
														rows={2}
														placeholder="Ingrese una descripción"
														name="description"
													/>
												</Stack>
											</Grid>
										</Grid>
									</Grid>
								</Grid>
							</DialogContent>
							<Divider />
							<DialogActions sx={{ p: 2.5 }}>
								<Grid container justifyContent="right" alignItems="right">
									<Grid item>
										<Stack direction="row" spacing={2} alignItems="rigth">
											<Button color="error" onClick={handleClose}>
												Cancelar
											</Button>
											<Button type="submit" variant="contained" disabled={isSubmitting}>
												Guardar
											</Button>
										</Stack>
									</Grid>
								</Grid>
							</DialogActions>
						</Form>
					</Dialog>
				);
			}}
		</Formik>
	);
};

export default ModalMovements;
