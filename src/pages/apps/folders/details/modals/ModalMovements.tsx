import React from "react";
import { Box, DialogTitle, Button, Stack, DialogContent, Typography, DialogActions, Zoom, useTheme, InputLabel, Grid } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
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
import dayjs from "utils/dayjs-config";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE } from "themes/dashboardTokens";
// types
import { MovementsModalType } from "types/movements";

const ModalMovements = ({
	open,
	setOpen,
	folderId,
	folderName = "",
	editMode = false,
	movementData = null,
	onSuccess,
	dialogSx,
}: MovementsModalType) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const auth = useSelector((state) => state.auth);
	const userId = auth.user?._id;
	const { getRequestHeaders } = useTeam();

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
				parsedDate = dayjs(dateString).toDate();
				if (dayjs(parsedDate).isValid()) {
					return dayjs(parsedDate).format("DD/MM/YYYY");
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

	async function _submitForm(values: any, actions: any): Promise<boolean> {
		try {
			actions.setSubmitting(true);

			const result =
				editMode && movementData?._id
					? await dispatch(updateMovement(movementData._id, { ...values, userId }))
					: await dispatch(addMovement({ ...values, userId }, { headers: getRequestHeaders() }));

			if (result.success) {
				enqueueSnackbar(`Se ${editMode ? "actualizó" : "agregó"} correctamente`, {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
				actions.resetForm();
				// Para agregar, refrescar datos para que aparezca en la posición correcta
				// Para editar, el updateMovement ya actualizó el estado local en Redux
				if (!editMode) {
					onSuccess?.();
				}
				return true;
			} else {
				// Si hay un error, mostramos el mensaje de error
				enqueueSnackbar(result.error || `Error al ${editMode ? "actualizar" : "crear"} el movimiento`, {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
				return false;
			}
		} catch (error) {
			// Manejo de errores inesperados
			enqueueSnackbar(`Error inesperado al ${editMode ? "actualizar" : "crear"} el movimiento`, {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 4000,
			});
			return false;
		} finally {
			// Siempre finalizamos el estado de envío
			actions.setSubmitting(false);
		}
	}

	async function _handleSubmit(values: any, actions: any) {
		const result = await _submitForm(values, actions);
		if (result) {
			closeTaskModal();
		}
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
				sx={{
					...(dialogSx || {}),
					"& .MuiBackdrop-root": {
						opacity: "0.5 !important",
					},
				}}
				PaperProps={{
					sx: {
						p: 0,
						borderRadius: 2,
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
						boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
						display: "flex",
						flexDirection: "column",
						maxHeight: "90vh",
						overflow: "hidden",
					},
				}}
			>
				<Formik initialValues={initialValues} validationSchema={currentValidationSchema} onSubmit={_handleSubmit} enableReinitialize={true}>
					{({ isSubmitting, resetForm }) => (
						<>
							<DialogTitle
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
									<TableDocument size={18} variant="Bulk" />
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
											{editMode ? "Editar" : "Nuevo"}
										</Typography>
									</Stack>
									<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
										{editMode ? "Editar movimiento" : "Agregar movimiento"}
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

							<Form autoComplete="off" noValidate style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
								<DialogContent
									dividers
									sx={{
										p: 3,
										overflowY: "auto",
									}}
								>
									<Grid container spacing={2}>
										{/* Título - Media columna */}
										<Grid item xs={12} sm={6}>
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
										</Grid>

										{/* Tipo de movimiento - Media columna */}
										<Grid item xs={12} sm={6}>
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
										</Grid>

										{/* Fecha de Dictado - Media columna */}
										<Grid item xs={12} sm={6}>
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
										</Grid>

										{/* Fecha de Vencimiento - Media columna */}
										<Grid item xs={12} sm={6}>
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
										</Grid>

										{/* Link - Ancho completo */}
										<Grid item xs={12}>
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
										</Grid>

										{/* Descripción - Ancho completo */}
										<Grid item xs={12}>
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
										</Grid>
									</Grid>
								</DialogContent>

								<DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
									<Button
										onClick={() => {
											setOpen(false);
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
						</>
					)}
				</Formik>
			</ResponsiveDialog>
		</>
	);
};

export default ModalMovements;
