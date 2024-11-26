import { Dispatch, SetStateAction } from "react";
import { dispatch, useSelector } from "store";
//import { addNotification } from "store/reducers/notifications";
import { Dialog, DialogTitle, Divider, Button, Grid, Stack, DialogContent, InputLabel, DialogActions, Box, Zoom } from "@mui/material";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import SelectField from "components/UI/SelectField";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { Notification1, ArrowForwardSquare } from "iconsax-react";
import PatternField from "components/UI/PatternField";
import { enqueueSnackbar } from "notistack";
import { addNotification, updateNotification } from "store/reducers/notifications";
import { NotificationType } from "types/notifications";

interface FormValues {
	date: string;
	title: string;
	notification: string;
	user: string;
	code: string;
	idCode: string;
	description: string;
	dateExpiration: string;
}

// Tipo para los datos de la notificación
interface NotificationData {
	_id?: string;
	folderId: string;
	time: string;
	title: string;
	dateExpiration: string;
	notification: string;
	userId: string;
	description: string;
	user: string;
	code: string;
	idCode: string;
}

interface ModalNotificationsProps {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	folderId?: string;
	editMode?: boolean;
	notificationData?: NotificationType | null;
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

const customTextareaStyles = {
	"& .MuiInputBase-input": {
		fontSize: 12,
	},
	"& textarea::placeholder": {
		color: "#000000",
		opacity: 0.6,
	},
};

const ModalNotifications: React.FC<ModalNotificationsProps> = ({
	open,
	setOpen,
	folderId = "",
	editMode = false,
	notificationData = null,
}) => {
	const auth = useSelector((state) => state.auth);
	const userId = auth.user?._id || "";

	console.log(editMode);

	function closeModal() {
		setOpen(false);
	}

	const validationSchema = Yup.object().shape({
		title: Yup.string().max(255).required("Campo requerido"),
		user: Yup.string().max(255).required("Campo requerido"),
		notification: Yup.string().max(255).required("Campo requerido"),
		date: Yup.string()
			.required("La fecha es requerida")
			.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			}),
		dateExpiration: Yup.string().matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
			message: "El formato de fecha debe ser DD/MM/AAAA",
		}),
	});

	const getInitialValues = (): FormValues => {
		if (editMode && notificationData) {
			return {
				date: notificationData.time || "",
				title: notificationData.title || "",
				notification: notificationData.notification || "",
				user: notificationData.user || "",
				code: notificationData.code || "",
				idCode: notificationData.idCode || "",
				description: notificationData.description || "", // Añadido el valor por defecto
				dateExpiration: notificationData.dateExpiration || "",
			};
		}

		return {
			date: "",
			title: "",
			notification: "",
			user: "",
			code: "",
			idCode: "",
			description: "",
			dateExpiration: "",
		};
	};

	const initialValues = getInitialValues();

	async function _submitForm(values: any, actions: any) {
		try {
			const notificationPayload: NotificationData = {
				folderId,
				time: values.date,
				title: values.title,
				dateExpiration: values.dateExpiration,
				notification: values.notification,
				userId,
				description: values.description,
				user: values.user,
				code: values.code,
				idCode: values.idCode,
			};

			const result =
				editMode && notificationData?._id
					? await dispatch(updateNotification(notificationData._id, notificationPayload))
					: await dispatch(addNotification(notificationPayload));

			if (result.success) {
				enqueueSnackbar(`Se ${editMode ? "actualizó" : "agregó"} correctamente`, {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
				closeModal();
				actions.resetForm();
			} else {
				enqueueSnackbar(result.error || `Error al ${editMode ? "actualizar" : "crear"} la notificación`, {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
			}
		} catch (error) {
			console.error("Error en _submitForm:", error);
			enqueueSnackbar(`Error inesperado al ${editMode ? "actualizar" : "crear"} la notificación`, {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 3000,
			});
		} finally {
			actions.setSubmitting(false);
		}
	}

	function _handleSubmit(values: any, actions: any) {
		_submitForm(values, actions);
	}

	return (
		<Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={_handleSubmit} enableReinitialize={true}>
			{({ isSubmitting, resetForm, values }) => {
				const handleClose = () => {
					closeModal();
					resetForm();
				};

				return (
					<Dialog
						maxWidth="sm"
						open={open}
						onClose={handleClose}
						sx={{ "& .MuiDialog-paper": { p: 0 }, "& .MuiBackdrop-root": { opacity: "0.5 !important" } }}
					>
						<DialogTitle>Agregar Notificación</DialogTitle>
						<Divider />
						<Form autoComplete="off" noValidate>
							<DialogContent sx={{ p: 2.5 }}>
								<Grid container spacing={3} justifyContent="center">
									<Grid item xs={12} md={8}>
										<Grid container spacing={3}>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="title">Título de la Notificación</InputLabel>
													<InputField
														fullWidth
														sx={customInputStyles}
														id="title"
														placeholder="Identifique la notificación"
														name="title"
														InputProps={{ startAdornment: <Notification1 /> }}
													/>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="notification">Tipo</InputLabel>
													<SelectField
														required={true}
														label="Seleccione tipo de notificación"
														data={["Cédula", "Carta Documento", "Telegrama", "Notarial"]}
														name="notification"
														style={{ maxHeight: "39.91px" }}
													/>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="user">Interviniente</InputLabel>
													<SelectField
														required={true}
														label="Seleccione responsable"
														data={["Actora", "Demandada", "Organismo"]}
														name="user"
														style={{ maxHeight: "39.91px" }}
													/>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="date">Fecha</InputLabel>
													<DateInputField name="date" customInputStyles={customInputStyles} />
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="dateExpiration">Vencimiento</InputLabel>
													<DateInputField name="dateExpiration" customInputStyles={customInputStyles} />
												</Stack>
											</Grid>
											{(values.notification === "Carta Documento" || values.notification === "Telegrama") && (
												<Grid item xs={12}>
													<Stack spacing={1.25}>
														<InputLabel htmlFor="code">Código de Seguimiento</InputLabel>
														<Box display="flex" alignItems="center">
															<SelectField
																required={true}
																data={[
																	"CC",
																	"CD",
																	"CL",
																	"CM",
																	"CO",
																	"CP",
																	"DE",
																	"DI",
																	"EC",
																	"EE",
																	"EO",
																	"EP",
																	"GC",
																	"GD",
																	"GE",
																	"GF",
																	"GO",
																	"GR",
																	"GS",
																	"HC",
																	"HE",
																	"HU",
																	"IN",
																	"IS",
																	"JP",
																	"ND",
																	"OL",
																	"PC",
																	"PP",
																	"RD",
																	"RE",
																	"RR",
																	"SD",
																	"SL",
																	"SP",
																	"SR",
																	"ST",
																	"TC",
																	"TL",
																	"UP",
																	"EE",
																	"CX",
																	"RR",
																	"XP",
																	"XX",
																	"XR",
																	"CU",
																	"SU",
																	"EU",
																	"PU",
																	"XU",
																]}
																name="idCode"
																style={{ maxHeight: "39.91px", marginRight: "10px" }}
																defaultValue={values.notification}
															/>
															<PatternField
																fullWidth
																format={"#########"}
																sx={customInputStyles}
																id="idCode"
																placeholder="Ingrese un código de seguimiento"
																name="idCode"
																InputProps={{ startAdornment: <ArrowForwardSquare /> }}
															/>
														</Box>
													</Stack>
												</Grid>
											)}
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
										<Stack direction="row" spacing={2} alignItems="right">
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

export default ModalNotifications;
