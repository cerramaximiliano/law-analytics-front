import { dispatch, useSelector } from "store";
import {
	Dialog,
	DialogTitle,
	Divider,
	Button,
	Stack,
	DialogContent,
	DialogActions,
	Box,
	Zoom,
	useTheme,
	Typography,
	InputLabel,
} from "@mui/material";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import SelectField from "components/UI/SelectField";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import { Notification1, ArrowForwardSquare } from "iconsax-react";
import PatternField from "components/UI/PatternField";
import { enqueueSnackbar } from "notistack";
import { addNotification, updateNotification } from "store/reducers/notifications";
// types
import { ModalNotificationsProps, FormValues, NotificationData } from "types/notifications";

const ModalNotifications: React.FC<ModalNotificationsProps> = ({
	open,
	setOpen,
	folderId = "",
	editMode = false,
	notificationData = null,
	folderName = "",
}) => {
	const theme = useTheme();
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
					"& .MuiBackdrop-root": { opacity: "0.5 !important" },
				}}
			>
				<Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={_handleSubmit} enableReinitialize={true}>
					{({ isSubmitting, resetForm, values }) => (
						<Form autoComplete="off" noValidate>
							<DialogTitle
								sx={{
									bgcolor: theme.palette.primary.lighter,
									p: 3,
									borderBottom: `1px solid ${theme.palette.divider}`,
								}}
							>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Stack direction="row" alignItems="center" spacing={1}>
										<Notification1 size={24} color={theme.palette.primary.main} />
										<Typography
											variant="h5"
											sx={{
												color: theme.palette.primary.main,
												fontWeight: 600,
											}}
										>
											Agregar Notificación
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
									gap: 2, // Reducido de 3 a 2 para disminuir el espaciado general
								}}
							>
								{/* Título */}
								<Stack spacing={1}>
									<InputLabel htmlFor="title">Identifique la notificación</InputLabel>
									<InputField
										fullWidth
										id="title"
										placeholder="Indique una identificación"
										name="title"
										startAdornment={<Notification1 />}
										sx={customInputStyles}
									/>
								</Stack>

								{/* Tipo de notificación */}
								<Stack spacing={1}>
									<InputLabel htmlFor="notification">Tipo</InputLabel>
									<SelectField
										required={true}
										label="Tipo de Notificación"
										name="notification"
										data={["Cédula", "Carta Documento", "Telegrama", "Notarial"]}
										style={{
											maxHeight: "39.91px",
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

								{/* Interviniente */}
								<Stack spacing={1}>
									<InputLabel htmlFor="user">Interviniente</InputLabel>
									<SelectField
										required={true}
										name="user"
										label="Selección interviniente"
										data={["Actora", "Demandada", "Organismo"]}
										style={{
											maxHeight: "39.91px",
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
									<InputLabel htmlFor="date">Fecha de Notificación</InputLabel>
									<DateInputField
										name="date"
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

								{/* Código de seguimiento (condicional) */}
								{(values.notification === "Carta Documento" || values.notification === "Telegrama") && (
									<Stack spacing={1}>
										<InputLabel htmlFor="idCode">Código de Seguimiento</InputLabel>
										<Box display="flex" alignItems="center" gap={2}>
											<SelectField
												required={true}
												name="code"
												label="Código de Seguimiento"
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
												style={{
													maxHeight: "39.91px",
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
												defaultValue={values.notification}
											/>
											<PatternField
												fullWidth
												format={"#########"}
												sx={{
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
												id="idCode"
												placeholder="Ingrese un código de seguimiento"
												name="idCode"
												InputProps={{ startAdornment: <ArrowForwardSquare /> }}
											/>
										</Box>
									</Stack>
								)}

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
										customInputStyles={{
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
										closeModal();
										resetForm();
									}}
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									variant="contained"
									disabled={isSubmitting}
									sx={{
										minWidth: 120,
										py: 1.25,
										fontWeight: 600,
									}}
								>
									Guardar
								</Button>
							</DialogActions>
						</Form>
					)}
				</Formik>
			</Dialog>
		</>
	);
};

export default ModalNotifications;
