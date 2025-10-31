import React from "react";
import { DialogTitle, Divider, Button, Stack, DialogContent, DialogActions, Zoom, useTheme, Typography, InputLabel } from "@mui/material";
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
	const auth = useSelector((state) => state.auth);

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
			const calculatorData = {
				type: values.type,
				user: values.user,
				userId: auth.user?._id,
				amount: Number(values.amount),
				folderId: folderId,
				date: values.date,
				description: values.description,
				...(auth.user?.groupId && { groupId: auth.user.groupId }),
			};

			const result = await dispatch(addCalculator(calculatorData));

			if (folderId) {
				await dispatch(getCalculatorsByFolderId(folderId));
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
						boxShadow: `0 2px 10px -2px ${theme.palette.divider}`,
						display: "flex",
						flexDirection: "column",
						maxHeight: "90vh",
					},
				}}
			>
				<Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
					{({ isSubmitting, resetForm }) => (
						<>
							<DialogTitle
								sx={{
									bgcolor: theme.palette.primary.lighter,
									p: 3,
									borderBottom: `1px solid ${theme.palette.divider}`,
								}}
							>
								<Stack spacing={1}>
									<Stack direction="row" alignItems="center" spacing={1}>
										<Moneys size={24} color={theme.palette.primary.main} variant="Bold" />
										<Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
											Agregar Montos de Reclamo y Ofrecimientos
										</Typography>
									</Stack>
									<Typography variant="body2" color="textSecondary">
										Agrega montos de reclamo y ofrecimientos a la carpeta "{folderName}"
									</Typography>
								</Stack>
							</DialogTitle>

							<Form autoComplete="off" noValidate style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
								<DialogContent dividers sx={{ p: 2, overflowY: "auto" }}>
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
										p: 2,
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
							</Form>
						</>
					)}
				</Formik>
			</ResponsiveDialog>
		</>
	);
};

export default ModalCalcData;
