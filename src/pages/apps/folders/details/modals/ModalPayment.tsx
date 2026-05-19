import React from "react";
import { Box, DialogTitle, Button, Grid, Stack, DialogContent, InputLabel, DialogActions, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import SelectField from "components/UI/SelectField";
import NumberField from "components/UI/NumberField";
import { Dispatch, SetStateAction } from "react";
import * as Yup from "yup";
import { Form, Formik, FormikValues } from "formik";
import { DollarCircle } from "iconsax-react";
import { BRAND_BLUE } from "themes/dashboardTokens";

type AddressModalType = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	handlerAddress?: (task: any) => void;
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

const ModalPayment = ({ open, setOpen, handlerAddress, folderId }: AddressModalType) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	function closeTaskModal() {
		setOpen(false);
	}

	const CustomerSchema = Yup.object().shape({
		name: Yup.string().max(255).required("La categoría es requerida"),
		type: Yup.string().max(255).required("El tipo es requerido"),
		amount: Yup.number()
			.typeError("El monto debe ser un número")
			.required("El monto es requerido")
			.test("greaterThanZero", "El monto debe ser mayor a 0", (value) => value > 0),
		date: Yup.string()
			.required("La fecha es requerida")
			.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			}),
	});

	const getInitialValues = (folderId: FormikValues | null) => {
		return {
			date: "",
			name: "",
			type: "",
			amount: null,
			folderId: folderId,
		};
	};

	const initialValues = getInitialValues(folderId);

	async function _submitForm(values: any, actions: any) {
		alert(JSON.stringify(values, null, 2));
		if (handlerAddress) {
			handlerAddress({ ...values }); // assuming id is generated here
		}
		actions.setSubmitting(false);
		closeTaskModal();
		actions.resetForm();
	}

	function _handleSubmit(values: any, actions: any) {
		_submitForm(values, actions);
	}

	return (
		<Formik initialValues={initialValues} validationSchema={CustomerSchema} onSubmit={_handleSubmit}>
			{({ isSubmitting, resetForm }) => {
				const handleClose = () => {
					closeTaskModal();
					resetForm();
				};

				return (
					<ResponsiveDialog
						maxWidth="sm"
						open={open}
						onClose={handleClose}
						sx={{ "& .MuiDialog-paper": { p: 0 }, "& .MuiBackdrop-root": { opacity: "0.5 !important" } }}
						PaperProps={{
							sx: {
								borderRadius: 2,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
								boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
								overflow: "hidden",
							},
						}}
					>
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
								<DollarCircle size={18} variant="Bulk" />
							</Box>
							<Stack spacing={0.125}>
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
										Nueva
									</Typography>
								</Stack>
								<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
									Agregar facturación
								</Typography>
							</Stack>
						</DialogTitle>
						<Form autoComplete="off" noValidate>
							<DialogContent sx={{ p: 2.5 }}>
								<Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} justifyContent="center">
									<Grid item xs={12} md={8}>
										<Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="name">Categoría</InputLabel>
													<SelectField
														required={true}
														label="Seleccione una categoría"
														data={["Honorarios", "Cuota-litis", "Gastos"]}
														name="name"
														style={{ maxHeight: "39.91px" }}
													/>
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="type">Tipo</InputLabel>
													<SelectField
														required={true}
														label="Seleccione una categoría"
														data={["Ingreso", "Egreso"]}
														name="type"
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
													<InputLabel htmlFor="amount">Saldo</InputLabel>
													<NumberField
														thousandSeparator={","}
														allowNegative={false}
														allowLeadingZeros={false}
														sx={customTextareaStyles}
														decimalScale={2}
														fullWidth
														placeholder="00.00"
														name="amount"
														InputProps={{ startAdornment: "$" }}
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
							<DialogActions
								sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}
							>
								<Button
									onClick={handleClose}
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
					</ResponsiveDialog>
				);
			}}
		</Formik>
	);
};

export default ModalPayment;
