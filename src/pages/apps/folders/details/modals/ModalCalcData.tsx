import React from "react";
import { Box, DialogTitle, Button, Stack, DialogContent, DialogActions, Zoom, useTheme, Typography, InputLabel } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import NumberField from "components/UI/NumberField";
import SelectField from "components/UI/SelectField";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import { addCalculator, getCalculatorsByFolderId } from "store/reducers/calculator";
import { dispatch, useSelector } from "store";
import { enqueueSnackbar } from "notistack";
import { ModalCalcType } from "types/calculator";
import { Moneys } from "iconsax-react";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE } from "themes/dashboardTokens";

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

const ModalCalcData = ({ open, setOpen, handlerAddress, folderId, folderName }: ModalCalcType) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const auth = useSelector((state) => state.auth);
	const { getRequestHeaders, activeTeam, isTeamMode } = useTeam();

	const validationSchema = Yup.object().shape({
		type: Yup.string().required("Campo requerido"),
		user: Yup.string().required("Campo requerido"),
		amount: Yup.string().required("Campo requerido"),
		date: Yup.string()
			.required("La fecha es requerida")
			.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			}),
		description: Yup.string(),
	});

	const initialValues = {
		type: "",
		user: "",
		date: "",
		amount: "",
		description: "",
		folderId: folderId,
	};

	const handleSubmit = async (values: any, actions: any) => {
		try {
			// Obtener groupId del equipo activo si estamos en modo equipo
			const groupId = isTeamMode ? activeTeam?._id : undefined;

			const calculatorData = {
				type: values.type,
				user: values.user,
				userId: auth.user?._id,
				amount: Number(values.amount),
				folderId: folderId,
				date: values.date,
				description: values.description,
				...(groupId && { groupId }),
			};

			const result = await dispatch(addCalculator(calculatorData, { headers: getRequestHeaders() }));

			if (folderId) {
				await dispatch(getCalculatorsByFolderId(folderId, groupId, true));
			}

			if (result.success) {
				enqueueSnackbar("Elemento agregado correctamente.", {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});

				if (handlerAddress) {
					handlerAddress(result.calculator);
				}

				setOpen(false);
				actions.resetForm();
			} else {
				enqueueSnackbar("Ha ocurrido un error al guardar el elemento.", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
			}
		} catch (error) {
			enqueueSnackbar("Error al guardar el elemento.", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 3000,
			});
		} finally {
			actions.setSubmitting(false);
		}
	};

	return (
		<>
			<ResponsiveDialog
				maxWidth="sm"
				fullWidth
				open={open}
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
				<Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
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
									<Moneys size={18} variant="Bulk" />
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
											Nuevo registro
										</Typography>
									</Stack>
									<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
										Agregar montos de reclamo y ofrecimientos
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
										Agregás un nuevo monto a "{folderName}"
									</Typography>
								</Stack>
							</DialogTitle>

							<Form autoComplete="off" noValidate style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
								<DialogContent sx={{ p: 2.5, overflowY: "auto" }}>
									<Stack spacing={2}>
										<Stack spacing={1}>
											<InputLabel htmlFor="type" sx={{ fontSize: 13 }}>
												Tipo
											</InputLabel>
											<SelectField
												label="Seleccione un tipo"
												data={["Reclamado", "Ofertado"]}
												id="type"
												name="type"
												style={{ maxHeight: "39.91px" }}
											/>
										</Stack>
										<Stack spacing={1}>
											<InputLabel htmlFor="user" sx={{ fontSize: 13 }}>
												Parte
											</InputLabel>
											<SelectField
												label="Seleccione una parte"
												data={["Actora", "Demandada"]}
												id="user"
												name="user"
												style={{ maxHeight: "39.91px" }}
											/>
										</Stack>

										<Stack spacing={1}>
											<InputLabel htmlFor="amount" sx={{ fontSize: 13 }}>
												Monto
											</InputLabel>
											<NumberField
												thousandSeparator={","}
												allowNegative={false}
												allowLeadingZeros={false}
												sx={customInputStyles}
												decimalScale={2}
												fullWidth
												placeholder="00.00"
												name="amount"
												id="amount"
												InputProps={{ startAdornment: "$" }}
											/>
										</Stack>

										<Stack spacing={1}>
											<InputLabel htmlFor="date" sx={{ fontSize: 13 }}>
												Fecha
											</InputLabel>
											<DateInputField name="date" id="date" label="Fecha" customInputStyles={customInputStyles} />
										</Stack>

										<Stack spacing={1}>
											<InputLabel htmlFor="description" sx={{ fontSize: 13 }}>
												Descripción
											</InputLabel>
											<InputField
												fullWidth
												multiline
												rows={2}
												placeholder="Ingrese una descripción"
												name="description"
												id="description"
												sx={customTextareaStyles}
											/>
										</Stack>
									</Stack>
								</DialogContent>

								<DialogActions
									sx={{
										px: 2.5,
										py: 1.75,
										borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
									}}
								>
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

export default ModalCalcData;
