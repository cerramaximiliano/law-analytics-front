import React from "react";
import { dispatch, useSelector } from "store";
import { DialogTitle, Button, Stack, DialogContent, DialogActions, Box, Zoom, useTheme, Typography, InputLabel } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import SelectField from "components/UI/SelectField";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import { Notification1, ArrowForwardSquare } from "iconsax-react";
import PatternField from "components/UI/PatternField";
import { enqueueSnackbar } from "notistack";
import { addNotification, updateNotification } from "store/reducers/notifications";
import { BRAND_BLUE } from "themes/dashboardTokens";
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
	const isDark = theme.palette.mode === "dark";
	const auth = useSelector((state) => state.auth);
	const userId = auth.user?._id || "";

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
			<ResponsiveDialog
				maxWidth="sm"
				fullWidth
				open={open}
				scroll="paper"
				PaperProps={{
					sx: {
						maxHeight: "90vh",
						display: "flex",
						flexDirection: "column",
						p: 0,
						borderRadius: 2,
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
						boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
						overflow: "hidden",
					},
				}}
				sx={{ "& .MuiBackdrop-root": { opacity: "0.5 !important" } }}
			>
				<Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={_handleSubmit} enableReinitialize={true}>
					{({ isSubmitting, resetForm, values }) => (
						<Form autoComplete="off" noValidate style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
							<DialogTitle
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1.25,
									px: 2.5,
									py: 1.75,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
									borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
									flexShrink: 0,
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
									<Notification1 size={18} variant="Bulk" />
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
											{editMode ? "Editar" : "Nueva"}
										</Typography>
									</Stack>
									<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
										{editMode ? "Editar notificación" : "Agregar notificación"}
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
										{folderName}
									</Typography>
								</Stack>
							</DialogTitle>

							<DialogContent
								sx={{
									p: 3,
									display: "flex",
									flexDirection: "column",
									gap: 2, // Reducido de 3 a 2 para disminuir el espaciado general
									overflowY: "auto",
									flex: 1,
									minHeight: 0,
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

							<DialogActions
								sx={{
									px: 2.5,
									py: 1.75,
									borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
									flexShrink: 0,
								}}
							>
								<Button
									onClick={() => {
										closeModal();
										resetForm();
									}}
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
									Guardar
								</Button>
							</DialogActions>
						</Form>
					)}
				</Formik>
			</ResponsiveDialog>
		</>
	);
};

export default ModalNotifications;
