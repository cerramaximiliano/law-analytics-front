import { Dispatch, SetStateAction } from "react";
import { dispatch, useSelector } from "store";
import { Dialog, DialogTitle, Divider, Button, Stack, DialogContent, DialogActions, Box, Zoom, useTheme, Typography } from "@mui/material";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import SelectField from "components/UI/SelectField";
import * as Yup from "yup";
import { Formik } from "formik";
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
	folderName?: string;
}

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

	const truncatedFolderName = folderName.length > 20 ? `${folderName.slice(0, 20)}...` : folderName;
	const folderNameLines = truncatedFolderName.split(" ").reduce(
		(lines, word, index) => {
			const currentLine = lines[lines.length - 1];
			if (currentLine && currentLine.length + word.length <= 25) {
				lines[lines.length - 1] = `${currentLine} ${word}`;
			} else {
				lines.push(word);
			}
			return lines;
		},
		["", ""],
	);

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
						<DialogTitle
							sx={{
								bgcolor: theme.palette.primary.lighter,
								p: 3,
								borderBottom: `1px solid ${theme.palette.divider}`,
							}}
						>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
									Agregar Notificación
								</Typography>
								<Typography color="textSecondary" variant="subtitle2">
									Carpeta: {folderNameLines}
								</Typography>
							</Stack>
						</DialogTitle>

						<Divider />

						<DialogContent
							sx={{
								p: 3,
								display: "flex",
								flexDirection: "column",
								gap: 3,
							}}
						>
							<InputField
								fullWidth
								label="Título de la Notificación"
								id="title"
								placeholder="Identifique la notificación"
								name="title"
								startAdornment={<Notification1 />}
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
							<SelectField
								required={true}
								label="Tipo"
								data={["Cédula", "Carta Documento", "Telegrama", "Notarial"]}
								name="notification"
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
							<SelectField
								required={true}
								label="Interviniente"
								data={["Actora", "Demandada", "Organismo"]}
								name="user"
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
							<DateInputField
								name="date"
								label="Fecha"
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
							<DateInputField
								name="dateExpiration"
								label="Vencimiento"
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
							{(values.notification === "Carta Documento" || values.notification === "Telegrama") && (
								<Box display="flex" alignItems="center" gap={2}>
									<SelectField
										required={true}
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
										name="idCode"
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
							)}
							<InputField
								fullWidth
								label="Descripción"
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
								color="inherit"
								onClick={handleClose}
								sx={{
									color: theme.palette.text.secondary,
									"&:hover": {
										bgcolor: theme.palette.action.hover,
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
									minWidth: 120,
									py: 1.25,
									fontWeight: 600,
								}}
							>
								Guardar
							</Button>
						</DialogActions>
					</Dialog>
				);
			}}
		</Formik>
	);
};

export default ModalNotifications;
