import {
	Dialog,
	DialogTitle,
	Divider,
	Button,
	Stack,
	DialogContent,
	Typography,
	DialogActions,
	Zoom,
	useTheme,
	InputLabel,
} from "@mui/material";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import SelectField from "components/UI/SelectField";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import { Link1, TableDocument } from "iconsax-react";
import { dispatch, useSelector } from "store";
import { addMovement, updateMovement } from "store/reducers/movements";
import { Movement } from "types/movements";
import { enqueueSnackbar } from "notistack";
import { format, parseISO, isValid } from "date-fns";
// types
import { MovementsModalType } from "types/movements";

const ModalMovements = ({ open, setOpen, folderId, folderName = "", editMode = false, movementData = null }: MovementsModalType) => {
	const theme = useTheme();
	const auth = useSelector((state) => state.auth);
	const userId = auth.user?._id;

	function closeTaskModal() {
		setOpen(false);
	}

	// Función para convertir fechas al formato DD/MM/YYYY para el formulario
	const formatDateForForm = (dateString: string | undefined): string => {
		if (!dateString || dateString.trim() === "") {
			return "";
		}

		try {
			let parsedDate: Date;

			// Si ya está en formato DD/MM/YYYY, lo devolvemos tal cual
			if (dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
				return dateString;
			}

			// Si es formato ISO o incluye 'T' o '-'
			if (dateString.includes("T") || dateString.includes("-")) {
				parsedDate = parseISO(dateString);
				if (isValid(parsedDate)) {
					return format(parsedDate, "dd/MM/yyyy");
				}
			}

			// Si no pudimos parsear, devolvemos vacío
			return "";
		} catch {
			return "";
		}
	};

	const CustomerSchema = [
		Yup.object().shape({
			title: Yup.string().max(255).required("Campo requerido"),
			movement: Yup.string().max(255).required("Campo requerido"),
			dateExpiration: Yup.string()
				.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
					message: "El formato de fecha debe ser DD/MM/AAAA",
				})
				.test("dateExpiration-after-time", "La fecha de vencimiento debe ser posterior a la fecha de dictado", function (value) {
					if (!value) return true; // Si no hay fecha de vencimiento, es válido
					const { time } = this.parent;
					if (!time) return true; // Si no hay fecha de dictado, no podemos validar

					// Convertir las fechas DD/MM/YYYY a objetos Date
					const parseDate = (dateStr: string) => {
						const [day, month, year] = dateStr.split("/");
						return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
					};

					try {
						const dictadoDate = parseDate(time);
						const vencimientoDate = parseDate(value);
						return vencimientoDate > dictadoDate;
					} catch {
						return true; // Si hay error al parsear, dejamos que otras validaciones lo manejen
					}
				}),
			time: Yup.string()
				.required("La fecha es requerida")
				.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
					message: "El formato de fecha debe ser DD/MM/AAAA",
				})
				.test("time-not-future", "La fecha de dictado no puede ser mayor a la fecha actual", function (value) {
					if (!value) return true; // Si no hay fecha, otra validación lo manejará

					// Convertir la fecha DD/MM/YYYY a objeto Date
					const parseDate = (dateStr: string) => {
						const [day, month, year] = dateStr.split("/");
						return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
					};

					try {
						const dictadoDate = parseDate(value);
						const today = new Date();
						// Establecer la hora de hoy a 00:00:00 para comparar solo fechas
						today.setHours(0, 0, 0, 0);
						dictadoDate.setHours(0, 0, 0, 0);

						return dictadoDate <= today;
					} catch {
						return true; // Si hay error al parsear, dejamos que otras validaciones lo manejen
					}
				}),
		}),
	];

	const currentValidationSchema = CustomerSchema[0];

	type MovementFormValues = Omit<Movement, "_id">;

	const initialValues: MovementFormValues = {
		time: formatDateForForm(movementData?.time),
		dateExpiration: formatDateForForm(movementData?.dateExpiration),
		title: movementData?.title || "",
		description: movementData?.description || "",
		movement: movementData?.movement || "",
		link: movementData?.link || "",
		folderId: folderId,
		userId: userId || "",
	};

	async function _submitForm(values: any, actions: any) {
		try {
			actions.setSubmitting(true);

			const result =
				editMode && movementData?._id
					? await dispatch(updateMovement(movementData._id, { ...values, userId }))
					: await dispatch(addMovement({ ...values, userId }));

			if (result.success) {
				enqueueSnackbar(`Se ${editMode ? "actualizó" : "agregó"} correctamente`, {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
				actions.resetForm();
			} else {
				// Si hay un error, mostramos el mensaje de error
				enqueueSnackbar(result.error || `Error al ${editMode ? "actualizar" : "crear"} el movimiento`, {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
			}
		} catch (error) {
			// Manejo de errores inesperados

			enqueueSnackbar(`Error inesperado al ${editMode ? "actualizar" : "crear"} el movimiento`, {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 4000,
			});
		} finally {
			// Siempre finalizamos el estado de envío
			actions.setSubmitting(false);
		}
	}

	function _handleSubmit(values: any, actions: any) {
		_submitForm(values, actions);
		closeTaskModal();
		actions.resetForm();
	}
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

	return (
		<>
			<Dialog
				maxWidth="sm"
				open={open}
				PaperProps={{
					sx: {
						width: "600px",
						maxWidth: "600px",
						p: 0,
						borderRadius: 2,
						boxShadow: `0 2px 10px -2px ${theme.palette.divider}`,
					},
				}}
				sx={{
					"& .MuiBackdrop-root": {
						opacity: "0.5 !important",
					},
				}}
			>
				<Formik initialValues={initialValues} validationSchema={currentValidationSchema} onSubmit={_handleSubmit} enableReinitialize={true}>
					{({ isSubmitting, resetForm }) => (
						<Form autoComplete="off" noValidate>
							<>
								<DialogTitle
									sx={{
										bgcolor: theme.palette.primary.lighter,
										p: 3,
										borderBottom: `1px solid ${theme.palette.divider}`,
									}}
								>
									<Stack direction="row" justifyContent="space-between" alignItems="center">
										<Stack direction="row" alignItems="center" spacing={1}>
											<TableDocument size={24} color={theme.palette.primary.main} />
											<Typography
												variant="h5"
												sx={{
													color: theme.palette.primary.main,
													fontWeight: 600,
												}}
											>
												{editMode ? "Editar Movimiento" : "Agregar Movimiento"}
											</Typography>
										</Stack>
										<Typography
											color="textSecondary"
											variant="subtitle2"
											sx={{
												maxWidth: "30%",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											Carpeta: {folderName}
										</Typography>
									</Stack>
								</DialogTitle>

								<Divider />

								<DialogContent
									sx={{
										p: 3,
										display: "flex",
										flexDirection: "column",
										gap: 2, // Reducido de 3 a 2 para disminuir el espaciado general, como en ModalNotifications
									}}
								>
									{/* Título */}
									<Stack spacing={1}>
										<InputLabel htmlFor="title">Título del Movimiento</InputLabel>
										<InputField
											fullWidth
											placeholder="Título del Movimiento"
											id="title"
											name="title"
											InputProps={{
												startAdornment: <TableDocument size={16} style={{ marginRight: 8 }} />,
											}}
											sx={customInputStyles}
										/>
									</Stack>

									{/* Tipo de movimiento */}
									<Stack spacing={1}>
										<InputLabel htmlFor="movement">Tipo</InputLabel>
										<SelectField
											required={true}
											label="Seleccione tipo de Movimiento"
											data={["Evento", "Despacho", "Cédula", "Oficio", "Escrito-Actor", "Escrito-Demandado"]}
											name="movement"
											sx={{
												"& .MuiInputBase-root": {
													height: "39.91px",
													fontSize: 12,
												},
												"& .MuiSelect-select": {
													fontSize: 12,
												},
												"& .MuiInputLabel-root": {
													fontSize: 12,
												},
											}}
										/>
									</Stack>

									{/* Fecha */}
									<Stack spacing={1}>
										<InputLabel htmlFor="time">Fecha de Dictado</InputLabel>
										<DateInputField
											name="time"
											customInputStyles={{
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
											}}
										/>
									</Stack>

									{/* Vencimiento */}
									<Stack spacing={1}>
										<InputLabel htmlFor="dateExpiration">Fecha de Vencimiento</InputLabel>
										<DateInputField
											name="dateExpiration"
											customInputStyles={{
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
											}}
										/>
									</Stack>

									{/* Link */}
									<Stack spacing={1}>
										<InputLabel htmlFor="link">Link</InputLabel>
										<InputField
											fullWidth
											placeholder="Añada un link"
											id="link"
											name="link"
											InputProps={{
												startAdornment: <Link1 size={16} style={{ marginRight: 8 }} />,
											}}
											sx={customInputStyles}
										/>
									</Stack>

									{/* Descripción */}
									<Stack spacing={1}>
										<InputLabel htmlFor="description">Descripción</InputLabel>
										<InputField
											fullWidth
											id="description"
											multiline
											rows={2}
											placeholder="Ingrese una descripción"
											name="description"
											sx={{
												"& .MuiInputBase-input": {
													fontSize: 12,
												},
												"& textarea::placeholder": {
													color: "#000000",
													opacity: 0.6,
												},
											}}
										/>
									</Stack>
								</DialogContent>

								<Divider />

								<DialogActions
									sx={{
										p: 2.5,
										bgcolor: theme.palette.background.default,
										borderTop: `1px solid ${theme.palette.divider}`,
									}}
								>
									<Button
										color="error"
										onClick={() => {
											setOpen(false);
											resetForm();
										}}
									>
										Cancelar
									</Button>
									<Button type="submit" variant="contained" disabled={isSubmitting}>
										Guardar
									</Button>
								</DialogActions>
							</>
						</Form>
					)}
				</Formik>
			</Dialog>
		</>
	);
};

export default ModalMovements;
